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
5. **Present it to the user** for approval or amendment. The spec governs
   only once approved; questions still open are tracked, not silently baked
   in.

## Related skills

- grilling — the interview that fills and refines the spec, once it is
  written.
- codifying — a hard-to-reverse decision settled while specifying earns a
  decision record, too.
- tracking — questions that cannot be settled now.