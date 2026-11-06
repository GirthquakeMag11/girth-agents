// Pure focused-display formatter for dispatch results and status snapshots.
// The raw snapshot stays available through dispatch_status({ raw: true }).

import { UNCONDITIONAL_TOOL } from "./config.mjs";

function elapsed(start, end) {
  if (!start || !end) return null;
  const from = Date.parse(start);
  const to = Date.parse(end);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null;
  return (to - from) / 1000;
}

function handoffText(handoff) {
  // The label sits on the arrow between the nodes; an unconditional handoff
  // has no label, so its arrow is plain.
  const label = handoff.label;
  const named = typeof label === "string" && label !== "" && label !== UNCONDITIONAL_TOOL;
  const arrow = named ? ` -${label}-> ` : " -> ";
  return `handoff ${handoff.from ?? "?"}${arrow}${handoff.to ?? "?"}`;
}

function visitsText(visits) {
  const total = Object.values(visits ?? {}).reduce((sum, count) => sum + (Number(count) || 0), 0);
  return total > 0 ? `${total} visit${total === 1 ? "" : "s"}` : null;
}

function usageText(usage) {
  if (!usage) return [];
  const bits = [];
  if (typeof usage.cost === "number") bits.push(`$${usage.cost.toFixed(4)}`);
  const tokens = usage.tokens ?? {};
  if (typeof tokens.input === "number" || typeof tokens.output === "number") {
    bits.push(`${tokens.input ?? 0} in / ${tokens.output ?? 0} out`);
  }
  return bits;
}

function footer(snapshot, summary = true) {
  const bits = summary ? [snapshot.dispatchId ?? "dispatch", snapshot.state ?? "unknown"] : [];
  if (snapshot.terminal) {
    bits.push(`terminal ${snapshot.terminal}`);
  } else if (snapshot.handoff) {
    bits.push(handoffText(snapshot.handoff));
  } else if (snapshot.node) {
    bits.push(`node ${snapshot.node}`);
  }
  const visits = visitsText(snapshot.visits);
  if (visits) bits.push(visits);
  bits.push(...usageText(snapshot.usage));
  const seconds = elapsed(snapshot.startedAt ?? snapshot.createdAt, snapshot.finishedAt);
  if (seconds !== null) bits.push(`${seconds.toFixed(1)}s`);
  return bits.join(" · ");
}

export function dispatchStatusBody(snapshot) {
  return { ok: true, ...snapshot, display: renderDispatchDisplay(snapshot) };
}

export function renderDispatchDisplay(snapshot) {
  if (!snapshot) return "dispatch: unknown";
  const state = snapshot.state ?? "unknown";

  if (state === "queued" || state === "running") {
    const where = snapshot.workflow
      ? `${snapshot.node ?? "?"} · workflow ${snapshot.workflow}`
      : snapshot.node;
    return `${snapshot.dispatchId ?? "dispatch"} · ${state}${where ? ` · ${where}` : ""}`;
  }

  if (state === "cancelled") {
    return footer(snapshot);
  }

  if (state === "defect") {
    const defect = snapshot.defect ?? {};
    return [
      `${snapshot.dispatchId ?? "dispatch"} · defect`,
      `${defect.code ?? "defect"}: ${defect.message ?? "unknown defect"}`,
      footer(snapshot, false),
    ].join("\n");
  }

  const lines = [];
  const response = snapshot.result?.response;
  if (response) {
    lines.push(response);
    if (snapshot.result?.responseTruncated) lines.push("(response truncated)");
  }
  lines.push(footer(snapshot));
  return lines.filter(Boolean).join("\n");
}
