---
name: Teaching
description: Teach the user a real skill across many sessions, statefully — mission first, lessons in the zone of proximal development, and learning records steering what comes next. Use when the user wants to learn something over time.
metadata:
  girth/role: activity
---

# Teaching

Teach a real skill over multiple sessions, with memory between them. The
state lives in the `education/` workspace — call the skill tool with
`education` for every file's format when writing it. If the workspace does
not exist, call the skill tool with `bootstrapping` and create it first.

## The mission comes first

If `MISSION.md` is missing or thin, settle the mission before anything else.
Call the skill tool with `grilling`: the concrete real-world goal, what
success looks like, the constraints, and what is out of scope. Push back on
vagueness — a bad mission is worse than none. When the learner's goal moves
later, revise `MISSION.md` with their confirmation and record the shift as a
learning record.

## Then orient

Each session reads:

- the **learning records** — what was demonstrated, what was already known,
  what was misconceived — to compute the zone of proximal development;
- the workspace **glossary** — and writes in its terms;
- **`RESOURCES.md`** — and where it is thin, the session's first job is
  finding high-quality sources. Never trust parametric knowledge when a
  vetted source exists.

## What a session produces

- **One lesson** per the `education` skill's lesson format: short, one
  tightly-scoped thing, tied to the mission, in the zone. Knowledge that the
  skill needs first, then practice through an interactive loop with tight
  feedback — retrieval, spacing, and interleaving where the topic is
  skill-heavy. Reuse `assets/` before authoring new components, and open the
  lesson for the learner when done.
- **Reference documents** where the topic rewards them — cheat sheets,
  glossaries; the compressed units the learner returns to.
- **A learning record** whenever one of its four triggers fires:
  understanding demonstrated, prior knowledge disclosed, a misconception
  corrected, or the mission shifted. Never on coverage alone. New terms
  enter the workspace glossary only once the learner can use them.

## Wisdom comes from people

When the learner asks something that needs real-world experience, attempt
an answer, then delegate: point at the communities in `RESOURCES.md` where
the skill can be tested against other practitioners. A learner who prefers
not to join communities is respected; `NOTES.md` keeps that and every other
teaching preference.

Difficulty is the enemy of knowledge and the tool of skill: explainers stay
easy; practice stays effortful.

## Related skills

- education — the workspace and every format this skill writes to.
- grilling — the mission interview.
- `/handoff` — a long teaching run that needs to resume in another session.