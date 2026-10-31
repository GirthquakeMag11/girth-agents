// Live dashboard proof. It uses the real engine and the real OpenCode handoff
// plugin against the runnable boundary fixtures. No dashboard edits or model
// calls are made while the engine is paused for the queue proof.
//
// Usage:
//   node dashboard/proof/live.mjs
//
// Artifacts:
//   dashboard/proof/live-proof.json     (observed runtime/engagement rows)
//   terminal output can be captured with `... | tee dashboard/proof/live-proof.log`

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDashboard } from "../src/data.mjs";
import { detailsMemberships, engagementModel } from "../src/model.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const enginePath = join(repo, "engine", "engine.mjs");
const workspace = `/tmp/opencode/dashboard-live-${process.pid}`;
const strictWorkspace = `${workspace}-strict`;
const evidence = { startedAt: new Date().toISOString(), rows: [] };

let child;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitFor(predicate, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const poll = () => {
      const found = predicate();
      if (found) return resolve(found);
      if (Date.now() >= deadline) return reject(new Error(`timeout: ${label}`));
      setTimeout(poll, 100);
    };
    poll();
  });
}

async function startEngine(directory, configFile) {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  await cp(configFile, join(directory, "graph.json"));
  await mkdir(join(directory, ".opencode", "agents"), { recursive: true });
  await mkdir(join(directory, ".opencode", "commands"), { recursive: true });
  await writeFile(
    join(directory, ".opencode", "agents", "graph-view.md"),
    "---\ndescription: Read-only graph view.\n---\nCall graph_map.\n",
    "utf8",
  );
  await writeFile(join(directory, ".opencode", "commands", "graph.md"), "---\nagent: graph-view\n---\n", "utf8");

  const events = [];
  child = spawn(process.execPath, [enginePath, "graph.json"], {
    cwd: directory,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let pending = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    pending += chunk;
    let index;
    while ((index = pending.indexOf("\n")) !== -1) {
      const line = pending.slice(0, index).trim();
      pending = pending.slice(index + 1);
      if (!line) continue;
      try {
        events.push(JSON.parse(line));
      } catch {
        // ignored
      }
    }
  });
  child.stderr.on("data", (data) => process.stderr.write(data));

  const ready = await waitFor(() => events.find((event) => event.kind === "ready"), 60000, "engine ready");
  assert.equal(ready.pluginActive, true, "the handoff plugin must be active");

  const pluginSource = await readFile(
    join(directory, ".opencode", "plugins", "engine-handoff", "index.ts"),
    "utf8",
  );
  const url = /const ENGINE_URL = "([^"]+)"/.exec(pluginSource)?.[1];
  const token = /const TOKEN = "([^"]+)"/.exec(pluginSource)?.[1];
  assert.ok(url && token, "the engine endpoint must be installed");
  const control = async (path, body = {}) => {
    const res = await fetch(url + path, {
      method: "POST",
      headers: { "content-type": "application/json", "x-engine-token": token },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`${path} ${res.status}: ${json?.error ?? JSON.stringify(json)}`);
    return json;
  };
  const send = (poke) => child.stdin.write(JSON.stringify(poke) + "\n");
  const waitRuntime = async (predicate, timeoutMs, label) => {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const map = await control("/tool/graph-map");
      if (predicate(map.runtime)) return map.runtime;
      if (Date.now() >= deadline) throw new Error(`timeout: ${label}`);
      await sleep(250);
    }
  };
  const waitEvent = (kind, timeoutMs = 10000) =>
    waitFor(() => events.find((event) => event.kind === kind), timeoutMs, kind);

  await assert.rejects(() => readFile(join(directory, ".opencode", "agents", "graph-view.md"), "utf8"));
  await assert.rejects(() => readFile(join(directory, ".opencode", "commands", "graph.md"), "utf8"));

  return { directory, control, send, waitRuntime, waitEvent, config: JSON.parse(await readFile(join(directory, "graph.json"), "utf8")) };
}

function containerRows(runtime, config) {
  const engagement = engagementModel(config, runtime.active ? [runtime.active] : [], runtime.queue);
  return engagement.containers.map(({ workflowId, kind, state, primary }) => ({ workflowId, kind, state, primary }));
}

function record(name, detail) {
  evidence.rows.push({ name, at: new Date().toISOString(), ...detail });
  console.log(`PASS  ${name}`);
}

async function proveNonStrict() {
  console.log(`\nDASHBOARD LIVE PROOF — non-strict ${workspace}`);
  const live = await startEngine(workspace, join(here, "..", "fixtures", "live-boundary.json"));
  const info = await live.control("/tool/graph-info");
  assert.equal(info.version, "1.3.0");
  assert.equal(info.valid, true);

  live.send({ kind: "pause" });
  await live.waitEvent("paused");
  const queueA = await live.control("/tool/dispatch", { workflow: "A", prompt: "queued workflow A" });
  const queueB = await live.control("/tool/dispatch", { workflow: "B", prompt: "queued workflow B" });
  const queueO = await live.control("/tool/dispatch", { node: "o", prompt: "queued node o" });
  assert.equal(queueA.state, "queued");
  assert.equal(queueB.state, "queued");
  assert.equal(queueO.state, "queued");
  const queued = await live.waitRuntime(
    (runtime) => runtime.queue.length === 3,
    10000,
    "three queued dispatches",
  );
  assert.deepEqual(
    queued.queue.map((entry) => entry.workflow),
    ["A", "B", null],
  );
  const queuedContainers = containerRows(queued, live.config);
  assert.deepEqual(queuedContainers, [
    { workflowId: "A", kind: "main", state: "queued", primary: false },
    { workflowId: "B", kind: "main", state: "queued", primary: false },
  ]);
  assert.equal(engagementModel(live.config, [], queued.queue).containers.length, 2, "node dispatch has no container");
  record("queued workflow mains and a node dispatch queue without containers", { queue: queued.queue.map((entry) => ({ node: entry.node, workflow: entry.workflow })) });

  for (const dispatch of [queueA, queueB, queueO]) {
    await live.control("/tool/dispatch/cancel", { dispatchId: dispatch.dispatchId });
  }
  live.send({ kind: "resume" });
  await live.waitEvent("resumed");

  const dispatched = await live.control("/tool/dispatch", {
    workflow: "A",
    prompt: "Execute the node objective exactly. Write the declared output file, then call the handoff tool exactly once with label next.",
  });
  const main = await live.waitRuntime((runtime) => runtime.active?.node === "a1", 30000, "active main a1");
  assert.deepEqual(containerRows(main, live.config), [
    { workflowId: "A", kind: "main", state: "active", primary: true },
  ]);
  record("active main workflow container at a1", { active: main.active?.node });

  const connected = await live.waitRuntime((runtime) => runtime.active?.node === "b1", 180000, "active connected b1");
  const queuedNode = await live.control("/tool/dispatch", { node: "o", prompt: "queued while A is connected" });
  const withQueue = await live.waitRuntime(
    (runtime) => runtime.active?.node === "b1" && runtime.queue.some((entry) => entry.dispatchId === queuedNode.dispatchId),
    10000,
    "connected state with queued node",
  );
  assert.deepEqual(containerRows(withQueue, live.config), [
    { workflowId: "A", kind: "main", state: "active", primary: true },
    { workflowId: "B", kind: "connected", state: "active", primary: false },
  ]);
  assert.equal(engagementModel(live.config, [withQueue.active], withQueue.queue).containers.length, 2);
  assert.deepEqual(detailsMemberships(live.config, "b1", [withQueue.active], withQueue.queue), [
    { workflowId: "B", state: "active" },
  ]);
  record("active connected workflow container at b1 and Details B membership", {
    active: withQueue.active?.node,
    containers: containerRows(withQueue, live.config),
  });

  await live.control("/tool/dispatch/cancel", { dispatchId: queuedNode.dispatchId });
  const escape = await live.waitRuntime((runtime) => runtime.active?.node === "o", 180000, "escape node o");
  const escapeModel = engagementModel(live.config, [escape.active], escape.queue);
  assert.equal(escapeModel.escapes.length, 1);
  assert.equal(escapeModel.escapes[0].node, "o");
  assert.deepEqual(containerRows(escape, live.config), [
    { workflowId: "A", kind: "main", state: "active", primary: true },
  ]);
  record("non-strict escape warning node", { active: escape.active?.node, escapes: escapeModel.escapes.map((entry) => entry.node) });

  const completed = await live.control("/tool/dispatch/wait", { dispatchId: dispatched.dispatchId, timeoutMs: 180000 });
  assert.equal(completed.state, "completed");
  assert.equal(completed.terminal, "o");
  assert.ok(completed.usage?.cost >= 0);

  const configPath = join(workspace, "graph.json");
  const changed = JSON.parse(await readFile(configPath, "utf8"));
  changed.graph.workflows[0].id = "A2";
  await writeFile(configPath, JSON.stringify(changed, null, 2) + "\n", "utf8");
  await live.control("/tool/reload");
  await live.waitEvent("reloaded", 30000);
  const refreshed = await loadDashboard(workspace);
  assert.equal(refreshed.config.graph.workflows[0].id, "A2");
  record("dashboard adapter reloads changed graph structure without a TUI restart", {
    workflow: refreshed.config.graph.workflows[0].id,
  });

  child.kill("SIGTERM");
  child = null;
}

async function proveStrict() {
  console.log(`\nDASHBOARD LIVE PROOF — strict ${strictWorkspace}`);
  const live = await startEngine(strictWorkspace, join(here, "..", "fixtures", "live-boundary-strict.json"));
  const dispatched = await live.control("/tool/dispatch", {
    workflow: "A",
    prompt: "Execute the node objective exactly. Write the declared output file, then call the handoff tool exactly once with label next.",
  });
  const connected = await live.waitRuntime((runtime) => runtime.active?.node === "b1", 180000, "strict active b1");
  assert.deepEqual(containerRows(connected, live.config), [
    { workflowId: "A", kind: "main", state: "active", primary: true },
    { workflowId: "B", kind: "connected", state: "active", primary: false },
  ]);
  const result = await live.control("/tool/dispatch/wait", { dispatchId: dispatched.dispatchId, timeoutMs: 180000 });
  assert.equal(result.state, "defect");
  assert.equal(result.defect?.code, "workflow.escape");
  const map = await live.control("/tool/graph-map");
  assert.equal(map.runtime.lastDefect?.code, "workflow.escape");
  record("strict escape is an engine defect visible in structured runtime", {
    defect: result.defect?.code,
    active: connected.active?.node,
  });
  child.kill("SIGTERM");
  child = null;
}

async function main() {
  await proveNonStrict();
  await proveStrict();
  evidence.finishedAt = new Date().toISOString();
  await writeFile(join(here, "live-proof.json"), JSON.stringify(evidence, null, 2) + "\n", "utf8");
  console.log("\nDASHBOARD LIVE PROOF PASS");
}

main()
  .catch((error) => {
    console.error("\nDASHBOARD LIVE PROOF FAIL:", error?.stack ?? error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (child) {
      try {
        child.stdin.end();
        child.kill("SIGTERM");
      } catch {
        // already gone
      }
    }
    await sleep(300);
  });
