import test from "node:test";
import assert from "node:assert/strict";
import { claimHandoff } from "../handoff.mjs";
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
