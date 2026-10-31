# The engine — specification

One ordinary program, always running, that dispatches a prompt into a
graph of agent nodes. A node's helper does the work, writes an output,
and pulls exactly one handoff lever; the engine maps the lever to the
next node and continues. Single-threaded, synchronous: one active
dispatch with a FIFO queue behind it. The user's interactive agent can
author the graph and dispatch work into it. The graph is config; the
engine knows nodes, handoffs, workflows as named views and optional
dispatch boundaries, and the live session contract. It routes by
handoffs, never by workflow.

## 1. The process

The engine boots from a config or not at all. It runs the verifier before
it announces ready; any config fault is a refusal: exit 2, the broken
constraint named on stderr.

It speaks JSON-lines over stdio: pokes in, notices out; human logs on
stderr. One dispatch runs at a time; further dispatches wait in a FIFO
queue. There are no projects, no run objects, no durable state, and no durable
history. The active dispatch and the queue are live memory; the dashboard's
bounded activity history is also live memory. A restart loses them. The engine's working directory is the workspace; output
paths, the config, and the handoff tool are resolved against it.

The config may be reloaded while idle: a `reload` validates the file,
swaps it on success, and returns named faults on failure while keeping
the old graph. A reload during an active dispatch is rejected; the agent
retries at the next boundary.

Whatever starts the engine starts it; whatever stops it stops it. EOF,
SIGTERM, or SIGINT interrupts the active session and exits.

## 2. The graph

The config has exactly one graph. A graph has `outputRoot`, `maxSteps`,
`workflows`, and `nodes`. There is no graph id, no graph selector, and no
"all graphs"; a second graph is a separate config and a separate ruling,
not part of this schema.

A node is one agent activation and its handoff surface. A node has an `id`,
`helper`, `objective`, `output`, optional `budgetMs`,
optional `maxVisits`, and a `handoff`.

Any node may be a dispatch entry point. A workflow may be dispatched at
its entry. The interactive agent chooses a node or workflow. Every node
must be able to reach a terminal node, and every cycle must be bounded.

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

### Workflows

A workflow is a labelled subsection of a graph:

```json
{
  "id": "build-review",
  "entry": "implement",
  "exit": "done",
  "nodes": ["implement", "review", "done"],
  "connections": ["review-only"],
  "strict": false
}
```

It is a view for reasoning and an optional dispatch target. The nodes and
edges belong to the graph; a node may be in zero, one, or multiple
workflows. `connections` names workflows reachable from this workflow; it
does not define graph edges. The allowed boundary of a workflow dispatch
is the main workflow plus the transitive closure of its connections.
`strict: true` makes a handoff outside that boundary a `workflow.escape`
defect; otherwise the escape is allowed and is visual in the dashboard.
The entry and exit are designated for reasoning; a node dispatch may start
anywhere. The engine routes by handoffs, never by workflow.

## 3. Dispatch

The dispatch input is `{ node?, workflow?, prompt, wait? }`. Exactly one of
`node` or `workflow` is supplied, and the prompt must be non-empty. A node
target may be any node. A workflow target starts at the workflow's entry and
records that workflow as the dispatch's main workflow. The prompt is the
work item and is passed verbatim to every node in the dispatch; the node's
`objective` is its role.

A workflow dispatch carries its main workflow in status. The allowed
boundary is the main workflow plus its transitive `connections`. If the
active node leaves that boundary, strict workflows defect; non-strict
workflows continue and the dashboard shows an escape.

A dispatch is enqueued and gets an id. `wait: true` waits for it to
finish; `wait: false` returns the id immediately. `dispatch_wait` and
`dispatch_status` read it later. One dispatch runs at a time; the queue
is FIFO and in memory. `dispatch_cancel` removes a queued dispatch or
interrupts the active one; a cancelled dispatch ends with `status:
"cancelled"`, never a defect.

Each dispatch starts with a fresh session. Session retention is a handoff
decision: a non-terminal handoff may set `"resume": true`; false or omitted
starts a new session. `resume` is honored only when the handoff target is
the node that supplied the current input. The engine retains that target
session for the return, and the resumed brief includes the upstream output
path. A `resume: true` handoff to any other node is a loud
`resume.not-return` defect. Retained sessions are deleted at dispatch end;
fresh sessions are deleted after their visit.

The only thing carried between nodes is the previous node's output path. No
stamps, documents, records, or engine state cross.

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
workspace under `.opencode/plugins/engine-handoff/`. It exposes a direct
`handoff({ label })` tool with `codemode: false`. The tool is
location-scoped; OpenCode 2.2.0 has no per-session tool definition. It
asserts the `handoff` permission and POSTs the label, the call id, and the
server-provided session id to the engine's loopback acknowledgement
endpoint, authenticated by a per-boot token.

The same plugin also exposes the interactive agent's control tools —
`dispatch`, `dispatch_wait`, `dispatch_status`, `dispatch_cancel`, `reload`,
`graph_info`, and `graph_map`. They call the engine's loopback control
endpoint with the same token. Helper sessions are created with permissions
that hide them; the interactive agent's session sees them.

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
2. Create or reuse the node's session from the incoming handoff. A fresh
   entry creates a session with the helper's model and agent, a location at
   the engine's working directory, and permissions that are a leading
   `deny *`, then `handoff` for a non-terminal node, then the helper's
   allowed actions. A `resume: true` handoff to the node that supplied the
   current input reuses that node's retained session; any non-resume
   handoff starts fresh, and a `resume: true` handoff to any other node is
   a `resume.not-return` defect.
3. The helper session's permissions are the tool gate: a leading
   `deny *`, then `handoff` for a non-terminal node, then the helper's
   allowed actions. The interactive control tools are not in that list;
   they are hidden from the helper.
4. Prompt the brief and start the budget timer.
5. Wait for the handoff acknowledgement or for the session to go idle.
   The acknowledgement is authoritative; the wait endpoint's 204 is only
   an idle signal.
6. On acknowledgement, record it; keep waiting for idle; then verify the
   outcome, the message order, and the output hash.
7. Route: a terminal node completes the dispatch; otherwise the label's
   target runs next. Increment the visit count.
8. On any defect or cancellation: emit the completion, delete the
   dispatch's fresh and resume sessions, end the dispatch with
   `completion status:"defect"` or `"cancelled"`, and return to idle. The
   engine stays alive. The same cleanup runs after a terminal completion.

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
  is the tool's permission name. The engine creates every helper session
  with the leading deny, then the handoff allow, then the helper's
  actions; a per-session snapshot assertion is v1.1 hardening.
- The handoff tool plugin is location-scoped. It is not a workflow
  plugin; it is the one tool provider the engine requires.

## 8. Control surface

### 8.1 The parent surface

Pokes:

- `dispatch { node?, workflow?, prompt }` — enqueues exactly one target; returns its id.
- `dispatch-status { id }` — `queued`, `running`, `completed`,
  `defect`, or `cancelled`.
- `dispatch-wait { id, timeoutMs? }` — wait for a dispatch.
- `dispatch-cancel { id }` — remove a queued dispatch, or interrupt and
  cancel the active dispatch.
- `pause` — a boundary pause: the active node finishes, then the dispatch
  waits.
- `resume` — continue a paused dispatch, or clear an idle pause.
- `reload` — validate and swap the config when idle; faults keep the old
  graph.
- `introspect` — `{ paused, active, queue, lastEvent, lastDefect, history,
  historyEpoch }`; the same structured activity history exposed by
  `graph-map`.

Notices: `version`, `ready`, `queued`, `dispatched`, `step` (begin/end),
`handoff`, `paused`, `resumed`, `completion` (completed/defect/cancelled),
`defect`, `introspection`, and `heartbeat`. Step and completion notices
carry the dispatch's cost and token usage. Exactly one completion per
accepted dispatch. A dispatch defect ends only that dispatch; the
heartbeat continues.

### 8.2 The interactive agent's tools

The same plugin gives the user's interactive agent:

- `dispatch({ node?, workflow?, prompt, wait?, timeoutMs? })` — enqueue; wait or
  return the id.
- `dispatch_wait({ dispatchId, timeoutMs? })` — wait for completion.
- `dispatch_status({ dispatchId })` — the live state.
- `dispatch_cancel({ dispatchId })` — cancel a queued or active dispatch.
- `reload()` — validate and swap the graph config; returns faults or the
  graph summary.
- `graph_info()` — the config path and the one graph's workflows, nodes,
  and helpers.
- `graph_map()` — the deterministic Mermaid map, workflow table, node
  table, legend, and live state.

The tools are permission-gated. Helper sessions allow only `handoff` and
their work actions; the interactive agent's session allows the control
tools. There is no `graphs()` tool and no graph id anywhere in the
surface.

### 8.3 The interactive agent's skills

The v1 product ships two skills for the interactive agent, installed in
the workspace's skill directory:

- **graph authoring** — the config path, schema, helper/node/handoff
  fields, validation, reload, and examples.
- **dispatching** — how to start work at a node or workflow, wait or
  background, read completion and defects, and use the queue.

The skills are guidance for the user's agent; they are not helper craft
and not engine code.

### 8.4 The graph view

`graph_map` is the graph as a thing: the engine generates a Mermaid map, a
workflow table, a node table, a legend, a one-line state, and a structured
`runtime` object from the config, the queue, and engine event state. The agent prints them; it does not author, summarize,
or explain them.

Every valid reload and every boot writes the map and tables to `GRAPH.md`
in the workspace, so the graph can be read independently of the agent. The
interim `/graph` chat command and its `graph-view` primary agent were
removed; the native dashboard in `DASHBOARD-SPEC.md` is the replacement
surface. The engine exposes `graph_map` and structured runtime state for
that dashboard.

The map is a view of the config, not a second source of truth. The node table
shows handoff labels and whether a return handoff resumes the target session;
the workflow box and entry/exit come from `workflows`; the node table carries objective, output,
handoff, and max visits. The live state comes from the queue.

The native dashboard is implemented in the tracked `dashboard/` package and
loaded as the OpenCode TUI plugin. It consumes `graph-info`, `graph-map`
structured runtime (including `runtime.history` and `runtime.historyEpoch`),
`dispatch/status`, and the graph config directly; it never parses the
human-readable state string. The activity history is a bounded, session
(engine-process) ring that resets on restart. The real `DashboardView` is
captured headlessly at 160x50, 120x40, and 80x24, including an idle state
with populated History and empty Details. The live boundary proof and
captures are under `dashboard/proof/` and use the runnable non-strict and
strict fixtures `dashboard/fixtures/live-boundary.json` and
`dashboard/fixtures/live-boundary-strict.json`.

## 9. Config and the verifier

The config is one JSON file: `version`, `helpers`, and `graph`. The schema
is strict; unknown fields are faults. Config version is the string `"3"`.

```json
{
  "version": "3",
  "helpers": [
    {
      "id": "builder",
      "model": "openrouter/~deepseek/deepseek-flash-latest",
      "agent": "build",
      "permissions": [
        "read",
        "edit",
        "shell"
      ],
      "craft": "Work only within the dispatched prompt's scope. Follow the repository's conventions. Write the output file before you hand off."
    },
    {
      "id": "reviewer",
      "model": "openrouter/~deepseek/deepseek-flash-latest",
      "agent": "build",
      "permissions": [
        "read",
        "edit",
        "shell"
      ],
      "craft": "Judge the work against the dispatched prompt and the upstream output. Write your review before you hand off."
    }
  ],
  "graph": {
    "outputRoot": "work",
    "maxSteps": 100,
    "workflows": [
      {
        "id": "build-review",
        "entry": "implement",
        "exit": "done",
        "nodes": [
          "implement",
          "review",
          "done"
        ]
      }
    ],
    "nodes": [
      {
        "id": "implement",
        "helper": "builder",
        "objective": "Implement the dispatched work.",
        "output": "implementation.md",
        "maxVisits": 20,
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
        "maxVisits": 20,
        "handoff": {
          "mode": "conditional",
          "labels": [
            {
              "label": "pass",
              "to": "done",
              "description": "The work meets the objective; finish."
            },
            {
              "label": "fail",
              "to": "implement",
              "description": "The work is unmet; name exactly what must change.",
              "resume": true
            }
          ]
        }
      },
      {
        "id": "done",
        "helper": "builder",
        "objective": "Finalize the work and write the final report.",
        "output": "final.md",
        "handoff": {
          "mode": "terminal"
        }
      }
    ]
  }
}
```

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
acknowledgement, the permission gate, the idle/order check, and the
output hash are live-proven or they are not claimed. Stand-in servers
mirror the 2.2.0 wire and reject drift; they never certify a tool behavior
the live server refuses.

The proof sequence is fixed: one session and one lever; one node and one
handoff; two nodes with output passing; the failure matrix (no handoff,
double, undeclared label, missing output, output changed after handoff,
session failure, interrupt, timeout); the control matrix (pause, resume,
introspect, queue, busy dispatch, cancel queued, cancel active); the
session regression (an offline fake-driver test proves the builder's
session id is identical across its three visits while the reviewer's
session ids differ on every visit, and the resumed brief carries the
reviewer's output — no second workflow is added to the product graph); and
the complete user pipeline — an interactive agent authors a graph, reloads
it, dispatches a prompt, waits or backgrounds it, receives the product and
its cost, cancels work, and exposes the read-only graph artifact/runtime.

## 12. Out of scope

The programmatic node type — a work kind that computes a label without an
agent — comes later, when a gap is found; the node's work slot is reserved
for it. The old documents, stamps, projects, records, watchers,
reconciler, delivery, entry/exit types, and the plugin ecosystem are gone.
So are parallel dispatches, multiple separate graphs, durable queue
recovery, dispatch history, per-dispatch output isolation, and a hard
cost budget. The handoff tool plugin is the one required exception. The
interactive agent's two skills are in scope; they are guidance, not engine
code.
