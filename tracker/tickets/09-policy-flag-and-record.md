# 09: The record gains the policy, and the policy flag lands

**Parent:** specs/installer-experience.md

**Kind:** feature

**Blocked by:** None (can start immediately)

## What it delivers

The update policy becomes first-class data. `--policy manual|notify|auto`
parses, validates, and lands in the install record beside the release
name; every verb reads it back, and installing without a policy
records nothing until one is given. The record stays the sole source of
truth, written last and removed last as today.

## Acceptance criteria

- [ ] `--policy` accepts exactly three values; anything else fails naming them.
- [ ] The record written by install carries `policy:` and the release name, and a later run reads both back unchanged.
- [ ] The harness gains assertions for policy parsing and record round-trip; the existing 79 assertions stay green.
- [ ] Validator green.

- **Done — 2026-10-21:** `--policy manual|notify|auto` parses and
  validates (exit 2 on anything else, message naming the three); the
  record's header now carries `policy:` beside the release, written by
  both install and reconcile, and a re-install without the flag carries
  the recorded policy forward. Harness: 85 green (three new tests —
  recorded, carried, rejected). Validator green.