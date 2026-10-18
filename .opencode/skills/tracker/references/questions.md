# Questions

## Definition

A question deserves a definitive answer, cannot get one when it comes up,
and its answer still matters: it would change future work. Questions are
tracked so a task is neither held hostage to them nor silently built on a
guess.

## Entry

```markdown
## <One-line title> — <YYYY-MM-DD>

- **The question:** <what needs a definitive answer, and why it matters>
- **Context:** <what raised it — the task, the conflicting guidelines,
  anything needed to understand where it comes from>
- **Decided (provisional):** <how the work proceeded without the answer,
  and where that decision is embodied — files, code, docs>
```

**Decided (provisional)** is load-bearing. When the answer lands, it is the
only way to find the work built on the decision, and so to confirm or
change it.

## Closing

```markdown
- **Answered — <YYYY-MM-DD>:** <the answer, and by whom>
- **Follow-up:** <what was updated, and the work confirmed or corrected>
```

## Example

```markdown
## Filename case: On_Naming vs On_Docs — 2026-10-04

- **The question:** `conventions/On_Naming.md` says filenames are
  underscore_case; the examples in `conventions/On_Docs.md` use kebab-case.
  Which governs generated documentation filenames?
- **Context:** writing the docs generator; both rulings apply, and the user
  was not available to rule.
- **Decided (provisional):** followed `On_Naming.md` (underscore_case) in
  the generator's output paths so the task could proceed.
- **Answered — 2026-10-07:** user ruled kebab-case for documentation files.
- **Follow-up:** `On_Naming.md` gained the docs exception; generator output
  paths changed to kebab-case; generator tests updated.
```