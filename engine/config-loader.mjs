// The config loader: a thin manifest of pointers, resolved into the
// loaded document. Each agent is its own Markdown file — frontmatter
// carries the fitting, the body is the craft — and each node is its
// own Markdown file, carrying its out-links. A missing or malformed
// piece is a named load fault, never a silent hole.

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";

function fault(code, message) {
  return { code, message };
}

function manifestFaults(manifest) {
  const faults = [];
  if (typeof manifest.version !== "string" || !/^\d+$/.test(manifest.version)) {
    faults.push(fault("schema", "manifest.version: must be a numeric-version string"));
  }
  if (!Array.isArray(manifest.agents) || manifest.agents.some((h) => typeof h !== "string" || h.trim() === "")) {
    faults.push(fault("schema", "manifest.agents: must be an array of file paths"));
  }
  if (!Array.isArray(manifest.graph?.nodes) || manifest.graph.nodes.some((n) => typeof n !== "string" || n.trim() === "")) {
    faults.push(fault("schema", "manifest.graph.nodes: must be an array of file paths"));
  }
  return faults;
}

export async function loadConfig(manifestPath) {
  const dir = dirname(manifestPath);
  const faults = [];
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (e) {
    return { faults: [fault("manifest.unreadable", `${manifestPath}: ${e.message}`)] };
  }
  faults.push(...manifestFaults(manifest));
  if (faults.length > 0) return { faults };

  const agents = {};
  for (const rel of manifest.agents) {
    try {
      const text = await readFile(join(dir, rel), "utf8");
      const { data, body } = parseFrontmatter(text);
      if (typeof data.id !== "string" || data.id.trim() === "") {
        faults.push(fault("agent.missing-id", `${rel}: frontmatter needs an id`));
        continue;
      }
      if (agents[data.id]) {
        faults.push(fault("agent.duplicate-id", `${rel}: duplicate agent id '${data.id}'`));
        continue;
      }
      agents[data.id] = { ...data, instructions: body.trim() };
    } catch (e) {
      if (e instanceof SyntaxError) {
        faults.push(fault("agent.frontmatter", `${rel}: ${e.message}`));
      } else {
        faults.push(fault("agent.unreadable", `${rel}: ${e.message}`));
      }
    }
  }

  const nodes = [];
  const nodeIds = new Set();
  for (const rel of manifest.graph.nodes) {
    try {
      const text = await readFile(join(dir, rel), "utf8");
      const { data, body } = parseFrontmatter(text);
      if (typeof data.id !== "string" || data.id.trim() === "") {
        faults.push(fault("node.missing-id", `${rel}: frontmatter needs an id`));
        continue;
      }
      if (nodeIds.has(data.id)) {
        faults.push(fault("node.duplicate-id", `${rel}: duplicate node id '${data.id}'`));
        continue;
      }
      nodeIds.add(data.id);
      nodes.push({ ...data, body: body.trim() });
    } catch (e) {
      if (e instanceof SyntaxError) {
        faults.push(fault("node.frontmatter", `${rel}: ${e.message}`));
      } else {
        faults.push(fault("node.unreadable", `${rel}: ${e.message}`));
      }
    }
  }

  if (faults.length > 0) return { faults };

  // links live in the nodes' own files: each node's `out` list becomes
  // the links that start at it, the node's id supplying the `from`
  const links = [];
  for (const node of nodes) {
    for (const link of node.out ?? []) {
      links.push({ from: node.id, ...link });
    }
    delete node.out;
  }
  return {
    faults,
    doc: {
      version: manifest.version,
      agents,
      graph: { nodes, links },
    },
  };
}