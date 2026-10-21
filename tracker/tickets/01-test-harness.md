# 01: Test harness for the installer

**Parent:** specs/installer.md

**Kind:** refactor

**Blocked by:** None (can start immediately)

## What it delivers

A runnable test harness that drives the installer against a scratch config
directory and a small fixture catalog, and asserts the installer's current
behavior survives every future change: it places exactly the fixture's
agents, skills, and commands; symlink and copy modes both work; re-running
prunes links to retired items and leaves the user's own files alone. Running
the harness is one command and its exit code tells the truth, so each later
ticket hangs its new assertions on the same harness.

## Acceptance criteria

- [ ] Running the harness with a clean fixture links (and copies, in copy
  mode) exactly the fixture's items into the scratch config directory.
- [ ] A pre-existing real file at a destination is left untouched and
  reported, in both modes.
- [ ] Re-running after the fixture retires an item prunes the stale link.
- [ ] The harness is one command, exit-code-truthful, with no external
  framework beyond shell.
- **Done — 2026-10-21:** `scripts/test-installer.sh` — 15 assertions, green: symlink install (exact set), copy install, user-file preservation, retired-item pruning.
