# The engine — specification

One program: an always-awake harness that performs a project's work by
reading the stamps on the work documents, dispatching headless helper
sessions, and routing by what the documents say. The documents are the
state. Nothing else is.

## 1. The one mechanism

A work document — a ticket, a spec, a plan — carries its whole state as
stamped, dated lines of its own text. The engine parses a document,
reads its stamp, and spawns a task based on what the stamp says. When
work passes, the pass stamp is written onto the document itself: a done
ticket visibly *is* a done ticket. There are no side artifacts, no
engine-internal ledgers, no second subsystem for output. Parse the
document, read the stamp, route — one mechanism, everywhere.

## 2. Documents and stamps

- Stamp line form: a bold label, a value, a date — `**Ready:** 2026-10-28`.
- The stamp vocabulary: `ready`, `stamped-pass`, `stamped-fail`,
  `stamped-done`, `awaiting-answer`, `awaiting-attention`, `invalidated`.
- Stamps are the only durable state. In-flight work is never committed.
  Transitions are marks moving on the document; other bytes are preserved.

## 3. The graph

- Node types: `task` (dispatches one helper session for one objective),
  `exit` (terminal), `entry` (a representation of an entrance),
  `trigger` (below).
- Links live in the node they leave. A node's out-links are either one
  unconditional link or a set of conditional links — never a mixture,
  never a catch-all. A stamp matching no declared condition is a loud
  defect naming the node and the stamp; an agent's contract-breaking
  output never becomes another agent's instructions.
- Retry caps: a node may carry `maxVisits` (the shipped graph uses
  three). The excess either takes the declared exhausted link or is a
  loud retry-limit defect. The bounce-back ladder is future, config-composed.

## 4. Entries and triggers

- **Entry** is an abstraction: the representation of where outside input
  enters. `claim-input` hands a file to the engine; the entry validates
  it by its stamp; anything invalid is a loud defect, never adopted.
- **Trigger** is a concrete observer node — its own node type, not
  constrained to being an entrance, allowed anywhere in the system.
  It designates a directory to watch and a stamp pattern. When the
  engine sees a new or changed document there, it queues a match action.
  On an engine turn, the match is the trigger's *output* — the matched
  document and the captured stamp text — routed by ordinary routing
  rules, exactly as a task's output would be. The match grants the
  engine authority over that document.
  - Deterministic: at most one match per idle turn; multiple matches
    resolve alphabetically by relative path.
  - Each triggered document is its own run: fresh sessions, no
    cross-ticket state. One thing at a time — the queue is the watches
    plus the turn.

## 5. Sessions and the live contract — live-verified, 2026-10-28

- *Attach:* the service registration file (`service.json`, XDG state
  dir, mode 0600) carries the url and password. Auth is HTTP Basic,
  username `opencode`, password from the file. Health is
  `GET /api/info` with a pid-and-version check.
- *Create:* `POST /api/session` — `agent: "build"` (without an agent the
  session has no hands), `model: { id, providerID }`,
  `location: { directory }`, and `permissions` as an array of
  `{ action, resource: "*", effect: "allow" }` triples listing only the
  granted actions. A wildcard `deny` entry shadows every allow and
  empties the helper's hands — never emit one. Deny-rest is the
  allow-list itself.
- *Prompt:* `POST /api/session/{id}/prompt` with `{ text }`.
- *Completion:* the experimental wait answers 204 as an idle signal —
  *never a verdict*. The session's own state
  (`GET /api/session/{id}` → `data.outcome`) is the only completion
  authority.
- Every response is the `{ data: … }` envelope.
- Helper models and grants are config; the builder's session resumes
  across a repair loop, every reviewer always runs fresh.

## 6. The control surface

- JSON-lines over stdio: pokes in (claim, activation, pauses), notices
  out (step events, defects, exits, periodic heartbeat, full
  introspection of any session — in flight or finished — on demand).
  The engine is never a black box.
- Watching: each project's watched directories get filesystem events
  plus a periodic reconcile pass — events are live-only; the pass
  catches what they miss.
- Delivery: the engine commits its own units with conventional
  messages, pulls first, never force-pushes, holds divergence for the
  user.

## 7. The verifier

Before a graph is trusted it passes the gate: schema constraints named,
structure faults (dangling links, unknown helpers, unreachable nodes),
and a branch matrix driving the real executor over stamps — every
condition's branch, the stray stamp, and the loop laps. A cycle that can
escape terminates its probes; one that cannot is named a fault. Sound
means a later failure is the engine's.

## 8. Testing doctrine — reality first

No mechanism is called working until it has run against the real target
— the live OpenCode service — at the cheapest size. Stand-in servers
mirror the live wire and reject drift; they never certify a behavior
the live system would refuse. What a test asserts must be what the
documents and records would show.

## 9. Out of scope

The plugin. The skillset. The inbox. The bounce-back ladder (future,
config-composed). Anything not named above — this project is the
engine, full stop.

## 10. Open rulings — nothing here is assumed

1. **Who writes the done-stamp** when a ticket's review passes: the
   engine's terminal stroke, the reviewer's own pen, or a marks task.
2. **The spec's admission stamp** — its wording (a dated Approved line?).
3. **review-tickets' grading criteria** — what makes a sliced ticket
   set right.
4. **`claim-input`'s eventual fate** once triggers prove out.
5. **The exact stamp words** for pass/fail/done — the line family is
   settled; the specific labels are candidates until ruled.