import test from "node:test";
import assert from "node:assert/strict";
import { edgeList, topologicalOrder } from "../src/model.mjs";
import { layoutGraph } from "../src/layout.mjs";

const nodes = [
  {
    id: "a",
    handoff: {
      mode: "conditional",
      labels: [
        { label: "report", to: "$dispatcher" },
        { label: "next", to: "b" },
      ],
    },
  },
  { id: "b", handoff: { mode: "terminal" } },
];

test("dispatcher target: no phantom node, edge, or route", () => {
  const edges = edgeList(nodes);
  assert.deepEqual(edges.map((edge) => edge.to), ["b"]);
  const order = topologicalOrder(nodes, edges).order;
  assert.deepEqual(order, ["a", "b"]);
  const layout = layoutGraph(nodes, edges, order, 120);
  assert.deepEqual(layout.cards.map((card) => card.id), ["a", "b"]);
  assert.equal(layout.routes.length, 1);
  assert.equal(layout.routes[0].to, "b");
});
