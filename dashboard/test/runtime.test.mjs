import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { hydrateRuntime, runtimeFromMap } from "../src/data.mjs";
import { nodeState } from "../src/model.mjs";

const terminalNode = { id: "review", handoff: { mode: "terminal" } };

test("runtime: a human-readable state string cannot drive active or queue state", () => {
  const stateString = "Active: d-1 at review. Queue: d-2 at implement.";
  assert.throws(() => runtimeFromMap({ state: stateString }), /structured runtime/);

  const runtime = runtimeFromMap({
    state: stateString,
    runtime: { active: null, queue: [], lastDefect: null, lastEvent: { kind: "heartbeat" } },
  });
  assert.equal(runtime.active, null);
  assert.deepEqual(runtime.queue, []);

  assert.equal(nodeState(terminalNode, { state: stateString }, []).color, "terminal");
  assert.equal(nodeState(terminalNode, null, [{ state: stateString }]).color, "terminal");
});

test("runtime: dispatch/status hydrates the structured active and queued records", async () => {
  const calls = [];
  const runtime = {
    paused: false,
    active: { dispatchId: "d-1", node: "implement", state: "queued" },
    queue: [{ dispatchId: "d-2", node: "review", state: "queued" }],
    lastDefect: null,
    lastEvent: null,
  };
  const hydrated = await hydrateRuntime(runtime, async (dispatchId) => {
    calls.push(dispatchId);
    if (dispatchId === "d-2") throw new Error("gone");
    return {
      ok: true,
      dispatchId,
      node: "implement",
      workflow: "build-review",
      state: "running",
      visits: { implement: 2 },
      usage: { cost: 0.25, tokens: { input: 10, output: 4 } },
    };
  });

  assert.deepEqual(calls.sort(), ["d-1", "d-2"]);
  assert.equal(hydrated.active.state, "running");
  assert.equal(hydrated.active.workflow, "build-review");
  assert.equal(hydrated.active.visits.implement, 2);
  assert.equal(hydrated.active.usage.cost, 0.25);
  assert.equal(hydrated.queue[0].state, "queued");
  assert.equal(hydrated.queue[0].dispatchId, "d-2");
});

test("runtime: the data adapter keeps dispatch/status and never reads graph-map.state", async () => {
  const source = await readFile(new URL("../src/data.mjs", import.meta.url), "utf8");
  assert.match(source, /\/tool\/dispatch\/status/);
  assert.doesNotMatch(source, /\.state\b/);
  assert.doesNotMatch(source, /Active:|Queue:/);
});
