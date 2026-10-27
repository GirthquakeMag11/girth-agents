# 17: The recall layer — learned once, verified, stratified

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 10 (review gate core), 13 (report pile, routing, exception), 12 (tracker kinds and context map)

## What it delivers

Lessons are learned once. The reviewer jots candidate claims while
writing its report; the engine's idle consolidation pass collects them,
checks them against what is already known, and hands them to prove-it.
A verified claim stratifies into the lessons kind only after it recurs
across separate work — a first occurrence stays a hazard, an
unverifiable claim vanishes into the ordinary question machinery only
if its uncertainty blocks work. The store is committed and subordinate
to the canonical records, capped at one hundred entries with
least-re-ratified retirement, and read two ways: whole-kind injection
only under the dispatch's relevance check and budget, else on-demand
lookup right before the tool use it would inform.

## Acceptance criteria

- [ ] Candidate claims ride the reviewer's report and reach the consolidation pass.
- [ ] prove-it verifies claims against confirmed knowledge; unverifiable claims do not stratify.
- [ ] Two separate occurrences of the same lesson stratify it; one occurrence remains a hazard.
- [ ] The store honors the cap and the retirement rule; the two read modes both function.