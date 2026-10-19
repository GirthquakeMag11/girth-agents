---
name: Specifying
description: Turn the current conversation into a spec — the problem, solution, user stories, and the decisions that pin the design down — without a second interview, then hand it to the user to approve or amend. Use when a design has settled enough to write down, or when the user asks for a spec.
metadata:
  girth/role: activity
---

# Specifying

Write the spec that the conversation has already settled. Do not interview
the user again; synthesize what you already know about the problem, the
solution, and the decisions along the way.

## Process

1. **Read what the project already knows** — the glossary's terms, decisions
   that touch the area, hazards for it — so the spec speaks the project's
   language and does not re-argue settled ground.
2. **Explore the codebase** enough to state the solution and its seams
   honestly. Reuse existing seams over inventing new ones, and place any
   necessary new seam as high as possible; one seam is the ideal. The seams
   go in the spec's Testing Decisions, so check they match the user's
   expectation.
3. **Write the spec** in the format defined by the specs skill (call the
   skill tool with `specs`), filling every section. No file paths or code
   snippets in the decisions — they go stale; inline a snippet only when it
   encodes a decision more precisely than prose.
4. **Present it to the user** for approval or amendment. The spec governs
   only once approved; notes that are still open and cannot be settled now
   are tracked as questions, not silently baked in.

## Related skills

- specs — the spec's home and format.
- codifying — a hard-to-reverse decision settled while specifying earns a
  decision record, too.
- tracking — questions that cannot be settled now.