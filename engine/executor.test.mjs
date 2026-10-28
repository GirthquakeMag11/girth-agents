import test from "node:test";
import assert from "node:assert/strict";
import { createExecutor } from "./executor.mjs";

// The fixture graph: in → build → grade → (pass → out-accepted / fail → out-rejected).
const GRAPH = {
  nodes: [
    { id: "in", type: "entry" },
    { id: "build", type: "task", helper: "builder", artifact: "stamped.json", budgetMs: 5000 },
    { id: "grade", type: "task", helper: "checker", artifact: "verdict.json", budgetMs: 5000 },
    { id: "out-accepted", type: "exit" },
    { id: "out-rejected", type: "exit" },
  ],
  links: [
    { from: "in", to: "build" },
    { from: "build", to: "grade" },
    { from: "grade", to: "out-accepted", condition: { field: "verdict", equals: "pass" } },
    { from: "grade", to: "out-rejected", condition: { field: "verdict", equals: "fail" } },
  ],
};

const artifactPath = (projectId, node) => `${projectId}/${node.artifact}`;

function fakeDriver({ outcome = "succeeded", neverResolves = [] } = {}) {
  const sessions = [];
  return {
    sessions,
    spawn({ nodeId }) {
      sessions.push({ nodeId, interrupted: false });
      return sessions.length - 1;
    },
    prompt(sessionIdx) {
      const session = sessions[sessionIdx];
      if (neverResolves.includes(session.nodeId)) {
        return new Promise((resolve) => (session._resolve = resolve)); // held until interrupt
      }
      return Promise.resolve({ outcome });
    },
    interrupt(sessionIdx) {
      const session = sessions[sessionIdx];
      session.interrupted = true;
      if (session._resolve) {
        session._resolve({ outcome: "interrupted" });
        session._resolve = null;
      }
    },
  };
}

// readFile serving a fixed set of per-project files; anything else is missing.
function artifactSource(entries) {
  return {
    async readFile(path) {
      return entries[path] ?? null;
    },
  };
}

function artifacts(projectId, verdict) {
  return {
    [`${projectId}/stamped.json`]: JSON.stringify({ done: true }),
    [`${projectId}/verdict.json`]: JSON.stringify({ verdict }),
  };
}

function executor({ graph = GRAPH, driver, entries, projectId }) {
  const source = artifactSource(entries ?? artifacts(projectId, "pass"));
  return createExecutor({ graph, driver, readFile: source.readFile, artifactPath });
}

test("executor: the fixture graph walks a pass to the accepted exit", async () => {
  const driver = fakeDriver();
  const ex = executor({ driver, projectId: "repo-a" });
  const result = await ex.run({ projectId: "repo-a", entryNode: "in" });
  assert.equal(result.terminal, "out-accepted");
  assert.deepEqual(result.steps.map((s) => s.nodeId), ["in", "build", "grade"]);
  assert.equal(result.failure, undefined);
});

test("executor: the verdict condition routes a fail to the rejected exit", async () => {
  const ex = executor({ driver: fakeDriver(), entries: artifacts("repo-b", "fail"), projectId: "repo-b" });
  const result = await ex.run({ projectId: "repo-b", entryNode: "in" });
  assert.equal(result.terminal, "out-rejected");
});

test("executor: a time-budget breach interrupts the step and reports a defect", async () => {
  const graph = { ...GRAPH, nodes: GRAPH.nodes.map((n) => (n.id === "build" ? { ...n, budgetMs: 10 } : n)) };
  const driver = fakeDriver({ neverResolves: ["build"] });
  const ex = executor({ graph, driver, projectId: "repo-c" });
  const result = await ex.run({ projectId: "repo-c", entryNode: "in" });
  assert.equal(result.failure.kind, "time-budget");
  assert.ok(result.failure.message.includes("build"), result.failure.message);
  assert.equal(driver.sessions.find((s) => s.nodeId === "build").interrupted, true);
  assert.ok(!result.steps.some((s) => s.nodeId === "grade"), "the chain must not silently continue");
});

test("executor: a failed session is a defect, never a silent pass", async () => {
  const driver = fakeDriver({ outcome: "failed" });
  const ex = executor({ driver, projectId: "repo-d" });
  const result = await ex.run({ projectId: "repo-d", entryNode: "in" });
  assert.equal(result.failure.kind, "session-failed");
  assert.ok(!result.steps.some((s) => s.nodeId === "grade"));
});

test("executor: a missing or malformed artifact is a defect, never a silent pass", async () => {
  for (const content of [null, "not json"]) {
    const driver = fakeDriver();
    const source = artifactSource({ "repo-e/stamped.json": content, "repo-e/verdict.json": content });
    const ex = createExecutor({ graph: GRAPH, driver, readFile: source.readFile, artifactPath });
    const result = await ex.run({ projectId: "repo-e", entryNode: "in" });
    assert.match(result.failure.kind, /artifact/);
    assert.ok(!result.steps.some((s) => s.nodeId === "grade"));
  }
});

test("executor: a repair node resumes the graded session, not a fresh one", async () => {
  // in → build → grade; grade/fail → repair (resumes build's session) → grade again → accepted
  const graph = {
    nodes: [
      { id: "in", type: "entry" },
      { id: "build", type: "task", helper: "builder", artifact: "stamped.json", budgetMs: 5000 },
      { id: "grade", type: "task", helper: "checker", artifact: "verdict.json", budgetMs: 5000 },
      { id: "repair", type: "task", helper: "builder", artifact: "stamped.json", budgetMs: 5000, resume: "build" },
      { id: "out-accepted", type: "exit" },
    ],
    links: [
      { from: "in", to: "build" },
      { from: "build", to: "grade" },
      { from: "grade", to: "out-accepted", condition: { field: "verdict", equals: "pass" } },
      { from: "grade", to: "repair", condition: { field: "verdict", equals: "fail" } },
      { from: "repair", to: "grade" },
    ],
  };
  const driver = fakeDriver();
  driver.promptCalls = new Map();
  const track = (fn) => (idx) => {
    driver.promptCalls.set(idx, (driver.promptCalls.get(idx) ?? 0) + 1);
    return fn(idx);
  };
  const basePrompt = driver.prompt.bind(driver);
  driver.prompt = track(basePrompt);

  let verdictReads = 0;
  const ex = createExecutor({
    graph,
    driver,
    readFile: async (path) => {
      if (path.endsWith("verdict.json")) {
        verdictReads += 1;
        return JSON.stringify({ verdict: verdictReads === 1 ? "fail" : "pass" });
      }
      return JSON.stringify({ done: true });
    },
    artifactPath: (projectId, node) => `${projectId}/${node.artifact}`,
  });
  const result = await ex.run({ projectId: "repo-f", entryNode: "in" });
  assert.equal(result.terminal, "out-accepted", JSON.stringify(result.failure));
  assert.equal(verdictReads, 2);
  // build's session was prompted twice; the repair ran in it, not a new session
  const buildSession = driver.sessions.find((s) => s.nodeId === "build");
  assert.equal(driver.promptCalls.get(driver.sessions.indexOf(buildSession)), 2);
  assert.equal(driver.sessions.filter((s) => s.nodeId === "repair").length, 0, "repair must not spawn");
});

test("executor: a dispatch-time requirements failure is a named defect before any session", async () => {
  const driver = {
    prompted: 0,
    spawn() {
      throw new Error("checker lacks bash");
    },
    prompt() {
      this.prompted += 1;
      return Promise.resolve({ outcome: "succeeded" });
    },
    interrupt() {},
  };
  const ex = createExecutor({ graph: GRAPH, driver, readFile: async () => "{}", artifactPath });
  const result = await ex.run({ projectId: "repo-g", entryNode: "in" });
  assert.equal(result.failure.kind, "dispatch-defect");
  assert.ok(result.failure.message.includes("bash"));
  assert.equal(driver.prompted, 0, "no session may be prompted after a dispatch defect");
});

test("executor: maxVisits bounds a repair loop, routing the exhausted link on the excess", async () => {
  const graph = {
    nodes: [
      { id: "in", type: "entry" },
      { id: "build", type: "task", helper: "builder", artifact: "out.json", budgetMs: 5000 },
      { id: "grade", type: "task", helper: "checker", artifact: "verdict.json", budgetMs: 5000 },
      { id: "repair", type: "task", helper: "builder", artifact: "out.json", budgetMs: 5000, resume: "build", maxVisits: 3 },
      { id: "bounce", type: "exit" },
    ],
    links: [
      { from: "in", to: "build" },
      { from: "build", to: "grade" },
      { from: "grade", to: "repair", condition: { field: "verdict", equals: "fail" } },
      { from: "grade", to: "bounce", condition: { field: "verdict", equals: "pass" } },
      { from: "repair", to: "grade" },
      { from: "repair", to: "bounce", exhausted: true },
    ],
  };
  const driver = fakeDriver();
  driver.promptCalls = new Map();
  const base = driver.prompt.bind(driver);
  driver.prompt = (idx) => {
    driver.promptCalls.set(idx, (driver.promptCalls.get(idx) ?? 0) + 1);
    return base(idx);
  };
  const ex = createExecutor({
    graph,
    driver,
    readFile: async () => JSON.stringify({ verdict: "fail" }),
    artifactPath: (p, n) => `${p}/${n.artifact}`,
  });
  const result = await ex.run({ projectId: "repo-h", entryNode: "in" });
  assert.equal(result.terminal, "bounce", JSON.stringify(result.failure));
  assert.equal(result.failure, undefined);
  const buildSession = driver.sessions.find((s) => s.nodeId === "build");
  // build's session: the build plus exactly three repairs — never a fourth
  assert.equal(driver.promptCalls.get(driver.sessions.indexOf(buildSession)), 4);
  assert.equal(
    result.steps.filter((s) => s.nodeId === "repair" && s.outcome !== "exhausted").length,
    3,
    "repair must run three times, then the exhausted link takes over",
  );
});

test("executor: maxVisits without an exhausted link is a named retry-limit failure", async () => {
  const graph = {
    nodes: [
      { id: "in", type: "entry" },
      { id: "grade", type: "task", helper: "checker", artifact: "verdict.json", budgetMs: 5000 },
      { id: "repair", type: "task", helper: "checker", artifact: "verdict.json", budgetMs: 5000, maxVisits: 1 },
    ],
    links: [
      { from: "in", to: "grade" },
      { from: "grade", to: "repair", condition: { field: "verdict", equals: "fail" } },
      { from: "repair", to: "grade" },
    ],
  };
  const ex = createExecutor({
    graph,
    driver: fakeDriver(),
    readFile: async () => JSON.stringify({ verdict: "fail" }),
    artifactPath: (p, n) => `${p}/${n.artifact}`,
  });
  const result = await ex.run({ projectId: "repo-i", entryNode: "in" });
  assert.equal(result.failure.kind, "retry-limit");
  assert.ok(/maxVisits/.test(result.failure.message));
});

test("executor: the dispatched brief carries the fitting's craft and the node's objective", async () => {
  const briefs = [];
  const driver = fakeDriver();
  driver.briefs = briefs;
  const base = driver.prompt.bind(driver);
  driver.prompt = (idx, brief) => {
    briefs.push({ idx, brief });
    return base(idx);
  };
  const graph = {
    nodes: [
      { id: "in", type: "entry" },
      { id: "build", type: "task", helper: "builder", artifact: "out.json", budgetMs: 5000, objective: "Build the spec for the claimed plan" },
      { id: "out", type: "exit" },
    ],
    links: [
      { from: "in", to: "build" },
      { from: "build", to: "out" },
    ],
  };
  const agents = {
    builder: { skills: [{ id: "building", instructions: "# The builder's craft\n\nFollow the criteria; produce the artifact." }] },
  };
  const ex = createExecutor({
    graph,
    driver,
    agents,
    readFile: async () => JSON.stringify({ done: true }),
    artifactPath: (p, n) => `${p}/${n.artifact}`,
  });
  const result = await ex.run({ projectId: "repo-j", entryNode: "in" });
  assert.equal(result.failure, undefined, JSON.stringify(result.failure));
  assert.equal(briefs.length, 1);
  assert.ok(briefs[0].brief.includes("# The builder's craft"), briefs[0].brief);
  assert.ok(briefs[0].brief.includes("Build the spec for the claimed plan"), briefs[0].brief);
  assert.ok(briefs[0].brief.includes("out.json"), "the brief must name the artifact to produce");
});

test("executor: a repair brief carries the failed step's report as added context", async () => {
  const briefs = [];
  const driver = fakeDriver();
  driver.briefs = briefs;
  const base = driver.prompt.bind(driver);
  driver.prompt = (idx, brief) => {
    briefs.push({ idx, brief });
    return base(idx);
  };
  const graph = {
    nodes: [
      { id: "in", type: "entry" },
      { id: "build", type: "task", helper: "builder", artifact: "out.json", budgetMs: 5000, objective: "Build it" },
      { id: "grade", type: "task", helper: "checker", artifact: "verdict.json", budgetMs: 5000, objective: "Grade it" },
      { id: "repair", type: "task", helper: "builder", artifact: "out.json", budgetMs: 5000, resume: "build", objective: "Fix it" },
      { id: "out", type: "exit" },
    ],
    links: [
      { from: "in", to: "build" },
      { from: "build", to: "grade" },
      { from: "grade", to: "out", condition: { field: "verdict", equals: "pass" } },
      { from: "grade", to: "repair", condition: { field: "verdict", equals: "fail" } },
      { from: "repair", to: "grade" },
    ],
  };
  const agents = {
    builder: { skills: [{ id: "building", instructions: "builder craft" }] },
    checker: { skills: [{ id: "grading", instructions: "checker craft" }] },
  };
  let verdicts = 0;
  const ex = createExecutor({
    graph,
    driver,
    agents,
    readFile: async (path) => {
      if (path.endsWith("verdict.json")) {
        verdicts += 1;
        return JSON.stringify({ verdict: verdicts === 1 ? "fail" : "pass", note: "the criteria say X is unmet" });
      }
      return JSON.stringify({ done: true });
    },
    artifactPath: (p, n) => `${p}/${n.artifact}`,
  });
  const result = await ex.run({ projectId: "repo-k", entryNode: "in" });
  assert.equal(result.terminal, "out", JSON.stringify(result.failure));
  const repairBrief = briefs.find((b) => b.brief.includes("Fix it"));
  assert.ok(repairBrief, `no repair brief in ${JSON.stringify(briefs)}`);
  assert.ok(repairBrief.brief.includes("criteria say X is unmet"), "the reviewer's report must ride into the repair brief");
});

test("executor: two projects interleave without either losing its serial lane", async () => {
  const mk = (projectId, verdict) =>
    executor({ driver: fakeDriver(), entries: artifacts(projectId, verdict), projectId });
  const [ra, rb] = await Promise.all([
    mk("a", "pass").run({ projectId: "a", entryNode: "in" }),
    mk("b", "fail").run({ projectId: "b", entryNode: "in" }),
  ]);
  assert.equal(ra.terminal, "out-accepted");
  assert.equal(rb.terminal, "out-rejected");
  assert.ok(ra.steps.every((s) => s.projectId === "a"), "project a must stay serial in a");
  assert.ok(rb.steps.every((s) => s.projectId === "b"), "project b must stay serial in b");
  assert.deepEqual(ra.steps.map((s) => s.nodeId), ["in", "build", "grade"]);
});