# 001 — Record dashboard decisions in THREADS.md

**Status:** superseded by `DASHBOARD-SPEC.md` and tickets 005–009  
**Sequence:** 1 of 4  
**Depends on:** none

## Context

The dashboard scope is settled: read-only v1 for understanding the graph's
structure, behavior, and current state. Record the decisions before drawing so
the mockup is not built on unrecorded assumptions.

## Work

Add these bullets under `## T3 — UI/UX and graph perception` →
`### User decisions`:

- The three-column dashboard frame — graph sidebar, canvas/table, inspector,
  and read-only run console — is the leading layout reference.
- v1 is read-only and exists to show the graph's structure, behavior, and
  current state. It has no graph editing, no Validate/Apply/Run/Dispatch
  controls, no product/agent tabs, and no scoped chat.
- Work is dispatched through the interactive agent's `dispatch` tool.
- The overlay is modal: Escape returns to the same chat, session, and agent
  without changing tabs.

Fold this into the existing uncommitted `THREADS.md` edit. Do not change T1,
T2 (already removed), or any other section. Show the diff.

## Validation condition

`git diff --name-only` lists only `THREADS.md`, and the four decisions are
present under T3; no commit is created.

## Out of scope

- Drawing the frame.
- Code, tests, or engine changes.
- Committing.
