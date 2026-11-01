import test from "node:test";
import assert from "node:assert/strict";
import { resumeHistoryEvent, selectResumeOrigin } from "../resume.mjs";

function fakeQueue({ origins = [], states = {}, staleOrigins = [] } = {}) {
  const live = new Map(origins.map((origin) => [origin.dispatchId, { ...origin }]));
  const all = new Map(
    [...origins, ...staleOrigins].map((origin) => [origin.dispatchId, { ...origin }]),
  );
  return {
    findRetainedOrigin({ node = null, dispatchId = null, dispatchingSessionID = null } = {}) {
      return [...live.values()].filter(
        (origin) =>
          (!node || origin.node === node) &&
          (!dispatchId || origin.dispatchId === dispatchId) &&
          (!dispatchingSessionID || origin.dispatchingSessionID === dispatchingSessionID),
      );
    },
    originState(dispatchId) {
      return states[dispatchId] ?? null;
    },
    findStaleOrigin({ node = null, dispatchingSessionID = null } = {}) {
      for (const [dispatchId, origin] of all) {
        const state = states[dispatchId];
        if (state !== "consumed" && state !== "discarded") continue;
        if (node && origin.node !== node) continue;
        if (dispatchingSessionID && origin.dispatchingSessionID !== dispatchingSessionID) continue;
        return { dispatchId, ...origin, originState: state };
      }
      return null;
    },
    consumeRetainedOrigin(dispatchId) {
      const origin = live.get(dispatchId);
      if (!origin) return null;
      live.delete(dispatchId);
      states[dispatchId] = "consumed";
      return origin;
    },
    remaining() {
      return [...live.values()];
    },
  };
}

const origin = {
  dispatchId: "d-1",
  dispatchingSessionID: "ses_sender",
  node: "review",
  sessionId: "s1",
  workflow: "build-review",
  label: "report",
  message: "The message.",
  remainingBudgetMs: 5000,
  at: "2026-01-01T00:00:00.000Z",
};

test("resume: one origin binds without a dispatch id", () => {
  const queue = fakeQueue({ origins: [origin] });
  const selected = selectResumeOrigin(queue, { node: "review", sessionID: "ses_sender" });
  assert.equal(selected.origin.dispatchId, "d-1");
  assert.equal(queue.remaining().length, 0);
});

test("resume: no origin is resume.not-return", () => {
  const selected = selectResumeOrigin(fakeQueue(), { node: "review", sessionID: "ses_sender" });
  assert.equal(selected.error.code, "resume.not-return");
});

test("resume: multiple origins require a dispatch id", () => {
  const queue = fakeQueue({
    origins: [origin, { ...origin, dispatchId: "d-2", sessionId: "s2" }],
  });
  const selected = selectResumeOrigin(queue, { node: "review", sessionID: "ses_sender" });
  assert.equal(selected.error.code, "handoff.ambiguous");
  assert.equal(queue.remaining().length, 2);
});

test("resume: a dispatch id for another node is resume.not-return", () => {
  const queue = fakeQueue({ origins: [origin] });
  const selected = selectResumeOrigin(queue, { node: "implement", dispatchId: "d-1", sessionID: "ses_sender" });
  assert.equal(selected.error.code, "resume.not-return");
  assert.equal(queue.remaining().length, 1);
});

test("resume: an unknown dispatch id is resume.not-return", () => {
  const selected = selectResumeOrigin(fakeQueue(), { node: "review", dispatchId: "d-9", sessionID: "ses_sender" });
  assert.equal(selected.error.code, "resume.not-return");
});

test("resume: consumed and discarded origins are stale", () => {
  const queue = fakeQueue({
    origins: [],
    staleOrigins: [origin, { ...origin, dispatchId: "d-2", sessionId: "s2" }],
    states: { "d-1": "consumed", "d-2": "discarded" },
  });
  assert.equal(selectResumeOrigin(queue, { node: "review", dispatchId: "d-1", sessionID: "ses_sender" }).error.code, "handoff.stale");
  assert.equal(selectResumeOrigin(queue, { node: "review", dispatchId: "d-2", sessionID: "ses_sender" }).error.code, "handoff.stale");
});

test("resume: the history event is content-free", () => {
  const event = resumeHistoryEvent(origin);
  assert.equal(event.dispatchId, "d-1");
  assert.equal(event.from, "dispatcher");
  assert.equal(event.to, "review");
  assert.equal(event.label, "report");
  assert.equal(event.message, undefined);
});

test("resume: one sender cannot bind another sender's origin", () => {
  const queue = fakeQueue({
    origins: [
      origin,
      { ...origin, dispatchId: "d-2", dispatchingSessionID: "ses_other", sessionId: "s2" },
    ],
  });

  const blocked = selectResumeOrigin(queue, {
    node: "review",
    dispatchId: "d-1",
    sessionID: "ses_other",
  });
  assert.equal(blocked.error.code, "resume.not-return");
  assert.equal(queue.remaining().length, 2);

  const own = selectResumeOrigin(queue, { node: "review", sessionID: "ses_sender" });
  assert.equal(own.origin.dispatchId, "d-1");
});

test("resume: a consumed origin without a dispatch id is stale", () => {
  const queue = fakeQueue({ origins: [origin] });
  const first = selectResumeOrigin(queue, { node: "review", sessionID: "ses_sender" });
  assert.equal(first.origin.dispatchId, "d-1");
  const second = selectResumeOrigin(queue, { node: "review", sessionID: "ses_sender" });
  assert.equal(second.error.code, "handoff.stale");
});

test("resume: stale dispatchId is scoped by sender and node", () => {
  const queue = fakeQueue({
    staleOrigins: [origin],
    states: { "d-1": "consumed" },
  });

  assert.equal(
    selectResumeOrigin(queue, {
      node: "implement",
      dispatchId: "d-1",
      sessionID: "ses_sender",
    }).error.code,
    "resume.not-return",
  );
  assert.equal(
    selectResumeOrigin(queue, {
      node: "review",
      dispatchId: "d-1",
      sessionID: "ses_other",
    }).error.code,
    "resume.not-return",
  );
  assert.equal(
    selectResumeOrigin(queue, {
      node: "review",
      dispatchId: "d-1",
      sessionID: "ses_sender",
    }).error.code,
    "handoff.stale",
  );
});

test("resume: a missing or blank sender cannot bind an origin", () => {
  const queue = fakeQueue({ origins: [origin] });
  for (const body of [
    { node: "review" },
    { node: "review", dispatchId: "d-1" },
    { node: "review", sessionID: "" },
    { node: "review", dispatchId: "d-1", sessionID: "   " },
  ]) {
    const selected = selectResumeOrigin(queue, body);
    assert.equal(selected.error.code, "resume.not-return");
    assert.equal(queue.remaining().length, 1, "the origin is not consumed");
  }
});
