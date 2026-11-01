import { nodeHandoffLabels } from "./config.mjs";

export function handoffToolState({ active, sessionID, revision }) {
  if (!active || typeof sessionID !== "string" || sessionID !== active.sessionId) {
    return { labels: [], revision: `${revision}:none` };
  }
  const node = active.nodeDef;
  if (!node || node.handoff.mode === "terminal" || active.handoff) {
    return { labels: [], revision: `${revision}:${node?.id ?? "none"}:closed` };
  }
  return {
    labels: nodeHandoffLabels(node),
    revision: `${revision}:${node.id}:open`,
  };
}

export function handoffLabelsMatch(labels, expected) {
  const a = [...(labels ?? [])].sort();
  const b = [...(expected ?? [])].sort();
  return a.length === b.length && a.every((label, index) => label === b[index]);
}

export function handoffPreflightError(preflight) {
  if (!preflight || preflight.catalogAvailable === false) {
    return {
      code: "handoff.preflight-unavailable",
      message: "the handoff plugin did not report its tool catalog",
    };
  }
  if (Array.isArray(preflight.collisions) && preflight.collisions.length > 0) {
    return {
      code: "handoff.tool-collision",
      message: preflight.collisions.join(", "),
    };
  }
  return null;
}

export function handoffVisibilityFailure(active, error, Defect) {
  const defect = new Defect(
    "handoff.visibility-unavailable",
    `handoff tool lookup failed${active?.nodeDef ? ` for '${active.nodeDef.id}'` : ""}: ${error?.message ?? String(error)}`,
  );
  if (active) active.handoffDefect = defect;
  return defect;
}

export function handoffMessageError(message) {
  if (typeof message !== "string") return "handoff.message-required";
  if (message.trim() === "") return "handoff.message-empty";
  return null;
}
