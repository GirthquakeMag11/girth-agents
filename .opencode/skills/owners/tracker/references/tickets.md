# Tickets

## Definition

A ticket is one slice of scheduled work: a thin but complete vertical path
through every layer, demoable on its own, sized to fit one fresh context
window. Tickets are not entries in a shared file like the other kinds — one
file per ticket, so a ticket can be claimed, worked, and pointed at on its
own, and so its blockers read naturally.

Unlike the other five kinds, a ticket is not a property of the project's
world; it is a step of a plan. It comes into being only by slicing something
larger — a spec, or a bug or defect too big for one fix — and it is always
work *that will be done*.

## Where they live

`tracker/tickets/<NN>-<slug>.md`, numbered in dependency order: the first
ticket that can start is `01`, and a ticket that is blocked is numbered
after what blocks it. Create `tracker/tickets/` with the first ticket.

## File format

```markdown
# <NN>: <Ticket title>

**Parent:** <what this advances: a spec path, a feature, a bug, or a defect>

**Kind:** <bug-fix | feature | research | refactor>

**Blocked by:** <the numbers/titles that gate this one, or "None (can start
immediately)">

## What it delivers

<The end-to-end behavior this ticket makes work, from the user's
perspective — not a layer-by-layer implementation list.>

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
```

- `Parent:` names the thing the ticket advances, so the trail from plan to
  work — and back — is walkable.
- `Kind:` is declared when the ticket is created, never guessed at execution;
  it decides how the ticket is worked.
- Avoid file paths and code snippets in **What it delivers**: they go stale.
  Inline a snippet only when it encodes a decision prose cannot.

## The frontier

The **frontier** is the open, unblocked tickets: everything whose
`Blocked by:` list has closed. Work proceeds through the front, recomputed
after each ticket closes.

## Wide refactors

A wide change — one mechanical edit whose blast radius spans the codebase —
is not a single ticket. Slice it as an **expand–contract chain**: first a
ticket that adds the new form beside the old so nothing breaks, then a ticket
per batch of call sites migrated (each green on its own), then a final
ticket that deletes the old form once no caller remains, blocked by every
migration batch.

## Closing

A ticket closes by marking it done — `- **Done — <YYYY-MM-DD>:** <what
landed>` — and, when it advances a bug or defect, the bug's or defect's
entry says so too. Closed tickets stay as history.