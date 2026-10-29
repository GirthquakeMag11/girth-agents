# The engine — v1

One ordinary program that dispatches a prompt into a graph of agent nodes.
A node's helper does the work, writes an output file, and pulls exactly one
handoff lever; the engine routes to the label's target. One dispatch runs at
a time; the rest wait in a FIFO queue.

The full contract is `SPEC.md` at the repository root. Deferred work is
tracked in `ROADMAP.md`.

## Run

From the workspace that holds the graph and the work:

```sh
node /path/to/girth-agents/engine/engine.mjs graph.json
```

The engine:

- validates the config and refuses to boot with named faults;
- writes `.opencode/plugins/engine-handoff/` (the one tool provider) and
  `.opencode/skills/{graph-authoring,dispatching}/SKILL.md` into the
  workspace;
- preflights the plugin against the live OpenCode server;
- speaks JSON-lines on stdin/stdout (notices), with logs on stderr.

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

## The interactive agent

New sessions in the workspace see the plugin tools:

- `dispatch({ graph, node, prompt, wait?, timeoutMs? })`
- `dispatch_wait({ dispatchId, timeoutMs? })`
- `dispatch_status({ dispatchId })`
- `reload()`
- `graphs()`

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
must carry `maxVisits` (1–3).

## Live proof

From `engine/`:

```sh
node live-proof.mjs
```

It creates `/tmp/opencode/v1-live`, starts the engine, and proves:

1. a stdio dispatch runs the build-review graph to its terminal;
2. a second dispatch queues behind the active one and both complete;
3. the interactive agent dispatches through the plugin tool and waits;
4. the interactive agent edits the graph, calls `reload`, and the engine
   swaps it.

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
