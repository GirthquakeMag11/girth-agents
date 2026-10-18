# Slicing

How an approved thing — a spec, a feature, a bug, a defect — becomes
tickets.

A **ticket** is a tracer-bullet vertical slice: a thin but *complete* path
through every layer (schema, API, UI, tests). Not horizontal — never one
layer across the whole thing.

- **Vertical.** Each slice cuts through every layer, so it stands alone.
- **Complete.** A finished slice is demoable or verifiable on its own.
- **Sized.** Each slice fits a single fresh context window.
- **Edged.** Each ticket names the tickets that block it; a ticket with no
  blockers can start immediately.

**Wide refactors are the exception.** A wide change — one mechanical edit
whose blast radius spans the codebase — breaks thousands of call sites at
once and no vertical slice can land green. Sequence it as **expand–contract**:
first a ticket that adds the new form beside the old so nothing breaks, then
one ticket per migration batch (per package or directory, each green on its
own), then a final ticket that deletes the old form once no caller remains,
blocked by every batch. If batches still cannot stay green individually, put
them on one integration branch — but green is only promised at the end.

**Kinds**, assigned here, not later:

- `bug-fix` — the ticket fixes a bug or defect.
- `feature` — the ticket builds part of the spec.
- `research` — the ticket exists to find a fact a later ticket depends on.
- `refactor` — the ticket is mechanical change or deepening, not new
  behavior.

**The push-right rule.** A slice that needs a decision you do not have is
blocked by a question, not guessed at: track it, and let the ticket declare
the question as its blocker.