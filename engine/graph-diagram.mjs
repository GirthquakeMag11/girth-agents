// The graph illustration, generated from the live config — one source of
// truth. The README's diagram block is this output, verbatim; the drift
// test fails when the two diverge, enforcing the sync convention
// (conventions/On_Docs.md).

const CLASS_DEFS = [
  "    classDef entry fill:#e8e8e8,stroke:#555,stroke-width:2px",
  "    classDef task fill:#dbeafe,stroke:#1d4ed8,stroke-width:2px",
  "    classDef decide fill:#fef9c3,stroke:#a16207,stroke-width:2px",
  "    classDef done fill:#dcfce7,stroke:#15803d,stroke-width:2px",
  "    classDef bounce fill:#fee2e2,stroke:#b91c1c,stroke-width:2px",
  "    classDef defect fill:#f3e8ff,stroke:#7e22ce,stroke-width:2px,stroke-dasharray: 5 2",
];

function mid(id) {
  return id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function isDecide(links) {
  return links.some((l) => l.condition && !l.exhausted);
}

function nodeLabel(node) {
  if (node.type === "entry") {
    return `${node.id} — entry${node.marker ? ` · marker: ${node.marker}` : ""}`;
  }
  if (node.type === "exit") {
    if (node.record?.kind === "question") return `${node.id} — exit · question · awaiting-answer`;
    if (node.record?.kind === "defect") return `${node.id} — exit · defect · awaiting-attention`;
    return `${node.id} — exit`;
  }
  const parts = [`${node.id} — task · ${node.helper}`];
  if (node.resume) parts.push(`resumes ${node.resume}'s session`);
  else if (node.artifact) parts.push(node.artifact);
  if (node.maxVisits) parts.push(`maxVisits: ${node.maxVisits}`);
  return parts.join(" · ");
}

export function generateDiagram(doc) {
  const byId = new Map(doc.graph.nodes.map((n) => [n.id, n]));
  const out = new Map(doc.graph.nodes.map((n) => [n.id, []]));
  for (const link of doc.graph.links) out.get(link.from)?.push(link);

  const lines = ["flowchart LR", ...CLASS_DEFS, ""];

  for (const node of doc.graph.nodes) {
    const decide = isDecide(out.get(node.id) ?? []);
    const cls =
      node.type === "entry" ? "entry"
      : node.type === "exit" ? (node.record ? "bounce" : "done")
      : decide ? "decide"
      : "task";
    const open = node.type === "exit" || node.type === "entry" ? "([" : decide ? "{" : "[";
    const close = node.type === "exit" || node.type === "entry" ? "])" : decide ? "}" : "]";
    lines.push(`    ${mid(node.id)}${open}"${nodeLabel(node)}"${close}:::${cls}`);
  }
  for (const node of doc.graph.nodes) {
    if (isDecide(out.get(node.id) ?? [])) {
      lines.push(`    DEAD_${mid(node.id)}(["loud defect — chain halts, nothing routes"]):::defect`);
    }
  }

  lines.push("");
  for (const node of doc.graph.nodes) {
    for (const link of out.get(node.id) ?? []) {
      const from = mid(node.id);
      const to = mid(link.to);
      if (link.exhausted) {
        lines.push(`    ${from} -- "after ${node.maxVisits ?? "the limit"} repairs" --> ${to}`);
      } else if (link.condition) {
        lines.push(`    ${from} -- "${link.condition.field} = ${link.condition.equals}" --> ${to}`);
      } else {
        lines.push(`    ${from} --> ${to}`);
      }
    }
  }
  for (const node of doc.graph.nodes) {
    if (isDecide(out.get(node.id) ?? [])) {
      lines.push(`    ${mid(node.id)} -. "any other stamp" .-> DEAD_${mid(node.id)}`);
    }
  }
  return lines.join("\n") + "\n";
}

export function extractDiagram(readmeText) {
  const match = readmeText.match(/```mermaid\n([\s\S]*?)```/);
  return match ? match[1] : null;
}