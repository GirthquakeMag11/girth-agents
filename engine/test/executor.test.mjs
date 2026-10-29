import test from "node:test";
import assert from "node:assert/strict";
import { runDispatch } from "../executor.mjs";

const config = {
  version: "2",
  helpers: [
    { id: "builder", model: "test/model", agent: "build", permissions: ["read"] },
  ],
  graphs: [
    {
      id: "g",
      outputRoot: "work",
      maxSteps: 10,
      nodes: [
        {
          id: "a",
          helper: "builder",
          objective: "Do the node.",
          output: "a.md",
          handoff: { mode: "terminal" },
        },
      ],
    },
  ],
};

test("executor: a failed session on the first visit is a named session defect", async () => {
  const deleted = [];
  const driver = {
    createSession: async () => ({ id: "s1" }),
    prompt: async () => ({ outcome: "failed" }),
    deleteSession: async (id) => { deleted.push(id); },
    messages: async () => [],
    interrupt: async () => {},
  };
  const record = { id: "d-1", graph: "g", node: "a", prompt: "p", visits: {} };
  await assert.rejects(
    () => runDispatch({ driver, config, record, cwd: "/tmp", onEvent: () => {} }),
    (error) => error.kind === "session-failed" && error.message.includes("s1"),
  );
  assert.deepEqual(deleted, ["s1"]);
});
