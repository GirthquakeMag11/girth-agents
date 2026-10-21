---
name: Grilling
description: Interview the user relentlessly about a plan, decision, or idea, one round of questions at a time against the design tree's frontier, until every branch is resolved. Use when the user wants to stress-test their thinking, or when a decision needs the user's input before it can be acted on.
---

# Grilling

Interview the user relentlessly until you reach a shared understanding. Map
the matter as a **design tree**: every decision branches into the decisions
that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose
prerequisites are already settled — the questions you can ask *now* without
guessing at answers you haven't heard yet. Ask the whole frontier in one
round: number each question and give your recommended answer, then wait for
the user's answers before the next round. Word each question so "yes"
accepts your recommended answer.

Format a round like so:

> ❓ **Q1 — question title**: the question, which may run to several
> lines and carry multiple choices.
>
> ➡️ your recommended answer

Each round of answers reshapes the tree: settled decisions push the
frontier outward and unblock the questions that depended on them. Recompute
the frontier and ask again. A question whose answer depends on another still
open in this round belongs to a later round.

Finding **facts** is your job, never the user's: look the fact up or
dispatch a sub-agent for it before asking anything the environment could
tell you. The **decisions** are the user's: put each decision to them and wait for their answer.

The session is done when the frontier is empty — every branch of the design
tree visited, nothing left silently assumed. Do not act on the matter until
the user confirms you have reached a shared understanding.