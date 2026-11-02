import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("version: the graph-engine plugin package exposes the server, tui, and rpc parts", async () => {
  const pkg = JSON.parse(
    await readFile(new URL("../../opencode/plugins/graph-engine/package.json", import.meta.url), "utf8"),
  );
  assert.equal(pkg.name, "graph-engine");
  assert.equal(pkg.type, "module");
  assert.deepEqual(Object.keys(pkg.exports).sort(), [".", "./rpc", "./tui"]);
  assert.equal(pkg.exports["."], "./server.ts");
  assert.equal(pkg.exports["./tui"], "./tui.tsx");
  assert.equal(pkg.exports["./rpc"], "./rpc.ts");
});