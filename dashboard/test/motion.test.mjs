import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceHistoryCursor,
  nextRunner,
  nodeSweeps,
  routeForHandoff,
  runnerPoint,
  runnerProgress,
  runnerRemaining,
  runnerToken,
  runnerToneKey,
  sweepCells,
  sweepOffset,
} from "../src/motion.mjs";

test("motion: the border sweep has an exact period and 34-cell wrap", () => {
  assert.equal(sweepOffset(34, 0), 0);
  assert.equal(sweepOffset(34, 249), 0);
  assert.equal(sweepOffset(34, 250), 1);
  assert.equal(sweepOffset(34, 7750), 0);
  assert.equal(sweepOffset(34, 8000), 1);
  assert.equal(sweepOffset(6, 250), 1);
  assert.equal(sweepOffset(6, 750), 0);
  assert.equal(sweepOffset(7, 500), 2);
  assert.equal(sweepOffset(7, 1000), 0);
});

test("motion: the sweep is exactly two cells on the top border, starting x+1", () => {
  const start = sweepCells(10, 34, 0);
  assert.deepEqual(start, { x: 11, yOffset: 0, width: 2, glyph: "━━", inside: true });
  const wrapped = sweepCells(10, 34, 7750);
  assert.equal(wrapped.x, 11);
  const last = sweepCells(10, 34, 7500);
  assert.equal(last.x, 41);
  assert.equal(last.inside, true);
  assert.equal(sweepCells(10, 5, 0), null);
});

test("motion: only running cards at least six cells wide sweep", () => {
  assert.equal(nodeSweeps("running", 34), true);
  assert.equal(nodeSweeps("running", 6), true);
  assert.equal(nodeSweeps("running", 5), false);
  assert.equal(nodeSweeps("queued", 34), false);
  assert.equal(nodeSweeps("idle", 34), false);
  assert.equal(nodeSweeps("terminal", 34), false);
});

test("motion: history cursor does not replay existing handoffs on mount", () => {
  const history = [
    { seq: 1, kind: "queued" },
    { seq: 2, kind: "handoff", from: "implement", to: "review", label: "next" },
  ];
  const next = advanceHistoryCursor(history, "boot-one", { epoch: undefined, watermark: 0 });
  assert.equal(next.reset, true);
  assert.equal(next.handoff, null);
  assert.deepEqual(next.cursor, { epoch: "boot-one", watermark: 2 });
});

test("motion: one new handoff animates and two new handoffs animate only the highest", () => {
  const first = advanceHistoryCursor(
    [
      { seq: 1, kind: "queued" },
      { seq: 2, kind: "handoff", from: "implement", to: "review", label: "next" },
    ],
    "boot-one",
    { epoch: "boot-one", watermark: 1 },
  );
  assert.equal(first.handoff.seq, 2);
  assert.deepEqual(first.cursor, { epoch: "boot-one", watermark: 2 });

  const second = advanceHistoryCursor(
    [
      { seq: 1, kind: "queued" },
      { seq: 2, kind: "handoff", from: "implement", to: "review", label: "next" },
      { seq: 3, kind: "step", phase: "begin", node: "review" },
      { seq: 4, kind: "handoff", from: "review", to: "implement", label: "fail" },
    ],
    "boot-one",
    { epoch: "boot-one", watermark: 1 },
  );
  assert.equal(second.handoff.seq, 4);
  assert.deepEqual(second.cursor, { epoch: "boot-one", watermark: 4 });
});

test("motion: an epoch change resets even when the new maximum is equal or higher", () => {
  for (const max of [5, 9]) {
    const next = advanceHistoryCursor(
      [
        { seq: 1, kind: "queued" },
        { seq: max, kind: "handoff", from: "review", to: "implement", label: "fail" },
      ],
      "boot-two",
      { epoch: "boot-one", watermark: 5 },
    );
    assert.equal(next.reset, true);
    assert.equal(next.handoff, null);
    assert.deepEqual(next.cursor, { epoch: "boot-two", watermark: max });
  }
});

test("motion: non-handoff entries advance the watermark and suppress stale handoffs", () => {
  const next = advanceHistoryCursor(
    [
      { seq: 1, kind: "handoff", from: "implement", to: "review", label: "next" },
      { seq: 2, kind: "queued" },
      { seq: 3, kind: "dispatched" },
    ],
    "boot-one",
    { epoch: "boot-one", watermark: 1 },
  );
  assert.equal(next.handoff, null);
  assert.deepEqual(next.cursor, { epoch: "boot-one", watermark: 3 });
});

test("motion: empty history uses watermark zero", () => {
  const next = advanceHistoryCursor([], "boot-one", { epoch: "boot-one", watermark: 4 });
  assert.equal(next.handoff, null);
  assert.deepEqual(next.cursor, { epoch: "boot-one", watermark: 0 });
});

test("motion: runner path interpolation follows segments and self-handoffs have no route", () => {
  const path = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];
  assert.deepEqual(runnerPoint(path, 0), { x: 0, y: 0 });
  assert.deepEqual(runnerPoint(path, 0.5), { x: 10, y: 0 });
  assert.deepEqual(runnerPoint(path, 1), { x: 10, y: 10 });
  assert.deepEqual(runnerPoint([], 0.5), null);

  const routes = [
    { from: "review", to: "implement", path },
    { from: "x", to: "x", path: [] },
  ];
  assert.equal(routeForHandoff(routes, "review", "implement").path, path);
  assert.equal(routeForHandoff(routes, "x", "x"), undefined);
  assert.equal(routeForHandoff(routes, "missing", "implement"), undefined);
});


test("motion: a newer handoff replaces the earlier runner token", () => {
  const previous = { from: "implement", to: "review", label: "next", start: 1000 };
  const next = nextRunner(previous, { from: "review", to: "implement", label: "fail" }, 2000);
  assert.deepEqual(next, { from: "review", to: "implement", label: "fail", start: 2000 });
  assert.equal(nextRunner(previous, null, 2000), previous);
});

test("motion: runner tokens are on-path, expire at 900ms, and self-handoffs emit none", () => {
  const routes = [
    {
      from: "review",
      to: "implement",
      runnerPath: [
        { x: 10, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
      ],
    },
    { from: "x", to: "x", runnerPath: [] },
  ];
  const runner = { from: "review", to: "implement", label: "fail", start: 1000 };
  const token = runnerToken(runner, routes, 1450);
  assert.deepEqual(token.point, { x: 20, y: 0 });
  assert.equal(token.label, "fail");
  assert.equal(runnerToken(runner, routes, 1899).point.y > 0, true);
  assert.equal(runnerToken(runner, routes, 1900), null);
  assert.equal(runnerToken({ from: "x", to: "x", label: "next", start: 1000 }, routes, 1100), null);
  assert.equal(runnerToken({ from: "missing", to: "implement", label: "next", start: 1000 }, routes, 1100), null);

  const coveredRoutes = [
    {
      from: "b",
      to: "d",
      runnerPath: [
        { x: 0, y: 0 },
        { x: 0, y: 10 },
      ],
      label: { x: 0, y: 5, width: 2 },
    },
  ];
  assert.equal(
    runnerToken({ from: "b", to: "d", label: "next", start: 1000 }, coveredRoutes, 1450),
    null,
    "a token must not paint over a label chip",
  );
  assert.equal(
    runnerToken({ from: "b", to: "d", label: "next", start: 1000 }, coveredRoutes, 1495),
    null,
    "a fractional vertical point floors onto the chip row and must be suppressed",
  );
  assert.notEqual(runnerToken({ from: "b", to: "d", label: "next", start: 1000 }, coveredRoutes, 1400), null);
});

test("motion: runner tones and the 900ms lifetime are exact", () => {
  assert.equal(runnerToneKey("pass"), "success");
  assert.equal(runnerToneKey("fail"), "error");
  assert.equal(runnerToneKey("next"), "muted");
  assert.equal(runnerToneKey("other"), "faint");
  assert.equal(runnerProgress(1000, 1000), 0);
  assert.equal(runnerProgress(1000, 1899), 899 / 900);
  assert.equal(runnerProgress(1000, 1900), 1);
});


test("motion: the runner timer has an exact remaining lifetime", () => {
  assert.equal(runnerRemaining(1000, 1000), 900);
  assert.equal(runnerRemaining(1000, 1899), 1);
  assert.equal(runnerRemaining(1000, 1900), 0);
  assert.equal(runnerRemaining(1000, 2000), -100);
});
