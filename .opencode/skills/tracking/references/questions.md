# Questions

Some questions deserve a definitive answer but cannot get one when they come
up, and the answer still matters. The questions tracker keeps them alive
without holding a task hostage and without silently baking them into it.

## Ask now, or track

- **Blocking questions are asked now.** If the task cannot meaningfully
  proceed without the answer — broad questions like "what am I supposed to
  do now?" — stop, ask the user, and await instructions.
- **Otherwise, decide provisionally and track.** If a defensible decision
  lets the task continue, make it, record it, and track the question.
  Example: two established conventions appear to conflict. Asking now would
  hold up the task; ignoring the conflict would bake "resolve the
  conventions" into the task invisibly. The right shape is to proceed under
  a recorded provisional decision and track the question.

Track only questions worth a definitive answer — ones whose answer would
change future work.

## Entry format

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
change it. It doubles as your recommended answer when the question is put to
the user: "I went with X; keep it?"

When a conversation with the user touches a tracked question, raise it.

## When the answer lands

1. Record it on the entry: `- **Answered — <YYYY-MM-DD>:** <the answer, and
   by whom>`.
2. Fold it into the project where it belongs: a ruling about how something
   is done goes into `conventions/` (conventions skill); a settled term or a
   significant decision goes into the glossary or `decisions/`
   (domain-modeling skill). The conflict disappears from the source, not
   just from the tracker.
3. Re-check the work built on the provisional decision: confirm it if the
   answer matches; change it if not.
4. Note the follow-through: `- **Follow-up:** <what was updated, and the
   work confirmed or corrected>`.

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