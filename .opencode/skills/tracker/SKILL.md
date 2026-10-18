---
name: Tracker
description: Defines tracker/, the project's open items — six kinds: hazards, bugs, defects, features, questions, and tickets, with their boundaries, entry formats, and closing rules. Use when writing or editing a tracker file.
metadata:
  girth/role: owner
---

# Tracker

## Purpose

`tracker/`, at the project root, holds what cannot be dealt with now but
must not be lost: one file per kind of open item, so any agent can pick an
item up where another put it down. Its creation template is
`references/template.md`.

## What belongs

Six kinds of item:

| Kind | File | The item | Definition |
| --- | --- | --- | --- |
| Hazard | `HAZARDS.md` | An obstacle the project lives with: out of scope to fix, surprising behavior in something it depends on, or a disproven assumption — one a later agent would hit again | `references/hazards.md` |
| Bug | `BUGS.md` | Something that prevents working when it should, and is the project's to fix | `references/bugs.md` |
| Defect | `DEFECTS.md` | Something that works but is bad: a code smell, a convention violation, a broken design principle | `references/defects.md` |
| Feature | `FEATURES.md` | Something the user wants that does not exist yet | `references/features.md` |
| Question | `QUESTIONS.md` | A question that deserves a definitive answer the user cannot give right now | `references/questions.md` |
| Ticket | `tickets/` | One slice of scheduled work, sliced from a spec, bug, or defect, and declared for execution | `references/tickets.md` |

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

Each kind's reference holds its full definition, entry fields, closing line,
and an example.

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

## Changing it

Entries are history. An entry closes by appending its kind's dated closing
line, and stays in the file.