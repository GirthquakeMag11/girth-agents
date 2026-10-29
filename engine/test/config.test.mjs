import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadConfig, validateConfig, outputPathFor } from "../config.mjs";

const EXAMPLE = JSON.parse(
  await readFile(new URL("../example-graph.json", import.meta.url), "utf8"),
);
const codes = (faults) => faults.map((fault) => fault.code);

test("config: the shipped example verifies clean", async () => {
  const loaded = await loadConfig(fileURLToPath(new URL("../example-graph.json", import.meta.url)));
  assert.deepEqual(loaded.faults, []);
  assert.equal(loaded.doc.graphs[0].id, "build-review");
});

test("config: unknown fields are named", () => {
  const doc = structuredClone(EXAMPLE);
  doc.graphs[0].nodes[0].typo = true;
  assert.ok(codes(validateConfig(doc)).includes("schema.unknown-field"));
});

test("config: a dangling handoff is named", () => {
  const doc = structuredClone(EXAMPLE);
  doc.graphs[0].nodes[0].handoff.to = "nowhere";
  assert.ok(codes(validateConfig(doc)).includes("graph.dangling-handoff"));
});

test("config: duplicate labels are named", () => {
  const doc = structuredClone(EXAMPLE);
  const labels = doc.graphs[0].nodes[1].handoff.labels;
  labels.push({ ...labels[0] });
  assert.ok(codes(validateConfig(doc)).includes("graph.duplicate-label"));
});

test("config: a cycle without maxVisits is unbounded", () => {
  const doc = structuredClone(EXAMPLE);
  const graph = doc.graphs[0];
  graph.nodes = [
    {
      id: "a",
      helper: "builder",
      objective: "a",
      output: "a.md",
      handoff: {
        mode: "conditional",
        labels: [
          { label: "again", to: "b", description: "again" },
          { label: "done", to: "term", description: "done" },
        ],
      },
    },
    {
      id: "b",
      helper: "builder",
      objective: "b",
      output: "b.md",
      handoff: { mode: "unconditional", to: "a", description: "back" },
    },
    { id: "term", helper: "builder", objective: "end", output: "end.md", handoff: { mode: "terminal" } },
  ];
  assert.ok(codes(validateConfig(doc)).includes("graph.unbounded-cycle"));
});

test("config: no terminal or no path to one is named", () => {
  const doc = structuredClone(EXAMPLE);
  const graph = doc.graphs[0];
  graph.nodes = [
    { id: "a", helper: "builder", objective: "a", output: "a.md", handoff: { mode: "unconditional", to: "b" } },
    { id: "b", helper: "builder", objective: "b", output: "b.md", handoff: { mode: "unconditional", to: "a" } },
  ];
  const faults = codes(validateConfig(doc));
  assert.ok(faults.includes("graph.no-terminal"));
  assert.ok(faults.includes("graph.no-terminal-path"));
});

test("config: maxVisits above the engine ceiling and escaping output paths are named", () => {
  const doc = structuredClone(EXAMPLE);
  doc.graphs[0].nodes[0].maxVisits = 4;
  doc.graphs[0].nodes[0].output = "../escape.md";
  const faults = codes(validateConfig(doc));
  assert.ok(faults.includes("schema.maxvisits"));
  assert.ok(faults.includes("schema.path"));
});

test("config: output paths resolve under outputRoot", () => {
  const graph = EXAMPLE.graphs[0];
  const node = graph.nodes[0];
  assert.equal(outputPathFor(graph, node, "/tmp/work"), "/tmp/work/work/implementation.md");
});
