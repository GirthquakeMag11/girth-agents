# Roadmap

Open work only. Shipped work is in git history.

## Graph template skills

The graph's *node* agents (builder, reviewer) still reference no graph skills;
they carry only standing prompts. The primary mounts already reference
`graph-authoring` and `dispatching`; the template's graph agents should
eventually reference one too, so the shipped example exercises a graph-session
skill.

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

- Engineering is about structure. The product is good if it is easier to
  understand and control the structure of the graph than to accomplish
  whatever goal was in mind without it.
- Conducting is about behavior. The product is good if it is easier to predict
  and direct the behavior of the graph than to accomplish whatever goal was in
  mind without it.
- Both are about friction. The user engineers a certain structure to achieve a
  certain behavior, and conducts a certain behavior to achieve a certain
  result. Engineering uses the meta-system to build systems; conducting uses
  the systems built.

A real workflow dispatch reached a terminal on the live server; what remains
is real use — dispatch from a second location on the same queue, read the
dashboard snapshot live, and work the fail/repair loop — scored against the two
friction bars above.

## Dispatch recursion

A session with broad permissions holding the `dispatch` tool (e.g. a `general`
subagent with `allow *`) can start a fresh, unparented node session, which can
itself subagent and dispatch again — a graph-level loop the subagent-depth limit
does not bound. Decide whether to bound it (and how), or accept it.

Not implemented.

## Deferred

- per-node `maxSubagentDepth` enforcement below an elevated global — deferred;
  the global `experimental.subagent_depth` already caps subagent nesting, and
  the `0` case is the empty `subagents` allowlist;
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
