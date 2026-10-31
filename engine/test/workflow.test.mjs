import test from "node:test";
import assert from "node:assert/strict";
import { resolveDispatchTarget, workflowBoundary, workflowEscape } from "../workflow.mjs";
import { validateConfig } from "../config.mjs";

const graph = {
  workflows: [
    { id: "a", entry: "n1", exit: "n2", nodes: ["n1", "n2"], connections: ["b"], strict: true },
    { id: "b", entry: "n2", exit: "n2", nodes: ["n2"], connections: [], strict: false },
  ],
  nodes: [{ id: "n1" }, { id: "n2" }, { id: "n3" }],
};

test("workflow: a workflow target resolves its entry and records the main workflow", () => {
  assert.deepEqual(resolveDispatchTarget(graph, { workflow: "a", prompt: "work" }), {
    node: "n1",
    workflow: "a",
  });
});

test("workflow: a node target records no workflow", () => {
  assert.deepEqual(resolveDispatchTarget(graph, { node: "n3", prompt: "work" }), {
    node: "n3",
    workflow: null,
  });
});

test("workflow: exactly one target is required", () => {
  assert.throws(() => resolveDispatchTarget(graph, { prompt: "work" }), /exactly one of node or workflow/);
  assert.throws(
    () => resolveDispatchTarget(graph, { node: "n1", workflow: "a", prompt: "work" }),
    /exactly one of node or workflow/,
  );
  assert.throws(() => resolveDispatchTarget(graph, { workflow: "missing", prompt: "work" }), /no workflow/);
  assert.throws(() => resolveDispatchTarget(graph, { node: "missing", prompt: "work" }), /no node/);
});

test("workflow: boundary is transitive, main-aware, and strict-aware", () => {
  const inside = workflowBoundary(graph, "a", "n2");
  assert.equal(inside.inside, true);
  assert.equal(inside.escaped, false);
  assert.equal(inside.strict, true);
  assert.deepEqual(inside.memberships, ["a", "b"]);

  const escaped = workflowBoundary(graph, "a", "n3");
  assert.equal(escaped.inside, false);
  assert.equal(escaped.escaped, true);
  assert.equal(escaped.strict, true);

  const outsideNonStrict = workflowBoundary(graph, "b", "n1");
  assert.equal(outsideNonStrict.inside, false);
  assert.equal(outsideNonStrict.escaped, true);
  assert.equal(outsideNonStrict.strict, false);

  const nodeDispatch = workflowBoundary(graph, null, "n1");
  assert.equal(nodeDispatch.inside, true);
  assert.equal(nodeDispatch.escaped, false);
  assert.equal(nodeDispatch.strict, false);
});

const strictDoc = {
  version: "3",
  helpers: [
    {
      id: "builder",
      model: "openrouter/~deepseek/deepseek-flash-latest",
      agent: "build",
      permissions: ["read", "edit", "shell"],
      craft: "Work.",
    },
  ],
  graph: {
    outputRoot: "work",
    maxSteps: 10,
    workflows: [
      {
        id: "A",
        entry: "a1",
        exit: "a2",
        nodes: ["a1", "a2"],
        connections: ["B", "C"],
        strict: true,
      },
      { id: "B", entry: "b1", exit: "b1", nodes: ["b1"] },
      { id: "C", entry: "c1", exit: "c1", nodes: ["c1"] },
      { id: "D", entry: "d1", exit: "d1", nodes: ["d1"] },
    ],
    nodes: [
      {
        id: "a1",
        helper: "builder",
        objective: "choose",
        output: "a1.md",
        handoff: {
          mode: "conditional",
          labels: [
            { label: "next", to: "a2", description: "continue" },
            { label: "b", to: "b1", description: "connected B" },
            { label: "c", to: "c1", description: "connected C" },
            { label: "escape", to: "o", description: "leave" },
            { label: "d", to: "d1", description: "disconnected D" },
          ],
        },
      },
      { id: "a2", helper: "builder", objective: "finish", output: "a2.md", handoff: { mode: "terminal" } },
      { id: "b1", helper: "builder", objective: "b", output: "b1.md", handoff: { mode: "terminal" } },
      { id: "c1", helper: "builder", objective: "c", output: "c1.md", handoff: { mode: "terminal" } },
      { id: "d1", helper: "builder", objective: "d", output: "d1.md", handoff: { mode: "terminal" } },
      { id: "o", helper: "builder", objective: "outside", output: "o.md", handoff: { mode: "terminal" } },
    ],
  },
};

test("workflow: strict escape produces workflow.escape; non-strict allows it", () => {
  assert.deepEqual(validateConfig(strictDoc), []);
  assert.equal(workflowEscape(strictDoc.graph, "A", "a2"), null);
  assert.equal(workflowEscape(strictDoc.graph, "A", "b1"), null);
  assert.equal(workflowEscape(strictDoc.graph, "A", "c1"), null);
  assert.deepEqual(workflowEscape(strictDoc.graph, "A", "o"), {
    code: "workflow.escape",
    message: "node 'o' leaves workflow 'A' and its connections",
  });
  assert.deepEqual(workflowEscape(strictDoc.graph, "A", "d1"), {
    code: "workflow.escape",
    message: "node 'd1' leaves workflow 'A' and its connections",
  });

  const nonStrict = structuredClone(strictDoc);
  nonStrict.graph.workflows[0].strict = false;
  assert.deepEqual(validateConfig(nonStrict), []);
  assert.equal(workflowEscape(nonStrict.graph, "A", "o"), null);
  assert.equal(workflowEscape(nonStrict.graph, "A", "d1"), null);
});
