# The engine — v1

One ordinary program that dispatches a prompt into a graph of agent nodes.
A node's helper does the work, writes an output file, and pulls exactly one
handoff lever; the engine routes to the label's target. One dispatch runs at
a time; the rest wait in a FIFO queue.

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
- writes `.opencode/plugins/engine-handoff/` (the one tool provider),
  `.opencode/skills/{graph-authoring,dispatching}/SKILL.md`, and the
  `.opencode/commands/graph.md` command into the workspace;
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
{"kind":"dispatch","graph":"build-review","node":"implement","prompt":"The work item."}
```

Then `dispatch-status` / `dispatch-wait` with the returned `dispatchId`.
`pause`, `resume`, `reload`, and `introspect` are also pokes. `ready`,
`queued`, `dispatched`, `step`, `handoff`, `completion`, `defect`,
`reloaded`, `introspection`, and `heartbeat` are notices.

## The graph view

Type `/graph` in an interactive session. The command calls the engine's
`graph_map` tool and prints, verbatim:

- a Mermaid map with the workflow box, entry/exit, node ids, helpers, and
  `↻ resume` / `✦ fresh` session markers;
- a workflow table;
- a node table with objective, output, session, handoff, and max visits;
- the legend and the one-line live state.

No narrative, no subcommands. `/graph build-review` narrows to one graph.
The same content is in `GRAPH.md`, so the graph can stay open beside the
chat independently of the agent.

## The interactive agent

New sessions in the workspace see the plugin tools:

- `dispatch({ graph, node, prompt, wait?, timeoutMs? })`
- `dispatch_wait({ dispatchId, timeoutMs? })`
- `dispatch_status({ dispatchId })`
- `reload()`
- `graphs()`
- `graph_map({ graph? })`

`wait: true` blocks like a normal task; `wait: false` returns the dispatch
id immediately. The two installed skills are the guidance:

- **graph-authoring** — the config path, schema, validation, and reload.
- **dispatching** — start at any node, wait or background, read completion.

A session that existed before the engine installed the plugin/skills may
need a new session to see them.

## Config

A single JSON file: `version`, `helpers`, `graphs`. See
`engine/example-graph.json`. Any node may be a dispatch entry point. A node's
handoff is `terminal`, `unconditional` (label `next`), or `conditional`
(labels with one target each). Every node must reach a terminal; every cycle
must carry `maxVisits` (1–100; the shipped graph uses 20).

A graph may carry `workflows`: labelled subsections with an `entry`, an
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

It creates `/tmp/opencode/v1-live`, starts the engine, and proves:

1. `GRAPH.md` and the `/graph` command are generated;
2. a stdio dispatch runs the build-review graph to its terminal;
3. a second dispatch queues behind the active one and both complete;
4. the interactive agent dispatches through the plugin tool and waits;
5. the session-check graph shows one builder session across three visits
   and a new reviewer session on every review;
6. the interactive agent renders `graph_map` as a Mermaid map;
7. the interactive agent edits the graph, calls `reload`, and both the
   engine and `GRAPH.md` swap it.

It uses the real OpenCode service and the real handoff plugin. It spends a
small amount on the helper models.

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
