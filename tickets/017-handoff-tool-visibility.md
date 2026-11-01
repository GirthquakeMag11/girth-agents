# 017 — Handoff tool visibility and context hook

**Status:** ready  
**Sequence:** 3 of 5  
**Depends on:** 016  
**Spec:** `specs/HANDOFF-TOOLS-SPEC.md`

## Context

All generated label tools are registered at install. The context hook must
show a graph agent only its active node's labels, and fail closed if the engine
cannot answer.

## Work

- Add the internal `/tool/handoff-tools` control route, authenticated by the
  engine token.
- Handler input: `{ sessionID }`. Output: `{ labels, revision }`.
- Return the active node's labels only while its session is active and before
  a handoff is accepted. Return `labels: []` for a terminal node, a
  post-handoff session, an unknown session, a queued dispatch, and an
  unrelated session.
- `revision` includes the config generation and the active node. Keep it a
  string.
- If the handler itself fails, record `handoff.visibility-unavailable` on the
  active dispatch and return an error; the plugin must then hide all generated
  labels.
- In the plugin, register `ctx.session.hook("context", async (event) => ...)`.
  For each request:
  - call `/tool/handoff-tools` with `event.sessionID` and the engine token;
  - use a short timeout;
  - delete every generated label not in `labels` from `event.tools`;
  - leave control tools and configured agent tools untouched;
  - on any lookup failure, delete all generated labels and never expose the
    full set.
- Verify that each visible generated label still maps to the plugin's own
  definition. On a mismatch, delete that label and report
  `handoff.tool-collision` to `/tool/handoff-preflight`; if the session is
  active, the engine records the defect.
- Add tests for active, terminal, post-handoff, unknown, unrelated, resumed,
  lookup-failure, and definition-mismatch cases. Test that control tools are
  never removed.

## Validation condition

A graph agent sees its configured tools plus exactly its active node's
generated labels; another node's labels are absent. Terminal, post-handoff,
unknown, and unrelated sessions see none. A failed lookup hides every
generated label and produces `handoff.visibility-unavailable`, never the full
set. Control tools are untouched. The engine and plugin suites pass.

## Out of scope

- Brief wording and message propagation.
- Reload rejection.
- Dispatch result, return handoff, optional outputs, or graph
  configuration architecture.

## Review gate

The reviewer checks that the lookup cannot add labels, that the filter deletes
only generated labels, and that every failure path fails closed.
