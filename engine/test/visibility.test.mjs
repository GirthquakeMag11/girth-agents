import test from "node:test";
import assert from "node:assert/strict";
import { handoffLabelsMatch, handoffMessageError, handoffPreflightError, handoffToolState, handoffVisibilityFailure } from "../visibility.mjs";
import { handoffTarget } from "../config.mjs";
import { DispatchDefect } from "../executor.mjs";

const review = {
  id: "review",
  handoff: {
    mode: "conditional",
    labels: [
      { label: "pass", to: "done" },
      { label: "fail", to: "implement" },
    ],
  },
};

const active = {
  sessionId: "s1",
  nodeDef: review,
  handoff: null,
};

test("visibility: active nodes get their labels and revision", () => {
  const state = handoffToolState({ active, sessionID: "s1", revision: 3 });
  assert.deepEqual(state.labels, ["pass", "fail"]);
  assert.equal(state.revision, "3:review:open");
});

test("visibility: unknown, unrelated, terminal, and post-handoff sessions get none", () => {
  assert.deepEqual(handoffToolState({ active, sessionID: "other", revision: 3 }).labels, []);
  assert.deepEqual(handoffToolState({ active: null, sessionID: "s1", revision: 3 }).labels, []);
  assert.deepEqual(
    handoffToolState({
      active: { ...active, nodeDef: { id: "end", handoff: { mode: "terminal" } } },
      sessionID: "s1",
      revision: 3,
    }).labels,
    [],
  );
  assert.deepEqual(
    handoffToolState({
      active: { ...active, handoff: { label: "pass" } },
      sessionID: "s1",
      revision: 3,
    }).labels,
    [],
  );
});

test("visibility: preflight fails closed and names collisions", () => {
  assert.equal(handoffPreflightError(null).code, "handoff.preflight-unavailable");
  assert.equal(
    handoffPreflightError({ collisions: [], catalogAvailable: false }).code,
    "handoff.preflight-unavailable",
  );
  assert.equal(
    handoffPreflightError({ collisions: ["pass"], catalogAvailable: true }).code,
    "handoff.tool-collision",
  );
  assert.equal(handoffPreflightError({ collisions: [], catalogAvailable: true }), null);
});

test("visibility: messages and undeclared labels are rejected", () => {
  assert.equal(handoffMessageError(undefined), "handoff.message-required");
  assert.equal(handoffMessageError("   "), "handoff.message-empty");
  assert.equal(handoffMessageError("ok"), null);
  assert.equal(handoffTarget(review, "missing"), null);
  assert.equal(handoffTarget(review, "pass"), "done");
});

test("visibility: a resumed session gets its active node labels", () => {
  const resumed = {
    sessionId: "s-retained",
    nodeDef: review,
    handoff: null,
  };
  const state = handoffToolState({ active: resumed, sessionID: "s-retained", revision: 4 });
  assert.deepEqual(state.labels, ["pass", "fail"]);
  assert.equal(state.revision, "4:review:open");
});

test("visibility: a lookup failure records the dispatch defect", () => {
  const active = { sessionId: "s1", nodeDef: { id: "review" }, handoff: null };
  const defect = handoffVisibilityFailure(active, new Error("catalog broke"), DispatchDefect);
  assert.equal(active.handoffDefect, defect);
  assert.equal(active.handoffDefect.kind, "handoff.visibility-unavailable");
  assert.match(defect.message, /review/);
  assert.match(defect.message, /catalog broke/);
});

test("visibility: the reported label set must match the boot config", () => {
  assert.equal(handoffLabelsMatch(["pass", "next"], ["next", "pass"]), true);
  assert.equal(handoffLabelsMatch(["pass"], ["pass", "next"]), false);
  assert.equal(handoffLabelsMatch([], []), true);
});
