# The engine — v1.2

One ordinary program that dispatches a prompt into a graph of agent nodes.
A node's helper does the work, writes an output file, and pulls exactly one
handoff lever; the engine routes to the label's target. One dispatch runs at
a time; the rest wait in a FIFO queue.

There is one graph per engine configuration. Workflows are labelled
subsections of that graph, not separate graphs.

The full contract is `SPEC.md` at the repository root. Deferred work is
tracked in `ROADMAP.md`.

The current milestone is dogfood: use the engine to develop the engine.
Freeze the engine during a dogfood cycle, change the graph, and treat the
graph map as the contract.

## Run

From the workspace that holds the graph and the work:

```sh
node /path/to/girth-agents/engine/engine.mjs graph.json
```

The engine:

- validates the config and refuses to boot with named faults;
- writes `.opencode/plugins/engine-handoff/` (the one tool provider,
  including the `/graph` command), `.opencode/skills/{graph-authoring,dispatching}/SKILL.md`,
  and `.opencode/agents/graph-view.md` into the workspace; it removes the
  old engine-installed `.opencode/commands/graph.md`;
- writes `GRAPH.md` — the current graph as a Mermaid map, workflow table,
  and node table — and regenerates it on every valid reload;
- preflights the plugin against the live OpenCode server;
- speaks JSON-lines on stdin/stdout (notices), with logs on stderr.

The `GRAPH.md` artifact is the graph as a thing. `/graph` is the same view
inside the chat.

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

Type `/graph` in an interactive session. It takes no arguments and has no
subcommands. The plugin command runs `engine/graph-view.mjs` for the exact
text, switches the session to the read-only `graph-view` agent for one
reply, then restores the previous agent. That agent cannot dispatch work.
The CLI asks the running engine for the map; if the engine is down, it
renders the same map from the config and says so. It prints, verbatim:

- a Mermaid map with the workflow box, entry/exit, node ids, helpers, and
  `↻ resume` / `✦ fresh` session markers;
- a workflow table;
- a node table with objective, output, session, handoff, and max visits;
- the legend and the one-line live state.

No narrative, no graph id, no subcommands. The same content is in
`GRAPH.md`, so the graph can stay open beside the chat independently of the
agent.

## The interactive agent

New sessions in the workspace see the plugin tools:

- `dispatch({ node, prompt, wait?, timeoutMs? })`
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
- **dispatching** — start at any node, wait or background, cancel, report.

A session that existed before the engine installed the plugin/skills may
need a new session to see them.

## Config

A single JSON file: `version`, `helpers`, `graph`. See
`engine/example-graph.json`. Any node may be a dispatch entry point. A node's
handoff is `terminal`, `unconditional` (label `next`), or `conditional`
(labels with one target each). Every node must reach a terminal; every cycle
must carry `maxVisits` (1–100; the shipped graph uses 20).

The graph may carry `workflows`: labelled subsections with an `entry`, an
`exit`, and a node list. They are views for reasoning, not containers; the
engine routes by handoffs, not by workflow.

A node may carry `session: "fresh"` (the default) or `"resume"`. The
implementation node in the sample uses `resume`: the same builder session
comes back on a fail loop with the reviewer's output in its context. The
reviewer is always `fresh`: a new session on every review pass.

## Live proof

From `engine/`:

```sh
node live-proof.mjs
```

It creates a scratch workspace under `/tmp/opencode`, starts the engine, and
proves:

1. one graph boots, `GRAPH.md` and the read-only `/graph` command are
   generated, and the CLI map leaves the engine idle;
2. a stdio dispatch runs the build-review graph to its terminal and reports
   cost and tokens;
3. a second dispatch queues behind the active one and both complete;
4. the interactive agent dispatches through the plugin tool and waits;
5. a queued dispatch and the active dispatch are cancelled without killing
   the engine;
6. the interactive agent edits the graph, calls `reload`, and both the
   engine and `GRAPH.md` swap it.

It uses the real OpenCode service and the real handoff plugin. It spends a
small amount on the helper models. The builder-resume/reviewer-fresh
regression is covered by the offline executor test, not by a second
workflow in the product graph.

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
