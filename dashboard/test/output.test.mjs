import test from "node:test";
import assert from "node:assert/strict";
import { detailsOutput, outputPath } from "../src/model.mjs";

test("output path: declared paths resolve under outputRoot", () => {
  assert.equal(outputPath({ graph: { outputRoot: "work" } }, { output: "a.md" }), "work/a.md");
  assert.equal(outputPath({ graph: {} }, { output: "a.md" }), "a.md");
});

test("output path: an omitted output is null", () => {
  assert.equal(outputPath({ graph: { outputRoot: "work" } }, {}), null);
  assert.equal(outputPath({ graph: {} }, { output: null }), null);
});

test("output path: Details uses a no-output marker", () => {
  assert.equal(detailsOutput({ graph: { outputRoot: "work" } }, {}), "—");
  assert.equal(detailsOutput({ graph: { outputRoot: "work" } }, { output: "a.md" }), "work/a.md");
});
