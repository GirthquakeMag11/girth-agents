# 08: Handoff touch points — the surrounding documents stay true

**Parent:** specs/handoff-pickup.md

**Kind:** refactor

**Blocked by:** 07 (needs the final command surfaces)

## What it delivers

Every surrounding document the spec names, made true again: the
questionnaire skill's line about `/handoff`'s home, the teaching skill's
handoff pointer, the README's catalog tables and chains map, and the
changelog's Unreleased section.

## Acceptance criteria

- [ ] The questionnaire skill's line about `/handoff` no longer claims a temp-directory home the command has left; questionnaires keep their own home.
- [ ] The teaching skill's resume pointer stays true — the long-run handoff now names both doors, `/handoff` and `/pickup`.
- [ ] README: the skills table gains the `handoff` row, the commands table rewords `/handoff` and gains `/pickup`, and the chains map gains the session-boundary pair.
- [ ] CHANGELOG: the Unreleased section gains the Added entries (the skill, `/pickup`) and the Changed entry (`/handoff`).
- [ ] Validator green.

- **Note — 2026-10-27:** this ticket's `teaching` mentions are
  historical — `decisions/0006` retired the skill; nothing here needs
  doing.

- **Done — 2026-10-21:** questionnaire's line no longer claims a
  temp-dir home for `/handoff` and keeps its own home; teaching's pointer
  names both doors; README gains the `handoff` skill row, the reworded
  `/handoff` row, the `/pickup` row, and the session-boundary pair in
  "Driving the catalog"; CHANGELOG Unreleased holds the Added and Changed
  entries. A fresh-context sweep found no other stale reference; its two
  cosmetic flags (table padding, changelog spacing) are fixed. Validator
  green.