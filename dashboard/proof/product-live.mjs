// Short product-graph live check. Starts the real engine on the shipped
// product graph, observes one active workflow dispatch plus a queued node,
// then cancels both.

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const workspace = `/tmp/opencode/dashboard-product-live-${process.pid}`;
let child;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function main() {
  await rm(workspace, { recursive: true, force: true });
  await mkdir(workspace, { recursive: true });
  await cp(join(repo, "engine", "example-graph.json"), join(workspace, "graph.json"));

  const events = [];
  child = spawn(process.execPath, [join(repo, "engine", "engine.mjs"), "graph.json"], {
    cwd: workspace,
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
  assert.equal(ready.pluginActive, true);

  const pluginSource = await readFile(join(workspace, ".opencode", "plugins", "engine-handoff", "index.ts"), "utf8");
  const url = /const ENGINE_URL = "([^"]+)"/.exec(pluginSource)?.[1];
  const token = /const TOKEN = "([^"]+)"/.exec(pluginSource)?.[1];
  assert.ok(url && token);
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

  const dispatched = await control("/tool/dispatch", {
    workflow: "build-review",
    prompt: "Execute the node objective exactly. Write the declared output file, then call the handoff tool exactly once with label next.",
  });
  const deadline = Date.now() + 30000;
  let map;
  for (;;) {
    map = await control("/tool/graph-map");
    if (map.runtime.active?.node === "implement") break;
    if (Date.now() >= deadline) throw new Error("timeout: product active implement");
    await sleep(250);
  }
  const queued = await control("/tool/dispatch", {
    node: "review",
    prompt: "queued product node while the workflow is active",
  });
  for (;;) {
    map = await control("/tool/graph-map");
    if (map.runtime.active?.node === "implement" && map.runtime.queue.some((entry) => entry.dispatchId === queued.dispatchId)) break;
    if (Date.now() >= deadline + 10000) throw new Error("timeout: product queue");
    await sleep(250);
  }

  console.log(`PASS  product live: ${map.runtime.active?.node} active, ${map.runtime.queue.length} queued`);

  await control("/tool/dispatch/cancel", { dispatchId: queued.dispatchId });
  await control("/tool/dispatch/cancel", { dispatchId: dispatched.dispatchId });
  child.kill("SIGTERM");
  child = null;
}

main()
  .catch((error) => {
    console.error("PRODUCT LIVE PROOF FAIL:", error?.stack ?? error);
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
