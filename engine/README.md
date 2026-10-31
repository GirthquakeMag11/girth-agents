# The engine — v1.3

One ordinary program that dispatches a prompt into a graph of agent nodes.
A node's helper does the work, writes an output file, and pulls exactly one
handoff lever; the engine routes to the label's target. One dispatch runs at
a time; the rest wait in a FIFO queue.

There is one graph per engine configuration. Workflows are labelled
subsections of that graph, not separate graphs.

The full contract is `SPEC.md` at the repository root. Deferred work is
tracked in `ROADMAP.md`.

The workflow-boundary/native-dashboard slice is v1.3. The native dashboard
is implemented and live-proofed; dogfood can resume after the ticket 009
review. The v1.2 freeze is lifted for this slice; engine semantics changed
for workflow dispatch, connections, strict boundaries, structured runtime,
and route-scoped session resume.

## Run

From the workspace that holds the graph and the work:

```sh
node /path/to/girth-agents/engine/engine.mjs graph.json
```

The config path is the only argument that boots the engine. Two flags answer
without a config file or a running OpenCode service:

```sh
node /path/to/girth-agents/engine/engine.mjs --version   # girth-agents v1.3.0
node /path/to/girth-agents/engine/engine.mjs --help      # usage block
```

Both print to stdout and exit 0. With no config path the engine prints
`engine: no config path given` to stderr and exits 2.

The engine:

- validates the config and refuses to boot with named faults;
- writes `.opencode/plugins/engine-handoff/` (the one tool provider) and
  `.opencode/skills/{graph-authoring,dispatching}/SKILL.md` into the
  workspace; it removes the old engine-installed `/graph` command and
  `graph-view` agent;
- writes `GRAPH.md` — the current graph as a Mermaid map, workflow table,
  and node table — and regenerates it on every valid reload;
- preflights the plugin against the live OpenCode server;
- speaks JSON-lines on stdin/stdout (notices), with logs on stderr.

The `GRAPH.md` artifact is the graph as a thing. The native dashboard in
`DASHBOARD-SPEC.md` is the interactive view; the interim `/graph` chat
command and `graph-view` agent are removed.

The OpenCode server must already be running. The engine attaches to the
registration at `~/.local/state/opencode/service.json` (or
`OPENCODE_SERVICE_FILE`). The engine's working directory is the workspace;
`outputRoot` and the config path are resolved against it.

## Dispatch

Over stdio:

```json
{"kind":"dispatch","node":"implement","prompt":"The work item."}
```

Then `dispatch-status` / `dispatch-wait` with the returned `dispatchId`.
`dispatch-cancel`, `pause`, `resume`, `reload`, and `introspect` are also
pokes. `ready`, `queued`, `dispatched`, `step`, `handoff`, `completion`,
`defect`, `reloaded`, `introspection`, and `heartbeat` are notices. Step and
completion notices carry the dispatch's cost and token usage.

## The graph view

`GRAPH.md` is written on boot and every valid reload. It contains the
Mermaid map, workflow table, node table, and legend. The native dashboard
reads the graph config and the engine's structured runtime state; it does
not use the old chat command or `graph-view` agent.

## The interactive agent

New sessions in the workspace see the plugin tools:

- `dispatch({ node?, workflow?, prompt, wait?, timeoutMs? })`
- `dispatch_wait({ dispatchId, timeoutMs? })`
- `dispatch_status({ dispatchId })`
- `dispatch_cancel({ dispatchId })`
- `reload()`
- `graph_info()`
- `graph_map()`

`wait: true` blocks like a normal task; `wait: false` returns the dispatch
id immediately. `dispatch_cancel` removes a queued dispatch or interrupts
the active one. The two installed skills are the guidance:

- **graph-authoring** — the config path, schema, validation, and reload.
- **dispatching** — start at a node or workflow, wait or background, cancel, report.

A session that existed before the engine installed the plugin/skills may
need a new session to see them.

## Config

A single JSON file: `version`, `helpers`, `graph`. See
`engine/example-graph.json`. Any node may be a dispatch entry point. A node's
handoff is `terminal`, `unconditional` (label `next`), or `conditional`
(labels with one target each). Every node must reach a terminal; every cycle
must carry `maxVisits` (1–100; the shipped graph uses 20).

The graph may carry `workflows`: labelled subsections with an `entry`, an
`exit`, a node list, optional `connections`, and optional `strict`. They
are views for reasoning; the engine routes by handoffs. A workflow
dispatch starts at its entry and carries its main workflow boundary. A
handoff outside the main workflow and its transitive connections defects
when the main workflow is `strict: true`; otherwise it is allowed.

Session retention is a handoff decision. A non-terminal handoff may set
`"resume": true`; false or omitted starts a new session. It is honored only
when the handoff target is the node that supplied the current input. The
sample's review `fail` handoff returns to `implement` and resumes the
builder session; the reviewer itself starts fresh on every visit.

## Live proof

From `engine/`:

```sh
node live-proof.mjs
```

It creates a scratch workspace under `/tmp/opencode`, starts the engine, and
proves:

1. one graph boots and `GRAPH.md` is generated without the interim
   `/graph` command or `graph-view` agent;
2. a stdio dispatch runs the build-review graph to its terminal and reports
   cost and tokens;
3. a second dispatch queues behind the active one and both complete;
4. the interactive agent dispatches through the plugin tool and waits;
5. a queued dispatch and the active dispatch are cancelled without killing
   the engine;
6. the interactive agent edits the graph, calls `reload`, and both the
   engine and `GRAPH.md` swap it.

It uses the real OpenCode service and the real handoff plugin. It spends a
small amount on the helper models. The resume-return/reviewer-fresh
regression is covered by the offline executor test, not by a second
workflow in the product graph.

## Dashboard live proof

From the repository root:

```sh
node dashboard/proof/live.mjs 2>&1 | tee dashboard/proof/live-proof.log
```

It starts separate engines for the runnable non-strict and strict boundary
fixtures, proves queued workflow/main/node behavior, active main and
connected containers, the non-strict escape, the strict `workflow.escape`
defect, and a live config reload through the dashboard adapter. It writes
`dashboard/proof/live-proof.json` and `dashboard/proof/live-snapshot.json`.

The native panel itself is captured from the real `DashboardView` with the
OpenTUI test renderer. See `dashboard/proof/README.md` for the build and
capture commands and the 160x50 and 80x24 artifacts under
`dashboard/proof/captures/`.

## Tests

```sh
cd engine
node --test test/*.test.mjs
```

## Trust boundary

The handoff contract is enforced by the engine, not by OpenCode. It is not a
security boundary against a helper with unrestricted filesystem or shell
access: such a helper can read the service registration or the engine's
token, or rewrite the plugin. Run helpers in a separate UID/container with
only the workspace writable for adversarial safety; v1 assumes cooperative
helpers and says so.
