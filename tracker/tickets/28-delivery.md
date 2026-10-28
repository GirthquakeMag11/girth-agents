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

## Work so far

- 2026-10-28: built test-first against real git and file remotes — no mocking. The delivery module commits its units with conventional messages, syncs pull-first (an absent remote branch is nothing-to-pull, never an error), holds commits locally through an unreachable remote and retries next pass, and on genuine divergence holds everything — working tree, local history, remote — with no merge, no rewrite, no force-push. The raise-through-the-exit-path half rides with ticket 29's entry/exit wiring; the module's held-diverged state is the signal that feeds it.

- **Done — 2026-10-28:** delivery lands at `engine/delivery.mjs`; four tests, real git, 35 green across the suite.

- [ ] Each unit of work lands as its own conventional commit, pushed after a pull
- [ ] A failed push holds the commits locally and retries them on the next pass
- [ ] A rejected push from non-fast-forward divergence leaves the tree untouched and raises the typed stop
- [ ] No history rewriting operation is ever attempted, by every exercised path