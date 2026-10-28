# 03: Uninstall by the record

**Parent:** specs/installer.md

**Kind:** feature

**Blocked by:** 02 (the install record)

## What it delivers

Uninstalling removes exactly what an install put there — both links and
copies — and nothing else. It reads the record, lists what it would remove
plus any file the user has since replaced (which it leaves and reports),
asks one confirmation unless told not to, then removes the items and the
record itself, leaving the config directory as it was before the install,
the user's own files untouched.

## Acceptance criteria

- [ ] After an install in link mode and an uninstall, the scratch directory
  is back to its pre-install state.
- [ ] The same, for copy mode.
- [ ] A file the user created or replaced at a recorded path is left in
  place and reported, not removed.
- [ ] Uninstall asks one confirmation; `--yes` skips it; `--dry-run` lists
  what would be removed and removes nothing.
- **Done — 2026-10-21:** uninstall removes exactly what girth.yaml lists — links and copies — leaves anything the user changed or added (detected against the recorded fingerprint/symlink target), asks one confirmation unless --yes, previews with --dry-run, and deletes the record last. Harness grew to 57 assertions; the missing-exit fall-through was caught by the tests.

- **Done — 2026-10-27:** retired without work — the parent spec was retired by the plugin transition.
