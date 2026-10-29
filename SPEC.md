# The engine — specification

One ordinary program, always running, that walks a graph of task nodes
and dispatches one headless helper session per task. It knows nodes and
links; it knows no workflow.

## 1. The process

The engine boots from a config or not at all. It is a continuous loop:
it runs a node, follows that node's out-link, runs the next, and when a
node has no out-link it goes idle. Whatever starts the engine starts it;
whatever stops it stops it. It is not a plugin, not a catalog, not a
workflow.

It speaks JSON-lines over stdio: pokes in, notices out.

## 2. The graph

A graph is nodes and links. A link leaves one node and names the next.

Two node types:

- **Task** — holds one task: one helper session, one objective.
- **Trigger** — observes and produces a match. Its observing mechanism
  is the extension in §5.

Routing happens between nodes. A task contains no routing.

## 3. Tasks

A task is one helper session with one objective. It occurs inside a task
node.

- Dispatch creates a fresh session with the helper's model and grants,
  sends the objective, and waits for completion.
- The helper's craft is its own config; the objective is the node's.
- A completed session ends the task. A failed, interrupted, or
  timed-out session is a loud defect; the task stops.
- The engine reads only the session's own outcome. It reads nothing the
  helper wrote, and writes nothing itself.
- The helper works in the engine's working directory.

## 4. Routing and limits

- A node has at most one out-link. With nothing to read, a link is
  unconditional: it names the next node.
- A node with no out-link has no next node; the engine goes idle.
- A cycle is allowed; `maxVisits` bounds revisits, and exceeding it is a
  loud retry-limit defect.
- Step caps and time budgets are structural; the numbers are config.

## 5. Triggers — the extension

A trigger observes and produces a match. On an idle turn the match is the
trigger's output and the engine follows the trigger's out-link; the next
task receives the match. At most one match per idle turn; multiple
matches resolve alphabetically by relative path. Each match is worked
fresh: new sessions, nothing carried across.

What a trigger observes and what a match carries is the next decision.
Nothing in §§1–4 depends on it.

## 6. Sessions — the live contract (live-verified 2026-10-28)

- **Attach**: the service registration file (`service.json`, XDG state
  dir, mode 0600) carries the url and password. HTTP Basic, username
  `opencode`. Health: `GET /api/info` with a pid-and-version check.
- **Create**: `POST /api/session` — an agent (`build`), a model
  reference `{ id, providerID }`, a location `{ directory }`, and
  permissions as `{ action, resource, effect }` triples listing only the
  granted actions. A wildcard `deny` shadows every allow and empties the
  helper's hands — never emit it. Deny-rest is the allow-list itself.
- **Prompt**: `POST /api/session/{id}/prompt`, `{ text }`.
- **Completion**: the experimental wait answers 204 as an idle signal —
  never a completion. The session's own state
  (`GET /api/session/{id}` → `data.outcome`) is the only completion
  authority. Every response is the `{ data: … }` envelope.

## 7. The control surface

JSON-lines over stdio: pokes in, notices out — step events, defects,
completions, a periodic heartbeat, and typed introspection of any
session, in flight or finished, on demand. The engine is never a black
box.

The pokes are `pause`, `resume`, and `introspect`; end-of-input or a
termination signal stops the engine.

## 8. Config and the verifier

The graph and helper fittings load from the file-tree config. Before a
graph is trusted it passes the gate: schema constraints named, structure
faults (dangling links, unknown helpers, unreachable nodes, cycles
without a bound), and a dry pass of the real executor. Sound means a
later failure is the engine's.

## 9. Testing doctrine — reality first

No mechanism is called working until it has run against the real
target — the live OpenCode service — at the cheapest size. Stand-in
servers mirror the live wire and reject drift; they never certify a
behavior the live system would refuse.

## 10. Out of scope

The trigger's observing mechanism (the next decision). The graph's
workflow. The plugin. The inbox. The bounce-back ladder. Everything
else — the engine is the engine, full stop.
