# 05: README tells the three-verb story

**Parent:** specs/installer.md

**Kind:** feature

**Blocked by:** 03 (uninstall), 04 (update)

## What it delivers

The README's install section becomes the published surface of the new
script: a three-line install, a one-line uninstall, a one-line update, and
the alternatives (copy mode, skills-by-path) and warnings (dirty checkout,
files the installer will not touch) stated in the same three verbs rather
than a pasted `find` one-liner.

## Acceptance criteria

- [ ] The Install section shows install, uninstall, and update as the three
  entry-point verbs, with install as the default.
- [ ] The `find … -delete` uninstall one-liner is gone; copy-mode
  uninstalling is covered by the uninstall verb.
- [ ] The copy-mode and skills-by-path alternatives still read correctly
  against the new verbs.
- **Done — 2026-10-21:** README's Install section is now the three-verb story — install (default), uninstall, update — with the artifact table kept; the "Alternatives and details" block covers copy mode, uninstall/preservation, --dry-run/--help, and the skills-by-path alternative. The pasted `find -delete` one-liner is gone. CONTRIBUTING.md and AGENTS.md tooling notes updated to match.
