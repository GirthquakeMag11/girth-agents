# 02: Install verifies and records

**Parent:** specs/installer.md

**Kind:** feature

**Blocked by:** 01 (test harness)

## What it delivers

Installing becomes self-proving and self-recording. Before placing anything,
install runs the catalog lint and refuses — with a clear message — to install
a catalog that fails; a clean catalog installs exactly as before. When
install succeeds it leaves behind a YAML record of what it placed: each item,
where it went, whether it was linked or copied, a fingerprint of the source
it came from, the install mode, and the current release — written only after
every item is placed, so a completed install and a complete record never
disagree. `--help` explains the verbs, and `--dry-run` prints what install
would do without doing it.

## Acceptance criteria

- [ ] Install against a fixture that fails the catalog lint exits non-zero,
  places nothing, and says why.
- [ ] Install against a clean fixture places every item and writes a YAML
  record listing exactly those items with their mode and fingerprint.
- [ ] A completed record exists only when every item was placed; an
  interrupted install leaves no half-record.
- [ ] `--dry-run` changes nothing on disk; `--help` documents install,
  uninstall, and update.