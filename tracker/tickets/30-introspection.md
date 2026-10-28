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

## Acceptance criteria

- [ ] A request for any in-flight session returns its full typed state without disturbing the step
- [ ] A request for any finished session returns its stamps, outcome, and the records it touched
- [ ] An unknown session ID is answered with a typed, not-found state rather than silence