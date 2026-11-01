# 023 — Dispatch surface and lifecycle

**Status:** ready  
**Sequence:** 1 of 4  
**Depends on:** 019  
**Spec:** `specs/DISPATCH-RESULT-SPEC.md`

## Context

The current dispatch tool uses `wait`/`timeoutMs` and a separate
`dispatch_wait` tool. The spec replaces that with `background`, keeps a
foreground internal wait, and adds the `resume`/`dispatchId` surface owned by
the return handoff feature.

## Work

- Change the model-facing `dispatch` input to:
  `{ node?, workflow?, prompt, background?, resume?, dispatchId? }`. Exactly
  one of `node` or `workflow` is required. Remove `wait` and `timeoutMs`.
- Remove the model-facing `dispatch_wait` tool. Keep the engine's
  `/tool/dispatch/wait` endpoint for foreground and background implementation.
- Send `context.sessionID` with the dispatch call and record it as the
  dispatching session id on the dispatch record.
- Validate `background` as a boolean, `resume` as a boolean, and `dispatchId`
  as a non-empty string. Reject `workflow` plus `resume: true` and
  `dispatchId` without `resume: true`.
- Foreground: call `/tool/dispatch`, then `/tool/dispatch/wait`, and return a
  snapshot for now. The focused display is ticket 024.
- Background: call `/tool/dispatch` and return the dispatch id and initial
  state immediately. Do not start a model-facing wait.
- Keep `dispatch_status` and `dispatch_cancel` available as read-only/control
  tools.
- Add tests for the new schema, no `dispatch_wait` tool, foreground blocking,
  background returning immediately, dispatching session recording, and the
  invalid `resume`/`dispatchId` combinations.

## Validation condition

The model-facing tool set has `dispatch`, `dispatch_status`,
`dispatch_cancel`, `reload`, `graph_info`, and `graph_map`; it has no
`dispatch_wait`. Foreground blocks and returns a snapshot; background returns
the id and initial state immediately. The engine records the dispatching
session id. Invalid `resume`/`dispatchId` combinations are rejected. The engine
suite passes.

## Out of scope

- Focused display formatting.
- Background synthetic notification.
- `$dispatcher` target and handoff response.
- Retained-origin state or origin binding.
- Dispatch card rendering.

## Review gate

The reviewer checks that the model has no `dispatch_wait`, that background
does not block the model-facing call, and that the `resume`/`dispatchId`
surface is present but its return behavior is not guessed here.
