import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadConfig,
  validateConfig,
  validateManifest,
  SCHEMA_VERSION,
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
import { PROJECT_VERSION } from "../version.mjs";

const shipped = await loadConfig(fileURLToPath(new URL("../../graph/config.json", import.meta.url)));
const SHIPPED = shipped.doc;
const codes = (faults) => faults.map((fault) => fault.code);

const defaultGraph = {
  nodes: [
    {
      id: "a",
      agent: "builder",
      objective: "A.",
      handoff: { mode: "terminal" },
    },
  ],
};

function agentDoc({
  id = "builder",
  model = "provider/model",
  agent,
  permissions = ["read"],
  skills = [],
  subagents = [],
  description,
  body = "Prompt.",
} = {}) {
  return [
    "---",
    `id: ${id}`,
    `model: ${model}`,
    ...(agent ? [`agent: ${agent}`] : []),
    ...(description !== undefined ? [`description: ${description}`] : []),
    `permissions: [${permissions.join(", ")}]`,
    ...(skills.length > 0 ? [`skills: [${skills.join(", ")}]`] : []),
    ...(subagents.length > 0 ? [`subagents: [${subagents.join(", ")}]`] : []),
    "---",
    "",
    body,
    "",
  ].join("\n");
}

async function graphConfig({
  agentDocs = { "builder.md": agentDoc() },
  agentPaths,
  skillFiles = {},
  graph = defaultGraph,
  version = SCHEMA_VERSION,
  extra = {},
} = {}) {
  const dir = await mkdtemp(join(tmpdir(), "engine-config-"));
  await mkdir(join(dir, "agents"), { recursive: true });
  await mkdir(join(dir, "skills"), { recursive: true });
  for (const [name, text] of Object.entries(agentDocs)) {
    await writeFile(join(dir, "agents", name), text);
  }
  for (const [name, text] of Object.entries(skillFiles)) {
    await writeFile(join(dir, "skills", name), text);
  }
  const doc = {
    version,
    agents: agentPaths ?? Object.keys(agentDocs).map((name) => `agents/${name}`),
    graph,
    ...extra,
  };
  const path = join(dir, "graph.json");
  await writeFile(path, JSON.stringify(doc, null, 2));
  return { dir, path, doc };
}

test("config: the shipped graph verifies clean", async () => {
  assert.deepEqual(shipped.faults, []);
  assert.equal(SHIPPED.version, SCHEMA_VERSION);
  assert.deepEqual(Object.keys(SHIPPED).sort(), ["agents", "graph", "version"]);
  assert.equal(SHIPPED.graph.workflows[0].id, "build-review");
  assert.deepEqual(SHIPPED.agents.map((agent) => agent.id), ["builder", "reviewer"]);
  assert.match(SHIPPED.agents[0].prompt, /Work only within/);
});

test("config: the manifest takes agent paths and rejects inline agents", () => {
  const manifest = {
    version: SCHEMA_VERSION,
    agents: ["agents/builder.md"],
    graph: defaultGraph,
  };
  assert.deepEqual(validateManifest(manifest), []);

  const inline = {
    version: SCHEMA_VERSION,
    agents: [{ id: "builder" }],
    graph: defaultGraph,
  };
  assert.ok(codes(validateManifest(inline)).includes("schema.path"));

  const catalog = {
    version: SCHEMA_VERSION,
    skills: ["skills/test-first.md"],
    agents: ["agents/builder.md"],
    graph: defaultGraph,
  };
  assert.ok(codes(validateManifest(catalog)).includes("schema.unknown-field"));
});

test("config: skills load from Markdown and resolve onto the graph agent", async () => {
  const { path } = await graphConfig({
    agentDocs: {
      "builder.md": agentDoc({ skills: ["skills/test-first.md"] }),
    },
    skillFiles: {
      "test-first.md":
        "---\nid: test-first\nname: Test-first\ndescription: Build it test-first.\n---\n\nWrite the failing test first.\n",
    },
  });
  const loaded = await loadConfig(path);
  assert.deepEqual(loaded.faults, []);
  const agent = loaded.doc.agents[0];
  assert.equal(agent.prompt, "Prompt.");
  assert.deepEqual(agent.skills, ["skills/test-first.md"]);
  assert.equal(agent.skillDocs.length, 1);
  assert.equal(agent.skillDocs[0].id, "test-first");
  assert.match(agent.skillDocs[0].instructions, /Write the failing test first/);
  assert.deepEqual(Object.keys(agent).sort(), ["id", "model", "permissions", "prompt", "skills"]);

  const summary = configSummary(loaded.doc, path);
  assert.equal(summary.agents[0].prompt, "Prompt.");
  assert.deepEqual(summary.agents[0].skills, ["test-first"]);
  assert.deepEqual(summary.agents[0].skillPaths, ["skills/test-first.md"]);
});

test("config: an agent carries description and subagents through the loader", async () => {
  const { path } = await graphConfig({
    agentDocs: {
      "builder.md": agentDoc({ description: "Builds it.", subagents: ["explore", "general"] }),
    },
  });
  const loaded = await loadConfig(path);
  assert.deepEqual(loaded.faults, []);
  const agent = loaded.doc.agents[0];
  assert.equal(agent.description, "Builds it.");
  assert.deepEqual(agent.subagents, ["explore", "general"]);
  assert.deepEqual(
    Object.keys(agent).sort(),
    ["description", "id", "model", "permissions", "prompt", "subagents"],
  );

  const summary = configSummary(loaded.doc, path);
  assert.equal(summary.agents[0].description, "Builds it.");
  assert.deepEqual(summary.agents[0].subagents, ["explore", "general"]);
});

test("config: a non-string subagents entry is named", async () => {
  const { path } = await graphConfig({
    agentDocs: { "builder.md": agentDoc({ subagents: [123] }) },
  });
  assert.ok(codes((await loadConfig(path)).faults).includes("schema.agent-subagents"));
});

test("config: a duplicate subagents entry is named", async () => {
  const { path } = await graphConfig({
    agentDocs: { "builder.md": agentDoc({ subagents: ["explore", "explore"] }) },
  });
  assert.ok(codes((await loadConfig(path)).faults).includes("schema.agent-subagents"));
});

test("config: a non-array subagents value is named", async () => {
  const { path } = await graphConfig({
    agentDocs: {
      "builder.md": "---\nid: builder\nmodel: provider/model\npermissions: [read]\nsubagents: explore\n---\n\nPrompt.\n",
    },
  });
  assert.ok(codes((await loadConfig(path)).faults).includes("schema.agent-subagents"));
});

test("config: an empty-string subagents entry is named", async () => {
  const { path } = await graphConfig({
    agentDocs: {
      "builder.md": '---\nid: builder\nmodel: provider/model\npermissions: [read]\nsubagents: [""]\n---\n\nPrompt.\n',
    },
  });
  assert.ok(codes((await loadConfig(path)).faults).includes("schema.agent-subagents"));
});

test("config: a missing agent document is named", async () => {
  const { path } = await graphConfig({ agentDocs: {}, agentPaths: ["agents/missing.md"] });
  assert.ok(codes((await loadConfig(path)).faults).includes("agent.unreadable"));
});

test("config: malformed agent frontmatter and a missing id are named", async () => {
  const malformed = await graphConfig({ agentDocs: { "builder.md": "# no frontmatter\n" } });
  assert.ok(codes((await loadConfig(malformed.path)).faults).includes("agent.frontmatter"));

  const missing = await graphConfig({
    agentDocs: { "builder.md": "---\nmodel: provider/model\npermissions: [read]\n---\n\nPrompt.\n" },
  });
  assert.ok(codes((await loadConfig(missing.path)).faults).includes("agent.missing-id"));
});

test("config: duplicate agent ids are named", async () => {
  const { path } = await graphConfig({
    agentDocs: {
      "one.md": agentDoc(),
      "two.md": agentDoc(),
    },
    agentPaths: ["agents/one.md", "agents/two.md"],
  });
  assert.ok(codes((await loadConfig(path)).faults).includes("agent.duplicate-id"));
});

test("config: invalid agent properties and unknown frontmatter fields are named", async () => {
  const model = await graphConfig({ agentDocs: { "builder.md": agentDoc({ model: "nope" }) } });
  assert.ok(codes((await loadConfig(model.path)).faults).includes("schema.agent-model"));

  const permissions = await graphConfig({ agentDocs: { "builder.md": agentDoc({ permissions: [] }) } });
  assert.ok(codes((await loadConfig(permissions.path)).faults).includes("schema.agent-permissions"));

  const unknown = await graphConfig({
    agentDocs: {
      "builder.md": "---\nid: builder\nmodel: provider/model\npermissions: [read]\nlegacy: old\n---\n\nPrompt.\n",
    },
  });
  assert.ok(codes((await loadConfig(unknown.path)).faults).includes("schema.unknown-field"));
});

test("config: a node must reference a loaded agent", async () => {
  const { path } = await graphConfig({
    graph: {
      nodes: [{ id: "a", agent: "missing", objective: "A.", handoff: { mode: "terminal" } }],
    },
  });
  assert.ok(codes((await loadConfig(path)).faults).includes("graph.unknown-agent"));
});

test("config: the top-level skills catalog is rejected", async () => {
  const { path } = await graphConfig({ extra: { skills: ["skills/test-first.md"] } });
  assert.ok(codes((await loadConfig(path)).faults).includes("schema.unknown-field"));
});

test("config: version 3 is rejected", async () => {
  const { path } = await graphConfig({ version: "3" });
  assert.ok(codes((await loadConfig(path)).faults).includes("schema.version"));
});

test("config: a missing referenced skill is named", async () => {
  const { path } = await graphConfig({
    agentDocs: { "builder.md": agentDoc({ skills: ["skills/missing.md"] }) },
  });
  assert.ok(codes((await loadConfig(path)).faults).includes("skill.unreadable"));
});

test("config: duplicate skill ids and missing ids are named", async () => {
  const duplicate = await graphConfig({
    agentDocs: { "builder.md": agentDoc({ skills: ["skills/a.md", "skills/b.md"] }) },
    skillFiles: {
      "a.md": "---\nid: dupe\n---\n\nA.\n",
      "b.md": "---\nid: dupe\n---\n\nB.\n",
    },
  });
  assert.ok(codes((await loadConfig(duplicate.path)).faults).includes("skill.duplicate-id"));

  const missing = await graphConfig({
    agentDocs: { "builder.md": agentDoc({ skills: ["skills/a.md"] }) },
    skillFiles: { "a.md": "---\nname: No id\n---\n\nA.\n" },
  });
  assert.ok(codes((await loadConfig(missing.path)).faults).includes("skill.missing-id"));
});

test("config: a skill must carry instructions", async () => {
  const { path } = await graphConfig({
    agentDocs: { "builder.md": agentDoc({ skills: ["skills/a.md"] }) },
    skillFiles: { "a.md": "---\nid: empty\n---\n\n   \n" },
  });
  assert.ok(codes((await loadConfig(path)).faults).includes("skill.instructions"));
});

test("config: a skill shared by two agents loads once", async () => {
  const { path } = await graphConfig({
    agentDocs: {
      "builder.md": agentDoc({ skills: ["skills/shared.md"] }),
      "reviewer.md": agentDoc({ id: "reviewer", skills: ["skills/shared.md"] }),
    },
    agentPaths: ["agents/builder.md", "agents/reviewer.md"],
    skillFiles: { "shared.md": "---\nid: shared\n---\n\nShared instructions.\n" },
    graph: {
      nodes: [
        { id: "a", agent: "builder", objective: "A.", handoff: { mode: "terminal" } },
      ],
    },
  });
  const loaded = await loadConfig(path);
  assert.deepEqual(loaded.faults, []);
  assert.equal(loaded.doc.agents[0].skillDocs[0], loaded.doc.agents[1].skillDocs[0]);
});

test("config: an unreferenced malformed skill is ignored", async () => {
  const { path } = await graphConfig({
    skillFiles: { "unused.md": "not frontmatter\n" },
  });
  assert.deepEqual((await loadConfig(path)).faults, []);
});

test("config: agent and skill paths must stay relative", async () => {
  const agentPath = await graphConfig({ agentDocs: {}, agentPaths: ["../escape.md"] });
  assert.ok(codes((await loadConfig(agentPath.path)).faults).includes("schema.path"));

  const skillPath = await graphConfig({
    agentDocs: { "builder.md": agentDoc({ skills: ["../escape.md"] }) },
  });
  assert.ok(codes((await loadConfig(skillPath.path)).faults).includes("schema.path"));

  const agent = structuredClone(SHIPPED);
  agent.agents[0].skills = ["../escape.md"];
  assert.ok(codes(validateConfig(agent)).includes("schema.path"));
});

test("config: graph_info carries the one graph and the graph agents, with no graph id", () => {
  const summary = configSummary(SHIPPED, "/tmp/graph.json");
  assert.equal(summary.configPath, "/tmp/graph.json");
  assert.equal(summary.graph.id, undefined);
  assert.equal(summary.graph.workflows[0].id, "build-review");
  assert.equal("outputRoot" in summary.graph, false);
  assert.equal("output" in summary.graph.nodes[0], false);
  assert.equal(summary.agents[0].id, "builder");
  assert.match(summary.agents[0].prompt, /Work only within/);
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
    version: SCHEMA_VERSION,
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
      handoff: { mode: "unconditional", to: "a", description: "back" },
    },
    { id: "term", agent: "builder", objective: "end", handoff: { mode: "terminal" } },
  ];
  assert.ok(codes(validateConfig(doc)).includes("graph.unbounded-cycle"));
});

test("config: no terminal or no path to one is named", () => {
  const doc = structuredClone(SHIPPED);
  const graph = doc.graph;
  graph.nodes = [
    { id: "a", agent: "builder", objective: "a", handoff: { mode: "unconditional", to: "b" } },
    { id: "b", agent: "builder", objective: "b", handoff: { mode: "unconditional", to: "a" } },
  ];
  const faults = codes(validateConfig(doc));
  assert.ok(faults.includes("graph.no-terminal"));
  assert.ok(faults.includes("graph.no-terminal-path"));
});

test("config: maxVisits above the engine ceiling is named", () => {
  const doc = structuredClone(SHIPPED);
  doc.graph.nodes[0].maxVisits = 101;
  const faults = codes(validateConfig(doc));
  assert.ok(faults.includes("schema.maxvisits"));
  assert.equal(SHIPPED.graph.nodes[0].maxVisits, 20);
});

test("config: schema 4 is rejected before the removed output fields are read", async () => {
  const graph = structuredClone(defaultGraph);
  graph.outputRoot = "work";
  graph.nodes[0].output = "a.md";
  const { path } = await graphConfig({ version: "4", graph });
  const loaded = await loadConfig(path);
  assert.equal(loaded.doc, null);
  assert.deepEqual(codes(loaded.faults), ["schema.version"]);
});

test("config: schema 5 rejects the removed output fields", async () => {
  const graph = structuredClone(defaultGraph);
  graph.outputRoot = "work";
  graph.nodes[0].output = "a.md";
  const { path } = await graphConfig({ version: SCHEMA_VERSION, graph });
  const loaded = await loadConfig(path);
  assert.equal(loaded.doc, null);
  assert.deepEqual(codes(loaded.faults), ["schema.unknown-field", "schema.unknown-field"]);
  const messages = loaded.faults.map((fault) => fault.message);
  assert.ok(messages.some((message) => message.includes("outputRoot")), messages.join("\n"));
  assert.ok(
    messages.some((message) => message.includes("nodes[0]") && message.includes("'output'")),
    messages.join("\n"),
  );
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

test("config: graph_info carries project and schema versions", () => {
  const info = graphInfoResponse(SHIPPED, "/tmp/graph.json", PROJECT_VERSION);
  assert.equal(info.ok, true);
  assert.equal(info.version, PROJECT_VERSION);
  assert.equal(info.schemaVersion, SCHEMA_VERSION);
  assert.equal(info.valid, true);
  assert.equal(info.configPath, "/tmp/graph.json");
  assert.equal(info.graph.workflows[0].id, "build-review");
});
