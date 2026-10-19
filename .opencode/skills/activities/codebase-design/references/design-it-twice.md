# Design it twice

For when the shape of an interface is the open question. Based on "Design
It Twice" (Ousterhout): your first idea is unlikely to be the best, so force
radically different candidates and compare them. Uses the codebase-design
skill's vocabulary: **module**, **interface**, **seam**, **adapter**,
**leverage**.

## 1. Frame the problem space

Before spawning anything, write the user-facing paragraph for the candidate
being explored:

- the constraints any new interface must satisfy,
- its dependencies and their category (per `references/deepening.md`),
- a rough illustrative sketch to make the constraints concrete — grounding,
  not a proposal.

Show it to the user, then start step 2; they read while the sub-agents work.

## 2. Spawn sub-agents

Spawn **three or more sub-agents in parallel**. Each designs a **radically
different** interface for the deepened module. Give each its own technical
brief — file paths, coupling details, the dependency category, what sits
behind the seam — plus the codebase-design vocabulary and the project
glossary's terms, so every design names things consistently. Give each
sub-agent one distinct constraint:

- **Minimize the surface:** aim for 1–3 entry points, maximum leverage per
  entry point.
- **Maximize flexibility:** support many use cases and easy extension.
- **Optimize the common caller:** make the default case trivial.
- Where cross-seam dependencies are the issue: **design around ports and
  adapters**.

Each sub-agent returns:

1. its interface — types, methods, params, plus invariants, ordering
   constraints, error modes;
2. a usage example as callers would write it;
3. what the implementation hides behind the seam;
4. its dependency strategy and adapters;
5. its trade-offs — where leverage is high, where it is thin.

## 3. Present and compare

Present the designs one at a time so the user can absorb each, then compare
them in prose by **depth** (leverage at the interface), **locality** (where
change concentrates), and **seam placement**. Then give your own
recommendation: the strongest design and why, or a hybrid of the best
parts. Be opinionated — the user wants a strong read, not a menu.