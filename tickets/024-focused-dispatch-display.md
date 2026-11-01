# 024 — Focused dispatch display and diagnostic status

**Status:** ready  
**Sequence:** 2 of 4  
**Depends on:** 023  
**Spec:** `specs/DISPATCH-RESULT-SPEC.md`

## Context

The dispatch tool must return a focused response, not serialized JSON. The same
formatter must serve foreground results, background notifications, and
`dispatch_status`.

## Work

- Add a pure display formatter (for example `engine/display.mjs`) that takes a
  raw dispatch snapshot and returns text.
- Render completed responses with the response content and a compact footer:
  dispatch id, state, terminal or handing node, visits, cost, tokens, and
  elapsed time.
- Render defect code and message, cancelled state, and queued/running lines.
- Mark truncated responses.
- Include the formatted `display` beside the raw snapshot in
  `/tool/dispatch`, `/tool/dispatch/wait`, and `/tool/dispatch/status`
  responses.
- `dispatch_status({ dispatchId, raw? })`: default returns the focused
  display; `raw: true` returns the structured snapshot. It never waits.
- The plugin's foreground `dispatch` returns `display`; a background start
  returns the initial queued/running display.
- Update the tool descriptions to the subagent-like foreground/background
  pattern.
- Add tests for completed, defect, cancelled, queued, running, truncated, and
  raw status displays. Verify the default is not serialized JSON.

## Validation condition

Foreground `dispatch` returns a focused display. `dispatch_status` returns a
focused display by default and the structured snapshot with `raw: true`.
Completed displays contain the response and footer, not a JSON blob. The
engine suite passes.

## Out of scope

- Background synthetic notification.
- `$dispatcher` target and handoff response.
- Dispatch card rendering.
- Retained-origin state.

## Review gate

The reviewer checks that one pure formatter produces every display, that raw
JSON is opt-in, and that a completed display is not the snapshot.
