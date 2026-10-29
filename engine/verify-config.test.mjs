import test from "node:test";
import assert from "node:assert/strict";
import { verifyConfig } from "./verify-config.mjs";

const fitting = (extra = {}) => ({
  job: "a worker",
  model: "m/x",
  capabilities: ["fs"],
  permissions: { allow: ["fs"], denyRest: true },
  body: "# The worker's craft\n\nDo the work to its criteria.",
  skills: [{ id: "craft", instructions: "# The craft\n\nDo the work to its criteria." }],
  ...extra,
});

function config({ nodes, links, agents = { builder: fitting(), checker: fitting() } }) {
  return { version: "1", agents, graph: { nodes, links } };
}

const SOUND_NODES = [
  { id: "in", type: "entry", marker: "CONFIRMED" },
  { id: "build", type: "task", helper: "builder", artifact: "stamped.json", budgetMs: 5000, objective: "Build it" },
  { id: "grade", type: "task", helper: "checker", artifact: "verdict.json", budgetMs: 5000, objective: "Grade it" },
  { id: "out-pass", type: "exit" },
  { id: "out-fail", type: "exit", record: { kind: "question" } },
];
// strict routing: pass and fail are the declared branch space; anything
// else is the engine's loud defect, not a route
const SOUND_LINKS = [
  { from: "in", to: "build" },
  { from: "build", to: "grade" },
  { from: "grade", to: "out-pass", condition: { field: "verdict", equals: "pass" } },
  { from: "grade", to: "out-fail", condition: { field: "verdict", equals: "fail" } },
];

test("verifier: a sound config verifies clean", async () => {
  const result = await verifyConfig(config({ nodes: SOUND_NODES, links: SOUND_LINKS }));
  assert.equal(result.valid, true, JSON.stringify(result.configFaults));
  assert.deepEqual(result.configFaults, []);
});

test("verifier: skills are reusable and optional — an agent's craft is its own body, never a skill's", async () => {
  // an agent without any skill still verifies sound: its substance is its
  // own body. Skills are techniques it may be given, not the agent itself.
  const bodiedOnly = await verifyConfig(config({
    nodes: SOUND_NODES,
    links: SOUND_LINKS,
    agents: { builder: fitting({ skills: undefined }), checker: fitting({ skills: undefined }) },
  }));
  assert.equal(bodiedOnly.valid, true, JSON.stringify(bodiedOnly.configFaults));

  // a skill name alone, no craft in the agent, is the old inversion — now a named fault
  const shell = await verifyConfig(config({
    nodes: SOUND_NODES,
    links: SOUND_LINKS,
    agents: {
      builder: fitting({ body: undefined }),
      checker: fitting(),
    },
  }));
  assert.ok(shell.configFaults.some((f) => f.code === "schema" && /body must be non-empty|craft lives in its own file/.test(f.message)), JSON.stringify(shell.configFaults));
});

test("verifier: schema faults are named with their constraint", async () => {
  const missingArtifact = await verifyConfig(config({
    nodes: [{ id: "in", type: "entry" }, { id: "t", type: "task", helper: "builder", objective: "do" }],
    links: [],
  }));
  assert.equal(missingArtifact.valid, false);
  assert.ok(missingArtifact.configFaults.some((f) => f.code === "schema" && /artifact/.test(f.message)), JSON.stringify(missingArtifact.configFaults));

  const badBudget = await verifyConfig(config({
    nodes: [
      { id: "in", type: "entry" },
      { id: "t", type: "task", helper: "builder", artifact: "a.json", budgetMs: -3, objective: "do" },
    ],
    links: [],
  }));
  assert.ok(badBudget.configFaults.some((f) => f.code === "schema" && /budgetMs/.test(f.message)));

  const incompleteFitting = await verifyConfig({
    version: "1",
    agents: { builder: { job: "worker" } }, // no capabilities, permissions, model, or craft
    graph: { nodes: [], links: [] },
  });
  assert.ok(incompleteFitting.configFaults.some((f) => f.code === "schema" && /capabilities|permissions|model|body/.test(f.message)), JSON.stringify(incompleteFitting.configFaults));
});

test("verifier: structural faults — dangling links, unknown helpers, dead structure", async () => {
  const dangling = await verifyConfig(config({
    nodes: SOUND_NODES,
    links: [...SOUND_LINKS, { from: "grade", to: "nowhere" }],
  }));
  assert.ok(dangling.configFaults.some((f) => f.code === "graph.dangling-link" && /nowhere/.test(f.message)));

  const ghost = await verifyConfig(config({
    nodes: SOUND_NODES.map((n) => (n.id === "build" ? { ...n, helper: "ghost" } : n)),
    links: SOUND_LINKS,
  }));
  assert.ok(ghost.configFaults.some((f) => f.code === "graph.unknown-helper" && /ghost/.test(f.message)));

  const overreach = await verifyConfig(config({
    nodes: SOUND_NODES.map((n) => (n.id === "build" ? { ...n, requires: ["network"] } : n)),
    links: SOUND_LINKS,
  }));
  assert.ok(overreach.configFaults.some((f) => f.code === "graph.requires-beyond-fitting" && /network/.test(f.message)));

  const unreachable = await verifyConfig(config({
    nodes: [...SOUND_NODES, { id: "orphan", type: "task", helper: "builder", artifact: "x.json", objective: "do" }],
    links: SOUND_LINKS,
  }));
  assert.ok(unreachable.configFaults.some((f) => f.code === "graph.unreachable" && /orphan/.test(f.message)));

  const routedExit = await verifyConfig(config({
    nodes: SOUND_NODES,
    links: [...SOUND_LINKS, { from: "out-pass", to: "build" }],
  }));
  assert.ok(routedExit.configFaults.some((f) => f.code === "graph.exit-routed"));

  const noEntry = await verifyConfig(config({
    nodes: SOUND_NODES.filter((n) => n.type !== "entry"),
    links: SOUND_LINKS.slice(1),
  }));
  assert.ok(noEntry.configFaults.some((f) => f.code === "graph.no-entry"));
});

test("verifier: an unmodeled verdict is a runtime defect, not a config fault — only-pass still verifies sound", async () => {
  // only 'pass' is modeled; that is a legal config: everything else
  // defects loudly at runtime, and the no-match probe expects exactly that
  const onlyPass = await verifyConfig(config({
    nodes: SOUND_NODES.filter((n) => n.id !== "out-fail"),
    links: [
      { from: "in", to: "build" },
      { from: "build", to: "grade" },
      { from: "grade", to: "out-pass", condition: { field: "verdict", equals: "pass" } },
    ],
  }));
  assert.equal(onlyPass.valid, true, JSON.stringify(onlyPass.configFaults));
});

test("verifier: mixed routing — conditions plus a catch-all — is named, never allowed", async () => {
  const mixed = await verifyConfig(config({
    nodes: SOUND_NODES,
    links: [...SOUND_LINKS, { from: "grade", to: "out-fail" }],
  }));
  assert.equal(mixed.valid, false);
  assert.ok(mixed.configFaults.some((f) => f.code === "graph.mixed-routing"), JSON.stringify(mixed.configFaults));

  const multi = await verifyConfig(config({
    nodes: SOUND_NODES,
    links: [
      { from: "in", to: "build" },
      { from: "build", to: "grade" },
      { from: "build", to: "out-pass" },
      { from: "grade", to: "out-pass", condition: { field: "verdict", equals: "pass" } },
    ],
  }));
  assert.ok(multi.configFaults.some((f) => f.code === "graph.multi-unconditional"), JSON.stringify(multi.configFaults));
});

test("verifier: retry bounds are schema- and structure-checked", async () => {
  const badBound = await verifyConfig(config({
    nodes: [
      { id: "in", type: "entry" },
      { id: "t", type: "task", helper: "builder", artifact: "a.json", maxVisits: 0, objective: "do" },
    ],
    links: [{ from: "in", to: "t" }],
  }));
  assert.ok(badBound.configFaults.some((f) => f.code === "schema" && /maxVisits/.test(f.message)), JSON.stringify(badBound.configFaults));

  const noExhaust = await verifyConfig(config({
    nodes: [
      { id: "in", type: "entry" },
      { id: "t", type: "task", helper: "builder", artifact: "a.json", maxVisits: 3, objective: "do" },
      { id: "out", type: "exit" },
    ],
    links: [
      { from: "in", to: "t" },
      { from: "t", to: "out" },
    ],
  }));
  assert.ok(noExhaust.configFaults.some((f) => f.code === "graph.retry-no-exhaust"), JSON.stringify(noExhaust.configFaults));
});

test("verifier: a cycle with no escape is named a matrix loop, not a crash or silence", async () => {
  // a truly escapeless cycle: no exit node, no condition — every lap
  // returns to the cycle, so the matrix must name the runaway loop
  const looped = await verifyConfig(config({
    nodes: [
      { id: "in", type: "entry", marker: "CONFIRMED" },
      { id: "a", type: "task", helper: "checker", artifact: "a.json", budgetMs: 5000, objective: "A" },
      { id: "b", type: "task", helper: "builder", artifact: "b.json", budgetMs: 5000, objective: "B" },
    ],
    links: [
      { from: "in", to: "a" },
      { from: "a", to: "b" },
      { from: "b", to: "a" },
    ],
  }));
  assert.equal(looped.valid, false);
  assert.ok(
    looped.configFaults.some((f) => f.code === "graph.matrix.step-overflow"),
    JSON.stringify(looped.configFaults),
  );
});