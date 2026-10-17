---
name: Tracking Features
description: Track features in tracker/FEATURES.md. Entries are created only when prompted, may reference plans and specifications freely, and close only with the user's approval after implementation or cancellation. Features relate to each other (prerequisites, components, mutual exclusion...), so every create or close includes a relationship review: compile the details and reconcile with the user. Use whenever the user asks to add, implement, or close a feature.
---

# Tracking Features

Features are the tracker's outward-facing list: what the project may
become. Unlike bugs, hazards, and defects, everything about a feature's
lifecycle is user-gated: entries exist because someone asked for them, and
close because the user approved the closure.

For the boundary: a feature is wanted-but-absent; a bug is present-but-
broken; a defect is present, works, and is bad by a standard (see the
sibling skills).

## Creating an entry

- Create an entry **only when prompted** — the user asked to add a feature
  to the tracker. Never record features speculatively.
- Before writing, read the existing entries. If the new feature sounds like
  a part of an existing feature, a duplicate, an overlap, or a mutual
  exclusion, **do not decide alone**: compile the details — the requested
  feature, the related entries, the apparent relationship — and ask the
  user how to reconcile.
- When the user confirms a relationship, record it on the entry as a
  `Related:` line.

## Implementing a feature

When the user asks to implement a feature:

- Check the entries for prerequisites — features the requested one depends
  on. If any exist, compile the details and confirm with the user whether
  the implementation should include everything required, or whether the
  user has something else in mind (prerequisites being handled elsewhere,
  a partial implementation, a changed plan).
- Implementation alone does not close the entry. Closure always requires
  the user's approval (see below).

## Closing an entry

An entry closes **only with the user's approval**, and only one of two
ways:

- Implemented, or
- Cancelled.

Ask before closing — after the work lands, or when cancellation is on the
table — and present any relationship impacts the closure would have on
other entries (a cancelled component leaves its parent feature in question;
closing one of a mutually exclusive pair clears the field for the other).
Record the closure on the entry; entries are history and stay in the file.

## The tracker file

The canonical file:

```markdown
# FEATURES

What the project may become. Entries are created on request and close only
with the maintainer's approval; see the tracking-features skill for the
format and the relationship-review rule.

<!-- entries below, newest first, one `##` section each -->
```

It lives at `tracker/FEATURES.md` in the project root. If it does not
exist, load the bootstrapping skill, follow its FEATURES section to create
the file, then add the entry.

## Entry format

One `##` section per feature, newest first:

```markdown
## <One-line title> — <YYYY-MM-DD>

- **The feature:** <what is wanted and why>
- **References:** <paths to plans, specifications, or other documents —
  free-form, any number>
- **Related:** <other entries this one depends on, composes, or excludes;
  only when the user has confirmed the relationship>
```

Closure lines, appended when the user approves one:

```markdown
- **Closed — <YYYY-MM-DD>:** implemented
- **Closed — <YYYY-MM-DD>:** cancelled
```

## The relationship mess

Features relate to each other: some are prerequisites of others, some are
components of others, some are mutually exclusive, and there are shapes
beyond these. There is no all-encompassing rule. What exists instead is
the discipline: **relationship impacts are reviewed at every create and
every close**, per the rules above — compile the details, present the
apparent relationship and its options where they are clear, and let the
user reconcile. Never silently merge, split, link, or drop the relationship
implied by the user's request.

## Related skills

- bootstrapping — creates `tracker/FEATURES.md` when it is missing.
- tracking-hazards, tracking-bugs, tracking-defects — sibling trackers;
  their triage does not apply here, and this skill's user-gated lifecycle
  does not apply there.
- tracking-questions — sibling; open questions belong there, not here.