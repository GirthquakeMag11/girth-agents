// The live v1 proof. It creates a scratch workspace, starts the engine,
// and proves the four things v1 claims:
//   1. stdio dispatch runs a graph to a terminal;
//   2. a second dispatch queues behind the active one;
//   3. the interactive agent dispatches through the plugin tool and waits;
//   4. the interactive agent edits the graph, reloads it, and the engine
//      swaps it.
// It uses the real OpenCode service and the real handoff plugin.

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createDriver } from "./driver.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const workspace = process.argv[2] ?? "/tmp/opencode/v1-live";
const enginePath = join(here, "engine.mjs");
const model = "openrouter/~deepseek/deepseek-flash-latest";

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

function lastCompletion() {
  return [...events].reverse().find((event) => event.kind === "completion");
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
          console.log(`  engine ${event.kind}`, JSON.stringify(event).slice(0, 220));
        }
      } catch {
        // stderr carries anything human-facing
      }
    }
  });
  child.stderr.on("data", (data) => process.stderr.write(data));
  const ready = await waitFor(() => events.find((event) => event.kind === "ready"), 30000, "engine ready");
  if (!ready.pluginActive) throw new Error("handoff plugin is not active");
  return ready;
}

async function stdioDispatch(prompt) {
  const before = events.length;
  child.stdin.write(JSON.stringify({ kind: "dispatch", graph: "build-review", node: "implement", prompt }) + "\n");
  const completion = await waitFor(
    () => events.slice(before).find((event) => event.kind === "completion"),
    180000,
    "stdio completion",
  );
  return completion;
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

async function main() {
  console.log(`\nV1 LIVE PROOF — ${workspace}`);
  await rm(workspace, { recursive: true, force: true });
  await mkdir(workspace, { recursive: true });
  await cp(join(here, "example-graph.json"), join(workspace, "graph.json"));

  driver = await createDriver();
  await startEngine();
  console.log("PASS  engine booted with the handoff plugin active");

  const first = await stdioDispatch("Write a one-paragraph design note for a hello() function. Keep it short.");
  assert.equal(first.status, "completed");
  assert.equal(first.terminal, "done");
  const final = await readFile(join(workspace, "work", "final.md"), "utf8");
  assert.ok(final.trim().length > 0);
  console.log("PASS  stdio dispatch reached the terminal and wrote work/final.md");

  const beforeQueue = events.length;
  child.stdin.write(JSON.stringify({
    kind: "dispatch",
    graph: "build-review",
    node: "implement",
    prompt: "Write a one-sentence design note for hello() version one.",
  }) + "\n");
  child.stdin.write(JSON.stringify({
    kind: "dispatch",
    graph: "build-review",
    node: "implement",
    prompt: "Write a one-sentence design note for hello() version two.",
  }) + "\n");
  const queueCompletions = await waitFor(
    () => {
      const completed = events.slice(beforeQueue).filter((event) => event.kind === "completion");
      return completed.length >= 2 ? completed : null;
    },
    240000,
    "two queued completions",
  );
  const queuedEvents = events.slice(beforeQueue).filter((event) => event.kind === "queued");
  assert.equal(queueCompletions.length, 2);
  assert.ok(queuedEvents.length >= 2);
  assert.ok(
    events.slice(beforeQueue).some((event) => event.kind === "queued" && event.dispatchId === "d-2"),
    "the second dispatch was queued",
  );
  console.log("PASS  a second dispatch queued behind the active one and both completed");

  const beforeInteractive = events.length;
  const dispatched = await interactiveSession(
    "v1-live-dispatch",
    [
      "You are the user's interactive agent. Read .opencode/skills/dispatching/SKILL.md.",
      "Use the `dispatch` tool exactly once with:",
      JSON.stringify({
        graph: "build-review",
        node: "implement",
        prompt: "Write a one-paragraph design note for a hello() function. Keep it short.",
        wait: true,
      }),
      "Report the completion status, the terminal node, and the output path. Do not do the work yourself.",
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

  const beforeAuthoring = events.length;
  const authored = await interactiveSession(
    "v1-live-authoring",
    [
      "You are the user's interactive agent. Read .opencode/skills/graph-authoring/SKILL.md.",
      "Call `graphs()` to get the config path.",
      "Edit that config: in graph 'build-review', change the objective of node 'review' to exactly:",
      "Review the implementation and name one concrete improvement.",
      "Keep the rest valid. Call `reload()`. Report valid, faults, and the new objective. Do not dispatch.",
    ].join("\n"),
  );
  assert.equal(authored.info.outcome, "succeeded");
  await waitFor(
    () => events.slice(beforeAuthoring).find((event) => event.kind === "reloaded"),
    30000,
    "config reload",
  );
  const config = JSON.parse(await readFile(join(workspace, "graph.json"), "utf8"));
  const review = config.graphs[0].nodes.find((node) => node.id === "review");
  assert.equal(review.objective, "Review the implementation and name one concrete improvement.");
  console.log("PASS  the interactive agent edited the graph, reloaded it, and the engine swapped it");

  console.log("\nV1 LIVE PROOF PASS");
}

main()
  .catch((error) => {
    console.error("\nV1 LIVE PROOF FAIL:", error.message);
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
