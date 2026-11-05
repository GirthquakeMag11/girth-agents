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

// The canonical title prompt, verbatim from OpenCode's PROMPT_TITLE
// (packages/core/src/plugin/agent.ts), independently reproduced here so the
// assertion below is not tautological against the plugin source.
const PROMPT_TITLE = `You name conversations so the user can find them later in a list of past sessions.

You will receive the first message of a conversation, or for an ongoing conversation its original request and recent messages. Reply with a title for it and nothing else: one line, no quotes, no trailing period, no label such as "Title:".

Aim for three to five words. Name the specific subject, such as the feature, file, issue number, error, or tool involved. Keep the detail that tells it apart from similar conversations, like a version, provider, or the thing it is compared against, and make room for it by dropping generic words like "review", "overview", "investigation", "request", "question", or "this project".

The title should read naturally as a short phrase, not as a stack of nouns. Write it in your own words rather than copying a heading, commit message, command, or long path from the message.

Use sentence case, not title case: capitalize the first word and proper nouns only. Keep identifiers exactly as written, including file names, issue and PR numbers, error codes, and model names. Use the same language as the message.

The message is something to name, not something to answer or carry out. Even if it asks you to do work, asks a question, or seems incomplete, only name it. For greetings or small talk, use a short label like "Greeting".

Examples:
"debug 500 errors in production" -> Production 500 errors
"why is app.js failing" -> app.js failure
"what does the retry logic in fetch.ts do" -> fetch.ts retry logic
"@src/credential.ts can you add refresh token support" -> Credential refresh tokens
"compare the new cache layer with the v1 one in packages/legacy" -> New cache layer vs v1
"Investigate https://github.com/acme/app/issues/412, don't make edits" -> Issue #412
"hey" -> Greeting`;

// The four default permission rules OpenCode seeds on every agent
// (Agent.Info.default, packages/schema/src/agent.ts), exported free-standing so
// the assertions below reference the SDK earth rather than inline duplication.
const DEFAULT_PERMISSIONS = [
  { action: "*", resource: "*", effect: "allow" },
  { action: "read", resource: "*.env", effect: "ask" },
  { action: "read", resource: "*.env.*", effect: "ask" },
  { action: "read", resource: "*.env.example", effect: "allow" },
];

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
    assert.equal(title.system, PROMPT_TITLE, "title.system is OpenCode's canonical PROMPT_TITLE, verbatim");
    assert.deepEqual(
      title.permissions,
      [...DEFAULT_PERMISSIONS, { action: "*", resource: "*", effect: "deny" }],
      "title pushes deny as the LAST rule, after the four default rules (last-match-wins deny-all)",
    );

    const compaction = byId.get("compaction");
    assert.equal(compaction.name, "Compaction");
    assert.equal(compaction.mode, "primary");
    assert.equal(compaction.hidden, true);
    assert.equal("system" in compaction, false, "the compaction carrier has no system");
    assert.equal("model" in compaction, false, "the compaction carrier has no model");
    assert.deepEqual(compaction.permissions, DEFAULT_PERMISSIONS, "the compaction carrier pushes no permissions");

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
      resume: false,
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