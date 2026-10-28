# 10: Bootstrapping checks for gh and offers the setup wizard

**Parent:** specs/installer-experience.md

**Kind:** feature

**Blocked by:** None (can start immediately)

## What it delivers

Bootstrapping learns a new scaffold concern: whether the `gh` CLI is
present for release publication. Missing, it offers a packaged setup
wizard — walked with the user — that installs and readies gh. A
declination, here or at the cut, is recorded in the project's conventions
and the check skips silently from then on.

## Acceptance criteria

- [ ] Bootstrapping's inventory and interview cover the gh presence check.
- [ ] The wizard is packaged with the skill, executable, and walks the user to a working gh.
- [ ] Recording a declination lands a convention entry per the codifying format; later runs skip the check.
- [ ] No other skill's contract (the scaffold inventory) contradicts the new piece.
- [ ] Validator green.

- **Done — 2026-10-21:** bootstrapping gained "Release tooling: the gh
  CLI" — exploration notes whether gh is present, a missing gh becomes an
  interview item offering `references/gh-setup-wizard.md` (a walk the
  agent runs with the user: install, `gh auth login`, verify), and a
  declination is recorded in conventions via codifying with the check
  skipped silently thereafter. The wizard is a walked reference, not a
  shell script, because authentication is a human-in-the-browser step.
  Validator green.
- **Done — 2026-10-27:** retired without work — the parent spec was retired by the plugin transition.
