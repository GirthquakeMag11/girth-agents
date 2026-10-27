# 12: The tracker's new kinds, the context map, and scoped reads

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 02 (catalog atomic sweep)

## What it delivers

The tracker grows the settled kinds: term proposals and lessons, each
following the one-file-per-kind convention; questions declare their
kind — authority or information — and existing entries carry it
retroactively; defects gain the system provenance flag. One root store
per repository gains a context-map record declaring the repository's
contexts and their relationships, an optional `context:` field on
entries for domain-qualified senses, and scoped reads — an agent sees
its context's slice, never the union blob. Per-package placement only
on warrant, recorded as a deviation.

## Acceptance criteria

- [ ] Term proposals and lessons exist as tracked kinds with their file conventions.
- [ ] Every question entry declares its kind; the retrofit covers the existing entries.
- [ ] Defects can carry the system provenance flag.
- [ ] The context map declares contexts and relationships; entries can carry a `context:` field.
- [ ] Scoped reads show an agent its slice; a demonstration shows the union blob is never served.