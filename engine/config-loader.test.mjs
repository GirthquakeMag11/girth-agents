import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "./config-loader.mjs";
import { writeConfigTree } from "./fixture-config.mjs";

async function tree(files) {
  const dir = await mkdtemp(join(tmpdir(), "tree-"));
  for (const [rel, content] of Object.entries(files)) {
    const path = join(dir, rel);
    await mkdir(join(path, ".."), { recursive: true });
    await writeFile(path, content);
  }
  return join(dir, "config.json");
}

const MANIFEST = (agents, nodes) => JSON.stringify({ version: "1", agents, graph: { nodes } });

test("loader: resolves the manifest into agents with their craft, nodes with their bodies and out-links", async () => {
  const path = await tree({
    "config.json": MANIFEST(["agents/builder.md", "agents/checker.md"], ["nodes/build.md", "nodes/out.md"]),
    "agents/builder.md": `---\nid: builder\njob: Build it\nmodel: m/b\ncapabilities: [fs]\npermissions:\n  allow: [fs]\n---\n# Builder craft\n\nBuild to the criteria.`,
    "agents/checker.md": `---\nid: checker\njob: Grade it\nmodel: m/c\ncapabilities: [fs]\npermissions:\n  allow: [fs]\n---\n# Checker craft\n\nGrade against reality.`,
    "nodes/build.md": `---\nid: build\ntype: task\nhelper: builder\nartifact: out.json\nobjective: Build the piece\nout:\n  - to: out\n    condition:\n      field: verdict\n      equals: pass\n  - to: out\n---\nOnly the objective's scope.`,
    "nodes/out.md": `---\nid: out\ntype: exit\n---\n`,
  });
  const { faults, doc } = await loadConfig(path);
  assert.deepEqual(faults, []);
  assert.equal(doc.agents.builder.instructions.includes("# Builder craft"), true);
  assert.equal(doc.agents.builder.model, "m/b");
  assert.deepEqual(doc.agents.builder.permissions, { allow: ["fs"] });
  assert.equal(doc.graph.nodes.find((n) => n.id === "build").objective, "Build the piece");
  assert.equal(doc.graph.nodes.find((n) => n.id === "build").body.includes("Only the objective's scope"), true);
  assert.deepEqual(doc.graph.links, [
    { from: "build", to: "out", condition: { field: "verdict", equals: "pass" } },
    { from: "build", to: "out" },
  ], "out-lists become links with the node's id as from");
});

test("loader: the fixture writer and the parser agree — a full tree round-trips", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tree-"));
  await writeConfigTree(dir, {
    agents: {
      builder: {
        job: "Build", model: "m", capabilities: ["fs"],
        permissions: { allow: ["fs"], denyRest: true },
        instructions: "# craft",
      },
    },
    nodes: [
      { id: "in", type: "entry", marker: "CONFIRMED", out: [{ to: "build" }] },
      { id: "build", type: "task", helper: "builder", artifact: "a.json", objective: "Do", out: [{ to: "bounce", exhausted: true }] },
      { id: "bounce", type: "exit", record: { kind: "question" } },
    ],
  });
  const { faults, doc } = await loadConfig(join(dir, "config.json"));
  assert.deepEqual(faults, []);
  assert.deepEqual(doc.graph.nodes.find((n) => n.id === "bounce").record, { kind: "question" });
  assert.deepEqual(doc.graph.links.find((l) => l.exhausted), { from: "build", to: "bounce", exhausted: true });
  // every serialized agent file re-parses on its own
  for (const rel of ["agents/builder.md"]) {
    const text = await readFile(join(dir, rel), "utf8");
    assert.ok(text.includes("allow: [fs]"), `${rel} must carry its nested permissions`);
  }
});

test("loader: a missing piece, bad frontmatter, and duplicate ids are named faults", async () => {
  const path = await tree({
    "config.json": MANIFEST(["agents/builder.md", "agents/ghost.md"], ["nodes/build.md", "nodes/other-build.md"]),
    "agents/builder.md": `---\nid: builder\njob: Build\nmodel: m\ncapabilities: [fs]\npermissions: [fs]\n---\ncraft`,
    "agents/ghost.md": `---\njob: No id here\n---\ncraft`,
    "nodes/build.md": `---\nid: build\ntype: task\nhelper: builder\nartifact: a.json\nobjective: x\n---\n`,
    "nodes/other-build.md": `---\nid: build\ntype: entry\n---\n`,
  });
  const { faults } = await loadConfig(path);
  const codes = faults.map((f) => f.code);
  assert.ok(codes.includes("agent.missing-id"), JSON.stringify(faults));
  assert.ok(codes.includes("node.duplicate-id"), JSON.stringify(faults));

  const badSyntax = await tree({
    "config.json": MANIFEST(["agents/broken.md"], []),
    "agents/broken.md": `---\nid: broken\njob: |\n  block scalar\n---\n`,
  });
  const { faults: syntaxFaults } = await loadConfig(badSyntax);
  assert.ok(syntaxFaults.some((f) => f.code === "agent.frontmatter" && /line \d+/.test(f.message)), JSON.stringify(syntaxFaults));

  const missing = await tree({ "config.json": MANIFEST(["agents/absent.md"], []) });
  const { faults: missingFaults } = await loadConfig(missing);
  assert.ok(missingFaults.some((f) => f.code === "agent.unreadable"), JSON.stringify(missingFaults));
});

test("loader: a malformed manifest is named, not guessed", async () => {
  const path = await tree({ "config.json": JSON.stringify({ version: "1", agents: [42], graph: { nodes: "nope" } }) });
  const { faults, doc } = await loadConfig(path);
  assert.equal(doc, undefined);
  assert.ok(faults.some((f) => f.code === "schema" && /agents/.test(f.message)), JSON.stringify(faults));
  assert.ok(faults.some((f) => f.code === "schema" && /nodes/.test(f.message)), JSON.stringify(faults));
});