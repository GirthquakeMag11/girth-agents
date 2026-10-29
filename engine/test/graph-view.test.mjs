import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const cli = fileURLToPath(new URL("../graph-view.mjs", import.meta.url));
const example = fileURLToPath(new URL("../example-graph.json", import.meta.url));

test("graph-view: falls back to the config and says the engine is not running", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-view-static-"));
  try {
    const { stdout } = await run(process.execPath, [cli, example], { cwd: dir });
    assert.match(stdout, /```mermaid\nflowchart LR/);
    assert.match(stdout, /\| Workflow \| Entry \| Exit \| Nodes \|/);
    assert.match(stdout, /\| Node \| Helper \| Objective \| Output \| Session \| Handoff \| Max visits \|/);
    assert.match(stdout, /↻ resume = same session on revisit/);
    assert.match(stdout, /Engine not running\./);
    assert.doesNotMatch(stdout, /"ok":true/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("graph-view: uses the running engine's map when the plugin endpoint answers", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-view-live-"));
  let server;
  try {
    server = http.createServer((req, res) => {
      assert.equal(req.url, "/tool/graph-map");
      assert.equal(req.headers["x-engine-token"], "test-token");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({
        ok: true,
        mermaid: "flowchart LR\n  remote[\"remote-map\"]",
        workflowTable: "| Workflow | Entry | Exit | Nodes |\n|---|---|---|---|\n| remote | a | b | a, b |",
        nodeTable: "| Node | Helper | Objective | Output | Session | Handoff | Max visits |\n|---|---|---|---|---|---|---|\n| a | h | o | work/a.md | fresh | terminal | — |",
        legend: "remote legend",
        state: "Active: d-1 at a.",
      }));
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    const plugin = join(dir, ".opencode", "plugins", "engine-handoff", "index.ts");
    await mkdir(dirname(plugin), { recursive: true });
    await writeFile(plugin, `const ENGINE_URL = "http://127.0.0.1:${port}";\nconst TOKEN = "test-token";\n`, "utf8");

    const { stdout } = await run(process.execPath, [cli, example], { cwd: dir });
    assert.match(stdout, /remote-map/);
    assert.match(stdout, /Active: d-1 at a\./);
    assert.doesNotMatch(stdout, /Engine not running/);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
