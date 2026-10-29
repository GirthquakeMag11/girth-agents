// The dispatch loop. One node at a time: create a fresh session, send the
// brief, wait for a handoff acknowledgement, verify the output and the
// order, then route to the label's target. Any missing or ambiguous piece
// is a typed defect; no node silently falls through.

import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { composeBrief } from "./brief.mjs";
import { findGraph, findNode, handoffTarget, outputPathFor } from "./config.mjs";
import { permissionsFor } from "./driver.mjs";

export class DispatchDefect extends Error {
  constructor(code, message) {
    super(message);
    this.kind = code;
  }
}

export async function checkOutput(path) {
  let info;
  try {
    info = await stat(path);
  } catch (e) {
    if (e?.code === "ENOENT") throw new DispatchDefect("output.missing", `no output at ${path}`);
    throw new DispatchDefect("output.check", `output check failed at ${path}: ${e.message}`);
  }
  if (!info.isFile()) throw new DispatchDefect("output.not-file", `output path is not a regular file: ${path}`);
  if (info.size === 0) throw new DispatchDefect("output.empty", `output is empty: ${path}`);
  const content = await readFile(path);
  return {
    path,
    bytes: info.size,
    hash: createHash("sha256").update(content).digest("hex"),
  };
}

function toolParts(messages) {
  // The session history endpoint returns newest first. Routing order is
  // chronological, so sort by the message and tool timestamps before
  // flattening; never trust the array order.
  const ordered = [...(messages ?? [])].sort(
    (a, b) => (a.time?.created ?? 0) - (b.time?.created ?? 0),
  );
  const parts = [];
  for (const message of ordered) {
    const content = [...(message.content ?? message.parts ?? [])].sort(
      (a, b) => (a.time?.created ?? 0) - (b.time?.created ?? 0),
    );
    for (const part of content) {
      if (part?.type === "tool") parts.push({ message, part });
    }
  }
  return parts;
}

// The handoff must be the last tool call in the session, and no other tool
// may finish after the acknowledgement was accepted. This catches the
// parallel-call race the red team reproduced: a sleep finishing after handoff.
export function checkHandoffOrder(messages, handoff) {
  const parts = toolParts(messages);
  if (parts.length === 0) return "the session history has no tool calls";

  let index = -1;
  if (handoff.callID) index = parts.findIndex(({ part }) => part.id === handoff.callID);
  if (index === -1) {
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const { part } = parts[i];
      if (part.name === "handoff" && part.state?.input?.label === handoff.label) {
        index = i;
        break;
      }
    }
  }
  if (index === -1) return "the accepted handoff call is not in the session history";

  const { part } = parts[index];
  if (part.state?.status && part.state.status !== "completed") {
    return `the handoff call ended ${part.state.status}`;
  }

  const after = parts.slice(index + 1);
  if (after.length > 0) {
    return `tool '${after[0].part.name}' followed the handoff`;
  }

  const acceptedAt = Date.parse(handoff.at);
  if (Number.isFinite(acceptedAt)) {
    for (const entry of parts) {
      if (entry.part === part) continue;
      const completed = entry.part.time?.completed;
      if (typeof completed === "number" && completed > acceptedAt) {
        return `tool '${entry.part.name}' completed after the handoff was accepted`;
      }
    }
  }

  return null;
}

async function runNode({ driver, config, graph, node, helper, record, cwd, previousOutput, onEvent, sessions }) {
  const outputAbs = outputPathFor(graph, node, cwd);
  const sessionMode = node.session ?? "fresh";
  record.nodeDef = node;
  record.graphDef = graph;
  record.outputPath = outputAbs;
  record.output = null;
  record.handoff = null;
  record.handoffDefect = null;
  record.sessionId = null;

  let sessionId;
  let resumed = false;
  if (sessionMode === "resume" && sessions.has(node.id)) {
    sessionId = sessions.get(node.id);
    resumed = true;
  } else {
    const session = await driver.createSession({
      directory: cwd,
      title: `${record.id}/${graph.id}/${node.id}`,
      agent: helper.agent ?? "build",
      model: helper.model,
      permissions: permissionsFor({
        handoff: node.handoff.mode !== "terminal",
        allow: helper.permissions,
      }),
    });
    sessionId = session.id;
    if (sessionMode === "resume") sessions.set(node.id, sessionId);
  }
  record.sessionId = sessionId;
  onEvent("step", {
    dispatchId: record.id,
    node: node.id,
    phase: "begin",
    sessionId,
    sessionMode,
    resumed,
    upstream: previousOutput,
    at: new Date().toISOString(),
  });

  const brief = composeBrief({
    helper,
    node,
    prompt: record.prompt,
    previousOutput,
    outputAbs,
  });

  let info;
  try {
    info = await driver.prompt(sessionId, brief, { budgetMs: node.budgetMs ?? 600000 });
  } catch (e) {
    if (sessionMode === "fresh" && process.env.ENGINE_KEEP_SESSIONS !== "1") {
      await driver.deleteSession(sessionId);
    }
    throw e;
  }

  try {
    if (info.outcome !== "succeeded") {
      throw new DispatchDefect(`session-${info.outcome}`, `node '${node.id}' session ${session.id} ended ${info.outcome}`);
    }

    if (node.handoff.mode === "terminal") {
      const output = await checkOutput(outputAbs);
      record.output = output;
      onEvent("step", {
        dispatchId: record.id,
        node: node.id,
        phase: "end",
        outcome: info.outcome,
        at: new Date().toISOString(),
      });
      return { outputPath: outputAbs, handoff: null };
    }

    if (record.handoffDefect) throw record.handoffDefect;
    if (!record.handoff) {
      throw new DispatchDefect(
        "handoff.none",
        `node '${node.id}' ended without an accepted handoff`,
      );
    }

    const output = await checkOutput(outputAbs);
    if (output.hash !== record.handoff.outputHash) {
      throw new DispatchDefect(
        "output.changed",
        `node '${node.id}' output changed after the handoff was accepted`,
      );
    }

    const messages = await driver.messages(sessionId);
    const order = checkHandoffOrder(messages, record.handoff);
    if (order) {
      throw new DispatchDefect("handoff.not-last", `node '${node.id}': ${order}`);
    }

    record.output = output;
    onEvent("step", {
      dispatchId: record.id,
      node: node.id,
      phase: "end",
      outcome: info.outcome,
      label: record.handoff.label,
      sessionMode,
      resumed,
      at: new Date().toISOString(),
    });
    return { outputPath: outputAbs, handoff: record.handoff };
  } finally {
    if (sessionMode === "fresh" && process.env.ENGINE_KEEP_SESSIONS !== "1") {
      await driver.deleteSession(sessionId);
    }
  }
}

export async function runDispatch({ driver, config, record, cwd, onEvent = () => {}, waitIfPaused = async () => {} }) {
  const graph = findGraph(config, record.graph);
  if (!graph) throw new DispatchDefect("no-graph", `dispatch names no graph '${record.graph}'`);

  let current = record.node;
  let previousOutput = null;
  const visits = record.visits ?? {};
  const maxSteps = graph.maxSteps ?? 100;
  const sessions = new Map();

  try {
  for (let step = 0; step < maxSteps; step += 1) {
    await waitIfPaused();

    const node = findNode(graph, current);
    if (!node) throw new DispatchDefect("no-node", `graph '${graph.id}' names no node '${current}'`);

    visits[current] = (visits[current] ?? 0) + 1;
    const hardCeiling = Math.min(node.maxVisits ?? 3, 3);
    if (visits[current] > hardCeiling) {
      throw new DispatchDefect(
        "max-visits",
        `node '${current}' exceeded its visit bound (${hardCeiling})`,
      );
    }
    record.node = current;
    record.visits = { ...visits };

    const helper = config.helpers.find((entry) => entry.id === node.helper);
    if (!helper) throw new DispatchDefect("unknown-helper", `node '${node.id}' names no helper '${node.helper}'`);

    const result = await runNode({
      driver,
      config,
      graph,
      node,
      helper,
      record,
      cwd,
      previousOutput,
      onEvent,
      sessions,
    });

    if (node.handoff.mode === "terminal") {
      record.terminal = current;
      return { terminal: current, visits: { ...visits }, output: result.outputPath };
    }

    const target = handoffTarget(node, result.handoff.label);
    if (!target) {
      throw new DispatchDefect(
        "handoff.unknown-label",
        `node '${node.id}' accepted handoff '${result.handoff.label}' with no target`,
      );
    }

    record.handoff = { from: current, label: result.handoff.label, to: target };
    onEvent("handoff", {
      dispatchId: record.id,
      from: current,
      label: result.handoff.label,
      to: target,
      at: new Date().toISOString(),
    });

    previousOutput = result.outputPath;
    current = target;
  }

  throw new DispatchDefect("step-overflow", `graph '${graph.id}' exceeded ${maxSteps} steps`);
  } finally {
    if (process.env.ENGINE_KEEP_SESSIONS !== "1") {
      for (const sessionId of sessions.values()) {
        await driver.deleteSession(sessionId).catch(() => {});
      }
    }
  }
}
