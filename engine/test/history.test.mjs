import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createActivityHistory, getActivityHistory, HISTORY_FIELDS, workflowForEvent } from "../history.mjs";

const FIELDS = [
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

test("history: every entry has exactly the allowlisted fields", () => {
  assert.deepEqual(HISTORY_FIELDS, FIELDS);
  const history = createActivityHistory({ epoch: "boot-one" });
  const inputs = [
    ["queued", { dispatchId: "d-1", node: "implement", workflow: "build-review", at: "2026-01-01T00:00:00.000Z" }],
    ["step", { dispatchId: "d-1", node: "implement", phase: "begin" }],
    ["handoff", { dispatchId: "d-1", from: "implement", to: "review", label: "next" }],
    ["defect", { dispatchId: "d-1", code: "session-failed", message: "secret", sessionId: "s-1" }],
    ["completion", { dispatchId: "d-1", status: "completed", terminal: "done", defect: null }],
    ["reloaded", { valid: true, faults: [], configPath: "/secret" }],
  ];
  for (const [kind, payload] of inputs) {
    const entry = history.append(kind, payload);
    if (entry) assert.deepEqual(Object.keys(entry).sort(), [...FIELDS].sort());
    assert.deepEqual(Object.keys(history.snapshot().at(-1) ?? {}).sort(), [...FIELDS].sort());
  }
});

test("history: projections cover dispatch, step, handoff, completion, defect, reload", () => {
  const history = createActivityHistory({ epoch: "boot-one" });
  history.append("queued", { dispatchId: "d-1", node: "implement", workflow: "build-review", at: "2026-01-01T00:00:00.000Z" });
  history.append("dispatched", { dispatchId: "d-1", node: "implement", at: "2026-01-01T00:00:01.000Z" });
  history.append("step", { dispatchId: "d-1", node: "implement", phase: "begin", sessionId: "s-1" }, { workflow: "build-review" });
  history.append("step", {
    dispatchId: "d-1",
    node: "implement",
    phase: "end",
    outcome: "succeeded",
    label: "next",
    sessionMode: "fresh",
    resumed: false,
    usage: { cost: 1, tokens: { input: 2, output: 3 } },
  }, { workflow: "build-review" });
  history.append("handoff", { dispatchId: "d-1", from: "implement", to: "review", label: "next" }, { workflow: "build-review" });
  history.append("defect", { dispatchId: "d-1", code: "session-failed", message: "session s-1 failed" }, { workflow: "build-review" });
  const completion = history.append("completion", {
    dispatchId: "d-1",
    status: "defect",
    terminal: null,
    defect: { code: "session-failed", message: "session s-1 failed" },
  }, { workflow: "build-review" });
  assert.equal(completion, null, "a dispatch defect must not be duplicated by a completion row");
  history.append("completion", { dispatchId: "d-2", status: "completed", terminal: "done", defect: null }, { workflow: "build-review" });
  history.append("completion", { dispatchId: "d-3", status: "cancelled", terminal: null, defect: null }, { workflow: "build-review" });
  history.append("reloaded", { valid: false, faults: [{ code: "schema.unknown-field" }], configPath: "/secret" });

  const entries = history.snapshot();
  assert.deepEqual(entries.map((entry) => entry.seq), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(entries[0].workflow, "build-review");
  assert.equal(entries[2].phase, "begin");
  assert.equal(entries[3].outcome, "succeeded");
  assert.equal(entries[3].label, "next");
  assert.equal(entries[4].from, "implement");
  assert.equal(entries[4].to, "review");
  assert.equal(entries[5].code, "session-failed");
  assert.equal(entries[6].kind, "completion");
  assert.equal(entries[6].status, "completed");
  assert.equal(entries[6].terminal, "done");
  assert.equal(entries[7].kind, "completion");
  assert.equal(entries[7].status, "cancelled");
  assert.equal(entries[7].terminal, null);
  assert.equal(entries[8].kind, "reloaded");
  assert.equal(entries[8].valid, false);
  assert.equal(entries[8].dispatchId, null);
});

test("history: workflow enrichment falls back to null", () => {
  const history = createActivityHistory({ epoch: "boot-one" });
  const lookup = (id) => (id === "d-1" ? { workflow: "build-review" } : null);
  assert.equal(workflowForEvent({ dispatchId: "d-1" }, lookup), "build-review");
  assert.equal(workflowForEvent({ dispatchId: "missing" }, lookup), null);
  assert.equal(workflowForEvent({ dispatchId: "d-1" }), null);
  assert.equal(workflowForEvent({ workflow: null, dispatchId: "d-1" }, lookup), null);

  const noWorkflow = history.append("dispatched", { dispatchId: "d-1", node: "implement" });
  assert.equal(noWorkflow.workflow, null);
  const enriched = history.append("handoff", { dispatchId: "d-1", from: "implement", to: "review", label: "next" }, { workflow: "build-review" });
  assert.equal(enriched.workflow, "build-review");
  const engineDefect = history.append("defect", { code: "poke.malformed" });
  assert.equal(engineDefect.dispatchId, null);
  assert.equal(engineDefect.workflow, null);
  const reload = history.append("reloaded", { valid: true });
  assert.equal(reload.dispatchId, null);
  assert.equal(reload.workflow, null);
});

test("history: an orphan defect completion is kept as a defect row", () => {
  const history = createActivityHistory({ epoch: "boot-one" });
  const entry = history.append("completion", {
    dispatchId: "d-orphan",
    status: "defect",
    terminal: null,
    defect: { code: "internal", message: "secret" },
  });
  assert.equal(entry.kind, "defect");
  assert.equal(entry.dispatchId, "d-orphan");
  assert.equal(entry.code, "internal");
  assert.equal(JSON.stringify(entry).includes("secret"), false);
});

test("history: timestamps are captured once and ISO formatted when absent", () => {
  const history = createActivityHistory({ epoch: "boot-one" });
  const explicit = history.append("queued", { dispatchId: "d-1", node: "implement", at: "2026-01-01T00:00:00.000Z" });
  const stamped = history.append("dispatched", { dispatchId: "d-1", node: "implement" });
  assert.equal(explicit.at, "2026-01-01T00:00:00.000Z");
  assert.match(stamped.at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test("history: ring caps at 100, stays chronological, and seq is monotonic", () => {
  const history = createActivityHistory({ epoch: "boot-one" });
  for (let index = 0; index < 105; index += 1) {
    history.append("dispatched", { dispatchId: `d-${index}`, node: "implement", at: `2026-01-01T00:00:${String(index).padStart(2, "0")}.000Z` });
  }
  const entries = history.snapshot();
  assert.equal(entries.length, 100);
  assert.equal(entries[0].seq, 6);
  assert.equal(entries.at(-1).seq, 105);
  assert.deepEqual(
    entries.map((entry) => entry.seq),
    Array.from({ length: 100 }, (_, index) => index + 6),
  );
});

test("history: two engine boots have different non-empty epochs and reset history/seq", () => {
  const first = createActivityHistory();
  first.append("dispatched", { dispatchId: "d-1", node: "implement" });
  const second = createActivityHistory();
  assert.ok(first.epoch);
  assert.ok(second.epoch);
  assert.notEqual(first.epoch, second.epoch);
  assert.equal(second.snapshot().length, 0);
  assert.equal(second.append("dispatched", { dispatchId: "d-1", node: "implement" }).seq, 1);
});

test("history: the process ring is a shared singleton", () => {
  const panelA = getActivityHistory();
  const panelB = getActivityHistory();
  assert.equal(panelA, panelB);
  panelA.append("queued", { dispatchId: "shared-1", node: "implement", workflow: "build-review" });
  assert.equal(panelB.snapshot().some((entry) => entry.dispatchId === "shared-1"), true);
});

test("history: heartbeat, ready, version, paused, and resumed are excluded", () => {
  const history = createActivityHistory({ epoch: "boot-one" });
  for (const kind of ["heartbeat", "ready", "version", "paused", "resumed"]) {
    assert.equal(history.append(kind, { dispatchId: "d-1" }), null);
  }
  assert.deepEqual(history.snapshot(), []);
});

test("history: forbidden payload fields never reach entries", () => {
  const history = createActivityHistory({ epoch: "boot-one" });
  const entry = history.append("step", {
    dispatchId: "d-1",
    node: "implement",
    phase: "end",
    sessionId: "session-secret",
    upstream: "/work/secret.md",
    sessionMode: "resume",
    usage: { cost: 99, tokens: { input: 100, output: 200 } },
    prompt: "do not copy",
    output: { path: "/work/secret.md", hash: "secret" },
    message: "secret failure",
  });
  const text = JSON.stringify(entry);
  for (const forbidden of ["session-secret", "upstream", "sessionMode", "resume", "cost", "tokens", "prompt", "secret failure"]) {
    assert.equal(text.includes(forbidden), false, `${forbidden} leaked into history`);
  }
});


test("history: engine shutdown cancellation uses the event sink", async () => {
  const source = await readFile(new URL("../engine.mjs", import.meta.url), "utf8");
  assert.match(source, /event\("completion", \{\s*dispatchId: active\.id/);
});
