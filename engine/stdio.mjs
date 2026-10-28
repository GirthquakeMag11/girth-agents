// The stdio framing seam: versioned JSON-lines. encode/decode never
// throw on content — an unknown kind is a message like any other, and
// a malformed line comes back flagged, for the caller to log and ignore.

const VERSION = 1;

// The protocol vocabulary. Producers of some kinds land with later
// tickets; the framing carries every kind from day one.
export const POKES = [
  "activation-added",
  "activation-removed",
  "claim-input",
  "project-paused",
  "project-resumed",
];

export const NOTICES = [
  "ready",
  "step-began",
  "step-finished",
  "defect",
  "exit-committed",
  "heartbeat",
];

export function encode(kind, payload = {}) {
  return JSON.stringify({ v: VERSION, kind, ...payload });
}

export function decode(line) {
  try {
    return JSON.parse(line);
  } catch {
    return { malformed: true, line };
  }
}