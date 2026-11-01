# 026 — `$dispatcher` target and handoff response

**Status:** ready  
**Sequence:** 4 of 4  
**Depends on:** 018, 024  
**Spec:** `specs/DISPATCH-RESULT-SPEC.md`

## Context

A node may hand off a message to the interactive dispatcher rather than to
another node. That completes the dispatch without a terminal node and returns
the handoff message as the focused response.

## Work

- Accept `$dispatcher` as a handoff target in config validation for both
  unconditional `to` and conditional label `to`. Reject `resume: true` on a
  `$dispatcher` label.
- Route a `$dispatcher` handoff to a sentinel target in `handoffTarget` and
  stop `runDispatch` without finding a terminal node.
- Record the handoff as `{ from, label, to: "$dispatcher", message }`.
- Set the dispatch result to a completed state with
  `result.response = message` (UTF-8, capped at 16 KiB) and
  `result.responseTruncated`.
- Keep `terminal: null` for a dispatcher completion; the handing node and label
  identify the result.
- Keep the declared output record if the handing node has one; the response is
  still the handoff message, not the output content.
- Ensure `onHandoff`, `onDispatchWait`, and `onDispatchStatus` carry the
  result. Activity history remains content-free.
- Add tests for config acceptance of `$dispatcher`, rejection of
  `$dispatcher` + `resume`, completion without a terminal, response capping,
  output preservation, and content-free history.
- Do not implement the retained-origin return path here; the return handoff
  feature owns that.

## Validation condition

A `$dispatcher` handoff completes the dispatch with no terminal node and
returns the handoff message as `result.response`. A declared output record is
preserved but is not the response. A `$dispatcher` label with `resume: true`
is rejected. Activity history contains no response content. The engine suite
passes.

## Out of scope

- Retained origins, origin binding, or resumable source sessions.
- Dispatch card rendering.
- Optional node outputs beyond the existing declared-output behavior.
- Graph configuration architecture.

## Review gate

The reviewer checks the dispatcher completion has no terminal node, the
response is the handoff message, the output record is preserved, and the
return lifecycle is not pre-empted.
