import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateConfig } from "../../engine/config.mjs";

const fixtures = [
  ["live-boundary.json", false],
  ["live-boundary-strict.json", true],
];

for (const [file, strict] of fixtures) {
  test(`live fixture: ${file} validates from normalized agent objects`, async () => {
    const doc = JSON.parse(await readFile(fileURLToPath(new URL(`../fixtures/${file}`, import.meta.url)), "utf8"));
    assert.deepEqual(validateConfig(doc), []);
    assert.equal(doc.graph.workflows[0].id, "A");
    assert.equal(doc.graph.workflows[0].strict, strict);
    assert.deepEqual(doc.graph.workflows[0].connections, ["B"]);
    assert.equal(doc.graph.nodes.find((node) => node.id === "o").handoff.mode, "terminal");
    assert.equal(doc.agents[0].id, "builder");
    assert.match(doc.agents[0].prompt, /Execute the node objective/);
    assert.equal(Object.hasOwn(doc.graph, "outputRoot"), false);
    assert.ok(doc.graph.nodes.every((node) => !Object.hasOwn(node, "output")));
    assert.ok(doc.agents.every((agent) => !/declared output/i.test(agent.prompt ?? "")));
  });
}