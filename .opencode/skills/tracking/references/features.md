# Features

A feature is something the user wants that does not exist yet. Everything
about a feature's lifecycle is user-gated: an entry exists because the user
asked for it, and closes because the user approved the closure.

## Creating an entry

- Create an entry **only when prompted** — the user asked to add a feature
  to the tracker.
- Before writing, read the existing entries, including closed ones:
  - If the new feature sounds like a part of an existing feature, a
    duplicate, an overlap, or a mutual exclusion, compile the details — the
    requested feature, the related entries, the apparent relationship — and
    ask the user how to reconcile.
  - If a cancelled entry covers the same concept — matched by idea, not by
    wording — surface it with its recorded reason and ask whether that
    reason still holds. If it does, the request is noted on the cancelled
    entry; if not, the new entry proceeds.
- When the user confirms a relationship, record it on the entry's
  `Related:` line.

## Implementing a feature

When the user asks to implement a feature, check for prerequisites —
features the requested one depends on. If any exist, compile the details and
confirm whether the implementation should include everything required, or
whether the user has something else in mind (prerequisites handled
elsewhere, a partial implementation, a changed plan).

Implementation alone does not close the entry.

## Closing an entry

An entry closes **only with the user's approval**, one of two ways:
implemented, or cancelled. Ask before closing — after the work lands, or
when cancellation is on the table — and present the impact on related
entries: a cancelled component leaves its parent in question; closing one of
a mutually exclusive pair clears the field for the other.

A cancellation records a durable reason: why the project will not do this,
in terms that will still hold later — its scope, a constraint, a decision.
"Not now" is a deferral, and the entry stays open.

## Relationships

Features relate: prerequisites, components, mutual exclusions, and shapes
beyond these. There is no all-encompassing rule. The discipline is that
**relationship impacts are reviewed at every create and every close**:
compile the details, present the apparent relationship and its options, and
let the user reconcile. Every merge, split, link, or drop is the user's.

## Entry format

```markdown
## <One-line title> — <YYYY-MM-DD>

- **The feature:** <what is wanted and why>
- **References:** <paths to plans, specifications, or other documents —
  free-form, any number>
- **Related:** <entries this one depends on, composes, or excludes; only
  relationships the user has confirmed>
```

Closing lines, appended when the user approves one:

```markdown
- **Closed — <YYYY-MM-DD>:** implemented
- **Closed — <YYYY-MM-DD>:** cancelled — <the durable reason>
```

An implemented feature also gets a changelog entry, per the maintaining-docs
skill.