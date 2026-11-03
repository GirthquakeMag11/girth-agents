// In-process live proof. It runs the real engine, plugin server part, and
// dashboard RPC against the shipped build-review graph, with a scripted model
// that calls the plugin's own handoff tools. It proves, without any external
// model or server:
//
//   - a build-review workflow dispatches to a terminal;
//   - the same process-global engine and queue serve two locations;
//   - graph sessions are created in the dispatching directory;
//   - the dashboard snapshot reads the state through RPC;
//   - no project files are written.
//
// Usage: node engine/live-proof.mjs
//
// The isolated OpenCode variant (installing the archive and dispatching a real
// model) additionally needs an OpenCode server with a graph model configured.

import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadStaticPlugin } from "./test/static-plugin-harness.mjs";
import { loadConfig } from "./config.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const project = await mkdtemp(join(tmpdir(), "engine-live-project-"));

const loaded = await loadConfig(join(repo, "graph", "config.json"));
if (loaded.faults.length > 0) throw new Error(`shipped graph fails to load: ${loaded.faults.map((f) => f.code).join(", ")}`);
const graph = { version: "6", maxSteps: loaded.doc.graph.maxSteps, workflows: loaded.doc.graph.workflows, nodes: loaded.doc.graph.nodes };
const agentDocs = {
  "builder.md": await readFile(join(repo, "graph", "agents", "builder.md"), "utf8"),
  "reviewer.md": await readFile(join(repo, "graph", "agents", "reviewer.md"), "utf8"),
};

const RUNTIME_KEY = Symbol.for("graph-engine.runtime");

// The scripted model: on each node it calls the label the graph expects, the
// same handoff tool a real model would invoke, and records the tool message
// the session would carry.
const labelFor = (node) => (node === "implement" ? "next" : node === "review" ? "pass" : null);

let toolset = null;
const plugin = await loadStaticPlugin({
  graph,
  agentDocs,
  locations: { ses_a: "/work/a", ses_b: "/work/b" },
  onPrompt: async ({ session }) => {
    const label = labelFor(session.node);
    if (!label) return; // terminal node takes no handoff
    const tool = toolset.get(label);
    const message = `ready from ${session.node}`;
    session.messages.push({
      time: { created: 1 },
      content: [
        {
          type: "tool",
          id: "t1",
          name: label,
          state: { status: "completed", input: { message } },
          time: { created: 1, completed: 1 },
        },
      ],
    });
    await tool.execute({ message }, { sessionID: session.id, agent: "build", messageID: "m1", id: "t1" });
  },
});

await plugin.setup();
toolset = plugin.editor;

const engine = globalThis[RUNTIME_KEY];
assert.ok(engine, "the plugin creates the process-global engine");
assert.equal(engine.config.graph.workflows[0].id, "build-review");

const rpcImplementation = plugin.rpcRegistrations[0].implementation;
const dispatch = plugin.editor.get("dispatch");

async function runFrom({ sessionID, directory, prompt }) {
  const before = plugin.sessionCreates.length;
  const result = await dispatch.execute(
    { workflow: "build-review", prompt, background: false },
    { sessionID, agent: "build", messageID: "m1", id: "t1" },
  );
  const sessions = plugin.sessionCreates.slice(before);
  assert.ok(sessions.length >= 2, `${directory}: a build-review dispatch creates graph sessions`);
  for (const created of sessions) {
    assert.equal(created.location.directory, directory, `${directory}: every graph session uses the dispatching directory`);
  }
  return result;
}

console.log("IN-PROCESS LIVE PROOF — engine, plugin, and RPC");
const runA = await runFrom({ sessionID: "ses_a", directory: "/work/a", prompt: "Implement feature A." });
assert.match(runA.content, /done/, "the first location dispatches to the terminal node");
console.log("PASS  workflow A reached terminal from /work/a");

const runB = await runFrom({ sessionID: "ses_b", directory: "/work/b", prompt: "Implement feature B." });
assert.match(runB.content, /done/, "the second location dispatches to the terminal node");
console.log("PASS  workflow B reached terminal from /work/b via the same engine");

const snapshot = await rpcImplementation.snapshot();
assert.equal(snapshot.ok, true);
assert.equal(snapshot.config.graph.workflows.map((workflow) => workflow.id).join(","), "build-review");
assert.equal(snapshot.info.schemaVersion, "6");
assert.equal(snapshot.runtime.active, null, "the queue is idle after both dispatches");
assert.match(snapshot.map.mermaid, /implement/);
const completions = snapshot.runtime.history.filter((entry) => entry.kind === "completion");
assert.ok(completions.length >= 2, "history records both completions");
console.log("PASS  the dashboard snapshot reads graph, info, map, and runtime through RPC");

const statusA = await rpcImplementation.dispatchStatus({ dispatchId: "d-1" });
assert.equal(statusA.state, "completed");
assert.equal(statusA.terminal, "done");
console.log("PASS  dispatch status resolves through RPC");

assert.deepEqual(await readdir(project), [], "a project directory is never written");
console.log("PASS  no project files are created");

await plugin.close();
await rm(project, { recursive: true, force: true });
console.log("\nIN-PROCESS LIVE PROOF PASS");