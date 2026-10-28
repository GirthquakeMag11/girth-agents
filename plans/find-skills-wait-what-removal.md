# Retiring the dead catalog items: `find-skills` and `/wait-what`

**Status:** settled, ready to execute. Carved out of
`plans/plugin-transition.md` at the user's direction (2026-10-27),
which ruled both items dead (chat M361). The standing trajectory
record `decisions/0007-plugin-transition.md` carries the same ruling
(consequences, second bullet).

## Objective

Remove the `find-skills` skill and the `/wait-what` command from the
catalog, and remove every live surface that names them. History stays.

## Scope — the complete surface list

Verified against the working tree at carve-out time (2026-10-27):

1. `.opencode/skills/find-skills/` — remove the directory. Its
   `SKILL.md` is the only carrier; the internal "Call the skill tool"
   mentions retire with it.
2. `.opencode/commands/wait-what.md` — remove the file.
3. `README.md` — remove three surfaces: the skills-table row for
   `find-skills`, the commands-table row for `/wait-what`, and the
   "Off the spine" `find-skills` line with its paragraph.
4. `THIRD_PARTY_NOTICES.md` — the one judgment call: the `find-skills`
   adaptation notice and its enclosing `## vercel-labs/skills` section
   exist solely for this item. Default proposal: retire the section
   with the item. Decided at execution time, not before.

No other catalog item calls either name — verified by search at
carve-out time (2026-10-27).

## Out of scope — stays untouched

- `CHANGELOG.md` — historical entries are history.
- `docs/research/*` — point-in-time survey and review records; they
  document the leftovers and stay as they are.
- `decisions/0007-plugin-transition.md` — the standing ruling stands.
- `scripts/`, `tracker/`, and every other skill and command.

## Execution steps

1. Delete the skill directory and the command file.
2. Make the three README edits.
3. Resolve the THIRD_PARTY_NOTICES judgment call (default: retire the
   section with the item).
4. Run `node scripts/validate.mjs` — green.
5. Commit with a conventional message
   (`feat(catalog): retire find-skills and /wait-what` or similar).

## Completion check

A search for `find-skills` and `wait-what` returns matches only in
history and records — CHANGELOG, `docs/research/`, `decisions/`, this
plan, and the pointer in `plans/plugin-transition.md` — and nowhere
live.