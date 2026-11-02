import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PROJECT_VERSION } from "../../engine/version.mjs";

test("version: the dashboard package matches the project version", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, PROJECT_VERSION);
});
