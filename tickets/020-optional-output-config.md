# 020 — Optional output configuration and path resolution

**Status:** ready  
**Sequence:** 1 of 3  
**Depends on:** 019  
**Spec:** `specs/OPTIONAL-OUTPUTS-SPEC.md`

## Context

`node.output` is currently required, and `outputPathFor` assumes every node has
a path. This ticket makes the config and path helper nullable without changing
execution behavior yet.

## Work

- In `engine/config.mjs`, validate `node.output` only when it is present:
  `relativePath(node.output, ..., { required: false })`. An omitted output is
  valid; an invalid declared path keeps the existing `schema.path` fault.
- Change `outputPathFor(graph, node, cwd)` to return `null` when the node has
  no output, and otherwise resolve the path exactly as today.
- Change `graphSummary` to emit `output: node.output ?? null` so the graph
  summary and dashboard config adapter see an explicit null rather than a
  missing key.
- Keep `outputRoot` unchanged. It remains meaningful only for nodes that
  declare an output.
- Add tests for: omitted output accepted; invalid declared path rejected;
  declared path still resolved; no-output path returns null; graph summary
  carries null; `outputRoot` does not create a path for a no-output node;
  a reload that changes only `output` is accepted and does not change the
  handoff label set.

## Validation condition

`node --test engine/test/*.test.mjs` passes. Config validation accepts a node
with no output and still rejects an invalid declared path. `outputPathFor`
returns null for no output and the same resolved path for a declared output.
No executor, brief, map, or dashboard behavior changes in this ticket.

## Out of scope

- Skipping output checks in the executor.
- Brief or snapshot changes.
- Map and dashboard rendering.
- Dispatcher-target handoff responses.
- Graph configuration architecture.

## Review gate

The reviewer checks that the declared-output path is unchanged and that the
only new valid state is an omitted `output`.
