# 04: Update reconciles

**Parent:** specs/installer.md

**Kind:** feature

**Blocked by:** 02 (the install record)

## What it delivers

Updating brings an installed catalog current in one command. It refuses a
dirty checkout with an explanation rather than pulling over local edits,
then pulls the checkout forward and reconciles: links pick up the change in
place, retired items' links are pruned, new items link in, copies re-copy
only when their source changed, and the run reports the before-and-after
release so the user sees what they are taking on, rewriting the record to
match the new state.

## Acceptance criteria

- [ ] A dirty checkout stops the update with an explanation and changes
  nothing.
- [ ] After a pull that adds and retires items, re-running update prunes the
  retired, links the new, and leaves the rest in place.
- [ ] In copy mode, only items whose source changed are re-copied.
- [ ] The before-and-after release is reported; the record is rewritten to
  the new state; `--dry-run` changes nothing.
- **Done — 2026-10-21:** update pulls the checkout forward (refusing a dirty checkout) and reconciles — retired copies and links are removed, new items linked or copied, and copies re-written only when their source changed (against the record's fingerprints), then reports before→after from the release name and rewrites girth.yaml. Copy mode is carried over from the record when --copy is not repeated. --dry-run previews without pulling. Harness now 77 assertions across four new git-repo scenarios.
