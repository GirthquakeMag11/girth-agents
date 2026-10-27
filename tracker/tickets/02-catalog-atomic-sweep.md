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
their skills stay; the wizard pair, `handoff`, `pickup`, and `/retro`
go to the shelf; borrowers and the README rows re-point in the same
sweep; the validator stays green throughout the result.

## Acceptance criteria

- [ ] Every rename, removal, birth, and shelf move lands, and the linter reports a clean catalog at the end of the change as a whole.
- [ ] No reader of a renamed or removed item points at a name that no longer exists.
- [ ] The `/slice` door's body is the thin call into the slicing skill, whose procedure moved wholesale.
- [ ] Shelved items stay in the repo, unregistered — nothing half-dead ships.