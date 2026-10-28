import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, mkdtemp, writeFile, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadConfig } from "./config-loader.mjs";
import { verifyConfig } from "./verify-config.mjs";
import { encode } from "./stdio.mjs";

const run = promisify(execFile);
const ENGINE = new URL("./engine.mjs", import.meta.url).pathname;
const CONFIG_PATH = new URL("./config.json", import.meta.url).pathname;
const NODE = process.execPath;

// A fake OpenCode server whose prompts act as the helpers: the builder
// session writes the output artifact, the checker session writes the
// verdict — a scripted sequence of fails, then a pass.
function fakeOpenCode({ verdictScript }) {
  const records = [];
  const locations = new Map(); // sessionId -> location
  const promptsBySession = new Map();
  let nextId = 0;
  let gradeCount = 0;
  const server = createServer((req, res) => {
    let chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", async () => {
      let body;
      try {
        body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : undefined;
      } catch {
        body = undefined;
      }
      records.push({ method: req.method, url: req.url, body });
      let reply = { status: 200, body: {} };
      if (req.url === "/api/info") {
        reply = { status: 200, body: { pid: 1, version: "2.1.4" } };
      } else if (req.method === "POST" && req.url === "/api/session") {
        const id = `sess-${++nextId}`;
        locations.set(id, body.location);
        promptsBySession.set(id, 0);
        reply = { status: 200, body: { id } };
      } else if (req.method === "POST" && /\/api\/session\/sess-\d+\/prompt$/.test(req.url)) {
        const id = req.url.split("/").at(-2);
        const count = promptsBySession.get(id) ?? 0;
        promptsBySession.set(id, count + 1);
        const location = locations.get(id);
        const work = join(location, "work");
        await mkdir(work, { recursive: true });
        if (id === "sess-1") {
          // the builder's session — build and every repair resume it
          await writeFile(join(work, "out.json"), JSON.stringify({ done: true, pass: count + 1 }));
        } else {
          // the checker is always fresh: each grade is a new session,
          // so the verdict sequence is global, not per session
          const verdict = verdictScript[Math.min(gradeCount, verdictScript.length - 1)];
          gradeCount += 1;
          await writeFile(join(work, "verdict.json"), JSON.stringify({ verdict }));
        }
        reply = { status: 200, body: {} };
      } else if (req.method === "POST" && /\/wait$/.test(req.url)) {
        reply = { status: 200, body: { outcome: "succeeded" } };
      }
      res.statusCode = reply.status;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(reply.body));
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, records, promptsBySession, locations, url: `http://127.0.0.1:${port}` });
    });
  });
}

async function project() {
  const dir = await mkdtemp(join(tmpdir(), "proj-"));
  await run("git", ["init", "-q", "-b", "main"], { cwd: dir });
  for (const [k, v] of [["user.email", "engine@test"], ["user.name", "Engine"], ["commit.gpgsign", "false"]]) {
    await run("git", ["config", k, v], { cwd: dir });
  }
  await writeFile(join(dir, "plan.md"), "# plan\n\nCONFIRMED 2026-10-28\n");
  return dir;
}

async function bootEngine(dir, url) {
  const svcDir = await mkdtemp(join(tmpdir(), "svc-"));
  await writeFile(join(svcDir, "service.json"), JSON.stringify({ url, password: "pw" }));
  const child = spawn(NODE, [ENGINE, CONFIG_PATH], {
    env: { ...process.env, HEARTBEAT_MS: "500", OPENCODE_SERVICE_FILE: join(svcDir, "service.json") },
  });
  const out = { lines: [], err: [] };
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (d) => out.lines.push(...d.trim().split("\n").filter(Boolean)));
  child.stderr.on("data", (d) => out.err.push(...d.trim().split("\n").filter(Boolean)));
  return { child, out };
}

async function waitFor(pred, ms = 8000) {
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

test("the shipped config verifies sound through the gate", async () => {
  const loaded = await loadConfig(CONFIG_PATH);
  assert.deepEqual(loaded.faults, [], JSON.stringify(loaded.faults));
  const result = await verifyConfig(loaded.doc);
  assert.equal(result.valid, true, JSON.stringify(result.configFaults));
});

test("the refinement loop: fail, fail, pass — the builder's session is resumed, never respawned", async () => {
  const fake = await fakeOpenCode({ verdictScript: ["fail", "fail", "pass"] });
  const dir = await project();
  const { child, out } = await bootEngine(dir, fake.url);
  child.stdin.write(encode("claim-input", { directory: dir, file: "plan.md" }) + "\n");
  const reachedOutDone = await waitFor(async () => {
    child.stdin.write(encode("introspect", {}) + "\n");
    await new Promise((r) => setTimeout(r, 25));
    const reply = out.lines.filter((l) => l.includes('"introspection"')).map(parse).at(-1);
    return reply?.runs?.some((r) => r.state === "finished" && r.terminal === "out-done");
  });
  assert.ok(reachedOutDone, `never reached out-done; lines: ${JSON.stringify(out.lines)} err: ${out.err}`);

  const reply = out.lines.filter((l) => l.includes('"introspection"')).map(parse).at(-1);
  const done = reply.runs.find((r) => r.terminal === "out-done");
  const gradeSucceeds = done.events.filter((e) => e.nodeId === "grade" && e.outcome === "succeeded");
  assert.equal(gradeSucceeds.length, 3, "grade must run three times before passing");
  assert.equal(gradeSucceeds.at(-1).stamps.verdict, "pass");

  // the resume contract, observed end to end: the builder's session
  // carries the build and both repairs; the checker is always fresh —
  // three grades, three fresh checker sessions
  assert.equal(fake.promptsBySession.size, 4, "builder session + three fresh checker sessions");
  assert.equal(fake.promptsBySession.get("sess-1"), 3, "builder session: build + two repairs");
  const checkerPrompts = [...fake.promptsBySession.entries()]
    .filter(([id]) => id !== "sess-1")
    .reduce((sum, [, n]) => sum + n, 0);
  assert.equal(checkerPrompts, 3, "three grades across three fresh checker sessions");

  // the prompts carry the agents' crafts, the objective, and the report
  const builderPrompts = fake.records.filter((r) => /sess-1\/prompt$/.test(r.url)).map((r) => r.body?.text ?? "");
  assert.ok(builderPrompts[0].includes("# The builder's craft"), builderPrompts[0]);
  assert.ok(builderPrompts[0].includes("Build the piece the claimed plan names"), builderPrompts[0]);
  assert.ok(builderPrompts.some((p) => p.includes('"verdict": "fail"')), "the reviewer's report must ride into the repair brief");
  const checkerPrompt = fake.records.find((r) => /sess-2\/prompt$/.test(r.url))?.body?.text ?? "";
  assert.ok(checkerPrompt.includes("# The checker's craft"), checkerPrompt);
  child.kill("SIGTERM");
  await fake.server.close();
});

test("the retry limit: an always-failing grade bounces after three repairs", async () => {
  const fake = await fakeOpenCode({ verdictScript: ["fail", "fail", "fail"] });
  const dir = await project();
  const { child, out } = await bootEngine(dir, fake.url);
  child.stdin.write(encode("claim-input", { directory: dir, file: "plan.md" }) + "\n");
  const committed = await waitFor(() => out.lines.some((l) => l.includes('"exit-committed"')));
  assert.ok(committed, `exit-committed missing in ${out.lines}; err: ${out.err}`);
  assert.ok(out.lines.some((l) => l.includes('"exit-committed"') && l.includes('"bounce"')), out.lines.join("\n"));

  const record = JSON.parse(await readFile(join(dir, "records", "bounce.json"), "utf8"));
  assert.equal(record.kind, "question");
  assert.equal(record.state, "awaiting-answer");

  // the cap was honored: three repairs, then the exhausted link — never a fourth
  assert.equal(fake.promptsBySession.get("sess-1"), 4, "build + three repairs, exactly");
  const checkerPrompts = [...fake.promptsBySession.entries()]
    .filter(([id]) => id !== "sess-1")
    .reduce((sum, [, n]) => sum + n, 0);
  // check-then-retry: the fourth grade's fail verdict is what trips the exhausted link
  assert.equal(checkerPrompts, 4, "four grades: one per attempt, the last tripping the limit");
  await access(join(dir, "work", "verdict.json")); // the graded work stays in the tree

  const committedLog = await waitFor(async () => {
    try {
      return (await run("git", ["log", "--format=%s"], { cwd: dir })).stdout.includes("bounce recorded");
    } catch {
      return false;
    }
  });
  assert.ok(committedLog, "the bounce record must be committed");
  child.kill("SIGTERM");
  await fake.server.close();
});