# The slicing skill and `/slice`'s door

**Status:** settled, ready to execute. Carved out of
`plans/plugin-transition.md` at the user's direction (2026-10-27).
Rulings: slicing becomes its own skill, the procedure moving out of the
`/slice` command body into the skill (chat M334); `/slice` survives as
the thin shortcut that starts the skill, its body shrunk to the starting
instruction (chat M431). The standing trajectory record
`decisions/0007-plugin-transition.md` carries the same ruling
(consequences, second bullet).

## Objective

Create the `slicing` skill carrying the slicing procedure, and shrink
`/slice` to the thin door that starts it.

## Scope — the complete surface list

Verified against the working tree at carve-out time (2026-10-27):

1. `.opencode/skills/slicing/SKILL.md` — created. Its body is the
   procedure that currently lives in the `/slice` command body (steps
   1–7: find the item, read it completely, slice into tracer-bullet
   tickets, assign each `Kind:`, write the tickets, one checkpoint,
   report and stop), moved wholesale — no new content authored. The
   frontmatter carries a `description` under 300 characters, per the
   catalog rules.
2. `.opencode/commands/slice.md` — shrunk to the thin starting
   instruction that calls the skill tool with `slicing`. Its frontmatter
   description still names what `/slice` delivers; unchanged.
3. `README.md` — add the `slicing` row to the skills table (the repo's
   own workflow requires a Catalog row for a new item). The `/slice`
   commands-table row stays as it is — the door keeps its job.

## Out of scope — stays untouched

- `implementing`, `specifying`, and `/implement` — their `/slice`
  references stay true, because the command keeps its job.
- `AGENTS.md` and `CONTRIBUTING.md` — no slicing references exist there
  (verified 2026-10-27).
- `decisions/0007-plugin-transition.md` — the standing ruling stands.
- `CHANGELOG.md` and `docs/research/*` — history and point-in-time
  records.

## Execution steps

1. Create the `slicing` skill directory with `SKILL.md` carrying the
   moved procedure.
2. Shrink `/slice`'s body to the starting instruction.
3. Add the README skills-table row.
4. Run `node scripts/validate.mjs` — green.
5. Commit with a conventional message (`feat(skills): slicing` or
   similar).

## Completion check

`/slice`'s body is the thin starter that calls the skill tool with
`slicing`; the new skill carries the full procedure; the README skills
table lists `slicing`; the linter is green.