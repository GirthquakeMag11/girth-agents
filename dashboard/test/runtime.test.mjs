import test from "node:test";
import assert from "node:assert/strict";
import { snapshotToDashboard } from "../src/data.mjs";
import { nodeState } from "../src/model.mjs";

const terminalHandoffNode = { id: "review", handoff: { mode: "terminal" } };

function snapshot(overrides = {}) {
  return {
    ok: true,
    config: {
      version: "6",
      agents: [],
      graph: { nodes: [{ id: "review", agent: "builder", objective: "Review.", handoff: { mode: "terminal" } }] },
    },
    info: { ok: true, name: "Graph Engine", version: "0.5.0", stage: "ALPHA", schemaVersion: "5", valid: true, configPath: "/graph/config.json" },
    runtime: { paused: false, active: null, queue: [], lastDefect: null, lastEvent: null, history: [] },
    ...overrides,
  };
}

test("runtime: a human-readable state string cannot drive active or queue state", () => {
  const stateString = "Active: d-1 at review. Queue: d-2 at implement.";
  assert.equal(nodeState(terminalHandoffNode, { state: stateString }, []).color, "idle");
  assert.equal(nodeState(terminalHandoffNode, null, [{ state: stateString }]).color, "idle");
});

test("runtime: handoff mode is never a node state", () => {
  const shapes = [
    { mode: "terminal" },
    { mode: "unconditional", to: "$dispatcher" },
    { mode: "conditional", labels: [{ label: "done", to: "$dispatcher" }] },
    { mode: "unconditional", to: "next" },
  ];
  for (const handoff of shapes) {
    assert.deepEqual(nodeState({ id: "node", handoff }, [], []), {
      marker: "○",
      label: "idle",
      color: "idle",
    });
  }
});

test("runtime: running and queued still take precedence for a terminal handoff", () => {
  const node = { id: "done", handoff: { mode: "terminal" } };
  assert.deepEqual(nodeState(node, [{ node: "done" }], []), {
    marker: "●",
    label: "running",
    color: "running",
  });
  assert.deepEqual(nodeState(node, [], [{ node: "done" }]), {
    marker: "◌",
    label: "queued",
    color: "queued",
  });
});

test("runtime: the snapshot carries the full graph document, info, and runtime", async () => {
  const active = { dispatchId: "d-1", node: "review", state: "running", visits: { review: 2 }, usage: { cost: 0.25, tokens: { input: 10, output: 4 } } };
  const dashboard = snapshotToDashboard(snapshot({ runtime: { active, queue: [], lastDefect: null, lastEvent: null, history: [] } }));

  assert.equal(dashboard.config.graph.nodes[0].id, "review");
  assert.equal(dashboard.info.configPath, "/graph/config.json");
  assert.equal(dashboard.runtime.active.dispatchId, "d-1");
  assert.equal(dashboard.runtime.active.visits.review, 2);
  assert.equal(dashboard.runtime.active.usage.cost, 0.25);
  assert.ok(dashboard.fetchedAt instanceof Date);
});

test("runtime: a snapshot without a graph document, info, or runtime is rejected", () => {
  assert.throws(() => snapshotToDashboard(null), /empty/);
  assert.throws(() => snapshotToDashboard(snapshot({ config: {} })), /graph document/);
  assert.throws(() => snapshotToDashboard(snapshot({ info: {} })), /graph info/);
  assert.throws(() => snapshotToDashboard(snapshot({ runtime: null })), /runtime state/);
});