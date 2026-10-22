---
name: Specifying
description: Turn the current conversation into a spec — the problem, solution, user stories, and the decisions that pin the design down — then refine it with the user and hand it over for approval. Use when a design has settled enough to write down, or when the user asks for a spec.
---

# Specifying

Write the spec the conversation has settled, then settle the rest of it.
The first pass is written from what is already known — no interview yet —
so the design exists as a thing before it is questioned. Gaps are
expected, not a failure: the second pass fills them.

## Process

1. **Read what the project already knows** — the glossary's terms, decisions
   that touch the area, hazards for it — so the spec speaks the project's
   language and does not re-argue settled ground.
2. **Explore the codebase** enough to state the solution and its seams
   honestly. Reuse existing seams over inventing new ones, and place any
   necessary new seam as high as possible; one seam is the ideal. The seams
   go in the spec's Testing Decisions, so check they match the user's
   expectation.
3. **Write the spec** in the format in `references/spec-format.md`, from
   `references/spec-template.md`, filling every section from what the
   conversation has settled. Reserve — never invent — what is still open: an
   open question stays visibly open in the draft, or is listed to be asked.
   No file paths or code snippets in the Implementation Decisions — they go
   stale; inline a snippet only when it encodes a decision more precisely
   than prose.
4. **Refine the written spec.** Call the skill tool with `grilling` — now,
   with the spec as the design tree, work its open questions and fuzzy spots
   until they are filled or ruled out. The interview happens *after* the
   spec is written, never in its place; every answer lands back in the spec.
5. **Check the spec independently.** Hand a fresh-context reviewer —
   never the agent that wrote it — the draft together with the
   conversation's settled statements, and have it verify: the spec format
   from `references/spec-format.md`, every settled statement against them,
   and agreement with the project's own documents — the glossary's terms,
   the decisions that touch the area, the standing conventions. The
   reviewer reports findings; amend the draft from them. If the findings
   open new questions, clear them with `grilling` before the approval
   ask.
6. **Put the approval to the user** with these options, numbered:

   1. **Approve (Commit)** — commit the spec; it governs from here.
   2. **Approve and Slice** — commit the spec, then hand it to `/slice`
      and run the slicing, its graph checkpoint included.
   3. **Stop and Amend** — discuss the spec further before anything is
      committed or sliced.
   4. **Other** — a freeform answer.

   Prefer the question-asking tool for this ask when one is available: it
   adds a freeform "type your own answer" entry of its own, so offer only
   options 1–3 through it. With no question tool, offer all four
   yourself, the fourth as the open freeform entry. The spec governs only
   once approved; questions still open are tracked, not silently baked
   in.

## Related skills

- grilling — the interview that fills and refines the spec, once it is
  written.
- codifying — a hard-to-reverse decision settled while specifying earns a
  decision record, too.
- tracking — questions that cannot be settled now.