import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadConfig } from "./config-loader.mjs";
import { verifyConfig } from "./verify-config.mjs";
import { encode } from "./stdio.mjs";

const run = promisify(execFile);
const ENGINE = new URL("./engine.mjs", import.meta.url).pathname;
const CONFIG_PATH = new URL("./config.json", import.meta.url).pathname;
const NODE = process.execPath;

const TICKET = "tracker/tickets/12-frob.md";
const TICKET_TEXT = `# 12: Frob the widget

**Kind:** feature
**Ready:** 2026-10-28

## What it delivers

The widget gets frobbed, with tests pinning the frob.
`;

// A fake OpenCode server whose prompts act as the helpers: the builder
// sessions write the implementation artifact, each fresh reviewer
// session writes the verdict — a scripted sequence of fails, then a pass.
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
        // the fake is schema-faithful to the live wire: a drift in the
        // model ref, location ref, or permission triples is a 400 here,
        // exactly as the real server answers
        const wire =
          body?.model?.id && body?.model?.providerID &&
          typeof body?.location?.directory === "string" &&
          Array.isArray(body?.permissions) && body.permissions.every((r) => r.action && r.resource && ["allow", "deny", "ask"].includes(r.effect));
        if (!wire) {
          reply = { status: 400, body: { error: `session create: bad wire ${JSON.stringify(body).slice(0, 120)}` } };
        } else {
          const id = `sess-${++nextId}`;
          locations.set(id, body.location.directory);
          promptsBySession.set(id, 0);
          reply = { status: 200, body: { data: { id } } };
        }
      } else if (req.method === "POST" && /\/api\/session\/sess-\d+\/prompt$/.test(req.url)) {
        const id = req.url.split("/").at(-2);
        const count = promptsBySession.get(id) ?? 0;
        promptsBySession.set(id, count + 1);
        const location = locations.get(id);
        const work = join(location, "work");
        await mkdir(work, { recursive: true });
        const n = Number(id.split("-")[1]);
        if (n % 2 === 1) {
          // the builder's sessions — odd-numbered: each loop lap's implementer
          await writeFile(join(work, "implementation.json"), JSON.stringify({ changed: ["lib/widget.mjs"], tests: "pass" }));
        } else {
          // the reviewer is always fresh: even-numbered sessions, one verdict per lap
          const verdict = verdictScript[Math.min(gradeCount, verdictScript.length - 1)];
          gradeCount += 1;
          await writeFile(join(work, "review.json"), JSON.stringify({ verdict }));
        }
        reply = { status: 200, body: {} };
      } else if (req.method === "POST" && /\/wait$/.test(req.url)) {
        reply = { status: 200, body: { data: { outcome: "succeeded" } } };
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
  const ticketPath = join(dir, TICKET);
  await mkdir(join(dir, "tracker", "tickets"), { recursive: true });
  await writeFile(ticketPath, TICKET_TEXT);
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

test("a claimed file without the ready stamp is a loud defect, and no session runs", async () => {
  const fake = await fakeOpenCode({ verdictScript: ["pass"] });
  const dir = await project();
  await writeFile(join(dir, "notes.md"), "# loose note\n\nno stamp here.\n");
  const { child, out } = await bootEngine(dir, fake.url);
  child.stdin.write(encode("claim-input", { directory: dir, file: "notes.md" }) + "\n");
  const rejected = await waitFor(() => out.lines.some((l) => l.includes('"defect"') && l.includes("marker")));
  assert.ok(rejected, `the unstamped claim must be rejected loudly; got ${out.lines.join("\n")}`);
  assert.equal(fake.promptsBySession.size, 0, "no helper session may run for a rejected claim");
  assert.ok(!out.lines.some((l) => l.includes('"exit-committed"')), "a rejected claim must not reach an exit");
  child.kill("SIGTERM");
  await fake.server.close();
});

test("the loop: fail, fail, pass — review-implementation routes back to implement-from-ticket until it passes, then the exit", async () => {
  const fake = await fakeOpenCode({ verdictScript: ["fail", "fail", "pass"] });
  const dir = await project();
  const { child, out } = await bootEngine(dir, fake.url);
  child.stdin.write(encode("claim-input", { directory: dir, file: TICKET }) + "\n");
  const reachedExit = await waitFor(async () => {
    child.stdin.write(encode("introspect", {}) + "\n");
    await new Promise((r) => setTimeout(r, 25));
    const reply = out.lines.filter((l) => l.includes('"introspection"')).map(parse).at(-1);
    return reply?.runs?.some((r) => r.state === "finished" && r.terminal === "exit");
  });
  assert.ok(reachedExit, `never reached exit; lines: ${JSON.stringify(out.lines)} err: ${out.err}`);

  const reply = out.lines.filter((l) => l.includes('"introspection"')).map(parse).at(-1);
  const done = reply.runs.find((r) => r.terminal === "exit");
  const reviews = done.events.filter((e) => e.nodeId === "review-implementation" && e.outcome === "succeeded");
  assert.equal(reviews.length, 3, "review-implementation must run three times before passing");
  assert.equal(reviews.at(-1).stamps.verdict, "pass");
  assert.equal(done.events.filter((e) => e.nodeId === "implement-from-ticket" && e.outcome === "succeeded").length, 3, "the implementer runs on every lap, including the two the review failed");

  // one fresh session per step: three implementer laps, three reviews
  assert.equal(fake.promptsBySession.size, 6, "3 implementer sessions + 3 fresh reviewer sessions");
  assert.ok(!out.lines.some((l) => l.includes('"exit-committed"')), "the exit writes nothing — the work itself is the outcome");

  // the prompts carry the agents' crafts, the objective, and the claimed ticket
  const builderPrompts = fake.records.filter((r) => /sess-\d+\/prompt$/.test(r.url)).map((r) => r.body?.text ?? "");
  const implementBrief = builderPrompts[0];
  assert.ok(implementBrief.includes("# The builder's craft"), implementBrief);
  assert.ok(implementBrief.includes("Implement the claimed ticket"), implementBrief);
  assert.ok(implementBrief.includes(TICKET), "the brief must tell the builder which file was claimed");
  const reviewerBrief = builderPrompts[1];
  assert.ok(reviewerBrief.includes("# The reviewer's craft"), reviewerBrief);
  assert.ok(reviewerBrief.includes(TICKET), "the reviewer's brief must name the claimed ticket too");
  child.kill("SIGTERM");
  await fake.server.close();
});

test("strict stamps: an unmodeled verdict defects loudly — never routed back into the builder as instructions", async () => {
  const fake = await fakeOpenCode({ verdictScript: ["fail", "maybe"] });
  const dir = await project();
  const { child, out } = await bootEngine(dir, fake.url);
  child.stdin.write(encode("claim-input", { directory: dir, file: TICKET }) + "\n");
  const defect = await waitFor(() => out.lines.some((l) => l.includes('"defect"') && l.includes("maybe")));
  assert.ok(defect, `the stray stamp must be named in a defect notice; got ${out.lines.join("\n")}`);
  assert.ok(!out.lines.some((l) => l.includes('"exit-committed"')), "no exit may be reached on a stray stamp");
  // fail legitimately loops back to the implementer once; the stray verdict is where the chain halts
  assert.equal(fake.promptsBySession.size, 4, "two implementer sessions, two reviews — then halt");
  child.kill("SIGTERM");
  await fake.server.close();
});