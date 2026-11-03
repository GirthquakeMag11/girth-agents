# Roadmap

Open work only. Shipped work is in git history.

## Isolated OpenCode live proof

The in-process live proof (`engine/live-proof.mjs`) and the test suite exercise
the engine, plugin, RPC, and installer end to end. The remaining proof runs
against a real OpenCode server with a configured graph model: install the
archive, start the server with the installed global plugin, dispatch a real
workflow to a terminal, dispatch from a second location on the same queue,
read the dashboard snapshot through RPC, and uninstall. It needs model
credentials and is not part of CI.

## Graph template skills

The shipped build-review graph template currently references no graph skills;
its graph agents carry only standing prompts. Skills are already first-class in
the schema and loader; the template should eventually reference one or two
graph skills so the shipped example exercises the capability.

## Mount tools surface

A primary/subagent mount's `tools` acquisitions do not yet surface on the
OpenCode side: only the `permissions` triples map into `Agent.Info`, while
`tools` is a session-provisioning concern. Decide how a mounted agent's
`tools` list becomes its registry permissions; the Engineer/Conductor re-root
makes this concrete.

## Re-root the primary agents

The Engineer and Conductor are hand-authored OpenCode Markdown. Re-derive them
as mounts of the shared schema (`graph/.../*.md` with `mounts`) rather than
separate `.opencode/agents/*.md` files.

## Dashboard placement

The graph dashboard currently opens as a full-screen panel. The target is to
fit it inside the tab of the chat it was opened from, like the subagent view,
so opening the graph keeps the conversation context instead of replacing it.

Not implemented.

## Graph agent session view

Native OpenCode has a subagent view that lets the user see inside a subagent
session. Provide the same level of introspection for graph agent sessions,
likely through the dashboard: inspect the session's messages, tool calls,
handoffs, and current state, rather than only the node-level summary.

Not implemented.

## Chat context frame

The right-side context frame in the chat view is almost entirely empty space.
The target is a compact visual display of relevant graph activity in that
frame, analogous to the now-experimental to-do list. It is a glanceable
activity surface, not a replacement for the full dashboard.

Not implemented.

## Dispatch card presentation

OpenCode currently selects its subagent card by tool name and exposes no
inline custom tool-card renderer, so graph-dispatch card parity needs an
OpenCode core change or a different integration. Keep this as a design
constraint, not a spec promise.

Not implemented.

## Dogfood

Does using the engine to develop the engine make real work easier and more
efficient than doing it directly? Continue only after deciding what friction
and review value to measure; there is no controlled comparison and the fail
loop has not been exercised.

## Deferred

- parallel dispatches across the graph;
- run archive or persisted dispatch history;
- triggers, watches, and schedules;
- programmatic node types;
- dashboard editing or dispatch controls;
- background subagent tracking and child-session aggregation.

Product-boundary guardrails (do not reverse without a decision):

- distribution stays a plain archive plus a standalone `install.sh` and a SHA-256
  checksum; no npm package, registry, or network step;
- no bundled Node or other runtime, and no Node prerequisite at install time;
- no in-place upgrade path in the first release;
- no Windows installer in the first release;
- no per-project engine or per-project install.
