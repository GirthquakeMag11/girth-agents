// The handoff acceptance path. A handoff is a state transition on the active
// dispatch: validate the caller and label, claim it, and record it. The node
// output contract is gone, so acceptance never consults a file.

import { DISPATCHER_TARGET, handoffTarget } from "./config.mjs";
import { ControlError } from "./control.mjs";
import { handoffMessageError } from "./visibility.mjs";
import { workflowEscape } from "./workflow.mjs";

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

export function createHandoffHandler({ getQueue, getConfig, Defect }) {
  return async function onHandoff(body) {
    const active = getQueue().active;
    if (!active) throw new ControlError(403, "no active dispatch");
    if (typeof body?.sessionID !== "string" || body.sessionID !== active.sessionId) {
      throw new ControlError(403, "handoff session is not the active node");
    }
    const node = active.nodeDef;
    if (!node) throw new ControlError(403, "the active node is not ready for a handoff");
    if (node.handoff.mode === "terminal") throw new ControlError(422, "this terminal node takes no handoff");

    if (claimHandoff(active, node, Defect)) {
      throw new ControlError(409, "handoff already accepted");
    }
    try {
      const label = body.label;
      if (typeof label !== "string" || label.trim() === "") throw new ControlError(422, "handoff needs a non-empty label");
      const message = body.message;
      const messageFault = handoffMessageError(message);
      if (messageFault) throw new ControlError(422, `${messageFault}: invalid handoff message`);
      const target = handoffTarget(node, label);
      if (!target) {
        const allowed = node.handoff.mode === "unconditional" ? "next" : node.handoff.labels.map((entry) => entry.label).join(", ");
        throw new ControlError(422, `handoff.unknown-tool: label '${label}' is not declared for node '${node.id}' (allowed: ${allowed})`);
      }

      if (target !== DISPATCHER_TARGET) {
        const escape = workflowEscape(getConfig().graph, active.workflow, target);
        if (escape) {
          active.handoffDefect = new Defect(
            escape.code,
            `handoff '${label}' from '${node.id}' to '${target}': ${escape.message}`,
          );
          throw new ControlError(422, active.handoffDefect.message);
        }
      }

      active.handoff = {
        label,
        message,
        callID: body.callID ?? null,
        at: new Date().toISOString(),
      };
      return { body: { ok: true, label } };
    } finally {
      active.handoffPending = false;
    }
  };
}
