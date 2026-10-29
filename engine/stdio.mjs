// The stdio framing seam: versioned JSON-lines. encode/decode never throw
// on content — an unknown kind is a message like any other, and a malformed
// line comes back flagged, for the caller to log and ignore.

const VERSION = 2;

export const POKES = [
  "dispatch",
  "dispatch-status",
  "dispatch-wait",
  "pause",
  "resume",
  "reload",
  "introspect",
];

export const NOTICES = [
  "version",
  "ready",
  "queued",
  "dispatched",
  "step",
  "handoff",
  "paused",
  "resumed",
  "completion",
  "defect",
  "dispatch-status",
  "dispatch-result",
  "reloaded",
  "introspection",
  "heartbeat",
];

export function encode(kind, payload = {}) {
  return JSON.stringify({ v: VERSION, kind, ...payload });
}

export function decode(line) {
  try {
    const msg = JSON.parse(line);
    if (msg === null || typeof msg !== "object" || Array.isArray(msg)) {
      return { malformed: true, line };
    }
    return msg;
  } catch {
    return { malformed: true, line };
  }
}
