import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateConfig } from "../../engine/config.mjs";

const fixtures = [
  ["live-boundary.json", false],
  ["live-boundary-strict.json", true],
];

for (const [file, strict] of fixtures) {
  test(`live fixture: ${file} passes engine validation`, async () => {
    const doc = JSON.parse(await readFile(new URL(`../fixtures/${file}`, import.meta.url), "utf8"));
    assert.deepEqual(validateConfig(doc), []);
    assert.equal(doc.graph.workflows[0].id, "A");
    assert.equal(doc.graph.workflows[0].strict, strict);
    assert.deepEqual(doc.graph.workflows[0].connections, ["B"]);
    assert.equal(doc.graph.nodes.find((node) => node.id === "o").handoff.mode, "terminal");
  });
}
