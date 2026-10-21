---
name: Tracking
description: Own the tracker — hazards, bugs, defects, features, questions, tickets — and decide whether to deal with an item now or record it. Use when an item comes up, or when picking up, closing, or writing a tracked item.
---

# Tracking

`tracker/` holds what cannot be dealt with now but must not be lost: one
file per kind of open item, so any agent can pick an item up where another
put it down. This skill owns the tracker — the item kinds, their
boundaries, entry formats, and closing rules — and it is how an agent
decides what to do with each item: deal with it now, or record it.

## The kinds

| Kind     | File           | The item                                                                                                                                                               | Definition                |
| -------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Hazard   | `HAZARDS.md`   | An obstacle the project lives with: out of scope to fix, surprising behavior in something it depends on, or a disproven assumption — one a later agent would hit again | `references/hazards.md`   |
| Bug      | `BUGS.md`      | Something that prevents working when it should, and is the project's to fix                                                                                            | `references/bugs.md`      |
| Defect   | `DEFECTS.md`   | Something that works but is bad: a code smell, a convention violation, a broken design principle                                                                       | `references/defects.md`   |
| Feature  | `FEATURES.md`  | Something the user wants that does not exist yet                                                                                                                       | `references/features.md`  |
| Question | `QUESTIONS.md` | A question that deserves a definitive answer the user cannot give right now                                                                                            | `references/questions.md` |
| Ticket   | `tickets/`     | One slice of scheduled work, sliced from a spec, bug, or defect, and declared for execution                                                                            | `references/tickets.md`   |

Tickets are the exception to the one-file-per-kind shape: one file per
ticket, not one entry in a shared file — their reference covers it.

The close calls:

- **Bug or hazard.** The project can fix it within its own scope → bug. It
  stays standing for whoever comes next → hazard.
- **Bug or defect.** It prevents working → bug. It works, but badly →
  defect. A function `add_two_numbers` that returns `5` for any input is a
  bug; one that returns the right answer through an if-else branch for every
  possible pair of inputs is a defect.
- **Bug or feature.** It works as intended and the want is for it to do
  more → feature.

Each kind's reference holds both halves: the rules for acting now versus
recording, and the full entry fields, closing line, and an example. A
missing tracker file is created from `references/template.md` — see
`bootstrapping`.

## Handling an item

1. **Classify it** against the kinds above and their close calls.
2. **Decide: act now, or record.** Read the kind's reference before acting —
   `references/hazards.md`, `references/bugs.md`, `references/defects.md`,
   `references/features.md`, or `references/questions.md`.
3. **Record it**, if that is the decision:
   - Record in flight, while error text, versions, and exact inputs are
     still fresh.
   - Read the kind's tracker file first; if an entry already covers the
     item, extend that entry.
   - Write the entry in the kind's format, from its reference.
   - If the tracker file does not exist, call the skill tool with
     `bootstrapping` and create it, then write the entry.
4. **Return to the task.**

The item is handled when it has either been dealt with or recorded in
full, and the task has resumed.

## Picking up a tracked item

Read the entry completely, including any work log, and start where it
stopped. Append dated notes as you work, finished or not, so a put-down
loses nothing.

## Closing a tracked item

Append the kind's closing line, per its reference. The reference says when
an entry may close — some need the user's approval.

## Deferring to the user

Some calls belong to the user. When one comes up:

- If the user is in the conversation and the matter bears on it, ask.
- Otherwise, make a defensible provisional decision, proceed, and track a
  question recording that decision and where it is embodied.

A question broad enough to stop the task follows
`references/questions.md`: it is asked now, never tracked.

## Format

Five of the six kinds share these rules (tickets use one file per ticket,
per their reference):

- One `##` section per entry, newest first, headed
  `## <One-line title> — <YYYY-MM-DD>`, with a time added only when it
  matters.
- One entry per item: an item already covered by an entry is recorded by
  extending that entry with the new context and a dated note.
- Enough detail for a reader with no context: exact errors, versions, paths,
  inputs, and what to do. A later agent recognizes the item from the first
  symptom they see.
- The fields after the heading are the kind's own, as given in its
  reference.

Entries are history: an entry closes by appending its kind's dated closing
line, and stays in the file.

## Related skills

- codifying — where a tracked question's answer is recorded when it is a
  term, a convention, or a decision.
- maintaining-docs — user-visible fixes and features also get a changelog
  entry.
- bootstrapping — creating a tracker file when one is missing.