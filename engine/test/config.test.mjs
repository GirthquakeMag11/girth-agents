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
  handoffLabels,
  nodeHandoffLabels,
  handoffToolsStale,
  handoffTarget,
  DISPATCHER_TARGET,
} from "../config.mjs";

const SHIPPED = JSON.parse(
  await readFile(new URL("../graph.json", import.meta.url), "utf8"),
);
const codes = (faults) => faults.map((fault) => fault.code);

test("config: the shipped graph verifies clean", async () => {
  const loaded = await loadConfig(fileURLToPath(new URL("../graph.json", import.meta.url)));
  assert.deepEqual(loaded.faults, []);
  assert.equal(loaded.doc.version, "3");
  assert.deepEqual(Object.keys(loaded.doc).sort(), ["agents", "graph", "version"]);
  assert.equal(loaded.doc.graph.workflows[0].id, "build-review");
});

test("config: graph_info carries the one graph and the graph agents, with no graph id", () => {
  const summary = configSummary(SHIPPED, "/tmp/graph.json");
  assert.equal(summary.configPath, "/tmp/graph.json");
  assert.equal(summary.graph.id, undefined);
  assert.equal(summary.graph.workflows[0].id, "build-review");
  assert.equal(summary.agents[0].id, "builder");
  assert.equal(summary.graphs, undefined);
});

test("config: a graphs array or a graph id is rejected", () => {
  const plural = structuredClone(SHIPPED);
  plural.graphs = [plural.graph];
  delete plural.graph;
  const pluralFaults = codes(validateConfig(plural));
  assert.ok(pluralFaults.includes("schema.unknown-field"));
  assert.ok(pluralFaults.includes("schema.graph"));

  const identified = structuredClone(SHIPPED);
  identified.graph.id = "build-review";
  assert.ok(codes(validateConfig(identified)).includes("schema.unknown-field"));
});

test("config: unknown fields are named", () => {
  const doc = structuredClone(SHIPPED);
  doc.graph.nodes[0].typo = true;
  assert.ok(codes(validateConfig(doc)).includes("schema.unknown-field"));
});

test("config: a dangling handoff is named", () => {
  const doc = structuredClone(SHIPPED);
  doc.graph.nodes[0].handoff.to = "nowhere";
  assert.ok(codes(validateConfig(doc)).includes("graph.dangling-handoff"));
});

test("config: duplicate labels are named", () => {
  const doc = structuredClone(SHIPPED);
  const labels = doc.graph.nodes[1].handoff.labels;
  labels.push({ ...labels[0] });
  assert.ok(codes(validateConfig(doc)).includes("graph.duplicate-label"));
});

test("config: labels are tool-safe", () => {
  for (const label of ["has.dot", "has:colon", "has/slash", "has space", "1leading", "has@char", "_leading"]) {
    const doc = structuredClone(SHIPPED);
    doc.graph.nodes[1].handoff.labels[0].label = label;
    assert.ok(
      codes(validateConfig(doc)).includes("schema.label-format"),
      `expected '${label}' to be rejected`,
    );
  }
});

test("config: empty labels are named and valid characters are accepted", () => {
  for (const label of ["", "   "]) {
    const doc = structuredClone(SHIPPED);
    doc.graph.nodes[1].handoff.labels[0].label = label;
    assert.ok(codes(validateConfig(doc)).includes("schema.string"), `expected '${label}' to be rejected`);
  }

  const valid = structuredClone(SHIPPED);
  valid.graph.nodes[1].handoff.labels[0].label = "Pass_2-ok";
  assert.deepEqual(validateConfig(valid), []);
});

test("config: engine control tool names are reserved as labels", () => {
  for (const label of ["dispatch", "dispatch_status", "dispatch_cancel", "dispatch_wait", "reload", "graph_info", "graph_map", "handoff"]) {
    const doc = structuredClone(SHIPPED);
    doc.graph.nodes[1].handoff.labels[0].label = label;
    assert.ok(
      codes(validateConfig(doc)).includes("graph.reserved-label"),
      `expected '${label}' to be reserved`,
    );
  }
  assert.deepEqual(validateConfig(SHIPPED), []);
});

test("config: handoffLabels returns the unique sorted tool set", () => {
  assert.deepEqual(handoffLabels(SHIPPED.graph), ["fail", "next", "pass"]);

  const shared = {
    nodes: [
      {
        id: "a",
        handoff: {
          mode: "conditional",
          labels: [
            { label: "retry", to: "b" },
            { label: "pass", to: "c" },
          ],
        },
      },
      {
        id: "b",
        handoff: {
          mode: "conditional",
          labels: [
            { label: "retry", to: "a" },
            { label: "stop", to: "c" },
          ],
        },
      },
      { id: "c", handoff: { mode: "terminal" } },
    ],
  };
  assert.deepEqual(handoffLabels(shared), ["pass", "retry", "stop"]);
  assert.deepEqual(handoffLabels({ nodes: [{ id: "end", handoff: { mode: "terminal" } }] }), []);
  assert.deepEqual(handoffLabels({}), []);

  assert.deepEqual(nodeHandoffLabels({ handoff: { mode: "unconditional", to: "b" } }), ["next"]);
  assert.deepEqual(
    nodeHandoffLabels({ handoff: { mode: "conditional", labels: [{ label: "pass" }, { label: "fail" }] } }),
    ["pass", "fail"],
  );
  assert.deepEqual(nodeHandoffLabels({ handoff: { mode: "terminal" } }), []);

  assert.equal(handoffToolsStale(["next", "pass"], ["pass", "next"]), null);
  assert.equal(handoffToolsStale(["next"], ["next", "pass"]).code, "handoff.tools-stale");
  assert.equal(handoffToolsStale(["next"], []).code, "handoff.tools-stale");
});

test("config: the dispatcher is a handoff target, not a node", () => {
  const conditional = structuredClone(SHIPPED);
  conditional.graph.nodes[1].handoff.labels.push({
    label: "report",
    to: DISPATCHER_TARGET,
    description: "Report to the dispatcher.",
  });
  assert.deepEqual(validateConfig(conditional), []);
  assert.equal(handoffTarget(conditional.graph.nodes[1], "report"), DISPATCHER_TARGET);

  const resumed = structuredClone(conditional);
  resumed.graph.nodes[1].handoff.labels.find((label) => label.label === "report").resume = true;
  assert.ok(codes(validateConfig(resumed)).includes("graph.dispatcher-resume"));

  const only = {
    version: "3",
    agents: structuredClone(SHIPPED.agents),
    graph: {
      nodes: [
        {
          id: "a",
          agent: "builder",
          objective: "A.",
          handoff: { mode: "unconditional", to: DISPATCHER_TARGET },
        },
      ],
    },
  };
  assert.deepEqual(validateConfig(only), []);
  assert.equal(handoffTarget(only.graph.nodes[0], "next"), DISPATCHER_TARGET);

  const onlyResumed = structuredClone(only);
  onlyResumed.graph.nodes[0].handoff.resume = true;
  assert.ok(codes(validateConfig(onlyResumed)).includes("graph.dispatcher-resume"));

  const reserved = structuredClone(only);
  reserved.graph.nodes[0].id = DISPATCHER_TARGET;
  assert.ok(codes(validateConfig(reserved)).includes("graph.reserved-node-id"));
});

test("config: a cycle without maxVisits is unbounded", () => {
  const doc = structuredClone(SHIPPED);
  const graph = doc.graph;
  graph.nodes = [
    {
      id: "a",
      agent: "builder",
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
      agent: "builder",
      objective: "b",
      output: "b.md",
      handoff: { mode: "unconditional", to: "a", description: "back" },
    },
    { id: "term", agent: "builder", objective: "end", output: "end.md", handoff: { mode: "terminal" } },
  ];
  assert.ok(codes(validateConfig(doc)).includes("graph.unbounded-cycle"));
});

test("config: no terminal or no path to one is named", () => {
  const doc = structuredClone(SHIPPED);
  const graph = doc.graph;
  graph.nodes = [
    { id: "a", agent: "builder", objective: "a", output: "a.md", handoff: { mode: "unconditional", to: "b" } },
    { id: "b", agent: "builder", objective: "b", output: "b.md", handoff: { mode: "unconditional", to: "a" } },
  ];
  const faults = codes(validateConfig(doc));
  assert.ok(faults.includes("graph.no-terminal"));
  assert.ok(faults.includes("graph.no-terminal-path"));
});

test("config: maxVisits above the engine ceiling and escaping output paths are named", () => {
  const doc = structuredClone(SHIPPED);
  doc.graph.nodes[0].maxVisits = 101;
  doc.graph.nodes[0].output = "../escape.md";
  const faults = codes(validateConfig(doc));
  assert.ok(faults.includes("schema.maxvisits"));
  assert.ok(faults.includes("schema.path"));
  assert.equal(SHIPPED.graph.nodes[0].maxVisits, 20);
});

test("config: output paths resolve under outputRoot", () => {
  const graph = SHIPPED.graph;
  const node = graph.nodes[0];
  assert.equal(outputPathFor(graph, node, "/tmp/work"), "/tmp/work/work/implementation.md");
});

test("config: output is optional and resolves to null when omitted", () => {
  const doc = structuredClone(SHIPPED);
  delete doc.graph.nodes[0].output;
  assert.deepEqual(validateConfig(doc), []);
  assert.equal(outputPathFor(doc.graph, doc.graph.nodes[0], "/tmp/work"), null);
  assert.equal(configSummary(doc, "/tmp/graph.json").graph.nodes[0].output, null);
  assert.equal(handoffToolsStale(handoffLabels(SHIPPED.graph), handoffLabels(doc.graph)), null);

  const invalid = structuredClone(SHIPPED);
  invalid.graph.nodes[0].output = "../escape.md";
  assert.ok(codes(validateConfig(invalid)).includes("schema.path"));
});

test("config: a workflow is a referenced subsection with a reachable entry and exit", () => {
  const doc = structuredClone(SHIPPED);
  const wf = doc.graph.workflows[0];
  wf.entry = "nowhere";
  assert.ok(codes(validateConfig(doc)).includes("graph.workflow-entry"));

  const unreachable = structuredClone(SHIPPED);
  unreachable.graph.workflows[0].nodes = ["implement", "done"];
  const faults = codes(validateConfig(unreachable));
  assert.ok(faults.includes("graph.workflow-unreachable"), JSON.stringify(faults));
});

test("config: resume belongs to a return handoff, not a node", () => {
  const doc = structuredClone(SHIPPED);
  doc.graph.nodes[0].session = "resume";
  assert.ok(codes(validateConfig(doc)).includes("schema.unknown-field"));

  const bad = structuredClone(SHIPPED);
  bad.graph.nodes[1].handoff.labels.find((label) => label.label === "fail").resume = "sometimes";
  assert.ok(codes(validateConfig(bad)).includes("schema.boolean"));

  const fail = SHIPPED.graph.nodes[1].handoff.labels.find((label) => label.label === "fail");
  assert.equal(fail.resume, true);
  assert.equal(SHIPPED.graph.nodes[0].session, undefined);
});

test("config: workflow connections and strict are validated", () => {
  const doc = structuredClone(SHIPPED);
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
  const info = graphInfoResponse(SHIPPED, "/tmp/graph.json", "1.3.0");
  assert.equal(info.ok, true);
  assert.equal(info.version, "1.3.0");
  assert.equal(info.valid, true);
  assert.equal(info.configPath, "/tmp/graph.json");
  assert.equal(info.graph.workflows[0].id, "build-review");
});
