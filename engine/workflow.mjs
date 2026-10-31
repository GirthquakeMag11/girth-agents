import { findNode, workflowById, workflowsForNode, allowedWorkflows } from "./config.mjs";

export function resolveDispatchTarget(graph, body) {
  const { node, workflow, prompt } = body ?? {};
  if (typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("dispatch needs a non-empty prompt");
  }
  const hasNode = typeof node === "string" && node.trim() !== "";
  const hasWorkflow = typeof workflow === "string" && workflow.trim() !== "";
  if (hasNode === hasWorkflow) {
    throw new Error("dispatch needs exactly one of node or workflow");
  }
  if (hasWorkflow) {
    const found = workflowById(graph, workflow);
    if (!found) throw new Error(`the graph has no workflow '${workflow}'`);
    return { node: found.entry, workflow: found.id };
  }
  if (!findNode(graph, node)) throw new Error(`the graph has no node '${node}'`);
  return { node, workflow: null };
}

export function workflowBoundary(graph, mainWorkflow, targetNode) {
  if (!mainWorkflow) {
    return { main: null, allowed: new Set(), memberships: [], inside: true, escaped: false, strict: false };
  }
  const main = workflowById(graph, mainWorkflow);
  const allowed = allowedWorkflows(graph, mainWorkflow);
  const memberships = workflowsForNode(graph, targetNode);
  const inside = memberships.some((id) => allowed.has(id));
  return {
    main,
    allowed,
    memberships,
    inside,
    escaped: !inside,
    strict: Boolean(main?.strict),
  };
}

export function workflowEscape(graph, mainWorkflow, targetNode) {
  const boundary = workflowBoundary(graph, mainWorkflow, targetNode);
  if (!boundary.escaped || !boundary.strict) return null;
  return {
    code: "workflow.escape",
    message: `node '${targetNode}' leaves workflow '${mainWorkflow}' and its connections`,
  };
}
