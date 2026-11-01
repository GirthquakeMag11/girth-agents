# Subagents and dispatch interaction — design

**Status:** draft for discussion. Handoff tools are specified in
`specs/HANDOFF-TOOLS-SPEC.md` and sliced into `tickets/015`–`019`; the rest is
not yet sliced.  
**Baseline:** engine v1.3.0, config schema version `"3"`.  
**Invariants:** `INVARIANTS.md` — one handoff interface; no separate reply,
answer, request-input, or wait tool.  
**Structure:** Part I is the engine contract, independent of any graph. Part II records the initial node design for our graph, which is not encoded yet; `engine/graph.json` currently contains only a placeholder `build-review` workflow. Part I applies to every graph; Part II applies only to ours. A Part II choice must not be read as an engine rule, and a Part I rule must not be read as a graph choice.

# Part I — The engine

## I.1 Purpose

This part covers three engine changes that reinforce each other:

1. **Graph agent subagents.** A graph agent may declare a specific allowlist of
   OpenCode subagent IDs. Only those IDs may be launched; omitting the list
   denies subagent access.
2. **Subagent-like dispatch results.** The interactive agent receives a
   focused workflow response, not a serialized engine snapshot. The raw
   snapshot remains available for engine work and diagnostics.
3. **Dispatcher return handoff.** A node can hand off a message to the
   dispatching agent. The dispatch completes and the source session is retained
   as the origin. The dispatcher can send a message back with `resume: true`.
   The node resumes in the same session with that message in context. This is
   the same handoff channel as every other handoff; there is no question,
   answer, final, or response message type.

These are engine capabilities. Part II records the initial node design for the graph that will use them; it is not encoded yet.

## I.2 Settled engine requirements

- Graph agent configurations must accept **specific subagent type names**.
- Only the named subagents are granted. Omitting names denies subagent access
  in general.
- Dispatch and response should feel like the subagent tool: the same OpenCode
  dispatch-card presentation, a focused response to the interactive agent,
  and not a raw JSON blob. The card is labelled as a graph dispatch, not as a
  “subagent.”
- Dispatch uses the subagent usage pattern: foreground by default, or
  `background: true` returns immediately and notifies the interactive session
  on completion. There is no separate foreground wait step for a background
  dispatch.
- Dispatch is the interactive agent's open-ended handoff tool: it chooses the
  target and message. A node handoff tool is the same mechanism with a
  preconfigured target. The same `dispatch` call can start a node or send a
  message back to the origin with `resume: true`.
- A handoff target may be a graph node or the dispatching agent.
- The engine generates one handoff tool per declared label, named exactly
  that label.
- Each generated handoff tool takes `{ message }` as its handoff context.
- Collision detection is version-agnostic. The engine reserves only its own
  control tool names at config load; OpenCode built-in and third-party
  collisions are checked against the live tool catalog at plugin setup.
- A graph agent receives its configured tools plus only the generated handoff
  tools declared for its active node. It does not receive another node's
  generated handoff tools.
- The dispatching agent's return is the same open-ended `dispatch` tool with
  `resume: true`; the engine binds it to the origin of the input the dispatcher
  received. There is no separate reply or resume tool.
- A handoff to the dispatching agent completes the dispatch with the message
  as the focused response and retains the source session as the origin. The
  dispatcher may send a message back with `resume: true`.
- There is no question/answer/final/response message type; the same handoff
  channel is used in both directions.
- Output files are optional artifacts, not a universal response contract.
- The raw structured snapshot may remain available for engine development and
  diagnostics.

## I.3 Proposed engine mechanics, not yet decided

- A graph agent field named `subagents` containing exact OpenCode agent IDs.
- OpenCode dispatch-card presentation parity with the subagent tool, labelled
  as a graph dispatch.
- A focused engine-generated `display` string beside the raw snapshot.

The unresolved choices are in I.17.

## I.4 Current engine baseline

### I.4.1 Graph agent configuration and permissions

A graph agent currently has:

```json
{
  "id": "example-graph-agent",
  "model": "provider/model",
  "agent": "build",
  "permissions": ["read", "edit", "shell"],
  "craft": "..."
}
```

`engine/config.mjs` uses strict graph agent keys (`id`, `model`, `agent`,
`permissions`, `craft`) and validates `permissions` as a non-empty string
array. `"*"` and duplicates are rejected.

`engine/driver.mjs:27` builds a deny-rest ruleset:

```js
[
  { action: "*", resource: "*", effect: "deny" },
  ...allowedActions.map((action) => ({ action, resource: "*", effect: "allow" })),
]
```

For a non-terminal node, `handoff` is added to the allowed actions. The graph agent
therefore gets only its declared work actions plus `handoff`. The `build`
agent's default broad permissions do not leak through; the per-session
ruleset is the gate.

OpenCode maps its `subagent` tool to the `subagent` action. A graph agent cannot
launch a subagent unless that action is allowed for the target agent.

This is the current implementation, not the target. It is off-spec in two
ways: graph agents are intended to be Markdown configuration documents, and
handoffs are intended to be generated one-tool-per-label with `{ message }`,
not one `handoff({ label })` tool. The file-per-node/file-per-graph-agent
architecture is recorded as open in I.17.4.

### I.4.2 Dispatch and result

The interactive agent calls the plugin's `dispatch` tool. The plugin posts to
the engine's `/tool/dispatch`, optionally waits at `/tool/dispatch/wait`, and
returns `JSON.stringify(snapshot)` to the model.

The snapshot includes dispatch state, node, workflow, visits, terminal,
defect, handoff, session id, output `{ path, bytes, hash }`, usage, and a
`result` object for terminal runs. The terminal result currently carries
`{ terminal, visits, output, usage }`.

The terminal output file is verified but its content is not returned. The
interactive agent must read `output.path` to see the final report.

Current handoffs target graph nodes only, and the handoff tool carries a
label but no message. There is no dispatching-agent target.

The `completion` event used by History carries status, terminal, visits,
defect, usage, and timestamp, but not the output path or content.

### I.4.3 Queue and states

`engine/queue.mjs` has one active dispatch and a FIFO queue:

- `queued` → `running` → `completed`, `defect`, or `cancelled`.
- `wait(id, timeoutMs)` currently resolves only on a terminal state or
  timeout.
- `pause()` is a boundary pause: the active node finishes, then the dispatch
  waits before the next node.
- `cancel()` removes a queued dispatch or interrupts the active session.
- Everything is in memory; a restart loses the active dispatch and queue.

### I.4.4 History and dashboard

`engine/history.mjs` stores a 100-entry, 15-key activity ring:

`seq`, `at`, `kind`, `dispatchId`, `workflow`, `node`, `phase`, `outcome`,
`label`, `from`, `to`, `status`, `terminal`, `code`, `valid`.

Allowed kinds are `queued`, `dispatched`, `step`, `handoff`, `completion`,
`defect`, and `reloaded`. History never stores prompt, output, session id, or
message content.

The dashboard reads `runtime.active`, `runtime.queue`, `runtime.history`, and
`runtime.historyEpoch`. Details shows live active work; History is the
activity timeline. The Run console already prints the active dispatch state.

## I.5 Engine goals and non-goals

### I.5.1 Goals

- Make graph agent subagent access explicit, narrow, and visible in the graph
  contract.
- Return a focused final response to the interactive agent, with a compact
  operational footer.
- Let any opted-in node hand off a message to the interactive agent and resume
  in the same session.
- Keep the engine's one-active-dispatch model.
- Keep handoff message content out of the activity ring.
- Make the behavior testable offline and live-provable.

### I.5.2 Non-goals

- Run archive or persisted dispatch history.
- Durable queue or recovery after an engine restart.
- Parallel dispatches across the graph; one dispatch remains active.
- Subagent nesting beyond OpenCode's default depth of one.
- Giving graph agents the interactive control tools (`dispatch`, `reload`, etc.).
- Direct graph-agent-to-user chat that bypasses the interactive agent.
- Editing the graph while a dispatch is active.
- A general web workbench or a replacement for the native dashboard.
- Reworking a specific graph or running the dogfood task; those are deferred
  to Part II.

## I.6 Design overview

One handoff channel in both directions:

```text
Interactive agent
  │
  ├─ dispatch(prompt, background?, resume?, dispatchId?)
  │     │
  │     └─ result: focused response + compact footer
  │
  └─ return message (same handoff form, resume: true)

Graph node (graph agent session)
  │
  ├─ <dispatcher label>(message) ──► engine ──► interactive agent
  │        ▲                                        │
  │        └──── same handoff interface ◄───────────┘
  │
  ├─ subagent(<allowed name>)                      [child session]
  │
  └─ <handoff label>(message)                      [node target or dispatching agent]
```

The node's primary graph agent session remains the only session that can hand
off. Subagents are private implementation details of the node. A child session
never becomes a graph node and never owns a route.

The graph agent receives its configured tools plus only the generated handoff
tools declared for its active node. Each generated tool is named after its
label and takes a `message`. A generated handoff tool may target another graph
node or the dispatching agent. A handoff to a node passes the message as
upstream context. A handoff to the dispatching agent completes the dispatch
and returns the message as the focused response.

The dispatching agent's return uses the same open-ended `dispatch` tool with
`resume: true`; the engine binds the return target to the node that asked.
There is no separate reply or resume tool.

The interactive agent sees the dispatch in the OpenCode UI as a
subagent-style dispatch card, labelled as a graph dispatch rather than a
“subagent.” The card is the primary presentation; the display string is the
fallback.

Subagents may run in parallel **inside** a node. They do not create parallel
dispatches, parallel graph routes, or a second active dispatch. The engine's
one-active-dispatch model is unchanged.

## I.7 Graph agent subagents

### I.7.1 Configuration

A graph agent type is a Markdown configuration document. Its exact
frontmatter/body schema is open. The subagent capability contract is:

- `subagents` is optional.
- Omitted or `[]` means no `subagent` permission.
- Names are exact OpenCode agent IDs. `team/reviewer` is allowed; wildcards
  are not.
- `subagents` is a graph agent property, not a node property. Two nodes that
  need different subagent sets use different graph agents.

### I.7.2 Validation

In the graph agent definition validator:

- Accept a `subagents` list in the graph agent definition.
- If present, require an array.
- Each entry must be a non-empty string.
- Reject `*`, `?`, duplicates, and whitespace-only names.
- Allow `[]` as an explicit “none.”
- Reject `"subagent"` in the permission declarations with a named fault that
  tells the author to use `subagents`. This prevents an accidental broad grant
  through the plain action list.
- Keep the existing `"*"` rejection and duplicate checks for permissions.

Suggested fault codes:

- `schema.graph-agent-subagents`
- `schema.graph-agent-subagent-name`
- `schema.graph-agent-subagent-duplicate`
- `schema.graph-agent-subagent-permission`

### I.7.3 Permission projection

`permissionsFor` gains `subagents = []`:

```js
export function permissionsFor({ handoff = false, allow = [], subagents = [] } = {}) {
  const actions = [];
  if (handoff) actions.push("handoff");
  for (const action of allow) actions.push(action);

  return [
    { action: "*", resource: "*", effect: "deny" },
    ...actions.map((action) => ({ action, resource: "*", effect: "allow" })),
    ...subagents.map((name) => ({ action: "subagent", resource: name, effect: "allow" })),
  ];
}
```

For a graph agent with `["subagent-a", "subagent-b"]`, the resulting rules are:

```js
[
  { action: "*", resource: "*", effect: "deny" },
  { action: "handoff", resource: "*", effect: "allow" },
  { action: "read", resource: "*", effect: "allow" },
  { action: "edit", resource: "*", effect: "allow" },
  { action: "shell", resource: "*", effect: "allow" },
  { action: "subagent", resource: "subagent-a", effect: "allow" },
  { action: "subagent", resource: "subagent-b", effect: "allow" },
]
```

Because last match wins:

- `subagent` targeting `subagent-a` is allowed.
- `subagent` targeting `subagent-b` is allowed.
- `subagent` targeting an unlisted agent matches only the leading `deny *`
  and is denied.

Terminal nodes still receive the subagent rules; they simply do not receive
the `handoff` allow.

### I.7.4 Live preflight

OpenCode's `/api/agent` returns agent definitions with `id` and `mode`. At
dispatch start, after the target is resolved, the engine should verify every
listed subagent:

- missing → `subagent.unknown`
- present but `mode: "primary"` → `subagent.not-subagent`
- `mode: "subagent"` or `mode: "all"` → allowed

The config loader stays offline and syntactic. The live check belongs at
dispatch time because the config may be authored before the OpenCode service
or a custom subagent is available. A reload may still succeed; the dispatch
names the problem before any node runs.

The preflight should be cached per config revision if it becomes expensive.

### I.7.5 Child permissions and nesting

The graph agent's `subagents` list controls only **which agents may be launched**.
The child runs with its own OpenCode permissions, not a subset of the
graph agent's. This is V2 behavior and must be documented prominently.

Consequences:

- A read-only graph agent that lists a broad child can launch an agent with broad
  edit/shell access. Authors must choose child agents whose own permissions
  are appropriate.
- A read-only child is a good choice for mapping or inspection.
- OpenCode's default nesting depth is one. Many built-in subagents deny
  launching further subagents. Custom child agents should do the same.

### I.7.6 Brief

`composeBrief` should add a section when subagents are allowed:

```text
## Subagents

You may launch only these subagents: subagent-a, subagent-b.

Use them for focused work. Use the foreground form; do not use
background: true. Do not attempt to launch any other subagent.
```

When none are allowed:

```text
## Subagents

You may not launch subagents.
```

The section makes the capability visible to the model even if the tool
catalog is filtered or noisy.

### I.7.7 Observability

- `configSummary` includes `subagents: graphAgent.subagents ?? []`.
- `GRAPH.md` gains a graph agent table: id, model, agent, permissions, subagents,
  craft.
- The dashboard may show the active graph agent's subagents in Details later; this
  is not required for the first slice.
- Subagent launches are not new engine history events in this design. They are
  visible in OpenCode child sessions and, if we choose, in child usage
  accounting.

## I.8 Focused dispatch result

### I.8.1 Snapshot additions

Keep the existing raw snapshot. Add to the terminal result:

```json
{
  "terminal": "exit-node",
  "visits": { "node-a": 1, "node-b": 1, "exit-node": 1 },
  "output": "/abs/path/result.md",
  "response": "…terminal output content…",
  "responseTruncated": false,
  "usage": { "cost": 0.0123, "tokens": { "…": 0 } }
}
```

The `output` object on the dispatch snapshot remains
`{ path, bytes, hash }`. `result.response` is the focused content.

The engine already reads the output file for its hash. It can retain a capped
UTF-8 copy for the response. The response is not written to history.

For a dispatcher handoff, the focused response is the handoff message, not a
terminal output file. The result names the handing node and label; `output`
may be `null`. See I.8.5.

### I.8.2 Display strings

The engine control response gains a `display` string generated by a pure
formatter. The plugin returns `display` to the model. The raw fields remain.

Completed:

```text
<response content>

— d-1 · completed · exit-node · 3 visits · $0.0123 · 4.2k tokens · 2m 13s
```

Defect:

```text
d-1 · defect · node-b · handoff.not-last

node 'node-b': tool 'shell' followed the handoff
```

Dispatcher handoff:

```text
d-1 · node-a → dispatcher · status

The store choice is unresolved. The repo has both JSON and SQLite examples;
the prompt does not name one.

Reply with dispatch({ node: "node-a", prompt: "...", resume: true }).
```

Still running:

```text
d-1 · running · node-b · 2m 10s

This dispatch is running; the engine notifies this session when it completes.
```

Queued:

```text
d-1 · queued · node-a

This dispatch is queued; the engine notifies this session when it completes.
```

Cancelled:

```text
d-1 · cancelled · node-b
```

The footer is compact and optional to relay. It gives the interactive agent
the operational context without a JSON blob.

These display strings are the text fallback and tool result. The primary
OpenCode presentation is the dispatch card described in I.8.6.

### I.8.3 Raw diagnostics

`dispatch_status` should default to the display form and accept `raw: true`:

```json
{ "dispatchId": "d-1", "raw": true }
```

The raw response is the structured snapshot. This is the escape hatch for
engine development, debugging, and dashboard work.

The engine's HTTP endpoints keep their JSON shape. `display` is additive.

### I.8.4 Foreground and background dispatch

`dispatch` mirrors the subagent tool:

- Foreground is the default. The call blocks until the dispatch returns its
  focused result or defects.
- `background: true` returns the dispatch id immediately. The engine pushes a
  completion or defect notification into the interactive session; the
  interactive agent does not add a separate foreground wait step.
- `dispatch_status` is a read-only diagnostic snapshot, not a normal waiting
  step.
- There is no model-facing `dispatch_wait` tool. A background dispatch is
  resumed by the notification, not by a second foreground wait call.

The engine still enforces node budgets and dispatch cancellation; a foreground
call ends on the engine's result or defect.

### I.8.5 Dispatcher handoff

A node may declare the dispatching agent as a handoff target. The graph agent
calls the generated handoff tool named after the declared label, with a
message. The engine:

1. validates that the label belongs to the node and targets the dispatcher;
2. records the handoff message;
3. ends the dispatch as completed;
4. returns the message as `result.response` (capped) to the dispatching agent.

The result identifies the handing node and label, not a terminal node. The
interactive agent sees a focused response, like a subagent result. The raw
snapshot remains available through `dispatch_status(raw: true)`.

The same target also retains the source session as the origin for a return
message. The dispatcher may send a message back with `resume: true`; see I.9.
There is no separate question or final case.

An output file is optional for this route. If the node declares one, the
engine still verifies it; the handoff message is the response, not the file.
`output` becomes optional on a node: when omitted, the engine verifies no
file and the handoff message is the deliverable. This lets read-only nodes
participate in a graph.

### I.8.6 OpenCode UI presentation

A dispatch should appear in the OpenCode session UI as a dispatched subagent
does: the same kind of task/dispatch card, in the same place in the
conversation, with the same running-to-response lifecycle. It must not say
“subagent.” The card is titled with the graph dispatch target, for example
`graph · implement-from-ticket` or `dispatch · review-implementation`, and
shows its target and state.

The interactive agent should not be given a raw JSON tool result as the
primary presentation. The focused response is rendered in the card; the raw
snapshot remains available through the diagnostic tools. A dispatcher handoff
uses the same card: the message is the response, and a return message is a
handoff action on that card, not a separate input UI.

This is a UI requirement, not just a `display` string.

**Probe result (2026-10-31):** literal subagent-card parity is not achievable
through the current plugin API. The OpenCode TUI selects its tool-card
component by tool name; `subagent` is a built-in special case, and a custom
plugin tool falls back to the generic tool renderer. The TUI plugin API
exposes slots for the app, footer, composer, and sidebar, plus Markdown
code-block renderers, but no inline per-tool/session message card renderer.

Achieving parity therefore needs either an OpenCode core change (a custom
tool-card renderer or card metadata) or using the built-in `subagent` tool as
the dispatch surface. Both are design work, not a clear-cut feature spec. This
requirement stays in the design memo for now.

The dashboard is a separate surface and does not satisfy this requirement.

## I.9 Dispatcher return handoff

### I.9.1 One handoff channel

A handoff is a message and a target. There is no question, answer, final, or
response message type and no separate input protocol. A node may hand off a
message to the dispatcher; the dispatch completes and the source session is
retained as the origin. The dispatcher may send a message back with
`resume: true`; the engine validates the origin and resumes the source session.
The message is the context in both directions.

- The node's graph agent calls the generated handoff tool for a label that
  targets `$dispatcher`, with a message.
- The engine completes the dispatch with the message as the focused response
  and retains the source graph agent session as the origin.
- The dispatching agent uses the same open-ended `dispatch` tool: a node
  target, the message as the prompt, `resume: true`, and optional `dispatchId`.
  The engine binds the return to the origin; the node resumes in the same
  session with the message as upstream context.
- If the dispatcher does not return a message, the retained origin remains
  until discarded or the engine restarts.

There is no `input-required` state, no `dispatch_reply`/`dispatch_resume`/
`answer` tool, and no “start new work” versus “return” category. Dispatch is
the unconfigured handoff form.

### I.9.2 Dispatch result

The completed dispatch result carries the message as its focused response and
marks the source session as a retained origin:

```json
{
  "state": "completed",
  "handoff": {
    "from": "node-a",
    "label": "status",
    "message": "…",
    "origin": true
  },
  "result": {
    "response": "…",
    "responseTruncated": false
  }
}
```

The raw snapshot carries the same information. The session reference needed to
resume the node is engine state, not prompt content.

### I.9.3 Node side

The node's handoff config declares a label that targets `$dispatcher`. The
graph agent calls the generated handoff tool named after that label:

```json
{ "message": "…" }
```

The tool name is the label. The message is the message. No separate permission
or tool is required, and no flag marks it as a question or final response.

### I.9.4 Dispatcher side

The dispatching agent uses the same open-ended `dispatch` tool it uses to start
work. It targets the origin node, passes the message as the prompt, and sets
`resume: true`. There is no separate reply or answer tool.

The engine binds the call to the retained origin. If more than one retained
origin targets the same node, the call must include the dispatch id; otherwise
it is rejected with `handoff.ambiguous`. A target that is not the origin is
`resume.not-return`. `workflow` plus `resume: true` is invalid.

### I.9.5 Lifecycle

1. The node's graph agent calls the generated handoff tool with the message.
2. The engine validates the label and target, completes the dispatch with the
   message as the response, retains the source node session as the origin, and
   emits the content-free handoff history row.
3. The dispatching agent decides whether to send a message back.
4. The dispatcher calls `dispatch` with the origin node, the message, and
   `resume: true`; the engine resumes the source node session with the message
   as upstream context.
5. The node continues. A later handoff may target any node or the dispatcher
   again.

The message is in the node's session context exactly like an upstream handoff
message. No re-dispatch is needed.

### I.9.6 Retention, cancellation, and budget

- The source node session is retained as an origin. The dispatch is completed;
  it does not hold a queue slot.
- If the dispatcher returns a message, the continuation uses the same session.
- The dispatcher discards the retained origin with `dispatch_cancel` on the
  dispatch id; that removes the retained origin and its session.
- The node budget does not run while the origin is retained; the continuation
  uses the remaining budget.
- The control server does not hold a request open while the dispatcher
  decides.
- If the engine restarts, the retained origin and session are lost.

### I.9.7 Concurrent returns

- Multiple dispatches may retain origins at the same time. Each origin belongs
  to its own dispatch/session and dispatch id.
- The dispatcher may return messages with the same `dispatch` tool in any
  order; there is no global queue, serialization, or notification order.
- Within one dispatch, one origin is retained because its node is paused.
- A node can hand off again after it resumes.
- A return with no matching origin is `resume.not-return`.
- A stale return is `handoff.stale`.
- A return that is ambiguous across retained origins is `handoff.ambiguous`
  rather than assigned arbitrarily.

### I.9.8 Re-dispatch fallback

The primary return path is the same `dispatch` tool with `resume: true`, in the
same session.

Re-dispatch remains a manual fallback:

1. Discard the retained origin.
2. Optionally edit/reload the graph.
3. `dispatch` a new prompt with the corrected context.

This starts fresh and loses the old node session. It is appropriate when the
work item itself was wrong, not when the node just needs a message back.

### I.9.9 Content and privacy

- Message content stays in memory and in the node's context.
- It is not stored in `runtime.history`.
- The retained origin is exposed as the return path on the dispatch result.
- History rows are content-free: the handoff and its return.
- Handoff messages have no size cap; empty or whitespace-only messages are
  rejected. The dispatch response cap remains a separate limit.

## I.10 Engine data contracts

### I.10.1 Config

A graph agent type is configured by a Markdown document. The exact
frontmatter/body schema is open. The capability contract is:

- `subagents` omitted or `[]` → no subagent access.
- Subagent entries are exact OpenCode agent IDs.
- Work instructions and any permission declarations live in the Markdown
  document.
- A node's `agent` key references the graph agent type.
- A dispatcher handoff is a normal handoff label targeting `$dispatcher`; there
  is no message kind or permission.

Node handoff:

- The engine generates one handoff tool per declared label, named exactly the
  label.
- Each generated handoff tool takes `{ message }`.
- A handoff target is a node id or the reserved dispatcher target, proposed as
  `$dispatcher`.
- Conditional labels may mix node targets and the dispatcher target.
- The config declares targets and labels; the engine generates the tools and
  resolves the target at handoff time.

### I.10.2 Runtime

A dispatcher handoff completes the dispatch and retains the source node session
as the origin; the result is in I.9.2. There is no `input-required` active
snapshot.

Terminal result additions:

```json
{
  "response": "…",
  "responseTruncated": false
}
```

Dispatcher handoff result additions:

```json
{
  "state": "completed",
  "handoff": {
    "from": "node-b",
    "label": "pass",
    "message": "…handoff context…"
  },
  "result": {
    "response": "…handoff context…",
    "responseTruncated": false
  }
}
```

The dispatcher result does not require a terminal node or an output file. If
the handing node declares an output, the snapshot still carries its output
record.

### I.10.3 History

A handoff and its return use the existing `handoff` kind; no new history kind
is added:

```text
HH:MM:SS  d-1  node-a → dispatcher · <label>
HH:MM:SS  d-1  dispatcher → node-a · <label>
```

The label is the node's declared label for both rows; direction comes from
`from` and `to`. The 15-key allowlist remains unchanged. `from`, `to`, `label`,
`node`, `dispatchId`, `workflow`, and `at` carry the event. No message text.

The dashboard treats the label as a normal handoff label; there is no fixed
label or tone.

### I.10.4 Tool results

- `dispatch`: focused display by default in foreground; background returns an
  id and later notification.
- `dispatch_status`: read-only diagnostic; focused display by default,
  `raw: true` for the snapshot.
- Generated handoff tools: the tool name is the label; the input is
  `{ message }`; the engine resolves the target and resume behavior.
- The dispatcher return uses the same open-ended `dispatch` tool with
  `resume: true`; there is no separate `dispatch_reply`, `dispatch_resume`, or
  `answer` tool.

### I.10.5 Errors

Suggested named codes:

- `subagent.unknown`
- `subagent.not-subagent`
- `schema.graph-agent-subagents`
- `schema.graph-agent-subagent-name`
- `schema.graph-agent-subagent-duplicate`
- `schema.graph-agent-subagent-permission`
- `handoff.ambiguous`
- `resume.not-return`
- `handoff.stale`
- `handoff.message-required`
- `handoff.message-empty`
- `handoff.cancelled`
- `handoff.timeout` (only if a timeout is chosen)

## I.11 Dashboard and observability

### I.11.1 Details

A dispatcher handoff completes the dispatch; it does not create a waiting or
active Details entry. The message is the dispatch response and is presented in
the OpenCode dispatch card. If the dashboard later adds a completed-dispatch
view, it may show the retained origin there; that is not part of this slice.

### I.11.2 History

The handoff and its return appear as the existing handoff rows:

- `<node> → dispatcher · <label>`
- `dispatcher → <node> · return`

History remains newest-first, capped at 100, and never stores message content.

### I.11.3 Run console

The active line remains unchanged. A completed dispatcher handoff is not an
active dispatch; the last event line may show the dispatcher handoff row.

### I.11.4 Map and artifact

`renderState` does not need a waiting state.

`GRAPH.md` should show each graph agent's `subagents` list. The map is the
contract; a capability that is not in the map is a gap.

### I.11.5 Proof captures

No waiting-state capture is required. The dispatcher handoff surface is the
OpenCode dispatch card and the content-free History rows. If the final
response is implemented in the same slice, add a completed capture with the
focused response.

## I.12 Security and trust

- The graph agent's `subagents` list is a launch allowlist, not a sandbox for the
  child. The child uses its own permissions. Document this at every authoring
  surface.
- Only the active node's primary graph agent session can originate a node
  handoff. A dispatcher-target handoff is just another handoff; it completes
  the dispatch and retains the source session as the origin.
- The dispatcher return is a handoff; only the dispatching agent can invoke the
  retained origin. The engine binds it to the source node and the resumable
  session. There is no separate reply permission. The loopback token remains a
  cooperative boundary, not a substitute for the session permission gate.
- Handoff message content is not written to the history ring. The dispatch
  response is capped; the handoff message itself has no engine cap. A
  dispatcher handoff does not bypass the node's session binding or the label
  check.
- The control server remains loopback and token-gated.
- The existing cooperative-graph-agent trust boundary remains: shell can escape
  the workspace unless the environment is sandboxed. This design does not
  change that.
- Background subagents can outlive a node. The first implementation should
  instruct foreground use; a later guard can reject a handoff while any child
  session is active or wait for children to finish.
- Child session cost/tokens are separate from the parent session. If usage is
  not aggregated, the run console under-reports. This is an open question.

## I.13 Versioning and compatibility

- The clarified configuration architecture is a breaking change: one file per
  node and one Markdown file per graph agent type. The schema version is
  therefore open and likely `"4"`; it is not frozen at `"3"` in this revision.
- Engine version:
  - focused response + dispatcher handoff + OpenCode dispatch-card parity +
    graph agent subagents → `1.4.0`;
  - dispatcher return handoff → `1.5.0`.
- A graph rework does not bump the engine version; changing a graph is not an
  engine release.
- The engine's stdio protocol version (`say("version", { version: 2 })`) is
  separate; bump only if the stdio message contract changes.
- `lastEvent`/`lastDefect` remain compatible.
- `runtime.history` remains a 15-key allowlist; only the `kind` vocabulary
  grows.

## I.14 Engine test plan

### I.14.1 Offline

- Config:
  - `subagents` omitted, empty, valid, duplicate, wildcard, non-string;
  - `permissions: ["subagent"]` rejected;
  - dispatcher handoff target accepted, including mixed conditional labels;
  - a dispatcher-target label is accepted;
  - generated handoff tools are named exactly the labels and take
    `{ message }`;
  - `graphInfo`/`configSummary` include subagents;
  - strict unknown fields.
- Permissions:
  - exact deny-rest rules;
  - listed subagents allowed, unlisted subagent denied;
  - terminal node has no handoff allow;
  - omitted subagents produce no subagent rules;
  - configured graph agent tools are additive with only the active node's
    generated handoff tools.
- Brief:
  - subagent section present/absent;
  - generated handoff tools are listed by label;
  - handoff message is passed as upstream context.
- Queue:
  - a dispatcher handoff completes the dispatch;
  - the source node session is retained as the origin;
  - the dispatcher return resumes it with the message;
  - no queue slot is held while the origin is retained.
- Engine:
  - generated tool name maps to its label; no label argument;
  - foreground dispatch blocks and returns the focused result;
  - background dispatch returns an id and pushes a completion/defect
    notification into the interactive session;
  - there is no model-facing `dispatch_wait`; `dispatch_status` is diagnostic;
  - dispatcher handoff origin binding;
  - dispatcher return through the same handoff interface;
  - no `dispatch_reply`, `dispatch_resume`, or `answer` tool;
  - history handoff/return rows;
  - message caps and empty rejection;
  - dispatcher handoff records the message, completes the dispatch, and
    returns the message as `result.response`;
  - dispatcher handoff works with no output file;
  - a node-directed handoff message is included in the next brief.
- Formatter:
  - completed/defect/running/queued/cancelled displays;
  - truncation marker;
  - footer fields.
- UI presentation:
  - a dispatch renders as a subagent-style card, not a raw JSON blob;
  - the card never uses the word “subagent”;
  - running, completed, and defect states render in the card;
  - the focused response is the card's completion content.
- Dashboard:
  - no `input-required` waiting state;
  - content-free handoff history rows;
  - responsive layouts;
  - no message content in history.
- Anti-canvas and existing suites remain green.

### I.14.2 Live

- Create a graph-agent-like session with `subagents: ["explore"]`:
  - inspect the session permissions snapshot;
  - prompt it to launch `explore` and `general`;
  - assert `explore` succeeds and `general` is denied.
- Run a small node that hands off a message to the dispatcher:
  - assert the dispatch completes with the message and a retained origin;
  - send a message back through `dispatch` with the origin node and
    `resume: true`;
  - assert the node resumes in the same session and completes;
  - assert the final response is focused and the raw snapshot is available.
- Run a node whose pass label targets the dispatching agent:
  - assert the dispatch completes without a terminal node;
  - assert the handoff message is the focused response;
  - assert the OpenCode session shows the subagent-style dispatch card without
    the word “subagent.”
- Discard a retained origin:
  - assert the retained session is removed and no dispatch remains active.
- Budget:
  - assert the node budget does not run while the origin is retained and the
    return continues with the remaining budget.
- Subagent foreground/background:
  - if the guard is implemented, assert a background child blocks or delays
    the handoff;
  - if not, document the observed behavior.

## I.15 Engine rollout

Recommended dependency order:

1. **A — Focused dispatch result.** Dispatcher handoff target and message,
   engine response projection, foreground/background dispatch parity,
   background completion notification, OpenCode dispatch-card presentation
   parity, display formatter, plugin return path, raw status escape hatch.
2. **B — Graph agent subagents.** Graph agent definition, validation,
   permission projection, live preflight, brief, `GRAPH.md`, tests.
3. **C — Dispatcher return handoff.** `$dispatcher` target, generated handoff
   tools, same-interface return, retained origin, history, budget continuation,
   tests.

A and B are independent after the design. C depends on A's display channel for
messages. The graph design and rework are Part II and should follow these
slices; see II.5.

## I.16 Engine acceptance criteria

1. A graph agent may list exact subagents; omitted/empty means none; no wildcard
   or broad `subagent` permission can be authored.
2. Listed subagents are launchable; unlisted subagents are denied; the live
   preflight names missing/primary-only agents.
3. Foreground dispatch blocks and returns a focused response, not JSON by
   default; raw JSON is available diagnostically. Background dispatch returns
   an id and notifies the interactive session on completion. There is no
   model-facing `dispatch_wait` tool.
4. A node can hand off to the dispatching agent; the dispatch ends with the
   handoff message as the focused response, and no output file is required
   for that route.
5. The OpenCode UI presents a dispatch as a subagent-style dispatch card
   labelled as a graph dispatch, not as the word “subagent” and not as a raw
   JSON blob.
6. A node can hand off a message to the dispatching agent; the dispatch
   completes with the message and retains the source session as the origin.
   The agent can send a message back through the same handoff interface with
   `resume: true`, and the node resumes in the same session with the message
   in context.
7. A graph agent receives its configured tools plus only its active node's
   generated handoff tools.
8. History records content-free handoff/return rows.
9. The node budget does not run while the origin is retained; the return
   continues with the remaining budget.
10. Offline suites and live proofs pass; no canvas, no persisted history, no
    parallel dispatches.

## I.17 Engine open questions

Numbering is preserved from the pre-separation draft. Q1 is settled and
merged: the focused response is the handoff message to the dispatching agent,
and output files are optional artifacts. Q15 is settled: handoff messages have
no size cap. Q24 is settled: background completion pushes a notification into
the interactive session; there is no model-facing `dispatch_wait`.
Graph-specific questions are deferred to II.5.

### I.17.1 Blocking decisions

| # | Question | Options | Recommendation | Why it matters |
|---|---|---|---|---|
| 2 | What is the graph agent subagent declaration shape? | `subagents: []`; resource-aware permission objects | **`subagents: []`** | It separates launch targets from work actions and prevents accidental broad grants. |
| 3 | When are subagent names validated? | Reload; dispatch; both; syntax only | **Dispatch-time live preflight** | Config loading stays offline; a typo becomes a named defect before a node runs. |
| 4 | How does a node resume after a dispatcher handoff? | In-place return; re-dispatch; both | **In-place return**, re-dispatch is a new dispatch | In-place preserves the graph agent's session, work, and context. |
| 5 | How is a dispatcher handoff enabled? | `$dispatcher` target; permission action; all nodes | **`$dispatcher` target** | It uses the existing handoff config and needs no new permission. |
| 6 | How does the node budget behave while the origin is retained? | Resume with remaining budget; reset; separate timeout | **Resume with remaining budget** | The node is not running while the dispatcher decides. |
| 10 | Should child usage be aggregated? | Parent only; parent+children; aggregate with dedupe | **Aggregate if feasible; otherwise document the gap** | Dogfood cost measurement is otherwise wrong. |
| 11 | How are background subagents handled? | Allow + instruct foreground; reject handoff while active; wait for children; forbid | **Foreground instruction first; guard later** | Background children can outlive the node and break quiescence. |

### I.17.2 Deferrable decisions

| # | Question | Options | Recommendation | Why it matters |
|---|---|---|---|---|
| 13 | How large is the final response cap? | 8/16/32 KiB | **16 KiB** | Enough for a focused report; keeps tool results bounded. |
| 14 | How is raw JSON accessed? | `dispatch_status(raw:true)`; separate `dispatch_inspect` | **Raw flag** | One tool, explicit opt-in, no extra surface. |
| 17 | Does History store handoff message text? | Content-free rows; include message | **Content-free rows** | Keeps the activity ring safe; live text is in the dispatch card. |
| 20 | Child session cleanup? | Delete after node; retain for dogfood | **Retain during dogfood; document** | Child sessions are useful evidence; cleanup can be versioned later. |
| 21 | Dashboard scope in which slice? | Slice C; later | **Slice C: content-free handoff History; no waiting state** | The dispatcher handoff surface is the OpenCode dispatch card. |
| 22 | Engine/config version? | 1.4/1.5; config `"3"`; config `"4"` | **Engine 1.4/1.5; schema version open, likely `"4"`** | The file-per-node/graph-agent architecture is a breaking config change. |
| 23 | Should subagent launches appear in History/Details? | No new events; add subagent events; child-session list | **No new events in the first slice** | The node boundary is the contract; child sessions are implementation detail. Revisit with the run archive. |

### I.17.3 Questions that need a user decision, not an engineering default

- **User involvement.** Should the interactive agent always ask the user when
  a node hands off a message that needs user input, or may it answer from
  repository context and only escalate when it cannot?
- **Background subagents.** Do you want the first slice to allow background
  children (with a warning) or enforce foreground-only until child-session
  tracking exists?

### I.17.4 Configuration architecture (open)

The current single JSON file with `agents` and inline `graph.nodes` is
off-spec. The clarified architecture is:

- one configuration file per node;
- one Markdown document per graph agent type;
- a node's `agent` key references a graph agent type;
- the graph assembly, file layout, node schema, graph agent Markdown schema,
  and schema version are open.

This must be settled before encoding the replacement graph or changing the
engine config loader.

## I.18 Engine references

- `SPEC.md` — engine contract, graph-agent/node/handoff/session semantics.
- `specs/HANDOFF-TOOLS-SPEC.md` — generated per-label handoff tools.
- `specs/DISPATCH-RESULT-SPEC.md` — dispatch result, foreground/background
  lifecycle, and focused response.
- `specs/RETURN-HANDOFF-SPEC.md` — dispatcher handoff, retained origin, and
  same-interface return.
- `specs/OPTIONAL-OUTPUTS-SPEC.md` — optional node output files and
  message-only handoffs.
- `DASHBOARD-SPEC.md` — native dashboard contract, including motion and
  activity history.
- `engine/config.mjs` — graph-agent/node validation, graph summary.
- `engine/driver.mjs` — deny-rest permissions, session driver.
- `engine/executor.mjs` — node lifecycle, output verification, usage.
- `engine/queue.mjs` — dispatch states, wait, cancel, pause.
- `engine/engine.mjs` — control handlers, events, history exposure.
- `engine/plugin.mjs` — generated graph-agent handoff tools and interactive
  control tools.
- `engine/history.mjs` — 15-key activity ring.
- `dashboard/src/history.mjs` — History row grammar and tones.
- `dashboard/src/view.tsx` — Details, History, Run console.
- OpenCode V2 docs: `https://opencode.ai/v2/docs/agents/`,
  `https://opencode.ai/v2/docs/permissions/`,
  `https://opencode.ai/v2/docs/tools/`,
  `https://opencode.ai/v2/docs/build/plugins`,
  `https://opencode.ai/v2/docs/build/plugins/cli`.

# Part II — Our graph

## II.1 Status and boundary

The replacement graph is not encoded yet. `engine/graph.json` still contains
the placeholder `build-review` workflow. This part records the initial node
design; it does not choose graph-agent IDs, routes beyond the described
handoffs, or config fields.

The engine capabilities in Part I are the available vocabulary. If the new
graph needs an engine behavior that does not exist, that behavior belongs in
Part I.

## II.2 Current placeholder

The current graph has one workflow, `build-review`:

- entry `implement`, exit `done`;
- nodes `implement`, `review`, `done`;
- graph agents `builder` and `reviewer`;
- outputs `implementation.md`, `review.md`, `final.md`;
- review `pass → done`, `fail → implement` with resume.

It is a placeholder. It will be replaced, not extended.

## II.3 Initial node design

The replacement is one continuous pipeline with two author/review loops.
The implementation loop is the core; ticket generation feeds it.

1. **`tickets-from-spec`** — reads the dispatched spec document and creates
   the structured ticket documents. It writes one Markdown file per ticket
   plus an index. The tickets, not the whole spec, become the context for
   implementation.
2. **`review-tickets`** — reviews the ticket documents against the spec.
   `pass` hands to `implement-from-ticket`. `fail` hands back to
   `tickets-from-spec` with `resume: true`, so the original author session
   repairs the tickets. There is no separate repair node.
3. **`implement-from-ticket`** — derives its work from the structured ticket
   documents, implements them, and hands to `review-implementation`.
4. **`review-implementation`** — reviews the implementation against the
   tickets. `pass` hands to the dispatching agent. `fail` hands back to
   `implement-from-ticket` with `resume: true`, so the implementation session
   repairs its work. There is no separate repair node.

The dispatching agent is not a graph node. It is a valid handoff target. A
passing `review-implementation` ends the dispatch and returns its handoff
message to the interactive agent. There is no `done` node and no final-report
node in this initial node set.

The pipeline is:

```text
tickets-from-spec → review-tickets → implement-from-ticket → review-implementation → dispatching agent
        ↑                │ fail              ↑                        │ fail
        └────────────────┘                   └────────────────────────┘
```

The fail routes are repairs by the original author session, not new nodes.
This is the initial scope. Do not add more nodes yet.

A node may also hand off a message to the dispatching agent. The dispatching
agent sends a message back to that node with `resume: true`; this is the same
handoff channel. Which nodes get a `$dispatcher` label is still open.

The node set is continuous. No workflow view is specified; do not add one
unless asked.

## II.4 Ticket document shape

One Markdown file per ticket plus an index.

Each ticket has:

```markdown
# T-001 — <title>
**Status:** <status>
**Source spec:** <path>
**Depends on:** <ticket ids, or none>

## Context
## Work
## Acceptance criteria
## Test plan
## Out of scope
```

The index lists id, title, path, dependencies, and status. The index is the
author node's verified output. The ticket files are supporting artifacts and
the context routed to `implement-from-ticket`.

The ticket reviewer passes a ticket set only if an implementer can complete
every ticket without reading the source spec.

## II.5 Open graph questions

These are deferred until the graph design is encoded:

- graph-agent IDs, permissions, and crafts;
- the file-per-node / graph-agent Markdown architecture, graph assembly, and
  schema version (engine-level open item I.17.4);
- the exact ticket ID and path convention;
- whether `implement-from-ticket` handles one ticket or every ticket in the
  index;
- which nodes get a `$dispatcher` handoff label;
- what the `review-implementation` pass handoff message contains: the full
  review, a verdict summary, or a path to the review artifact;
- whether `review-implementation` keeps an output artifact or relies on the
  handoff message alone;
- output isolation, dogfood task, and the dogfood freeze;
- when to encode and reload the replacement graph.

No workflow view is part of this design. Adding one is a separate request.

The earlier graph-specific questions (7, 8, 9, 12, 18, 19) remain deferred
with this list; do not re-ask them against the placeholder.

## II.6 Graph references

- `engine/graph.json` — the current placeholder graph.
- `SPEC.md` — graph, workflow, node, handoff, and session semantics.
- `ROADMAP.md` — dogfood rules and freeze.
- `THREADS.md` — open dogfood thread.
- OpenCode V2 agent docs: `https://opencode.ai/v2/docs/agents/`.
