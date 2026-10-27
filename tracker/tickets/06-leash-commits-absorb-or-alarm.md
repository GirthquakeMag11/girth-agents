# 06: The leash — forbidden moves, safe commits, absorb-or-alarm

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 04 (engine skeleton)

## What it delivers

The engine's discipline is executed in code: the forbidden list (no
force-push, rebase, history reset, branch deletion, or self-merging;
no files beyond the records and its tickets' named files; no secrets it
was not handed; no network commands beyond pushes and self-reports);
per-unit commits, conventionally messaged, pushed as they go, onto the
working branch; pull-first before every push; a conflicting push holds
and raises through the inbox rather than merging; offline pushes hold
locally and retry. Before touching a file the user has edited, the
engine checks the edit against its accounting — absorbed silently when
it fits, raised through the inbox when it does not, never built on
until answered.

## Acceptance criteria

- [ ] The forbidden list is enforced — the engine cannot perform any listed move.
- [ ] User sessions live outside the engine and never compete for its queue.
- [ ] Each unit of engine work lands as its own conventional commit, pushed as it goes.
- [ ] A non-fast-forward push holds and raises; nothing is merged or forced.
- [ ] An offline push holds locally and retries on the next pass.
- [ ] A user edit in an engine file is absorb-or-alarmed, never committed around, never built on unanswered.