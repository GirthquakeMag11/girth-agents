import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { encode } from "./stdio.mjs";

const run = promisify(execFile);
const ENGINE = new URL("./engine.mjs", import.meta.url).pathname;
const NODE = process.execPath;

const GRAPH = {
  nodes: [
    { id: "in", type: "entry", marker: "CONFIRMED" },
    { id: "build", type: "task", helper: "builder", artifact: "stamped.json", budgetMs: 5000 },
    { id: "grade", type: "task", helper: "checker", artifact: "verdict.json", budgetMs: 5000 },
    { id: "ask-user", type: "exit", record: { kind: "question" } },
    { id: "report-defect", type: "exit", record: { kind: "defect" } },
  ],
  links: [
    { from: "in", to: "build" },
    { from: "build", to: "grade" },
    { from: "grade", to: "ask-user", condition: { field: "verdict", equals: "pass" } },
    { from: "grade", to: "report-defect", condition: { field: "verdict", equals: "fail" } },
  ],
};

const CONFIG = JSON.stringify({
  version: "1",
  helpers: {
    builder: { job: "build the piece", model: "m/b", capabilities: ["fs"], permissions: { allow: ["fs"], denyRest: true } },
    checker: { job: "grade the piece", model: "m/c", capabilities: ["fs"], permissions: { allow: ["fs"], denyRest: true } },
  },
  graph: GRAPH,
});

function fakeOpenCode() {
  const records = [];
  const server = createServer((req, res) => {
    let chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      let body;
      try {
        body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : undefined;
      } catch {
        body = undefined;
      }
      records.push({ method: req.method, url: req.url, auth: req.headers.authorization, body });
      let reply = { status: 200, body: {} };
      if (req.url === "/api/info") reply = { status: 200, body: { pid: 1, version: "2.1.4" } };
      else if (req.method === "POST" && req.url === "/api/session") reply = { status: 200, body: { id: "sess-1" } };
      else if (req.method === "POST" && req.url.endsWith("/wait")) reply = { status: 200, body: { outcome: "succeeded" } };
      else if (req.method === "POST" && req.url.includes("/prompt")) reply = { status: 200, body: {} };
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

async function projectRepo(verdict) {
  const dir = mkdtempSync(join(tmpdir(), "proj-"));
  await run("git", ["init", "-q", "-b", "main"], { cwd: dir });
  for (const [k, v] of [["user.email", "engine@test"], ["user.name", "Engine"], ["commit.gpgsign", "false"]]) {
    await run("git", ["config", k, v], { cwd: dir });
  }
  writeFileSync(join(dir, "plan.md"), "# plan\n\napproach: the plan\n\nCONFIRMED 2026-10-28\n");
  writeFileSync(join(dir, "stamped.json"), JSON.stringify({ done: true }));
  writeFileSync(join(dir, "verdict.json"), JSON.stringify({ verdict }));
  return dir;
}

async function bootClaimEngine({ dir, serviceUrl, pokes }) {
  const cfgDir = mkdtempSync(join(tmpdir(), "cfg-"));
  writeFileSync(join(cfgDir, "config.json"), CONFIG);
  const svcDir = mkdtempSync(join(tmpdir(), "svc-"));
  const svcFile = join(svcDir, "service.json");
  writeFileSync(svcFile, JSON.stringify({ url: serviceUrl ?? "http://127.0.0.1:1", password: "pw" }));
  const child = spawn(NODE, [ENGINE, join(cfgDir, "config.json")], {
    env: { ...process.env, HEARTBEAT_MS: "200", OPENCODE_SERVICE_FILE: svcFile },
  });
  const out = { lines: [], err: [] };
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (d) => out.lines.push(...d.trim().split("\n").filter(Boolean)));
  child.stderr.on("data", (d) => out.err.push(...d.trim().split("\n").filter(Boolean)));
  for (const poke of pokes) child.stdin.write(encode(poke.kind, poke) + "\n");
  return { child, out };
}

async function waitFor(pred, ms = 3000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (await pred()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return false;
}

test("seams: a valid claim enters the graph and the exit commits its awaiting question", async () => {
  const fake = await fakeOpenCode();
  const dir = await projectRepo("pass");
  const { child, out } = await bootClaimEngine({
    dir,
    serviceUrl: fake.url,
    pokes: [{ kind: "claim-input", directory: dir, file: "plan.md" }],
  });
  const committed = await waitFor(() => out.lines.some((l) => l.includes('"exit-committed"')));
  assert.ok(committed, `exit-committed missing in ${out.lines}; err: ${out.err}`);
  const notice = out.lines.find((l) => l.includes("exit-committed"));
  assert.ok(notice.includes("question") && notice.includes("awaiting-answer"), notice);

  const recordPath = join(dir, "records", "ask-user.json");
  assert.ok(existsSync(recordPath), "the exit record must exist");
  const record = JSON.parse(readFileSync(recordPath, "utf8"));
  assert.equal(record.kind, "question");
  assert.equal(record.state, "awaiting-answer");

  const committedLog = await waitFor(async () => {
    try {
      return (await run("git", ["log", "--format=%s"], { cwd: dir })).stdout.includes("ask-user recorded");
    } catch {
      return false;
    }
  });
  assert.ok(committedLog, "the exit record must be committed");
  assert.ok(fake.records.some((r) => r.method === "POST" && r.url === "/api/session"), "the chain must run real sessions");
  child.kill("SIGTERM");
  await fake.server.close();
});

test("seams: a claim without the entry node's marker is a loud defect, and no session runs", async () => {
  const fake = await fakeOpenCode();
  const dir = await projectRepo("pass");
  writeFileSync(join(dir, "plan.md"), "# no marker here\n");
  const { child, out } = await bootClaimEngine({
    dir,
    serviceUrl: fake.url,
    pokes: [{ kind: "claim-input", directory: dir, file: "plan.md" }],
  });
  const rejected = await waitFor(() => out.lines.some((l) => l.includes('"defect"') && l.includes("marker")));
  assert.ok(rejected, `defect notice missing in ${out.lines}`);
  assert.ok(!fake.records.some((r) => r.method === "POST" && r.url === "/api/session"), "rejected claims must never spawn");
  child.kill("SIGTERM");
  await fake.server.close();
});

test("seams: a fail verdict reaches the defect exit — an awaiting-attention record, consent withheld", async () => {
  const fake = await fakeOpenCode();
  const dir = await projectRepo("fail");
  const { child, out } = await bootClaimEngine({
    dir,
    serviceUrl: fake.url,
    pokes: [{ kind: "claim-input", directory: dir, file: "plan.md" }],
  });
  const committed = await waitFor(() => out.lines.some((l) => l.includes('"exit-committed"')));
  assert.ok(committed, `exit-committed missing in ${out.lines}`);
  assert.ok(out.lines.some((l) => l.includes("report-defect") && l.includes("awaiting-attention")));
  const record = JSON.parse(readFileSync(join(dir, "records", "report-defect.json"), "utf8"));
  assert.equal(record.kind, "defect");
  assert.equal(record.state, "awaiting-attention");
  child.kill("SIGTERM");
  await fake.server.close();
});

test("seams: a claim against a dead service is a defect notice, and the engine keeps beating", async () => {
  const dir = await projectRepo("pass");
  const dead = await bootClaimEngine({
    dir,
    serviceUrl: "http://127.0.0.1:1",
    pokes: [{ kind: "claim-input", directory: dir, file: "plan.md" }],
  });
  const defect = await waitFor(() => dead.out.lines.some((l) => l.includes('"defect"')));
  assert.ok(defect, `defect notice missing in ${dead.out.lines}`);
  const beat = await waitFor(() => dead.out.lines.some((l) => l.includes('"heartbeat"')));
  assert.ok(beat, "the engine must keep beating after a claim failure");
  dead.child.kill("SIGTERM");
});