# Decision record format

Records live in `decisions/`, one file each, numbered in sequence:
`0001-<slug>.md`, `0002-<slug>.md`. To number a new record, find the highest
existing number and add one. The slug is a short kebab-case name for the
decision.

## Template

```markdown
# <Short title of the decision>

<One to three sentences: the context, what was decided, and why.>
```

That is the whole requirement. A record can be a single paragraph: its value
is in recording *that* a decision was made and *why*, not in filling
sections.

## Optional parts

Add these only when they carry real information:

- **A status line** under the title — `Status: accepted`, or
  `Status: superseded by 0007` — once a decision has been revisited.
- **Considered options** — when the rejected alternatives are worth
  remembering, especially when the rejection is not obvious; otherwise
  someone proposes them again.
- **Consequences** — when downstream effects are not obvious.

## What qualifies

Typical decisions that clear all three tests:

- **Architectural shape:** "the write model is event-sourced; the read model
  is projected into Postgres."
- **Technology with lock-in:** the database, message bus, auth provider, or
  deployment target — the choices that would take months to swap.
- **Boundaries and scope:** "customer data is owned by the Customer
  context; others reference it by ID only." The explicit no's are as
  valuable as the yes's.
- **Deliberate deviations from the obvious path:** anything a reasonable
  reader would assume the opposite of. These stop the next person from
  "fixing" something deliberate.
- **Constraints invisible in the code:** compliance requirements, a partner
  API's latency contract.

## Superseding

Decisions are history. When one is replaced, write a new record for the new
decision that names the record it replaces, and mark the old one
`Status: superseded by <number>`; the old record stays.