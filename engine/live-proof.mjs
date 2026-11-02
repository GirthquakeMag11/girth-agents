// The live proof. It creates a scratch workspace, starts the engine,
// and proves the promised surface:
//   1. one graph boots and GRAPH.md is generated without the interim command;
//   2. a stdio dispatch runs the graph to a terminal and reports usage;
//   3. a second dispatch queues behind the active one and both complete;
//   4. the interactive agent dispatches through the plugin tool and waits;
//   5. a background dispatch notifies the interactive session;
//   6. a queued dispatch and an active dispatch can be cancelled;
//   7. the interactive agent edits the graph, reloads it, and the engine
//      and GRAPH.md swap it.
// It uses the real OpenCode service and the real handoff plugin.

import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { createDriver } from "./driver.mjs";
import { PROJECT_VERSION } from "./version.mjs";
import { SCHEMA_VERSION } from "./config.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const workspace = process.argv[2] ?? `/tmp/opencode/girth-live-${process.pid}`;
const enginePath = join(here, "engine.mjs");
const model = "openrouter/~deepseek/deepseek-flash-latest";
const run = promisify(execFile);

const events = [];
let child;
let driver;

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

async function startEngine() {
  child = spawn(process.execPath, [enginePath, "graph.json"], {
    cwd: workspace,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let pending = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    pending += chunk;
    let i;
    while ((i = pending.indexOf("\n")) !== -1) {
      const line = pending.slice(0, i).trim();
      pending = pending.slice(i + 1);
      if (!line) continue;
      try {
        const event = JSON.parse(line);
        events.push(event);
        if (["ready", "completion", "reloaded", "defect"].includes(event.kind)) {
          console.log(`  engine ${event.kind}`, JSON.stringify(event).slice(0, 240));
        }
      } catch {
        // stderr carries anything human-facing
      }
    }
  });
  child.stderr.on("data", (data) => process.stderr.write(data));
  const ready = await waitFor(() => events.find((event) => event.kind === "ready"), 60000, "engine ready");
  if (!ready.pluginActive) throw new Error("handoff plugin is not active");
  return ready;
}

function send(poke) {
  child.stdin.write(JSON.stringify(poke) + "\n");
}

function completionFor(dispatchId, timeoutMs = 180000) {
  return waitFor(
    () => events.find((event) => event.kind === "completion" && event.dispatchId === dispatchId),
    timeoutMs,
    `completion ${dispatchId}`,
  );
}

async function startStdio(node, prompt) {
  const before = events.length;
  send({ kind: "dispatch", node, prompt });
  const queued = await waitFor(
    () => events.slice(before).find((event) => event.kind === "queued"),
    10000,
    "stdio queued",
  );
  return queued.dispatchId;
}

async function stdioDispatch(node, prompt) {
  const id = await startStdio(node, prompt);
  return completionFor(id);
}

async function waitIdle(sessionID, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const info = await driver.getSession(sessionID);
    if (["succeeded", "failed", "interrupted"].includes(info.outcome) && info.time?.idle) return info;
    if (Date.now() >= deadline) throw new Error(`timeout: session ${sessionID} idle`);
    await sleep(250);
  }
}

async function interactiveSession(title, prompt) {
  const session = await driver.createSession({
    directory: workspace,
    title,
    agent: "build",
    model,
    permissions: [{ action: "*", resource: "*", effect: "allow" }],
  });
  const info = await driver.prompt(session.id, prompt, { budgetMs: 240000 });
  const messages = [...(await driver.messages(session.id))].sort(
    (a, b) => (a.time?.created ?? 0) - (b.time?.created ?? 0),
  );
  const tools = [];
  const text = [];
  for (const message of messages) {
    for (const part of message.content ?? []) {
      if (part.type === "tool") tools.push({ name: part.name, status: part.state?.status, input: part.state?.input });
      if (part.type === "text") text.push(part.text ?? "");
    }
  }
  await driver.deleteSession(session.id).catch(() => {});
  return { session, info, tools, text: text.join("\n") };
}

function usageTotal(usage) {
  return (usage?.tokens?.input ?? 0) + (usage?.tokens?.output ?? 0);
}

async function main() {
  console.log(`\nLIVE PROOF — girth-agents v${PROJECT_VERSION} — ${workspace}`);
  const cli = await run(process.execPath, [enginePath, "--version"]);
  assert.equal(cli.stdout, `girth-agents v${PROJECT_VERSION}\n`);

  await rm(workspace, { recursive: true, force: true });
  await mkdir(workspace, { recursive: true });
  await cp(join(here, "graph.json"), join(workspace, "graph.json"));
  await cp(join(here, "agents"), join(workspace, "agents"), { recursive: true });
  await mkdir(join(workspace, ".opencode", "agents"), { recursive: true });
  await mkdir(join(workspace, ".opencode", "commands"), { recursive: true });
  await writeFile(
    join(workspace, ".opencode", "agents", "graph-view.md"),
    "---\ndescription: Read-only graph view.\n---\nCall graph_map.\n",
    "utf8",
  );
  await writeFile(
    join(workspace, ".opencode", "commands", "graph.md"),
    "---\nagent: graph-view\n---\nCall graph_map.\n",
    "utf8",
  );

  driver = await createDriver();
  const ready = await startEngine();
  assert.deepEqual(ready.workflows, ["build-review"]);

  const artifact = await readFile(join(workspace, "GRAPH.md"), "utf8");
  assert.match(artifact, /^# Graph\n/);
  assert.doesNotMatch(artifact, /# Graphs/);
  assert.match(artifact, /workflow · build-review/);
  assert.match(artifact, /resume = this route reuses/);
  assert.match(artifact, /fail → implement \(resume\)/);

  await assert.rejects(() => readFile(join(workspace, ".opencode", "commands", "graph.md"), "utf8"));
  await assert.rejects(() => readFile(join(workspace, ".opencode", "agents", "graph-view.md"), "utf8"));

  const pluginSource = await readFile(join(workspace, ".opencode", "plugins", "engine-handoff", "index.ts"), "utf8");
  const url = /const ENGINE_URL = "([^"]+)"/.exec(pluginSource)?.[1];
  const token = /const TOKEN = "([^"]+)"/.exec(pluginSource)?.[1];
  assert.ok(url && token);
  const control = async (path, body = {}) => {
    const res = await fetch(url + path, {
      method: "POST",
      headers: { "content-type": "application/json", "x-engine-token": token },
      body: JSON.stringify(body),
    });
    assert.equal(res.ok, true, path);
    return res.json();
  };
  const info = await control("/tool/graph-info");
  assert.equal(info.version, PROJECT_VERSION);
  assert.equal(info.schemaVersion, SCHEMA_VERSION);
  assert.equal(info.valid, true);
  const map = await control("/tool/graph-map");
  assert.equal(map.ok, true);
  assert.ok(map.runtime);
  assert.ok("active" in map.runtime);
  assert.ok(Array.isArray(map.runtime.queue));
  assert.ok("lastDefect" in map.runtime);
  assert.ok("lastEvent" in map.runtime);
  console.log("PASS  one graph booted, legacy command/agent were removed, and graph-info/runtime are structured");

  const first = await stdioDispatch("implement", "Write a one-paragraph design note for a hello() function. Keep it short.");
  assert.equal(first.status, "completed");
  assert.equal(first.terminal, "done");
  assert.equal(typeof first.usage?.cost, "number");
  assert.ok(usageTotal(first.usage) > 0, "the completion reports token usage");
  console.log("PASS  stdio dispatch reached the terminal and reported cost and tokens");

  const beforeQueue = events.length;
  const queuedOne = await startStdio("implement", "Write a one-sentence design note for hello() version one.");
  const queuedTwo = await startStdio("implement", "Write a one-sentence design note for hello() version two.");
  const queueCompletions = await waitFor(
    () => {
      const completed = events
        .slice(beforeQueue)
        .filter((event) => event.kind === "completion" && [queuedOne, queuedTwo].includes(event.dispatchId));
      return completed.length >= 2 ? completed : null;
    },
    240000,
    "two queued completions",
  );
  assert.equal(queueCompletions.length, 2);
  assert.ok(
    events.slice(beforeQueue).some((event) => event.kind === "queued" && event.dispatchId === queuedTwo),
    "the second dispatch was queued",
  );
  console.log("PASS  a second dispatch queued behind the active one and both completed");

  const beforeInteractive = events.length;
  const dispatched = await interactiveSession(
    "girth-live-dispatch",
    [
      "You are the user's interactive agent. Read .opencode/skills/dispatching/SKILL.md.",
      "Use the `dispatch` tool exactly once with:",
      JSON.stringify({
        node: "implement",
        prompt: "Write a one-paragraph design note for a hello() function. Keep it short.",
      }),
      "Report the completion status, the terminal node, and the usage. Do not do the work yourself.",
    ].join("\n"),
  );
  assert.equal(dispatched.info.outcome, "succeeded");
  assert.ok(dispatched.tools.some((tool) => tool.name === "dispatch" && tool.status === "completed"));
  const interactiveCompletion = await waitFor(
    () => events.slice(beforeInteractive).find((event) => event.kind === "completion" && event.status === "completed"),
    60000,
    "interactive dispatch completion",
  );
  assert.equal(interactiveCompletion.terminal, "done");
  console.log("PASS  the interactive agent dispatched through the tool and waited for the product");

  const beforeBackground = events.length;
  const backgroundSession = await driver.createSession({
    directory: workspace,
    title: "girth-live-background",
    agent: "build",
    model,
    permissions: [{ action: "*", resource: "*", effect: "allow" }],
  });
  const backgroundInfo = await driver.prompt(
    backgroundSession.id,
    [
      "You are the user's interactive agent. Read .opencode/skills/dispatching/SKILL.md.",
      "Use the `dispatch` tool exactly once with:",
      JSON.stringify({
        node: "implement",
        prompt: "Write a one-sentence design note for a background hello() function.",
        background: true,
      }),
      "Report the dispatch id and stop. Do not wait, poll, or do the work yourself.",
    ].join("\n"),
    { budgetMs: 120000 },
  );
  assert.equal(backgroundInfo.outcome, "succeeded");
  const backgroundCompletion = await waitFor(
    () =>
      events
        .slice(beforeBackground)
        .find((event) => event.kind === "completion" && event.status === "completed"),
    180000,
    "background dispatch completion",
  );
  let notification = null;
  const notificationDeadline = Date.now() + 60000;
  while (Date.now() < notificationDeadline) {
    const messages = await driver.messages(backgroundSession.id);
    const raw = JSON.stringify(messages);
    if (raw.includes("<graph-dispatch") && raw.includes(backgroundCompletion.dispatchId)) {
      notification = messages;
      break;
    }
    await sleep(250);
  }
  assert.ok(notification, "background dispatch synthetic notification");
  await driver.deleteSession(backgroundSession.id).catch(() => {});
  console.log("PASS  a background dispatch notified the interactive session with a synthetic message");

  send({ kind: "pause" });
  await waitFor(() => events.find((event) => event.kind === "paused"), 10000, "paused");
  const queuedCancelId = await startStdio("implement", "This dispatch should be cancelled while queued.");
  await waitFor(
    () => events.find((event) => event.kind === "queued" && event.dispatchId === queuedCancelId),
    10000,
    "queued dispatch",
  );
  send({ kind: "dispatch-cancel", dispatchId: queuedCancelId });
  const queuedCancelled = await completionFor(queuedCancelId, 10000);
  assert.equal(queuedCancelled.status, "cancelled");
  assert.equal(queuedCancelled.defect, null);
  send({ kind: "resume" });
  await waitFor(() => events.find((event) => event.kind === "resumed"), 10000, "resumed");

  const beforeActive = events.length;
  const activeCancelId = await startStdio("implement", "Run a shell sleep of 20 seconds before writing anything.");
  await waitFor(
    () => events.slice(beforeActive).find((event) => event.kind === "dispatched" && event.dispatchId === activeCancelId),
    10000,
    "active dispatch",
  );
  send({ kind: "dispatch-cancel", dispatchId: activeCancelId });
  const activeCancelled = await completionFor(activeCancelId, 30000);
  assert.equal(activeCancelled.status, "cancelled");
  assert.equal(activeCancelled.defect, null);
  console.log("PASS  a queued dispatch and the active dispatch were cancelled without killing the engine");

  const beforeAuthoring = events.length;
  const authored = await interactiveSession(
    "girth-live-authoring",
    [
      "You are the user's interactive agent. Read .opencode/skills/graph-authoring/SKILL.md.",
      "Call `graph_info()` to get the config path.",
      "Edit that config: change the objective of node 'review' to exactly:",
      "Review the implementation and name one concrete improvement.",
      "Keep the rest valid. Call `reload()`. Report valid and the new objective. Do not dispatch.",
    ].join("\n"),
  );
  assert.equal(authored.info.outcome, "succeeded");
  await waitFor(
    () => events.slice(beforeAuthoring).find((event) => event.kind === "reloaded"),
    30000,
    "config reload",
  );
  const configAfter = JSON.parse(await readFile(join(workspace, "graph.json"), "utf8"));
  const review = configAfter.graph.nodes.find((node) => node.id === "review");
  assert.equal(review.objective, "Review the implementation and name one concrete improvement.");
  assert.equal(configAfter.graphs, undefined);
  const artifactAfter = await readFile(join(workspace, "GRAPH.md"), "utf8");
  assert.match(artifactAfter, /Review the implementation and name one concrete improvement\./);
  console.log("PASS  the interactive agent edited the graph, reloaded it, and GRAPH.md swapped with it");

  console.log("\nLIVE PROOF PASS");
}

main()
  .catch((error) => {
    console.error("\nLIVE PROOF FAIL:", error.message);
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
