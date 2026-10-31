# 005 — Engine workflow boundary and structured runtime

**Status:** passed (independent review, 2026-10-30)  
**Sequence:** 1 of 5  
**Depends on:** none  
**Spec:** `DASHBOARD-SPEC.md`, `SPEC.md`

## Context

The dashboard needs explicit workflow dispatch intent, transitive workflow
connections, strict boundaries, and structured runtime state. These are
engine contracts; the view must not infer them from human-readable strings
or from node membership.

## Work

- Validate workflow `connections` and `strict` fields.
- Provide transitive `allowedWorkflows` and `workflowsForNode` helpers.
- Support `dispatch({ workflow, prompt })` in addition to
  `dispatch({ node, prompt })`; exactly one target is required.
- Record the main `workflow` on the dispatch and expose it in
  `dispatch/status`.
- Reject strict escapes with a `workflow.escape` defect; allow non-strict
  escapes.
- Move session retention from nodes to handoffs: `resume: true` is honored
  only when the handoff target is the node that supplied the current input;
  false/omitted starts a new session. A non-return resume is a
  `resume.not-return` defect. Nodes have no session mode.
- Retain the target session only for resume-return routes; delete retained
  sessions at dispatch end.
- Add structured runtime to the `graph-map` response:
  `runtime.active`, `runtime.queue`, `runtime.lastDefect`,
  `runtime.lastEvent`.
- Add `version` and `valid` to `graph-info`; the engine version is `v1.3.0`.
- Keep the durable removal of the regenerated `graph-view` agent and
  `/graph` command: remove the agent file if present, delete the obsolete
  CLI and its test, and clean the live proof/docs references.
- Update the dispatching/graph-authoring skills and engine documentation
  affected by the new dispatch form and workflow boundaries.

## Validation condition

The engine/config tests pass (currently 56 tests); a workflow dispatch
records and reports its main workflow; a node dispatch reports
`workflow: null`; exactly one target is enforced; transitive connections
are computed correctly; strict escape produces a defect; `resume: true`
reuses only the session of the node that supplied the current input, and a
non-return resume defects; `graph-map.runtime` is structured and includes
active, queue, defect, and last event; active and queued records carry
their workflow; the CLI
reports `v1.3.0`; `graph-info` carries `version` and `valid`; and no
`graph-view` agent or `/graph` command is generated or regenerated. An
independent reviewer inspects the diff, test output, and `graph-map`
response.

## Out of scope

- Dashboard rendering.
- Concurrent workflow execution beyond the queue that already exists.
- Graph editing.

## Review gate

Before ticket 006, the independent reviewer must inspect the engine diff,
the tests, and a `graph-map` response, and explicitly answer:

- Is workflow engagement carried as data rather than inferred?
- Is strict escape enforced by the engine?
- Is resume route-scoped to the return-to-input source, with no node-level
  session flag?
- Is runtime structured enough that the dashboard never parses the state
  string?
- Did the durable removal of the interim agent/command survive, including
  cleanup of an existing agent file and the obsolete CLI?
- Are the engine version and header validity source explicit?
