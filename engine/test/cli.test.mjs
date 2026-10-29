import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const engine = fileURLToPath(new URL("../engine.mjs", import.meta.url));

function runEngine(args) {
  return new Promise((done) => {
    execFile(process.execPath, [engine, ...args], (error, stdout, stderr) => {
      done({ code: error?.code ?? 0, stdout, stderr });
    });
  });
}

test("cli: --version prints the version and exits 0", async () => {
  const { code, stdout, stderr } = await runEngine(["--version"]);
  assert.equal(code, 0);
  assert.equal(stdout, "girth-agents v1.2.0\n");
  assert.equal(stderr, "");
});

test("cli: --help prints usage and exits 0", async () => {
  const { code, stdout, stderr } = await runEngine(["--help"]);
  assert.equal(code, 0);
  assert.match(stdout, /--version/);
  assert.match(stdout, /--help/);
  assert.match(stdout, /<config\.json>/);
  assert.equal(stderr, "");
});

test("cli: no config path reports an error and exits 2", async () => {
  const { code, stdout, stderr } = await runEngine([]);
  assert.equal(code, 2);
  assert.equal(stdout, "");
  assert.equal(stderr, "engine: no config path given\n");
});
