// The graph illustration, drawn as plain text from the live config — one
// source of truth. The README's illustration block is this output, verbatim;
// the drift test fails when the two diverge, enforcing the sync convention
// (conventions/On_Docs.md). Every edge is a drawn line: the loop back is an
// arc, not a note.

function center(s, w) {
  const pad = w - s.length;
  const l = Math.floor(pad / 2);
  return " ".repeat(Math.max(0, l)) + s + " ".repeat(Math.max(0, pad - l));
}

export function generateDiagram(doc) {
  const nodes = doc.graph.nodes;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out = new Map(nodes.map((n) => [n.id, []]));
  for (const link of doc.graph.links) out.get(link.from)?.push(link);

  const entry = nodes.find((n) => n.type === "entry");
  const first = byId.get(out.get(entry.id)[0].to);
  const branches = (out.get(first.id) ?? []).filter((l) => l.condition && !l.exhausted);
  const passLink = branches.find((l) => byId.get(l.to)?.type === "exit");
  const failLink = branches.find((l) => byId.get(l.to)?.type !== "exit");
  const exit = byId.get(passLink?.to);

  const LINK = " ──▶ ";
  const passEdge = ` ── ${passLink ? `${passLink.condition.field}=${passLink.condition.equals}` : "pass"} ──▶ `;
  const row1 = entry.id + LINK + first.id + passEdge + exit.id;
  const xA = Math.floor(entry.id.length / 2);
  const xB = entry.id.length + LINK.length + Math.floor(first.id.length / 2);

  const blank = " ".repeat(row1.length);
  const down = blank.split("");
  down[xB] = "│";
  down[xA] = "▲";

  const failLabel = `${failLink.condition.field}=${failLink.condition.equals}`;
  const labelAt = Math.max(xA + 1, Math.floor((xA + xB) / 2 - failLabel.length / 2));
  const arc = blank.split("");
  arc[xA] = "└";
  for (let i = xA + 1; i < xB; i++) arc[i] = "─";
  arc[xB] = "┘";
  for (let i = 0; i < failLabel.length && labelAt + i < xB; i++) arc[labelAt + i] = failLabel[i];

  const L = [
    row1,
    down.join(""),
    arc.join(""),
    "",
    `${first.id} · any other verdict → loud defect: the chain halts, nothing routes`,
  ];
  return L.map((line) => line.replace(/\s+$/, "")).join("\n") + "\n";
}

export function extractDiagram(readmeText) {
  const match = readmeText.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
  return match ? match[1] : null;
}