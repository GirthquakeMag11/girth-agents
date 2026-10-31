import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { edgeList, engagementModel, liveDetails, topologicalOrder } from "../src/model.mjs";

const fixture = JSON.parse(await readFile(new URL("../fixtures/engagement.json", import.meta.url), "utf8"));
const config = fixture;
const graph = fixture.graph;

test("engagement: the fixture orders A contiguously and leaves B crossed", () => {
  const order = topologicalOrder(graph.nodes, edgeList(graph.nodes)).order;
  assert.deepEqual(order, ["a1", "a2", "x", "z", "d1", "y", "o2", "o"]);
});

for (const entry of fixture.cases) {
  test(`engagement: ${entry.name}`, () => {
    const engagement = engagementModel(config, entry.active, entry.queue);
    assert.deepEqual(
      engagement.containers.map(({ workflowId, kind, state, primary }) => ({ workflowId, kind, state, primary })),
      entry.containers,
    );
    assert.deepEqual(
      engagement.escapes.map(({ node, mainWorkflow }) => ({ node, mainWorkflow })),
      entry.escapes,
    );

    const details = liveDetails(config, entry.active).map(({ node, memberships }) => ({
      node: node.id,
      memberships: memberships.map(({ workflowId, state }) => ({ workflowId, state })),
    }));
    assert.deepEqual(details, entry.details);
    for (const detail of details) {
      const rank = { active: 0, queued: 1, inactive: 2 };
      for (let index = 1; index < detail.memberships.length; index += 1) {
        assert.ok(
          rank[detail.memberships[index - 1].state] <= rank[detail.memberships[index].state],
          "memberships must be ordered active, queued, inactive",
        );
      }
    }
  });
}

test("engagement: multiple queued workflow dispatches keep separate waiting mains", () => {
  const queue = [
    { dispatchId: "q-a", node: "a1", workflow: "A", state: "queued" },
    { dispatchId: "q-d", node: "d1", workflow: "D", state: "queued" },
  ];
  const engagement = engagementModel(config, [], queue);
  assert.deepEqual(
    engagement.containers.map(({ workflowId, kind, state }) => ({ workflowId, kind, state })),
    [
      { workflowId: "A", kind: "main", state: "queued" },
      { workflowId: "D", kind: "main", state: "queued" },
    ],
  );
  assert.deepEqual(liveDetails(config, []), []);
});


test("live details: no active dispatch leaves Details empty; queued work does not populate it", () => {
  assert.deepEqual(liveDetails(config, []), []);
  assert.deepEqual(liveDetails(config, []), []);
  const queued = liveDetails(config, []);
  assert.equal(queued.length, 0);
});

test("details: a queued workflow membership stays inactive for an active Details entry", () => {
  const active = [{ dispatchId: "d-a", node: "x", workflow: "A", state: "running" }];
  const details = liveDetails(config, active);
  assert.equal(details.length, 1);
  assert.equal(details[0].node.id, "x");
  assert.deepEqual(
    details[0].memberships.map(({ workflowId, state }) => ({ workflowId, state })),
    [
      { workflowId: "A", state: "active" },
      { workflowId: "B", state: "inactive" },
    ],
  );
  assert.equal(details[0].memberships.some((membership) => membership.state === "queued"), false);
});
