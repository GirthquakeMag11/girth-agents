# 22: The context map and scoped reads

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 11 (tracker kinds), 02 (catalog atomic sweep)

## What it delivers

One root store per repository gains the context map: a record declaring
the repository's contexts and their inter-context relationships, an
optional `context:` field on entries for domain-qualified senses, and
scoped reads — an agent sees its context's slice, never the union blob.
Per-package physical placement happens only on warrant, recorded as a
deviation.

## Acceptance criteria

- [ ] The context map declares contexts and their relationships.
- [ ] Entries can carry a `context:` field.
- [ ] Scoped reads show an agent its slice; a demonstration shows the union blob is never served.
- [ ] A warrant-granted per-package placement is recorded as a deviation like any other.