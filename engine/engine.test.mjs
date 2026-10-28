import test from "node:test";
import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { writeFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { validateConfig } from "./validate-config.mjs";
import { encode, decode, POKES, NOTICES } from "./stdio.mjs";
import { decideRespawn, nextDelay } from "./supervisor-policy.mjs";
import { spawnAndSupervise } from "./supervisor.mjs";

const ENGINE = new URL("./engine.mjs", import.meta.url).pathname;
const NODE = process.execPath;

const VALID_CONFIG = JSON.stringify({
  version: "1",
  helpers: { checker: { job: "grade finished work" } },
  graph: { nodes: [], links: [] },
}, null, 2);

function tmpfile(name, contents) {
  const dir = mkdtempSync(join(tmpdir(), "engine-"));
  const path = join(dir, name);
  if (contents !== undefined) writeFileSync(path, contents);
  return path;
}

test("config validation: a valid config passes", () => {
  const result = validateConfig(VALID_CONFIG);
  assert.equal(result.valid, true, result.reasons.join("; "));
  assert.equal(result.reasons.length, 0);
});

test("config validation: invalid config refuses loudly with the constraint named", () => {
  const cases = [
    ["{}", /version/],
    [JSON.stringify({ version: "1" }), /helpers/],
    [JSON.stringify({ graph: { nodes: "nope", links: [] }, helpers: {} }), /graph\.nodes/],
    [JSON.stringify({ version: 1, helpers: {}, graph: { nodes: [], links: [] } }), /version/],
  ];
  for (const [text, pattern] of cases) {
    const result = validateConfig(text);
    assert.equal(result.valid, false);
    assert.ok(result.reasons.some((r) => pattern.test(r)), `reasons ${result.reasons} lacked ${pattern}`);
  }
});

test("stdio framing: known kinds round-trip through encode/decode", () => {
  const line = encode("activation-added", { directory: "/tmp/x" });
  const msg = decode(line);
  assert.equal(msg.kind, "activation-added");
  assert.equal(msg.directory, "/tmp/x");
  assert.equal(msg.v, 1);
});

test("stdio framing: unknown kinds are tolerated, never a throw", () => {
  const msg = decode(encode("something-new", { whatever: true }));
  assert.equal(msg.kind, "something-new");
  assert.doesNotThrow(() => decode("not json at all"));
});

test("stdio framing: the full poke and notice vocabulary round-trips", () => {
  assert.equal(POKES.length, 5);
  assert.equal(NOTICES.length, 6);
  for (const kind of POKES) assert.equal(decode(encode(kind, {})).kind, kind);
  for (const kind of NOTICES) assert.equal(decode(encode(kind, {})).kind, kind);
});

test("supervisor policy: unexpected exit respawns, shutdown does not", () => {
  assert.equal(decideRespawn({ shuttingDown: false }), true);
  assert.equal(decideRespawn({ shuttingDown: true }), false);
  assert.ok(nextDelay(0) >= 0 && nextDelay(5) > nextDelay(0));
});

test("supervisor: respawns a crashing child, then stops cleanly on SIGTERM", async () => {
  const crasher = tmpfile("crasher.mjs",
    `console.error("child ran"); process.exit(3);`);
  const spawns = [];
  const done = spawnAndSupervise(
    `"${NODE}" "${crasher}"`,
    { backoff: [20, 20], onSpawn: () => spawns.push(Date.now()) },
  );
  const deadline = Date.now() + 2000;
  while (spawns.length < 2 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 25));
  }
  assert.ok(spawns.length >= 2, `expected 2+ spawns, saw ${spawns.length}`);
  await done.graceful();
  assert.equal(done.exited(), true);
});

test("boot to ready: the real engine announces version, heartbeats, and ready", async () => {
  const config = tmpfile("config.json", VALID_CONFIG);
  const child = spawn(NODE, [ENGINE, config], { env: { ...process.env, HEARTBEAT_MS: "100" } });
  const lines = [];
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (d) => lines.push(...d.trim().split("\n")));
  child.stdin.write(encode("watch-list", { directories: [] }) + "\n");
  const deadline = Date.now() + 2000;
  while (!lines.some((l) => l.includes('"ready"')) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 25));
  }
  assert.ok(lines.some((l) => l.includes('"version"')), `version missing in ${lines}`);
  assert.ok(lines.some((l) => l.includes('"ready"')), `ready missing in ${lines}`);
  const beatDeadline = Date.now() + 1500;
  while (!lines.some((l) => l.includes('"heartbeat"')) && Date.now() < beatDeadline) {
    await new Promise((r) => setTimeout(r, 25));
  }
  assert.ok(lines.some((l) => l.includes('"heartbeat"')), `heartbeat missing in ${lines}`);
  child.kill("SIGTERM");
});

test("boot to ready: invalid config is a loud refusal", async () => {
  const config = tmpfile("config.json", JSON.stringify({ version: "1", helpers: {}, graph: { nodes: [], links: null } }));
  await new Promise((resolve, reject) => {
    execFile(NODE, [ENGINE, config], (err, _stdout, stderr) => {
      try {
        assert.ok(err, "expected non-zero exit");
        assert.equal(err.code, 2);
        assert.ok(/links/.test(stderr), `stderr should name the constraint: ${stderr}`);
        resolve();
      } catch (e) { reject(e); }
    });
  });
});