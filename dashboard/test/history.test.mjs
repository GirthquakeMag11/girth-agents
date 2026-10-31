import test from "node:test";
import assert from "node:assert/strict";
import { runtimeFromMap } from "../src/data.mjs";
import { historyEmptyText, historyRow, historyRows, historyStripText, historyToneKey } from "../src/history.mjs";

const at = "2026-10-30T14:03:22.000Z";
const base = {
  seq: 1,
  at,
  kind: "queued",
  dispatchId: "d-4",
  workflow: "build-review",
  node: "implement",
  phase: null,
  outcome: null,
  label: null,
  from: null,
  to: null,
  status: null,
  terminal: null,
  code: null,
  valid: null,
};

function row(overrides = {}) {
  return historyRow({ ...base, ...overrides }, { timeZone: "UTC" });
}

test("history rows: every kind maps exactly", () => {
  assert.equal(row(), "14:03:22  d-4  queued · build-review · implement");
  assert.equal(row({ workflow: null }), "14:03:22  d-4  queued · node implement");
  assert.equal(row({ kind: "dispatched" }), "14:03:22  d-4  dispatched · implement");
  assert.equal(row({ kind: "step", phase: "begin" }), "14:03:22  d-4  implement · begin");
  assert.equal(
    row({ kind: "step", phase: "end", outcome: "succeeded", label: "next" }),
    "14:03:22  d-4  implement · end · succeeded · next",
  );
  assert.equal(
    row({ kind: "step", phase: "end", outcome: "succeeded", label: null }),
    "14:03:22  d-4  implement · end · succeeded · —",
  );
  assert.equal(
    row({ kind: "step", phase: "end", outcome: null, label: null }),
    "14:03:22  d-4  implement · end · — · —",
  );
  assert.equal(
    row({ kind: "handoff", from: "review", to: "implement", label: "fail" }),
    "14:03:22  d-4  review → implement · fail",
  );
  assert.equal(
    row({ kind: "completion", status: "completed", terminal: "done" }),
    "14:03:22  d-4  completed · done",
  );
  assert.equal(
    row({ kind: "completion", status: "cancelled", terminal: null }),
    "14:03:22  d-4  cancelled · —",
  );
  assert.equal(row({ kind: "defect", code: "session-failed" }), "14:03:22  d-4  defect · session-failed");
  assert.equal(
    row({ kind: "defect", dispatchId: null, code: "poke.malformed" }),
    "14:03:22  —  defect · poke.malformed",
  );
  assert.equal(row({ kind: "reloaded", dispatchId: null, valid: true }), "14:03:22  —  graph reloaded · valid");
  assert.equal(row({ kind: "reloaded", dispatchId: null, valid: false }), "14:03:22  —  graph reloaded · invalid");
});

test("history rows: missing values use the exact dash", () => {
  assert.equal(
    row({ workflow: null, node: null }),
    "14:03:22  d-4  queued · node —",
  );
  assert.equal(
    row({ kind: "handoff", from: null, to: null, label: null }),
    "14:03:22  d-4  — → — · —",
  );
  assert.equal(
    row({ kind: "completion", status: "completed", terminal: null }),
    "14:03:22  d-4  completed · —",
  );
  assert.equal(
    row({ kind: "defect", code: null }),
    "14:03:22  d-4  defect · —",
  );
});

test("history rows: empty pane and strip strings are exact", () => {
  assert.equal(historyRows([]).length, 0);
  assert.equal(historyEmptyText, "No activity yet.");
  assert.equal(historyStripText([]), "History · No activity yet.");
  const strip = historyStripText(
    [
      { ...base, seq: 1, kind: "queued" },
      { ...base, seq: 3, kind: "handoff", from: "review", to: "implement", label: "fail" },
      { ...base, seq: 2, kind: "dispatched" },
    ],
    { timeZone: "UTC" },
  );
  assert.equal(strip, "History · 14:03:22  d-4  review → implement · fail");
});

test("history rows: newest first uses seq, stable on equal timestamps", () => {
  const entries = [
    { ...base, seq: 1, at: "2026-10-30T14:03:22.000Z", kind: "queued" },
    { ...base, seq: 3, at: "2026-10-30T14:03:22.000Z", kind: "handoff", from: "review", to: "implement", label: "fail" },
    { ...base, seq: 2, at: "2026-10-30T14:03:22.000Z", kind: "dispatched" },
  ];
  assert.deepEqual(historyRows(entries, { timeZone: "UTC" }).map((entry) => entry.seq), [3, 2, 1]);
});

test("history rows: absent seq falls back to reverse array order", () => {
  const entries = [
    { ...base, seq: undefined, kind: "queued" },
    { ...base, seq: undefined, kind: "dispatched" },
    { ...base, seq: undefined, kind: "handoff", from: "review", to: "implement", label: "fail" },
  ];
  assert.deepEqual(historyRows(entries, { timeZone: "UTC" }).map((entry) => entry.entry.kind), ["handoff", "dispatched", "queued"]);
});

test("history rows: extra entry keys are ignored and timestamps are deterministic", () => {
  const entry = { ...base, at: "2026-10-30T14:03:22.000Z", secret: "not rendered", sessionId: "s-1" };
  assert.equal(historyRow(entry, { timeZone: "UTC" }), "14:03:22  d-4  queued · build-review · implement");
  assert.equal(historyRow({ ...entry, at: "not-a-date" }, { timeZone: "UTC" }), "—  d-4  queued · build-review · implement");
});

test("history adapter: history and epoch pass through with safe defaults", () => {
  const map = {
    runtime: {
      active: null,
      queue: [],
      lastDefect: null,
      lastEvent: null,
      history: [{ ...base }],
      historyEpoch: "boot-one",
    },
  };
  const runtime = runtimeFromMap(map);
  assert.deepEqual(runtime.history, [base]);
  assert.equal(runtime.historyEpoch, "boot-one");

  const missing = runtimeFromMap({ runtime: { active: null, queue: [], lastDefect: null, lastEvent: null } });
  assert.deepEqual(missing.history, []);
  assert.equal(missing.historyEpoch, "");

  const malformed = runtimeFromMap({
    runtime: { active: null, queue: [], history: "Active: no", historyEpoch: 42 },
  });
  assert.deepEqual(malformed.history, []);
  assert.equal(malformed.historyEpoch, "");
});


test("history rows: adding a row does not change the tone or text of existing rows", () => {
  const first = { ...base, seq: 1, kind: "queued" };
  const second = { ...base, seq: 2, kind: "handoff", from: "review", to: "implement", label: "fail" };
  const before = historyRows([first, second], { timeZone: "UTC" }).map((row) => ({
    text: row.text,
    tone: historyToneKey(row.entry),
  }));
  const after = historyRows([first, second, { ...base, seq: 3, kind: "completion", status: "completed", terminal: "done" }], {
    timeZone: "UTC",
  })
    .filter((row) => row.seq !== 3)
    .map((row) => ({ text: row.text, tone: historyToneKey(row.entry) }));
  assert.deepEqual(after, before);
  assert.equal(historyToneKey(second), "error");
});
