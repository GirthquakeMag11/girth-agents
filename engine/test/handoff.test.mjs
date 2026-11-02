import test from "node:test";
import assert from "node:assert/strict";
import { claimHandoff, createHandoffHandler } from "../handoff.mjs";
import { ControlError } from "../errors.mjs";
import { DispatchDefect } from "../executor.mjs";

test("handoff: concurrent calls claim the handoff synchronously", () => {
  const active = { handoff: null, handoffPending: false, handoffDefect: null };
  const node = { id: "review" };
  assert.equal(claimHandoff(active, node, DispatchDefect), null);
  assert.equal(active.handoffPending, true);

  const second = claimHandoff(active, node, DispatchDefect);
  assert.equal(second.kind, "handoff.multiple");
  assert.equal(active.handoffDefect, second);

  active.handoffPending = false;
  active.handoff = { label: "pass" };
  assert.equal(claimHandoff(active, node, DispatchDefect).kind, "handoff.multiple");
});

const graph = {
  workflows: [
    { id: "build-review", entry: "review", exit: "done", nodes: ["review", "done"], connections: [], strict: true },
  ],
  nodes: [
    {
      id: "review",
      handoff: {
        mode: "conditional",
        labels: [
          { label: "pass", to: "done", description: "finish" },
          { label: "fail", to: "implement", description: "rework" },
        ],
      },
    },
    { id: "done", handoff: { mode: "terminal" } },
  ],
};

function activeRecord(overrides = {}) {
  return {
    id: "d-1",
    sessionId: "s1",
    workflow: "build-review",
    nodeDef: graph.nodes[0],
    handoff: null,
    handoffDefect: null,
    handoffPending: false,
    ...overrides,
  };
}

function handlerWith(active) {
  return createHandoffHandler({
    getQueue: () => ({ active }),
    getConfig: () => ({ graph }),
    Defect: DispatchDefect,
  });
}

test("handoff handler: a non-terminal node accepts a message without any output field", async () => {
  const active = activeRecord();
  const result = await handlerWith(active)({
    sessionID: "s1",
    label: "pass",
    message: "The work meets the objective.",
    callID: "call-1",
  });

  assert.deepEqual(result, { ok: true, label: "pass" });
  assert.equal(active.handoff.label, "pass");
  assert.equal(active.handoff.message, "The work meets the objective.");
  assert.equal(active.handoff.callID, "call-1");
  assert.ok(!Number.isNaN(Date.parse(active.handoff.at)));
  assert.deepEqual(Object.keys(active.handoff).sort(), ["at", "callID", "label", "message"]);
  assert.equal("outputHash" in active.handoff, false);
  assert.equal("outputPath" in active.handoff, false);
  assert.equal(active.handoffDefect, null);
  assert.equal(active.handoffPending, false);
});

test("handoff handler: an undeclared label is rejected and releases the claim", async () => {
  const active = activeRecord();
  await assert.rejects(
    () => handlerWith(active)({ sessionID: "s1", label: "ship", message: "ship it" }),
    (error) => error instanceof ControlError && error.status === 422 && /handoff\.unknown-tool/.test(error.message),
  );
  assert.equal(active.handoff, null);
  assert.equal(active.handoffPending, false);
  assert.equal(active.handoffDefect, null);
});

test("handoff handler: another session cannot hand off the active node", async () => {
  const active = activeRecord();
  await assert.rejects(
    () => handlerWith(active)({ sessionID: "s2", label: "pass", message: "done" }),
    (error) => error instanceof ControlError && error.status === 403,
  );
  assert.equal(active.handoff, null);
});

test("handoff handler: a terminal node takes no handoff", async () => {
  const active = activeRecord({ nodeDef: graph.nodes[1] });
  await assert.rejects(
    () => handlerWith(active)({ sessionID: "s1", label: "pass", message: "done" }),
    (error) => error instanceof ControlError && error.status === 422 && /terminal/.test(error.message),
  );
  assert.equal(active.handoff, null);
});

test("handoff handler: a second handoff on one node is a conflict", async () => {
  const active = activeRecord();
  const handler = handlerWith(active);
  const accepted = await handler({ sessionID: "s1", label: "pass", message: "first", callID: "call-1" });
  assert.deepEqual(accepted, { ok: true, label: "pass" });
  await assert.rejects(
    () => handler({ sessionID: "s1", label: "pass", message: "second", callID: "call-2" }),
    (error) => error instanceof ControlError && error.status === 409,
  );
  assert.equal(active.handoff.message, "first");
  assert.equal(active.handoff.callID, "call-1");
  assert.equal(active.handoffDefect.kind, "handoff.multiple");
});
