import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadConfig, SCHEMA_VERSION } from "../../engine/config.mjs";

const fixtures = [
  ["live-boundary.json", false],
  ["live-boundary-strict.json", true],
];

for (const [file, strict] of fixtures) {
  test(`live fixture: ${file} loads from agent documents`, async () => {
    const loaded = await loadConfig(fileURLToPath(new URL(`../fixtures/${file}`, import.meta.url)));
    assert.deepEqual(loaded.faults, []);
    assert.equal(loaded.doc.version, SCHEMA_VERSION);
    assert.equal(loaded.doc.graph.workflows[0].id, "A");
    assert.equal(loaded.doc.graph.workflows[0].strict, strict);
    assert.deepEqual(loaded.doc.graph.workflows[0].connections, ["B"]);
    assert.equal(loaded.doc.graph.nodes.find((node) => node.id === "o").handoff.mode, "terminal");
    assert.equal(loaded.doc.agents[0].id, "builder");
    assert.match(loaded.doc.agents[0].prompt, /Execute the node objective/);
  });
}
