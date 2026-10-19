---
name: Decisions
description: Defines decisions/, the project's decision records — what qualifies, the record format, numbering, and superseding. Use when writing or editing a decision record.
metadata:
  girth/role: owner
---

# Decisions

## Purpose

`decisions/`, at the project root, holds one record per significant
decision: why the project took one shape over another. It answers *why the
project is shaped this way*. Its creation template is
`references/template.md`.

## What belongs

A decision earns a record only when all three hold:

1. **Hard to reverse:** changing course later has a real cost.
2. **Surprising without context:** a future reader would wonder why the
   project is shaped this way.
3. **The result of a real trade-off:** there were genuine alternatives, and
   one was picked for specific reasons.

Miss any one and there is no record: an easily reversed choice simply gets
reversed, an unsurprising one is nobody's question, and a choice without
alternatives records only that the obvious thing was done.

Typical decisions that pass:

- **Architectural shape:** "the write model is event-sourced; the read model
  is projected into Postgres."
- **Technology with lock-in:** the database, message bus, auth provider, or
  deployment target — the choices that would take months to swap.
- **Boundaries and scope:** "customer data is owned by the Customer context;
  others reference it by ID only." The explicit no's are as valuable as the
  yes's.
- **Deliberate deviations from the obvious path:** anything a reasonable
  reader would assume the opposite of. These stop the next person from
  "fixing" something deliberate.
- **Constraints invisible in the code:** compliance requirements, a partner
  API's latency contract.

Every record is a decision the user confirmed. A decision is not a
convention: a convention is a standing ruling on how something is done, and
lives in `conventions/`. When a decision implies a standing rule, both
exist, linked to each other.

## Format

One file per decision, numbered in sequence: `decisions/0001-<slug>.md`,
`decisions/0002-<slug>.md`. The next number is the highest existing one plus
one; the slug is a short kebab-case name for the decision.

```markdown
# <Short title of the decision>

<One to three sentences: the context, what was decided, and why.>
```

That is the whole requirement: a record's value is in recording *that* a
decision was made and *why*, not in filling sections. Optional parts, each
added only when it carries real information:

- **A status line** under the title: `Status: accepted`, or
  `Status: superseded by 0007` once the decision has been revisited.
- **Considered options:** rejected alternatives worth remembering,
  especially when the rejection is not obvious.
- **Consequences:** downstream effects that are not obvious.
- **A conventions line:** `Conventions: conventions/On_<Domain>.md` when the
  decision implies standing rulings recorded there.

## Changing it

Records are history. When a decision is replaced, a new record states the
new decision and names the record it replaces, and the old record gains
`Status: superseded by <number>`. The old record stays.