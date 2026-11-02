export function claimHandoff(active, node, Defect) {
  if (active.handoff || active.handoffPending) {
    const defect = new Defect(
      "handoff.multiple",
      `node '${node.id}' handed off more than once`,
    );
    active.handoffDefect = defect;
    return defect;
  }
  active.handoffPending = true;
  return null;
}
