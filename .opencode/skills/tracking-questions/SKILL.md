---
name: Tracking Questions
description: Track questions in tracker/QUESTIONS.md that deserve a definitive answer but cannot get one right now. Blocking questions are asked immediately, never tracked. Otherwise: record the question with context and — load-bearing — the provisional decision you made to proceed and where it is embodied, then keep working. When the answer lands, record the ruling, fold it into the project's conventions, and re-check the affected work to confirm or correct it.
---

# Tracking Questions

Some questions deserve a definitive answer but cannot get one at the moment
they come up, and the answer still matters. The questions tracker keeps
such questions alive without holding a task hostage and without silently
baking them into the task.

## Ask now, or track

- **Blocking questions are asked now, not tracked.** If the task cannot
  meaningfully proceed without the answer — broad questions like "what am I
  supposed to do now?" — stop and ask the user, then await instructions as
  normal.
- **Otherwise, track and proceed.** If a defensible decision lets the task
  continue, make the decision, record it, and track the question for later.
  Example: two established project conventions appear to conflict. Asking
  immediately would hold up the task; pretending the conflict does not
  exist would bake "resolve the conventions" into it invisibly. The right
  shape is: process the work under a recorded provisional decision, and
  track the question.

Only track questions worth a definitive answer — ones whose ruling would
change future work. Trivia is not tracked.

## The tracker file

The canonical file:

```markdown
# QUESTIONS

Questions that deserve a definitive answer but cannot get one yet. Entries
record the provisional decision made in the meantime, so the ruling can be
applied to the work later. See the tracking-questions skill.

<!-- entries below, newest first, one `##` section each -->
```

It lives at `tracker/QUESTIONS.md` in the project root. If it does not
exist, load the bootstrapping skill, follow its QUESTIONS section to create
the file, then add the entry.

## Entry format

One `##` section per question, newest first:

```markdown
## <One-line title> — <YYYY-MM-DD>

- **The question:** <what needs a definitive answer, and why it matters>
- **Context:** <what raised it — the task, the conflicting guidelines,
  anything needed to understand where the question comes from>
- **Decided (provisional):** <how the work proceeded without the answer,
  and where that decision is embodied — files, code, docs>
```

The **Decided (provisional)** field is load-bearing. Without it, when the
ruling lands there is no way to find the work that was built on the
decision — no way to confirm it or change it.

- Newest first; timestamp required (`YYYY-MM-DD`, add a time only when it
  matters).
- Before writing, read the file: if an existing entry already asks the same
  question, extend it (add your context and decision) instead of
  duplicating.
- Ask whenever the opportunity presents itself — if a conversation with the
  user touches a tracked question, raise it.

## When the answer lands

When the question gets its definitive answer:

1. Record the ruling on the entry:

   ```markdown
   - **Answered — <YYYY-MM-DD>:** <the ruling, and by whom>
   ```

2. Fold the ruling into the project's conventions where the question
   touched them, per the conventions skill — the conflict disappears from
   the conventions, not just from the tracker.
3. Re-check the work that was built on the provisional decision: if the
   ruling matches the decision, confirm it; if not, change the work now
   that the ruling has landed.
4. Note it on the entry:

   ```markdown
   - **Follow-up:** <conventions updated here...; work confirmed or
     corrected here...>
   ```

Entries stay in the file as history.

### Example

```markdown
## Naming conflict: conventions/naming vs conventions/docs — 2026-10-04

- **The question:** `conventions/naming` says filenames are underscore_case;
  the examples in `conventions/docs` use kebab-case. Which governs generated
  documentation filenames?
- **Context:** writing the docs generator, both conventions apply, and the
  user was not available to rule at the time.
- **Decided (provisional):** followed `conventions/naming` (underscore_case)
  in the generator's output paths so the task could proceed.
- **Answered — 2026-10-07:** user ruled kebab-case for documentation
  artifacts.
- **Follow-up:** `conventions/naming` updated with the docs exception;
  generator output paths changed to kebab-case; generator tests updated.
```

## Related skills

- bootstrapping — creates `tracker/QUESTIONS.md` when it is missing.
- tracking-hazards, tracking-bugs, tracking-defects, tracking-features —
  sibling trackers.
- conventions — the home the answer is folded into when a question touches
  project conventions.