# girth-agents

An engine for a graph of agent nodes. The user's interactive agent dispatches
work into the graph; each node's graph agent does its work, writes any declared
output, and hands off a message to exactly one next target. One graph, one
active dispatch at a time, a FIFO queue behind it.

## Run

From the workspace that holds the graph and the work:

```sh
node /path/to/girth-agents/engine/engine.mjs graph.json
```

The OpenCode background server must already be running. The engine attaches to
the service registration at `~/.local/state/opencode/service.json` (or
`OPENCODE_SERVICE_FILE`). It validates the config, generates
`.opencode/plugins/engine-handoff/` and the two runtime skills, writes
`GRAPH.md`, and exposes the graph tools to new sessions.

## Tools

The interactive agent sees:

- `dispatch({ node?, workflow?, prompt, background?, resume?, dispatchId? })`
- `dispatch_status({ dispatchId, raw? })`
- `dispatch_cancel({ dispatchId })`
- `reload()`
- `graph_info()`
- `graph_map()`

A node's graph agent sees its configured tools plus generated handoff tools
named after the active node's labels. There is no separate reply, answer,
request-input, or wait tool.

## Dashboard

The native dashboard is the read-only `graph-dashboard` UI plugin in
`dashboard/src`. It opens as a full-screen OpenCode panel from the palette. It
shows the configured graph, workflow engagement, active and queued dispatches,
Details, and a bounded History. It cannot edit or dispatch.

## Documentation

- `ENGINE.md` — current engine contract: config, tools, lifecycle, errors.
- `INVARIANTS.md` — hard design rules. Check before adding a tool or endpoint.
- `ROADMAP.md` — open decisions and future work only.

Shipped work is not repeated here; git history is the archive. Runtime skills
live in `engine/skills/` and are copied into `.opencode/skills/` by the engine.
`GRAPH.md` is generated from the current config.

## Working rules

- Check `INVARIANTS.md` before proposing a new tool, endpoint, state, or
  abstraction.
- Keep current behavior in `ENGINE.md`; keep future work in `ROADMAP.md`.
- Record decisions before implementing the next step. Do not let a proposal
  become shared context silently.
- One active thread at a time. Record a side-track before pausing the original.
- Do not edit generated `.opencode/` copies by hand; edit `engine/skills/` and
  let the engine regenerate them.

## Proof

```sh
cd engine && node --test test/*.test.mjs
cd dashboard && node --test test/*.test.mjs
node engine/live-proof.mjs
node dashboard/proof/live.mjs 2>&1 | tee dashboard/proof/live-proof.log
```

The engine proof uses the real OpenCode service and the real plugin. The
dashboard proof covers the runnable boundary fixtures and the native panel
captures.
