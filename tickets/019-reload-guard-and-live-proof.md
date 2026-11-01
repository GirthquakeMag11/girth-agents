# 019 — Reload guard, documentation, and live proof

**Status:** ready  
**Sequence:** 5 of 5  
**Depends on:** 018  
**Spec:** `specs/HANDOFF-TOOLS-SPEC.md`

## Context

The first slice registers the handoff tools at boot. A reload that changes the
unique label set cannot add or remove plugin tools yet, so it must be rejected
without swapping the config.

## Work

- Store the boot label set from `handoffLabels(config.graph)`.
- On `reload`, load and validate the new config. If the unique label set
  differs, return `valid: false` with a `handoff.tools-stale` fault and keep
  the old graph. Do not write `GRAPH.md` or install plugin changes.
- If only targets, descriptions, or node membership changed and the label set
  is unchanged, swap the config and continue.
- Update the source skills:
  - `engine/skills/graph-authoring.md` describes the generated per-label
    tool surface, not the old `handoff({ label })` tool;
  - `engine/skills/dispatching.md` keeps the dispatch/`resume: true` answer
    path and does not mention a separate answer tool.
- Update `SPEC.md`, `engine/README.md`, and `ROADMAP.md` where they describe
  the old single handoff tool.
- Update `engine/test/plugin.test.mjs`, `engine/test/order.test.mjs`,
  `engine/test/executor.test.mjs`, and `engine/live-proof.mjs` for generated
  tool names. Regenerate `.opencode/skills/`.
- Run the offline suites and the live proof.

## Validation condition

A label-set-changing reload is rejected with `handoff.tools-stale`, the old
graph remains active, and no plugin regeneration is attempted. A
target/description-only reload still swaps. The engine suite, dashboard suite,
and live proof pass. No active documentation tells a graph agent to call
`handoff({ label })`.

## Out of scope

- Removing `dispatch_wait`, focused dispatch results, return handoff,
  optional outputs, subagents, or graph configuration architecture.
- Dynamic plugin/tool regeneration after a label change.

## Review gate

The reviewer checks the reload rejection keeps the old graph, the docs and
skills match the generated-tool surface, and the full live proof passes.
