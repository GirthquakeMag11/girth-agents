# Glossary format

## What belongs

- **Terms specific to the project's domain.** General programming concepts
  stay out even when the project uses them heavily. Before adding a term,
  ask: is this concept unique to this project's context, or general? Only
  the former belongs.
- **Definitions, and nothing else.** An entry says what a thing *is*.
  Implementation details, specifications, decisions, and working notes live
  elsewhere — rulings in `conventions/`, decisions in `decisions/`, open
  matters in the question tracker, behavior in the code and docs. A glossary
  that absorbs them turns into a running spec, and that is its most common
  failure.

## Entries

Terms go under `## Terms`:

```markdown
**<Term>**:
<One or two sentences: what it is.>
_Avoid_: <rejected synonyms, comma-separated>
```

- **Be opinionated.** Where several words exist for one concept, pick the
  best and list the rest under `_Avoid_`. This is how the language
  compresses.
- **Keep definitions tight.** One or two sentences: what it is, not what it
  does or how it works.
- **Define with the glossary's own terms.** Once a term exists, use it
  inside other definitions too.
- **Group under subheadings** when natural clusters emerge; a flat list is
  fine while the terms cohere.

## Further sections

Each joins the file when first needed:

- `## Relationships` — settled relationships between terms, one bullet
  each, terms in bold: `- An **Order** holds one or more **Line items**`.
- `## Flagged ambiguities` — words that meant more than one thing, and how
  each was resolved: `- "backlog" meant both the tool and the work in it.
  Resolved: the tool is the **Issue tracker**; "backlog" is retired.`

## Revising

Definitions follow understanding as it deepens. Update an entry in place
when the user refines its meaning. When a term is retired, move its word to
the replacing term's `_Avoid_` list and record the resolution under
`## Flagged ambiguities` — that section keeps the history, so the entries
stay current. A healthy glossary gets shorter as often as it gets longer.