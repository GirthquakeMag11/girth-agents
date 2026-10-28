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

const MANIFEST = (agents, nodes, skills = []) => JSON.stringify({ version: "1", agents, skills, graph: { nodes } });

test("loader: resolves the manifest into agents bearing their skills, nodes with their bodies and out-links", async () => {
  const path = await tree({
    "config.json": MANIFEST(
      ["agents/builder.md", "agents/checker.md"],
      ["nodes/build.md", "nodes/out.md"],
      ["skills/building.md"],
    ),
    "agents/builder.md": `---\nid: builder\njob: Build it\nmodel: m/b\ncapabilities: [fs]\npermissions:\n  allow: [fs]\nskills: [skills/building.md]\n---\nThe builder produces the piece the objective names.`,
    "agents/checker.md": `---\nid: checker\njob: Grade it\nmodel: m/c\ncapabilities: [fs]\npermissions:\n  allow: [fs]\n---\n`,
    "skills/building.md": `---\nid: building\ndescription: Build to the criteria and fail openly.\n---\n# The builder's craft\n\nBuild to the criteria.`,
    "nodes/build.md": `---\nid: build\ntype: task\nhelper: builder\nartifact: out.json\nobjective: Build the piece\nout:\n  - to: out\n    condition:\n      field: verdict\n      equals: pass\n  - to: out\n---\nOnly the objective's scope.`,
    "nodes/out.md": `---\nid: out\ntype: exit\n---\n`,
  });
  const { faults, doc } = await loadConfig(path);
  assert.deepEqual(faults, []);
  assert.equal(doc.skills.building.instructions.includes("# The builder's craft"), true);
  assert.equal(doc.agents.builder.skills.length, 1);
  assert.equal(doc.agents.builder.skills[0].id, "building");
  assert.equal(doc.agents.builder.skills[0].instructions.includes("Build to the criteria"), true);
  assert.equal(doc.agents.checker.skills, undefined, "an agent with no skills carries none");
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
    skills: {
      building: { description: "Build to the criteria.", instructions: "# craft" },
    },
    agents: {
      builder: {
        job: "Build", model: "m", capabilities: ["fs"],
        permissions: { allow: ["fs"], denyRest: true },
        skills: ["skills/building.md"],
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

test("loader: skills are first-class — missing files and unknown references are named faults", async () => {
  const missingSkill = await tree({
    "config.json": MANIFEST([], [], ["skills/absent.md"]),
  });
  const { faults: absentFaults } = await loadConfig(missingSkill);
  assert.ok(absentFaults.some((f) => f.code === "skill.unreadable"), JSON.stringify(absentFaults));

  const unknownRef = await tree({
    "config.json": MANIFEST(["agents/loner.md"], [], ["skills/known.md"]),
    "agents/loner.md": `---\nid: loner\njob: x\nmodel: m\ncapabilities: [fs]\npermissions: [fs]\nskills: [skills/ghost.md]\n---\n`,
    "skills/known.md": `---\nid: known\n---\nbody`,
  });
  const { faults: refFaults } = await loadConfig(unknownRef);
  assert.ok(refFaults.some((f) => f.code === "agent.unknown-skill" && /skills\/ghost\.md/.test(f.message)), JSON.stringify(refFaults));
});

test("loader: a malformed manifest is named, not guessed", async () => {
  const path = await tree({ "config.json": JSON.stringify({ version: "1", agents: [42], graph: { nodes: "nope" } }) });
  const { faults, doc } = await loadConfig(path);
  assert.equal(doc, undefined);
  assert.ok(faults.some((f) => f.code === "schema" && /agents/.test(f.message)), JSON.stringify(faults));
  assert.ok(faults.some((f) => f.code === "schema" && /nodes/.test(f.message)), JSON.stringify(faults));
});