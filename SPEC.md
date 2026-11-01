# The engine — specification

> **Design correction (2026-10-31).** The current implementation is off-spec
> in its graph configuration architecture; the handoff and dispatch surfaces
> below are implemented. The target contract is:
>
> - graph agents are the only node execution type;
> - one generated handoff tool per declared label, named exactly the label,
>   taking `{ message }`;
> - a graph agent receives its configured tools plus only its active node's
>   generated handoff tools;
> - the dispatcher's return is the same open-ended `dispatch` tool with
>   `resume: true`; there is no separate reply/resume/answer tool;
> - dispatch mirrors the subagent tool: foreground blocks; `background: true`
>   returns an id and notifies on completion; there is no `dispatch_wait`;
> - a dispatcher handoff completes the dispatch and retains the source graph
>   agent session as the origin for a return message; there is no
>   `input-required` state;
> - configuration is one file per node and one Markdown document per graph
>   agent type; a node's `agent` key references the graph agent type. The exact
>   file layout, graph assembly, node schema, graph agent Markdown schema, and
>   schema version are open.
>
> The sections below describe the current implementation where they conflict
> with this block. The design memo is the detailed record.

One ordinary program, always running, that dispatches a prompt into a
graph of agent nodes. A node's graph agent does the work and calls exactly one
generated handoff tool; the engine maps the tool to the next target and
continues. Single-threaded, synchronous: one active dispatch with a FIFO
queue behind it. The user's interactive agent can author the graph and
dispatch work into it. The graph is config; the engine knows nodes, graph
agents, handoffs, workflows as named views and optional dispatch boundaries,
and the live session contract. It routes by handoffs, never by workflow.

## 1. The process

The engine boots from a config or not at all. It runs the verifier before
it announces ready; any config fault is a refusal: exit 2, the broken
constraint named on stderr.

It speaks JSON-lines over stdio: pokes in, notices out; human logs on
stderr. One dispatch runs at a time; further dispatches wait in a FIFO
queue. There are no projects, no run objects, no durable state, and no durable
history. The active dispatch and the queue are live memory; the dashboard's
bounded activity history is also live memory. A restart loses them. The engine's working directory is the workspace; output
paths, the config, and the generated handoff tools are resolved against it.

The config may be reloaded while idle: a `reload` validates the file,
swaps it on success, and returns named faults on failure while keeping
the old graph. A reload during an active dispatch is rejected; the agent
retries at the next boundary.

Whatever starts the engine starts it; whatever stops it stops it. EOF,
SIGTERM, or SIGINT interrupts the active session and exits.

## 2. The graph

The current implementation keeps one aggregate graph with `outputRoot`,
`maxSteps`, `workflows`, and `nodes`. There is no graph id, no graph selector,
and no "all graphs"; a second graph is a separate config and a separate
ruling, not part of this schema. The target file-per-node layout and graph
assembly are open.

A node is one graph agent activation and its handoff surface. A node has an
`id`, an `agent` key referencing a graph agent type, `objective`, optional
`output`, optional `budgetMs`, optional `maxVisits`, and a `handoff`.

Any node may be a dispatch entry point. A workflow may be dispatched at
its entry. The interactive agent chooses a node or workflow. Every node
must be able to reach a terminal target, and every cycle must be bounded.

A graph agent type is a Markdown configuration document. It declares its
model, tool/permission set, and instructions. The exact frontmatter/body
schema is open.

A **handoff** is exactly one of:

- **terminal** — no handoff tool; the node ends after its session writes any
  declared output.
- **unconditional** — one target; the engine generates a handoff tool named
  `next`.
- **conditional** — a non-empty set of labels; each label names exactly one
  target and carries a description. The engine generates one handoff tool per
  label, named exactly the label.

No node mixes modes. Every label resolves to exactly one target. There is
no catch-all. A label that is not declared is a loud defect; a non-terminal
node whose session ends without an accepted handoff is a loud defect.

The engine generates the handoff tools for the active node. A graph agent
receives its configured tools plus only those generated handoff tools; it does
not receive another node's generated handoff tools. Each generated handoff
tool takes `{ message }`. The message is the context passed to the target.

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

The dispatch input is `{ node?, workflow?, prompt, background?, resume?, dispatchId? }`.
Exactly one of `node` or `workflow` is supplied, and the prompt must be
non-empty. A node
target may be any node. A workflow target starts at the workflow's entry and
records that workflow as the dispatch's main workflow. The prompt is the
work item and is passed verbatim to every node in the dispatch; the node's
`objective` is its role.

A workflow dispatch carries its main workflow in status. The allowed
boundary is the main workflow plus its transitive `connections`. If the
active node leaves that boundary, strict workflows defect; non-strict
workflows continue and the dashboard shows an escape.

A dispatch is enqueued and gets an id. Foreground is the default: the
dispatch tool blocks until the focused result or defect. `background: true`
returns the id immediately and the engine pushes a completion or defect
notification into the interactive session. `dispatch_status` is a
read-only diagnostic snapshot, not a normal waiting step. One dispatch runs at
a time; the queue is FIFO and in memory. `dispatch_cancel` removes a queued
dispatch or interrupts the active one; a cancelled dispatch ends with `status:
"cancelled"`, never a defect.

`resume: true` is the same dispatch tool's return form. It requires a `node`
target that is the origin of the input the dispatcher received, delivers the
prompt as the message, and resumes that node's session. It is not a separate
reply/answer tool. `workflow` plus `resume: true` is invalid; a target that is
not the origin is `resume.not-return`, and an ambiguous origin is
`handoff.ambiguous`.

Each dispatch starts with a fresh session. Session retention is a handoff
decision: a non-terminal handoff may set `"resume": true`; false or omitted
starts a new session. `resume` is honored only when the handoff target is
the node that supplied the current input. The engine retains that target
session for the return, and the resumed brief includes the upstream message
and, when the source declared one, the upstream output path. A `resume: true`
handoff to any other node is a loud `resume.not-return` defect. Retained sessions are deleted at dispatch end;
fresh sessions are deleted after their visit.

The handoff message and any declared output path are carried between nodes.
No stamps, documents, records, or engine state cross.

A dispatch ends when a terminal target completes, a dispatcher handoff
completes, or on a loud defect. `maxSteps` bounds node activations;
`maxVisits` bounds repeats; exceeding either is a defect. `budgetMs` bounds a
node's session; on breach the engine interrupts the session and defects.

A node may declare `$dispatcher` as a handoff target. A dispatcher handoff
completes the dispatch and returns its message as the focused response, and
retains the source node session as the origin for a return. A `$dispatcher`
label cannot set `resume: true`. The
dispatcher sends a message back with the same `dispatch` tool, targeting that
node with `resume: true`; the source node resumes with the message as upstream
context. There is no `input-required` state and no separate reply/resume/answer
tool.

## 4. The brief

The engine sends one prompt to each session:

- the graph agent's instructions;
- the dispatch prompt;
- the node's objective;
- the upstream handoff message, if the node was reached by a handoff;
- the upstream output path, if the node was reached by a handoff and the
  source declared an output;
- the exact absolute output path, if this node declares an output;
- for a terminal node: an explicit "last node, do not call a handoff tool";
- for an unconditional node: the generated `next` tool and its description;
- for a conditional node: every generated handoff tool and its description.

The brief tells the graph agent: write any declared output first, then call
the generated handoff tool named after the chosen label exactly once with a
`message`, then stop. It must not call a handoff tool more than once or write
after the handoff. A `fail` label is a route, not a session failure.

## 5. The generated handoff tools

The clarified handoff surface is one generated OpenCode V2 plugin tool per
declared label, named exactly the label. The tools are installed by the engine
in the workspace under `.opencode/plugins/engine-handoff/` with
`codemode: false`. Each tool takes `{ message }`, asserts the `handoff`
permission, and POSTs its label, the message, the call id, and the
server-provided session id to the engine's loopback acknowledgement endpoint,
authenticated by a per-boot token.

The same plugin also exposes the interactive agent's control tools —
`dispatch`, `dispatch_status`, `dispatch_cancel`, `reload`, `graph_info`, and
`graph_map`. They call the engine's loopback control endpoint with the same
token. Graph agent sessions are created with permissions that hide them; the
interactive agent's session sees them.

The engine's acknowledgement endpoint is authoritative:

- It binds the call to the session's current node from its own map. Any
  model-supplied identity is ignored; unknown, child, or forked sessions
  are rejected.
- It rejects a generated tool that is not declared for the node; the tool
  call fails, and the graph agent may retry with a declared tool.
- It rejects a second accepted handoff for the same session. That is a
  loud defect, never a route.
- If the node declares an output, it rejects the call when the output is
  missing, is not a regular file, or is empty; the graph agent may write it
  and retry.
- On acceptance it records the first handoff — label, message, call id,
  output hash if declared — and returns success.

The engine never interrupts inside a handoff tool. After the session is
idle it verifies:

- the session outcome is `succeeded` (`failed` or `interrupted` is a
  defect);
- the accepted handoff call is present and was not followed by another
  tool call;
- the handoff's assistant message contains no sibling tool call;
- if the node declares an output, the file is unchanged from the hash
  recorded at acceptance.

Only then does it route to the label's target. A session that ends without
an accepted handoff is `handoff.none`; an undeclared tool is
`handoff.unknown-tool`; a second accepted handoff is `handoff.multiple`;
a changed output is `output.changed`; a tool call after the handoff is
`handoff.not-last`.

A node or dispatcher target can be the label's target. A dispatcher target
completes the dispatch with the message as the focused response and retains
the source node session as the origin for a return. A terminal target
exposes no generated handoff tools: the session permissions deny them. The
engine waits for idle, verifies `succeeded` and any declared output, then
completes the dispatch.

## 6. The node lifecycle

1. Resolve the node; check `maxVisits` and `maxSteps`.
2. Create or reuse the node's session from the incoming handoff. A fresh
   entry creates a session from the graph agent definition, at the engine's
   working directory, with permissions that are a leading `deny *`, then the
   generated handoff tools for a non-terminal node, then the graph agent's
   configured tools. A `resume: true` handoff to the node that supplied the
   current input reuses that node's retained session; any non-resume handoff
   starts fresh, and a `resume: true` handoff to any other node is a
   `resume.not-return` defect.
3. The graph agent session's permissions are the tool gate: a leading
   `deny *`, then the generated handoff tools for a non-terminal node, then
   the graph agent's configured tools. The interactive control tools are not
   in that list; they are hidden from the graph agent.
4. Prompt the brief and start the budget timer.
5. Wait for the handoff acknowledgement or for the session to go idle.
   The acknowledgement is authoritative; the wait endpoint's 204 is only
   an idle signal.
6. On acknowledgement, record it; keep waiting for idle; then verify the
   outcome, the message order, and any declared output hash.
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
- **Tool calls**: a generated handoff tool receives the server-provided
  `context.sessionID` and call id. The engine observes the handoff through
  its acknowledgement endpoint. SSE `/api/event` is live but volatile —
  global, no replay, `Last-Event-ID` ignored — so it is a fast path, not
  the authority. The session's message/context history after idle is the
  durable check for ordering. Code Mode wraps tool calls; generated handoff
  tools use `codemode: false`.
- **Interrupt**: `POST /api/session/{id}/interrupt` returns a bare
  `{ interrupted: true }`; the outcome becomes `interrupted`. Do not
  interrupt inside a handoff tool.
- **Permissions**: ordered `{ action, resource, effect }`, last matching
  rule wins. A leading wildcard `deny`, then explicit allows, is
  deny-rest. A trailing wildcard deny shadows everything. An allow-only
  list is not deny-rest; unlisted tools remain visible and default to
  `ask`. Use the actions `read`, `edit`, and `shell`; the handoff action
  is the tool's permission name. The engine creates every graph agent session
  with the leading deny, then the handoff allow, then the graph agent's
  actions; a per-session snapshot assertion is v1.1 hardening.
- The generated handoff tool plugin is location-scoped. It is not a workflow
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

- `dispatch({ node?, workflow?, prompt, background?, resume?, dispatchId? })`
  — enqueue; foreground by default, return the id for background work, or
  send a message back to the origin with `resume: true`.
- `dispatch_status({ dispatchId })` — read-only diagnostic state.
- `dispatch_cancel({ dispatchId })` — cancel a queued or active dispatch.
- `reload()` — validate and swap the graph config; returns faults or the
  graph summary.
- `graph_info()` — the config path and the one graph's workflows, nodes,
  and graph agents.
- `graph_map()` — the deterministic Mermaid map, workflow table, node
  table, legend, and live state.

The tools are permission-gated. Graph agent sessions allow only the
generated handoff tools and their configured work actions; the interactive
agent's session allows the control tools. There is no `graphs()` tool and no
graph id anywhere in the surface.

### 8.3 The interactive agent's skills

The v1 product ships two skills for the interactive agent, installed in
the workspace's skill directory:

- **graph authoring** — the config path, schema, graph-agent/node/handoff
  fields, validation, reload, and examples.
- **dispatching** — how to start work at a node or workflow, wait or
  background, read completion and defects, and use the queue.

The skills are guidance for the user's agent; they are not graph agent craft
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

The current implementation uses one JSON file with `version`, a legacy
`agents` array, and `graph`. The schema is strict; unknown fields are faults.
The current config version is `"3"`.

The clarified target is one configuration file per node and one Markdown
document per graph agent type; a node's `agent` key references the graph agent
type. The exact file layout, graph assembly, node schema, graph agent Markdown
schema, and schema version are open. The JSON below is the current aggregate
shape, not the target.

```json
{
  "version": "3",
  "agents": [
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
        "agent": "builder",
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
        "agent": "reviewer",
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
        "agent": "builder",
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
boundary against a graph agent with unrestricted filesystem or shell access.
The interactive agent is trusted and holds the control token; graph agent
sessions are not given the control tools. A graph agent that can read the
service registration, the engine's token, or the plugin source — or write
the workspace's `.opencode` — can still forge routing or change the handoff
surface.

Run graph agents with no access to `service.json`, engine state, or the
acknowledgement token; mount the plugin and config read-only outside the
writable workspace; make only the workspace writable. The engine rejects
unknown, child, and forked sessions and every model-supplied identity
regardless. Without that sandbox, the engine enforces routing against
cooperative graph agents only, not hostile ones. The first live proof runs in a
scratch workspace with trusted graph agents and says so.

## 11. Testing doctrine — reality first

No mechanism is called working until it has run against the real
OpenCode service at the cheapest size. The generated handoff tools, the
acknowledgement, the permission gate, the idle/order check, and the
output hash are live-proven or they are not claimed. Stand-in servers
mirror the 2.2.0 wire and reject drift; they never certify a tool behavior
the live server refuses.

The proof sequence is fixed: one session and one generated handoff tool; one
node and one handoff; two nodes with output passing; the failure matrix (no
handoff, double, undeclared tool, missing declared output, output changed
after handoff, session failure, interrupt, timeout); the control matrix
(pause, resume, introspect, queue, busy dispatch, cancel queued, cancel
active); the session regression (an offline fake-driver test proves the
resuming graph agent's session id is identical across its visits while the
reviewing graph agent's session ids differ on every visit, and the resumed
brief carries the reviewer's output — no second workflow is added to the
product graph); and the complete user pipeline — an interactive agent
authors a graph, reloads
it, dispatches a prompt, waits or backgrounds it, receives the product and
its cost, cancels work, and exposes the read-only graph artifact/runtime.

## 12. Out of scope

The programmatic node type — a work kind that computes a label without an
agent — comes later, when a gap is found; the node's work slot is reserved
for it. The old documents, stamps, projects, records, watchers,
reconciler, delivery, entry/exit types, and the plugin ecosystem are gone.
So are parallel dispatches, multiple separate graphs, durable queue
recovery, dispatch history, per-dispatch output isolation, and a hard
cost budget. The generated handoff tool plugin is the one required exception.
The interactive agent's two skills are in scope; they are guidance, not
engine code.
