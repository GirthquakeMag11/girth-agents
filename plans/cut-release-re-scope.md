# `/cut-release`'s re-scope: release notes minus the retired one-line install

**Status:** settled, ready to execute. Carved out of
`plans/plugin-transition.md` at the user's direction (2026-10-27),
which settled the re-scope (chat M588): each release tag gets a GitHub
Release page carrying the changelog section as the notes, minus the old
one-line install — the install line's audience is gone, and old notes
stay as history.

## Objective

Edit `/cut-release`'s step 5 so the published release body carries the
changelog notes and nothing else.

## Why the surface is one file

The governing spec `specs/installer-experience.md` — whose three spots
described the release body carrying the line — was ruled stale and
deleted (2026-10-27), and the remaining specs followed. With the
governing doc gone, the behavior lives in one place: the command.

## Scope — the complete surface list

Verified against the working tree at carve-out time (2026-10-27):

1. `.opencode/commands/cut-release.md`, step 5 — delete the clause "and
   the one-line install — clone, change in, run the script, the exact
   line as the README's Install section leads with it — in the body".
   The step then reads: "Publish the release on GitHub: the changelog's
   new section as the notes via `gh release create`." Everything else
   in the step — the gh check behind it, the wizard routing, the
   recorded declination — is untouched.
2. Nothing else changes. The frontmatter description and the README
   commands-table row are already at target state ("publishes the
   GitHub Release", no install line), verified 2026-10-27.

## Out of scope — stays untouched

- `README.md`'s Install section — it still leads with the clone-and-run
  line today; retiring it belongs to the old-install-path ruling, not
  this objective. The deleted clause is exactly the command's
  dependence on that section; removing the clause severs it.
- `plans/installer-experience.md` — a done plan; its "one-liner's home"
  decision stays as a record.
- `tracker/tickets/14` and `15`, `CHANGELOG.md`, `tracker/QUESTIONS.md`,
  `docs/research/*` — records; the change is recorded forward, never by
  editing them.
- The parked question of whether `/cut-release` stays the catalog's
  release door or moves to maintainer tooling once the plugin exists —
  the plugin build's business, not this re-scope's.

## Execution steps

1. Make the step-5 edit.
2. Run `node scripts/validate.mjs` — green.
3. Commit with a conventional message
   (`refactor(commands): /cut-release drops the retired one-line
   install` or similar).

## Completion check

Step 5 publishes the changelog notes via `gh release create` with no
install line; a search for "one-line install" finds matches only in
history, records, this plan, and the transition map's pointer — and
nowhere live.