import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createReconciler } from "./reconciler.mjs";
import { createWatcher } from "./watcher.mjs";
import { encode } from "./stdio.mjs";

const ENGINE = new URL("./engine.mjs", import.meta.url).pathname;
const NODE = process.execPath;

const CONFIG = JSON.stringify({
  version: "1",
  helpers: { checker: { job: "grade finished work" } },
  graph: { nodes: [], links: [] },
}, null, 2);

function project() {
  const dir = mkdtempSync(join(tmpdir(), "proj-"));
  const records = join(dir, "records");
  mkdirSync(records);
  return { dir, records };
}

function seed(projectDir, ...states) {
  const records = join(projectDir.dir, "records");
  states.forEach((state, i) => {
    writeFileSync(join(records, `item-${i}.json`), JSON.stringify({ state }));
  });
}

async function bootEngine({ config = CONFIG, pokes = [] } = {}) {
  const cfgPath = join(mkdtempSync(join(tmpdir(), "cfg-")), "config.json");
  writeFileSync(cfgPath, config);
  const child = spawn(NODE, [ENGINE, cfgPath], { env: { ...process.env, HEARTBEAT_MS: "1000" } });
  const out = { lines: [], err: [] };
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (d) => out.lines.push(...d.trim().split("\n").filter(Boolean)));
  child.stderr.on("data", (d) => out.err.push(...d.trim().split("\n").filter(Boolean)));
  for (const poke of pokes) child.stdin.write(encode(poke.kind, poke) + "\n");
  return { child, out };
}

async function waitFor(pred, ms = 2000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (pred()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return false;
}

test("reconciler: derives ready work from stamped records, collects unknown states", async () => {
  const p = project();
  writeFileSync(join(p.records, "ready-1.json"), JSON.stringify({ state: "ready" }));
  writeFileSync(join(p.records, "passed.json"), JSON.stringify({ state: "stamped-pass" }));
  writeFileSync(join(p.records, "weird.json"), JSON.stringify({ state: "flying" }));
  mkdirSync(join(p.records, "nested"));
  writeFileSync(join(p.records, "nested", "ready-2.json"), JSON.stringify({ state: "ready" }));
  writeFileSync(join(p.records, "note.txt"), "not json");

  const rec = createReconciler();
  const result = await rec.reconcile(p.dir, "records");
  assert.equal(result.ready.length, 2, JSON.stringify(result));
  assert.ok(result.unknown.some((u) => u.state === "flying"));
  // a non-JSON note is not an item and does not break the pass
  assert.equal(result.items.length, 4);
});

test("watcher: a change on disk surfaces a pass without any poke", async () => {
  const p = project();
  seed(p, "ready");
  const passes = [];
  const w = createWatcher({ onPass: (id) => passes.push(id), intervalMs: 40 });
  w.add({ id: "p1", directory: p.dir, recordsRoot: "records" });
  await waitFor(() => passes.includes("p1")); // the initial pass also counts
  const before = passes.length;
  seed(p, "ready", "ready"); // new records after the first pass
  const ok = await waitFor(() => passes.length > before);
  assert.ok(ok, "a disk change must surface a pass with no poke");
  await w.stop();
});

test("watcher: paused projects pass nothing; resume catches everything missed", async () => {
  const p = project();
  seed(p, "ready");
  const passes = [];
  const w = createWatcher({ onPass: (id) => passes.push(id), intervalMs: 40 });
  w.add({ id: "p2", directory: p.dir, recordsRoot: "records" });
  await waitFor(() => passes.includes("p2"));
  w.pause("p2");
  const before = passes.length;
  seed(p, "ready");
  await new Promise((r) => setTimeout(r, 150)); // long enough for ≥2 passes had it watched
  assert.equal(passes.length, before, "a paused project must not pass");
  w.resume("p2");
  const ok = await waitFor(() => passes.length > before);
  assert.ok(ok, "resume must catch everything missed while paused");
  await w.stop();
});

test("engine: boot reconcile finds records written while it was down", async () => {
  const p = project();
  seed(p, "ready", "stamped-pass");
  const { child, out } = await bootEngine({
    pokes: [{ kind: "watch-list", directories: [{ directory: p.dir }] }],
  });
  const ok = await waitFor(() => out.lines.some((l) => l.includes('"ready"')));
  assert.ok(ok, `ready missing in ${out.lines}`);
  await waitFor(() => out.err.some((l) => l.includes("ready work")));
  assert.ok(out.err.some((l) => l.includes("1 ready")), `expected 1 ready item in ${out.err}`);
  child.kill("SIGTERM");
});

test("engine: a kill mid-flight leaves only what was seeded — no in-flight marks, same re-pick on restart", async () => {
  const p = project();
  seed(p, "ready");
  const first = await bootEngine({ pokes: [{ kind: "watch-list", directories: [{ directory: p.dir }] }] });
  await waitFor(() => first.out.lines.some((l) => l.includes('"ready"')));
  first.child.kill("SIGKILL"); // mid-flight, before anything takes the item
  await new Promise((r) => first.child.once("exit", r));
  const leftovers = [];
  for (const f of readdirSync(p.records)) {
    const s = statSync(join(p.records, f));
    if (s.isFile()) leftovers.push(f);
  }
  assert.deepEqual(leftovers.sort(), ["item-0.json"], "engine wrote nothing extra into the records");

  const second = await bootEngine({ pokes: [{ kind: "watch-list", directories: [{ directory: p.dir }] }] });
  const ok = await waitFor(() => second.out.err.some((l) => l.includes("1 ready")));
  assert.ok(ok, "restart must re-pick the same ready item from its durable stamp");
  second.child.kill("SIGTERM");
});

test("engine: the poke vocabulary surfaces — activation, removal, pause, resume, claim", async () => {
  const p = project();
  const { child, out } = await bootEngine({
    pokes: [
      { kind: "activation-added", directory: p.dir },
      { kind: "project-paused", directory: p.dir },
      { kind: "project-resumed", directory: p.dir },
      { kind: "claim-input", directory: p.dir, file: "plans/thing.md" },
      { kind: "activation-removed", directory: p.dir },
    ],
  });
  const ok = await waitFor(() =>
    ["watching", "paused", "resumed", "claimed input", "unwatching"].every(
      (word) => out.err.some((l) => l.includes(word)),
    ),
  );
  assert.ok(ok, `poke marks missing in ${out.err}`);
  child.kill("SIGTERM");
});