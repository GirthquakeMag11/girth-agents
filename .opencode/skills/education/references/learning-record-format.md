# Learning record format

Learning records live in `learning-records/`, numbered in sequence:
`0001-<slug>.md`, `0002-<slug>.md` — scan for the highest number and
increment. They are decision-grade insights, not a journal: what is now
known and why that changes what gets taught next.

```markdown
# {Short title of what was learned or established}

{1-3 sentences: what was learned, or what prior knowledge was established,
and why it matters for future sessions.}
```

That is the whole format. Optional parts, added only when they carry real
information: a `Status:` line (`active`, or `superseded by LR-NNNN`),
`Evidence:` (how the learner demonstrated it), and `Implications:` (what it
unlocks or rules out).

## When to write one

1. **Understanding demonstrated** — the learner can use a non-trivial
   concept correctly, not merely met it.
2. **Prior knowledge disclosed** — "I already know X," with the depth
   claimed, so it is never re-taught.
3. **A misconception corrected** — previously wrong, now seen; these predict
   future stumbles in related topics.
4. **The mission shifted** — cross-link `MISSION.md` and update it.

Not qualifying: material merely covered (coverage is not learning), anything
already in the workspace glossary, and session-by-session activity logs.

## Supersession

When a later record contradicts an earlier one, mark the old record
`Status: superseded by LR-NNNN`; never delete it. The history of how
understanding evolved is itself signal.