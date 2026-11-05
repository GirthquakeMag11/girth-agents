import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createEditor, createContext } from "./static-plugin-harness.mjs";

// The utils plugin has one external dependency: @opencode/plugin. Replace it
// with a local define and drive the source through the shared fake ctx.
const SERVER_TS = fileURLToPath(new URL("../../opencode/plugins/graph-engine-utils/server.ts", import.meta.url));

const FAKE_PLUGIN_DEFINE = `const Plugin = {
  define(definition) {
    if (!definition || typeof definition !== "object") throw new Error("Plugin.define needs a definition object");
    if (typeof definition.id !== "string" || definition.id.length === 0) throw new Error("Plugin.define needs a non-empty id");
    return definition;
  },
};`;

async function loadUtils({ seedAgents = [] } = {}) {
  const dir = await mkdtemp(join(tmpdir(), "utils-plugin-"));
  try {
    const source = await readFile(SERVER_TS, "utf8");
    const transformed = source.replace(
      /import\s*\{\s*Plugin\s*\}\s*from\s*["']@opencode\/plugin["'];?/,
      FAKE_PLUGIN_DEFINE,
    );
    assert.notEqual(transformed, source, "utils server.ts must import @opencode/plugin");
    const modulePath = join(dir, "server.ts");
    await writeFile(modulePath, transformed, "utf8");

    const editor = createEditor([]);
    const context = createContext(editor, { directory: "/work/project", seedAgents });
    const module = await import(pathToFileURL(modulePath).href);
    const definition = module.default;
    assert.equal(definition.id, "opencode.utils");

    return {
      dir,
      definition,
      ctx: context.ctx,
      agentUpdates: context.agentUpdates,
      syntheticCalls: context.syntheticCalls,
      emitEvent: context.emitEvent,
      async setup() {
        return definition.setup(context.ctx);
      },
      async close() {
        await rm(dir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

test("utils: the title and compaction carriers are seeded hidden; no summary", async () => {
  const plugin = await loadUtils();
  try {
    const cleanup = await plugin.setup();
    const byId = new Map(plugin.agentUpdates.map((update) => [update.id, update.draft]));
    assert.deepEqual([...byId.keys()].sort(), ["compaction", "title"]);

    const title = byId.get("title");
    assert.equal(title.name, "Title");
    assert.equal(title.mode, "primary");
    assert.equal(title.hidden, true);
    assert.match(title.system, /Reply with a title for it and nothing else/);
    assert.deepEqual(title.permissions, [{ action: "*", resource: "*", effect: "deny" }]);

    const compaction = byId.get("compaction");
    assert.equal(compaction.name, "Compaction");
    assert.equal(compaction.mode, "primary");
    assert.equal(compaction.hidden, true);
    assert.equal("system" in compaction, false, "the compaction carrier has no system");
    assert.equal("model" in compaction, false, "the compaction carrier has no model");
    assert.deepEqual(compaction.permissions, [], "the compaction carrier pushes no permissions");

    assert.equal(byId.has("summary"), false, "no summary agent is seeded");
    await cleanup();
  } finally {
    await plugin.close();
  }
});

test("utils: an agent switch emits exactly one 'Switched from A to B' synthetic", async () => {
  const plugin = await loadUtils({
    seedAgents: [
      { id: "build", name: "Build" },
      { id: "plan", name: "Plan" },
    ],
  });
  try {
    await plugin.setup();
    await plugin.emitEvent("session.agent.selected", {
      sessionID: "ses_1",
      agent: "plan",
      previous: "build",
    });
    assert.equal(plugin.syntheticCalls.length, 1, "exactly one synthetic message per switch");
    assert.deepEqual(plugin.syntheticCalls[0], {
      sessionID: "ses_1",
      description: "agent switch",
      text: "Switched from Build to Plan",
    });
  } finally {
    await plugin.close();
  }
});

test("utils: a first selection and a no-change event behave", async () => {
  const plugin = await loadUtils({ seedAgents: [{ id: "build", name: "Build" }] });
  try {
    await plugin.setup();
    // No previous: "Switched to <agent>".
    await plugin.emitEvent("session.agent.selected", { sessionID: "ses_2", agent: "build" });
    assert.equal(plugin.syntheticCalls.length, 1);
    assert.equal(plugin.syntheticCalls[0].text, "Switched to Build");

    // Same agent reselected: no message.
    await plugin.emitEvent("session.agent.selected", { sessionID: "ses_2", agent: "build", previous: "build" });
    assert.equal(plugin.syntheticCalls.length, 1, "a no-change selection emits nothing");

    // Unknown agents fall back to the raw id.
    await plugin.emitEvent("session.agent.selected", { sessionID: "ses_2", agent: "ghost", previous: "build" });
    assert.equal(plugin.syntheticCalls.length, 2);
    assert.equal(plugin.syntheticCalls[1].text, "Switched from Build to ghost");
  } finally {
    await plugin.close();
  }
});