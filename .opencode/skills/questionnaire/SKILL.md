---
name: Questionnaire
description: Turn a decision that depends on knowledge you do not have into a Markdown questionnaire for the person who does, aimed at exactly what you need back. Use when a decision is blocked on someone outside the conversation.
---

# Questionnaire

When a decision is stuck because someone **outside** the conversation holds
the missing knowledge, produce a questionnaire that pulls it out of them.
Everything in-project is handled by `grilling`, the tracker's questions
kind, and `codifying`; this skill is the outward case, handed over the wall.

## Grill the send, not the subject

Interview the user only about the **send**, which they can always answer:
who it goes to and what they need back. Never the subject itself — if the
user could answer the subject, they would not need the recipient.

1. **Who is it going to?** One exchange: the recipient's role, expertise,
   and relationship to the user. This fixes the document's tone and how much
   context it must carry. Done when you know who the recipient is and what
   they know that the user does not.
2. **What do you need back?** One exchange: the specific decisions or facts
   only that person can give. Done when there is a concrete list of what the
   user must walk away able to do or decide.
3. **Write the questionnaire.** Draft questions aimed at the gap between
   what the recipient knows and what the user needs, most important first.
   Done when the file exists and every item from step 2 is covered by a
   question.

## The document

Write `questionnaire-<slug>.md` — the slug taken from the topic — to the
temporary directory `/handoff` uses, and report the path. It leaves the project untouched, like
`/handoff`'s output.

```markdown
# <Questionnaire title>

**Purpose:** why this questionnaire exists and the decision riding on it.

**From:** <the user>, **To:** <the recipient>, **How your answers will be
used:** <where they go>

## Context

One paragraph orienting a recipient who was not in the user's head. Enough
to answer well, not a page.

## How to answer

Deadline and rough effort. Partial answers and "I don't know" are useful:
flag anything unsure rather than skipping it.

## <Theme heading>

One `##` section per theme, its questions most important first. Every
question is one idea, never compound, with an answer stub beneath it, and a
one-line _why this matters_ only where the question could be misread or
invite a throwaway answer.

## Anything else?

Anything we did not ask that we should know?
```

## While the answers are out

Call the skill tool with `tracking` and track a question — the decision, who
holds the input, and what was asked — so the wait has a home in the tracker.
When the answers return, call the skill tool with `codifying` for anything
they settle.

## Related skills

- grilling — in-project decisions are grilled with the user directly.
- tracking — holds the open matter while the answers are out.
- codifying — records what the answers settle.