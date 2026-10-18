---
name: Tracking
description: Record items for later in tracker/ — hazards, bugs, defects, features, questions — so a task stays on course and nothing is lost. Use when an obstacle, bug, smell, feature request, or open question comes up, or when picking up or closing a tracked item.
---

# Tracking

The trackers hold what cannot be dealt with now but must not be lost. They
let an agent stay focused on its task without dropping anything down the
memory hole: an item is put down here, and any agent can pick it up later.

## Which tracker

Classify the item first:

| The item | Kind | Reference |
| --- | --- | --- |
| An obstacle the project lives with: out of scope to fix, surprising behavior in something it depends on, or a disproven assumption — one a later agent would hit again | hazard | `references/hazards.md` |
| Something that prevents working when it should, and is the project's to fix | bug | `references/bugs.md` |
| Something that works but is bad: a code smell, a convention violation, a broken design principle | defect | `references/defects.md` |
| Something the user wants that does not exist yet | feature | `references/features.md` |
| A question that deserves a definitive answer the user cannot give right now | question | `references/questions.md` |

The close calls:

- **Bug or hazard.** The project can fix it within its own scope → bug. It
  stays standing for whoever comes next → hazard.
- **Bug or defect.** It prevents working → bug. It works, but badly →
  defect. A function `add_two_numbers` that returns `5` for any input is a
  bug; one that returns the right answer through an if-else branch for
  every possible pair of inputs is a defect.
- **Bug or feature.** It works as intended and the want is for it to do
  more → feature.

Then read the kind's reference file before acting: it holds that kind's
rules for when to act now instead of recording, and its entry format. The
item is ready to handle when it is classified and its reference is read.

## Every entry

The five trackers share these mechanics:

- **The file** is `tracker/<KIND>.md` at the project root: `HAZARDS.md`,
  `BUGS.md`, `DEFECTS.md`, `FEATURES.md`, or `QUESTIONS.md`. If it does not
  exist, call the skill tool with `bootstrapping`, create the file per that
  piece, then add the entry.
- **Read before writing.** If an entry already covers the item, extend that
  entry with the new context and a dated note.
- **One `##` section per entry, newest first,** headed
  `## <One-line title> — <YYYY-MM-DD>`. Add a time only when it matters.
- **Record in flight,** while error text, versions, and exact inputs are
  still fresh.
- **Write for a reader with no context:** exact errors, versions, paths,
  inputs, and what to do. A future agent should recognize the item from the
  first symptom they see.
- **Entries are history.** An entry closes by appending its kind's dated
  closing line and stays in the file.

## Deferring to the user

Some calls belong to the user: whether a statement is a ruling, what a term
means, how related features reconcile, how a convention conflict resolves.
When one comes up:

- If the user is in the conversation and the matter bears on it, ask.
- Otherwise, make a defensible provisional decision, proceed, and track a
  question per `references/questions.md`, recording that decision and where
  it is embodied.

A question so broad that the task cannot proceed at all is asked now and
never tracked.

## Related skills

- bootstrapping — creates the tracker files when they are missing.
- conventions — the standards defects are judged against, and where answered
  questions about how things are done are folded in.
- domain-modeling — where answered questions about terms and significant
  decisions are recorded.
- maintaining-docs — user-visible fixes and features go in the changelog.