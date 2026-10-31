const DEFAULT_NODE_WIDTH = 34;
const DEFAULT_NODE_HEIGHT = 4;
const DEFAULT_GAP = 5;
const LANE_STEP = 9;
const RIGHT_LANE_RESERVE = 7;

function edgeText(edge) {
  return `${edge.label}${edge.resume ? " ↻" : ""}`;
}

function chip(x, y, text) {
  return { x, y, text, width: text.length + 2 };
}

function extent(route) {
  let right = 0;
  for (const segment of route.segments) right = Math.max(right, segment.x + segment.width);
  for (const mark of route.marks) right = Math.max(right, mark.x + 1);
  for (const arrow of route.arrows) right = Math.max(right, arrow.x + 1);
  right = Math.max(right, route.label.x + route.label.width, route.tick.x + 1);
  return right;
}

export function layoutGraph(nodes, edges, order, width, options = {}) {
  const available = Math.max(24, Math.floor(width));
  const requestedWidth = options.nodeWidth ?? DEFAULT_NODE_WIDTH;
  const nodeWidth = Math.max(24, Math.min(requestedWidth, available - 18));
  const nodeHeight = options.nodeHeight ?? DEFAULT_NODE_HEIGHT;
  const gap = options.gap ?? DEFAULT_GAP;
  const top = options.top ?? 4;
  const x = Math.max(1, Math.floor((available - nodeWidth) / 2));
  const row = new Map(order.map((id, index) => [id, top + index * (nodeHeight + gap)]));
  const index = new Map(order.map((id, index) => [id, index]));
  const cards = order
    .map((id) => nodes.find((node) => node.id === id))
    .filter(Boolean)
    .map((node) => ({ id: node.id, x, y: row.get(node.id), width: nodeWidth, height: nodeHeight }));
  const routes = [];
  let rightLane = 0;
  let contentWidth = available;

  for (const edge of edges) {
    const from = index.get(edge.from);
    const to = index.get(edge.to);
    if (from === undefined || to === undefined) continue;
    const sourceY = row.get(edge.from);
    const targetY = row.get(edge.to);
    const text = edgeText(edge);
    const route = {
      key: edge.key,
      from: edge.from,
      to: edge.to,
      labelText: edge.label,
      resume: edge.resume === true,
      segments: [],
      marks: [],
      arrows: [],
      tick: null,
      label: null,
      runnerPath: [],
      self: edge.from === edge.to,
    };

    if (to === from + 1) {
      const center = x + Math.floor(nodeWidth / 2);
      const lineTop = sourceY + nodeHeight;
      const arrowY = targetY - 1;
      const lineHeight = Math.max(0, arrowY - lineTop);
      const labelY = lineTop + Math.floor(lineHeight / 2);
      if (lineHeight > 0) {
        route.segments.push({ x: center, y: lineTop, width: 1, height: lineHeight, sides: ["left"] });
      }
      route.arrows.push({ x: center, y: arrowY, glyph: "▼" });
      route.runnerPath =
        edge.from === edge.to
          ? []
          : [
              { x: center, y: lineTop },
              { x: center, y: targetY },
            ];
      route.tick = { x: center + 1, y: labelY, glyph: "─" };
      route.label = chip(center + 2, labelY, text);
    } else if (to > from + 1) {
      const sourceAnchor = sourceY + Math.floor(nodeHeight / 2);
      const targetAnchor = targetY + Math.floor(nodeHeight / 2);
      const lane = x + nodeWidth + RIGHT_LANE_RESERVE + rightLane * LANE_STEP;
      rightLane += 1;
      const cardEdge = x + nodeWidth;
      const labelY = sourceAnchor + Math.floor((targetAnchor - sourceAnchor) / 2);
      route.segments.push(
        { x: cardEdge, y: sourceAnchor, width: lane - cardEdge, height: 1, sides: ["top"] },
        {
          x: lane,
          y: sourceAnchor + 1,
          width: 1,
          height: Math.max(0, targetAnchor - sourceAnchor - 1),
          sides: ["left"],
        },
        { x: cardEdge + 1, y: targetAnchor, width: lane - cardEdge - 1, height: 1, sides: ["top"] },
      );
      route.marks.push(
        { x: lane, y: sourceAnchor, glyph: "┐" },
        { x: lane, y: targetAnchor, glyph: "┘" },
      );
      route.arrows.push({ x: cardEdge, y: targetAnchor, glyph: "◀" });
      route.runnerPath =
        edge.from === edge.to
          ? []
          : [
              { x: cardEdge, y: sourceAnchor },
              { x: lane, y: sourceAnchor },
              { x: lane, y: targetAnchor },
              { x: cardEdge, y: targetAnchor },
            ];
      route.tick = { x: lane - 1, y: labelY, glyph: "─" };
      route.label = chip(lane - text.length - 3, labelY, text);
    } else {
      const sourceAnchor = sourceY + Math.floor(nodeHeight / 2);
      const targetAnchor = targetY + Math.floor(nodeHeight / 2);
      const lane = x + nodeWidth + RIGHT_LANE_RESERVE + rightLane * LANE_STEP;
      rightLane += 1;
      const cardEdge = x + nodeWidth;
      const labelY = targetAnchor + Math.floor((sourceAnchor - targetAnchor) / 2);
      route.segments.push(
        { x: cardEdge, y: sourceAnchor, width: lane - cardEdge, height: 1, sides: ["top"] },
        {
          x: lane,
          y: targetAnchor + 1,
          width: 1,
          height: Math.max(0, sourceAnchor - targetAnchor - 1),
          sides: ["left"],
        },
        { x: cardEdge + 1, y: targetAnchor, width: lane - cardEdge - 1, height: 1, sides: ["top"] },
      );
      route.marks.push(
        { x: lane, y: sourceAnchor, glyph: "┘" },
        { x: lane, y: targetAnchor, glyph: "┐" },
      );
      route.arrows.push({ x: cardEdge, y: targetAnchor, glyph: "◀" });
      route.runnerPath =
        edge.from === edge.to
          ? []
          : [
              { x: cardEdge, y: sourceAnchor },
              { x: lane, y: sourceAnchor },
              { x: lane, y: targetAnchor },
              { x: cardEdge, y: targetAnchor },
            ];
      route.tick = { x: lane - 1, y: labelY, glyph: "─" };
      route.label = chip(lane - text.length - 3, labelY, text);
    }

    contentWidth = Math.max(contentWidth, extent(route));
    routes.push(route);
  }

  const containers = [];
  const cardById = new Map(cards.map((card) => [card.id, card]));
  let boxIndex = 0;
  let railIndex = 0;
  let contentHeight = top + order.length * nodeHeight + Math.max(0, order.length - 1) * gap + 1;

  for (const spec of options.containers ?? []) {
    const memberCards = (spec.nodeIds ?? []).map((id) => cardById.get(id)).filter(Boolean);
    if (memberCards.length === 0) continue;
    const indices = memberCards.map((card) => index.get(card.id)).sort((a, b) => a - b);
    const contiguous = indices[indices.length - 1] - indices[0] + 1 === indices.length;
    const state = spec.state ?? "active";
    const text = state === "queued" ? `${spec.workflowId} · queued` : spec.workflowId;

    if (contiguous) {
      const insetX = 3 + boxIndex * 2;
      const insetY = 2;
      boxIndex += 1;
      const startY = row.get(order[indices[0]]);
      const endY = row.get(order[indices[indices.length - 1]]);
      let right = x + nodeWidth;
      for (const route of routes) {
        if (spec.nodeIds.includes(route.from) && spec.nodeIds.includes(route.to)) {
          right = Math.max(right, extent(route));
        }
      }
      const boxX = Math.max(0, x - insetX);
      const boxY = Math.max(0, startY - insetY);
      const boxRight = Math.max(x + nodeWidth + insetX, right + 2);
      const boxBottom = endY + nodeHeight + insetY;
      containers.push({
        workflowId: spec.workflowId,
        kind: "box",
        state,
        primary: Boolean(spec.primary),
        nodeIds: [...spec.nodeIds],
        x: boxX,
        y: boxY,
        width: boxRight - boxX,
        height: boxBottom - boxY,
        label: text,
      });
      contentWidth = Math.max(contentWidth, boxRight);
      contentHeight = Math.max(contentHeight, boxBottom);
    } else {
      const railX = Math.max(0, x - 2 - railIndex * 2);
      railIndex += 1;
      const topCenter = Math.min(...memberCards.map((card) => card.y + Math.floor(nodeHeight / 2)));
      const bottomCenter = Math.max(...memberCards.map((card) => card.y + Math.floor(nodeHeight / 2)));
      const minY = Math.min(...memberCards.map((card) => card.y));
      const ticks = memberCards.map((card) => ({
        x: railX + 1,
        y: card.y + Math.floor(nodeHeight / 2),
        width: Math.max(0, x - (railX + 1)),
        height: 1,
        sides: ["top"],
      }));
      const label = chip(railX + 2, Math.max(0, minY - 1), text);
      containers.push({
        workflowId: spec.workflowId,
        kind: "rail",
        state,
        primary: Boolean(spec.primary),
        nodeIds: [...spec.nodeIds],
        x: railX,
        y: topCenter,
        width: 1,
        height: bottomCenter - topCenter + 1,
        ticks,
        label,
      });
      contentWidth = Math.max(contentWidth, label.x + label.width, railX + 1);
    }
  }

  return {
    width: contentWidth,
    height: contentHeight,
    cardWidth: nodeWidth,
    cardHeight: nodeHeight,
    cards,
    routes,
    containers,
  };
}
