# 20: The direction-change path — ruled in a session, carried by the records

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 02 (catalog atomic sweep), 09 (review gate core), 11 (tracker kinds)

## What it delivers

The user can change direction mid-chain, and the machinery carries it
without special doors: a direction change is ruled in a session — an
amendment of the plan becomes a new plan revision through the same
review, aborting a workstream closes its records with the reason, and
re-answering a resolved question reopens it with the new answer.
Direction changes are authority, recorded like any ruling.

## Acceptance criteria

- [ ] Amending a plan produces a new reviewed revision, not an un-reviewed rewrite.
- [ ] Aborting a workstream closes its records with the reason, and the engine stops touching it.
- [ ] Re-answering a resolved question reopens it and the work resumes from the new answer.