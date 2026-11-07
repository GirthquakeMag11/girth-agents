import test from "node:test";
import assert from "node:assert/strict";
import { materializationPlan } from "../materialize.mjs";

const BASE = "/graph";

test("materialize: primary and subagent mounts are published, graph mounts are not", () => {
  const config = {
    agents: [
      { id: "liaison", model: "test/model", mounts: ["graph", "primary"], prompt: "Help the user.", description: "Liaison.", permissions: [] },
      {
        id: "reviewer",
        model: "test/model#v2",
        mounts: ["subagent"],
        prompt: "Review.",
        permissions: [{ action: "read", resource: "*", effect: "allow" }],
      },
      { id: "builder", model: "test/model", mounts: ["graph"], prompt: "Build." },
    ],
  };
  const plan = materializationPlan(config, BASE);
  assert.deepEqual(plan.agents.map((agent) => agent.id), ["liaison", "reviewer"]);
  assert.equal(plan.agents[0].mode, "primary");
  assert.equal(plan.agents[0].system, "Help the user.");
  assert.equal(plan.agents[0].description, "Liaison.");
  assert.deepEqual(plan.agents[1].mode, "subagent");
  assert.deepEqual(plan.agents[1].permissions, [
    { action: "*", resource: "*", effect: "deny" },
    { action: "read", resource: "*", effect: "allow" },
  ]);
  assert.deepEqual(plan.skills, []);
});

test("materialize: a dual primary+subagent mount maps to mode 'all', not 'primary'", () => {
  const plan = materializationPlan(
    { agents: [{ id: "jack", model: "test/model", mounts: ["graph", "primary", "subagent"], prompt: "P." }] },
    BASE,
  );
  assert.equal(plan.agents[0].mode, "all");
});

test("materialize: tools acquire by name, permissions win, subagents are a launch allowlist", () => {
  const plan = materializationPlan(
    {
      agents: [
        {
          id: "a",
          model: "test/model",
          mounts: ["primary"],
          prompt: "P.",
          tools: ["read", "edit"],
          permissions: [{ action: "read", resource: "*.env", effect: "deny" }],
          subagents: ["explore"],
        },
      ],
    },
    BASE,
  );
  assert.deepEqual(plan.agents[0].permissions, [
    { action: "*", resource: "*", effect: "deny" },
    { action: "read", resource: "*", effect: "allow" },
    { action: "edit", resource: "*", effect: "allow" },
    { action: "read", resource: "*.env", effect: "deny" },
    { action: "subagent", resource: "explore", effect: "allow" },
  ]);
});

test("materialize: a mount with no acquisitions is deny-by-default", () => {
  const plan = materializationPlan(
    { agents: [{ id: "a", model: "test/model", mounts: ["subagent"], prompt: "P." }] },
    BASE,
  );
  assert.deepEqual(plan.agents[0].permissions, [{ action: "*", resource: "*", effect: "deny" }]);
});

test("materialize: @GRAPH_DIR@ in a permission resource expands to the graph directory", () => {
  const plan = materializationPlan(
    {
      agents: [
        {
          id: "engineer",
          model: "test/model",
          mounts: ["primary"],
          prompt: "P.",
          tools: ["read"],
          permissions: [{ action: "edit", resource: "@GRAPH_DIR@/**", effect: "allow" }],
        },
      ],
    },
    "/home/george/.config/opencode/graph-engine/graph",
  );
  assert.deepEqual(plan.agents[0].permissions, [
    { action: "*", resource: "*", effect: "deny" },
    { action: "read", resource: "*", effect: "allow" },
    { action: "edit", resource: "/home/george/.config/opencode/graph-engine/graph/**", effect: "allow" },
  ]);
});

test("materialize: @PLAN_DIR@ expands to the user's plan directory", () => {
  const plan = materializationPlan(
    {
      agents: [
        {
          id: "plan",
          mounts: ["primary"],
          prompt: "P.",
          permissions: [
            { action: "edit", resource: "*", effect: "deny" },
            { action: "edit", resource: "@PLAN_DIR@/**", effect: "allow" },
          ],
        },
      ],
    },
    "/home/george/.config/opencode/graph-engine/graph",
  );
  assert.deepEqual(plan.agents[0].permissions, [
    { action: "*", resource: "*", effect: "deny" },
    { action: "edit", resource: "*", effect: "deny" },
    { action: "edit", resource: "/home/george/.opencode/plan/**", effect: "allow" },
  ]);
});

test("materialize: same-action rules keep document order so the last rule wins at eval time", () => {
  // The engine EMITS the order; OpenCode's Permission.evaluate resolves
  // last-match-wins. Pin the order so `edit * deny` then `edit <dir> allow`
  // yields allow for the dir, and `* allow` then `question/subagent deny`
  // yields deny for those two actions.
  const plan = materializationPlan(
    {
      agents: [
        {
          id: "general",
          mounts: ["subagent"],
          prompt: "G.",
          permissions: [
            { action: "*", resource: "*", effect: "allow" },
            { action: "question", resource: "*", effect: "deny" },
            { action: "subagent", resource: "*", effect: "deny" },
          ],
        },
      ],
    },
    BASE,
  );
  assert.deepEqual(plan.agents[0].permissions, [
    { action: "*", resource: "*", effect: "deny" },
    { action: "*", resource: "*", effect: "allow" },
    { action: "question", resource: "*", effect: "deny" },
    { action: "subagent", resource: "*", effect: "deny" },
  ]);
});

test("materialize: the model string becomes a Model.Ref object", () => {
  const plan = materializationPlan(
    { agents: [{ id: "a", model: "openrouter/~deepseek/deepseek-flash-latest", mounts: ["primary"], prompt: "P." }] },
    BASE,
  );
  assert.deepEqual(plan.agents[0].model, { providerID: "openrouter", id: "~deepseek/deepseek-flash-latest" });

  const varied = materializationPlan(
    { agents: [{ id: "b", model: "prov/model#variant", mounts: ["subagent"], prompt: "P." }] },
    BASE,
  );
  assert.deepEqual(varied.agents[0].model, { providerID: "prov", id: "model", variant: "variant" });
});

test("materialize: an omitted model emits no model key (inherits the default)", () => {
  const plan = materializationPlan(
    { agents: [{ id: "a", mounts: ["primary"], prompt: "P." }] },
    BASE,
  );
  assert.equal("model" in plan.agents[0], false);

  const graphMount = materializationPlan(
    { agents: [{ id: "b", model: "prov/model", mounts: ["graph"], prompt: "B." }] },
    BASE,
  );
  // A graph mount is never published, so the plan is empty regardless of model.
  assert.deepEqual(graphMount.agents, []);
});

test("materialize: a declared color follows the published mount", () => {
  const plan = materializationPlan(
    { agents: [{ id: "a", model: "test/model", mounts: ["primary"], prompt: "P.", color: "#3B82F6" }] },
    BASE,
  );
  assert.equal(plan.agents[0].color, "#3B82F6");
});

test("materialize: an omitted color emits no color key (inherits/derives)", () => {
  const plan = materializationPlan(
    { agents: [{ id: "a", mounts: ["primary"], prompt: "P." }] },
    BASE,
  );
  assert.equal("color" in plan.agents[0], false);
});

test("materialize: referenced skills follow a published mount, deduped, with an absolute path", () => {
  const skill = { id: "test-first", name: "Test-first", description: "TDD.", instructions: "Write the failing test first." };
  const config = {
    agents: [
      { id: "a", model: "test/model", mounts: ["primary"], prompt: "P.", skillDocs: [skill] },
      { id: "b", model: "test/model", mounts: ["subagent"], prompt: "B.", skillDocs: [skill] },
    ],
  };
  const plan = materializationPlan(config, "/graph");
  assert.deepEqual(plan.skills, [
    {
      id: "test-first",
      name: "Test-first",
      description: "TDD.",
      path: "/graph/skills/test-first.md",
      content: "Write the failing test first.",
    },
  ]);
});