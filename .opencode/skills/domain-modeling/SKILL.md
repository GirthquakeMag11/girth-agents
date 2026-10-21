---
name: Domain Modeling
description: Own the glossary and build and sharpen the domain model — challenge terms that clash with it, sharpen fuzzy terms, stress-test boundaries with scenarios, check the code agrees. Use when terminology is being discussed, a term is doing two jobs, or a meaning needs settling.
---

# Domain Modeling

Actively build and sharpen the project's domain model as you work. This is
the *active* discipline: challenging terms, inventing edge-case scenarios,
and getting each settled meaning recorded the moment it crystallises.
Merely *reading* `GLOSSARY.md` for vocabulary is not this skill — that is a
one-line habit; this skill is for when the model is being changed.

This skill also owns `GLOSSARY.md` — its terms and their format live in
`references/glossary-format.md`, and its creation template is
`references/glossary-template.md`.

## During the session

- **Challenge against the glossary.** When the user uses a term that
  conflicts with the project's language, call it out immediately: "The
  glossary defines *version* as the project's current number, but you seem
  to mean the act of publishing it. Which is it?"
- **Sharpen fuzzy language.** When a term is vague or overloaded, propose a
  precise canonical term: "You're saying 'account' — do you mean the
  Customer or the User? Those are different things."
- **Stress-test with scenarios.** When relationships between concepts are
  being discussed, invent scenarios that probe the edge cases and force the
  boundaries to be stated precisely.
- **Cross-reference with the code.** When the user states how something
  works, check whether the code agrees, and surface any contradiction.
- **Record the moment it settles.** A settled meaning is a term: call the
  skill tool with `codifying` so it sorts the ruling and lands the term in
  the glossary per the format above. Do not batch these up; capture them as
  they happen.
- **Offer decision records sparingly.** Only when the decision the term
  crystallised around passes the three tests in `codifying`'s decision
  format — and then only when the user confirms it.

`GLOSSARY.md` stays a glossary: devoid of implementation details, never a
spec, a scratch pad, or a shelf for rulings. Definitions say what a thing
*is*; rulings live in `conventions/`, designs in specs and decisions.

## Related skills

- codifying — where a settled meaning is recorded; holds the term,
  convention, and decision formats.
- grilling — the interview that settles a disputed meaning.