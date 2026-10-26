# OpenCode V2 Plugin Mechanics — Engine Feasibility Research

**Question:** We are designing an OpenCode V2 *plugin* that acts as an always-awake
"engine" under a catalog of skills. The engine must (a) spawn fresh OpenCode sessions
from inside a server plugin, (b) feed each a brief, (c) wait for the session's work to
finish and read its result, (d) run continuously even while no user is typing, and
(e) detect when a new file has been "cleared" for it (an agent ran our entry-point
tool on a file in the project). This note verifies which of these the plugin/runtime
platform supports, and with what APIs.

**Date:** 2025-10-25 (researched against docs current on this date)

**Primary sources used (V2 only):**

- https://opencode.ai/v2/llms.txt (index)
- https://opencode.ai/v2/docs/build/plugins/ (canonical plugin API page)
- https://opencode.ai/v2/docs/build/plugins/migrate-v1/ (lifecycle, events, storage guidance)
- https://opencode.ai/v2/docs/agents/ (agent config, modes, subagents)
- https://opencode.ai/v2/docs/tools/ (subagent tool, Code Mode / execute, permissions)
- https://opencode.ai/v2/docs/commands/ (Markdown/JSON commands vs plugin commands)
- https://opencode.ai/v2/docs/build/client/ (client semantics; plugin ctx is a server client)
- https://opencode.ai/v2/docs/api + https://opencode.ai/v2/openapi.json (the 298 schemas & operations)
- https://opencode.ai/config.json (config schema, `$defs`)

V1 docs (https://opencode.ai/docs/) were not used.

---

## 1. Session control from a plugin

- Plugins under `.opencode/plugins/` are loaded automatically; `setup(ctx)` receives the
  plugin context ("The plugin context is essentially an OpenCode server client. Its read
  and action methods use the same inputs and responses as the client").
  (https://opencode.ai/v2/docs/build/plugins/#context)
- The documented `ctx.session` surface is: `create`, `get`, `remove`, `context`, `list`,
  `switchAgent`, `switchModel`, `update`, `move`, `prompt`, `generate`, `command`,
  `compact`, `synthetic`, `interrupt`, `wait` (SessionContext interface).
  (https://opencode.ai/v2/docs/build/plugins/#sessions)
- **Spawn:** `ctx.session.create({ title: "Review" })` creates a session. The underlying
  `POST /api/session` request schema additionally accepts `id`, `parentID`, `agent`,
  `model`, `location`, `metadata`, and `permissions` — so a plugin can create a session
  with a chosen agent, a parent, and a location in one call.
  (https://opencode.ai/v2/docs/build/plugins/#sessions;
  https://opencode.ai/v2/openapi.json → `session.create` requestBody)
- **Feed a brief:** `ctx.session.prompt({ sessionID, text })` sends a user prompt.
  The method returns the admitted inbox item (`Promise<SessionInboxUser>`), i.e. it
  resolves at *admission*, not when the work completes; a plugin must separately await
  completion. (https://opencode.ai/v2/docs/build/plugins/#sessions)
  - Admission semantics: prompt hooks "run once during admission" and "If preparation
    fails or is interrupted, OpenCode does not admit the prompt."
    (https://opencode.ai/v2/docs/build/plugins/#prompt-admission)
  - Delivery modes are `"steer"` (default) or `"queue"`
    (schema `Session.Inbox.Delivery`). (https://opencode.ai/v2/docs/build/plugins/#sessions;
    https://opencode.ai/v2/docs/api#schema-Session.Inbox.Delivery)
- **Wait for completion:** `ctx.session.wait({ sessionID })` exists
  ("Rename, interrupt, or wait for a session"); the HTTP operation `POST
  /api/experimental/session/{sessionID}/wait` is described as "Wait for session".
  The docs do not spell out the exact resolve condition — verbatim semantics are thin.
  (https://opencode.ai/v2/docs/build/plugins/#sessions; https://opencode.ai/v2/docs/api/)
- `ctx.session.interrupt({ sessionID, resume: false })` interrupts execution.
  (https://opencode.ai/v2/docs/build/plugins/#sessions)
- **Read results:** `ctx.session.context({ sessionID })` returns the message list
  (`readonly SessionMessageInfo[]`). The message union includes `Session.Message.Idle`
  with `type: "idle"` and `outcome: "succeeded" | "failed" | "interrupted"` — the
  completion marker in a session's transcript.
  (https://opencode.ai/v2/docs/build/plugins/#sessions;
  https://opencode.ai/v2/docs/api#schema-Session.Message.Idle)
- Session info carries completion state for polling: `Session.Info.outcome`
  (`"succeeded" | "failed" | "interrupted"`) and `time.idle` (last idle timestamp).
  (https://opencode.ai/v2/docs/api#schema-Session.Info)
- `switchAgent` explicitly exists: `ctx.session.switchAgent({ sessionID, agent: "build" })`.
  (https://opencode.ai/v2/docs/build/plugins/#sessions)
- Transient inference without a session happens with `ctx.generate.text(...)`
  ("Generate text with a selected model without creating a session, invoking tools, or
  adding to session history"); a per-session one-shot is
  `ctx.session.generate({ sessionID, prompt }) → { text }`.
  (https://opencode.ai/v2/docs/build/plugins/#generate;
  https://opencode.ai/v2/docs/build/plugins/#sessions)
- Sessions can be listed per directory with cursor pagination:
  `ctx.session.list({ directory: ctx.location.directory, limit: 20 })`.
  (https://opencode.ai/v2/docs/build/plugins/#sessions)
- Child sessions inherit the permission rules in effect when they are created, and a
  plugin can replace the session-scoped rules entirely with
  `ctx.session.update({ sessionID, permissions })`.
  (https://opencode.ai/v2/docs/build/plugins/#permissions)

## 2. Always-on / continuous engine

- Lifecycle: "`setup` runs when the plugin loads. It may return a cleanup function that
  runs when the plugin unloads." (https://opencode.ai/v2/docs/build/plugins/#lifecycle)
- Timers are an official pattern: the docs' own example holds a `setInterval` inside
  `setup` (refreshing external model data every 60 s) and clears it in the returned
  cleanup — plugin code that runs on a schedule while nothing else is happening.
  (https://opencode.ai/v2/docs/build/plugins/#transforms)
- A plugin can hold a long-lived event stream for its whole lifetime:
  `for await (const event of ctx.event.subscribe({ signal }))`, with the signal aborted
  in the cleanup function. (https://opencode.ai/v2/docs/build/plugins/#events)
- "Registrations stay active for the plugin's lifetime and are disposed when it
  unloads"; "Use the cleanup function for timers, subprocesses, sockets, and other
  resources the plugin owns." (https://opencode.ai/v2/docs/build/plugins/migrate-v1/#register-hooks-in-setup,
  https://opencode.ai/v2/docs/build/plugins/migrate-v1/#migrate-events-and-cleanup)
- Event schema: `V2EventEncoded` is a JSON-encoded `string`; the HTTP stream is
  `GET /api/event`, SSE envelopes `{ event, data: V2EventEncoded }`. The decoded
  `OpenCodeEvent` objects carry `.type`. (https://opencode.ai/v2/docs/api#schema-V2EventEncoded;
  https://opencode.ai/v2/openapi.json → `/api/event`)
- Documented event types (by example only — no published catalog):
  - `session.idle` — the V2 migration guide's event example checks for it:
    `if (event.type === "session.idle") console.log("Session completed")`.
    (https://opencode.ai/v2/docs/build/plugins/migrate-v1/#migrate-events-and-cleanup)
  - `worktree.updated` — "Observe `worktree.updated` and call `list` again to read
    changed inventory." (https://opencode.ai/v2/docs/build/plugins/#worktrees)
  - `server.connected` — a late subscriber receives the current `server.connected`
    marker. (https://opencode.ai/v2/docs/build/client/#stream-events)
- No `session.execution.*` event family is documented anywhere in V2 docs; the
  documented completion signal is `session.idle`. (Search of all llms.txt-linked pages
  above; no counter-evidence found.)
- Event subscriptions are **live-only**: "Subscriptions are live-only, with no replay
  or automatic reconnection. A source failure ends current subscriptions; subscribe
  again after recovery." An engine must tolerate missed events.
  (https://opencode.ai/v2/docs/build/client/#stream-events)

## 3. Detecting "a file changed / a tool ran on a file"

- VCS observation API: `ctx.vcs.get()`, `ctx.vcs.branch.list()`,
  `ctx.vcs.status()`, `ctx.vcs.diff({ mode: "working" | "branch" | "committed",
  context })`. (https://opencode.ai/v2/docs/build/plugins/#vcs)
- `ctx.vcs.status()` returns per-file entries: `Vcs.FileStatus { file, additions,
  deletions, status: "added" | "deleted" | "modified" }`.
  (https://opencode.ai/v2/docs/api#schema-Vcs.FileStatus)
- `ctx.vcs.diff()` returns `FileDiff.Info { file, patch, additions, deletions,
  status }`. (https://opencode.ai/v2/docs/api#schema-FileDiff.Info)
- There is **no file-watching plugin API** documented. The docs state "Captured inputs
  are not watched automatically" (about transforms) and re-loading is always manual
  (`reload()`). An engine must poll `ctx.vcs.status()/diff()` (or touch the filesystem
  from its own Node code). (https://opencode.ai/v2/docs/build/plugins/#transforms)
- The config schema has top-level `watcher` ("Filesystem watcher configuration",
  `{ ignore: string[] }`), i.e. OpenCode internally watches files, but no plugin-facing
  subscription for watch events is documented. (https://opencode.ai/config.json)
- **"Our entry-point tool ran" is directly observable.** Tool execution hooks:
  - `ctx.tool.hook("execute.before", event => …)` — "Inspect or replace tool input
    before execution": `event.tool` (the tool's name) and `event.input` (its args).
  - `ctx.tool.hook("execute.after", event => …)` — "Inspect successful results or
    failures after execution": `event.status` is `"completed"` or `"error"`;
    `event.result` is mutable/replaceable; `event.error.message` on failure.
  (https://opencode.ai/v2/docs/build/plugins/#tools-1)
- Even simpler: the engine *owns* the entry-point tool (registered via
  `ctx.tool.transform`), so its `execute` callback in the plugin runtime *is* the
  notification point when an agent calls it.
  (https://opencode.ai/v2/docs/build/plugins/#tools)
- Caveat: the documented tool-hook event fields are exactly those shown above
  (`tool`, `input`; `status`, `result`, `error`). `sessionID`/`agent` fields on tool
  hook events are *not* shown in the docs — do not assume them.
  (https://opencode.ai/v2/docs/build/plugins/#tools-1)

## 4. Tools from a plugin

- Registration shape (synchronous transform from `setup`):
  `ctx.tool.transform(editor => { editor.namespace({ name, description });
  editor.add({ name, description, input: <JSON Schema>, options: { namespace,
  codemode }, execute(input, context) }); })`. A later valid registration with the
  same effective name overrides. (https://opencode.ai/v2/docs/build/plugins/#tools)
- `options.namespace` groups tools (effective ID becomes `acme_greeting`); "Dots in
  namespaces and unsupported characters in tool names become `_`".
  (https://opencode.ai/v2/docs/build/plugins/#tools)
- `options.codemode: true` appears in the official registration example; no prose in
  V2 docs defines plugin-tool `codemode` beyond that. Related: config-level MCP servers
  have a boolean `codemode`, and the tools doc says tools not exposed directly are
  reached "through `execute`" (Code Mode), and "plugin tools enforce the permissions
  they assert". Treat codemode as "expose in Code Mode catalog" per these adjacent
  statements, but the exact effect for plugin tools is under-documented.
  (https://opencode.ai/v2/docs/build/plugins/#tools; https://opencode.ai/config.json;
  https://opencode.ai/v2/docs/tools/#extensions)
- Executor context: `context.progress({ status: … })` for progress, and
  `context.signal` ("Promise tool executors receive `context.signal`. Pass it to
  cancellable work such as `fetch` so stopping the Session also stops the underlying
  operation."). (https://opencode.ai/v2/docs/build/plugins/#tools)
- Permission assertion from a tool executor:
  `await ctx.permission.assert({ sessionID: context.sessionID, agent: context.agent,
  source: { type: "tool", messageID: context.messageID, id: context.id }, action,
  resources, save, metadata })` — evaluated against the session's permission rules,
  prompting when a rule resolves to `ask`. A `deny` or a rejection-with-feedback
  rejects with a `Tool.Error` carrying the reason, so the model can react.
  (https://opencode.ai/v2/docs/build/plugins/#permissions)
- Snapshot semantics: "Each model request captures a stable, executable tool
  snapshot. Later transforms, reloads, and disposal affect future snapshots, not the
  definitions … already captured." — an engine cannot change a tool mid-run.
  (https://opencode.ai/v2/docs/build/plugins/#tools)
- `ctx.tool.list()` reads tools currently registered (after every transform);
  `editor.update`/`editor.remove` operate on effective IDs; "Invalid updates are
  logged and leave the previous definition intact"; disposing a registration removes
  its changes. (https://opencode.ai/v2/docs/build/plugins/#tools)
- What a tool's `execute` can/cannot do is not further restricted in the docs: the
  executor is plugin code running in the runtime (it can `fetch`, hold state, call
  `ctx`), but enforcement of permissions is the plugin's own choice — built-ins gate
  themselves, MCP and plugin tools "enforce the permissions they assert".
  (https://opencode.ai/v2/docs/tools/#extensions)

## 5. Agents from a plugin

- Plugin agent API: `ctx.agent.list()`, `ctx.agent.get({ agentID })`, and
  `ctx.agent.transform(editor => …)` with `AgentEditor { list, get, default, update,
  remove }`. **The documented editor has no `add` method** — a plugin can update,
  remove, or select an agent that already exists (builtin or config-defined); creating
  a previously unknown agent ID from a plugin transform is undocumented.
  (https://opencode.ai/v2/docs/build/plugins/#agent)
- `Agent.Info` fields a transform can set: `id`, `name`, `model` (`Model.Ref`),
  `request`, `system`, `description`, `mode: "subagent" | "primary" | "all"`,
  `hidden`, `color`, `steps`, `permissions` (`Permission.Ruleset`). So yes — a plugin
  can give an agent its own description/mode/model/permissions by transforming its
  definition. (https://opencode.ai/v2/docs/api#schema-Agent.Info)
- The `mode: subagent` concept exists (modes table: `primary`, `subagent`, `all`;
  default `primary` when omitted). "Subagents run with fresh context in foreground or
  background child sessions." The parent agent's `subagent` permissions control which
  agents it may launch; the child uses its own configured permissions.
  (https://opencode.ai/v2/docs/agents/#modes)
- **How a subagent is spawned:** through the `subagent` tool from a session
  ("`subagent` starts a child session with a configured subagent. Supply the agent ID,
  a short `description`, and a complete `prompt`… `background: true` returns
  immediately… Pass the returned `sessionID` to continue that same child
  conversation. Only subagent-mode agents can be used, and the default nesting depth
  is one." Permission action `subagent` with the selected agent ID.).
  (https://opencode.ai/v2/docs/tools/#automation)
- There is **no documented plugin-SDK method to invoke the `subagent` tool**
  directly. A plugin's documented path to an agentic child session is
  `ctx.session.create()` (which accepts `parentID` and `agent`) followed by
  `ctx.session.prompt`/`wait` — whether a session can be *created or switched* to an
  agent with `mode: subagent` is not documented (the docs only say a default primary
  "must … support primary use"). Unverified nuance.
  (https://opencode.ai/v2/openapi.json → `session.create` requestBody;
  https://opencode.ai/v2/docs/agents/#selection)
- Config-level: commands with `subagent: true` run in a background child session
  ("OpenCode sends the child's result or failure back to the parent when the child
  finishes"), and `ctx.session.command({ sessionID, name, text })` can invoke a command
  by name. (https://opencode.ai/v2/docs/commands/#background;
  https://opencode.ai/v2/docs/build/plugins/#sessions)
- `subagent_depth` ("Maximum subagent nesting depth. Defaults to 1") exists in the
  config schema but is marked deprecated. (https://opencode.ai/config.json)
- Builtins: `build` (primary), `plan` (primary), `general` (subagent), `explore`
  (subagent). (https://opencode.ai/v2/docs/agents/#builtins)

## 6. Commands from a plugin

- Plugin command API: `ctx.command.transform(editor =>
  editor.add({ name, description, execute }))` where the executor receives
  `CommandInvocation { sessionID: string, prompt: PromptInput, delivery:
  "steer" | "queue" }` and returns `Promise<void>`. The official example calls
  `ctx.session.prompt` with modified text and delivery — i.e. a plugin command's
  `execute` is arbitrary in-process code with access to the whole `ctx`.
  (https://opencode.ai/v2/docs/build/plugins/#commands)
- Contrast with Markdown commands: `.opencode/commands/<name>.md` files (or JSON
  `commands` entries) are **prompt templates** — body/`template` with `$ARGUMENTS`,
  `$1…` placeholders, optional frontmatter `description`, `agent`, `model`, and
  `subagent`/`subtask`; shell blocks `` !`cmd` `` run only to *produce prompt text* at
  evaluation time, "outside the agent's tool permission flow". They cannot execute
  arbitrary code, whereas a plugin-registered command can.
  (https://opencode.ai/v2/docs/commands/#markdown; https://opencode.ai/v2/docs/commands/#shell)
- Command schema for config/JSON commands: `Config.CommandEncoded { template
  (required), description, agent, model, subagent, subtask }`.
  (https://opencode.ai/config.json)
- `Command.Info` (the listing schema) is just `{ name, description }`.
  (https://opencode.ai/v2/docs/api#schema-Command.Info)

## 7. Storage

- `ctx.storage`: `get(key)`, `set(key, value: Json)`, `remove(key)`, and
  `scan({ prefix, after?, limit? }) → { entries, next? }` — "Store, read, or remove
  durable JSON values scoped to the plugin."
  (https://opencode.ai/v2/docs/build/plugins/#storage)
- Scoping/duration: "Plugin storage is scoped by this ID" (the plugin `id` required by
  `Plugin.define`); the migration guide calls the values "durable".
  (https://opencode.ai/v2/docs/build/plugins/migrate-v1/#replace-the-entrypoint;
  https://opencode.ai/v2/docs/build/plugins/migrate-v1/#migrate-options-and-persistent-state)
- The physical location and the restart-survival guarantee are **not documented**
  (no storage routes in the HTTP API, no data-directory statement found in V2 docs).
  Treat "survives server restart" as an unverified assumption.
  (https://opencode.ai/v2/docs/api/; https://opencode.ai/config.json — no storage surface)

---

## Feasibility verdicts

**(a) Spawn fresh OpenCode sessions from inside a server plugin — SUPPORTED.**
`ctx.session.create({ title, agent, model, location, parentID, permissions })`
(plugin doc example + the `session.create` request schema), then
`ctx.session.switchAgent` / `ctx.session.prompt`. The context is explicitly "an
OpenCode server client". (https://opencode.ai/v2/docs/build/plugins/#sessions;
https://opencode.ai/v2/openapi.json)

**(b) Feed each session a brief — SUPPORTED.**
`ctx.session.prompt({ sessionID, text, … })` admits a durable user prompt
(`"steer"` or `"queue"` delivery; `Session.Inbox.Delivery`). It resolves on
admission, so completion handling is separate.
(https://opencode.ai/v2/docs/build/plugins/#sessions;
https://opencode.ai/v2/docs/api#schema-Session.Inbox.Delivery)

**(c) Wait for the session's work to finish and read its result — SUPPORTED, three
independent mechanisms, one with a caveat.**
(i) `ctx.session.wait({ sessionID })` exists ("Wait for session"), but the docs do
not spell out the exact resolve condition; (ii) the `session.idle` event type on
`ctx.event.subscribe()` (docs' own "Session completed" example); (iii) read state:
`ctx.session.context({ sessionID })` messages ending in `Session.Message.Idle {
outcome: succeeded | failed | interrupted }`, or poll `ctx.session.get` →
`Session.Info.outcome` / `time.idle`. Sole caveat: event stream is live-only (no
replay). (https://opencode.ai/v2/docs/build/plugins/#sessions;
https://opencode.ai/v2/docs/build/plugins/migrate-v1/#migrate-events-and-cleanup;
https://opencode.ai/v2/docs/api#schema-Session.Message.Idle;
https://opencode.ai/v2/docs/api#schema-Session.Info;
https://opencode.ai/v2/docs/build/client/#stream-events)

**(d) Run continuously while no user is typing — SUPPORTED, as the documented plugin
pattern.** `setup` runs at load and returns cleanup; the official docs show a
`setInterval` held inside `setup` plus a plugin-lifetime `ctx.event.subscribe()`
stream, both torn down in cleanup; registrations stay active until unload. The
plugin code lives in the OpenCode server process, so it runs between user messages.
What remains an assumption: the docs do not state an explicit keep-alive guarantee,
event wakeups, or behavior across server restarts/crashes (subscriptions are
live-only, no replay). (https://opencode.ai/v2/docs/build/plugins/#lifecycle, /#transforms, /#events;
https://opencode.ai/v2/docs/build/plugins/migrate-v1/#register-hooks-in-setup)

**(e) Detect "file cleared for us" (our entry-point tool was run on a file) —
SUPPORTED via tool hooks or by owning the tool; raw filesystem watching is NOT
documented.** `ctx.tool.hook("execute.before")` shows `event.tool` + `event.input`;
`ctx.tool.hook("execute.after")` shows `event.status` (`"completed"` / `"error"`),
`event.result`, `event.error` — enough to see which tool ran on what input. More
directly, the engine registers its own entry-point tool via `ctx.tool.transform` and
is called in-process when it runs. For *unmodified-file* detection the documented
mechanisms are polling `ctx.vcs.status()` / `ctx.vcs.diff()` (statuses
added/deleted/modified per file); there is no plugin-facing filesystem-watch API
(the config-level `watcher` exists but exposes nothing to plugins).
(https://opencode.ai/v2/docs/build/plugins/#tools-1, /#tools, /#vcs;
https://opencode.ai/v2/docs/api#schema-Vcs.FileStatus;
https://opencode.ai/config.json)

## Unverified / keystone assumptions

1. **Storage durability:** `ctx.storage` values are "durable" and scoped to the
   plugin ID, but where they persist and whether they survive a server restart is
   not documented. The spec must not promise cross-restart state on this alone.
2. **Event catalog & payloads:** only `.type` with examples `session.idle`,
   `worktree.updated`, `server.connected` is documented; a full `V2EventEncoded` type
   list and per-event payload fields (e.g. whether the idle event carries the
   `sessionID`) are not published in the docs.
3. **`ctx.session.wait` semantics:** its resolve condition (running step? whole
   inbox? idle?) is not spelled out.
4. **Creating new agent IDs from a plugin:** `AgentEditor` documents only
   `list/get/default/update/remove` — no `add`. New agents must come from config
   (`.opencode/agents/*.md` or `agents` JSONC); the plugin can then transform them.
5. **Session with a subagent-mode agent:** creating/switching a session to an agent
   whose `mode: "subagent"` is not documented as permitted; documented subagent
   launching path is the `subagent` tool or `subagent: true` commands.
6. **Tool-hook event fields:** only `tool`/`input` (before) and
   `status`/`result`/`error` (after) are shown; `sessionID`/`agent` on those events
   is an unsupported assumption.
7. **Plugin-tool `codemode` semantics:** the option appears in the registration
   example but is nowhere defined for plugin tools in V2 docs.
8. **Plugin runtime lifetime:** running "continuously" is bound to the OpenCode
   server staying up on that location; there is no documented restart/wakeup
   mechanism and no event replay after disconnects.