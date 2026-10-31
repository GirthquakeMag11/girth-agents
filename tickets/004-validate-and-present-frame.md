# 004 — Validate and present the frame

**Status:** superseded by `DASHBOARD-SPEC.md` and tickets 005–009  
**Sequence:** 4 of 4  
**Depends on:** 003

## Context

The frame is a design artifact for feedback, not implementation. Its purpose is
to show the graph's structure, behavior, and current state in the moment the
user is looking at it.

## Work

- Check that structure is visible: workflow, nodes, edges, entry/exit.
- Check that behavior is visible: handoffs, session modes, active/queued
  state, and the event log.
- Check that current state is visible: active dispatch, queue, status,
  cost/tokens.
- Check the scope: read-only; no editing, Validate/Apply/Run/Dispatch controls,
  product/agent tabs, or scoped chat.
- Check the dismissal behavior: `esc close` returns to the same chat, session,
  and agent.
- Post the frame and caption in chat.
- Ask for specific corrections and stop.

## Validation condition

The final message contains the frame and caption, passes the ticket 003
validation, and makes no code, test, engine, or documentation change beyond
ticket 001 and the ticket documents themselves; no implementation begins.

## Out of scope

- Implementing the overlay.
- Changing the document set beyond ticket 001.
- Starting the entropy/coherence system, capability spike, or durable removal
  of the interim graph view.
