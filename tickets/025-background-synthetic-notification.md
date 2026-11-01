# 025 — Background synthetic notification

**Status:** ready  
**Sequence:** 3 of 4  
**Depends on:** 023, 024  
**Spec:** `specs/DISPATCH-RESULT-SPEC.md`

## Context

A background dispatch must notify the dispatching session when it finishes.
OpenCode's own background subagent does this with `session.synthetic`, not with
a prompt and not with a model-facing wait tool.

## Work

- In the plugin, when `dispatch` is called with `background: true`, return the
  initial display immediately and start one internal wait for that dispatch id.
- On completion, defect, or cancellation, call `ctx.session.synthetic` with
  the dispatching `sessionID` and the same focused display.
- Wrap the display in a graph-dispatch marker, for example
  `<graph-dispatch dispatchID="d-1" state="completed" target="node-a">…</graph-dispatch>`.
  Include metadata with the dispatch id, state, node/workflow, and handoff
  label when present.
- Deliver exactly one terminal notification per background dispatch. Do not
  send a notification for a foreground dispatch.
- Catch a missing session or a synthetic-delivery failure; the dispatch
  outcome does not change. Log it as `dispatch.notification-failed` where
  appropriate.
- Do not use a session prompt and do not add a model-facing wait tool.
- Add tests for completed, defect, and cancelled notifications; exactly one
  notification; missing session; notification failure; no notification for
  foreground; metadata and marker text.

## Validation condition

A background dispatch returns immediately. On completion, defect, or
cancellation, the dispatching session receives one synthetic message with the
focused display; it is not a prompt. A missing session or delivery failure
does not change the dispatch outcome. No model-facing `dispatch_wait` exists.

## Out of scope

- `$dispatcher` target and handoff response.
- Return-path notifications or origin binding.
- Dispatch card rendering.
- Persisted notification history.

## Review gate

The reviewer checks that the notification uses `session.synthetic`, fires once
per terminal background dispatch, never for foreground, and cannot change the
dispatch result.
