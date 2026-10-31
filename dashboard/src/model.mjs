function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

export function edgeList(nodes) {
  const edges = [];
  for (const node of nodes) {
    if (node.handoff.mode === "unconditional") {
      edges.push({
        from: node.id,
        to: node.handoff.to,
        label: "next",
        resume: node.handoff.resume === true,
        key: `${node.id}:next->${node.handoff.to}`,
      });
    } else if (node.handoff.mode === "conditional") {
      for (const entry of node.handoff.labels) {
        edges.push({
          from: node.id,
          to: entry.to,
          label: entry.label,
          resume: entry.resume === true,
          key: `${node.id}:${entry.label}->${entry.to}`,
        });
      }
    }
  }
  return edges;
}

export function topologicalOrder(nodes, edges) {
  const outgoing = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    if (outgoing.has(edge.from)) outgoing.get(edge.from).push(edge);
  }
  const state = new Map();
  const post = [];
  const back = new Set();
  const visit = (id) => {
    state.set(id, 1);
    for (const edge of outgoing.get(id) ?? []) {
      const target = state.get(edge.to) ?? 0;
      if (target === 1) {
        back.add(edge.key);
        continue;
      }
      if (target === 0) visit(edge.to);
    }
    state.set(id, 2);
    post.push(id);
  };
  for (const node of nodes) {
    if (!state.get(node.id)) visit(node.id);
  }
  return { order: post.reverse(), back };
}

export function workflowsForNode(workflows, nodeId) {
  return (workflows ?? []).filter((workflow) => workflow.nodes.includes(nodeId)).map((workflow) => workflow.id);
}

export function allowedWorkflows(workflows, workflowId) {
  const byId = new Map((workflows ?? []).map((workflow) => [workflow.id, workflow]));
  const allowed = new Set();
  if (!byId.has(workflowId)) return allowed;
  allowed.add(workflowId);
  const stack = [workflowId];
  while (stack.length > 0) {
    const workflow = byId.get(stack.pop());
    for (const next of workflow?.connections ?? []) {
      if (!allowed.has(next) && byId.has(next)) {
        allowed.add(next);
        stack.push(next);
      }
    }
  }
  return allowed;
}

export function nodeState(node, activeDispatches, queue) {
  const active = asList(activeDispatches);
  if (active.some((entry) => entry?.node === node.id)) return { marker: "●", label: "running", color: "running" };
  if ((queue ?? []).some((entry) => entry?.node === node.id)) return { marker: "◌", label: "queued", color: "queued" };
  if (node.handoff.mode === "terminal") return { marker: "■", label: "terminal", color: "terminal" };
  return { marker: "○", label: "idle", color: "idle" };
}

export function edgeColor(label) {
  if (label === "pass") return "pass";
  if (label === "fail") return "fail";
  return "next";
}

export function liveDetails(config, activeDispatches = []) {
  const nodes = new Map((config.graph.nodes ?? []).map((node) => [node.id, node]));
  const active = asList(activeDispatches);
  return active
    .map((dispatch) => {
      const node = nodes.get(dispatch?.node);
      if (!node) return null;
      return {
        dispatch,
        node,
        memberships: detailsMemberships(config, node.id, active, []),
      };
    })
    .filter(Boolean);
}

function mergeContainer(map, workflowId, { kind, state, primary, dispatchId }) {
  let container = map.get(workflowId);
  if (!container) {
    container = {
      workflowId,
      kind,
      state,
      primary: Boolean(primary),
      dispatchIds: [],
    };
    map.set(workflowId, container);
  }
  if (dispatchId && !container.dispatchIds.includes(dispatchId)) container.dispatchIds.push(dispatchId);
  if (kind === "main") container.kind = "main";
  if (primary) {
    container.kind = "main";
    container.primary = true;
  }
  if (state === "active") container.state = "active";
}

export function engagementModel(config, activeDispatches = [], queue = []) {
  const workflows = config.graph?.workflows ?? [];
  const byId = new Map(workflows.map((workflow) => [workflow.id, workflow]));
  const active = asList(activeDispatches);
  const containers = new Map();
  const escapes = [];

  for (const dispatch of active) {
    if (!dispatch?.node) continue;
    if (!dispatch.workflow || !byId.has(dispatch.workflow)) continue;
    const main = byId.get(dispatch.workflow);
    const allowed = allowedWorkflows(workflows, main.id);
    const memberships = workflowsForNode(workflows, dispatch.node);
    const insideMain = memberships.includes(main.id);
    const connected = memberships.filter((id) => id !== main.id && allowed.has(id));

    mergeContainer(containers, main.id, {
      kind: "main",
      state: "active",
      primary: true,
      dispatchId: dispatch.dispatchId,
    });

    if (!insideMain) {
      for (const id of connected) {
        mergeContainer(containers, id, {
          kind: "connected",
          state: "active",
          primary: false,
          dispatchId: dispatch.dispatchId,
        });
      }
      if (connected.length === 0) {
        escapes.push({
          dispatchId: dispatch.dispatchId,
          node: dispatch.node,
          mainWorkflow: main.id,
          allowed: [...allowed],
          memberships,
        });
      }
    }
  }

  for (const dispatch of queue ?? []) {
    if (!dispatch?.workflow || !byId.has(dispatch.workflow)) continue;
    mergeContainer(containers, dispatch.workflow, {
      kind: "main",
      state: "queued",
      primary: false,
      dispatchId: dispatch.dispatchId,
    });
  }

  const rank = (container) => (container.kind === "main" ? (container.state === "active" ? 0 : 1) : 2);
  const order = new Map(workflows.map((workflow, index) => [workflow.id, index]));
  const engaged = [...containers.values()]
    .map((container) => ({
      ...container,
      nodeIds: [...(byId.get(container.workflowId)?.nodes ?? [])],
    }))
    .sort((a, b) => rank(a) - rank(b) || (order.get(a.workflowId) ?? 0) - (order.get(b.workflowId) ?? 0));

  return {
    containers: engaged,
    escapes,
    activeNodes: active.map((dispatch) => dispatch.node),
    queuedNodes: (queue ?? []).map((dispatch) => dispatch.node),
  };
}

export function detailsMemberships(config, nodeId, activeDispatches = [], queue = []) {
  const workflows = config.graph?.workflows ?? [];
  const memberships = workflowsForNode(workflows, nodeId);
  if (memberships.length === 0) return [];
  const byId = new Map(workflows.map((workflow) => [workflow.id, workflow]));
  const activeIds = new Set();

  for (const dispatch of asList(activeDispatches)) {
    if (dispatch?.node !== nodeId || !dispatch.workflow || !byId.has(dispatch.workflow)) continue;
    const allowed = allowedWorkflows(workflows, dispatch.workflow);
    if (memberships.includes(dispatch.workflow)) {
      activeIds.add(dispatch.workflow);
      continue;
    }
    for (const id of memberships) {
      if (id !== dispatch.workflow && allowed.has(id)) activeIds.add(id);
    }
  }

  const queuedIds = new Set(
    (queue ?? []).filter((dispatch) => dispatch?.workflow).map((dispatch) => dispatch.workflow),
  );
  const rank = (state) => (state === "active" ? 0 : state === "queued" ? 1 : 2);
  const order = new Map(workflows.map((workflow, index) => [workflow.id, index]));
  return memberships
    .map((workflowId) => ({
      workflowId,
      state: activeIds.has(workflowId) ? "active" : queuedIds.has(workflowId) ? "queued" : "inactive",
    }))
    .sort((a, b) => rank(a.state) - rank(b.state) || (order.get(a.workflowId) ?? 0) - (order.get(b.workflowId) ?? 0));
}
