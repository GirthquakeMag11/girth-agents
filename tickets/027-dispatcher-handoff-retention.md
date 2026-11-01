# 027 — Dispatcher handoff retention and origin binding

**Status:** ready  
**Sequence:** 1 of 2  
**Depends on:** 023, 026  
**Spec:** `specs/RETURN-HANDOFF-SPEC.md`

## Context

A dispatcher handoff completes the dispatch, but the source node session must
remain available for a possible return message. The engine already tracks the
origin of a node's input; this ticket stores that origin on the dispatch and
keeps the session alive.

## Work

- When a `$dispatcher` handoff is accepted, record on the dispatch:
  - the source node id;
  - the source session id;
  - the handoff label and message;
  - the retained-origin state.
- Keep the source session alive after the dispatcher handoff completes. Do not
  delete it in the normal non-resumable cleanup.
- Ensure the dispatch still completes with no terminal node and holds no queue
  slot.
- `dispatch_cancel({ dispatchId })` on a retained origin discards the origin
  and deletes the source session without creating a defect.
- If the engine restarts, the retained origin and session are lost. Do not add
  persistence.
- Add tests for: origin recorded; session retained; no queue slot; cancel
  discards; restart behavior is documented as in-memory; the dispatch result
  carries the dispatch id and message.

## Validation condition

A `$dispatcher` handoff completes the dispatch, records the source node and
session as the origin, and keeps the session alive. `dispatch_cancel` on that
dispatch removes the retained origin and session. The dispatch holds no queue
slot. The engine suite passes.

## Out of scope

- The return message path.
- Focused display changes.
- Message-kind state or separate input tools.
- Persisted origins or session recovery.
- Optional node outputs.

## Review gate

The reviewer checks that the retained origin is engine state, not prompt
content, that cancel removes it, and that the normal session cleanup does not
delete it.
