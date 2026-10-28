# The renames: `tdd` → `test-driving`, `writing-for-agents` → `technical-writing`

**Status:** settled, ready to execute. Carved out of
`plans/plugin-transition.md` at the user's direction (2026-10-27).
Rulings: the renames themselves (chat M361); the finding that they must
land as one change, never a half-renamed catalog (the survey finding,
chat M497); and the re-scope — the renamed `test-driving` becomes the
broad practice of testing changes in real cases before trusting them,
the plugin's own testing system part of what it teaches and drives,
not just tests-first-then-code under a new name (chat M434). The
standing trajectory record `decisions/0007-plugin-transition.md`
carries the same ruling (consequences, second bullet).

## Objective

Rename both skills, sweep every naming knock-on, and re-fit
`test-driving` to the re-scope ruling — all in one commit.

## Scope — the complete surface list

Verified against the working tree at carve-out time (2026-10-27):

1. `.opencode/skills/tdd/` → `test-driving/` — the directory rename.
   Its `references/tests.md` and `references/mocking.md` travel with
   it.
2. `.opencode/skills/writing-for-agents/` → `technical-writing/` — the
   directory rename. No `references/` dir.
3. Self-name artifacts inside both renamed skills, re-fit in the same
   change to the new identities (tracking the renamed ids, i.e.
   `Test-Driving` and `Technical Writing`): `tdd`'s `name: TDD`
   frontmatter and `# Test-Driven Development` header;
   `writing-for-agents`' `name: Writing for Agents` frontmatter and
   `# Writing for Agents` header. A renamed skill whose own header
   still claims the old name is a half-renamed catalog.
4. `test-driving`'s `description` and body — re-fit to the re-scope
   ruling quoted above. The ruling is the target state; the authoring
   happens at execution, the existing body as raw material.
5. `README.md` — four spots: the two skills-table rows, the rails line
   ("tdd · code-review · …"), and the chain diagram line ("worked with
   tdd, …").
6. `CONTRIBUTING.md` — two spots: the naming example that lists `tdd`,
   and the craft pointer naming "the `writing-for-agents` skill".
7. `implementing/SKILL.md` — two call-forms "call the skill tool with
   `tdd`" (lines 43–44) re-pointed to `test-driving`; the surrounding
   words stay ("build it test-first" keeps its meaning inside the broad
   practice). These are rule-8 violations the moment the skill is
   renamed — the validator certifies the sweep.

## Sequencing and atomicity

- Land after the carved removal (`plans/find-skills-wait-what-removal.md`):
  `find-skills` still holds three `writing-for-agents` mentions (lines
  11, 83, 88 — name-references, not call-forms, so the linter never
  fires on them). Removing first means no window where an
  already-condemned file names a renamed skill. This plan does not
  touch `find-skills`; its mentions are the removal's surface.
- One unit: every change above lands in a single commit — the finding
  itself: "land as one change, not a half-renamed catalog."

## Out of scope — stays untouched

- `decisions/0007-plugin-transition.md` — the standing ruling stands.
- `CHANGELOG.md`, `docs/research/*`, `tracker/*` — history and
  point-in-time records; the research docs describe the pre-rename
  catalog and stay.
- `find-skills`' three mentions — the removal objective's surface.
- Other skills' wording re-fits "during the sweep" — a separate,
  later objective.

## Execution steps

1. Move the two directories (`git mv`).
2. Re-fit the self-name artifacts and `test-driving`'s `description`
   and body to the re-scope ruling.
3. Make the knock-on edits: README (4 spots), CONTRIBUTING (2),
   implementing (2).
4. Run `node scripts/validate.mjs` — green.
5. One commit, conventional message (`refactor(skills): rename
   tdd→test-driving, writing-for-agents→technical-writing` or
   similar).

## Completion check

`test-driving/` and `technical-writing/` exist; `tdd/` and
`writing-for-agents/` do not. A search for `writing-for-agents` across
`.opencode/` finds matches only inside `find-skills` (the removal's
surface) — and none at all once that plan has executed; a search for
`tdd` finds none anywhere. The validator is green; the change is one
commit.