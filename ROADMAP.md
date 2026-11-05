# Roadmap

Open work only. Shipped work is in git history.

## Graph template skills

The graph's *node* agents (builder, reviewer) still reference no graph skills;
they carry only standing prompts. The primary mounts already reference
`graph-authoring` and `dispatching`; the template's graph agents should
eventually reference one too, so the shipped example exercises a graph-session
skill.

Not implemented.

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

What remains is real use — dispatch from a second location on the same queue,
read the dashboard snapshot live, and work the fail/repair loop — scored against
the two friction bars above.

## Subagent depth cap

A per-node `maxSubagentDepth` property — a graph-owned cap on subagent nesting
below a node, additional to OpenCode's global limit.

Not implemented.

## Parallel dispatches

Run more than one dispatch concurrently across the graph; today the engine runs
one at a time with the rest queued FIFO.

Not implemented.

## Dispatch history

Persist completed dispatches and their records beyond the in-memory queue;
today they are lost on process restart.

Not implemented.

## Triggers and schedules

Initiate work from triggers, watches, or a schedule rather than only an
explicit prompt.

Not implemented.

## Programmatic node types

A new type of node that uses scripting instead of an agent to accept input,
create output, and participate in routing.

Not implemented.

## Graph-authored tools

Tools are currently grant-by-name from the live catalog: a custom tool can
only be *registered* by code (a plugin's `ctx.tool.transform`), while the
graph — and the Engineer — relate to a tool by name only (select it, grant it,
scope its permissions). Open question: whether tools become graph-authorable —
a declarative/scripted tool document the engine materializes and registers, the
tool-ward twin of "Programmatic node types" — and what sandbox runs the
execution. Parked; no shape is committed until the scripting runtime question
is charted.

Not implemented.

## Dashboard editing and dispatch controls

Edit the graph and control dispatches (dispatch/cancel) from the dashboard, not
only through the interactive agent's tools.

Not implemented.

## Subagent tracking

Track background subagents and aggregate child-session activity.

Not implemented.