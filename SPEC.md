# The engine — specification

One ordinary program, always running, that dispatches a prompt into a
graph of agent nodes. A node's helper does the work, writes an output,
and pulls exactly one handoff lever; the engine maps the lever to the
next node and continues. Single-threaded, synchronous: one active
dispatch with a FIFO queue behind it. The user's interactive agent can
author the graph and dispatch work into it. The graph is config; the
engine knows nodes, handoffs, and the live session contract — never a
workflow.

## 1. The process

The engine boots from a config or not at all. It runs the verifier before
it announces ready; any config fault is a refusal: exit 2, the broken
constraint named on stderr.

It speaks JSON-lines over stdio: pokes in, notices out; human logs on
stderr. One dispatch runs at a time; further dispatches wait in a FIFO
queue. There are no projects, no run objects, no durable state, and no
history. The active dispatch and the queue are live memory; a restart
loses both. The engine's working directory is the workspace; output
paths, the config, and the handoff tool are resolved against it.

The config may be reloaded while idle: a `reload` validates the file,
swaps it on success, and returns named faults on failure while keeping
the old graph. A reload during an active dispatch is rejected; the agent
retries at the next boundary.

Whatever starts the engine starts it; whatever stops it stops it. EOF,
SIGTERM, or SIGINT interrupts the active session and exits.

## 2. The graph

A graph has an `id`, `outputRoot`, `maxSteps`, and `nodes`. A node is one
agent activation and its handoff surface. A node has an `id`, `helper`,
`objective`, `output`, optional `budgetMs`, optional `maxVisits`, and a
`handoff`.

Any node may be a dispatch entry point; the interactive agent chooses the
node. Every node must be able to reach a terminal node, and every cycle
must be bounded.

A helper has an `id`, a `model` (`provider/model`), an optional `agent`
(default `build`), `permissions` (the allowed action names), and optional
`craft`.

A **handoff** is exactly one of:

- **terminal** — no lever; the node ends after its session writes the
  output.
- **unconditional** — one target; the lever carries the label `next`.
- **conditional** — a non-empty set of labels; each label names exactly
  one target and carries a description.

No node mixes modes. Every label resolves to exactly one target. There is
no catch-all. A label that is not declared is a loud defect; a non-terminal
node whose session ends without an accepted handoff is a loud defect.

## 3. Dispatch

The dispatch input is `{ graph, node, prompt, wait? }`. The graph must
exist, the node must exist in it, and the prompt must be non-empty. Any
node may be named. The prompt is the work item and is passed verbatim to
every node in the dispatch; the node's `objective` is its role.

A dispatch is enqueued and gets an id. `wait: true` waits for it to
finish; `wait: false` returns the id immediately. `dispatch_wait` and
`dispatch_status` read it later. One dispatch runs at a time; the queue
is FIFO and in memory.

Each node activation creates a fresh session; nothing is resumed. The only
thing carried between nodes is the previous node's output path. No stamps,
documents, records, or engine state cross.

A dispatch ends when a terminal node completes, or on a loud defect.
`maxSteps` bounds node activations; `maxVisits` bounds repeats; exceeding
either is a defect. `budgetMs` bounds a node's session; on breach the engine
interrupts the session and defects.

## 4. The brief

The engine sends one prompt to each session:

- the helper's craft;
- the dispatch prompt;
- the node's objective;
- the upstream output path, if the node was reached by a handoff;
- the exact absolute output path, which must exist and be non-empty
  before the handoff;
- for a terminal node: an explicit "last node, do not call the handoff
  tool";
- for an unconditional node: the label `next` and its description;
- for a conditional node: every label and its description.

The brief tells the helper: write the output first, then call `handoff`
exactly once with one declared label, then stop. It must not call the
tool more than once, use an undeclared label, or write after the handoff.
A `fail` label is a route, not a session failure; the output still exists
and names what is unmet.

## 5. The handoff lever

The lever is one OpenCode V2 plugin tool, installed by the engine in the
workspace under `.opencode/plugins/handoff/`. It exposes a direct
`handoff({ label })` tool with `codemode: false`. The tool is
location-scoped; OpenCode 2.2.0 has no per-session tool definition. It
asserts the `handoff` permission and POSTs the label, the call id, and the
server-provided session id to the engine's loopback acknowledgement
endpoint, authenticated by a per-boot token.

The same plugin also exposes the interactive agent's control tools —
`dispatch`, `dispatch_wait`, `dispatch_status`, `reload`, and `graphs`.
They call the engine's loopback control endpoint with the same token.
Helper sessions are created with permissions that hide them; the
interactive agent's session sees them.

The engine's acknowledgement endpoint is authoritative:

- It binds the call to the session's current node from its own map. Any
  model-supplied identity is ignored; unknown, child, or forked sessions
  are rejected.
- It rejects an undeclared label; the tool call fails, and the helper may
  retry with a declared label.
- It rejects a second accepted handoff for the same session. That is a
  loud defect, never a route.
- It rejects the call when the node's output is missing, is not a regular
  file, or is empty; the helper may write it and retry.
- On acceptance it records the first handoff — label, call id, output
  hash — and returns success.

The engine never interrupts inside the handoff tool. After the session is
idle it verifies:

- the session outcome is `succeeded` (`failed` or `interrupted` is a
  defect);
- the accepted handoff call is present and was not followed by another
  tool call;
- the handoff's assistant message contains no sibling tool call;
- the output file is unchanged from the hash recorded at acceptance.

Only then does it route to the label's target. A session that ends without
an accepted handoff is `handoff.none`; an undeclared label is
`handoff.unknown-label`; a second accepted handoff is `handoff.multiple`;
a changed output is `output.changed`; a tool call after the handoff is
`handoff.not-last`.

A terminal node exposes no handoff tool: the session permissions deny it.
The engine waits for idle, verifies `succeeded` and the output, then
completes the dispatch.

## 6. The node lifecycle

1. Resolve the node; check `maxVisits` and `maxSteps`.
2. Create a fresh session with the helper's model and agent, a location
   at the engine's working directory, and permissions that are a leading
   `deny *`, then `handoff` for a non-terminal node, then the helper's
   allowed actions.
3. Verify the session's tool snapshot before prompting: the handoff tool
   is visible exactly for non-terminal nodes, and no tool outside the
   allowed set is visible. A mismatch is a defect before any work starts.
4. Prompt the brief and start the budget timer.
5. Wait for the handoff acknowledgement or for the session to go idle.
   The acknowledgement is authoritative; the wait endpoint's 204 is only
   an idle signal.
6. On acknowledgement, record it; keep waiting for idle; then verify the
   outcome, the message order, and the output hash.
7. Route: a terminal node completes the dispatch; otherwise the label's
   target runs next. Increment the visit count.
8. On any defect: emit it, end the dispatch with `completion
   status:"defect"`, and return to idle. The engine stays alive.

## 7. Sessions — the live contract (OpenCode 2.2.0, live-verified)

- **Attach**: the service registration file (`service.json`, XDG state
  dir, mode 0600) carries the url and password. HTTP Basic, username
  `opencode`. Health: `GET /api/info` with a pid-and-version check.
- **Create**: `POST /api/session` with an agent, a model reference
  `{ id, providerID }`, a location `{ directory }`, and permissions as
  `{ action, resource, effect }` triples. There is no `tools` field; an
  unknown `tools` key is ignored. The response is `{ data: { id } }`.
- **Prompt**: `POST /api/session/{id}/prompt`, `{ text }`.
- **Wait**: `POST /api/experimental/session/{id}/wait` answers 204 when
  the session is idle — an idle signal, never a completion. The session's
  own state (`GET /api/session/{id}` → `data.outcome`, one of
  `succeeded`, `failed`, `interrupted`) is the completion authority.
- **Tool calls**: the handoff tool receives the server-provided
  `context.sessionID` and call id. The engine observes the handoff through
  its acknowledgement endpoint. SSE `/api/event` is live but volatile —
  global, no replay, `Last-Event-ID` ignored — so it is a fast path, not
  the authority. The session's message/context history after idle is the
  durable check for ordering. Code Mode wraps tool calls; the handoff
  tool uses `codemode: false`.
- **Interrupt**: `POST /api/session/{id}/interrupt` returns a bare
  `{ interrupted: true }`; the outcome becomes `interrupted`. Do not
  interrupt inside the handoff tool.
- **Permissions**: ordered `{ action, resource, effect }`, last matching
  rule wins. A leading wildcard `deny`, then explicit allows, is
  deny-rest. A trailing wildcard deny shadows everything. An allow-only
  list is not deny-rest; unlisted tools remain visible and default to
  `ask`. Use the actions `read`, `edit`, and `shell`; the handoff action
  is the tool's permission name. Verify the session's tool snapshot
  before dispatch.
- The handoff tool plugin is location-scoped. It is not a workflow
  plugin; it is the one tool provider the engine requires.

## 8. Control surface

### 8.1 The parent surface

Pokes:

- `dispatch { graph, node, prompt }` — enqueues a dispatch; returns its id.
- `dispatch-status { id }` — `queued`, `running`, `completed`, `defect`,
  or `cancelled`.
- `dispatch-wait { id, timeoutMs? }` — wait for a dispatch.
- `pause` — a boundary pause: the active node finishes, then the dispatch
  waits.
- `resume` — continue a paused dispatch, or clear an idle pause.
- `reload` — validate and swap the config when idle; faults keep the old
  graph.
- `introspect` — `{ paused, active, queue, lastEvent, lastDefect }`; no
  history.

Notices: `version`, `ready`, `queued`, `dispatched`, `step` (begin/end),
`handoff`, `paused`, `resumed`, `completion` (completed/defect/cancelled),
`defect`, `introspection`, and `heartbeat`. Exactly one completion per
accepted dispatch. A dispatch defect ends only that dispatch; the
heartbeat continues.

### 8.2 The interactive agent's tools

The same plugin gives the user's interactive agent:

- `dispatch({ graph, node, prompt, wait?, timeoutMs? })` — enqueue; wait
  or return the id.
- `dispatch_wait({ dispatchId, timeoutMs? })` — wait for completion.
- `dispatch_status({ dispatchId })` — the live state.
- `reload()` — validate and swap the graph config; returns faults or the
  new graph list.
- `graphs()` — the config path and the current graphs and nodes.

The tools are permission-gated. Helper sessions allow only `handoff` and
their work actions; the interactive agent's session allows the control
tools.

### 8.3 The interactive agent's skills

The v1 product ships two skills for the interactive agent, installed in
the workspace's skill directory:

- **graph authoring** — the config path, schema, helper/node/handoff
  fields, validation, reload, and examples.
- **dispatching** — how to start work at any node, wait or background,
  read completion and defects, and use the queue.

The skills are guidance for the user's agent; they are not helper craft
and not engine code.

## 9. Config and the verifier

The config is one JSON file: `version`, `helpers`, and `graphs`. The
schema is strict; unknown fields are faults.

```json
{
  "version": "2",
  "helpers": [
    {
      "id": "builder",
      "model": "openrouter/~deepseek/deepseek-flash-latest",
      "permissions": ["read", "edit", "shell"],
      "craft": "Work only within the dispatched prompt's scope. Follow the repository's conventions. Write the output before you hand off."
    },
    {
      "id": "reviewer",
      "model": "openrouter/~deepseek/deepseek-flash-latest",
      "permissions": ["read", "edit", "shell"],
      "craft": "Judge the work against the dispatched prompt and the upstream output. Write your review before you hand off."
    }
  ],
  "graphs": [
    {
      "id": "build-review",
      "outputRoot": "work",
      "maxSteps": 100,
      "nodes": [
        {
          "id": "implement",
          "helper": "builder",
          "objective": "Implement the dispatched work.",
          "output": "implementation.md",
          "maxVisits": 3,
          "handoff": {
            "mode": "unconditional",
            "to": "review",
            "description": "The implementation is written and ready for review."
          }
        },
        {
          "id": "review",
          "helper": "reviewer",
          "objective": "Review the implementation against the dispatched prompt.",
          "output": "review.md",
          "maxVisits": 3,
          "handoff": {
            "mode": "conditional",
            "labels": [
              { "label": "pass", "to": "done", "description": "The work meets the objective; finish." },
              { "label": "fail", "to": "implement", "description": "The work is unmet; name exactly what must change." }
            ]
          }
        },
        {
          "id": "done",
          "helper": "builder",
          "objective": "Finalize the work and write the final report.",
          "output": "final.md",
          "handoff": { "mode": "terminal" }
        }
      ]
    }
  ]
}
```

The verifier is the boot gate:

- **Schema**: types, ids, models, permissions, output and config paths,
  unknown fields.
- **Graph**: dangling handoff targets, duplicate labels or ids, mixed
  modes, empty conditional label sets, unknown helpers, a node that
  cannot reach a terminal, no terminal node, and an unbounded cycle.
- **Limits**: `maxVisits` is 1–3 (the engine's hard ceiling; config may
  lower it), `maxSteps` is positive, `budgetMs` is positive.

The config path is the file the engine was started with; the interactive
agent edits it and calls `reload`. A reload validates the whole file:
success swaps it for subsequent dispatches, failure returns the named
faults and keeps the old graph.

Any fault refuses boot with exit 2. Runtime faults are separate: no
handoff, undeclared label, multiple handoffs, missing/empty/changed
output, failed/interrupted/timed-out session, `maxVisits`, and
`maxSteps`.

## 10. The trust boundary

The handoff contract is enforced by the engine; it is not a security
boundary against a helper with unrestricted filesystem or shell access.
The interactive agent is trusted and holds the control token; helper
sessions are not given the control tools. A helper that can read the
service registration, the engine's token, or the plugin source — or write
the workspace's `.opencode` — can still forge routing or change the
lever.

Run helpers with no access to `service.json`, engine state, or the
acknowledgement token; mount the plugin and config read-only outside the
writable workspace; make only the workspace writable. The engine rejects
unknown, child, and forked sessions and every model-supplied identity
regardless. Without that sandbox, the engine enforces routing against
cooperative helpers only, not hostile ones. The first live proof runs in a
scratch workspace with trusted helpers and says so.

## 11. Testing doctrine — reality first

No mechanism is called working until it has run against the real
OpenCode service at the cheapest size. The handoff tool, the
acknowledgement, the permission snapshot, the idle/order check, and the
output hash are live-proven or they are not claimed. Stand-in servers
mirror the 2.2.0 wire and reject drift; they never certify a tool behavior
the live server refuses.

The proof sequence is fixed: one session and one lever; one node and one
handoff; two nodes with output passing; the failure matrix (no handoff,
double, undeclared label, missing output, output changed after handoff,
session failure, timeout); the control matrix (pause, resume, introspect,
queue, busy dispatch); and the complete user pipeline — an interactive
agent authors a graph, reloads it, dispatches a prompt, waits or
backgrounds it, and receives the product.

## 12. Out of scope

The programmatic node type — a work kind that computes a label without an
agent — comes later, when a gap is found; the node's work slot is reserved
for it. The old documents, stamps, projects, records, watchers,
reconciler, delivery, entry/exit types, and the plugin ecosystem are gone.
So are parallel dispatches, durable queue recovery, and history. The
handoff tool plugin is the one required exception. The interactive
agent's two skills are in scope; they are guidance, not engine code.
