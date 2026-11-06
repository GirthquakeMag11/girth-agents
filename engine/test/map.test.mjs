import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../config.mjs";
import { createDispatchQueue } from "../queue.mjs";
import { renderGraphMap, renderGraphMapResponse, renderState, renderWorkflowTable } from "../map.mjs";

const loaded = await loadConfig(fileURLToPath(new URL("../../graph/config.json", import.meta.url)));
const graph = loaded.doc.graph;

test("map: the workflow is a labelled box with entry and exit", () => {
  const map = renderGraphMap(graph);
  assert.match(map.mermaid, /subgraph wf \["workflow · build-review/);
  assert.match(map.mermaid, /entry implement · exit done/);
  assert.match(map.mermaid, /n0\["implement · builder<br\/>entry"\]/);
  assert.match(map.mermaid, /n1\["review · reviewer"\]/);
  assert.match(map.mermaid, /n2\(\["done · builder<br\/>exit<br\/>terminal"\]\)/);
  assert.match(map.mermaid, /n0 --> n1/);
  assert.match(map.mermaid, /n1 -->\|pass\| n2/);
  assert.match(map.mermaid, /n1 -->\|fail \(resume\)\| n0/);
  assert.match(map.mermaid, /class n2 terminal/);
});

test("map: the workflow and node tables carry the same config fields", () => {
  const map = renderGraphMap(graph);
  assert.match(map.workflowTable, /\| build-review \| implement \| done \| implement, review, done \| — \| no \|/);
  assert.match(map.nodeTable, /\| Node \| Graph agent \| Objective \| Handoff \| Max visits \|/);
  assert.match(map.nodeTable, /implement \| builder \| Implement the dispatched work\./);
  assert.match(map.nodeTable, /\| → review \| 20 \|/);
  assert.match(map.nodeTable, /pass → done; fail → implement \(resume\)/);
  assert.match(map.legend, /resume = this route reuses/);
});

test("map: live state highlights the active node and reports the queue", () => {
  const runtime = {
    paused: false,
    active: { dispatchId: "d-1", node: "review" },
    queue: [{ dispatchId: "d-2" }],
    lastDefect: null,
  };
  const map = renderGraphMap(graph, { runtime });
  assert.match(map.mermaid, /class n1 active/);
  const state = renderState(runtime);
  assert.equal(state, "Active: d-1 at review. Queue: d-2.");
});

test("map: graph-map response carries structured runtime", () => {
  const runtime = {
    paused: false,
    active: { dispatchId: "d-1", node: "implement", workflow: "build-review", state: "running" },
    queue: [{ dispatchId: "d-2", node: "review", workflow: "build-review", state: "queued" }],
    lastDefect: { code: "session-failed", message: "previous" },
    lastEvent: { kind: "dispatched", dispatchId: "d-1" },
    history: [{ seq: 1, at: "2026-01-01T00:00:00.000Z", kind: "queued", dispatchId: "d-1", workflow: "build-review" }],
    historyEpoch: "boot-one",
  };
  const response = renderGraphMapResponse(graph, runtime);
  assert.equal(response.ok, true);
  assert.equal(response.runtime, runtime);
  assert.equal(response.runtime.active.workflow, "build-review");
  assert.equal(response.runtime.queue[0].dispatchId, "d-2");
  assert.equal(response.runtime.lastEvent.kind, "dispatched");
  assert.equal(response.runtime.lastDefect.code, "session-failed");
  assert.equal(response.runtime.history[0].seq, 1);
  assert.equal(response.runtime.historyEpoch, "boot-one");
  assert.match(response.state, /Active: d-1 at implement/);
  assert.match(response.state, /Queue: d-2/);
  assert.equal(response.mermaid.includes("flowchart"), true);
});

test("map: the real queue feeds workflow-aware structured runtime", async () => {
  const queue = createDispatchQueue({
    run: () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 50)),
  });
  queue.enqueue({ node: "implement", prompt: "work", workflow: "build-review" });
  await new Promise((resolve) => setImmediate(resolve));
  const runtime = {
    ...queue.introspect(),
    lastDefect: { code: "workflow.escape", message: "escaped" },
    lastEvent: { kind: "defect", code: "workflow.escape" },
  };
  const response = renderGraphMapResponse(graph, runtime);
  assert.equal(response.runtime.active.workflow, "build-review");
  assert.equal(response.runtime.active.node, "implement");
  assert.equal(response.runtime.lastDefect.code, "workflow.escape");
  assert.equal(response.runtime.lastEvent.kind, "defect");
  assert.match(response.state, /Active: d-1 at implement/);
  await queue.cancel("d-1");
});

test("map: the workflow table carries connections and strict policy for multiple workflows", () => {
  const graph = {
    workflows: [
      { id: "A", entry: "a", exit: "b", nodes: ["a", "b"], connections: ["B"], strict: true },
      { id: "B", entry: "b", exit: "b", nodes: ["b"], connections: [], strict: false },
    ],
    nodes: [{ id: "a" }, { id: "b" }],
  };
  const table = renderWorkflowTable(graph);
  assert.match(table, /\| A \| a \| b \| a, b \| B \| yes \|/);
  assert.match(table, /\| B \| b \| b \| b \| — \| no \|/);
});

test("map: a dispatcher target is rendered as a completion sink", () => {
  const withDispatcher = structuredClone(graph);
  withDispatcher.nodes[1].handoff.labels.push({
    label: "report",
    to: "$dispatcher",
    description: "Report.",
  });
  const map = renderGraphMap(withDispatcher);
  assert.match(map.mermaid, /dispatcher\(\["dispatcher"\]\)/);
  assert.match(map.mermaid, /n1 -->\|report\| dispatcher/);
  assert.match(map.nodeTable, /report → \$dispatcher/);
});
