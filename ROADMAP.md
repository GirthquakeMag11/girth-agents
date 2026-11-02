# Roadmap

Open work only. Shipped work is in git history.

## Installer and uninstaller

Distribute the product as a plain archive plus a standalone `install.sh` that
extracts and installs it into OpenCode's global configuration. No npm,
registry, or network. The installer is interactive, finds the archive next to
the script, detects the OpenCode config directory, verifies the archive
checksum, seeds a user-owned `graph/`, installs the dashboard and
OpenCode-native assets globally, and writes a manifest plus `uninstall.sh`.

The uninstaller removes only manifest-listed files whose checksums still match.
It leaves the user-owned graph and project state alone unless explicitly
purged.

Not implemented.

## Engine lifecycle

The engine is currently a separate process started by the user. The product
goal is engine lifetime tied to the OpenCode background server, not the client
that launches or connects to it.

Recommended direction:

- engine writes a stable service descriptor with URL, token, pid, workspace,
  and config path;
- the plugin becomes static and reads the descriptor instead of embedding a
  per-boot endpoint;
- a small OpenCode server plugin supervises the engine child: start, restart
  with backoff, single-instance lock, shutdown cleanup, and logs.

The main open question is runtime packaging: the OpenCode binary is not a Node
runtime, so spawning the engine requires either a Node prerequisite, a bundled
runner, or moving the engine in-process. The in-process version is the cleanest
long-term shape but a larger refactor of the driver and control transport.

Not implemented.

## Graph configuration architecture

The current schema is one aggregate JSON manifest with Markdown graph agent
documents and inline `graph.nodes`.

The target is:

- one configuration file per node;
- a node's `agent` key references a graph agent's `id`;
- graph assembly, file layout, node schema, and schema version are open.

The replacement graph cannot be encoded until this is settled. The current
`engine/graph.json` remains the placeholder build-review graph.

Not implemented.

## Graph agent subagents

Graph agent configurations should accept an optional `subagents` list of exact
OpenCode agent IDs. Only named subagents are launchable; omitted or empty means
none. Validate at dispatch preflight so a typo is a named defect before a node
runs.

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

The focused text display is implemented. OpenCode currently selects its
subagent card by tool name and exposes no inline custom tool-card renderer, so
graph-dispatch card parity needs an OpenCode core change or a different
integration. Keep this as a design constraint, not a spec promise.

Not implemented.

## Dogfood

Does using the engine to develop the engine make real work easier and more
efficient than doing it directly? The first dogfood run completed, but there is
no controlled comparison and the fail loop was not exercised. Continue only
after deciding what friction and review value to measure.

Open.

## Deferred

- parallel dispatches across the graph;
- run archive or persisted dispatch history;
- triggers, watches, and schedules;
- programmatic node types;
- dashboard editing or dispatch controls;
- background subagent tracking and child-session aggregation.
