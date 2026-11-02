import test from "node:test";
import assert from "node:assert/strict";
import { loadStaticPlugin, terminalGraph, labelledGraph } from "./static-plugin-harness.mjs";

const CONTROL_TOOLS = new Set(["dispatch", "dispatch_status", "dispatch_cancel", "reload", "graph_info", "graph_map"]);

function toolByName(editor, name) {
  return editor.get(name) ?? null;
}

function handoffTool(editor, name) {
  const tool = toolByName(editor, name);
  assert.ok(tool, `handoff tool '${name}' is missing`);
  assert.deepEqual(Object.keys(tool.input.properties), ["message"]);
  assert.deepEqual(tool.input.required, ["message"]);
  assert.equal(tool.input.additionalProperties, false);
  assert.equal(tool.options.permission, "handoff");
  assert.equal(tool.options.codemode, false);
  return tool;
}

test("static plugin: one handoff tool per declared label with a { message } input", async () => {
  const plugin = await loadStaticPlugin({ graph: labelledGraph() });
  try {
    await plugin.setup();
    const pass = handoffTool(plugin.editor, "pass");
    const fail = handoffTool(plugin.editor, "fail");
    assert.match(pass.description, /hand off/);
    assert.match(fail.description, /hand off/);
  } finally {
    await plugin.close();
  }
});

test("static plugin: the control tools are registered with reserved permissions", async () => {
  const plugin = await loadStaticPlugin({ graph: terminalGraph() });
  try {
    await plugin.setup();
    for (const name of CONTROL_TOOLS) {
      const tool = toolByName(plugin.editor, name);
      assert.ok(tool, `control tool '${name}' is missing`);
      assert.equal(tool.options.permission, name);
    }
  } finally {
    await plugin.close();
  }
});

test("static plugin: no generic handoff tool and no dispatch_wait tool", async () => {
  const plugin = await loadStaticPlugin({ graph: labelledGraph() });
  try {
    await plugin.setup();
    assert.equal(toolByName(plugin.editor, "handoff"), null);
    assert.equal(toolByName(plugin.editor, "dispatch_wait"), null);
  } finally {
    await plugin.close();
  }
});

test("static plugin: a foreground dispatch runs the engine directly, not fetch", async () => {
  const plugin = await loadStaticPlugin({ graph: terminalGraph(), directory: "/work/project" });
  const previousFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("the plugin must not fetch");
  };
  try {
    await plugin.setup();
    const dispatch = toolByName(plugin.editor, "dispatch");
    const result = await dispatch.execute(
      { node: "a", prompt: "p", background: false },
      { sessionID: "ses_dispatch", agent: "build", messageID: "m1", id: "t1" },
    );
    assert.match(result.content, /d-1/);
    assert.equal(plugin.permissionCalls.length, 1);
    assert.equal(plugin.permissionCalls[0].action, "dispatch");
    assert.equal(plugin.sessionCreates.length, 1);
    assert.equal(plugin.sessionCreates[0].location.directory, "/work/project");
  } finally {
    globalThis.fetch = previousFetch;
    await plugin.close();
  }
});

test("static plugin: a handoff tool calls the engine and surfaces its gate", async () => {
  const plugin = await loadStaticPlugin({ graph: labelledGraph() });
  try {
    await plugin.setup();
    const pass = toolByName(plugin.editor, "pass");
    await assert.rejects(
      () => pass.execute({ message: "done" }, { sessionID: "ses_x", agent: "build", messageID: "m1", id: "t1" }),
      /no active dispatch/,
    );
    assert.equal(plugin.permissionCalls[0].action, "handoff");
  } finally {
    await plugin.close();
  }
});

test("static plugin: the context hook removes undeclared labels", async () => {
  const plugin = await loadStaticPlugin({ graph: labelledGraph() });
  try {
    await plugin.setup();
    const hook = plugin.lastHook("context");
    assert.ok(hook, "the context hook is registered");
    const event = { sessionID: "ses_unrelated", tools: { pass: true, fail: true, other: true } };
    await hook(event);
    assert.equal(event.tools.pass, undefined);
    assert.equal(event.tools.fail, undefined);
    assert.equal(event.tools.other, true, "unrelated tools are untouched");
  } finally {
    await plugin.close();
  }
});

test("static plugin: a colliding label is not generated", async () => {
  const plugin = await loadStaticPlugin({
    graph: labelledGraph(),
    seedTools: [{ name: "pass", description: "existing", input: {}, execute: async () => {} }],
  });
  try {
    await plugin.setup();
    assert.equal(plugin.editor.get("pass").description, "existing", "the existing tool wins over a colliding label");
    const fail = handoffTool(plugin.editor, "fail");
    assert.equal(fail.name, "fail");
  } finally {
    await plugin.close();
  }
});

test("static plugin: the dashboard RPC exposes snapshot and dispatch status", async () => {
  const plugin = await loadStaticPlugin({ graph: terminalGraph() });
  try {
    await plugin.setup();
    assert.equal(plugin.rpcRegistrations.length, 1);
    const { definition, implementation } = plugin.rpcRegistrations[0];
    assert.equal(definition.id, "graph-engine");
    assert.ok(implementation.snapshot);
    assert.ok(implementation.dispatchStatus);

    const snapshot = await implementation.snapshot();
    assert.equal(snapshot.ok, true);
    assert.equal(snapshot.config.graph.nodes[0].id, "a");
    assert.equal(snapshot.info.ok, true);
    assert.ok(snapshot.runtime);
    assert.match(snapshot.map.mermaid, /a/);

    await assert.rejects(
      () => implementation.dispatchStatus({ dispatchId: "d-404" }),
      /unknown dispatch/,
    );
  } finally {
    await plugin.close();
  }
});

test("static plugin: one process-global engine is reused across setups", async () => {
  const key = Symbol.for("graph-engine.runtime");
  const first = await loadStaticPlugin({ graph: terminalGraph() });
  try {
    await first.setup();
    const engine = globalThis[key];
    assert.ok(engine, "the first setup creates the engine");
    assert.equal(engine.config.graph.nodes[0].id, "a");

    const second = await loadStaticPlugin({ graph: labelledGraph(), resetEngine: false });
    try {
      await second.setup();
      assert.equal(globalThis[key], engine, "the second setup reuses the same engine");
      assert.equal(engine.config.graph.nodes[0].handoff.mode, "terminal", "the reused engine keeps the first config");
    } finally {
      await second.close();
    }
  } finally {
    delete globalThis[key];
    await first.close();
  }
});

test("static plugin: cleanup disposes registrations but never stops the engine", async () => {
  const key = Symbol.for("graph-engine.runtime");
  const plugin = await loadStaticPlugin({ graph: terminalGraph() });
  try {
    const cleanup = await plugin.setup();
    const engine = globalThis[key];
    assert.ok(engine);
    await cleanup();
    assert.equal(globalThis[key], engine, "cleanup leaves the engine running");
    assert.equal(engine.graphInfo().graph.nodes[0].id, "a");
  } finally {
    delete globalThis[key];
    await plugin.close();
  }
});