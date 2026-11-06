import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const captures = new URL("../proof/captures/", import.meta.url);
const read = (name) => readFile(new URL(name, captures), "utf8");

test("proof captures: active split, idle split, 120 split, and 80 strip exist", async () => {
  const active = await read("history-active-160x50.txt");
  assert.match(active, /╭─Details/);
  assert.match(active, /╭─History/);
  assert.match(active, /14:00:31/);
  assert.match(active, /14:00:35/);
  assert.match(active, /● running/);
  assert.match(active, /Graph Engine 0\.5\.0 ALPHA/);
  assert.doesNotMatch(active, /v0\.5\.0/);
  assert.match(active, /review\s+● running/);
  assert.match(active, /done\s+○ idle/);
  assert.match(active, /○ idle 1/);
  assert.doesNotMatch(active, /■ terminal/);
  assert.doesNotMatch(active, /No activity yet\./);

  const idle = await read("history-idle-160x50.txt");
  assert.match(idle, /╭─Details/);
  assert.match(idle, /╭─History/);
  assert.match(idle, /14:01:21/);
  assert.match(idle, /completed · done/);
  assert.match(idle, /Graph Engine 0\.5\.0 ALPHA/);
  assert.doesNotMatch(idle, /v0\.5\.0/);
  assert.match(idle, /○ idle/);
  assert.match(idle, /○ done/);
  assert.match(idle, /done\s+○ idle/);
  assert.match(idle, /○ idle 3/);
  assert.doesNotMatch(idle, /■ terminal/);
  assert.doesNotMatch(idle, /No activity yet\./);

  const split120 = await read("history-active-120x40.txt");
  assert.match(split120, /╭─Details/);
  assert.match(split120, /╭─History/);
  assert.match(split120, /14:00:31/);
  assert.match(split120, /done\s+○ idle/);
  assert.match(split120, /○ idle 1/);
  assert.match(split120, /● build-review/);
  assert.doesNotMatch(split120, /■ terminal/);

  const strip = await read("history-strip-80x24.txt");
  assert.match(strip, /History · 14:00:31/);
  assert.doesNotMatch(strip, /╭─Details/);
  assert.doesNotMatch(strip, /╭─History/);
  assert.match(strip, /RUN CONSOLE/);
});

test("proof captures: Details-bearing panes show no output contract", async () => {
  const names = (await readdir(captures)).filter((name) => name.endsWith(".txt"));
  let detailsCaptures = 0;
  for (const name of names) {
    const text = await read(name);
    if (!text.includes("╭─Details")) continue;
    detailsCaptures += 1;
    assert.doesNotMatch(text, /output work\//, `${name} must not show an output directory`);
    assert.doesNotMatch(text, /OUTPUT/, `${name} must not show an OUTPUT section`);
  }
  assert.ok(detailsCaptures > 0, "at least one capture must render Details");
});

test("proof captures: motion handoff has a token and self-handoff has none", async () => {
  const runner = await read("motion-runner-160x50.txt");
  const self = await read("motion-self-160x50.txt");
  assert.equal((runner.match(/◆/g) ?? []).length, 1);
  assert.equal((self.match(/◆/g) ?? []).length, 0);
  assert.match(runner, /done\s+○ idle/);
  assert.doesNotMatch(runner, /■ terminal/);
});

test("proof captures: stale single-Details artifacts are gone", async () => {
  const names = await readdir(captures);
  for (const name of names) {
    assert.doesNotMatch(name, /^(product|live-boundary|strict)-/);
  }
});
