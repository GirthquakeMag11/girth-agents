// The in-process engine runtime. One config, one queue, one history, one
// active dispatch. The plugin creates or reuses this runtime; the engine's
// lifetime is the OpenCode server process. There is no stdio loop, no
// heartbeat, no loopback control server, and no HTTP anywhere here.

import { loadConfig, handoffLabels, handoffToolsStale, configSummary, graphInfoResponse } from "./config.mjs";
import { handoffLabelsMatch, handoffPreflightError, handoffToolState, handoffVisibilityFailure } from "./visibility.mjs";
import { resumeHistoryEvent, selectResumeOrigin } from "./resume.mjs";
import { createHandoffHandler } from "./handoff.mjs";
import { resolveDispatchTarget, validateDispatchOptions } from "./workflow.mjs";
import { createDispatchQueue } from "./queue.mjs";
import { runDispatch, DispatchDefect } from "./executor.mjs";
import { renderGraphMapResponse } from "./map.mjs";
import { dispatchStatusBody, renderDispatchDisplay } from "./display.mjs";
import { createActivityHistory, workflowForEvent } from "./history.mjs";
import { ControlError } from "./errors.mjs";
import { PROJECT_VERSION } from "./version.mjs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function createRuntime({ configPath, driver, onNotice = () => {} }) {
  let config = null;
  let queue = null;
  let lastEvent = null;
  let lastDefect = null;
  let handoffPreflight = null;
  let handoffPreflightWaiters = [];
  let subagentPreflight = null;
  let subagentPreflightWaiters = [];
  let bootHandoffLabels = [];
  let configRevision = 0;
  let liveDriver = driver;
  const history = createActivityHistory();

  function event(kind, payload = {}) {
    const workflow = workflowForEvent(payload, (id) => (queue ? queue.status(id) : null));
    history.append(kind, payload, { workflow });
    lastEvent = { kind, ...payload };
    if (kind === "defect") lastDefect = payload;
    onNotice(kind, payload);
  }

  function graphSummary() {
    return configSummary(config, configPath).graph;
  }

  function reportHandoffPreflight(body) {
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
    return { ok: true };
  }

  // The subagent catalog preflight mirrors the handoff one: the plugin reports
  // which graph-agent `subagents` ids are missing from the live agent catalog,
  // and dispatch fails closed on any before a node runs.
  function reportSubagentPreflight(body) {
    subagentPreflight = {
      missing: Array.isArray(body?.missing)
        ? body.missing.filter(
            (entry) =>
              entry && typeof entry.agent === "string" && typeof entry.subagent === "string",
          )
        : [],
      collisions: Array.isArray(body?.collisions)
        ? body.collisions.filter((id) => typeof id === "string" && id.trim() !== "")
        : [],
      catalogAvailable: body?.catalogAvailable !== false,
      at: new Date().toISOString(),
    };
    for (const resolve of subagentPreflightWaiters.splice(0)) resolve();
    return { ok: true };
  }

  function handoffTools(body) {
    try {
      return {
        ok: true,
        ...handoffToolState({
          active: queue?.active,
          sessionID: body?.sessionID,
          revision: configRevision,
        }),
      };
    } catch (e) {
      handoffVisibilityFailure(queue?.active, e, DispatchDefect);
      throw e;
    }
  }

  // The active node session's graph-agent body, or null when the session is
  // not the engine's current node session. The plugin injects this as the
  // session's system prompt; skills stay in the brief.
  function sessionSystem(body) {
    const active = queue?.active;
    if (!active || active.sessionId !== body?.sessionID) return null;
    const node = active.nodeDef;
    if (!node) return null;
    const graphAgent = config?.agents?.find((entry) => entry.id === node.agent);
    return graphAgent?.prompt ?? null;
  }

  async function waitForHandoffPreflight(timeoutMs = 5000) {
    if (handoffPreflight) return handoffPreflight;
    await Promise.race([
      new Promise((resolve) => handoffPreflightWaiters.push(resolve)),
      sleep(timeoutMs),
    ]);
    return handoffPreflight;
  }

  async function waitForSubagentPreflight(timeoutMs = 5000) {
    if (subagentPreflight) return subagentPreflight;
    await Promise.race([
      new Promise((resolve) => subagentPreflightWaiters.push(resolve)),
      sleep(timeoutMs),
    ]);
    return subagentPreflight;
  }

  function subagentPreflightError(preflight) {
    if (!preflight || preflight.catalogAvailable === false) {
      return { code: "subagent.preflight-unavailable", message: "the plugin did not report the agent catalog" };
    }
    if (preflight.missing.length > 0) {
      return {
        code: "subagent.unknown",
        message: preflight.missing.map((entry) => `${entry.agent} -> ${entry.subagent}`).join(", "),
      };
    }
    if (preflight.collisions.length > 0) {
      return {
        code: "agent.collision",
        message: preflight.collisions.join(", "),
      };
    }
    return null;
  }

  async function dispatch(body, directory) {
    if (typeof directory !== "string" || directory.trim() === "") {
      throw new ControlError(400, "dispatch needs a dispatching directory");
    }
    const preflight = await waitForHandoffPreflight();
    const preflightFault = handoffPreflightError(preflight);
    if (preflightFault) {
      throw new ControlError(409, `${preflightFault.code}: ${preflightFault.message}`);
    }
    const agentPreflight = await waitForSubagentPreflight();
    const agentFault = subagentPreflightError(agentPreflight);
    if (agentFault) {
      throw new ControlError(409, `${agentFault.code}: ${agentFault.message}`);
    }
    if (!handoffLabelsMatch(preflight.labels, bootHandoffLabels)) {
      throw new ControlError(409, "handoff.tools-stale: the plugin label set does not match the boot config");
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
      const record = queue.enqueue({
        node: origin.node,
        prompt: body.prompt,
        workflow: origin.workflow ?? null,
        dispatchingSessionID: body.sessionID,
        driver: liveDriver.forDirectory(directory),
        directory,
        resumeSessionId: origin.sessionId,
        resumeMessage: body.prompt,
        resumeBudgetMs: origin.remainingBudgetMs,
        resumeOriginDispatchId: origin.dispatchId,
      });
      return dispatchStatusBody(queue.status(record.id));
    }

    const record = queue.enqueue({
      node: target.node,
      prompt: body.prompt,
      workflow: target.workflow,
      dispatchingSessionID: body.sessionID,
      driver: liveDriver.forDirectory(directory),
      directory,
    });
    return dispatchStatusBody(queue.status(record.id));
  }

  function status(dispatchId) {
    if (typeof dispatchId !== "string" || dispatchId.trim() === "") {
      throw new ControlError(400, "dispatch status needs a dispatch id");
    }
    const snapshot = queue.status(dispatchId);
    if (!snapshot) throw new ControlError(404, `unknown dispatch '${dispatchId}'`);
    return dispatchStatusBody(snapshot);
  }

  async function wait(dispatchId, timeoutMs = 300000) {
    if (typeof dispatchId !== "string" || dispatchId.trim() === "") {
      throw new ControlError(400, "dispatch wait needs a dispatch id");
    }
    const result = await queue.wait(dispatchId, timeoutMs);
    if (!result) throw new ControlError(404, `unknown dispatch '${dispatchId}'`);
    return { ok: true, ...result, display: renderDispatchDisplay(result) };
  }

  async function cancel(dispatchId) {
    if (typeof dispatchId !== "string" || dispatchId.trim() === "") {
      throw new ControlError(400, "dispatch cancel needs a dispatch id");
    }
    const result = await queue.cancel(dispatchId);
    if (!result) throw new ControlError(404, `unknown dispatch '${dispatchId}'`);
    return { ok: true, ...result };
  }

  const handoff = createHandoffHandler({
    getQueue: () => queue,
    getConfig: () => config,
    Defect: DispatchDefect,
  });

  async function reload() {
    if (queue.active) throw new ControlError(409, "reload rejected: a dispatch is active");
    const loaded = await loadConfig(configPath);
    if (queue.active) throw new ControlError(409, "reload rejected: a dispatch is active");
    if (loaded.faults.length > 0) {
      event("reloaded", { configPath, valid: false, faults: loaded.faults });
      return { ok: true, valid: false, faults: loaded.faults };
    }
    const stale = handoffToolsStale(bootHandoffLabels, handoffLabels(loaded.doc.graph));
    if (stale) {
      event("reloaded", { configPath, valid: false, faults: [stale] });
      return { ok: true, valid: false, faults: [stale] };
    }
    if (queue.active) throw new ControlError(409, "reload rejected: a dispatch is active");
    config = loaded.doc;
    configRevision += 1;
    event("reloaded", { configPath, valid: true, faults: [] });
    return { ok: true, valid: true, faults: [], graph: graphSummary() };
  }

  function graphInfo() {
    return graphInfoResponse(config, configPath, PROJECT_VERSION);
  }

  function snapshot() {
    return {
      ...queue.introspect(),
      lastDefect,
      lastEvent,
      history: history.snapshot(),
      historyEpoch: history.epoch,
    };
  }

  function graphMap() {
    return renderGraphMapResponse(config.graph, snapshot());
  }

  const loaded = await loadConfig(configPath);
  if (loaded.faults.length > 0) {
    const err = new Error(
      `invalid graph config: [${loaded.faults.map((fault) => `${fault.code}`).join(", ")}]`,
    );
    err.faults = loaded.faults;
    throw err;
  }
  config = loaded.doc;
  bootHandoffLabels = handoffLabels(config.graph);
  configRevision = 1;

  queue = createDispatchQueue({
    run: async (record) =>
      runDispatch({
        driver: record.driver,
        config,
        record,
        onEvent: event,
        waitIfPaused: () => queue.waitIfPaused(),
      }),
    onEvent: event,
  });

  return {
    configPath,
    // A later plugin setup reuses this runtime but brings a fresh server
    // client; rebind the live driver so new dispatches use the current ctx.
    setDriver(driver) {
      liveDriver = driver;
    },
    get config() {
      return config;
    },
    get bootHandoffLabels() {
      return bootHandoffLabels;
    },
    get queue() {
      return queue;
    },
    event,
    reportHandoffPreflight,
    reportSubagentPreflight,
    handoffTools,
    sessionSystem,
    handoff,
    dispatch,
    status,
    wait,
    cancel,
    reload,
    graphInfo,
    graphMap,
    snapshot,
  };
}