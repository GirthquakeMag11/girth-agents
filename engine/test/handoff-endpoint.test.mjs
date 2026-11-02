import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHandoffHandler } from "../handoff.mjs";
import { startControlServer } from "../control.mjs";
import { DispatchDefect } from "../executor.mjs";

const TOKEN = "handoff-token";

const graph = {
  workflows: [
    {
      id: "build-review",
      entry: "review",
      exit: "done",
      nodes: ["review", "done"],
      connections: [],
      strict: true,
    },
  ],
  nodes: [
    {
      id: "review",
      handoff: {
        mode: "conditional",
        labels: [
          { label: "pass", to: "done", description: "finish" },
          { label: "fail", to: "implement", description: "rework" },
        ],
      },
    },
    { id: "done", handoff: { mode: "terminal" } },
  ],
};

function activeRecord(overrides = {}) {
  return {
    id: "d-1",
    sessionId: "s1",
    workflow: "build-review",
    nodeDef: graph.nodes[0],
    handoff: null,
    handoffDefect: null,
    handoffPending: false,
    ...overrides,
  };
}

async function withHandoffServer(active, run) {
  const server = await startControlServer({
    token: TOKEN,
    handlers: {
      handoff: createHandoffHandler({
        getQueue: () => ({ active }),
        getConfig: () => ({ graph }),
        Defect: DispatchDefect,
      }),
    },
  });
  try {
    return await run(server);
  } finally {
    await server.close();
  }
}

async function postHandoff(server, body) {
  const res = await fetch(server.url + "/handoff", {
    method: "POST",
    headers: { "content-type": "application/json", "x-engine-token": TOKEN },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test("handoff endpoint: a non-terminal node accepts without an output file", async () => {
  const active = activeRecord();
  let outputPathReads = 0;
  Object.defineProperty(active, "outputPath", {
    enumerable: true,
    get() {
      outputPathReads += 1;
      return join(tmpdir(), "girth-handoff-no-output", "output.md");
    },
  });

  const result = await withHandoffServer(active, (server) =>
    postHandoff(server, {
      sessionID: "s1",
      label: "pass",
      message: "The work meets the objective.",
      callID: "call-1",
    }),
  );

  assert.deepEqual(result, { status: 200, body: { ok: true, label: "pass" } });
  assert.equal(active.handoff.label, "pass");
  assert.equal(active.handoff.message, "The work meets the objective.");
  assert.equal(active.handoff.callID, "call-1");
  assert.ok(!Number.isNaN(Date.parse(active.handoff.at)));
  assert.deepEqual(Object.keys(active.handoff).sort(), ["at", "callID", "label", "message"]);
  assert.equal("outputHash" in active.handoff, false);
  assert.equal("outputPath" in active.handoff, false);
  assert.equal(active.handoffDefect, null);
  assert.equal(active.handoffPending, false);
  assert.equal(outputPathReads, 0, "handoff must not consult the retired output path");
});

test("handoff endpoint: an undeclared label is rejected and releases the claim", async () => {
  const active = activeRecord();
  const result = await withHandoffServer(active, (server) =>
    postHandoff(server, { sessionID: "s1", label: "ship", message: "ship it" }),
  );

  assert.equal(result.status, 422);
  assert.match(result.body.error, /handoff\.unknown-tool/);
  assert.equal(active.handoff, null);
  assert.equal(active.handoffPending, false);
  assert.equal(active.handoffDefect, null);
});

test("handoff endpoint: another session cannot hand off the active node", async () => {
  const active = activeRecord();
  const result = await withHandoffServer(active, (server) =>
    postHandoff(server, { sessionID: "s2", label: "pass", message: "done" }),
  );

  assert.equal(result.status, 403);
  assert.equal(result.body.error, "handoff session is not the active node");
  assert.equal(active.handoff, null);
});

test("handoff endpoint: a terminal node takes no handoff", async () => {
  const active = activeRecord({ nodeDef: graph.nodes[1] });
  const result = await withHandoffServer(active, (server) =>
    postHandoff(server, { sessionID: "s1", label: "pass", message: "done" }),
  );

  assert.equal(result.status, 422);
  assert.equal(result.body.error, "this terminal node takes no handoff");
  assert.equal(active.handoff, null);
});

test("handoff endpoint: a second handoff on one node is a conflict", async () => {
  const active = activeRecord();
  const { accepted, duplicate } = await withHandoffServer(active, async (server) => ({
    accepted: await postHandoff(server, { sessionID: "s1", label: "pass", message: "first", callID: "call-1" }),
    duplicate: await postHandoff(server, { sessionID: "s1", label: "pass", message: "second", callID: "call-2" }),
  }));

  assert.equal(accepted.status, 200);
  assert.deepEqual(accepted.body, { ok: true, label: "pass" });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error, "handoff already accepted");
  assert.equal(active.handoff.message, "first");
  assert.equal(active.handoff.callID, "call-1");
  assert.equal(active.handoffDefect.kind, "handoff.multiple");
});
