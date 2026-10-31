import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  loadConfig,
  validateConfig,
  outputPathFor,
  configSummary,
  graphInfoResponse,
  allowedWorkflows,
  workflowsForNode,
} from "../config.mjs";

const EXAMPLE = JSON.parse(
  await readFile(new URL("../example-graph.json", import.meta.url), "utf8"),
);
const codes = (faults) => faults.map((fault) => fault.code);

test("config: the shipped example verifies clean", async () => {
  const loaded = await loadConfig(fileURLToPath(new URL("../example-graph.json", import.meta.url)));
  assert.deepEqual(loaded.faults, []);
  assert.equal(loaded.doc.version, "3");
  assert.deepEqual(Object.keys(loaded.doc).sort(), ["graph", "helpers", "version"]);
  assert.equal(loaded.doc.graph.workflows[0].id, "build-review");
});

test("config: graph_info carries the one graph and the helpers, with no graph id", () => {
  const summary = configSummary(EXAMPLE, "/tmp/graph.json");
  assert.equal(summary.configPath, "/tmp/graph.json");
  assert.equal(summary.graph.id, undefined);
  assert.equal(summary.graph.workflows[0].id, "build-review");
  assert.equal(summary.helpers[0].id, "builder");
  assert.equal(summary.graphs, undefined);
});

test("config: a graphs array or a graph id is rejected", () => {
  const plural = structuredClone(EXAMPLE);
  plural.graphs = [plural.graph];
  delete plural.graph;
  const pluralFaults = codes(validateConfig(plural));
  assert.ok(pluralFaults.includes("schema.unknown-field"));
  assert.ok(pluralFaults.includes("schema.graph"));

  const identified = structuredClone(EXAMPLE);
  identified.graph.id = "build-review";
  assert.ok(codes(validateConfig(identified)).includes("schema.unknown-field"));
});

test("config: unknown fields are named", () => {
  const doc = structuredClone(EXAMPLE);
  doc.graph.nodes[0].typo = true;
  assert.ok(codes(validateConfig(doc)).includes("schema.unknown-field"));
});

test("config: a dangling handoff is named", () => {
  const doc = structuredClone(EXAMPLE);
  doc.graph.nodes[0].handoff.to = "nowhere";
  assert.ok(codes(validateConfig(doc)).includes("graph.dangling-handoff"));
});

test("config: duplicate labels are named", () => {
  const doc = structuredClone(EXAMPLE);
  const labels = doc.graph.nodes[1].handoff.labels;
  labels.push({ ...labels[0] });
  assert.ok(codes(validateConfig(doc)).includes("graph.duplicate-label"));
});

test("config: a cycle without maxVisits is unbounded", () => {
  const doc = structuredClone(EXAMPLE);
  const graph = doc.graph;
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
  const graph = doc.graph;
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
  doc.graph.nodes[0].maxVisits = 101;
  doc.graph.nodes[0].output = "../escape.md";
  const faults = codes(validateConfig(doc));
  assert.ok(faults.includes("schema.maxvisits"));
  assert.ok(faults.includes("schema.path"));
  assert.equal(EXAMPLE.graph.nodes[0].maxVisits, 20);
});

test("config: output paths resolve under outputRoot", () => {
  const graph = EXAMPLE.graph;
  const node = graph.nodes[0];
  assert.equal(outputPathFor(graph, node, "/tmp/work"), "/tmp/work/work/implementation.md");
});

test("config: a workflow is a referenced subsection with a reachable entry and exit", () => {
  const doc = structuredClone(EXAMPLE);
  const wf = doc.graph.workflows[0];
  wf.entry = "nowhere";
  assert.ok(codes(validateConfig(doc)).includes("graph.workflow-entry"));

  const unreachable = structuredClone(EXAMPLE);
  unreachable.graph.workflows[0].nodes = ["implement", "done"];
  const faults = codes(validateConfig(unreachable));
  assert.ok(faults.includes("graph.workflow-unreachable"), JSON.stringify(faults));
});

test("config: resume belongs to a return handoff, not a node", () => {
  const doc = structuredClone(EXAMPLE);
  doc.graph.nodes[0].session = "resume";
  assert.ok(codes(validateConfig(doc)).includes("schema.unknown-field"));

  const bad = structuredClone(EXAMPLE);
  bad.graph.nodes[1].handoff.labels.find((label) => label.label === "fail").resume = "sometimes";
  assert.ok(codes(validateConfig(bad)).includes("schema.boolean"));

  const fail = EXAMPLE.graph.nodes[1].handoff.labels.find((label) => label.label === "fail");
  assert.equal(fail.resume, true);
  assert.equal(EXAMPLE.graph.nodes[0].session, undefined);
});

test("config: workflow connections and strict are validated", () => {
  const doc = structuredClone(EXAMPLE);
  doc.graph.workflows.push({
    id: "review-only",
    entry: "review",
    exit: "review",
    nodes: ["review"],
  });
  doc.graph.workflows[0].connections = ["review-only"];
  doc.graph.workflows[0].strict = true;
  assert.deepEqual(validateConfig(doc), []);

  const unknown = structuredClone(doc);
  unknown.graph.workflows[0].connections = ["missing"];
  assert.ok(codes(validateConfig(unknown)).includes("graph.unknown-connection"));

  const self = structuredClone(doc);
  self.graph.workflows[0].connections = ["build-review"];
  assert.ok(codes(validateConfig(self)).includes("graph.self-connection"));

  const duplicate = structuredClone(doc);
  duplicate.graph.workflows[0].connections = ["review-only", "review-only"];
  assert.ok(codes(validateConfig(duplicate)).includes("graph.duplicate-connection"));

  const badStrict = structuredClone(doc);
  badStrict.graph.workflows[0].strict = "yes";
  assert.ok(codes(validateConfig(badStrict)).includes("schema.boolean"));
});

test("config: workflow connections are transitive and node memberships are explicit", () => {
  const graph = {
    workflows: [
      { id: "a", entry: "n1", exit: "n1", nodes: ["n1"], connections: ["b"] },
      { id: "b", entry: "n1", exit: "n2", nodes: ["n1", "n2"], connections: ["c"] },
      { id: "c", entry: "n2", exit: "n2", nodes: ["n2"] },
    ],
    nodes: [
      { id: "n1" },
      { id: "n2" },
    ],
  };
  assert.deepEqual([...allowedWorkflows(graph, "a")].sort(), ["a", "b", "c"]);
  assert.deepEqual(workflowsForNode(graph, "n1"), ["a", "b"]);
  assert.deepEqual(workflowsForNode(graph, "n2"), ["b", "c"]);
});

test("config: graph_info carries engine version and validity", () => {
  const info = graphInfoResponse(EXAMPLE, "/tmp/graph.json", "1.3.0");
  assert.equal(info.ok, true);
  assert.equal(info.version, "1.3.0");
  assert.equal(info.valid, true);
  assert.equal(info.configPath, "/tmp/graph.json");
  assert.equal(info.graph.workflows[0].id, "build-review");
});
