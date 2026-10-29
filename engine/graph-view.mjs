// Deterministic graph view for the /graph command. It asks the running
// engine for the map; if the engine is not running, it renders the same map
// from the config file and says so. It never invokes the model and never
// prints JSON.

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { loadConfig } from "./config.mjs";
import { renderGraphMap } from "./map.mjs";

const cwd = process.cwd();
const configPath = resolve(process.argv[2] ?? process.env.ENGINE_CONFIG ?? "graph.json");
const pluginPath = join(cwd, ".opencode", "plugins", "engine-handoff", "index.ts");

async function endpoint() {
  let source = "";
  try {
    source = await readFile(pluginPath, "utf8");
  } catch {
    return null;
  }
  const url = /const ENGINE_URL = "([^"]+)"/.exec(source)?.[1];
  const token = /const TOKEN = "([^"]+)"/.exec(source)?.[1];
  if (!url || !token) return null;
  return { url, token };
}

async function fromEngine() {
  const found = await endpoint();
  if (!found) return null;
  try {
    const res = await fetch(`${found.url}/tool/graph-map`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-engine-token": found.token },
      body: "{}",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.ok || typeof json.mermaid !== "string") return null;
    return json;
  } catch {
    return null;
  }
}

function print(map, state) {
  const sections = [
    "```mermaid",
    map.mermaid,
    "```",
    "",
  ];
  if (map.workflowTable) sections.push(map.workflowTable, "");
  sections.push(map.nodeTable, "", map.legend, "", state);
  process.stdout.write(sections.join("\n") + "\n");
}

const live = await fromEngine();
if (live) {
  print(live, live.state ?? "");
} else {
  const loaded = await loadConfig(configPath);
  if (loaded.faults.length > 0) {
    for (const fault of loaded.faults) process.stderr.write(`[${fault.code}] ${fault.message}\n`);
    process.exitCode = 1;
  } else {
    print(renderGraphMap(loaded.doc.graph, { runtime: null }), "Engine not running.");
  }
}
