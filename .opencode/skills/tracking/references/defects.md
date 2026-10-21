# Handling a defect

## Fix now, or track

Defects follow the bug rules (`bugs.md`), with one difference: a defect
never stops work, so "blocking" becomes:

1. **The task's own work would create or extend the defect** — its
   deliverable would not meet the project's standard → fix now.
2. **The fix is obvious and cheaper than tracking** → attempt now.
3. **Otherwise → track it** and return to the task.

The attempt rule carries over in full: a "small cleanup" that proves deeper
than it looked may be backed out of and tracked, with everything tried,
learned, or half-refactored in the work log. The workaround doctrine for
bugs has nothing to govern here, since a defect never blocks a task.

## Closing

Close the entry when the defect is remediated. A remediation users could
notice also gets a changelog entry.

## The entry

What follows is the kind's definition and entry format. An entry closes by
its closing line below.

## Definition

A defect is bad but not broken: it works, yet is wrong to ship or to leave.
In general terms defects are code smells; in project terms, anything that
goes against the project's conventions or design principles.

A defect is only a defect relative to a standard:

1. The project's written conventions — `conventions/` and its stated design
   principles — govern wherever they speak.
2. General design principles and the well-known code smells (duplication,
   misleading names, speculative generality, and the like) apply everywhere
   the conventions do not contradict them.

## Entry

```markdown
## <One-line title> — <YYYY-MM-DD>

- **The defect:** <what is bad and why it matters — the convention or
  principle it violates, and where it lives>
- **Work so far:** <dated, chronological notes — every diagnosis, attempt
  to remediate, thing learned, and where the effort stopped>
```

Unless the standard is already spelled out in the project's conventions, the
entry names the one applied, so the user can overrule the call.

## Closing line

`- **Fixed — <YYYY-MM-DD>:** <what changed>`