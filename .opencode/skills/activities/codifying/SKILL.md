---
name: Codifying
description: Turn what the user says into recorded rulings — a term, a convention, or a decision. Use when the user says what something means, how something is done, or why the project takes a shape, says something that might be one, or uses project terms loosely.
metadata:
  girth/role: activity
---

# Codifying

A ruling is something the user has settled and agents follow from then on.
There are three kinds, each with its owner:

| The user settles                             | Kind       | Owner       |
| -------------------------------------------- | ---------- | ----------- |
| What a word means                            | Term       | glossary    |
| How something is done                        | Convention | conventions |
| Why the project takes one shape over another | Decision   | decisions   |

Rulings belong to the user. Codifying proposes and records; it never settles
anything on the user's behalf.

## Codifying a ruling

1. **Confirm it is a ruling.** Rulings do not always call themselves
   rulings. If a statement could be read as one — a guideline, a
   preference, a "we always do it this way", a meaning, a reason — but does
   not explicitly establish one or ask to be recorded, ask whether it is a
   ruling to be formally recorded. If the user is not in the conversation,
   or interrupting is unsuitable, call the skill tool with `tracking` and
   track a question with your provisional reading.
2. **Clarify it.** Call the skill tool with `grilling` and sharpen the
   ruling one round at a time — vague wording, one word doing several jobs,
   boundaries that need testing with concrete cases — until the user states
   it exactly.
3. **Check it.** Compare it with the recorded terms, conventions, and
   decisions, and with the code. Surface any contradiction before recording:
   "The glossary defines *cancellation* as X, but you seem to mean Y. Which
   is it?" — "The code cancels whole Orders, but you just said partial
   cancellation is possible. Which is right?" A conflict between rulings is
   the user's to resolve; if they cannot now, track it as a question.
4. **Sort it.** Decide which kind it is: term, convention, or decision. One
   statement can be more than one. A decision is recorded only when it
   passes the decisions skill's three tests, and only once the user
   confirms the record. When a decision implies a standing rule, it is both
   a decision and a convention.
5. **Record it** in its owner's format, the moment it is settled,
   mid-conversation:
   - A term: call the skill tool with `glossary`.
   - A convention: call the skill tool with `conventions`.
   - A decision: call the skill tool with `decisions`.

   When one statement produced both a decision and a convention, link them
   both ways. If the file does not exist, call the skill tool with
   `bootstrapping` and create it first.
6. **Offer an automated check** when a convention is mechanical — a fixed
   pattern that a linter rule, a pre-commit hook, or a CI check could
   detect. The check enforces every time what the written ruling only asks
   for. The ruling is recorded either way.

Done when each ruling is recorded in its owner's format, with its links in
place.

## Related skills

- glossary, conventions, decisions — the owners of the three kinds.
- tracking — where rulings the user cannot settle yet wait as questions, and
  where answered questions come back from.