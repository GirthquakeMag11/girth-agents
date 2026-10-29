// The graph view: a deterministic Mermaid map, a workflow table, and a node
// table, generated from the config. The agent prints these verbatim; it does
// not author or summarize the graph. Workflows are labelled views over the
// graph, not containers: the nodes and edges belong to the graph.

function mermaidText(value) {
  return String(value ?? "").replace(/"/g, "'").replace(/\r?\n/g, " ").trim();
}

function tableText(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function relativeOutput(graph, node) {
  const root = graph.outputRoot ?? ".";
  return root === "." ? node.output : `${root}/${node.output}`;
}

function sessionText(node) {
  if (node.session === "resume") return "resume — same session on revisit";
  if (node.maxVisits !== undefined && node.handoff?.mode !== "terminal") {
    return "fresh — new session every visit";
  }
  return "fresh";
}

function handoffText(node) {
  if (!node.handoff) return "";
  if (node.handoff.mode === "terminal") return "terminal";
  if (node.handoff.mode === "unconditional") return `next → ${node.handoff.to}`;
  return node.handoff.labels.map((label) => `${label.label} → ${label.to}`).join("; ");
}

function inAnyCycle(node) {
  // A fresh marker is useful only where the node can be revisited. maxVisits
  // is the config's own signal that a node is in a bounded loop.
  return node.maxVisits !== undefined && node.handoff?.mode !== "terminal";
}

function nodeLabel(node, workflow) {
  const bits = [`${node.id} · ${node.helper}`];
  if (workflow && workflow.entry === node.id) bits.push("entry");
  if (workflow && workflow.exit === node.id) bits.push("exit");
  if (node.session === "resume") bits.push("↻ resume");
  else if (inAnyCycle(node)) bits.push("✦ fresh every visit");
  if (node.handoff?.mode === "terminal") bits.push("terminal");
  return mermaidText(bits.join("<br/>"));
}

export const MAP_LEGEND =
  "↻ resume = same session on revisit · ✦ fresh = new session every visit · stadium/dashed = terminal · box = workflow view";

function renderMermaid(graph, { runtime = null, workflow = null } = {}) {
  const nodes = graph.nodes ?? [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const vars = new Map(nodes.map((node, index) => [node.id, `n${index}`]));
  const lines = ["flowchart LR"];

  const workflowNodes = workflow ? new Set(workflow.nodes) : null;
  const inside = workflowNodes ? nodes.filter((node) => workflowNodes.has(node.id)) : nodes;
  const outside = workflowNodes ? nodes.filter((node) => !workflowNodes.has(node.id)) : [];
  const single = workflow !== null;

  if (single) {
    lines.push(`  subgraph wf ["workflow · ${mermaidText(workflow.id)}<br/>entry ${mermaidText(workflow.entry)} · exit ${mermaidText(workflow.exit)}"]`);
    lines.push("    direction LR");
    for (const node of inside) {
      const varName = vars.get(node.id);
      const label = nodeLabel(node, workflow);
      const shape = node.handoff?.mode === "terminal" ? `${varName}(["${label}"])` : `${varName}["${label}"]`;
      lines.push(`    ${shape}`);
    }
    lines.push("  end");
  } else {
    for (const node of nodes) {
      const varName = vars.get(node.id);
      const label = nodeLabel(node, null);
      const shape = node.handoff?.mode === "terminal" ? `${varName}(["${label}"])` : `${varName}["${label}"]`;
      lines.push(`  ${shape}`);
    }
  }

  for (const node of outside) {
    const varName = vars.get(node.id);
    const label = nodeLabel(node, null);
    const shape = node.handoff?.mode === "terminal" ? `${varName}(["${label}"])` : `${varName}["${label}"]`;
    lines.push(`  ${shape}`);
  }

  for (const node of nodes) {
    const from = vars.get(node.id);
    const handoff = node.handoff;
    if (!handoff || handoff.mode === "terminal") continue;
    if (handoff.mode === "unconditional") {
      const to = vars.get(handoff.to);
      if (to) lines.push(`  ${from} -->|next| ${to}`);
    } else {
      for (const label of handoff.labels ?? []) {
        const to = vars.get(label.to);
        if (to) lines.push(`  ${from} -->|${mermaidText(label.label)}| ${to}`);
      }
    }
  }

  lines.push("  classDef resume stroke-width:3px,stroke:#0f766e");
  lines.push("  classDef fresh stroke-dasharray:4 2,stroke:#b7791f");
  lines.push("  classDef terminal stroke-width:2px,stroke-dasharray:4 2");
  lines.push("  classDef active fill:#d1fae5,stroke:#047857,stroke-width:3px");

  for (const node of nodes) {
    const varName = vars.get(node.id);
    if (!varName) continue;
    if (node.session === "resume") lines.push(`  class ${varName} resume`);
    else if (inAnyCycle(node)) lines.push(`  class ${varName} fresh`);
    if (node.handoff?.mode === "terminal") lines.push(`  class ${varName} terminal`);
  }

  if (runtime?.active && runtime.active.graph === graph.id) {
    const activeVar = vars.get(runtime.active.node);
    if (activeVar) lines.push(`  class ${activeVar} active`);
  }

  return lines.join("\n");
}

export function renderWorkflowTable(graph) {
  const workflows = graph.workflows ?? [];
  if (workflows.length === 0) return "";
  const lines = [
    "| Workflow | Entry | Exit | Nodes |",
    "|---|---|---|---|",
    ...workflows.map((workflow) =>
      `| ${tableText(workflow.id)} | ${tableText(workflow.entry)} | ${tableText(workflow.exit)} | ${workflow.nodes.map(tableText).join(", ")} |`,
    ),
  ];
  return lines.join("\n");
}

export function renderNodeTable(graph) {
  const lines = [
    "| Node | Helper | Objective | Output | Session | Handoff | Max visits |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const node of graph.nodes ?? []) {
    lines.push(
      `| ${tableText(node.id)} | ${tableText(node.helper)} | ${tableText(node.objective)} | ${tableText(relativeOutput(graph, node))} | ${tableText(sessionText(node))} | ${tableText(handoffText(node))} | ${node.maxVisits ?? "—"} |`,
    );
  }
  return lines.join("\n");
}

export function renderState(runtime) {
  if (!runtime) return "";
  const queueIds = (runtime.queue ?? []).map((record) => record.dispatchId);
  const suffix = queueIds.length > 0 ? ` Queue: ${queueIds.join(", ")}.` : "";
  if (runtime.active) {
    return `Active: ${runtime.active.dispatchId} at ${runtime.active.node}.${suffix}`;
  }
  if (runtime.paused) return `Paused.${suffix}`;
  const defect = runtime.lastDefect?.code ? ` Last defect: ${runtime.lastDefect.code}.` : "";
  return `Idle.${suffix}${defect}`;
}

export function renderGraphMap(graph, { runtime = null } = {}) {
  const workflows = graph.workflows ?? [];
  const workflow = workflows.length === 1 ? workflows[0] : null;
  return {
    graph: graph.id,
    mermaid: renderMermaid(graph, { runtime, workflow }),
    workflowTable: renderWorkflowTable(graph),
    nodeTable: renderNodeTable(graph),
    legend: MAP_LEGEND,
  };
}

export function renderAllMaps(config, { runtime = null } = {}) {
  return {
    graphs: config.graphs.map((graph) => renderGraphMap(graph, { runtime })),
    legend: MAP_LEGEND,
    state: renderState(runtime),
  };
}

export function renderGraphArtifact(config, configPath) {
  const sections = ["# Graphs", "", `Generated from \`${configPath}\`.`, ""];
  for (const graph of config.graphs) {
    const map = renderGraphMap(graph, { runtime: null });
    sections.push(`## ${graph.id}`, "");
    sections.push("```mermaid");
    sections.push(map.mermaid);
    sections.push("```", "");
    sections.push(MAP_LEGEND, "");
    if (map.workflowTable) {
      sections.push("### Workflows", "", map.workflowTable, "");
    }
    sections.push("### Nodes", "", map.nodeTable, "");
  }
  return sections.join("\n") + "\n";
}
