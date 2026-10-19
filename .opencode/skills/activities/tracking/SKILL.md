---
name: Tracking
description: Decide whether to deal with something now or record it for later — hazards, bugs, defects, features, questions — so a task stays on course and nothing is lost. Use when one comes up, or when picking up or closing a tracked item.
metadata:
  girth/role: activity
---

# Tracking

Tracking lets an agent stay focused on its task without dropping anything
down the memory hole: an item is put down in the tracker, and any agent can
pick it up later. The tracker skill defines the items and their entries;
this skill is how an agent decides and acts.

## Handling an item

1. **Classify it.** Call the skill tool with `tracker` for the five kinds and
   the close calls between them.
2. **Decide: act now, or record.** Read this skill's reference for the kind
   before acting — `references/hazards.md`, `references/bugs.md`,
   `references/defects.md`, `references/features.md`, or
   `references/questions.md`. Each holds that kind's rules for when to act
   now instead of recording.
3. **Record it**, if that is the decision:
   - Record in flight, while error text, versions, and exact inputs are
     still fresh.
   - Read the kind's tracker file first; if an entry already covers the
     item, extend that entry.
   - Write the entry in the tracker skill's format for the kind.
   - If the tracker file does not exist, call the skill tool with
     `bootstrapping` and create it, then write the entry.
4. **Return to the task.**

The item is handled when it was either dealt with now or recorded in full,
and the task has resumed.

## Picking up a tracked item

Read the entry completely, including any work log, and start where it
stopped. Append dated notes as you work, finished or not, so a put-down
loses nothing.

## Closing a tracked item

Append the kind's closing line, per the tracker skill. The kind's reference
in this skill says when an entry may close — some need the user's approval.

## Deferring to the user

Some calls belong to the user. When one comes up:

- If the user is in the conversation and the matter bears on it, ask.
- Otherwise, make a defensible provisional decision, proceed, and track a
  question recording that decision and where it is embodied.

A question so broad that the task cannot proceed at all is asked now and
never tracked.

## Related skills

- tracker — the items, their boundaries, and their entry formats.
- codifying — where a tracked question's answer is recorded when it is a
  term, a convention, or a decision.
- maintaining-docs — user-visible fixes and features also get a changelog
  entry.