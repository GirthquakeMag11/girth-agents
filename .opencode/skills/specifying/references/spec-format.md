# Specs

## Purpose

`specs/`, at the project root, holds the project's design documents: one
file per design effort, capturing what is being built and the decisions that
pin the design down, so the work can be planned and reviewed against it. A
spec answers *what will be built and how its choices were settled*. Its
creation template is `references/spec-template.md`.

## What belongs

- **One spec per design effort**, written on request and approved by the
  user before anything is built from it.
- **The design itself**, not the plan of attack: tickets sliced from a spec
  live in the tracker, not here.
- **Only what is settled.** Open questions wait in the questions tracker;
  standing rulings on how things are done live in `conventions/`.
- A decision *inside* a spec that clears the bar for a decision record —
  hard to reverse, surprising without context, a real trade-off — is also
  recorded in `decisions/`, with a pointer between them.

## Format

One file per spec, `specs/<slug>.md`, a short kebab-case slug naming the
effort. The file:

```markdown
# <Spec title>

## Problem Statement
<The problem the user is facing, from the user's perspective.>

## Solution
<The solution, from the user's perspective.>

## User Stories
<A long, numbered list: "As a <actor>, I want <a feature>, so that <benefit>."
Covers every aspect of the feature.>

## Implementation Decisions
<Modules built or changed, their interfaces, architectural decisions, schema
changes, API contracts. No file paths or code snippets — they go stale fast;
inline a snippet only when it encodes a decision more precisely than prose.>

## Testing Decisions
<What makes a good test here, which modules are tested, and the prior art.>

## Out of Scope
<What this spec deliberately does not cover.>

## Further Notes
<Anything the next reader needs.>
```

## Changing it

A spec is amended by the user, and the amended spec governs. Before relying
on one, read the current file rather than an earlier copy. Contradictions
between a spec and a recorded decision in `decisions/` are surfaced; the
record wins until the user re-settles both.
