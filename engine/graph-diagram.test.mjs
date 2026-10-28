import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadConfig } from "./config-loader.mjs";
import { generateDiagram, extractDiagram } from "./graph-diagram.mjs";

const CONFIG_PATH = new URL("./config.json", import.meta.url).pathname;
const README_PATH = new URL("./README.md", import.meta.url).pathname;

test("the README's graph illustration is generated from the live config — no drift", async () => {
  const loaded = await loadConfig(CONFIG_PATH);
  assert.deepEqual(loaded.faults, []);
  const generated = generateDiagram(loaded.doc);
  const readme = await readFile(README_PATH, "utf8");
  const inReadme = extractDiagram(readme);
  assert.ok(inReadme !== null, "the README must carry a ```mermaid diagram block");
  assert.equal(
    inReadme,
    generated,
    "the illustration drifted from the configured graph — regenerate it with node -e \"import('./engine/graph-diagram.mjs').then(async m => { const l = await (await import('./engine/config-loader.mjs')).loadConfig('engine/config.json'); console.log(m.generateDiagram(l.doc)); })\"",
  );
});