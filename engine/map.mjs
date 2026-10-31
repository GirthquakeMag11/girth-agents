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

function sessionSuffix(resume) {
  return resume === true ? " (resume)" : "";
}

function handoffText(node) {
  if (!node.handoff) return "";
  if (node.handoff.mode === "terminal") return "terminal";
  if (node.handoff.mode === "unconditional") {
    return `next → ${node.handoff.to}${sessionSuffix(node.handoff.resume)}`;
  }
  return node.handoff.labels
    .map((label) => `${label.label} → ${label.to}${sessionSuffix(label.resume)}`)
    .join("; ");
}

function nodeLabel(node, workflow) {
  const bits = [`${node.id} · ${node.helper}`];
  if (workflow && workflow.entry === node.id) bits.push("entry");
  if (workflow && workflow.exit === node.id) bits.push("exit");
  if (node.handoff?.mode === "terminal") bits.push("terminal");
  return mermaidText(bits.join("<br/>"));
}

export const MAP_LEGEND =
  "resume = this route reuses the target session · stadium/dashed = terminal · box = workflow view · workflow table carries connections/strict";

export function renderMermaid(graph, { runtime = null, workflow = null } = {}) {
  const nodes = graph.nodes ?? [];
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
      if (to) lines.push(`  ${from} -->|${mermaidText("next" + sessionSuffix(handoff.resume))}| ${to}`);
    } else {
      for (const label of handoff.labels ?? []) {
        const to = vars.get(label.to);
        if (to) lines.push(`  ${from} -->|${mermaidText(label.label + sessionSuffix(label.resume))}| ${to}`);
      }
    }
  }

  lines.push("  classDef terminal stroke-width:2px,stroke-dasharray:4 2");
  lines.push("  classDef active fill:#d1fae5,stroke:#047857,stroke-width:3px");

  for (const node of nodes) {
    const varName = vars.get(node.id);
    if (!varName) continue;
    if (node.handoff?.mode === "terminal") lines.push(`  class ${varName} terminal`);
  }

  if (runtime?.active) {
    const activeVar = vars.get(runtime.active.node);
    if (activeVar) lines.push(`  class ${activeVar} active`);
  }

  return lines.join("\n");
}

export function renderWorkflowTable(graph) {
  const workflows = graph.workflows ?? [];
  if (workflows.length === 0) return "";
  const lines = [
    "| Workflow | Entry | Exit | Nodes | Connections | Strict |",
    "|---|---|---|---|---|---|",
    ...workflows.map((workflow) =>
      `| ${tableText(workflow.id)} | ${tableText(workflow.entry)} | ${tableText(workflow.exit)} | ${workflow.nodes.map(tableText).join(", ")} | ${(workflow.connections ?? []).map(tableText).join(", ") || "—"} | ${workflow.strict === true ? "yes" : "no"} |`,
    ),
  ];
  return lines.join("\n");
}

export function renderNodeTable(graph) {
  const lines = [
    "| Node | Helper | Objective | Output | Handoff | Max visits |",
    "|---|---|---|---|---|---|",
  ];
  for (const node of graph.nodes ?? []) {
    lines.push(
      `| ${tableText(node.id)} | ${tableText(node.helper)} | ${tableText(node.objective)} | ${tableText(relativeOutput(graph, node))} | ${tableText(handoffText(node))} | ${node.maxVisits ?? "—"} |`,
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
    mermaid: renderMermaid(graph, { runtime, workflow }),
    workflowTable: renderWorkflowTable(graph),
    nodeTable: renderNodeTable(graph),
    legend: MAP_LEGEND,
  };
}

export function renderGraphMapResponse(graph, runtime = null) {
  return {
    ok: true,
    ...renderGraphMap(graph, { runtime }),
    state: renderState(runtime),
    runtime,
  };
}

export function renderGraphArtifact(config, configPath) {
  const map = renderGraphMap(config.graph, { runtime: null });
  const sections = [
    "# Graph",
    "",
    `Generated from \`${configPath}\`.`,
    "",
    "```mermaid",
    map.mermaid,
    "```",
    "",
    MAP_LEGEND,
    "",
  ];
  if (map.workflowTable) {
    sections.push("### Workflows", "", map.workflowTable, "");
  }
  sections.push("### Nodes", "", map.nodeTable, "");
  return sections.join("\n") + "\n";
}
