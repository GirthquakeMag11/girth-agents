import test from "node:test";
import assert from "node:assert/strict";
import { createDispatchQueue } from "../queue.mjs";
import { renderDispatchDisplay } from "../display.mjs";
import { selectResumeOrigin } from "../resume.mjs";

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

test("queue: a retained origin is discoverable and cancelled with its session", async () => {
  const queue = createDispatchQueue({
    run: async (record) => {
      record.retainedOrigin = {
        node: record.node,
        sessionId: "s1",
        label: "report",
        message: "The message.",
        at: new Date().toISOString(),
      };
      return { dispatcher: true };
    },
  });

  queue.enqueue({ node: "a", prompt: "p" });
  await tick();
  assert.equal(queue.status("d-1").state, "completed");
  const found = queue.findRetainedOrigin({ node: "a" });
  assert.equal(found.length, 1);
  assert.equal(found[0].dispatchId, "d-1");
  assert.equal(found[0].sessionId, "s1");
  assert.equal(found[0].message, "The message.");

  let deleted = null;
  const result = await queue.cancel("d-1", {
    deleteSession: async (sessionId) => {
      deleted = sessionId;
    },
  });
  assert.equal(result.state, "completed");
  assert.equal(deleted, "s1");
  assert.equal(queue.originState("d-1"), "discarded");
  assert.equal(queue.findStaleOrigin({ node: "a" }).originState, "discarded");
  assert.deepEqual(queue.findRetainedOrigin({ node: "a" }), []);
});

test("queue: consumeRetainedOrigin binds one origin and leaves others", async () => {
  const queue = createDispatchQueue({
    run: async (record) => {
      record.retainedOrigin = {
        node: record.node,
        sessionId: `s-${record.id}`,
        label: "report",
        message: "m",
        at: new Date().toISOString(),
      };
      return { dispatcher: true };
    },
  });

  queue.enqueue({ node: "a", prompt: "one" });
  queue.enqueue({ node: "a", prompt: "two" });
  await tick();
  assert.equal(queue.findRetainedOrigin({ node: "a" }).length, 2);
  assert.equal(queue.findRetainedOrigin({ dispatchId: "d-1" }).length, 1);
  assert.equal(queue.findRetainedOrigin({ node: "a", dispatchId: "d-1" }).length, 1);

  const origin = queue.consumeRetainedOrigin("d-1");
  assert.equal(origin.dispatchId, "d-1");
  assert.equal(origin.sessionId, "s-d-1");
  assert.equal(queue.originState("d-1"), "consumed");
  assert.equal(queue.findStaleOrigin({ node: "a" }).dispatchId, "d-1");
  assert.equal(queue.findRetainedOrigin({ node: "a" }).length, 1);
  assert.equal(queue.consumeRetainedOrigin("d-1"), null);
});

test("queue: pump preserves an executor-set dispatcher result", async () => {
  const queue = createDispatchQueue({
    run: async (record) => {
      record.handoff = {
        from: "a",
        label: "report",
        to: "$dispatcher",
        message: "The outcome.",
      };
      record.result = { response: "The outcome.", responseTruncated: false };
      return { dispatcher: true, handoff: record.handoff, result: record.result };
    },
  });

  queue.enqueue({ node: "a", prompt: "p" });
  await tick();
  const status = queue.status("d-1");
  assert.equal(status.dispatchId, "d-1");
  assert.equal(status.result.response, "The outcome.");
  assert.equal(status.result.responseTruncated, false);
  assert.match(renderDispatchDisplay(status), /The outcome\./);
  assert.equal(queue.introspect().active, null);
  assert.deepEqual(queue.introspect().queue, []);
});

test("queue: the dispatching session id is recorded on the dispatch", async () => {
  let release;
  const queue = createDispatchQueue({
    run: () => new Promise((resolve) => (release = resolve)),
  });
  queue.enqueue({ node: "a", prompt: "p", dispatchingSessionID: "ses_dispatch" });
  await tick();
  assert.equal(queue.active.dispatchingSessionID, "ses_dispatch");
  release({});
  await tick();
});

test("queue: cancelling an active retained origin discards its session", async () => {
  let release;
  const queue = createDispatchQueue({
    run: async (record) => {
      record.sessionId = "s1";
      record.retainedOrigin = {
        node: record.node,
        sessionId: "s1",
        label: "report",
        message: "m",
        at: new Date().toISOString(),
      };
      record.originState = "retained";
      await new Promise((resolve) => (release = resolve));
      return {};
    },
  });
  queue.enqueue({ node: "a", prompt: "p" });
  await tick();
  assert.equal(queue.findRetainedOrigin({ node: "a" }).length, 0, "an active origin is not yet retainable");

  const deleted = [];
  const result = await queue.cancel("d-1", {
    interrupt: async () => {},
    deleteSession: async (sessionId) => deleted.push(sessionId),
  });
  assert.equal(result.state, "running");
  assert.deepEqual(deleted, ["s1"]);
  assert.equal(queue.originState("d-1"), "discarded");
  assert.equal(queue.active.retainedOrigin, null);

  release({});
  await tick();
  assert.equal(queue.status("d-1").state, "cancelled");
});

test("queue: cancelling a queued return discards the consumed source session", async () => {
  const queue = createDispatchQueue({
    run: async (record) => {
      if (record.id === "d-1") {
        record.retainedOrigin = {
          node: "a",
          sessionId: "s1",
          label: "report",
          message: "m",
          at: new Date().toISOString(),
        };
        record.originState = "retained";
        return {};
      }
      return new Promise(() => {});
    },
  });
  queue.enqueue({ node: "a", prompt: "first" });
  await tick();
  assert.equal(queue.status("d-1").state, "completed");

  queue.pause();
  queue.enqueue({
    node: "a",
    prompt: "return",
    resumeSessionId: "s1",
    resumeOriginDispatchId: "d-1",
  });
  const deleted = [];
  const result = await queue.cancel("d-2", {
    deleteSession: async (sessionId) => deleted.push(sessionId),
  });
  assert.equal(result.state, "cancelled");
  assert.deepEqual(deleted, ["s1"]);
  assert.equal(queue.originState("d-1"), "discarded");
});

test("queue: cancel claims a retained origin before awaiting session deletion", async () => {
  const queue = createDispatchQueue({
    run: async (record) => {
      record.retainedOrigin = {
        node: record.node,
        sessionId: "s1",
        label: "report",
        message: "m",
        at: new Date().toISOString(),
      };
      record.originState = "retained";
      return {};
    },
  });
  queue.enqueue({ node: "a", prompt: "p", dispatchingSessionID: "ses_a" });
  await tick();

  let release;
  const pending = queue.cancel("d-1", {
    deleteSession: () => new Promise((resolve) => (release = resolve)),
  });
  assert.equal(queue.findRetainedOrigin({ node: "a" }).length, 0);
  assert.equal(queue.originState("d-1"), "discarded");
  const selected = selectResumeOrigin(queue, { node: "a", sessionID: "ses_a" });
  assert.equal(selected.error.code, "handoff.stale");

  release();
  await pending;
});
