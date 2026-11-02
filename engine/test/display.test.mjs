import test from "node:test";
import assert from "node:assert/strict";
import { dispatchStatusBody, renderDispatchDisplay } from "../display.mjs";

const base = {
  dispatchId: "d-1",
  node: "review",
  workflow: "build-review",
  state: "completed",
  createdAt: "2026-01-01T00:00:00.000Z",
  startedAt: "2026-01-01T00:00:01.000Z",
  finishedAt: "2026-01-01T00:00:03.500Z",
  terminal: "done",
  visits: { implement: 1, review: 1, done: 1 },
  usage: { cost: 0.0123, tokens: { input: 120, output: 45 } },
  result: null,
};

test("display: completed terminal is focused and carries the footer", () => {
  const text = renderDispatchDisplay(base);
  assert.doesNotMatch(text, /output:/);
  assert.match(text, /d-1 · completed · terminal done · 3 visits · \$0\.0123 · 120 in \/ 45 out · 2\.5s/);
  assert.doesNotMatch(text, /"state"/);
});

test("display: a dispatcher response is the content", () => {
  const text = renderDispatchDisplay({
    ...base,
    terminal: null,
    handoff: { from: "review", label: "pass" },
    result: { response: "The review passed.", responseTruncated: false },
  });
  assert.match(text, /The review passed\./);
  assert.match(text, /handoff review · pass/);
});

test("display: truncated responses are marked", () => {
  const text = renderDispatchDisplay({
    ...base,
    result: { response: "long", responseTruncated: true },
  });
  assert.match(text, /long/);
  assert.match(text, /\(response truncated\)/);
});

test("display: defects, cancellation, and running states are readable", () => {
  const defect = renderDispatchDisplay({
    ...base,
    state: "defect",
    defect: { code: "handoff.none", message: "no handoff" },
  });
  assert.equal(defect.split("d-1 · defect").length - 1, 1);
  assert.match(defect, /handoff\.none: no handoff/);

  const cancelled = renderDispatchDisplay({ ...base, state: "cancelled", terminal: null });
  assert.equal(cancelled.split("d-1 · cancelled").length - 1, 1);

  const running = renderDispatchDisplay({
    ...base,
    state: "running",
    finishedAt: null,
    terminal: null,
    result: null,
  });
  assert.equal(running, "d-1 · running · review · workflow build-review");

  const queued = renderDispatchDisplay({ ...base, state: "queued", startedAt: null, finishedAt: null });
  assert.equal(queued, "d-1 · queued · review · workflow build-review");
});

test("display: status body carries the display beside the raw snapshot", () => {
  const body = dispatchStatusBody(base);
  assert.equal(body.ok, true);
  assert.equal(body.state, "completed");
  assert.equal(body.dispatchId, "d-1");
  assert.equal(body.display, renderDispatchDisplay(base));
  assert.doesNotMatch(body.display, /output:/);
});
