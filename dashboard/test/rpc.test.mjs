import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { snapshotToDashboard } from "../src/data.mjs";

const tuiSource = await readFile(new URL("../../opencode/plugins/graph-engine/tui.tsx", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../src/data.mjs", import.meta.url), "utf8");
const rpcSource = await readFile(new URL("../../opencode/plugins/graph-engine/rpc.ts", import.meta.url), "utf8");

// The shape the server's snapshot RPC returns; the dashboard treats it as the
// one and only server contact.
function fakeSnapshot() {
  return {
    ok: true,
    config: {
      version: "6",
      agents: [{ id: "builder", model: "test/model", mounts: ["graph"], tools: ["read"] }],
      graph: {
        maxSteps: 100,
        nodes: [{ id: "implement", agent: "builder", objective: "Implement.", handoff: { mode: "unconditional", to: "review" } }],
      },
    },
    info: { ok: true, name: "Graph Engine", version: "0.5.0", stage: "ALPHA", schemaVersion: "5", valid: true, configPath: "/config/graph/config.json" },
    map: { ok: true, mermaid: "flowchart LR" },
    runtime: {
      paused: false,
      active: { dispatchId: "d-1", node: "implement", state: "running" },
      queue: [],
      lastDefect: null,
      lastEvent: null,
      history: [],
      historyEpoch: "epoch-1",
    },
  };
}

test("rpc: a fake RPC client drives the dashboard through the snapshot only", async () => {
  const client = {
    calls: 0,
    rpc() {
      return {
        snapshot: async () => {
          this.calls += 1;
          return fakeSnapshot();
        },
      };
    },
  };

  const snapshot = await client.rpc().snapshot();
  const dashboard = snapshotToDashboard(snapshot);

  assert.equal(client.calls, 1);
  assert.equal(dashboard.config.graph.nodes[0].id, "implement");
  assert.equal(dashboard.info.configPath, "/config/graph/config.json");
  assert.equal(dashboard.runtime.active.state, "running");
  assert.ok(dashboard.fetchedAt instanceof Date);
});

test("rpc: the contract declares the fields the SDK requires", () => {
  assert.match(rpcSource, /events:\s*\{/, "Rpc.define must declare events; Object.entries(contract.events) is unguarded");
  assert.match(rpcSource, /snapshot:\s*\{\s*\n?\s*input:/, "snapshot must declare an input schema; the SDK validates input unconditionally");
});

test("rpc: the dashboard passes an explicit input object to snapshot", () => {
  assert.match(tuiSource, /\.snapshot\(\{\s*\}\)/, "a no-arg snapshot() sends an absent input no schema accepts");
});

test("rpc: the dashboard never reads a project-local plugin file or fetches", () => {
  for (const source of [tuiSource, dataSource]) {
    assert.doesNotMatch(source, /readFile|node:fs|from "fs"/, "the dashboard must not touch the filesystem");
    assert.doesNotMatch(source, /\bfetch\s*\(/, "the dashboard must not fetch");
    assert.doesNotMatch(source, /engineEndpoint|ENGINE_URL|TOKEN|loopback/, "the dashboard must not parse an engine endpoint");
    assert.doesNotMatch(source, /\.opencode\/plugins|engine-handoff/, "the dashboard must not read a project-local plugin file");
    assert.doesNotMatch(source, /\/tool\//, "the dashboard must not call engine HTTP tools");
  }
});