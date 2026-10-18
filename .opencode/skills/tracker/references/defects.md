# Defects

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

## Closing

`- **Fixed — <YYYY-MM-DD>:** <what changed>`