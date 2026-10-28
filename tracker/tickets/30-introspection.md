# 30: Introspection — any task session, any time, no black boxes

**Parent:** specs/engine.md

**Kind:** feature

**Blocked by:** 27 (the task sessions it reports on)

## What it delivers

The engine explains itself on demand: the plugin can request the full
state of any engine task session — in flight or finished — at any time,
and the engine answers in typed state: which node it is, its objective,
live progress, the stamps parsed so far, the caps it is under, and the
session it drove. Combined with the heartbeat, the engine is never a
black box.

## Work so far

- 2026-10-28: built test-first. The engine keeps a typed registry of its runs; an introspect poke with no id returns every run, with an id returns that one, and an unknown id is a typed not-found. An in-flight run reports its state, events, and the live session driving it; a finished run reports its terminal, stamps, failure, and the record it touched. The executor's onStep hook feeds the registry without polluting step history; the driver describes its sessions on demand.

- **Done — 2026-10-28:** introspection lands in `engine/engine.mjs` with the executor's onStep hook and the driver's describeSession; three tests, 42 green across the suite.

- [ ] A request for any in-flight session returns its full typed state without disturbing the step
- [ ] A request for any finished session returns its stamps, outcome, and the records it touched
- [ ] An unknown session ID is answered with a typed, not-found state rather than silence