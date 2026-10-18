---
name: Domain Modeling
description: Build and sharpen the project's domain model — settle terms in GLOSSARY.md, record hard-to-reverse decisions in decisions/. Use when project terminology is settled, disputed, or changed, or when a significant design decision is made.
---

# Domain Modeling

Build and sharpen the project's domain model while the work is designed: its
language in `GLOSSARY.md`, its significant decisions in `decisions/`. This is
the active discipline of *changing* the model. Reading the glossary and the
decision records for guidance is a habit any agent keeps.

The model belongs to the user: propose terms and decisions, and let the user
settle them. When the user cannot settle one now, call the skill tool with
`tracking` and track a question — the term or decision, the options, and the
provisional choice you are proceeding with.

## The language

One canonical word per concept, so the user, agents, code, and documents all
say the same thing.

- **Challenge conflicts.** When the user uses a term against its glossary
  meaning, call it out immediately: "The glossary defines *cancellation* as
  X, but you seem to mean Y. Which is it?"
- **Sharpen fuzzy language.** When a word is vague or doing several jobs,
  propose a precise canonical term: "You're saying *account* — do you mean
  the Customer or the User? Those are different things."
- **Stress-test with scenarios.** When concepts and their boundaries are
  under discussion, invent concrete edge cases that force the boundary to be
  stated exactly.
- **Cross-reference with the code.** When the user states how something
  works, check whether the code agrees, and surface any contradiction before
  changing either.
- **Record inline.** Write the term the moment it is settled,
  mid-conversation. A glossary written at the end of a session is a summary;
  the inline one is the session's output.

Read `references/glossary-format.md` before writing an entry: it holds what
belongs, the entry format, and how to revise.

## Decisions

Offer to record a decision only when all three hold:

1. **Hard to reverse:** changing course later has a real cost.
2. **Surprising without context:** a future reader would wonder why the
   project is shaped this way.
3. **The result of a real trade-off:** there were genuine alternatives, and
   one was picked for specific reasons.

Miss any one and there is no record: an easily reversed choice simply gets
reversed, an unsurprising one is nobody's question, and a choice without
alternatives records only that the obvious thing was done.

A decision differs from a convention. A convention is a standing ruling
about how something is done; a decision record explains why the project took
one shape over another. When a decision implies a standing rule, record
both, the convention pointing to the record.

Write the record once the user confirms it, per
`references/decision-format.md`.

## The files

`GLOSSARY.md` and `decisions/` at the project root. If one does not exist,
call the skill tool with `bootstrapping`, create it per that piece, then
write the entry.

## Related skills

- conventions — standing rulings on how things are done; the glossary holds
  only what things are.
- tracking — the questions tracker holds terms and decisions the user cannot
  settle yet.
- maintaining-docs — the documents are written in the glossary's language.