# 015 — Handoff label validation and label-set derivation

**Status:** ready  
**Sequence:** 1 of 5  
**Depends on:** none  
**Spec:** `specs/HANDOFF-TOOLS-SPEC.md`

## Context

The current config accepts any non-empty string as a conditional handoff
label, and the plugin exposes one `handoff({ label })` tool. The spec requires
exact, tool-safe label names and one generated tool per unique label. This
ticket makes the label set a first-class, validated engine value before the
tool surface changes.

## Work

- In `engine/config.mjs`, validate every conditional label against
  `^[A-Za-z][A-Za-z0-9_-]*$`. Dots, colons, slashes, whitespace, leading
  digits, and empty labels are named config faults.
- Keep the implicit unconditional label `next`.
- Reserve the engine control tool names at config load: `dispatch`,
  `dispatch_status`, `dispatch_cancel`, `dispatch_wait`, `reload`,
  `graph_info`, `graph_map`, and `handoff`. A label in that set is a named
  config fault. This is the engine's own set, not an OpenCode built-in list.
- Add a pure `handoffLabels(graph)` helper that returns the sorted unique
  label set: `next` for an unconditional handoff, every conditional label,
  and nothing for a terminal node. Shared labels appear once.
- Use the helper from the code paths that will need the set: boot, reload
  comparison, and plugin generation. Do not add runtime behavior yet beyond
  exposing the helper.
- Add tests for valid labels, every invalid character class, reserved control
  names, unconditional/conditional/terminal sets, shared labels, and
  deterministic ordering.

## Validation condition

`node --test engine/test/*.test.mjs` passes. New config tests prove each
invalid label is a named fault and each reserved control name is rejected.
The label-set helper returns the expected unique, sorted set for the shipped
graph and for a terminal-only graph. No plugin or handoff runtime behavior
changes in this ticket.

## Out of scope

- Generating plugin tools.
- The visibility lookup or context hook.
- Message recording, propagation, or brief changes.
- Reload rejection.
- Dispatch result, return handoff, optional outputs, or graph
  configuration architecture.

## Review gate

The reviewer checks that validation is strict, the reserved set is engine-owned
and not an OpenCode catalog, and the helper is pure and deterministic.
