import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRuntime } from "../runtime.mjs";

const emptyTokens = () => ({ input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } });

function terminalGraph(objective = "Do the node.") {
  return {
    version: "5",
    agents: ["agents/builder.md"],
    graph: {
      maxSteps: 10,
      nodes: [{ id: "a", agent: "builder", objective, handoff: { mode: "terminal" } }],
    },
  };
}

const builderDoc = `---
id: builder
model: test/model
agent: build
permissions: [read]
---
Do the node within the dispatched scope.
`;

async function writeGraph(dir, graph) {
  await mkdir(join(dir, "agents"), { recursive: true });
  await writeFile(join(dir, "agents", "builder.md"), builderDoc, "utf8");
  const configPath = join(dir, "config.json");
  await writeFile(configPath, JSON.stringify(graph, null, 2), "utf8");
  return configPath;
}

function fakePluginDriver({ onPrompt = () => ({}) } = {}) {
  const sessions = new Map();
  let next = 0;
  const base = {
    async createSession({ title }) {
      const id = `s${++next}`;
      sessions.set(id, { id, node: String(title).split("/").at(-1) ?? "a", cost: 0, tokens: emptyTokens(), outcome: null });
      return { id };
    },
    async getSession(id) {
      const session = sessions.get(id);
      if (!session) throw new Error("no such session");
      return { id, cost: session.cost, tokens: session.tokens, outcome: session.outcome };
    },
    async prompt(id, text, options) {
      const session = sessions.get(id);
      const result = await onPrompt({ session, node: session.node, brief: text, options });
      session.outcome = result.outcome ?? "succeeded";
      return { id, outcome: session.outcome, cost: session.cost, tokens: session.tokens };
    },
    async messages() {
      return [];
    },
    async interrupt() {},
    async deleteSession() {},
    async plugins() {
      return [];
    },
  };
  return { ...base, forDirectory: () => base };
}

test("runtime: an invalid config fails setup with named faults", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-runtime-invalid-"));
  try {
    const configPath = await writeGraph(dir, { version: "5", agents: [], graph: { nodes: [] } });
    await assert.rejects(
      () => createRuntime({ configPath, driver: fakePluginDriver() }),
      (error) => Array.isArray(error.faults) && error.faults.length > 0 && /invalid graph config/.test(error.message),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("runtime: graph_info and graph_map describe the loaded graph", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-runtime-info-"));
  try {
    const configPath = await writeGraph(dir, terminalGraph());
    const runtime = await createRuntime({ configPath, driver: fakePluginDriver() });

    const info = runtime.graphInfo();
    assert.equal(info.ok, true);
    assert.equal(info.schemaVersion, "5");
    assert.equal(info.graph.nodes[0].id, "a");
    assert.equal(info.agents[0].id, "builder");

    const map = runtime.graphMap();
    assert.equal(map.ok, true);
    assert.match(map.mermaid, /a/);
    assert.match(map.legend, /terminal/);
    assert.ok(map.runtime);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("runtime: dispatch is gated on a matching preflight report", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-runtime-preflight-"));
  try {
    const configPath = await writeGraph(dir, terminalGraph());
    const runtime = await createRuntime({ configPath, driver: fakePluginDriver() });

    await assert.rejects(
      () => runtime.dispatch({ node: "a", prompt: "p", sessionID: "ses" }, dir),
      /preflight/,
    );

    runtime.reportHandoffPreflight({ labels: [], collisions: [], catalogAvailable: true });
    const started = await runtime.dispatch({ node: "a", prompt: "p", sessionID: "ses" }, dir);
    assert.equal(started.ok, true);
    assert.ok(started.dispatchId);

    const finished = await runtime.wait(started.dispatchId, 1000);
    assert.equal(finished.state, "completed");
    assert.equal(finished.terminal, "a");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("runtime: a terminal dispatch completes and its snapshot carries no output", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-runtime-terminal-"));
  try {
    const configPath = await writeGraph(dir, terminalGraph());
    const runtime = await createRuntime({ configPath, driver: fakePluginDriver() });
    runtime.reportHandoffPreflight({ labels: [], collisions: [], catalogAvailable: true });

    const started = await runtime.dispatch({ node: "a", prompt: "p", sessionID: "ses" }, dir);
    const finished = await runtime.wait(started.dispatchId, 1000);

    assert.equal(finished.state, "completed");
    assert.equal("output" in finished, false);
    assert.ok(finished.usage);
    assert.ok(finished.dispatchId);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("runtime: the record-bound directory is used for graph sessions", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-runtime-directory-"));
  try {
    const configPath = await writeGraph(dir, terminalGraph());
    const seen = [];
    const driver = {
      forDirectory(directory) {
        seen.push(directory);
        return fakePluginDriver().forDirectory(directory);
      },
    };
    const runtime = await createRuntime({ configPath, driver });
    runtime.reportHandoffPreflight({ labels: [], collisions: [], catalogAvailable: true });

    await runtime.dispatch({ node: "a", prompt: "p", sessionID: "ses" }, "/work/project");
    assert.deepEqual(seen, ["/work/project"]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("runtime: reload is rejected while a dispatch is active", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-runtime-reload-"));
  try {
    const configPath = await writeGraph(dir, terminalGraph());
    let release;
    const runtime = await createRuntime({
      configPath,
      driver: fakePluginDriver({ onPrompt: () => new Promise((resolve) => (release = resolve)) }),
    });
    runtime.reportHandoffPreflight({ labels: [], collisions: [], catalogAvailable: true });

    await runtime.dispatch({ node: "a", prompt: "p", sessionID: "ses" }, dir);
    await assert.rejects(() => runtime.reload(), /a dispatch is active/);

    release({ outcome: "succeeded" });
    await runtime.wait("d-1", 1000);
    const after = await runtime.reload();
    assert.equal(after.valid, true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("runtime: reload applies a description change without changing labels", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-runtime-reload-apply-"));
  try {
    const configPath = await writeGraph(dir, terminalGraph("Before."));
    const runtime = await createRuntime({ configPath, driver: fakePluginDriver() });
    runtime.reportHandoffPreflight({ labels: [], collisions: [], catalogAvailable: true });

    assert.equal(runtime.graphInfo().graph.nodes[0].objective, "Before.");

    const next = terminalGraph("After.");
    await writeFile(configPath, JSON.stringify(next, null, 2), "utf8");
    const result = await runtime.reload();
    assert.equal(result.valid, true);
    assert.equal(runtime.graphInfo().graph.nodes[0].objective, "After.");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});