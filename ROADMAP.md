# Roadmap

Open work only. Shipped work is in git history.

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

The current schema is one aggregate JSON file with `agents` and inline
`graph.nodes`.

The target is:

- one configuration file per node;
- one Markdown document per graph agent type;
- a node's `agent` key references the graph agent type;
- graph assembly, file layout, node schema, graph agent Markdown schema, and
  schema version are open.

The replacement graph cannot be encoded until this is settled. The current
`engine/graph.json` remains the placeholder build-review graph.

Not implemented.

## Graph agent subagents

Graph agent configurations should accept an optional `subagents` list of exact
OpenCode agent IDs. Only named subagents are launchable; omitted or empty means
none. Validate at dispatch preflight so a typo is a named defect before a node
runs.

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
- background subagent tracking and child-session aggregation;
- per-dispatch output isolation.
