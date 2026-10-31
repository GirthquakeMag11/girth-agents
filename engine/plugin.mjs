// The one tool provider. OpenCode 2.2.0 has no per-session tool definition:
// a location-scoped V2 plugin is the smallest reliable way to give a session
// the handoff lever and the interactive control tools. The plugin is written
// into the workspace by the engine, with the engine's loopback URL and token.

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function renderPlugin({ url, token }) {
  return `import { Plugin } from "@opencode/plugin";

const ENGINE_URL = ${JSON.stringify(url)};
const TOKEN = ${JSON.stringify(token)};

// One tool surface for both sides:
// - handoff: the helper's lever inside a node.
// - dispatch/dispatch_wait/dispatch_status/dispatch_cancel/reload/graph_info/graph_map:
//   the interactive agent's control surface. Helper sessions are created with
//   permissions that hide the control tools; the interactive session sees them.
export default Plugin.define({
  id: "engine-handoff",
  async setup(ctx) {
    const call = async (path, body, context, action) => {
      await ctx.permission.assert({
        sessionID: context.sessionID,
        agent: context.agent,
        action,
        resources: ["*"],
        save: ["*"],
        source: { type: "tool", messageID: context.messageID, id: context.toolCallID ?? context.id },
      });
      const res = await fetch(ENGINE_URL + path, {
        method: "POST",
        headers: { "content-type": "application/json", "x-engine-token": TOKEN },
        body: JSON.stringify(body),
        signal: context.signal,
      });
      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch (e) {
        json = null;
      }
      if (!res.ok) {
        throw new Error((json && json.error) || ("engine returned " + res.status));
      }
      return json ?? {};
    };

    await ctx.tool.transform((editor) => {
      editor.add({
        name: "handoff",
        description:
          "Finish this node and hand off to exactly one next node. Call exactly once, after the required output file exists. The label must be one declared in your brief.",
        input: {
          type: "object",
          properties: { label: { type: "string", description: "The declared handoff label." } },
          required: ["label"],
          additionalProperties: false,
        },
        options: { codemode: false, permission: "handoff" },
        async execute(input, context) {
          await call("/handoff", {
            label: input.label,
            sessionID: context.sessionID,
            callID: context.toolCallID ?? context.id,
            messageID: context.messageID,
            agent: context.agent,
          }, context, "handoff");
          return { content: "handoff accepted: " + input.label };
        },
      });

      editor.add({
        name: "dispatch",
        description:
          "Dispatch a prompt into the graph at exactly one of a node or a workflow. A workflow dispatch starts at its entry and engages the workflow boundary; a node dispatch engages no workflow. wait=true blocks for the result; wait=false returns a dispatch id immediately.",
        input: {
          type: "object",
          properties: {
            node: { type: "string", description: "Start at this node. Do not combine with workflow." },
            workflow: { type: "string", description: "Start this workflow at its entry. Do not combine with node." },
            prompt: { type: "string" },
            wait: { type: "boolean" },
            timeoutMs: { type: "number" },
          },
          required: ["prompt"],
          additionalProperties: false,
        },
        options: { codemode: false, permission: "dispatch" },
        async execute(input, context) {
          const started = await call("/tool/dispatch", {
            node: input.node,
            workflow: input.workflow,
            prompt: input.prompt,
          }, context, "dispatch");
          let result = started;
          if (input.wait) {
            result = await call("/tool/dispatch/wait", {
              dispatchId: started.dispatchId,
              timeoutMs: input.timeoutMs ?? 300000,
            }, context, "dispatch_wait");
          }
          return { content: JSON.stringify(result) };
        },
      });

      editor.add({
        name: "dispatch_wait",
        description: "Wait for a dispatched graph run and return its completion or defect.",
        input: {
          type: "object",
          properties: {
            dispatchId: { type: "string" },
            timeoutMs: { type: "number" },
          },
          required: ["dispatchId"],
          additionalProperties: false,
        },
        options: { codemode: false, permission: "dispatch_wait" },
        async execute(input, context) {
          const result = await call("/tool/dispatch/wait", {
            dispatchId: input.dispatchId,
            timeoutMs: input.timeoutMs ?? 300000,
          }, context, "dispatch_wait");
          return { content: JSON.stringify(result) };
        },
      });

      editor.add({
        name: "dispatch_status",
        description: "Read the live state of a dispatched graph run.",
        input: {
          type: "object",
          properties: { dispatchId: { type: "string" } },
          required: ["dispatchId"],
          additionalProperties: false,
        },
        options: { codemode: false, permission: "dispatch_status" },
        async execute(input, context) {
          const result = await call("/tool/dispatch/status", {
            dispatchId: input.dispatchId,
          }, context, "dispatch_status");
          return { content: JSON.stringify(result) };
        },
      });

      editor.add({
        name: "dispatch_cancel",
        description: "Cancel a queued dispatch, or interrupt and cancel the active dispatch.",
        input: {
          type: "object",
          properties: { dispatchId: { type: "string" } },
          required: ["dispatchId"],
          additionalProperties: false,
        },
        options: { codemode: false, permission: "dispatch_cancel" },
        async execute(input, context) {
          const result = await call("/tool/dispatch/cancel", {
            dispatchId: input.dispatchId,
          }, context, "dispatch_cancel");
          return { content: JSON.stringify(result) };
        },
      });

      editor.add({
        name: "reload",
        description: "Validate and swap the graph config. Returns named faults and keeps the old graph if invalid.",
        input: { type: "object", properties: {}, additionalProperties: false },
        options: { codemode: false, permission: "reload" },
        async execute(input, context) {
          const result = await call("/tool/reload", {}, context, "reload");
          return { content: JSON.stringify(result) };
        },
      });

      editor.add({
        name: "graph_info",
        description: "Return the config path and the one graph's workflows, nodes, and helpers.",
        input: { type: "object", properties: {}, additionalProperties: false },
        options: { codemode: false, permission: "graph_info" },
        async execute(input, context) {
          const result = await call("/tool/graph-info", {}, context, "graph_info");
          return { content: JSON.stringify(result) };
        },
      });

      editor.add({
        name: "graph_map",
        description:
          "Return the graph as a deterministic Mermaid map, workflow table, node table, legend, and live state. This is the graph as a thing; display it verbatim.",
        input: { type: "object", properties: {}, additionalProperties: false },
        options: { codemode: false, permission: "graph_map" },
        async execute(input, context) {
          const result = await call("/tool/graph-map", {}, context, "graph_map");
          return { content: JSON.stringify(result) };
        },
      });
    });
  },
});
`;
}

export async function installPlugin({ cwd, url, token }) {
  const dir = join(cwd, ".opencode", "plugins", "engine-handoff");
  await mkdir(dir, { recursive: true });
  const path = join(dir, "index.ts");
  await writeFile(path, renderPlugin({ url, token }), "utf8");
  return path;
}

export async function installSkills({ cwd }) {
  for (const name of ["graph-authoring", "dispatching"]) {
    const source = join(here, "skills", `${name}.md`);
    const dest = join(cwd, ".opencode", "skills", name, "SKILL.md");
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, await readFile(source, "utf8"), "utf8");
  }
}

export async function removeCommands({ cwd }) {
  const path = join(cwd, ".opencode", "commands", "graph.md");
  try {
    const body = await readFile(path, "utf8");
    if (body.includes("graph-view") || body.includes("graph_map")) await rm(path, { force: true });
  } catch {
    // no engine-installed command to remove
  }
}

export async function removeAgent({ cwd }) {
  const path = join(cwd, ".opencode", "agents", "graph-view.md");
  try {
    const body = await readFile(path, "utf8");
    if (body.includes("Read-only graph view") || body.includes("graph_map")) await rm(path, { force: true });
  } catch {
    // no engine-installed agent to remove
  }
}

export async function preflightPlugin(driver, cwd, { timeoutMs = 30000 } = {}) {
  if (!driver) return null;
  const deadline = Date.now() + timeoutMs;
  let last = [];
  while (Date.now() < deadline) {
    try {
      last = await driver.plugins(cwd);
      const found = last.find((plugin) => {
        const source = typeof plugin.source === "string" ? plugin.source : plugin.source?.path ?? "";
        const id = typeof plugin.id === "string" ? plugin.id : "";
        return `${id} ${source}`.toLowerCase().includes("engine-handoff");
      });
      if (found) return found;
    } catch {
      // The plugin list is a preflight, not a boot blocker; the dispatch
      // will defect if the lever is missing.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}
