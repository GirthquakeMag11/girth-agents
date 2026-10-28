// The graph illustration, drawn as plain text from the live config — one
// source of truth. The README's illustration block is this output, verbatim;
// the drift test fails when the two diverge, enforcing the sync convention
// (conventions/On_Docs.md). Plain text renders everywhere: no renderer to
// satisfy, no platform to fail.

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
  const decide = byId.get(out.get(first.id)[0].to);
  const branches = (out.get(decide.id) ?? []).filter((l) => l.condition && !l.exhausted);
  const passLink = branches.find((l) => byId.get(l.to)?.type === "exit");
  const failLink = branches.find((l) => byId.get(l.to)?.type !== "exit");
  const passExit = byId.get(passLink?.to);
  const repair = byId.get(failLink?.to);
  const bounce = byId.get((out.get(repair?.id) ?? []).find((l) => l.exhausted)?.to);

  const note = (n) => {
    if (!n) return "";
    if (n.type === "entry") return `entry · ${n.marker ?? "claimed"}`;
    if (n.type === "task") return `${n.helper} · ${n.artifact ?? ""}`;
    if (n.type === "exit") return n.record?.kind === "question" ? "exit · question · awaiting-answer" : "exit";
    return "";
  };

  const passLabel = `${passLink?.condition?.field}=${passLink?.condition?.equals}`;
  const failLabel = `${failLink?.condition?.field}=${failLink?.condition?.equals}`;
  const maxVisits = repair?.maxVisits;

  const W = 44;
  const L = [];
  L.push(center(entry.id, W));
  L.push(center(`[${note(entry)}]`, W));
  L.push(center("│", W), center("▼", W));
  L.push(center(first.id, W));
  L.push(center(`[${note(first)}]`, W));
  L.push(center("│", W), center("▼", W));
  L.push(center(decide.id, W));
  L.push(center(`[${note(decide)}]`, W));
  L.push("");
  // the two branch columns, each anchored under its verdict label
  const gap = 8;
  const offset = Math.floor((W - (passLabel.length + gap + failLabel.length)) / 2);
  const passX = offset + Math.floor(passLabel.length / 2);
  const failX = offset + passLabel.length + gap + Math.floor(failLabel.length / 2);
  const place = (s, x) => " ".repeat(Math.max(0, x - Math.floor(s.length / 2))) + s;
  L.push(" ".repeat(offset) + passLabel + " ".repeat(gap) + failLabel);
  const sticks = " ".repeat(W).split("");
  sticks[passX] = "│";
  sticks[failX] = "│";
  L.push(sticks.join(""));
  L.push(place(passExit.id, passX));
  L.push(place(`[${note(passExit)}]`, passX));
  L.push(place(repair.id, failX));
  L.push(place(repair?.resume ? `[resumes ${repair.resume}'s session]` : `[${note(repair)}]`, failX));
  L.push(place("re-grade — back up to review", failX));
  L.push(place(maxVisits ? `after ${maxVisits} repairs` : "", failX));
  const rightStick = " ".repeat(W).split("");
  rightStick[failX] = "│";
  L.push(rightStick.join(""));
  L.push(place("▼", failX));
  L.push(place(bounce.id, failX));
  L.push(place(`[${note(bounce)}]`, failX));
  L.push("");
  L.push(center(`${decide.id} · any other verdict → loud defect: the chain halts, nothing routes`, W + 12));
  return L.map((line) => line.replace(/\s+$/, "")).join("\n") + "\n";
}

export function extractDiagram(readmeText) {
  const match = readmeText.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
  return match ? match[1] : null;
}