// The graph engine plugin server part. One process-global engine, created or
// reused here; the engine's lifetime is the OpenCode server process, never the
// plugin. Tool calls go directly into the engine — no fetch, URL, or token.

import { Plugin } from "@opencode/plugin";
import { createPluginDriver } from "./engine/plugin-driver.mjs";
import { createRuntime } from "./engine/runtime.mjs";
import { findNode, handoffLabels } from "./engine/config.mjs";
import { materializationPlan } from "./engine/materialize.mjs";
import { GraphEngine } from "./rpc.ts";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RUNTIME_KEY = Symbol.for("graph-engine.runtime");
// Process-global so the marker survives plugin reloads: tools registered by a
// previous plugin instance still count as owned by graph-engine.
const OWNED = Symbol.for("graph-engine.owned");

const TERMINAL = new Set(["completed", "defect", "cancelled"]);

// The six interactive-only control tools. A subagent (child) session must not
// hold them at all — removal, never a permission guard (INVARIANTS).
const CONTROL_TOOLS = new Set([
  "dispatch",
  "dispatch_status",
  "dispatch_cancel",
  "reload",
  "graph_info",
  "graph_map",
]);

// The graph config resolves from the plugin's installed location:
//   $OPENCODE_CONFIG/plugins/graph-engine/../../graph-engine/graph/config.json
// A plugin option or an environment override wins, which is what keeps the
// plugin testable without a real install.
function graphConfigPath(ctx, env = process.env) {
  const fromOptions = ctx?.options?.graphConfig;
  if (typeof fromOptions === "string" && fromOptions.trim() !== "") return fromOptions;
  const fromEnv = env?.GRAPH_ENGINE_CONFIG;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") return fromEnv;
  const pluginDir = dirname(fileURLToPath(import.meta.url));
  return resolve(pluginDir, "..", "..", "graph-engine", "graph", "config.json");
}

async function engineFor(ctx) {
  const driver = createPluginDriver(ctx);
  const existing = globalThis[RUNTIME_KEY];
  if (existing) {
    // A later setup brings a fresh server client; rebind it so new dispatches
    // do not route through a stale plugin instance's ctx.
    existing.setDriver(driver);
    return existing;
  }
  const runtime = await createRuntime({ configPath: graphConfigPath(ctx), driver });
  globalThis[RUNTIME_KEY] = runtime;
  return runtime;
}

const HANDOFF_DESCRIPTION = "Finish this node and hand off with a message. Call exactly once.";
const HANDOFF_INPUT = {
  type: "object",
  properties: {
    message: { type: "string", description: "The handoff message." },
  },
  required: ["message"],
  additionalProperties: false,
};
const sameDefinition = (tool: any) =>
  JSON.stringify(tool?.description) === JSON.stringify(HANDOFF_DESCRIPTION) &&
  JSON.stringify(tool?.input) === JSON.stringify(HANDOFF_INPUT);

function toolSource(context) {
  return {
    type: "tool",
    messageID: context.messageID,
    id: context.toolCallID ?? context.id,
  };
}

function dashboardSnapshot(runtime: any) {
  // The RPC output must be strict JSON. The raw config carries `undefined`
  // (model-less mounts, omitted optional fields), which the RPC output
  // validation rejects (`rpc.invalid_output: Expected JSON value at ["config"]`).
  // A JSON round-trip drops `undefined` exactly as the wire transport would.
  return JSON.parse(
    JSON.stringify({
      ok: true,
      config: runtime.config,
      info: runtime.graphInfo(),
      map: runtime.graphMap(),
      runtime: runtime.snapshot(),
    }),
  );
}

export default Plugin.define({
  id: "graph-engine",
  async setup(ctx) {
    const runtime = await engineFor(ctx);
    const labels = handoffLabels(runtime.config.graph);

    // Control tools are available only to the interactive, top-level agent.
    // A session with a `parentID` is a subagent child; track those ids and strip
    // the six control-tool names from their model tool set in the context hook.
    // Keyed on session kind (child), never on mode or settable permissions, so a
    // `mode: "all"` agent launched as a subagent is stripped too.
    // A FORK of a subagent is a top-level session with no `parentID`, but it
    // inherits the subagent's agent and permissions — if it kept the control
    // tools it would gain them through a side channel. Propagate child status
    // through the fork (below), so a fork never acquires the tools.
    const childSessions = new Set<string>();
    const childController = new AbortController();
    const childSubscription = (async () => {
      try {
        // Subscribe FIRST so a child created while we seed below is not missed —
        // the created event lands in this loop even while the initial list is in
        // flight. The same half-open subscription prunes deletions so the set
        // never grows without bound.
        for await (const ev of ctx.event.subscribe({
          types: ["session.created", "session.deleted", "session.forked"],
          signal: childController.signal,
        })) {
          const type = (ev as any).type;
          const data = (ev as any).data ?? {};
          const sessionID: string | undefined = data.sessionID;
          if (type === "session.deleted") {
            if (typeof sessionID === "string") childSessions.delete(sessionID);
          } else if (type === "session.forked") {
            // `Forked.parentID` is the fork SOURCE, not a parent marker: if the
            // session being forked is a subagent child, its fork must not gain
            // the control tools. When the source is not yet tracked — a fork
            // that races the seed snapshot, or forks a child older than the
            // seeded window — resolve its lineage lazily by walking child
            // markers and fork ancestry via the session store.
            if (typeof sessionID === "string") {
              let isChild = childSessions.has(data.parentID);
              let cursor: string | undefined = isChild ? undefined : data.parentID;
              const seen = new Set<string>();
              while (!isChild && cursor && !seen.has(cursor)) {
                seen.add(cursor);
                if (childSessions.has(cursor)) {
                  isChild = true;
                  break;
                }
                try {
                  const info = await ctx.session.get({ sessionID: cursor });
                  if (info?.parentID) {
                    isChild = true;
                    break;
                  }
                  cursor = info?.fork?.sessionID;
                } catch {
                  cursor = undefined;
                }
              }
              if (isChild) childSessions.add(sessionID);
            }
          } else if (typeof sessionID === "string" && data.parentID) {
            childSessions.add(sessionID);
          }
        }
      } catch (error) {
        if (!childController.signal.aborted) {
          console.error("graph-engine.child-session-subscription", {
            error: error?.message ?? String(error),
          });
        }
      }
    })();
    // Seed after the subscription is listening. Session.Info carries `id`
    // (not `sessionID`); a set parent marks a child. A fork of a child has a
    // `fork.sessionID` pointing at its source, so resolve those too — to a
    // fixpoint, so a fork of a fork is covered. session.list returns the newest
    // 50 without pagination; that cap only bounds the snapshot here and cannot
    // let a child keep the tools: a direct child older than the window can no
    // longer issue a request (subagent sessions are one-shot, never resumed),
    // and a fork of an old child is re-classified lazily in the `session.forked`
    // branch above by resolving its source lineage through the session store.
    try {
      const listed = await ctx.session.list();
      const infos = listed?.data ?? [];
      for (const info of infos) {
        if (info.parentID) childSessions.add(info.id);
      }
      let changed = true;
      while (changed) {
        changed = false;
        for (const info of infos) {
          const source = info.fork?.sessionID;
          if (source && childSessions.has(source) && !childSessions.has(info.id)) {
            childSessions.add(info.id);
            changed = true;
          }
        }
      }
    } catch {
      // Seeding is best-effort: freshly created children are still tracked.
    }

    const rpcRegistration = await ctx.rpc.register(GraphEngine, {
      snapshot: async () => dashboardSnapshot(runtime),
      dispatchStatus: async (input: any) => runtime.status(input.dispatchId),
    });

    // Publish primary/subagent mounts and their skills into OpenCode's live
    // registries. Graph-only agents are never published. Each transform reads
    // the current config inside its callback, so a reload re-plays them via
    // ctx.agent.reload()/ctx.skill.reload() instead of stacking registrations.
    // Verified against the SDK source: agent update is an upsert (absent id is
    // created), Agent.Info.mode is primary|subagent|all, model is a Model.Ref
    // ({ providerID, id, variant? }), and Skill.Info.add needs path + content.
    const baseDir = dirname(graphConfigPath(ctx));
    const agentRegistration = await ctx.agent.transform((editor) => {
      for (const entry of materializationPlan(runtime.config, baseDir).agents) {
        editor.update(entry.id, (agent) => {
          agent.mode = entry.mode;
          agent.system = entry.system;
          // Only assign a model when the document declares one; never assign
          // `undefined`, which would clear an inherited (default) model.
          if (entry.model !== undefined) agent.model = entry.model;
          agent.description = entry.description;
          // Only assign a color when the document declares one; never assign
          // `undefined`, which would clear a default/derived color.
          if (entry.color !== undefined) agent.color = entry.color;
          agent.permissions = [...entry.permissions];
        });
      }
    });
    const skillRegistration = await ctx.skill.transform((editor) => {
      for (const skill of materializationPlan(runtime.config, baseDir).skills) editor.add(skill);
    });

    let generatedLabels: string[] = [];
    let knownCollisions = new Set<string>();

    const transformRegistration = await ctx.tool.transform((editor) => {
      const handoff = async (label: string, input: any, context: any) => {
        await ctx.permission.assert({
          sessionID: context.sessionID,
          agent: context.agent,
          action: "handoff",
          resources: ["*"],
          save: ["*"],
          source: toolSource(context),
        });
        await runtime.handoff({
          label,
          message: input.message,
          sessionID: context.sessionID,
          callID: context.toolCallID ?? context.id,
          messageID: context.messageID,
          agent: context.agent,
        });
        return { content: "handoff accepted: " + label };
      };

      editor.add({
        name: "dispatch",
        description:
          "Dispatch a prompt into the graph at exactly one of a node or a workflow. A workflow dispatch starts at its entry and engages the workflow boundary; a node dispatch engages no workflow. Foreground blocks; background returns a dispatch id immediately.",
        input: {
          type: "object",
          properties: {
            node: { type: "string", description: "Start at this node. Do not combine with workflow." },
            workflow: { type: "string", description: "Start this workflow at its entry. Do not combine with node." },
            prompt: { type: "string" },
            background: { type: "boolean" },
            resume: { type: "boolean" },
            dispatchId: { type: "string" },
          },
          required: ["prompt"],
          additionalProperties: false,
        },
        options: { codemode: false, permission: "dispatch" },
        async execute(input: any, context: any) {
          await ctx.permission.assert({
            sessionID: context.sessionID,
            agent: context.agent,
            action: "dispatch",
            resources: ["*"],
            save: ["*"],
            source: toolSource(context),
          });
          const session = await ctx.session.get({ sessionID: context.sessionID });
          const directory = session?.location?.directory;
          if (typeof directory !== "string" || directory.trim() === "") {
            throw new Error("dispatch needs the dispatching session's directory");
          }
          // Re-read the live agent catalog fresh so the gate sees
          // `opencode.config.agent`'s overrides (it registers after this plugin
          // at boot) — a user re-definition of one of our ids faults here,
          // never silently wins.
          await reportSubagents();
          const started = await runtime.dispatch(
            {
              node: input.node,
              workflow: input.workflow,
              prompt: input.prompt,
              background: input.background === true,
              resume: input.resume === true,
              dispatchId: input.dispatchId,
              sessionID: context.sessionID,
            },
            directory,
          );
          // Completion is delivered the way a subagent completion is: a
          // synthetic with `source: "subagent"` metadata renders the native
          // "↳ <agent> finished · <title>" transcript line and links into the
          // terminal node's session, while the synthetic `text` carries the
          // full result to the model (a synthetic's `text` is model context,
          // its `description` the transcript label — see INVARIANTS). Emitted
          // in both modes so foreground and background render identically.
          const deliver = async (result: any) => {
            const display = result.display ?? JSON.stringify(result);
            const node = findNode(runtime.config.graph, result.node ?? started.node);
            const title = result.workflow ?? result.node ?? "graph dispatch";
            await ctx.session.synthetic({
              sessionID: context.sessionID,
              description: title,
              text: `<graph-dispatch dispatchID="${started.dispatchId}" state="${result.state}" description="${title}">\n${display}\n</graph-dispatch>`,
              metadata: {
                source: "subagent",
                childID: result.state === "completed" ? result.sessionId : null,
                agent: node?.agent ?? "graph",
                state: result.state === "defect" ? "error" : result.state,
                dispatchId: started.dispatchId,
              },
            });
          };

          if (input.background === true) {
            void (async () => {
              try {
                let result = await runtime.wait(started.dispatchId, 300000);
                // The notification must carry a terminal state; a dispatch
                // that outlives one wait window is waited on again.
                while (!TERMINAL.has(result.state)) {
                  result = await runtime.wait(started.dispatchId, 300000);
                }
                await deliver(result);
              } catch (error) {
                console.error("dispatch.notification-failed", {
                  dispatchId: started.dispatchId,
                  error: error?.message ?? String(error),
                });
              }
            })();
            return { content: started.display ?? JSON.stringify(started) };
          }

          let result = await runtime.wait(started.dispatchId, 300000);
          while (!TERMINAL.has(result.state)) {
            result = await runtime.wait(started.dispatchId, 300000);
          }
          await deliver(result);
          return { content: result.display ?? JSON.stringify(result) };
        },
      });

      editor.add({
        name: "dispatch_status",
        description: "Read the live state of a dispatched graph run as a focused display; raw: true returns the structured snapshot.",
        input: {
          type: "object",
          properties: {
            dispatchId: { type: "string" },
            raw: { type: "boolean" },
          },
          required: ["dispatchId"],
          additionalProperties: false,
        },
        options: { codemode: false, permission: "dispatch_status" },
        async execute(input: any, context: any) {
          await ctx.permission.assert({
            sessionID: context.sessionID,
            agent: context.agent,
            action: "dispatch_status",
            resources: ["*"],
            save: ["*"],
            source: toolSource(context),
          });
          const result = await runtime.status(input.dispatchId);
          return {
            content: input.raw === true ? JSON.stringify(result) : result.display ?? JSON.stringify(result),
          };
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
        async execute(input: any, context: any) {
          await ctx.permission.assert({
            sessionID: context.sessionID,
            agent: context.agent,
            action: "dispatch_cancel",
            resources: ["*"],
            save: ["*"],
            source: toolSource(context),
          });
          const result = await runtime.cancel(input.dispatchId);
          return { content: JSON.stringify(result) };
        },
      });

      editor.add({
        name: "reload",
        description: "Validate and swap the graph config. Returns named faults and keeps the old graph if invalid.",
        input: { type: "object", properties: {}, additionalProperties: false },
        options: { codemode: false, permission: "reload" },
        async execute(input: any, context: any) {
          await ctx.permission.assert({
            sessionID: context.sessionID,
            agent: context.agent,
            action: "reload",
            resources: ["*"],
            save: ["*"],
            source: toolSource(context),
          });
          const result = await runtime.reload();
          if (result.valid === true) {
            await ctx.agent.reload();
            await ctx.skill.reload();
            await reportSubagents();
          }
          return { content: JSON.stringify(result) };
        },
      });

      editor.add({
        name: "graph_info",
        description: "Return the config path and the one graph's workflows, nodes, and graph agents.",
        input: { type: "object", properties: {}, additionalProperties: false },
        options: { codemode: false, permission: "graph_info" },
        async execute(input: any, context: any) {
          await ctx.permission.assert({
            sessionID: context.sessionID,
            agent: context.agent,
            action: "graph_info",
            resources: ["*"],
            save: ["*"],
            source: toolSource(context),
          });
          return { content: JSON.stringify(runtime.graphInfo()) };
        },
      });

      editor.add({
        name: "graph_map",
        description:
          "Return the graph as a deterministic Mermaid map, workflow table, node table, legend, and live state. This is the graph as a thing; display it verbatim.",
        input: { type: "object", properties: {}, additionalProperties: false },
        options: { codemode: false, permission: "graph_map" },
        async execute(input: any, context: any) {
          await ctx.permission.assert({
            sessionID: context.sessionID,
            agent: context.agent,
            action: "graph_map",
            resources: ["*"],
            save: ["*"],
            source: toolSource(context),
          });
          return { content: JSON.stringify(runtime.graphMap()) };
        },
      });

      // One generated handoff tool per declared label. Collisions against the
      // live catalog are recorded so dispatch fails closed on a clash.
      try {
        const existing = new Set(editor.list().map((tool) => tool.id ?? tool.name));
        knownCollisions = new Set(labels.filter((label) => existing.has(label)));
      } catch {
        knownCollisions = new Set(labels);
      }
      generatedLabels = labels.filter((label) => !knownCollisions.has(label));

      for (const label of generatedLabels) {
        const definition: any = {
          name: label,
          description: HANDOFF_DESCRIPTION,
          input: HANDOFF_INPUT,
          options: { codemode: false, permission: "handoff" },
          execute: async (input: any, context: any) => handoff(label, input, context),
        };
        definition[OWNED] = label;
        editor.add(definition);
      }
    });

    // The dispatch gate. The same report also names any label that collided,
    // so a dispatch defects instead of silently losing a lever.
    runtime.reportHandoffPreflight({
      labels,
      collisions: [...knownCollisions],
      catalogAvailable: true,
    });

    // The subagent gate: a graph agent's `subagents` id that is not in the
    // live agent catalog defects before a node runs. The live list (read after
    // materialization, so mounted agents count) is the authority; never a copy.
    // Re-run on a valid reload so the gate follows the catalog, not a snapshot.
    //
    // Name collisions are errors, full stop. The graph is the authoritative
    // agent catalog: every id it declares is a unique identifier, published or
    // not. A graph-only id must be absent from the catalog; a published id must
    // be present with the graph's own definition.
    const reportSubagents = async () => {
      try {
        const listed = await ctx.agent.list();
        const live = new Map((listed?.data ?? []).map((agent) => [agent.id, agent]));
        const missing = [];
        for (const graphAgent of runtime.config.agents ?? []) {
          for (const subagent of graphAgent.subagents ?? []) {
            if (!live.has(subagent)) missing.push({ agent: graphAgent.id, subagent });
          }
        }
        // Collisions: compare only the identity parts (system/description/mode).
        // The user's global-config permissions are appended to every agent, so
        // permissions always differ — comparing them would false-positive. A
        // pinned `model` or a display `name` is a layer on top of one
        // definition, not a second definition, so those stay out.
        const collisions = [];
        for (const graphAgent of runtime.config.agents ?? []) {
          const mounts = graphAgent.mounts ?? [];
          const primary = mounts.includes("primary");
          const subagent = mounts.includes("subagent");
          const entry = live.get(graphAgent.id);
          if (primary || subagent) {
            const expectedSystem = graphAgent.prompt ?? "";
            const expectedDescription = graphAgent.description ?? "";
            // The mode the materializer derives from the mounts (same derivation
            // as engine/materialize.mjs). A catalog entry that copies our
            // system/description verbatim but changes the mode (e.g. makes a
            // primary a subagent) is a different definition — a named defect.
            const expectedMode = primary && subagent ? "all" : primary ? "primary" : "subagent";
            if (
              !entry ||
              (entry.system ?? "") !== expectedSystem ||
              (entry.description ?? "") !== expectedDescription ||
              entry.mode !== expectedMode
            ) {
              collisions.push(graphAgent.id);
            }
          } else if (entry) {
            // graph-only: the id is owned without being published, so any
            // catalog entry is a foreign definition.
            collisions.push(graphAgent.id);
          }
        }
        runtime.reportSubagentPreflight({ missing, collisions, catalogAvailable: true });
      } catch {
        runtime.reportSubagentPreflight({ missing: [], collisions: [], catalogAvailable: false });
      }
    };
    await reportSubagents();

    // One snapshot of the tool catalog, captured after registration. The context
    // hook below runs on every model request, so it must not re-read the
    // catalog per request — `ctx.tool.list()` is a full registry reconcile and,
    // under steer-mode delivery, fires once per keystroke, which is the root of
    // the input lag. The collision check below uses this snapshot instead.
    let registered: Map<string, any> | null = null;
    try {
      registered = new Map((await ctx.tool.list()).map((tool) => [tool.id ?? tool.name, tool]));
    } catch {
      registered = null;
    }

    // The context hook asks the engine for the active session's allowed labels
    // and removes undeclared or colliding handoff tools. Ownership is judged
    // against the captured catalog snapshot, whose description/input are the
    // values this plugin registered, not the event-side tool shape.
    const hookRegistration = await ctx.session.hook("context", async (event: any) => {
      // The graph agent's body is the node session's system prompt; its skills
      // stay in the brief. Inject only for the engine's active node session.
      // (The hook fires for every request issued by that session — the agent
      // loop and any auxiliary generate/compaction — which is intended: the
      // body is standing context.)
      const system = runtime.sessionSystem({ sessionID: event.sessionID });
      if (system) event.system.push({ type: "text", text: system });
      if (!event?.tools) return;
      // A child (subagent) session never holds the control tools. A graph node
      // session has no parentID, so it is not in childSessions — match it
      // against the engine's active node session and strip it the same way.
      // Removal is mechanical, never permission-derived, so a graph agent that
      // declares an allow-"*" permission cannot re-expose the control tools.
      if (
        childSessions.has(event.sessionID) ||
        runtime.queue?.active?.sessionId === event.sessionID
      ) {
        for (const name of CONTROL_TOOLS) delete event.tools[name];
      }
      const { labels: allowed } = runtime.handoffTools({ sessionID: event.sessionID });
      const allowedSet = new Set(allowed);
      for (const label of generatedLabels) {
        const tool = event.tools[label];
        if (!tool) continue;
        const current = registered?.get(label);
        const collision =
          allowedSet.has(label) &&
          (!current || current[OWNED] !== label || !sameDefinition(current));
        if (!allowedSet.has(label) || collision) {
          delete event.tools[label];
          if (collision) {
            knownCollisions.add(label);
            runtime.reportHandoffPreflight({
              labels,
              collisions: [...knownCollisions],
              catalogAvailable: true,
              sessionID: event.sessionID,
            });
          }
        }
      }
    });

    // Plugin cleanup disposes this instance's registrations; it never stops
    // the engine. The engine ends when the OpenCode server process ends.
    return () => {
      childController.abort();
      void transformRegistration?.dispose?.();
      void rpcRegistration?.dispose?.();
      void hookRegistration?.dispose?.();
      void agentRegistration?.dispose?.();
      void skillRegistration?.dispose?.();
    };
  },
});