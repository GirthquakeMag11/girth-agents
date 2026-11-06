const DASH = "—";
export const historyEmptyText = "No activity yet.";

function value(input) {
  return typeof input === "string" && input !== "" ? input : DASH;
}

export function formatHistoryTime(at, timeZone) {
  const date = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(date.getTime())) return DASH;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

function unconditionalIds(nodes) {
  return new Set(
    (nodes ?? [])
      .filter((node) => node?.handoff?.mode === "unconditional")
      .map((node) => node.id),
  );
}

function summary(entry, unconditional) {
  switch (entry.kind) {
    case "queued":
      return entry.workflow
        ? `queued · ${value(entry.workflow)} · ${value(entry.node)}`
        : `queued · node ${value(entry.node)}`;
    case "dispatched":
      return `dispatched · ${value(entry.node)}`;
    case "step":
      if (entry.phase === "begin") return `${value(entry.node)} · begin`;
      if (entry.phase === "end") {
        const end = `${value(entry.node)} · end · ${value(entry.outcome)}`;
        return unconditional.has(entry.node) ? end : `${end} · ${value(entry.label)}`;
      }
      return `${value(entry.node)} · ${value(entry.phase)}`;
    case "handoff": {
      const from = value(entry.from);
      const to = value(entry.to);
      // The label sits on the arrow between the nodes; an unconditional
      // handoff has no label, so nothing goes between the nodes.
      if (unconditional.has(entry.from) || !entry.label) return `${from} -> ${to}`;
      return `${from} -${entry.label}-> ${to}`;
    }
    case "completion":
      if (entry.status === "defect") return `defect · ${value(entry.code)}`;
      return `${value(entry.status)} · ${value(entry.terminal)}`;
    case "defect":
      return `defect · ${value(entry.code)}`;
    case "reloaded":
      return `graph reloaded · ${entry.valid ? "valid" : "invalid"}`;
    default:
      return value(entry.kind);
  }
}

export function historyToneKey(entry) {
  if (entry.kind === "handoff") {
    if (entry.label === "pass") return "success";
    if (entry.label === "fail") return "error";
    if (entry.label === "handoff") return "muted";
    return "faint";
  }
  if (entry.kind === "queued") return "warning";
  if (entry.kind === "completion") {
    if (entry.status === "completed") return "success";
    if (entry.status === "cancelled") return "warning";
    return "error";
  }
  if (entry.kind === "defect") return "error";
  if (entry.kind === "reloaded") return "faint";
  return "muted";
}

export function historyRow(entry, options = {}, unconditional = new Set()) {
  return `${formatHistoryTime(entry.at, options.timeZone)}  ${value(entry.dispatchId)}  ${summary(entry, unconditional)}`;
}

export function historyRows(history = [], options = {}) {
  const unconditional = unconditionalIds(options.nodes);
  return history
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const seqA = Number(a.entry.seq) || 0;
      const seqB = Number(b.entry.seq) || 0;
      return seqB - seqA || b.index - a.index;
    })
    .map(({ entry }) => ({
      seq: Number(entry.seq) || 0,
      entry,
      text: historyRow(entry, options, unconditional),
    }));
}

export function historyStripText(history = [], options = {}) {
  const rows = historyRows(history, options);
  return rows.length > 0 ? `History · ${rows[0].text}` : `History · ${historyEmptyText}`;
}
