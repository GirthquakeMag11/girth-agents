import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { encode } from "./stdio.mjs";
import { writeConfigTree } from "./fixture-config.mjs";

const run = promisify(execFile);
const ENGINE = new URL("./engine.mjs", import.meta.url).pathname;
const NODE = process.execPath;

const INTROSPECT_AGENTS = {
  builder: { job: "build the piece", model: "m/b", capabilities: ["fs"], permissions: { allow: ["fs"], denyRest: true } },
  checker: { job: "grade the piece", model: "m/c", capabilities: ["fs"], permissions: { allow: ["fs"], denyRest: true } },
};

const INTROSPECT_NODES = [
  { id: "in", type: "entry", marker: "CONFIRMED", out: [{ to: "build" }] },
  { id: "build", type: "task", helper: "builder", artifact: "stamped.json", budgetMs: 30000, out: [{ to: "grade" }] },
  { id: "grade", type: "task", helper: "checker", artifact: "verdict.json", budgetMs: 30000, out: [
    { to: "ask-user", condition: { field: "verdict", equals: "pass" } },
  ]},
  { id: "ask-user", type: "exit", record: { kind: "question" } },
];

function fakeOpenCode({ hang = false } = {}) {
  const records = [];
  const server = createServer((req, res) => {
    let chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      records.push({ method: req.method, url: req.url });
      let reply = { status: 200, body: {} };
      if (req.url === "/api/info") reply = { status: 200, body: { pid: 1, version: "2.1.4" } };
      else if (req.method === "POST" && req.url === "/api/session") reply = { status: 200, body: { data: { id: "sess-1" } } };
      else if (req.url.endsWith("/wait")) reply = hang ? { status: 404, body: {} } : { status: 200, body: { data: { outcome: "succeeded" } } };
      else if (req.method === "GET" && req.url.endsWith("/sess-1")) reply = { status: 200, body: { data: { outcome: "pending" } } };
      else if (req.url.includes("/prompt")) reply = { status: 200, body: {} };
      res.statusCode = reply.status;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(reply.body));
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, records, url: `http://127.0.0.1:${port}` });
    });
  });
}

async function project() {
  const dir = mkdtempSync(join(tmpdir(), "proj-"));
  await run("git", ["init", "-q", "-b", "main"], { cwd: dir });
  for (const [k, v] of [["user.email", "engine@test"], ["user.name", "Engine"], ["commit.gpgsign", "false"]]) {
    await run("git", ["config", k, v], { cwd: dir });
  }
  writeFileSync(join(dir, "plan.md"), "# plan\n\nCONFIRMED 2026-10-28\n");
  writeFileSync(join(dir, "stamped.json"), JSON.stringify({ done: true }));
  writeFileSync(join(dir, "verdict.json"), JSON.stringify({ verdict: "pass" }));
  return dir;
}

async function boot(dir, url) {
  const cfgDir = mkdtempSync(join(tmpdir(), "cfg-"));
  await writeConfigTree(cfgDir, { agents: INTROSPECT_AGENTS, nodes: INTROSPECT_NODES });
  const svcDir = mkdtempSync(join(tmpdir(), "svc-"));
  writeFileSync(join(svcDir, "service.json"), JSON.stringify({ url, password: "pw" }));
  const child = spawn(NODE, [ENGINE, join(cfgDir, "config.json")], {
    env: { ...process.env, HEARTBEAT_MS: "400", OPENCODE_SERVICE_FILE: join(svcDir, "service.json") },
  });
  const out = { lines: [], err: [] };
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (d) => out.lines.push(...d.trim().split("\n").filter(Boolean)));
  child.stderr.on("data", (d) => out.err.push(...d.trim().split("\n").filter(Boolean)));
  return { child, out };
}

async function waitFor(pred, ms = 4000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (await pred()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return false;
}

function parse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

test("introspection: an in-flight run answers with its full state, session included", async () => {
  const fake = await fakeOpenCode({ hang: true });
  const dir = await project();
  const { child, out } = await boot(dir, fake.url);
  child.stdin.write(encode("claim-input", { directory: dir, file: "plan.md" }) + "\n");
  await new Promise((r) => setTimeout(r, 400));
  child.stdin.write(encode("introspect", {}) + "\n");
  const answered = await waitFor(() => out.lines.some((l) => l.includes('"introspection"')));
  assert.ok(answered, `introspection missing in ${out.lines}`);
  const reply = parse(out.lines.find((l) => l.includes('"introspection"')));
  const inFlight = reply.runs.find((r) => r.state === "in-flight");
  assert.ok(inFlight, `no in-flight run in ${JSON.stringify(reply)}`);
  assert.ok(inFlight.events.some((e) => e.outcome === "dispatched" && e.nodeId === "build"));
  assert.equal(inFlight.currentSession.id, "sess-1");
  child.kill("SIGTERM");
  await fake.server.close();
});

test("introspection: a finished run reports its terminal, stamps, and touched record", async () => {
  const fake = await fakeOpenCode({ hang: false });
  const dir = await project();
  const { child, out } = await boot(dir, fake.url);
  child.stdin.write(encode("claim-input", { directory: dir, file: "plan.md" }) + "\n");
  await waitFor(() => out.lines.some((l) => l.includes('"exit-committed"')));
  child.stdin.write(encode("introspect", {}) + "\n");
  const answered = await waitFor(() => out.lines.some((l) => l.includes('"introspection"')));
  assert.ok(answered);
  const reply = parse(out.lines.find((l) => l.includes('"introspection"')));
  const done = reply.runs.find((r) => r.state === "finished");
  assert.equal(done.terminal, "ask-user");
  assert.equal(done.failure, undefined);
  assert.ok(done.events.some((e) => e.outcome === "succeeded" && e.nodeId === "grade" && e.stamps.verdict === "pass"));
  assert.ok(done.exitRecord.includes("ask-user.json"), done.exitRecord);
  child.kill("SIGTERM");
  await fake.server.close();
});

test("introspection: an unknown run id is a typed not-found, never silence", async () => {
  const fake = await fakeOpenCode({ hang: false });
  const dir = await project();
  const { child, out } = await boot(dir, fake.url);
  child.stdin.write(encode("introspect", { runId: "nope" }) + "\n");
  const answered = await waitFor(() => out.lines.some((l) => l.includes('"introspection"')));
  assert.ok(answered);
  const reply = parse(out.lines.find((l) => l.includes('"introspection"')));
  assert.equal(reply.found, false);
  assert.equal(reply.runId, "nope");
  child.kill("SIGTERM");
  await fake.server.close();
});