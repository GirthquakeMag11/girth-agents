# 021 — Optional output execution, brief, and snapshot

**Status:** ready  
**Sequence:** 2 of 3  
**Depends on:** 018, 020  
**Spec:** `specs/OPTIONAL-OUTPUTS-SPEC.md`

## Context

With the config accepting an omitted output, the executor must skip file
verification for that node, and the brief must stop asking for a file. The
handoff message is the deliverable.

## Work

- In `engine/brief.mjs`, include the `# Output` section only when the node
  declares an output. When omitted, do not mention an output path and do not
  require a file.
- In `engine/executor.mjs`:
  - a terminal node with no output completes without calling `checkOutput`;
  - a non-terminal node with no output skips the output check at handoff;
  - the handoff record carries no output hash or path for a no-output node;
  - the dispatch record keeps `output: null`;
  - a declared output keeps the exact existing path, hash, and post-handoff
    unchanged checks.
- In `engine/engine.mjs`, make `onHandoff` skip output verification when the
  active node has no output. Do not accept an output hash for a no-output
  node.
- When a no-output node hands off, the next node's brief receives the handoff
  message and no upstream output path. This uses the message propagation from
  ticket 018.
- Add a read-only graph-agent fixture: a node with `read` permission and no
  output can hand off with `{ message }`.
- Add tests for: no file check on no-output handoff; terminal no-output
  completion; declared-output checks unchanged; missing/empty/changed output
  still defects only for declared outputs; brief omits the output section;
  snapshot carries `output: null`; read-only node completes.

## Validation condition

A node with no `output` hands off with a message and raises no `output.*`
defect. A terminal node with no output completes with `output: null`. A
declared output retains existence, non-empty, hash, and changed-after-handoff
verification. The next brief contains the upstream message and no upstream
path when the source had no output. The engine suite passes.

## Out of scope

- Map and dashboard rendering.
- Documentation and live proof.
- Dispatcher-target handoff responses.
- Graph configuration architecture.

## Review gate

The reviewer checks that the no-output path never calls `checkOutput`, that
declared outputs are unchanged, and that no-output completion is not treated
as a defect.
