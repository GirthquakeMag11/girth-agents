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

  queue.enqueue({ node: "a", prompt: "one" });
  queue.enqueue({ node: "a", prompt: "two" });
  queue.enqueue({ node: "a", prompt: "three" });
  await tick();

  assert.equal(queue.active.id, "d-1");
  assert.equal(queue.active.node, "a");
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
  queue.enqueue({ node: "a", prompt: "one" });
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
  queue.enqueue({ node: "a", prompt: "one" });
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

test("queue: a queued dispatch can be cancelled before it starts", async () => {
  const completions = [];
  const releases = [];
  const queue = createDispatchQueue({
    run: () => new Promise((resolve) => releases.push(() => resolve({ ok: true }))),
    onEvent: (kind, payload) => {
      if (kind === "completion") completions.push(payload);
    },
  });
  queue.enqueue({ node: "a", prompt: "one" });
  queue.enqueue({ node: "a", prompt: "two" });
  await tick();

  const cancelled = await queue.cancel("d-2");
  assert.equal(cancelled.state, "cancelled");
  assert.equal(queue.introspect().queue.length, 0);
  assert.equal(completions.at(-1).dispatchId, "d-2");
  assert.equal(completions.at(-1).status, "cancelled");

  releases.shift()();
  await tick();
  assert.equal(queue.status("d-1").state, "completed");
  assert.equal(queue.status("d-2").state, "cancelled");
});

test("queue: the active dispatch can be interrupted and reported as cancelled", async () => {
  let interrupted = null;
  let finishRun;
  const completions = [];
  const queue = createDispatchQueue({
    run: () => new Promise((resolve) => { finishRun = resolve; }),
    onEvent: (kind, payload) => {
      if (kind === "completion") completions.push(payload);
    },
  });
  queue.enqueue({ node: "a", prompt: "one" });
  await tick();
  queue.active.sessionId = "s1";

  const cancelling = await queue.cancel("d-1", {
    interrupt: async (sessionId) => { interrupted = sessionId; },
  });
  assert.equal(interrupted, "s1");
  assert.equal(cancelling.cancelRequested, true);
  assert.equal(cancelling.state, "running");

  finishRun({ ok: true });
  await tick();
  assert.equal(queue.status("d-1").state, "cancelled");
  assert.equal(completions.at(-1).status, "cancelled");
  assert.equal(completions.at(-1).defect, null);
});

test("queue: an unknown dispatch is null", async () => {
  const queue = createDispatchQueue({ run: async () => ({}) });
  assert.equal(queue.status("d-404"), null);
  assert.equal(await queue.wait("d-404", 10), null);
  assert.equal(await queue.cancel("d-404"), null);
});

test("queue: workflow engagement is carried on the dispatch snapshot", async () => {
  const releases = [];
  const queue = createDispatchQueue({
    run: () => new Promise((resolve) => releases.push(() => resolve({ ok: true }))),
  });
  queue.enqueue({ node: "implement", prompt: "workflow dispatch", workflow: "build-review" });
  queue.enqueue({ node: "review", prompt: "node dispatch" });
  await tick();

  assert.equal(queue.status("d-1").workflow, "build-review");
  assert.equal(queue.status("d-2").workflow, null);
  releases.shift()();
  await tick();
  assert.equal(queue.status("d-1").state, "completed");
});
