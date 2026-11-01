# 022 — Optional output map, dashboard, docs, and proof

**Status:** ready  
**Sequence:** 3 of 3  
**Depends on:** 021  
**Spec:** `specs/OPTIONAL-OUTPUTS-SPEC.md`

## Context

The engine can now execute a node with no output. The graph artifact, native
dashboard, and documentation still assume every node has a path.

## Work

- In `engine/map.mjs`, render a node with no output without a broken or
  literal `undefined` path. Use an explicit no-output marker.
- In `dashboard/src/view.tsx`, make the config node's `output` optional,
  make `outputPath` return null for a no-output node, and render `—` or an
  equivalent no-output value in Details.
- Keep the dispatch snapshot adapter tolerant of `output: null`; do not treat
  null as a path.
- Update `SPEC.md`, `engine/README.md`, and `ROADMAP.md` where they describe
  output as required.
- Check `engine/skills/graph-authoring.md` against the implemented schema:
  it should say `output` is optional and that a message-only node is valid.
- Add tests for the map artifact and dashboard Details with a no-output node.
- Run the engine suite and the dashboard suite. Extend the live proof only if
  the existing product graph can carry a no-output node without changing the
  replacement graph; otherwise the unit proof is sufficient.

## Validation condition

`GRAPH.md` shows a no-output node without a broken path. The dashboard renders
Details for a no-output node without crashing or showing `undefined`. The
engine and dashboard suites pass. No active document says every node must
declare an output.

## Out of scope

- Dispatcher-target handoff responses.
- Handoff tool changes.
- Graph configuration architecture.
- Per-dispatch output isolation or archives.

## Review gate

The reviewer checks the no-output marker in `GRAPH.md` and the dashboard, and
confirms the docs describe output as optional rather than required.
