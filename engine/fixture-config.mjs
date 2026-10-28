// Test fixtures: serialize fitting and node objects into the file
// tree the loader reads — a real manifest, real helper files, real
// node files. The serialized frontmatter stays inside the parser's
// constrained subset on purpose: fixtures and reality share it.

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

function scalar(v) {
  if (Array.isArray(v)) throw new Error("fixture serializer: scalar expected, got an array");
  if (v && typeof v === "object") throw new Error("fixture serializer: scalar expected, got an object");
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

// emit `key: value` lines at the given indent; recurses for nested
// maps and for arrays whose items are maps (the link lists)
function emitLines(key, v, indent) {
  const pad = " ".repeat(indent);
  if (Array.isArray(v)) {
    if (v.length === 0) return [`${pad}${key}: []`];
    if (v.every((item) => item === null || typeof item !== "object")) {
      return [`${pad}${key}: [${v.map((i) => (typeof i === "string" ? i : JSON.stringify(i))).join(", ")}]`];
    }
    const lines = [`${pad}${key}:`];
    const itemPad = " ".repeat(indent + 2);
    for (const item of v) {
      if (item && typeof item === "object") {
        const entries = Object.entries(item);
        const [k0, v0] = entries[0];
        if (v0 && typeof v0 === "object" && !Array.isArray(v0)) {
          lines.push(`${itemPad}- ${k0}:`);
          for (const [k, iv] of Object.entries(v0)) lines.push(`${itemPad}  ${k}: ${scalar(iv)}`);
        } else {
          lines.push(`${itemPad}- ${k0}: ${scalar(v0)}`);
        }
        for (const [k, iv] of entries.slice(1)) {
          lines.push(...emitLines(k, iv, indent + 4));
        }
      } else {
        lines.push(`${itemPad}- ${scalar(item)}`);
      }
    }
    return lines;
  }
  if (v && typeof v === "object") {
    const lines = [`${pad}${key}:`];
    for (const [k, iv] of Object.entries(v)) lines.push(...emitLines(k, iv, indent + 2));
    return lines;
  }
  return [`${pad}${key}: ${scalar(v)}`];
}

export function serializeFrontmatter(data) {
  const lines = [];
  for (const [key, v] of Object.entries(data)) {
    if (v === undefined) continue;
    lines.push(...emitLines(key, v, 0));
  }
  return lines.join("\n");
}

export async function writeConfigTree(dir, { agents, nodes, skills = {} }) {
  const manifest = {
    version: "1",
    agents: Object.keys(agents).map((id) => `agents/${id}.md`),
    skills: Object.keys(skills).map((id) => `skills/${id}.md`),
    graph: { nodes: nodes.map((n) => `nodes/${n.id}.md`) },
  };
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "config.json"), JSON.stringify(manifest, null, 2));
  for (const [id, skill] of Object.entries(skills)) {
    await mkdir(join(dir, "skills"), { recursive: true });
    const { instructions = "", ...data } = skill;
    await writeFile(join(dir, "skills", `${id}.md`), `---\n${serializeFrontmatter({ id, ...data })}\n---\n${instructions}`);
  }
  for (const [id, fitting] of Object.entries(agents)) {
    await mkdir(join(dir, "agents"), { recursive: true });
    const { body = "", ...data } = fitting;
    await writeFile(join(dir, "agents", `${id}.md`), `---\n${serializeFrontmatter({ id, ...data })}\n---\n${body}`);
  }
  for (const node of nodes) {
    await mkdir(join(dir, "nodes"), { recursive: true });
    const { body = "", ...data } = node;
    await writeFile(join(dir, "nodes", `${node.id}.md`), `---\n${serializeFrontmatter(data)}\n---\n${body}`);
  }
  return join(dir, "config.json");
}