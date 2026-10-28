# 28: Delivery — per-unit commits, pushes, and the non-fast-forward hold

**Parent:** specs/engine.md

**Kind:** feature

**Blocked by:** 24 (the process whose work it commits)

## What it delivers

The engine's hands on git: one commit per meaningful unit of work with a
conventional message, pushed as it goes, pull-first; unpushed commits
held locally and retried on the next pass while offline; never a
force-push, rebase, reset, or self-performed merge. On non-fast-forward
divergence the engine holds its commits, leaves the working tree alone,
and raises a typed stop through the exit path — reconciliation is the
user's authority.

## Acceptance criteria

- [ ] Each unit of work lands as its own conventional commit, pushed after a pull
- [ ] A failed push holds the commits locally and retries them on the next pass
- [ ] A rejected push from non-fast-forward divergence leaves the tree untouched and raises the typed stop
- [ ] No history rewriting operation is ever attempted, by every exercised path