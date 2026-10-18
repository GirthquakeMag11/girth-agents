---
name: Maintaining Glossary
description: Build and sharpen the project's shared language in GLOSSARY.md — challenge a term that conflicts with the glossary, propose a precise word for a vague or overloaded one, and record a term the moment the user settles it, with its rejected synonyms. Use when project terminology is being settled, disputed, or changed, or when editing GLOSSARY.md.
---

# Maintaining Glossary

The glossary is the project's shared language: one canonical word per
concept, so the user, agents, code, and documents all say the same thing.
This skill is the active work of *changing* that language. Reading
`GLOSSARY.md` to borrow its vocabulary is a habit, not this skill.

## What belongs

- **Terms specific to the project's domain.** General programming concepts
  stay out even when the project uses them heavily. Before adding a term,
  ask: is this concept unique to this project's context, or general? Only
  the former belongs.
- **Definitions, and nothing else.** An entry says what a thing *is*.
  Implementation details, specifications, decisions, and working notes
  live elsewhere — rulings about how things are done in `conventions/`,
  open matters in the question tracker, behavior in the code and docs. A
  glossary that absorbs them turns into a running spec, and that is its
  most common failure.

## Settling a term

A term becomes canonical when the user settles it. Domain language belongs
to the people who use it: propose, and let the user decide.

- **Challenge conflicts.** When the user uses a term against its glossary
  meaning, call it out immediately: "The glossary defines *cancellation*
  as X, but you seem to mean Y. Which is it?"
- **Sharpen fuzzy language.** When a word is vague or doing several jobs,
  propose a precise canonical term: "You're saying *account* — do you mean
  the Customer or the User? Those are different things."
- **Stress-test with scenarios.** When concepts and their boundaries are
  under discussion, invent concrete edge cases that force the boundary to
  be stated exactly.
- **Cross-reference with the code.** When the user states how something
  works, check whether the code agrees, and surface any contradiction
  before changing either: "The code cancels whole Orders, but you just
  said partial cancellation is possible. Which is right?"
- **Record inline.** Write the term into `GLOSSARY.md` the moment it is
  settled, mid-conversation. A glossary written at the end of a session is
  a summary; the inline one is the session's output.

When the user cannot settle a term now, track a question with the
tracking skill (questions): the term, the competing meanings, and the usage
you are proceeding with provisionally.

## Entry format

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

Two more sections join the file when they are first needed:

- `## Relationships` — settled relationships between terms, one bullet
  each, terms in bold: `- An **Order** holds one or more **Line items**`.
- `## Flagged ambiguities` — words that meant more than one thing, and how
  each was resolved: `- "backlog" meant both the tool and the work in it.
  Resolved: the tool is the **Issue tracker**; "backlog" is retired.`

## Revising

Understanding deepens, and definitions follow it. Update an entry in place
when the user refines its meaning. When a term is retired, move its word to
the replacing term's `_Avoid_` list and record the resolution under
`## Flagged ambiguities` — that section keeps the history, so the entries
can stay current. A healthy glossary gets shorter as often as it gets
longer.

## The file

`GLOSSARY.md` in the project root. If it does not exist, load the
bootstrapping skill, create the file per its GLOSSARY section, then add the
term.

## Related skills

- bootstrapping — creates `GLOSSARY.md` when it is missing.
- conventions — rulings about how things are done; the glossary holds only
  what things are.
- tracking — the channel for terms the user cannot settle yet.
- maintaining-docs, maintaining-changelog — sibling documents written in
  the glossary's language.