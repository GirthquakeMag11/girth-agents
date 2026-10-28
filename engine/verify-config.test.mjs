import test from "node:test";
import assert from "node:assert/strict";
import { verifyConfig } from "./verify-config.mjs";

const fitting = (extra = {}) => ({
  job: "a worker",
  model: "m/x",
  capabilities: ["fs"],
  permissions: { allow: ["fs"], denyRest: true },
  ...extra,
});

function config({ nodes, links, helpers = { builder: fitting(), checker: fitting() } }) {
  return JSON.stringify({ version: "1", helpers, graph: { nodes, links } });
}

const SOUND_NODES = [
  { id: "in", type: "entry", marker: "CONFIRMED" },
  { id: "build", type: "task", helper: "builder", artifact: "stamped.json", budgetMs: 5000 },
  { id: "grade", type: "task", helper: "checker", artifact: "verdict.json", budgetMs: 5000 },
  { id: "out-pass", type: "exit" },
  { id: "out-fail", type: "exit", record: { kind: "question" } },
];
// every verdict routes: pass and fail conditionally, anything else by
// the unconditional fallback — the verifier's no-match probe demands it
const SOUND_LINKS = [
  { from: "in", to: "build" },
  { from: "build", to: "grade" },
  { from: "grade", to: "out-pass", condition: { field: "verdict", equals: "pass" } },
  { from: "grade", to: "out-fail", condition: { field: "verdict", equals: "fail" } },
  { from: "grade", to: "out-fail" },
];

test("verifier: a sound config verifies clean", async () => {
  const result = await verifyConfig(config({ nodes: SOUND_NODES, links: SOUND_LINKS }));
  assert.equal(result.valid, true, JSON.stringify(result.configFaults));
  assert.deepEqual(result.configFaults, []);
});

test("verifier: schema faults are named with their constraint", async () => {
  const missingArtifact = await verifyConfig(config({
    nodes: [{ id: "in", type: "entry" }, { id: "t", type: "task", helper: "builder" }],
    links: [],
  }));
  assert.equal(missingArtifact.valid, false);
  assert.ok(missingArtifact.configFaults.some((f) => f.code === "schema" && /artifact/.test(f.message)), JSON.stringify(missingArtifact.configFaults));

  const badBudget = await verifyConfig(config({
    nodes: [
      { id: "in", type: "entry" },
      { id: "t", type: "task", helper: "builder", artifact: "a.json", budgetMs: -3 },
    ],
    links: [],
  }));
  assert.ok(badBudget.configFaults.some((f) => f.code === "schema" && /budgetMs/.test(f.message)));

  const incompleteFitting = await verifyConfig(JSON.stringify({
    version: "1",
    helpers: { builder: { job: "worker" } }, // no capabilities, permissions, or model
    graph: { nodes: [], links: [] },
  }));
  assert.ok(incompleteFitting.configFaults.some((f) => f.code === "schema" && /capabilities|permissions|model/.test(f.message)), JSON.stringify(incompleteFitting.configFaults));
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
    nodes: [...SOUND_NODES, { id: "orphan", type: "task", helper: "builder", artifact: "x.json" }],
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

test("verifier: a trapped matrix path is named — the fail verdict has no route", async () => {
  // only 'pass' is modeled; any other verdict (fail included) dead-ends
  const trapped = await verifyConfig(config({
    nodes: SOUND_NODES.filter((n) => n.id !== "out-fail"),
    links: [
      { from: "in", to: "build" },
      { from: "build", to: "grade" },
      { from: "grade", to: "out-pass", condition: { field: "verdict", equals: "pass" } },
    ],
  }));
  assert.equal(trapped.valid, false);
  assert.ok(
    trapped.configFaults.some((f) => f.code === "graph.matrix.no-link" && /no routable/.test(f.message)),
    JSON.stringify(trapped.configFaults),
  );
});

test("verifier: a cycle with no escape is named a matrix loop, not a crash or silence", async () => {
  // grade → repair(grade's own session is never, resume not used) → grade, with no exit for fail
  const looped = await verifyConfig(config({
    nodes: [
      { id: "in", type: "entry", marker: "CONFIRMED" },
      { id: "grade", type: "task", helper: "checker", artifact: "verdict.json", budgetMs: 5000 },
      { id: "repair", type: "task", helper: "builder", artifact: "verdict.json", budgetMs: 5000 },
      { id: "out-pass", type: "exit" },
    ],
    links: [
      { from: "in", to: "grade" },
      { from: "grade", to: "out-pass", condition: { field: "verdict", equals: "pass" } },
      { from: "grade", to: "repair", condition: { field: "verdict", equals: "fail" } },
      { from: "repair", to: "grade" },
    ],
  }));
  assert.equal(looped.valid, false);
  assert.ok(
    looped.configFaults.some((f) => f.code === "graph.matrix.step-overflow"),
    JSON.stringify(looped.configFaults),
  );
});