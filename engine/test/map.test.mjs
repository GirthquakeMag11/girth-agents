import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../config.mjs";
import { renderAllMaps, renderGraphArtifact, renderGraphMap } from "../map.mjs";

const loaded = await loadConfig(fileURLToPath(new URL("../example-graph.json", import.meta.url)));
const graph = loaded.doc.graphs[0];

test("map: the workflow is a labelled box with entry and exit", () => {
  const map = renderGraphMap(graph);
  assert.match(map.mermaid, /subgraph wf \["workflow · build-review/);
  assert.match(map.mermaid, /entry implement · exit done/);
  assert.match(map.mermaid, /n0\["implement · builder<br\/>entry<br\/>↻ resume"\]/);
  assert.match(map.mermaid, /n1\["review · reviewer<br\/>✦ fresh every visit"\]/);
  assert.match(map.mermaid, /n2\(\["done · builder<br\/>exit<br\/>terminal"\]\)/);
  assert.match(map.mermaid, /n0 -->\|next\| n1/);
  assert.match(map.mermaid, /n1 -->\|pass\| n2/);
  assert.match(map.mermaid, /n1 -->\|fail\| n0/);
  assert.match(map.mermaid, /class n0 resume/);
  assert.match(map.mermaid, /class n1 fresh/);
  assert.match(map.mermaid, /class n2 terminal/);
});

test("map: the workflow and node tables carry the same config fields", () => {
  const map = renderGraphMap(graph);
  assert.match(map.workflowTable, /\| build-review \| implement \| done \| implement, review, done \|/);
  assert.match(map.nodeTable, /implement \| builder \| Implement the dispatched work\./);
  assert.match(map.nodeTable, /work\/implementation\.md/);
  assert.match(map.nodeTable, /resume — same session on revisit/);
  assert.match(map.nodeTable, /fresh — new session every visit/);
  assert.match(map.nodeTable, /pass → done; fail → implement/);
  assert.match(map.legend, /↻ resume/);
});

test("map: live state highlights the active node and reports the queue", () => {
  const runtime = {
    paused: false,
    active: { dispatchId: "d-1", graph: "build-review", node: "review" },
    queue: [{ dispatchId: "d-2" }],
    lastDefect: null,
  };
  const map = renderGraphMap(graph, { runtime });
  assert.match(map.mermaid, /class n1 active/);
  const all = renderAllMaps(loaded.doc, { runtime });
  assert.equal(all.state, "Active: d-1 at review. Queue: d-2.");
});

test("map: the artifact contains the map, workflow table, node table, and legend", () => {
  const artifact = renderGraphArtifact(loaded.doc, "graph.json");
  assert.match(artifact, /# Graphs/);
  assert.match(artifact, /## build-review/);
  assert.match(artifact, /```mermaid/);
  assert.match(artifact, /### Workflows/);
  assert.match(artifact, /### Nodes/);
  assert.match(artifact, /↻ resume/);
});
