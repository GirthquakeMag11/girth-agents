# 15: Knowledge management — the caregiver, proposals, admissions

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 07 (six helpers defined), 11 (tracker kinds), 14 (inbox machinery)

## What it delivers

The glossary's discipline works end to end: anyone meeting a
term-that-matters jots a proposal; the caregiver — the glossary's
designated labor — filters it ("not worth attending to" ends there,
with no caregiver-side changes), drafts the suggested definition, and
the warranted proposal opens an inbox question carrying the context
and the suggestion. The user confirms in seconds or crafts their own;
changes to the glossary carry convention weight, and the entry lands by
the recorded format. The review gate grades whether work uses terms as
the glossary defines them; the mechanical gate checks the glossary's
form only — duplicate spellings, malformed entries, empty definitions —
never its meaning.

## Acceptance criteria

- [ ] A jotted proposal becomes a tracked term proposal.
- [ ] The caregiver's filter admits only warranted proposals to the inbox; filtered items change nothing.
- [ ] A warranted proposal opens one inbox question with context and the suggested definition.
- [ ] A confirmed or user-crafted definition lands in the glossary in the recorded format.
- [ ] The form-only mechanical check runs against the glossary; meaning is never a linter's call.
- [ ] A review FAILs a piece that uses a term in a drifted sense.