import test from "node:test";
import assert from "node:assert/strict";
import { claimHandoff, handoffOutput } from "../handoff.mjs";
import { DispatchDefect } from "../executor.mjs";

test("handoff: no-output nodes skip the file check", async () => {
  let called = false;
  const output = await handoffOutput({ outputPath: null }, async () => {
    called = true;
    return { hash: "x" };
  });
  assert.equal(output, null);
  assert.equal(called, false);
});

test("handoff: declared outputs use the file check", async () => {
  let seen = null;
  const output = await handoffOutput({ outputPath: "/tmp/a.md" }, async (path) => {
    seen = path;
    return { hash: "x", path };
  });
  assert.equal(seen, "/tmp/a.md");
  assert.equal(output.hash, "x");
});

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
