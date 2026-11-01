// The engine's boot and continuous loop. argv[2] is the config path. The
// engine runs one dispatch at a time, queues the rest, and speaks
// JSON-lines over stdio. The loopback control endpoint is where the
// handoff tool and the interactive agent's tools reach the queue.

import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { DISPATCHER_TARGET, loadConfig, handoffTarget, handoffLabels, handoffToolsStale, configSummary, graphInfoResponse } from "./config.mjs";
import { handoffLabelsMatch, handoffMessageError, handoffPreflightError, handoffToolState, handoffVisibilityFailure } from "./visibility.mjs";
import { resumeHistoryEvent, selectResumeOrigin } from "./resume.mjs";
import { claimHandoff, handoffOutput } from "./handoff.mjs";
import { resolveDispatchTarget, validateDispatchOptions, workflowEscape } from "./workflow.mjs";
import { createDispatchQueue } from "./queue.mjs";
import { runDispatch, checkOutput, DispatchDefect, emptyUsage } from "./executor.mjs";
import { createDriver } from "./driver.mjs";
import { startControlServer, ControlError } from "./control.mjs";
import { installPlugin, installSkills, removeCommands, removeAgent, preflightPlugin } from "./plugin.mjs";
import { renderGraphMapResponse, renderGraphArtifact } from "./map.mjs";
import { dispatchStatusBody, renderDispatchDisplay } from "./display.mjs";
import { getActivityHistory, workflowForEvent } from "./history.mjs";
import { encode, decode } from "./stdio.mjs";

const say = (kind, payload = {}) => process.stdout.write(encode(kind, payload) + "\n");
const log = (...parts) => process.stderr.write(parts.join(" ") + "\n");
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const ENGINE_VERSION = "1.3.0";

const configArg = process.argv[2];
if (configArg === "--version") {
  process.stdout.write(`girth-agents v${ENGINE_VERSION}\n`);
  process.exit(0);
}
if (configArg === "--help") {
  process.stdout.write([
    "usage: node engine/engine.mjs [--version | --help | <config.json>]",
    "",
    "  <config.json>  run the engine against this graph config",
    "  --version      print the version and exit",
    "  --help         print this usage and exit",
    "",
  ].join("\n"));
  process.exit(0);
}
if (!configArg) {
  log("engine: no config path given");
  process.exit(2);
}
const configPath = resolve(configArg);
const cwd = process.cwd();

let config = null;
let driver = null;
let driverPromise = null;
let queue = null;
let control = null;
let lastEvent = null;
let lastDefect = null;
let handoffPreflight = null;
let handoffPreflightWaiters = [];
let bootHandoffLabels = [];
let configRevision = 0;
const history = getActivityHistory();
let stopping = false;
let heartbeat = null;

async function getDriver() {
  if (driver) return driver;
  if (!driverPromise) {
    driverPromise = createDriver()
      .then((created) => {
        driver = created;
        return created;
      })
      .catch((e) => {
        driverPromise = null;
        throw e;
      });
  }
  return driverPromise;
}

function event(kind, payload = {}) {
  const workflow = workflowForEvent(payload, (id) => (queue ? queue.status(id) : null));
  history.append(kind, payload, { workflow });
  lastEvent = { kind, ...payload };
  if (kind === "defect") lastDefect = payload;
  say(kind, payload);
}

function graphSummary() {
  return configSummary(config, configPath).graph;
}

function onHandoffPreflight(body) {
  const labels = Array.isArray(body?.labels)
    ? body.labels.filter((label) => typeof label === "string" && label.trim() !== "")
    : [];
  const collisions = Array.isArray(body?.collisions)
    ? body.collisions.filter((label) => typeof label === "string" && label.trim() !== "")
    : [];
  handoffPreflight = {
    labels,
    collisions,
    catalogAvailable: body?.catalogAvailable !== false,
    at: new Date().toISOString(),
  };
  if (
    typeof body?.sessionID === "string" &&
    queue?.active?.sessionId === body.sessionID &&
    collisions.length > 0
  ) {
    queue.active.handoffDefect = new DispatchDefect(
      "handoff.tool-collision",
      `handoff tool collision: ${collisions.join(", ")}`,
    );
  }
  for (const resolve of handoffPreflightWaiters.splice(0)) resolve();
  return { body: { ok: true } };
}

function onHandoffTools(body) {
  const active = queue?.active;
  try {
    return {
      body: {
        ok: true,
        ...handoffToolState({
          active,
          sessionID: body?.sessionID,
          revision: configRevision,
        }),
      },
    };
  } catch (e) {
    handoffVisibilityFailure(active, e, DispatchDefect);
    throw e;
  }
}

async function waitForHandoffPreflight(timeoutMs = 5000) {
  if (handoffPreflight) return handoffPreflight;
  await Promise.race([
    new Promise((resolve) => handoffPreflightWaiters.push(resolve)),
    sleep(timeoutMs),
  ]);
  return handoffPreflight;
}

async function onDispatch(body) {
  const preflight = await waitForHandoffPreflight();
  const preflightFault = handoffPreflightError(preflight);
  if (preflightFault) {
    throw new ControlError(409, `${preflightFault.code}: ${preflightFault.message}`);
  }
  if (!handoffLabelsMatch(preflight.labels, bootHandoffLabels)) {
    throw new ControlError(
      409,
      "handoff.tools-stale: the plugin label set does not match the boot config",
    );
  }
  let target;
  try {
    validateDispatchOptions(body);
    target = resolveDispatchTarget(config.graph, body);
  } catch (e) {
    throw new ControlError(400, e.message);
  }

  if (body.resume === true) {
    const selected = selectResumeOrigin(queue, body);
    if (selected.error) {
      throw new ControlError(409, `${selected.error.code}: ${selected.error.message}`);
    }
    const origin = selected.origin;
    event("handoff", resumeHistoryEvent(origin));
    const resumed = queue.enqueue({
      node: origin.node,
      prompt: body.prompt,
      workflow: origin.workflow ?? null,
      dispatchingSessionID: body.sessionID,
      resumeSessionId: origin.sessionId,
      resumeMessage: body.prompt,
      resumeBudgetMs: origin.remainingBudgetMs,
      resumeOriginDispatchId: origin.dispatchId,
    });
    return { body: dispatchStatusBody(queue.status(resumed.id)) };
  }

  const record = queue.enqueue({
    node: target.node,
    prompt: body.prompt,
    workflow: target.workflow,
    dispatchingSessionID: body.sessionID,
  });
  const snapshot = queue.status(record.id);
  return { body: dispatchStatusBody(snapshot) };
}

async function onDispatchStatus(body) {
  const id = body?.dispatchId ?? body?.id;
  if (typeof id !== "string" || id.trim() === "") throw new ControlError(400, "dispatch status needs a dispatch id");
  const status = queue.status(id);
  if (!status) throw new ControlError(404, `unknown dispatch '${id}'`);
  return { body: dispatchStatusBody(status) };
}

async function onDispatchWait(body) {
  const id = body?.dispatchId ?? body?.id;
  if (typeof id !== "string" || id.trim() === "") throw new ControlError(400, "dispatch wait needs a dispatch id");
  const timeoutMs = typeof body?.timeoutMs === "number" ? body.timeoutMs : 300000;
  const result = await queue.wait(id, timeoutMs);
  if (!result) throw new ControlError(404, `unknown dispatch '${id}'`);
  return { body: { ok: true, ...result, display: renderDispatchDisplay(result) } };
}

async function onDispatchCancel(body) {
  const id = body?.dispatchId ?? body?.id;
  if (typeof id !== "string" || id.trim() === "") throw new ControlError(400, "dispatch cancel needs a dispatch id");
  const result = await queue.cancel(id, {
    interrupt: async (sessionId) => {
      const live = await getDriver();
      await live.interrupt(sessionId);
    },
    deleteSession: async (sessionId) => {
      const live = await getDriver();
      await live.deleteSession(sessionId);
    },
  });
  if (!result) throw new ControlError(404, `unknown dispatch '${id}'`);
  return { body: { ok: true, ...result } };
}

async function onHandoff(body) {
  const active = queue.active;
  if (!active) throw new ControlError(403, "no active dispatch");
  if (typeof body?.sessionID !== "string" || body.sessionID !== active.sessionId) {
    throw new ControlError(403, "handoff session is not the active node");
  }
  const node = active.nodeDef;
  if (!node) throw new ControlError(403, "the active node is not ready for a handoff");
  if (node.handoff.mode === "terminal") throw new ControlError(422, "this terminal node takes no handoff");

  if (claimHandoff(active, node, DispatchDefect)) {
    throw new ControlError(409, "handoff already accepted");
  }
  try {
  const label = body.label;
  if (typeof label !== "string" || label.trim() === "") throw new ControlError(422, "handoff needs a non-empty label");
  const message = body.message;
  const messageFault = handoffMessageError(message);
  if (messageFault) throw new ControlError(422, `${messageFault}: invalid handoff message`);
  const target = handoffTarget(node, label);
  if (!target) {
    const allowed = node.handoff.mode === "unconditional" ? "next" : node.handoff.labels.map((entry) => entry.label).join(", ");
    throw new ControlError(422, `handoff.unknown-tool: label '${label}' is not declared for node '${node.id}' (allowed: ${allowed})`);
  }

  if (target !== DISPATCHER_TARGET) {
    const escape = workflowEscape(config.graph, active.workflow, target);
    if (escape) {
      active.handoffDefect = new DispatchDefect(
        escape.code,
        `handoff '${label}' from '${node.id}' to '${target}': ${escape.message}`,
      );
      throw new ControlError(422, active.handoffDefect.message);
    }
  }

  let output = null;
  if (active.outputPath) {
    try {
      output = await handoffOutput(active, checkOutput);
    } catch (e) {
      if (e instanceof DispatchDefect) throw new ControlError(422, e.message);
      throw e;
    }
  }

  active.handoff = {
    label,
    message,
    callID: body.callID ?? null,
    outputHash: output?.hash ?? null,
    outputPath: output?.path ?? null,
    at: new Date().toISOString(),
  };
  return { body: { ok: true, label } };
  } finally {
    active.handoffPending = false;
  }
}

async function onReload() {
  if (queue.active) throw new ControlError(409, "reload rejected: a dispatch is active");
  const loaded = await loadConfig(configPath);
  if (queue.active) throw new ControlError(409, "reload rejected: a dispatch is active");
  if (loaded.faults.length > 0) {
    event("reloaded", { configPath, valid: false, faults: loaded.faults });
    return { body: { ok: true, valid: false, faults: loaded.faults } };
  }
  const stale = handoffToolsStale(bootHandoffLabels, handoffLabels(loaded.doc.graph));
  if (stale) {
    event("reloaded", { configPath, valid: false, faults: [stale] });
    return { body: { ok: true, valid: false, faults: [stale] } };
  }
  if (queue.active) throw new ControlError(409, "reload rejected: a dispatch is active");
  config = loaded.doc;
  configRevision += 1;
  const artifact = await writeGraphArtifact();
  event("reloaded", { configPath, valid: true, faults: [], artifact });
  return { body: { ok: true, valid: true, faults: [], graph: graphSummary(), artifact } };
}

function onGraphInfo() {
  return { body: graphInfoResponse(config, configPath, ENGINE_VERSION) };
}

function runtimeSnapshot() {
  return {
    ...queue.introspect(),
    lastDefect,
    lastEvent,
    history: history.snapshot(),
    historyEpoch: history.epoch,
  };
}

function onGraphMap() {
  return { body: renderGraphMapResponse(config.graph, runtimeSnapshot()) };
}

async function writeGraphArtifact() {
  try {
    const path = join(cwd, "GRAPH.md");
    await writeFile(path, renderGraphArtifact(config, configPath), "utf8");
    return path;
  } catch (e) {
    log(`engine: could not write GRAPH.md: ${e.message}`);
    return null;
  }
}

async function boot() {
  const loaded = await loadConfig(configPath);
  if (loaded.faults.length > 0) {
    for (const fault of loaded.faults) log(`engine: invalid config: [${fault.code}] ${fault.message}`);
    process.exit(2);
  }
  config = loaded.doc;
  bootHandoffLabels = handoffLabels(config.graph);
  configRevision = 1;
  const artifact = await writeGraphArtifact();

  const token = randomBytes(16).toString("hex");
  control = await startControlServer({
    token,
    handlers: {
      handoff: onHandoff,
      handoffPreflight: onHandoffPreflight,
      handoffTools: onHandoffTools,
      dispatch: onDispatch,
      dispatchStatus: onDispatchStatus,
      dispatchWait: onDispatchWait,
      dispatchCancel: onDispatchCancel,
      reload: onReload,
      graphInfo: onGraphInfo,
      graphMap: onGraphMap,
    },
  });

  await installPlugin({
    cwd,
    url: control.url,
    token,
    labels: handoffLabels(config.graph),
  });
  await installSkills({ cwd });
  await removeCommands({ cwd });
  await removeAgent({ cwd });

  let pluginActive = false;
  try {
    const live = await getDriver();
    const plugin = await preflightPlugin(live, cwd);
    pluginActive = Boolean(plugin);
    if (!pluginActive) log("engine: handoff plugin not active yet; dispatch will defect if it stays missing");
  } catch (e) {
    log(`engine: service not attached at boot: ${e.message}`);
  }

  queue = createDispatchQueue({
    run: async (record) => {
      const live = await getDriver();
      return runDispatch({
        driver: live,
        config,
        record,
        cwd,
        onEvent: event,
        waitIfPaused: () => queue.waitIfPaused(),
      });
    },
    onEvent: event,
  });

  say("version", { version: 2 });
  say("ready", { configPath, pluginActive, cwd, artifact, workflows: (config.graph.workflows ?? []).map((wf) => wf.id) });

  const heartbeatMs = Math.max(1000, Number(process.env.HEARTBEAT_MS || 0) || 5000);
  heartbeat = setInterval(() => {
    const active = queue?.active;
    say("heartbeat", {
      at: new Date().toISOString(),
      paused: queue?.paused ?? false,
      active: active
        ? {
            dispatchId: active.id,
            node: active.node,
            usage: active.usage ?? emptyUsage(),
          }
        : null,
    });
  }, heartbeatMs);
}

async function shutdown() {
  if (stopping) return;
  stopping = true;
  if (heartbeat) clearInterval(heartbeat);
  const active = queue?.active;
  if (active?.sessionId && driver) {
    try {
      await driver.interrupt(active.sessionId);
    } catch {
      // a dying session is already stopped
    }
    event("completion", {
      dispatchId: active.id,
      status: "cancelled",
      terminal: active.terminal ?? null,
      visits: active.visits ?? {},
      defect: null,
      usage: active.usage ?? emptyUsage(),
      at: new Date().toISOString(),
    });
  }
  if (control) await control.close().catch(() => {});
  process.exit(0);
}

let pending = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  pending += chunk;
  let idx;
  while ((idx = pending.indexOf("\n")) !== -1) {
    const line = pending.slice(0, idx).trim();
    pending = pending.slice(idx + 1);
    if (!line) continue;
    const msg = decode(line);
    if (msg.malformed) {
      event("defect", { scope: "poke", code: "poke.malformed", message: "malformed JSON line" });
      continue;
    }
    (async () => {
      try {
        switch (msg.kind) {
          case "dispatch": {
            const result = await onDispatch(msg);
            say("dispatch-status", result.body);
            break;
          }
          case "dispatch-status":
            say("dispatch-status", (await onDispatchStatus(msg)).body);
            break;
          case "dispatch-wait":
            say("dispatch-result", (await onDispatchWait(msg)).body);
            break;
          case "dispatch-cancel":
            say("dispatch-status", (await onDispatchCancel(msg)).body);
            break;
          case "pause":
            queue.pause();
            break;
          case "resume":
            queue.resume();
            break;
          case "reload":
            await onReload();
            break;
          case "introspect":
            say("introspection", {
              ...queue.introspect(),
              lastEvent,
              lastDefect,
              history: history.snapshot(),
              historyEpoch: history.epoch,
              configPath,
              graph: graphSummary(),
            });
            break;
          default:
            event("defect", { scope: "poke", code: "poke.unknown", message: `unknown poke '${msg.kind}'` });
        }
      } catch (e) {
        event("defect", {
          scope: "poke",
          code: e?.status ? "poke.rejected" : e?.kind ?? "internal",
          message: e?.message ?? String(e),
        });
      }
    })();
  }
});
process.stdin.on("end", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

await boot();
