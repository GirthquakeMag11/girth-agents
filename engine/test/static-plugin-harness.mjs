// Test harness for the static graph-engine plugin server part.
//
// server.ts has exactly one external dependency: @opencode/plugin. This
// harness replaces that import with a local Plugin.define, executes the
// source as written, and hands it a fake ctx whose tool editor, hooks,
// permission asserts, session client, and plugin list are all observable.
// The engine modules are shared through a symlink so the plugin resolves the
// real production code it will run against.

import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const FAKE_PLUGIN_DEFINE = `const Plugin = {
  define(definition) {
    if (!definition || typeof definition !== "object") {
      throw new Error("Plugin.define needs a definition object");
    }
    if (typeof definition.id !== "string" || definition.id.length === 0) {
      throw new Error("Plugin.define needs a non-empty id");
    }
    return definition;
  },
};`;

const FAKE_RPC_DEFINE = `const Rpc = {
  define(definition) {
    if (!definition || typeof definition !== "object") {
      throw new Error("Rpc.define needs a definition object");
    }
    return definition;
  },
};`;

const ENGINE_DIR = fileURLToPath(new URL("../../engine", import.meta.url));
const SERVER_TS = fileURLToPath(new URL("../../opencode/plugins/graph-engine/server.ts", import.meta.url));
const RPC_TS = fileURLToPath(new URL("../../opencode/plugins/graph-engine/rpc.ts", import.meta.url));

const BUILDER_DOC = `---
id: builder
model: test/model
agent: build
permissions: [read]
---
Do the node within the dispatched scope.
`;

export function graphConfig(nodes = []) {
  return {
    version: "5",
    agents: ["agents/builder.md"],
    graph: {
      maxSteps: 10,
      nodes,
    },
  };
}

export function terminalGraph() {
  return graphConfig([{ id: "a", agent: "builder", objective: "A.", handoff: { mode: "terminal" } }]);
}

export function labelledGraph() {
  return graphConfig([
    {
      id: "review",
      agent: "builder",
      objective: "Review.",
      maxVisits: 3,
      handoff: {
        mode: "conditional",
        labels: [
          { label: "pass", to: "done", description: "finish" },
          { label: "fail", to: "review", description: "rework" },
        ],
      },
    },
    { id: "done", agent: "builder", objective: "Finish.", handoff: { mode: "terminal" } },
  ]);
}

function toolName(tool) {
  const name = tool?.name ?? tool?.id;
  if (typeof name !== "string" || name.length === 0) throw new Error("tool definition needs a name");
  return name;
}

export function createEditor(seedTools = []) {
  const tools = new Map();
  for (const tool of seedTools) tools.set(toolName(tool), tool);
  return {
    tools,
    add(tool) {
      tools.set(toolName(tool), tool);
      return tool;
    },
    list() {
      return [...tools.values()];
    },
    get(name) {
      return tools.get(name);
    },
  };
}

export function createContext(editor, { directory = "/work/project", options = {}, onPrompt = null, locations = {} } = {}) {
  const hooks = new Map();
  const syntheticCalls = [];
  const permissionCalls = [];
  const sessionCreates = [];
  const graphSessions = new Map();
  const rpcRegistrations = [];
  let nextSession = 0;
  let transformCalls = 0;

  const emptyTokens = () => ({ input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } });

  const ctx = {
    options,
    tool: {
      async transform(callback) {
        transformCalls += 1;
        await callback(editor);
        return { dispose: async () => {} };
      },
      async list() {
        return editor.list().map((tool) => ({ ...tool, execute: async (...args) => tool.execute(...args) }));
      },
    },
    session: {
      hook(name, callback) {
        const list = hooks.get(name) ?? [];
        list.push(callback);
        hooks.set(name, list);
        return async () => {
          hooks.set(name, (hooks.get(name) ?? []).filter((entry) => entry !== callback));
        };
      },
      async synthetic(payload) {
        syntheticCalls.push(payload);
      },
      async create(input) {
        const id = `s${++nextSession}`;
        const session = {
          id,
          ...input,
          node: String(input?.title ?? "").split("/").at(-1) ?? null,
          location: { directory: input?.location?.directory ?? directory },
          outcome: null,
          cost: 0,
          tokens: emptyTokens(),
          messages: [],
        };
        graphSessions.set(id, session);
        sessionCreates.push(input);
        return session;
      },
      async get({ sessionID }) {
        const tracked = graphSessions.get(sessionID);
        if (tracked) return tracked;
        return { id: sessionID, location: { directory: locations[sessionID] ?? directory } };
      },
      async prompt({ sessionID, text }) {
        const session = graphSessions.get(sessionID);
        if (session) {
          if (onPrompt) await onPrompt({ session, sessionID, text });
          session.outcome = "succeeded";
        }
        return {};
      },
      async context({ sessionID }) {
        const session = graphSessions.get(sessionID);
        return session ? session.messages : [];
      },
      async wait() {},
      async interrupt() {
        return { interrupted: true };
      },
      async remove({ sessionID }) {
        graphSessions.delete(sessionID);
      },
    },
    permission: {
      async assert(request) {
        permissionCalls.push(request);
      },
    },
    plugin: {
      async list() {
        return [];
      },
    },
    rpc: {
      async register(definition, implementation) {
        rpcRegistrations.push({ definition, implementation });
        return { dispose: async () => {}, events: { emit: async () => {} } };
      },
    },
  };

  return {
    ctx,
    hooks,
    syntheticCalls,
    permissionCalls,
    sessionCreates,
    rpcRegistrations,
    get transformCalls() {
      return transformCalls;
    },
    lastHook(name) {
      return hooks.get(name)?.at(-1) ?? null;
    },
  };
}

export async function loadStaticPlugin({
  graph = terminalGraph(),
  directory = "/work/project",
  seedTools = [],
  options = {},
  resetEngine = true,
  agentDocs = {},
  onPrompt = null,
  locations = {},
} = {}) {
  if (resetEngine) delete globalThis[Symbol.for("graph-engine.runtime")];
  const dir = await mkdtemp(join(tmpdir(), "static-plugin-"));
  try {
    const graphDir = join(dir, "graph");
    await mkdir(join(graphDir, "agents"), { recursive: true });
    await writeFile(join(graphDir, "config.json"), JSON.stringify(graph, null, 2), "utf8");
    const docs = { "builder.md": BUILDER_DOC, ...agentDocs };
    for (const rel of graph.agents ?? ["agents/builder.md"]) {
      const name = rel.split("/").at(-1);
      const content = docs[name];
      if (typeof content !== "string") throw new Error(`no agent doc for ${rel}`);
      await mkdir(join(graphDir, rel.split("/").slice(0, -1).join("/")), { recursive: true });
      await writeFile(join(graphDir, rel), content, "utf8");
    }
    await symlink(ENGINE_DIR, join(dir, "engine"), "dir");

    const rpcSource = await readFile(RPC_TS, "utf8");
    const rpcTransformed = rpcSource.replace(
      /import\s*\{\s*Rpc\s*\}\s*from\s*["']@opencode\/plugin\/rpc["'];?/,
      FAKE_RPC_DEFINE,
    );
    if (rpcTransformed === rpcSource) throw new Error(`rpc.ts does not import @opencode/plugin/rpc: ${RPC_TS}`);
    await writeFile(join(dir, "rpc.ts"), rpcTransformed, "utf8");

    const source = await readFile(SERVER_TS, "utf8");
    const transformed = source.replace(
      /import\s*\{\s*Plugin\s*\}\s*from\s*["']@opencode\/plugin["'];?/,
      FAKE_PLUGIN_DEFINE,
    );
    if (transformed === source) throw new Error(`server.ts does not import @opencode/plugin: ${SERVER_TS}`);
    const modulePath = join(dir, "server.ts");
    await writeFile(modulePath, transformed, "utf8");

    const editor = createEditor(seedTools);
    const context = createContext(editor, { directory, onPrompt, locations });
    context.ctx.options = { ...options, graphConfig: join(graphDir, "config.json") };

    const module = await import(pathToFileURL(modulePath).href);
    const definition = module.default;
    if (definition?.id !== "graph-engine") throw new Error(`server.ts did not define graph-engine: ${SERVER_TS}`);

    return {
      dir,
      graphDir,
      enginePath: ENGINE_DIR,
      definition,
      editor,
      ctx: context.ctx,
      hooks: context.hooks,
      syntheticCalls: context.syntheticCalls,
      permissionCalls: context.permissionCalls,
      sessionCreates: context.sessionCreates,
      rpcRegistrations: context.rpcRegistrations,
      get transformCalls() {
        return context.transformCalls;
      },
      lastHook(name) {
        return context.lastHook(name);
      },
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