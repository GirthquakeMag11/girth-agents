# 009 — Dashboard live proof and documentation

**Status:** passed (independent review, 2026-10-30)  
**Sequence:** 5 of 5  
**Depends on:** 008  
**Spec:** `DASHBOARD-SPEC.md`

## Context

The native dashboard must be proved against the running engine, not only
inspected in isolation. The engine changes and the dashboard must be
documented together, and the obsolete interim graph view must stay
removed.

## Work

- Run the dashboard against the live engine with the product graph.
- Use the canonical temporary graph to exercise: active workflow
  container, queued workflow container, connected workflow container,
  escape warning, and a node dispatch with no container. Define and store
  the runnable non-strict and strict variants at
  `dashboard/fixtures/live-boundary.json` and
  `dashboard/fixtures/live-boundary-strict.json`; they must pass engine
  config validation.
- Confirm the engine still rejects strict escapes and that non-strict
  escapes are visual only, and that a strict defect is visible in the Run
  console or footer.
- Reload the graph while the panel is open and confirm the structure
  updates without a TUI restart.
- Capture evidence: the live-proof command output and panel captures at
  160×50 and 80×24. State the command used and where the artifacts live.
- Run the offline engine/config/UI test suite, including
  `node --test dashboard/test/*.test.mjs` (pure engagement tests and the
  static anti-canvas check).
- Update `SPEC.md`, `engine/README.md`, and `THREADS.md` for the workflow
  connections/strict/dispatch semantics and the native dashboard.
- Confirm the `graph-view` agent and `/graph` command are not regenerated
  and no canvas renderer remains.

## Validation condition

Reviewer-verified live proof and captured test output show all engagement
cases, the dashboard opens/refreshes/reloads/closes correctly, strict and
non-strict behavior is correct, strict defects are visible, the obsolete
interim view stays removed, no canvas renderer remains, and the
documentation matches the implementation.

## Out of scope

- New engine features beyond fixing a demonstrated defect.
- Editing or dispatch controls in the dashboard.
- Concurrent workflow execution beyond the displayed data model.

## Review gate

The independent reviewer must inspect the live-proof evidence, captured
panel frames, tests, static anti-canvas check, and documentation, and must
stop the sequence if any ticket's work was built on the character canvas or
violates the specification.
