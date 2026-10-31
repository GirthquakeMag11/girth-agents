export const SWEEP_STEP_MS = 250;
export const RUNNER_MS = 900;

export function sweepOffset(cardWidth, elapsedMs) {
  const positions = Math.max(1, cardWidth - 3);
  return Math.floor(Math.max(0, elapsedMs) / SWEEP_STEP_MS) % positions;
}

export function nodeSweeps(color, cardWidth) {
  return color === "running" && cardWidth >= 6;
}

export function sweepCells(cardX, cardWidth, elapsedMs) {
  if (cardWidth < 6) return null;
  const offset = sweepOffset(cardWidth, elapsedMs);
  const x = cardX + 1 + offset;
  return {
    x,
    yOffset: 0,
    width: 2,
    glyph: "━━",
    inside: x >= cardX + 1 && x + 1 <= cardX + cardWidth - 2,
  };
}

export function runnerToneKey(label) {
  if (label === "pass") return "success";
  if (label === "fail") return "error";
  if (label === "next") return "muted";
  return "faint";
}

export function runnerProgress(start, now = Date.now()) {
  return (now - start) / RUNNER_MS;
}

export function runnerRemaining(start, now = Date.now()) {
  return RUNNER_MS - (now - start);
}

export function nextRunner(previous, handoff, now = Date.now()) {
  if (!handoff) return previous;
  return {
    from: handoff.from ?? "",
    to: handoff.to ?? "",
    label: handoff.label ?? "",
    start: now,
  };
}

export function runnerToken(runner, routes, now = Date.now()) {
  if (!runner) return null;
  const route = routeForHandoff(routes, runner.from, runner.to);
  const progress = runnerProgress(runner.start, now);
  if (!route || progress < 0 || progress >= 1) return null;
  const point = runnerPoint(route.runnerPath, progress);
  if (!point) return null;
  const cellX = Math.floor(point.x);
  const cellY = Math.floor(point.y);
  const covered = routes.some(
    (entry) =>
      entry.label &&
      cellX >= entry.label.x &&
      cellX < entry.label.x + entry.label.width &&
      cellY === entry.label.y,
  );
  return covered ? null : { point, label: runner.label, route };
}

export function advanceHistoryCursor(history = [], epoch = "", cursor = { epoch: undefined, watermark: 0 }) {
  const maxSeq = history.reduce((max, entry) => Math.max(max, Number(entry.seq) || 0), 0);
  if (cursor.epoch !== epoch) {
    return { cursor: { epoch, watermark: maxSeq }, handoff: null, reset: true };
  }
  const handoffs = history
    .filter((entry) => entry.kind === "handoff" && (Number(entry.seq) || 0) > cursor.watermark)
    .sort((a, b) => (Number(a.seq) || 0) - (Number(b.seq) || 0));
  return {
    cursor: { epoch, watermark: maxSeq },
    handoff: handoffs.length > 0 ? handoffs[handoffs.length - 1] : null,
    reset: false,
  };
}

export function routeForHandoff(routes, from, to) {
  if (!from || !to || from === to) return undefined;
  return routes.find((route) => route.from === from && route.to === to);
}

export function runnerPoint(path, progress) {
  if (!Array.isArray(path) || path.length === 0) return null;
  if (path.length === 1) return { ...path[0] };
  const clamped = Math.min(1, Math.max(0, progress));
  const lengths = [];
  let total = 0;
  for (let index = 1; index < path.length; index += 1) {
    const dx = path[index].x - path[index - 1].x;
    const dy = path[index].y - path[index - 1].y;
    const length = Math.abs(dx) + Math.abs(dy);
    lengths.push(length);
    total += length;
  }
  if (total === 0) return { ...path[0] };
  let remaining = clamped * total;
  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining <= lengths[index] || index === lengths.length - 1) {
      const ratio = lengths[index] === 0 ? 0 : remaining / lengths[index];
      const start = path[index];
      const end = path[index + 1];
      return {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      };
    }
    remaining -= lengths[index];
  }
  return { ...path[path.length - 1] };
}
