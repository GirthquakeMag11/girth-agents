# The engine — specification

One program: an always-awake harness that watches a project's documents,
dispatches headless helper sessions through its own server client, reads
the stamps on the working documents, and routes by what it reads. It
knows the *shape* of a graph — nodes, links, conditions — and never a
particular workflow. The graph that ships beside it is a separate
thing: see `GRAPH.md`.

## 1. The process

The engine boots from config or not at all, serves every activated
project on the machine one at a time, and speaks JSON-lines over stdio
to whatever runs it. It is an ordinary program: started and stopped by
whatever starts and stops it. It is not a plugin, not a catalog, not a
workflow.

## 2. The state contract

Durable state is stamps written on the project's own documents. After
each session completes, the engine reads the working document, extracts
its stamped fields, and routes by the graph's conditions over those
fields. The engine defines *that* mechanism; the graph defines *which*
stamps exist and what they mean. In-flight work is never committed; the
engine keeps no ledger of its own — whatever is true is on the
documents.

## 3. Nodes

Two node types:

- **Task** — dispatching one helper, on one objective, in one session.
  The brief carries the helper's fitting and skills, the node's
  objective, and the claimed document — the work's contract. A repair
  step continues the graded helper's existing session with the
  reviewer's report; the engine supports both continuing and fresh
  sessions, and the graph chooses per node.
- **Trigger** — an observing node, allowed anywhere in a graph. It
  designates a directory to watch and a stamp pattern; a new or changed
  document in that directory queues a match action. On an engine turn
  the match is the trigger's output — the matched document and its
  captured stamp text — routed by ordinary routing rules. Matching
  grants the engine authority over that document. At most one match per
  idle turn; multiple matches resolve alphabetically by relative path;
  each matched document is its own run with fresh sessions, nothing
  carried across.

## 4. Routing

Links live in the node they leave. A node's out-links are one
unconditional link or a set of conditional links — never a mixture,
never a catch-all. A stamp matching no declared condition is a loud
defect naming the node and the stamp, never a route.

## 5. Limits

Retry caps are structural: `maxVisits` bounds revisits, the exhausted
link is the route on the visit after the last, and without one the
excess is a loud retry-limit defect. Step caps and time budgets are
structural too; the numbers belong to the graph.

## 6. Sessions — the live contract (live-verified 2026-10-28)

- **Attach**: the service registration file (`service.json`, XDG state
  dir, mode 0600) carries the url and password. HTTP Basic, username
  `opencode`. Health: `GET /api/info` with a pid-and-version check.
- **Create**: `POST /api/session` — an agent (`build`), a model
  reference `{ id, providerID }`, a location `{ directory }`, and
  permissions as `{ action, resource, effect }` triples listing only
  the granted actions. A wildcard `deny` shadows every allow and
  empties the helper's hands — never emit it. Deny-rest is the
  allow-list itself.
- **Prompt**: `POST /api/session/{id}/prompt`, `{ text }`.
- **Completion**: the experimental wait answers 204 as an idle signal —
  never a verdict. The session's own state
  (`GET /api/session/{id}` → `data.outcome`) is the only completion
  authority. Every response is the `{ data: … }` envelope.

## 7. The control surface

JSON-lines over stdio: pokes in, notices out — step events, defects,
run completions, a periodic heartbeat, and full typed introspection of
any session, in flight or finished, on demand. The engine is never a
black box.

Watching: filesystem events over each project's watched directories,
plus a periodic reconcile pass — events are live-only; the pass catches
what they miss.

## 8. Config and the verifier

The graph and the helper fittings load from the file-tree config.
Before a graph is trusted it passes the gate: schema constraints named,
structure faults (dangling links, unknown helpers, unreachable nodes),
and a branch matrix driving the real executor — every condition's
branch, the stray stamp, and loop laps: a cycle that can escape
terminates its probes, one that cannot is named a fault. Sound means a
later failure is the engine's.

## 9. Testing doctrine — reality first

No mechanism is called working until it has run against the real
target — the live OpenCode service — at the cheapest size. Stand-in
servers mirror the live wire and reject drift; they never certify a
behavior the live system would refuse. What a test asserts must be what
the documents and the server would show.

## 10. Out of scope

The graph's workflow (`GRAPH.md`). The plugin. The inbox. The
bounce-back ladder (future, composed in config). Everything else —
the engine is the engine, full stop.