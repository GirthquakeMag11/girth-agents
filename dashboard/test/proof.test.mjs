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
  assert.doesNotMatch(active, /No activity yet\./);

  const idle = await read("history-idle-160x50.txt");
  assert.match(idle, /╭─Details/);
  assert.match(idle, /╭─History/);
  assert.match(idle, /14:01:21/);
  assert.match(idle, /completed · done/);
  assert.match(idle, /○ idle/);
  assert.doesNotMatch(idle, /No activity yet\./);

  const split120 = await read("history-active-120x40.txt");
  assert.match(split120, /╭─Details/);
  assert.match(split120, /╭─History/);
  assert.match(split120, /14:00:31/);

  const strip = await read("history-strip-80x24.txt");
  assert.match(strip, /History · 14:00:31/);
  assert.doesNotMatch(strip, /╭─Details/);
  assert.doesNotMatch(strip, /╭─History/);
  assert.match(strip, /RUN CONSOLE/);
});

test("proof captures: motion handoff has a token and self-handoff has none", async () => {
  const runner = await read("motion-runner-160x50.txt");
  const self = await read("motion-self-160x50.txt");
  assert.equal((runner.match(/◆/g) ?? []).length, 1);
  assert.equal((self.match(/◆/g) ?? []).length, 0);
});

test("proof captures: stale single-Details artifacts are gone", async () => {
  const names = await readdir(captures);
  for (const name of names) {
    assert.doesNotMatch(name, /^(product|live-boundary|strict)-/);
  }
});
