// Test harness for the generated OpenCode plugin.
//
// installPlugin writes a location-scoped plugin whose only external dependency
// is @opencode/plugin. This harness replaces that import with a local
// Plugin.define, imports the generated module, and gives it a fake ctx whose
// tool editor, hooks, synthetic messages, permissions, and fetch are all
// observable. Production code is never imported as a module here; the test
// reads the exact source installPlugin writes.

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { installPlugin } from "../plugin.mjs";

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

function toolName(tool) {
  const name = tool?.name ?? tool?.id;
  if (typeof name !== "string" || name.length === 0) {
    throw new Error("tool definition needs a name");
  }
  return name;
}

export function createEditor(seedTools = []) {
  const tools = new Map();
  const additions = [];
  const duplicateAdds = [];
  const seed = Array.isArray(seedTools) ? seedTools : Object.values(seedTools);
  for (const tool of seed) {
    tools.set(toolName(tool), tool);
  }
  return {
    tools,
    additions,
    duplicateAdds,
    add(tool) {
      const name = toolName(tool);
      if (tools.has(name)) duplicateAdds.push(name);
      additions.push(name);
      tools.set(name, tool);
      return tool;
    },
    list() {
      return [...tools.values()];
    },
    get(name) {
      return tools.get(name);
    },
    has(name) {
      return tools.has(name);
    },
    remove(name) {
      return tools.delete(name);
    },
  };
}

function createContext(editor) {
  const hooks = new Map();
  const syntheticCalls = [];
  const permissionCalls = [];
  let transformCalls = 0;
  let syntheticImpl = async () => {};

  const ctx = {
    tool: {
      async transform(callback) {
        transformCalls += 1;
        return callback(editor);
      },
      async list() {
        return editor.list().map((tool) => ({
          ...tool,
          execute: async (...args) => tool.execute(...args),
        }));
      },
    },
    session: {
      hook(name, callback) {
        const list = hooks.get(name) ?? [];
        list.push(callback);
        hooks.set(name, list);
        return () => {
          const current = hooks.get(name) ?? [];
          hooks.set(name, current.filter((entry) => entry !== callback));
        };
      },
      async synthetic(payload) {
        syntheticCalls.push(payload);
        return syntheticImpl(payload);
      },
    },
    permission: {
      async assert(request) {
        permissionCalls.push(request);
      },
    },
  };

  return {
    ctx,
    hooks,
    syntheticCalls,
    permissionCalls,
    get transformCalls() {
      return transformCalls;
    },
    setSynthetic(impl) {
      syntheticImpl = impl;
    },
    lastHook(name) {
      return hooks.get(name)?.at(-1);
    },
  };
}

function jsonResponse(value, status = 200) {
  const body = value === undefined ? "" : typeof value === "string" ? value : JSON.stringify(value);
  return new Response(body, {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function createFetchMock(routes = {}) {
  const routeMap = new Map(Object.entries(routes));
  const requests = [];

  const mock = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url;
    if (typeof url !== "string") throw new Error("fetch mock needs a URL");
    const parsed = new URL(url);
    const rawBody = typeof init.body === "string" ? init.body : null;
    let body = null;
    if (rawBody && rawBody.length > 0) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = rawBody;
      }
    }
    const request = {
      url,
      path: parsed.pathname,
      method: init.method ?? "GET",
      headers: init.headers ?? {},
      body,
      rawBody,
      init,
    };
    requests.push(request);

    const route =
      routeMap.get(`${request.method} ${request.path}`) ?? routeMap.get(request.path) ?? routeMap.get("*");
    if (route === undefined) return jsonResponse({ ok: true });

    let outcome = typeof route === "function" ? await route(request) : route;
    if (outcome instanceof Response) return outcome;
    if (outcome === undefined) return jsonResponse({ ok: true });
    if (outcome && typeof outcome === "object" && !Array.isArray(outcome) && "body" in outcome) {
      return jsonResponse(outcome.body, outcome.status ?? 200);
    }
    return jsonResponse(outcome);
  };

  mock.requests = requests;
  mock.routes = routeMap;
  mock.setRoute = (path, handler) => {
    routeMap.set(path, handler);
    return mock;
  };
  mock.deleteRoute = (path) => {
    routeMap.delete(path);
    return mock;
  };
  mock.requestsFor = (path, method = null) =>
    requests.filter((request) => request.path === path && (method === null || request.method === method));
  mock.lastRequest = (path, method = null) => mock.requestsFor(path, method).at(-1) ?? null;
  return mock;
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export async function tick(ms = 0) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitFor(predicate, { timeoutMs = 2000, intervalMs = 5, label = "condition" } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await tick(intervalMs);
  }
  throw new Error(`timed out waiting for ${label}`);
}

// Load the source installPlugin actually writes. The only rewrite is the
// external plugin import; everything after it is executed as written.
export async function loadPlugin({
  labels = [],
  seedTools = [],
  routes = {},
  url = "http://127.0.0.1:4242",
  token = "test-token",
} = {}) {
  const dir = await mkdtemp(join(tmpdir(), "engine-plugin-harness-"));
  let previousFetch = null;
  let fetchMock = null;
  try {
    const sourcePath = await installPlugin({ cwd: dir, url, token, labels });
    const source = await readFile(sourcePath, "utf8");
    const transformed = source.replace(
      /import\s*\{\s*Plugin\s*\}\s*from\s*["']@opencode\/plugin["'];?/,
      FAKE_PLUGIN_DEFINE,
    );
    if (transformed === source) {
      throw new Error(`generated plugin does not import @opencode/plugin: ${sourcePath}`);
    }
    const modulePath = join(dir, "engine-handoff.harness.mjs");
    await writeFile(modulePath, transformed, "utf8");

    const editor = createEditor(seedTools);
    const context = createContext(editor);
    fetchMock = createFetchMock(routes);
    previousFetch = globalThis.fetch;
    globalThis.fetch = fetchMock;

    const module = await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
    const definition = module.default;
    if (definition?.id !== "engine-handoff") {
      throw new Error(`generated plugin did not define engine-handoff: ${sourcePath}`);
    }

    return {
      dir,
      source,
      sourcePath,
      modulePath,
      definition,
      editor,
      ctx: context.ctx,
      hooks: context.hooks,
      syntheticCalls: context.syntheticCalls,
      permissionCalls: context.permissionCalls,
      get transformCalls() {
        return context.transformCalls;
      },
      fetchMock,
      setSynthetic(impl) {
        context.setSynthetic(impl);
      },
      lastHook(name) {
        return context.lastHook(name);
      },
      setRoute(path, handler) {
        fetchMock.setRoute(path, handler);
        return fetchMock;
      },
      requestsFor(path, method = null) {
        return fetchMock.requestsFor(path, method);
      },
      lastRequest(path, method = null) {
        return fetchMock.lastRequest(path, method);
      },
      async setup() {
        return definition.setup(context.ctx);
      },
      async close() {
        if (globalThis.fetch === fetchMock) globalThis.fetch = previousFetch;
        await rm(dir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    if (fetchMock && globalThis.fetch === fetchMock) globalThis.fetch = previousFetch;
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

