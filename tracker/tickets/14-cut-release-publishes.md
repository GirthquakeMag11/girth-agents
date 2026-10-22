# 14: /cut-release opens the GitHub Release

**Parent:** specs/installer-experience.md

**Kind:** feature

**Blocked by:** 10 (points at the wizard when gh is missing)

## What it delivers

The cut also publishes. `/cut-release` opens the GitHub Release for the
tag it just cut — the changelog section as the notes, the one-line
install in the body — via the gh CLI. Finding no gh, it points at
bootstrapping's setup wizard; declining skips the release body, and the
declination is recorded in the project's conventions so later cuts skip
quietly.

## Acceptance criteria

- [ ] The command opens a GitHub Release for the new tag with the changelog notes and the install line.
- [ ] Without gh, it surfaces the wizard; a declination is recorded per the codifying format and the check skips thereafter.
- [ ] The command's prose names the bootstrapping wizard, not a bare gh binary.
- [ ] Validator green; a fresh-context reader replays a cut with and without gh from the command's text.

- **Done — 2026-10-21:** `/cut-release` gained the publish step — the
  changelog's new section as the release notes and the one-line install in
  the body via `gh release create`, honoring a conventions-recorded
  declination, and routing a missing gh to bootstrapping's setup wizard
  with a decline recorded by codifying. A fresh-context reviewer replayed
  the cut with and without gh from the command's text alone; its two
  cosmetic gaps (the exact line's home, the gh invocation) are now named
  in the prose. Validator green.