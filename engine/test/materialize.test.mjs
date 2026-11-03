import test from "node:test";
import assert from "node:assert/strict";
import { materializationPlan } from "../materialize.mjs";

test("materialize: primary and subagent mounts are published, graph mounts are not", () => {
  const config = {
    agents: [
      { id: "liaison", model: "test/model", mounts: ["graph", "primary"], prompt: "Help the user.", description: "Liaison.", permissions: [] },
      {
        id: "reviewer",
        model: "test/model",
        mounts: ["subagent"],
        prompt: "Review.",
        permissions: [{ action: "read", resource: "*", effect: "allow" }],
      },
      { id: "builder", model: "test/model", mounts: ["graph"], prompt: "Build." },
    ],
  };
  const plan = materializationPlan(config);
  assert.deepEqual(plan.agents.map((agent) => agent.id), ["liaison", "reviewer"]);
  assert.equal(plan.agents[0].mode, "primary");
  assert.equal(plan.agents[0].system, "Help the user.");
  assert.equal(plan.agents[0].description, "Liaison.");
  assert.equal(plan.agents[1].mode, "subagent");
  assert.deepEqual(plan.agents[1].permissions, [{ action: "read", resource: "*", effect: "allow" }]);
  assert.deepEqual(plan.skills, []);
});

test("materialize: referenced skills follow a published mount, deduped", () => {
  const skill = { id: "test-first", name: "Test-first", description: "TDD.", instructions: "Write the failing test first." };
  const config = {
    agents: [
      { id: "a", model: "test/model", mounts: ["primary"], prompt: "P.", skillDocs: [skill] },
      { id: "b", model: "test/model", mounts: ["subagent"], prompt: "B.", skillDocs: [skill] },
    ],
  };
  const plan = materializationPlan(config);
  assert.deepEqual(plan.skills, [
    { id: "test-first", name: "Test-first", description: "TDD.", content: "Write the failing test first." },
  ]);
});