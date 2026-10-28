---
name: Technical Writing
description: Write any document an agent consumes — a skill, an AGENTS.md, a doc reached by a pointer — with the same levers: context pointers with their trigger branches, progressive disclosure, leading words, and ruthless pruning. Use when creating or editing a skill or an agent-facing document.
---

# Technical Writing

Reference for writing any document an agent consumes: a skill, an
`AGENTS.md`, a doc reached by a pointer. The packaging differs; the writing
does not — the same levers make each one predictable, because the writer runs
the same *process* every time rather than reusing the same output.

## Context pointers

A **context pointer** is a reference the agent holds in context that names
out-of-context material and encodes the condition for reaching it. A skill's
description is one; a line in `AGENTS.md` naming a doc is the same object.
The pointer's *wording*, not its target, decides whether and when the agent
reaches the material. A must-have target behind a weakly worded pointer is a
variance bug: sharpen the wording first; inline the material only if
sharpening fails.

A pointer does two jobs: state what the material is, and list the
**branches** that should trigger reaching it — one trigger per branch, with the leading word front-loaded, and anything
the body already says left out.

## The two loads

Every document and pointer spends one of two budgets:

- **Context load** — the cost of always-loaded material on the agent's
  window: a skill description, an `AGENTS.md` line, anything sitting in
  context every turn whether or not it fires.
- **Cognitive load** — the cost on the human: which documents exist and when
  to reach for each. Not a cost to minimise; it is the price of human agency.
  Spend it where human judgement matters, remove it where it does not.

Material reached only through a pointer escapes context load at the price of
the pointer's own line; material with no pointer rides entirely on the
human's memory.

## The information hierarchy

A document is built from two content types: **steps** (ordered actions) and
**reference** (facts consulted on demand). The core decision is where each
piece sits on the ladder, ranked by how immediately the agent needs it:

1. **In-file step** — what the agent does, in order.
2. **In-file reference** — consulted on demand; a flat peer set of rules on
   one rung is fine.
3. **Disclosed reference** — pushed out to a separate file, reached by a
   context pointer, loaded only when the pointer fires.

**Progressive disclosure** is the move down the ladder so the top stays
legible; it protects the hierarchy, and its cleanest test is branching:
inline what every branch needs, disclose what only some reach. **Co-location**
is the within-file companion — a concept's definition, rules, and caveats
under one heading, so reading one brings its neighbours. **Sprawl** is the
failure: a document too long even when every line is live; the cure is the
ladder, splitting by branch or sequence so each path carries only what it
needs.

## Steps and completion criteria

Every step ends on a **completion criterion** — the condition that says the
work is done. Two properties make it a lever:

- **Clarity** — can the agent tell done from not-done? A vague bound invites
  premature completion. Sharpen the bound first; only if it is irreducibly
  fuzzy do you hide later steps by splitting the sequence.
- **Demand** — how much it requires. "Every modified model accounted for"
  forces thoroughness where "produce a list of changes" does not. Demand is
  not step-bound: "every rule applied" binds a body of flat reference.

The strongest criteria are both checkable and exhaustive.

## When to split

Splitting spends a load, so split only when the cut earns it. Two cuts:
**by sequence** — split a run of steps where the later steps visible in
context tempt the agent to rush the one in front; and **by invocation** —
a distinct trigger of its own, or a need another skill must reach, earns the
material its own skill.

## Leading words

A **leading word** is a compact concept already in the model's pretraining
that the agent thinks with while running the document — *tight* loop, *red*
(failing), tracer *bullet*. Repeated as a token, never a sentence, it anchors
a region of behaviour in the fewest tokens by recruiting priors the model
already holds. A coined word recruits none: you pay in definition what a
pretrained word gives free, so reach for an existing word first.

**Negation** is the failure mode beside it: steering by prohibition drags the
forbidden behaviour into context and makes it *more* available. Prompt the
positive — state the target behaviour so the banned one is never spoken; a
prohibition earns its place only as a guardrail you cannot phrase
positively, paired with the positive target.

## Pruning

- **One home per meaning.** One authoritative place per fact, so changing it
  is a one-place edit. Duplication costs maintenance and inflates a meaning's
  prominence past its real rank.
- **The environment is a source of truth** — config files, scripts, layout,
  `--help`. A document that restates it is a cache, earning its load only
  when the lookup is expensive. Cache the unwritten convention, the reason
  behind a choice, the gotcha no config confesses.
- **Relevance.** Does each line still bear on what the document does? Shorter
  documents are easier to keep relevant; without pruning, the default fate is
  sediment settling until you must core through it.
- **Hunt no-ops.** An instruction the agent already obeys by default pays
  load to say nothing. The test is model-relative: run the document, and
  delete any sentence that does not change behaviour.