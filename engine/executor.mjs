// The dispatch loop. One node at a time: create or resume a session, send the
// brief, wait for a handoff acknowledgement, verify the order, then route to
// the label's target. Any missing or ambiguous piece is a typed defect; no
// node silently falls through.

import { composeBrief } from "./brief.mjs";
import { DISPATCHER_TARGET, MAX_VISITS, findNode, handoffTarget, handoffResume, resumableNodes } from "./config.mjs";
import { permissionsFor } from "./driver.mjs";

const RESPONSE_CAP_BYTES = 16 * 1024;

function truncateUtf8(text, maxBytes) {
  const buffer = Buffer.from(text, "utf8");
  if (buffer.length <= maxBytes) return { response: text, responseTruncated: false };
  for (let end = maxBytes; end > 0; end -= 1) {
    try {
      const response = new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, end));
      return { response, responseTruncated: true };
    } catch {
      // back up over a split multibyte sequence
    }
  }
  return { response: "", responseTruncated: true };
}

export class DispatchDefect extends Error {
  constructor(code, message) {
    super(message);
    this.kind = code;
  }
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
      if (part.name === handoff.label) {
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

const EMPTY_TOKENS = () => ({ input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } });

export function emptyUsage() {
  return { cost: 0, tokens: EMPTY_TOKENS() };
}

function usageOf(info) {
  const tokens = info?.tokens ?? {};
  return {
    cost: typeof info?.cost === "number" ? info.cost : 0,
    tokens: {
      input: tokens.input ?? 0,
      output: tokens.output ?? 0,
      reasoning: tokens.reasoning ?? 0,
      cache: {
        read: tokens.cache?.read ?? 0,
        write: tokens.cache?.write ?? 0,
      },
    },
  };
}

function usageDelta(before, after) {
  const a = usageOf(before);
  const b = usageOf(after);
  return {
    cost: Math.max(0, b.cost - a.cost),
    tokens: {
      input: Math.max(0, b.tokens.input - a.tokens.input),
      output: Math.max(0, b.tokens.output - a.tokens.output),
      reasoning: Math.max(0, b.tokens.reasoning - a.tokens.reasoning),
      cache: {
        read: Math.max(0, b.tokens.cache.read - a.tokens.cache.read),
        write: Math.max(0, b.tokens.cache.write - a.tokens.cache.write),
      },
    },
  };
}

function addUsage(total, delta) {
  const t = total ?? emptyUsage();
  return {
    cost: t.cost + delta.cost,
    tokens: {
      input: t.tokens.input + delta.tokens.input,
      output: t.tokens.output + delta.tokens.output,
      reasoning: t.tokens.reasoning + delta.tokens.reasoning,
      cache: {
        read: t.tokens.cache.read + delta.tokens.cache.read,
        write: t.tokens.cache.write + delta.tokens.cache.write,
      },
    },
  };
}

async function sessionInfo(driver, sessionId) {
  try {
    return await driver.getSession(sessionId);
  } catch {
    return null;
  }
}

async function runNode({ driver, node, graphAgent, record, previousMessage, onEvent, sessions, resume = false, resumable = false, budgetMs = null }) {
  if (record.cancelled) throw new DispatchDefect("cancelled", "dispatch cancelled");

  record.nodeDef = node;
  record.handoff = null;
  record.handoffDefect = null;
  record.handoffPending = false;
  record.sessionId = null;
  let keepForDispatcher = false;
  let completed = false;

  let sessionId;
  let resumed = false;
  if (resume) {
    if (!sessions.has(node.id)) {
      throw new DispatchDefect("resume.no-session", `node '${node.id}' requested resume but has no retained session`);
    }
    sessionId = sessions.get(node.id);
    resumed = true;
  } else {
    if (sessions.has(node.id)) {
      const stale = sessions.get(node.id);
      sessions.delete(node.id);
      if (process.env.ENGINE_KEEP_SESSIONS !== "1") await driver.deleteSession(stale).catch(() => {});
    }
    const session = await driver.createSession({
      directory: record.directory,
      title: `${record.id}/${node.id}`,
      model: graphAgent.model,
      permissions: permissionsFor({
        handoff: node.handoff.mode !== "terminal",
        rules: [
          ...(graphAgent.tools ?? []).map((name) => ({ action: name, resource: "*", effect: "allow" })),
          ...(graphAgent.permissions ?? []),
          ...(node.tools ?? []).map((name) => ({ action: name, resource: "*", effect: "allow" })),
          ...(node.permissions ?? []),
        ],
        subagents: graphAgent.subagents ?? [],
      }),
    });
    sessionId = session.id;
    if (resume || resumable) sessions.set(node.id, sessionId);
  }
  record.sessionId = sessionId;
  const before = await sessionInfo(driver, sessionId);
  onEvent("step", {
    dispatchId: record.id,
    node: node.id,
    phase: "begin",
    sessionId,
    sessionMode: resume ? "resume" : "fresh",
    resumed,
    at: new Date().toISOString(),
  });

  const brief = composeBrief({
    graphAgent,
    node,
    prompt: record.prompt,
    previousMessage,
    inputSource: resume ? "dispatcher" : "node",
  });

  const budget = budgetMs ?? node.budgetMs ?? 600000;
  const promptStartedAt = Date.now();
  let info;
  try {
    if (record.cancelled) throw new DispatchDefect("cancelled", "dispatch cancelled");
    info = await driver.prompt(sessionId, brief, { budgetMs: budget });
  } catch (e) {
    if (!resume && !resumable && process.env.ENGINE_KEEP_SESSIONS !== "1") {
      await driver.deleteSession(sessionId);
    }
    if (!record.cancelled && record.handoffDefect) throw record.handoffDefect;
    throw e;
  }

  try {
    const delta = usageDelta(before, info);
    record.usage = addUsage(record.usage, delta);

    if (record.handoffDefect) throw record.handoffDefect;

    if (info.outcome !== "succeeded") {
      throw new DispatchDefect(`session-${info.outcome}`, `node '${node.id}' session ${sessionId} ended ${info.outcome}`);
    }

    if (node.handoff.mode === "terminal") {
      completed = true;
      onEvent("step", {
        dispatchId: record.id,
        node: node.id,
        phase: "end",
        outcome: info.outcome,
        usage: delta,
        at: new Date().toISOString(),
      });
      return {
        handoff: null,
        budgetRemainingMs: Math.max(0, budget - (Date.now() - promptStartedAt)),
      };
    }

    if (!record.handoff) {
      throw new DispatchDefect(
        "handoff.none",
        `node '${node.id}' ended without an accepted handoff`,
      );
    }

    const messages = await driver.messages(sessionId);
    const order = checkHandoffOrder(messages, record.handoff);
    if (order) {
      throw new DispatchDefect("handoff.not-last", `node '${node.id}': ${order}`);
    }

    keepForDispatcher =
      !record.cancelled &&
      handoffTarget(node, record.handoff.label) === DISPATCHER_TARGET;
    onEvent("step", {
      dispatchId: record.id,
      node: node.id,
      phase: "end",
      outcome: info.outcome,
      label: record.handoff.label,
      sessionMode: resume ? "resume" : "fresh",
      resumed,
      usage: delta,
      at: new Date().toISOString(),
    });
    return {
      handoff: record.handoff,
      budgetRemainingMs: Math.max(0, budget - (Date.now() - promptStartedAt)),
    };
  } finally {
    // Keep the session of a successfully completed terminal node (the
    // dispatch's last live session) so a completion notice can link into it,
    // exactly like the retained $dispatcher origin. Failed or cancelled runs
    // still clean up, and every other node session is ephemeral.
    const keep = keepForDispatcher || completed;
    if (!resume && !resumable && !keep && process.env.ENGINE_KEEP_SESSIONS !== "1") {
      await driver.deleteSession(sessionId);
    }
  }
}

export async function runDispatch({ driver, config, record, onEvent = () => {}, waitIfPaused = async () => {} }) {
  const graph = config.graph;
  if (!graph) throw new DispatchDefect("no-graph", "the config has no graph");
  if (typeof record.directory !== "string" || record.directory.trim() === "") {
    throw new DispatchDefect("no-directory", "the dispatch record has no directory");
  }
  if (!driver || typeof driver.createSession !== "function") {
    throw new DispatchDefect("no-driver", "the dispatch has no session driver");
  }

  let current = record.node;
  let previousMessage = null;
  let upstream = null;
  const visits = record.visits ?? {};
  const maxSteps = graph.maxSteps ?? 100;
  const sessions = new Map();
  const resumable = resumableNodes(graph);
  let resume = false;
  if (record.resumeSessionId) {
    sessions.set(record.node, record.resumeSessionId);
    resume = true;
    previousMessage = record.resumeMessage ?? null;
  }
  record.usage = record.usage ?? emptyUsage();

  try {
  for (let step = 0; step < maxSteps; step += 1) {
    if (record.cancelled) throw new DispatchDefect("cancelled", "dispatch cancelled");
    await waitIfPaused();
    if (record.cancelled) throw new DispatchDefect("cancelled", "dispatch cancelled");

    const node = findNode(graph, current);
    if (!node) throw new DispatchDefect("no-node", `the graph has no node '${current}'`);

    visits[current] = (visits[current] ?? 0) + 1;
    const hardCeiling = Math.min(node.maxVisits ?? MAX_VISITS, MAX_VISITS);
    if (visits[current] > hardCeiling) {
      throw new DispatchDefect(
        "max-visits",
        `node '${current}' exceeded its visit bound (${hardCeiling})`,
      );
    }
    record.node = current;
    record.visits = { ...visits };

    const graphAgent = config.agents.find((entry) => entry.id === node.agent);
    if (!graphAgent) throw new DispatchDefect("unknown-agent", `node '${node.id}' names no graph agent '${node.agent}'`);

    const result = await runNode({
      driver,
      node,
      graphAgent,
      record,
      previousMessage,
      onEvent,
      sessions,
      resume,
      resumable: resumable.has(node.id),
      budgetMs: step === 0 && record.resumeSessionId ? record.resumeBudgetMs : null,
    });

    if (record.cancelled) throw new DispatchDefect("cancelled", "dispatch cancelled");

    if (node.handoff.mode === "terminal") {
      record.terminal = current;
      return { terminal: current, visits: { ...visits }, usage: record.usage };
    }

    const target = handoffTarget(node, result.handoff.label);
    if (!target) {
      throw new DispatchDefect(
        "handoff.unknown-tool",
        `node '${node.id}' accepted handoff '${result.handoff.label}' with no target`,
      );
    }

    if (target === DISPATCHER_TARGET) {
      const message = result.handoff.message ?? "";
      const { response, responseTruncated } = truncateUtf8(message, RESPONSE_CAP_BYTES);
      record.handoff = {
        from: current,
        label: result.handoff.label,
        to: DISPATCHER_TARGET,
        message,
      };
      record.result = { response, responseTruncated };
      record.retainedOrigin = {
        node: current,
        sessionId: record.sessionId,
        workflow: record.workflow ?? null,
        label: result.handoff.label,
        message,
        remainingBudgetMs: result.budgetRemainingMs ?? null,
        at: new Date().toISOString(),
      };
      record.originState = "retained";
      onEvent("handoff", {
        dispatchId: record.id,
        from: current,
        label: result.handoff.label,
        to: DISPATCHER_TARGET,
        at: new Date().toISOString(),
      });
      return {
        dispatcher: true,
        handoff: record.handoff,
        result: record.result,
        visits: { ...visits },
        usage: record.usage,
      };
    }

    record.handoff = { from: current, label: result.handoff.label, to: target };
    onEvent("handoff", {
      dispatchId: record.id,
      from: current,
      label: result.handoff.label,
      to: target,
      at: new Date().toISOString(),
    });

    const wantsResume = handoffResume(node, result.handoff.label);
    if (wantsResume && target !== upstream) {
      throw new DispatchDefect(
        "resume.not-return",
        `node '${node.id}' requests resume on '${result.handoff.label}', but target '${target}' is not the node that supplied its input (${upstream ?? "dispatch entry"})`,
      );
    }
    previousMessage = result.handoff.message ?? null;
    upstream = current;
    current = target;
    resume = wantsResume;
  }

  throw new DispatchDefect("step-overflow", `the graph exceeded ${maxSteps} steps`);
  } finally {
    if (record.cancelled && record.retainedOrigin) {
      await driver.deleteSession(record.retainedOrigin.sessionId).catch(() => {});
      record.retainedOrigin = null;
      record.originState = "discarded";
    }
    if (process.env.ENGINE_KEEP_SESSIONS !== "1") {
      const retained = record.retainedOrigin?.sessionId;
      for (const sessionId of sessions.values()) {
        if (sessionId !== retained) await driver.deleteSession(sessionId).catch(() => {});
      }
    }
  }
}
