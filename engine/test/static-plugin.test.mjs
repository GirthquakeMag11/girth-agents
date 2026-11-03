import test from "node:test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
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
    assert.deepEqual(
      plugin.sessionCreates[0].model,
      { providerID: "test", id: "model" },
      "the graph's model string becomes a Model.Ref for ctx.session.create",
    );
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

test("static plugin: the context hook injects the node agent's body as system", async () => {
  const runtimeKey = Symbol.for("graph-engine.runtime");
  const body = "STANDING: build only within the dispatched scope.\n";
  let release;
  const plugin = await loadStaticPlugin({
    graph: terminalGraph(),
    agentDocs: { "builder.md": `---\nmodel: test/model\nmounts: [graph]\ntools: [read]\n---\n${body}` },
    onPrompt: () => new Promise((resolve) => (release = resolve)),
  });
  try {
    await plugin.setup();
    const runtime = globalThis[runtimeKey];
    runtime.dispatch({ node: "a", prompt: "p", sessionID: "ses" }, "/work/project");

    const deadline = Date.now() + 2000;
    while (Date.now() < deadline && runtime.queue.active?.sessionId == null) {
      await new Promise((r) => setTimeout(r, 2));
    }
    const active = runtime.queue.active;
    assert.ok(active?.sessionId, "a node session is active");

    const hook = plugin.lastHook("context");
    const event = { sessionID: active.sessionId, system: [], tools: {} };
    await hook(event);
    assert.deepEqual(event.system, [{ type: "text", text: body.trim() }]);

    release({ outcome: "succeeded" });
    await runtime.wait(active.id, 2000).catch(() => {});
  } finally {
    release?.({ outcome: "succeeded" });
    delete globalThis[runtimeKey];
    await plugin.close();
  }
});

test("static plugin: a graph agent's subagents are checked against the live catalog", async () => {
  const context = { sessionID: "ses", agent: "build", messageID: "m1", id: "t1" };

  const ghostPlugin = await loadStaticPlugin({
    graph: terminalGraph(),
    agentDocs: { "builder.md": "---\nmodel: test/model\nmounts: [graph]\ntools: [read]\nsubagents: [ghost, explore]\n---\nDo the node.\n" },
    seedAgents: [{ id: "explore" }],
  });
  try {
    await ghostPlugin.setup();
    const dispatch = toolByName(ghostPlugin.editor, "dispatch");
    await assert.rejects(
      () => dispatch.execute({ node: "a", prompt: "p", background: false }, context),
      /subagent\.unknown.*builder -> ghost/,
    );
  } finally {
    await ghostPlugin.close();
  }

  const validPlugin = await loadStaticPlugin({
    graph: terminalGraph(),
    agentDocs: { "builder.md": "---\nmodel: test/model\nmounts: [graph]\ntools: [read]\nsubagents: [explore]\n---\nDo the node.\n" },
    seedAgents: [{ id: "explore" }],
  });
  try {
    await validPlugin.setup();
    const result = await toolByName(validPlugin.editor, "dispatch").execute(
      { node: "a", prompt: "p", background: false },
      context,
    );
    assert.match(result.content, /d-\d/);
    assert.deepEqual(validPlugin.sessionCreates[0].permissions.at(-1), {
      action: "subagent",
      resource: "explore",
      effect: "allow",
    });
  } finally {
    await validPlugin.close();
  }
});

test("static plugin: a valid reload re-checks the subagent catalog", async () => {
  const context = { sessionID: "ses", agent: "build", messageID: "m1", id: "t1" };
  const plugin = await loadStaticPlugin({ graph: terminalGraph() });
  try {
    await plugin.setup();
    const first = await toolByName(plugin.editor, "dispatch").execute(
      { node: "a", prompt: "p", background: false },
      context,
    );
    assert.match(first.content, /d-\d/, "a clean catalog dispatches");

    await writeFile(
      join(plugin.graphDir, "agents", "builder.md"),
      "---\nmodel: test/model\nmounts: [graph]\ntools: [read]\nsubagents: [ghost]\n---\nDo the node.\n",
      "utf8",
    );
    const reloadResult = JSON.parse((await plugin.editor.get("reload").execute({}, context)).content);
    assert.equal(reloadResult.valid, true);

    await assert.rejects(
      () => toolByName(plugin.editor, "dispatch").execute({ node: "a", prompt: "p", background: false }, context),
      /subagent\.unknown.*builder -> ghost/,
      "the reload re-reported the missing subagent",
    );
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

test("static plugin: a primary mount is published, a graph-only mount is not", async () => {
  const liaisonDoc = `---
model: test/model
mounts: [graph, primary]
description: The user liaison.
---
Your standing role: help the user run the build pipeline.
`;
  const plugin = await loadStaticPlugin({ graph: terminalGraph(), agentDocs: { "liaison.md": liaisonDoc } });
  try {
    await plugin.setup();
    assert.equal(plugin.agentUpdates.length, 1, "exactly the primary mount is published");
    const update = plugin.agentUpdates[0];
    assert.equal(update.id, "liaison");
    assert.equal(update.draft.mode, "primary");
    assert.deepEqual(update.draft.model, { providerID: "test", id: "model" }, "model is a Model.Ref object");
    assert.equal(update.draft.description, "The user liaison.");
    assert.match(update.draft.system, /Your standing role/);
    assert.deepEqual(update.draft.permissions, []);
    assert.ok(plugin.skillAdds.length === 0, "no skills follow a mount without references");
  } finally {
    await plugin.close();
  }
});

test("static plugin: a referenced skill follows a subagent mount", async () => {
  const reviewerDoc = `---
model: test/model
mounts: [subagent]
skills: [test-first]
---
Review the change.
`;
  const skillDoc = `---
name: Test-first
description: TDD discipline.
---
Write the failing test first, make it pass, then refactor.
`;
  const plugin = await loadStaticPlugin({
    graph: terminalGraph(),
    agentDocs: { "reviewer.md": reviewerDoc },
    skillFiles: { "test-first.md": skillDoc },
  });
  try {
    await plugin.setup();
    assert.equal(plugin.skillAdds.length, 1);
    const skill = plugin.skillAdds[0];
    assert.equal(skill.id, "test-first");
    assert.equal(skill.name, "Test-first");
    assert.equal(skill.description, "TDD discipline.");
    assert.match(skill.content, /failing test/);
    assert.match(skill.path, /skills\/test-first\.md$/, "a skill carries its absolute source path");
    assert.equal(plugin.agentUpdates[0].id, "reviewer");
    assert.equal(plugin.agentUpdates[0].draft.mode, "subagent");
  } finally {
    await plugin.close();
  }
});

test("static plugin: a valid reload re-publishes mounts; an invalid one does not", async () => {
  const plugin = await loadStaticPlugin({ graph: terminalGraph() });
  const context = { sessionID: "ses_reload", agent: "build", messageID: "m1", id: "t1" };
  try {
    await plugin.setup();
    assert.equal(plugin.agentUpdates.length, 0, "no mounts to publish initially");

    const liaisonDoc = `---
model: test/model
mounts: [primary]
description: The user liaison.
---
Help the user run the pipeline.
`;
    await writeFile(join(plugin.graphDir, "agents", "liaison.md"), liaisonDoc, "utf8");
    const valid = JSON.parse((await plugin.editor.get("reload").execute({}, context)).content);
    assert.equal(valid.valid, true);
    assert.equal(plugin.agentUpdates.length, 1);
    assert.equal(plugin.agentUpdates[0].id, "liaison");
    assert.equal(plugin.agentUpdates[0].draft.mode, "primary");

    // A broken config keeps the old registrations and re-publishes nothing.
    await writeFile(join(plugin.graphDir, "config.json"), "{ not json", "utf8");
    const before = plugin.agentUpdates.length;
    const invalid = JSON.parse((await plugin.editor.get("reload").execute({}, context)).content);
    assert.equal(invalid.valid, false);
    assert.equal(plugin.agentUpdates.length, before, "an invalid reload does not re-publish");
  } finally {
    await plugin.close();
  }
});

test("static plugin: cleanup disposes registrations but never stops the engine", async () => {
  const key = Symbol.for("graph-engine.runtime");
  const plugin = await loadStaticPlugin({ graph: terminalGraph() });
  try {
    const cleanup = await plugin.setup();
    const engine = globalThis[key];
    assert.ok(engine);
    const mountTokens = [...plugin.mountDisposals];
    assert.ok(mountTokens.length >= 2, "the agent and skill transforms registered");
    await cleanup();
    assert.equal(globalThis[key], engine, "cleanup leaves the engine running");
    assert.equal(engine.graphInfo().graph.nodes[0].id, "a");
    assert.ok(mountTokens.every((token) => token.disposed), "cleanup disposes the mount registrations");
  } finally {
    delete globalThis[key];
    await plugin.close();
  }
});