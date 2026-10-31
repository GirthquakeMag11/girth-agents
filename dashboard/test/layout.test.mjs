import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { edgeList, engagementModel, topologicalOrder } from "../src/model.mjs";
import { routeForHandoff, runnerPoint, runnerToken } from "../src/motion.mjs";
import { layoutGraph } from "../src/layout.mjs";

const nodes = [
  { id: "a", handoff: { mode: "unconditional", to: "b" } },
  {
    id: "b",
    handoff: {
      mode: "conditional",
      labels: [
        { label: "pass", to: "c" },
        { label: "fail", to: "a", resume: true },
      ],
    },
  },
  { id: "c", handoff: { mode: "terminal" } },
];

function ordered() {
  const edges = edgeList(nodes);
  return { edges, order: topologicalOrder(nodes, edges) };
}

test("layout: every node gets one card and every edge gets a bounded route", () => {
  const { edges, order } = ordered();
  const layout = layoutGraph(nodes, edges, order.order, 120, { nodeWidth: 34, nodeHeight: 4, gap: 5 });
  assert.deepEqual(layout.cards.map((card) => card.id), order.order);
  assert.ok(layout.cards.every((card) => card.width === 34 && card.height === 4));
  assert.equal(new Set(layout.cards.map((card) => card.id)).size, 3);
  assert.equal(layout.routes.length, edges.length);
  assert.equal(layout.connectors, undefined);
  assert.ok(layout.routes.every((route) => route.segments.length > 0 && route.label && route.tick));
});

test("layout: every handoff label is a chip attached to its connector", () => {
  const { edges, order } = ordered();
  const layout = layoutGraph(nodes, edges, order.order, 120, { nodeWidth: 34, nodeHeight: 4, gap: 5 });
  const pass = layout.routes.find((route) => route.labelText === "pass");
  const fail = layout.routes.find((route) => route.labelText === "fail");
  assert.equal(pass.label.text, "pass");
  assert.equal(fail.label.text, "fail ↻");
  assert.equal(fail.resume, true);

  for (const route of layout.routes) {
    const vertical = route.segments.find((segment) => segment.width === 1 && segment.sides.includes("left"));
    assert.ok(vertical, `route ${route.key} must have a connector line`);
    assert.equal(Math.abs(route.tick.x - vertical.x), 1, `route ${route.key} tick must touch its connector`);
    const attached = route.label.x === route.tick.x + 1 || route.label.x + route.label.width === route.tick.x;
    assert.ok(attached, `route ${route.key} label must touch its tick`);
    assert.ok(route.label.x >= 0);
    assert.ok(route.label.x + route.label.width <= layout.width);
  }
});

test("layout: a narrow graph remains inside its measured content width", () => {
  const { edges, order } = ordered();
  const layout = layoutGraph(nodes, edges, order.order, 54, { nodeWidth: 34, nodeHeight: 4, gap: 5 });
  assert.ok(layout.cardWidth <= 34 && layout.cardWidth >= 24);
  for (const route of layout.routes) {
    assert.ok(route.label.x >= 0);
    assert.ok(route.label.x + route.label.width <= layout.width);
  }
});

const engagementFixture = JSON.parse(
  await readFile(new URL("../fixtures/engagement.json", import.meta.url), "utf8"),
);
const crossingFixture = JSON.parse(
  await readFile(new URL("../fixtures/crossing.json", import.meta.url), "utf8"),
);

function fixtureLayout(fixture, containers, width = 74) {
  const nodes = fixture.graph.nodes;
  const edges = edgeList(nodes);
  const order = topologicalOrder(nodes, edges);
  return layoutGraph(nodes, edges, order.order, width, {
    nodeWidth: 34,
    nodeHeight: 4,
    gap: 4,
    containers,
  });
}

test("layout: workflow boxes contain only contiguous members", () => {
  const engagement = engagementModel(
    engagementFixture,
    [{ dispatchId: "d-a-y", node: "y", workflow: "A", state: "running" }],
    [],
  );
  const layout = fixtureLayout(engagementFixture, engagement.containers);
  const cards = new Map(layout.cards.map((card) => [card.id, card]));

  const a = layout.containers.find((container) => container.workflowId === "A");
  assert.equal(a.kind, "box");
  const inRange = layout.cards
    .filter((card) => card.y >= a.y && card.y + card.height <= a.y + a.height)
    .map((card) => card.id)
    .sort();
  assert.deepEqual(inRange, [...a.nodeIds].sort());

  const b = layout.containers.find((container) => container.workflowId === "B");
  assert.equal(b.kind, "rail", "interleaved B must use a rail");
  const c = layout.containers.find((container) => container.workflowId === "C");
  assert.equal(c.kind, "box");
  assert.equal(new Set(layout.cards.map((card) => card.id)).size, layout.cards.length);
  assert.equal(new Set(layout.cards.map((card) => card.id)).size, cards.size);
  assert.equal(layout.cards.filter((card) => card.id === "x").length, 1, "the shared node renders once");
  assert.ok(a.nodeIds.includes("x") && b.nodeIds.includes("x"), "containers may reference the shared node");
  for (const container of layout.containers.filter((entry) => entry.kind === "box")) {
    const claimed = layout.cards
      .filter((card) => card.y >= container.y && card.y + card.height <= container.y + container.height)
      .map((card) => card.id);
    assert.deepEqual(new Set(claimed), new Set(container.nodeIds), `${container.workflowId} must not claim a non-member`);
  }
});

test("layout: the crossing fixture uses rails and never claims a non-member", () => {
  const layout = fixtureLayout(crossingFixture, crossingFixture.containers);
  assert.ok(layout.containers.length === 2);
  assert.ok(layout.containers.every((container) => container.kind === "rail"));
  assert.ok(layout.containers.every((container) => container.kind !== "box"));
  assert.equal(new Set(layout.cards.map((card) => card.id)).size, 4);
  for (const container of layout.containers) {
    for (const tick of container.ticks) {
      const card = layout.cards.find((entry) => entry.y + Math.floor(entry.height / 2) === tick.y);
      assert.ok(card, "a rail tick must land on a card row");
      assert.ok(container.nodeIds.includes(card.id), "a rail must only reference its own members");
    }
  }
});

test("layout: a queued main container is labelled waiting", () => {
  const engagement = engagementModel(
    engagementFixture,
    [],
    [{ dispatchId: "q-a", node: "a1", workflow: "A", state: "queued" }],
  );
  const layout = fixtureLayout(engagementFixture, engagement.containers);
  const a = layout.containers.find((container) => container.workflowId === "A");
  assert.equal(a.state, "queued");
  assert.match(a.label, /queued/);
});

test("layout: two queued mains coexist and every node still renders once", () => {
  const engagement = engagementModel(
    engagementFixture,
    [],
    [
      { dispatchId: "q-a", node: "a1", workflow: "A", state: "queued" },
      { dispatchId: "q-d", node: "d1", workflow: "D", state: "queued" },
    ],
  );
  const layout = fixtureLayout(engagementFixture, engagement.containers);
  const boxes = layout.containers.filter((container) => container.kind === "box");
  assert.equal(boxes.length, 2);
  assert.ok(boxes.every((container) => container.state === "queued" && /queued/.test(container.label)));
  assert.equal(new Set(layout.cards.map((card) => card.id)).size, layout.cards.length);
  assert.equal(layout.cards.length, engagementFixture.graph.nodes.length);
});

test("layout: every non-self route exposes an ordered runner path", () => {
  const { edges, order } = ordered();
  const layout = layoutGraph(nodes, edges, order.order, 120, { nodeWidth: 34, nodeHeight: 4, gap: 5 });
  for (const route of layout.routes) {
    assert.equal(route.self, false);
    assert.ok(route.runnerPath.length >= 2, `${route.key} must expose a runner path`);
    const first = route.runnerPath[0];
    const last = route.runnerPath.at(-1);
    assert.ok(Number.isFinite(first.x) && Number.isFinite(first.y));
    assert.ok(Number.isFinite(last.x) && Number.isFinite(last.y));
  }
  const fail = layout.routes.find((route) => route.labelText === "fail");
  assert.equal(
    fail.runnerPath.some(
      (point) =>
        point.x >= fail.label.x &&
        point.x < fail.label.x + fail.label.width &&
        point.y === fail.label.y,
    ),
    false,
    "the runner path must not cross the label chip",
  );
});

test("layout: a self-handoff has no runner path", () => {
  const selfNodes = [
    {
      id: "a",
      handoff: { mode: "conditional", labels: [{ label: "again", to: "a" }] },
    },
  ];
  const edges = edgeList(selfNodes);
  const order = topologicalOrder(selfNodes, edges);
  const layout = layoutGraph(selfNodes, edges, order.order, 80, { nodeWidth: 34, nodeHeight: 4, gap: 4 });
  assert.equal(layout.routes.length, 1);
  assert.equal(layout.routes[0].self, true);
  assert.deepEqual(layout.routes[0].runnerPath, []);
  assert.equal(routeForHandoff(layout.routes, "a", "a"), undefined);
});


test("layout: the forward runner path does not cross its label chip", () => {
  const engagement = engagementModel(
    engagementFixture,
    [{ dispatchId: "d-a-y", node: "y", workflow: "A", state: "running" }],
    [],
  );
  const layout = fixtureLayout(engagementFixture, engagement.containers);
  const route = layout.routes.find((entry) => entry.from === "x" && entry.to === "y");
  assert.ok(route, "the forward x->y route must exist");
  assert.ok(route.runnerPath.length >= 2);
  for (let index = 0; index <= 100; index += 1) {
    const point = runnerPoint(route.runnerPath, index / 100);
    const inside =
      point.x >= route.label.x &&
      point.x < route.label.x + route.label.width &&
      point.y === route.label.y;
    assert.equal(inside, false, "the runner must not cross the forward label chip");
  }
});

test("layout: a token never paints over another route's label chip", () => {
  const crossingNodes = [
    { id: "a", handoff: { mode: "conditional", labels: [{ label: "toC", to: "c" }, { label: "toB", to: "b" }] } },
    { id: "b", handoff: { mode: "conditional", labels: [{ label: "toD", to: "d" }, { label: "toC", to: "c" }] } },
    { id: "c", handoff: { mode: "unconditional", to: "d" } },
    { id: "d", handoff: { mode: "terminal" } },
  ];
  const crossingEdges = edgeList(crossingNodes);
  const layout = layoutGraph(crossingNodes, crossingEdges, ["a", "b", "c", "d"], 84, {
    nodeWidth: 34,
    nodeHeight: 4,
    gap: 4,
  });
  const route = routeForHandoff(layout.routes, "b", "d");
  assert.ok(route);
  const chip = layout.routes.find((entry) => entry.from === "a" && entry.to === "c").label;
  let rawOverlap = false;
  let suppressed = 0;
  for (let index = 0; index <= 100; index += 1) {
    const point = runnerPoint(route.runnerPath, index / 100);
    if (point.x >= chip.x && point.x < chip.x + chip.width && point.y === chip.y) rawOverlap = true;
    const token = runnerToken({ from: "b", to: "d", label: "next", start: 0 }, layout.routes, (index / 100) * 900);
    if (!token) suppressed += 1;
    if (token) {
      const covered = layout.routes.some(
        (entry) =>
          entry.label &&
          token.point.x >= entry.label.x &&
          token.point.x < entry.label.x + entry.label.width &&
          token.point.y === entry.label.y,
      );
      assert.equal(covered, false, "a visible token must never be on a label chip");
    }
  }
  assert.equal(rawOverlap, true, "the fixture must exercise a raw path/chip overlap");
  assert.ok(suppressed > 0, "the token must actually be hidden while crossing the chip");
});
