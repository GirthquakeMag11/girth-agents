# Handling a feature

## Recording one

Record a feature **only when prompted** — the user asked to add it to the
tracker. Before writing, read the existing entries, closed ones included:

- If the new feature sounds like a part of an existing feature, a duplicate,
  an overlap, or a mutual exclusion, compile the details — the requested
  feature, the related entries, the apparent relationship — and ask the user
  how to reconcile.
- If a cancelled entry covers the same concept — matched by idea, not by
  wording — surface it with its recorded reason and ask whether that reason
  still holds. If it does, note the request on the cancelled entry; if not,
  the new entry proceeds.

Record each relationship the user confirms on the entry.

## Implementing one

When the user asks to implement a feature, check for prerequisites —
features the requested one depends on. If any exist, compile the details and
confirm whether the implementation should include everything required, or
whether the user has something else in mind: prerequisites handled
elsewhere, a partial implementation, a changed plan.

## Closing one

Ask the user before closing — after the work lands, or when cancellation is
on the table — and present the impact on related entries: a cancelled
component leaves its parent in question; closing one of a mutually exclusive
pair clears the field for the other. An implemented feature also gets a
changelog entry.

## Relationships

There is no all-encompassing rule for how features relate. The discipline is
that **relationship impacts are reviewed at every create and every close**:
compile the details, present the apparent relationship and its options, and
let the user reconcile. Every merge, split, link, or drop is the user's.