---
name: Plans
description: Defines plans/, the live maps of large efforts — the destination, the decisions made so far, the not-yet-specified, and what is out of scope. Use when writing or editing a plan map.
metadata:
  girth/role: owner
---

# Plans

## Purpose

`plans/`, at the project root, holds one live map per large effort: a
destination too big or too foggy to plan in a single pass. The map charts
the *way to* a settled plan, not the plan itself — that is `specs/`. It is
worked decision by decision until the way is clear, then closed. Its
creation template is `references/template.md`.

## What belongs

- **One map per effort**, created when the way to the destination is not yet
  visible. A map is a live index of route-finding: which decisions are
  settled, which are still open, which cannot yet be stated, and what lies
  beyond the destination.
- **An index, not a store.** A decision lives in one place — the tracker
  question that resolved it — and the map only gists it and links.
- **Nothing settled elsewhere:** open questions live in `tracker/QUESTIONS.md`,
  recorded rulings in `conventions/`, `decisions/`, or `GLOSSARY.md`, and the
  finished design in `specs/`.

## Format

One file per effort, `plans/<slug>.md`, a short kebab-case name for the
effort:

```markdown
# <Map title>

**Status:** charting | done

## Destination
<!-- What reaching the end of this map looks like: the spec, decision, or
     change this effort is finding its way to. One or two lines; every
     session orients to it first. -->

## Notes
<!-- The domain; skills to consult; standing preferences for this effort. -->

## Decisions so far
<!-- The index: one line per resolved question, enough to judge relevance,
     linking to the question that holds the detail. -->

## Not yet specified
<!-- The fog: decisions coming into view but not yet sharp enough to state
     as questions. -->

## Out of scope
<!-- Work ruled beyond the destination. Never graduates into questions. -->
```

## Changing it

A map changes only along its front: a resolved decision is gisted into
`Decisions so far`; what an answer sharpens graduates from `Not yet
specified` into a tracker question, and what proves to sit beyond the
destination moves to `Out of scope`. When the way is clear — every decision
resolved and nothing left to state — the map is marked `done` and hands off.
A map that is `done` is history; a redrawn destination is a new map.