// The engine's boot and continuous loop. argv[2] is the config path. The
// engine runs one dispatch at a time, queues the rest, and speaks
// JSON-lines over stdio. The loopback control endpoint is where the
// handoff tool and the interactive agent's tools reach the queue.

import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { loadConfig, findGraph, findNode, handoffTarget, configSummary } from "./config.mjs";
import { createDispatchQueue } from "./queue.mjs";
import { runDispatch, checkOutput, DispatchDefect } from "./executor.mjs";
import { createDriver } from "./driver.mjs";
import { startControlServer, ControlError } from "./control.mjs";
import { installPlugin, installSkills, preflightPlugin } from "./plugin.mjs";
import { encode, decode } from "./stdio.mjs";

const say = (kind, payload = {}) => process.stdout.write(encode(kind, payload) + "\n");
const log = (...parts) => process.stderr.write(parts.join(" ") + "\n");
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const configArg = process.argv[2];
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
  lastEvent = { kind, ...payload };
  if (kind === "defect") lastDefect = payload;
  say(kind, payload);
}

function summarizeGraphs() {
  return config.graphs.map((graph) => graph.id);
}

async function onDispatch(body) {
  const { graph, node, prompt } = body ?? {};
  if (typeof graph !== "string" || graph.trim() === "") {
    throw new ControlError(400, "dispatch needs a graph id");
  }
  if (typeof node !== "string" || node.trim() === "") {
    throw new ControlError(400, "dispatch needs a node id");
  }
  if (typeof prompt !== "string" || prompt.trim() === "") {
    throw new ControlError(400, "dispatch needs a non-empty prompt");
  }
  const graphDef = findGraph(config, graph);
  if (!graphDef) throw new ControlError(400, `unknown graph '${graph}'`);
  if (!findNode(graphDef, node)) throw new ControlError(400, `graph '${graph}' has no node '${node}'`);
  const record = queue.enqueue({ graph, node, prompt });
  return { body: { ok: true, dispatchId: record.id, state: record.state } };
}

async function onDispatchStatus(body) {
  const id = body?.dispatchId ?? body?.id;
  if (typeof id !== "string" || id.trim() === "") throw new ControlError(400, "dispatch status needs a dispatch id");
  const status = queue.status(id);
  if (!status) throw new ControlError(404, `unknown dispatch '${id}'`);
  return { body: { ok: true, ...status } };
}

async function onDispatchWait(body) {
  const id = body?.dispatchId ?? body?.id;
  if (typeof id !== "string" || id.trim() === "") throw new ControlError(400, "dispatch wait needs a dispatch id");
  const timeoutMs = typeof body?.timeoutMs === "number" ? body.timeoutMs : 300000;
  const result = await queue.wait(id, timeoutMs);
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

  if (active.handoff) {
    active.handoffDefect = new DispatchDefect("handoff.multiple", `node '${node.id}' handed off more than once`);
    throw new ControlError(409, "handoff already accepted");
  }

  const label = body.label;
  if (typeof label !== "string" || label.trim() === "") throw new ControlError(422, "handoff needs a non-empty label");
  const target = handoffTarget(node, label);
  if (!target) {
    const allowed = node.handoff.mode === "unconditional" ? "next" : node.handoff.labels.map((entry) => entry.label).join(", ");
    throw new ControlError(422, `label '${label}' is not declared for node '${node.id}' (allowed: ${allowed})`);
  }

  let output;
  try {
    output = await checkOutput(active.outputPath);
  } catch (e) {
    if (e instanceof DispatchDefect) throw new ControlError(422, e.message);
    throw e;
  }

  active.handoff = {
    label,
    callID: body.callID ?? null,
    outputHash: output.hash,
    outputPath: active.outputPath,
    at: new Date().toISOString(),
  };
  return { body: { ok: true, label } };
}

async function onReload() {
  if (queue.active) throw new ControlError(409, "reload rejected: a dispatch is active");
  const loaded = await loadConfig(configPath);
  if (loaded.faults.length > 0) {
    event("reloaded", { configPath, valid: false, graphs: summarizeGraphs(), faults: loaded.faults });
    return { body: { ok: true, valid: false, faults: loaded.faults } };
  }
  config = loaded.doc;
  event("reloaded", { configPath, valid: true, graphs: summarizeGraphs(), faults: [] });
  return { body: { ok: true, valid: true, faults: [], graphs: summarizeGraphs() } };
}

function onGraphs() {
  return { body: { ok: true, ...configSummary(config, configPath) } };
}

async function boot() {
  const loaded = await loadConfig(configPath);
  if (loaded.faults.length > 0) {
    for (const fault of loaded.faults) log(`engine: invalid config: [${fault.code}] ${fault.message}`);
    process.exit(2);
  }
  config = loaded.doc;

  const token = randomBytes(16).toString("hex");
  control = await startControlServer({
    token,
    handlers: {
      handoff: onHandoff,
      dispatch: onDispatch,
      dispatchStatus: onDispatchStatus,
      dispatchWait: onDispatchWait,
      reload: onReload,
      graphs: onGraphs,
    },
  });

  await installPlugin({ cwd, url: control.url, token });
  await installSkills({ cwd });

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
  say("ready", { configPath, graphs: summarizeGraphs(), pluginActive, cwd });

  const heartbeatMs = Math.max(1000, Number(process.env.HEARTBEAT_MS || 0) || 5000);
  heartbeat = setInterval(() => {
    const active = queue?.active;
    say("heartbeat", {
      at: new Date().toISOString(),
      paused: queue?.paused ?? false,
      active: active ? { dispatchId: active.id, graph: active.graph, node: active.node } : null,
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
    say("completion", {
      dispatchId: active.id,
      graph: active.graph,
      status: "cancelled",
      terminal: active.terminal ?? null,
      visits: active.visits ?? {},
      defect: null,
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
              configPath,
              graphs: summarizeGraphs(),
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
