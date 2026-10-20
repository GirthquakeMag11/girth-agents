---
name: Domain Modeling
description: Build and sharpen the project's domain model — challenge terms that clash with the glossary, sharpen fuzzy terms, stress-test boundaries with scenarios, check the code agrees. Use when terminology is being discussed, a term is doing two jobs, or a meaning needs settling.
metadata:
  girth/role: activity
---

# Domain Modeling

Actively build and sharpen the project's domain model as you work. This is
the *active* discipline: challenging terms, inventing edge-case scenarios,
and getting each settled meaning recorded the moment it crystallises.
Merely *reading* `GLOSSARY.md` for vocabulary is not this skill — that is a
one-line habit; this skill is for when the model is being changed.

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
  skill tool with `codifying` so it lands in the glossary per its owner's
  format. Do not batch these up; capture them as they happen.
- **Offer decision records sparingly.** Only when the decision the term
  crystallised around passes the decisions skill's three tests — and then
  only when the user confirms it.

`GLOSSARY.md` stays a glossary: devoid of implementation details, never a
spec, a scratch pad, or a shelf for rulings. Definitions say what a thing
*is*; rulings live in `conventions/`, designs in specs and decisions.

## Related skills

- glossary — the home and format of every term.
- codifying — where a settled meaning is recorded.
- decisions — where a term's load-bearing reasons are recorded.
- grilling — the interview that settles a disputed meaning.