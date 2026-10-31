import { randomUUID } from "node:crypto";

const KINDS = new Set(["queued", "dispatched", "step", "handoff", "completion", "defect", "reloaded"]);
export const HISTORY_FIELDS = [
  "seq",
  "at",
  "kind",
  "dispatchId",
  "workflow",
  "node",
  "phase",
  "outcome",
  "label",
  "from",
  "to",
  "status",
  "terminal",
  "code",
  "valid",
];

export function workflowForEvent(payload = {}, lookup) {
  if (payload.workflow !== undefined) return payload.workflow;
  if (!payload.dispatchId || typeof lookup !== "function") return null;
  return lookup(payload.dispatchId)?.workflow ?? null;
}

let shared;

export function getActivityHistory(options) {
  shared ??= createActivityHistory(options);
  return shared;
}

export function createActivityHistory({ limit = 100, epoch = randomUUID() } = {}) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("history limit must be a positive integer");
  if (typeof epoch !== "string" || epoch.length === 0) throw new Error("history epoch must be a non-empty string");

  const entries = [];
  const defectDispatches = new Set();
  let seq = 0;

  function append(kind, payload = {}, options = {}) {
    if (!KINDS.has(kind)) return null;
    const dispatchId = typeof payload.dispatchId === "string" && payload.dispatchId !== "" ? payload.dispatchId : null;

    // A dispatch defect already explains its termination. The queue emits a
    // completion with status 'defect' immediately after, which would be a
    // duplicate row. If no defect row was recorded, keep the termination as
    // a defect row rather than dropping it.
    if (kind === "completion" && payload.status === "defect") {
      if (dispatchId && defectDispatches.has(dispatchId)) return null;
      return append(
        "defect",
        {
          dispatchId,
          at: payload.at,
          code: payload.defect?.code ?? payload.code ?? null,
        },
        options,
      );
    }
    if (kind === "defect" && dispatchId) {
      defectDispatches.add(dispatchId);
      if (defectDispatches.size > limit) defectDispatches.delete(defectDispatches.values().next().value);
    }

    const workflow =
      options.workflow !== undefined ? options.workflow : typeof payload.workflow === "string" ? payload.workflow : null;
    const entry = {
      seq: ++seq,
      at: typeof payload.at === "string" ? payload.at : new Date().toISOString(),
      kind,
      dispatchId,
      workflow,
      node: typeof payload.node === "string" ? payload.node : null,
      phase: payload.phase === "begin" || payload.phase === "end" ? payload.phase : null,
      outcome: typeof payload.outcome === "string" ? payload.outcome : null,
      label: typeof payload.label === "string" ? payload.label : null,
      from: typeof payload.from === "string" ? payload.from : null,
      to: typeof payload.to === "string" ? payload.to : null,
      status: typeof payload.status === "string" ? payload.status : null,
      terminal: typeof payload.terminal === "string" ? payload.terminal : null,
      code: kind === "defect" ? (typeof payload.code === "string" ? payload.code : null) : payload.defect?.code ?? null,
      valid: kind === "reloaded" ? Boolean(payload.valid) : null,
    };

    entries.push(entry);
    if (entries.length > limit) entries.shift();
    return entry;
  }

  return {
    epoch,
    append,
    snapshot() {
      return entries.map((entry) => ({ ...entry }));
    },
    get length() {
      return entries.length;
    },
  };
}
