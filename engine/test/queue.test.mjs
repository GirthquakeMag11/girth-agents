import test from "node:test";
import assert from "node:assert/strict";
import { createDispatchQueue } from "../queue.mjs";

const tick = () => new Promise((resolve) => setImmediate(resolve));

test("queue: one active dispatch, the rest FIFO", async () => {
  const releases = [];
  const queue = createDispatchQueue({
    run: (record) =>
      new Promise((resolve) => {
        releases.push(() => resolve({ terminal: record.id }));
      }),
  });

  queue.enqueue({ graph: "g", node: "a", prompt: "one" });
  queue.enqueue({ graph: "g", node: "a", prompt: "two" });
  queue.enqueue({ graph: "g", node: "a", prompt: "three" });
  await tick();

  assert.equal(queue.active.id, "d-1");
  assert.deepEqual(queue.introspect().queue.map((record) => record.dispatchId), ["d-2", "d-3"]);

  releases.shift()();
  await tick();
  assert.equal(queue.active.id, "d-2");

  releases.shift()();
  await tick();
  assert.equal(queue.active.id, "d-3");

  releases.shift()();
  await tick();
  assert.equal(queue.active, null);
  assert.equal(queue.status("d-1").state, "completed");
  assert.equal(queue.status("d-2").state, "completed");
  assert.equal(queue.status("d-3").state, "completed");
});

test("queue: wait returns the completion and times out as running", async () => {
  const releases = [];
  const queue = createDispatchQueue({
    run: () => new Promise((resolve) => releases.push(() => resolve({ ok: true }))),
  });
  queue.enqueue({ graph: "g", node: "a", prompt: "one" });
  await tick();

  const early = await queue.wait("d-1", 5);
  assert.equal(early.state, "running");
  assert.equal(early.timedOut, true);

  releases.shift()();
  await tick();
  const late = await queue.wait("d-1", 1000);
  assert.equal(late.state, "completed");
  assert.deepEqual(late.result, { ok: true });
});

test("queue: pause holds the queue and resume restarts it", async () => {
  const releases = [];
  const queue = createDispatchQueue({
    run: () => new Promise((resolve) => releases.push(() => resolve({ ok: true }))),
  });
  queue.pause();
  queue.enqueue({ graph: "g", node: "a", prompt: "one" });
  await tick();
  assert.equal(queue.active, null);
  assert.equal(queue.paused, true);

  queue.resume();
  await tick();
  assert.equal(queue.active?.id, "d-1");
  releases.shift()();
  await tick();
  assert.equal(queue.active, null);
});

test("queue: an unknown dispatch is null", async () => {
  const queue = createDispatchQueue({ run: async () => ({}) });
  assert.equal(queue.status("d-404"), null);
  assert.equal(await queue.wait("d-404", 10), null);
});
