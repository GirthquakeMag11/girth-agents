# 02: The catalog's atomic sweep

**Parent:** specs/plugin.md

**Kind:** refactor

**Blocked by:** None (can start immediately)

## What it delivers

The catalog matches the settled fates in one atomic change, so the
linter never fires mid-rename: `tdd` becomes `test-driving`,
`writing-for-agents` becomes `technical-writing`; `find-skills`,
`wait-what`, `curate-inbox`, and `close-inbox` retire; `slicing`
becomes its own skill with the thin `/slice` door; `ideation` and
`/ideate` are born; `/spec` and `/implement` lose their doors while
their skills stay; `codifying` gains the convention-crash arrival path
(an in-flight collision spawns an authority question whose answer may
fold into the conventions); `domain-modeling` re-fits (engine-side in
the caregiver, interactive side guiding the user); `maintaining-docs`
carries zero drift tolerance; the tracking skill's references extend
for the new kinds; the wizard pair, `handoff`, `pickup`, and `/retro`
go to the shelf; borrowers and the README rows re-point in the same
sweep; the validator stays green throughout the result.

## Acceptance criteria

- [ ] Every rename, removal, birth, re-fit, and shelf move lands, and the linter reports a clean catalog at the end of the change as a whole.
- [ ] Nothing in the catalog converts to code unless a trigger needs it.
- [ ] `codifying`, `domain-modeling`, `maintaining-docs`, and the tracking skill's references each carry their settled re-fits.
- [ ] No reader of a renamed or removed item points at a name that no longer exists.
- [ ] The `/slice` door's body is the thin call into the slicing skill, whose procedure moved wholesale.
- [ ] Shelved items stay in the repo, unregistered — nothing half-dead ships.