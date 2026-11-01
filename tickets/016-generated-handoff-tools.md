# 016 — Generated handoff tools and collision preflight

**Status:** ready  
**Sequence:** 2 of 5  
**Depends on:** 015  
**Spec:** `specs/HANDOFF-TOOLS-SPEC.md`

## Context

With the label set validated, the plugin can replace the single
`handoff({ label })` tool with one tool per label. Collision handling must not
copy OpenCode's built-in tool names; it must inspect the live tool catalog.

## Work

- Extend `installPlugin` to take the label set and generate one tool per
  label in the plugin source.
- Each generated tool:
  - is named exactly the label;
  - takes only `{ "message": "string" }`, required,
    `additionalProperties: false`;
  - uses `codemode: false` and permission `handoff`;
  - has a generic description and a closed-over label;
  - posts `{ label, message, sessionID, callID, messageID, agent }` to the
    existing `/handoff` endpoint.
- Remove the single `handoff` tool outright. Do not keep a compatibility
  alias or a `label` argument.
- In the plugin setup, add the engine control tools first, then compare each
  generated label with `editor.list()`—the tools OpenCode actually registered
  for the location. Do not add a colliding label and do not overwrite an
  existing tool.
- Add an internal `/tool/handoff-preflight` control route and engine state.
  The plugin posts its generated label catalog and collisions there; each
  report replaces the previous one. `onDispatch` rejects with
  `handoff.tool-collision` when the report contains a collision, and with
  `handoff.preflight-unavailable` when no report exists.
- Extend `onHandoff` to accept `message`, reject a missing or whitespace-only
  message, and record the message with the accepted handoff. Keep the label,
  call id, and output hash record.
- Reject a label not declared for the active node as
  `handoff.unknown-tool` without setting a dispatch defect; the node may
  continue. Only a second accepted handoff remains `handoff.multiple`.
- Add plugin tests for generated tool source, no old `handoff` tool, the
  `message` schema, collision detection, and the preflight rejection.
- Add an engine test that a >1 MiB handoff body is accepted; the generic
  control-body cap must not apply to `/handoff`.

## Validation condition

The generated plugin source contains one tool definition per unique label and
no `handoff` tool. A colliding label is not added, the existing tool survives,
and dispatch is rejected with `handoff.tool-collision`; no OpenCode built-in
list is hardcoded. Missing and empty messages are rejected. An undeclared
label is rejected as `handoff.unknown-tool` and does not defect the dispatch.
A handoff body larger than the generic control limit is accepted. The engine
suite passes.

## Out of scope

- Visibility filtering and the context hook.
- Brief wording and message propagation to the next node.
- Reload rejection.
- Dispatch result, return handoff, optional outputs, or graph
  configuration architecture.

## Review gate

The reviewer checks that no OpenCode built-in list exists in `engine/` or the
generated plugin, that a collision never overwrites the existing tool, and
that the old `handoff` tool and `label` argument are gone.
