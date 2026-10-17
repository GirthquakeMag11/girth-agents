---
name: Tracking Defects
description: Track defects in tracker/DEFECTS.md — things that are bad but not broken: code smells and violations of the project's conventions or design principles. Contrast: if the thing prevents something from working, it is a bug, not a defect. Same triage and entry mechanics as tracking-bugs: fix in flight when the task's own work would create or extend it, or when the fix is trivially cheaper than tracking; back out into a tracked entry when a fix balloons.
---

# Tracking Defects

Defects are bad but not broken. A bug prevents specific, concrete work from
happening when it should; a defect works, yet is wrong to ship or to leave.
Defects are judged against the project's standards: code smells in general,
and in particular anything that goes against the project's conventions or
design principles.

## Bug or defect first

Classify before tracking:

- Prevents something from working that should work → **bug** (see the
  tracking-bugs skill).
- Works, but is bad — a smell, a convention violation, a break of a design
  principle → **defect** (this skill).

The canonical contrast — a function called `add_two_numbers`:

- Returns `5` regardless of inputs → **bug**: it fails to do what it should.
- Returns the right answer via an exhaustive if-else chain enumerating
  every pair of inputs → **defect**: correct, but absurd.

## Whose standards

A defect is only a defect relative to a standard. The hierarchy:

1. The project's written conventions — `conventions/` and its stated design
   principles (see the conventions skill) — govern wherever they speak.
2. Mainstream design principles — simplicity, no duplication, clarity —
   apply everywhere the conventions do not contradict them.

If the project has no written standards, general principles alone apply.
Always say which standard you applied in the entry, so the maintainer can
overrule the call later.

## Same mechanics as bugs

Triage, attempts, entry format, and pick-up/put-down all work exactly as in
the tracking-bugs skill; follow that skill, substituting DEFECTS for BUGS.
The differences to keep in mind:

- **No functional blocking.** A defect never literally stops work, so the
  bug rule "blocking → fix now" has no direct analogue. The in-flight rules
  become:
  1. The current task's own work would create or extend the defect — the
     deliverable itself would not meet the project's standard → fix now.
  2. The fix is trivially obvious and cheaper than tracking → attempt now.
  3. Otherwise → track it and return to the task.
- **The attempt rule carries over fully** — including backing out when a
  "small cleanup" proves deeper than thought, and turning it into a tracked
  entry with the work log.
- **The workaround doctrine does not apply** — a defect never blocks a
  task, so nothing here licenses or forbids routing around one. The
  no-lost-work rule carries over in full: everything tried, learned, or
  half-refactored goes into the work log.

## The tracker file

`tracker/DEFECTS.md` in the project root. If it does not exist, load the
bootstrapping skill, create the file per its DEFECTS section, then add the
entry.

## Entry format

As in tracking-bugs, with the defect's fields:

```markdown
## <One-line title> — <YYYY-MM-DD>

- **The defect:** <what is bad and why it matters — the convention or
  design principle it violates, and where it lives>
- **Work so far:** <dated, chronological notes — every diagnosis, attempt
  to remediate, thing learned, and where the effort stopped>
```

- Newest first; the timestamp is required (`YYYY-MM-DD`, add a time only
  when it matters).
- Read before writing: if an entry already covers the defect, extend its
  work log instead of duplicating.
- Append dated notes to the work log as you work, so a put-down mid-effort
  loses nothing.
- When remediated, append `**Fixed — <date>:** <what changed>` and leave
  the entry in place.
- Unless the standard is already spelled out in the project's conventions,
  name the standard you applied in the defect line so the call stays
  reviewable.

## Related skills

- bootstrapping — creates `tracker/DEFECTS.md` when it is missing.
- tracking-bugs — sibling; this skill's mechanics mirror that skill's
  mechanics.
- conventions — the source of the standards defects are judged against.
- tracking-features, tracking-questions — sibling trackers.