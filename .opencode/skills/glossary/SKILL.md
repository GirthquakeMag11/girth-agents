---
name: Glossary
description: Defines GLOSSARY.md, the project's shared language — what belongs, the entry format, and how terms change. Use when writing or editing GLOSSARY.md.
metadata:
  girth/role: owner
---

# Glossary

## Purpose

`GLOSSARY.md`, at the project root, is the project's shared language: one
canonical word per concept, so the user, agents, code, and documents all say
the same thing. It answers *what things are*. Its creation template is
`references/template.md`.

## What belongs

- **Terms specific to the project's domain.** General programming concepts
  stay out even when the project uses them heavily: a term belongs only if
  the concept is unique to this project's context.
- **Terms the user has settled.** Every entry is canonical. A term still in
  dispute waits in the questions tracker until the user settles it.
- **Definitions, and nothing else.** An entry says what a thing *is*.
  Implementation details and specifications live in the code and docs,
  rulings on how things are done in `conventions/`, and decisions in
  `decisions/`. A glossary that absorbs them turns into a running spec,
  which is its most common failure.

## Format

The file opens with `# Glossary`, one or two sentences on the project's
domain, and a `## Terms` section holding the entries:

```markdown
**<Term>**:
<One or two sentences: what it is.>
_Avoid_: <rejected synonyms, comma-separated>
```

- **Opinionated.** Where several words exist for one concept, the entry
  picks the best and lists the rest under `_Avoid_`.
- **Tight.** One or two sentences: what the thing is, not what it does or
  how it works.
- **Self-referencing.** Definitions use the glossary's own terms.
- **Grouped** under subheadings when natural clusters emerge; a flat list is
  fine while the terms cohere.

Two more sections join the file when first needed:

- `## Relationships` — settled relationships between terms, one bullet
  each, terms in bold: `- An **Order** holds one or more **Line items**`.
- `## Flagged ambiguities` — words that meant more than one thing, and how
  each was resolved: `- "backlog" meant both the tool and the work in it.
  Resolved: the tool is the **Issue tracker**; "backlog" is retired.`

## Changing it

- Definitions follow understanding: an entry is updated in place when the
  user refines its meaning.
- A retired term's word moves to the replacing term's `_Avoid_` list, and
  the resolution is recorded under `## Flagged ambiguities`. That section is
  the history, so the entries themselves stay current.
- A healthy glossary gets shorter as often as it gets longer.