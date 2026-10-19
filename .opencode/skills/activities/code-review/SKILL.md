---
name: Code Review
description: Review the change since a fixed point along two axes — Standards (does it follow the project's conventions and general good design?) and Spec (does it fulfill what it set out to do?) — run as parallel sub-agents, then reconciled. Use when reviewing a branch, PR, or work-in-progress changes.
metadata:
  girth/role: activity
---

# Code Review

Two-axis review of the diff between `HEAD` and a fixed point the user names
(a commit, branch, tag, or `HEAD~n`):

- **Standards**: does the code follow the project's conventions and general
  good design?
- **Spec**: does it fulfill what it set out to do?

Run both axes as **parallel sub-agents** so neither pollutes the other, then
aggregate their findings.

## Process

1. **Pin the fixed point.** If the user didn't name one, ask. Capture the
   diff once: `git diff <fixed-point>...HEAD`, and the commit list. A bad
   ref or empty diff fails here.
2. **Identify the spec.** Look for it, in order: the ticket or feature whose
   `Parent:` or `References` point at it; a spec path the user passed; a file
   under `specs/` matching the branch or feature name; the parent spec named
   by the ticket being reviewed. If none exists, the Spec axis reports "no
   spec available."
3. **Identify the standards.** Read the rulings in `conventions/` for the
   domains the change touches — these govern, wherever they speak. On top of
   them, the **smell baseline** below always applies: a fixed set of general
   code smells that holds even where the project has recorded nothing. Two
   rules bind it: a recorded convention always wins, and every smell is a
   labelled heuristic, never a hard violation. Skip anything tooling already
   enforces.
4. **Spawn both sub-agents in parallel**, foreground, and aggregate.

## The smell baseline

Each smell reads *what it is* → *how to fix*: **Mysterious Name** (rename;
if no honest name comes, the design is murky) · **Duplicated Code** (extract
the shared shape) · **Feature Envy** (move the method onto the data it
envies) · **Data Clumps** (bundle into one type) · **Primitive Obsession**
(give the concept its own small type) · **Repeated Switches** (polymorphism
or one map) · **Shotgun Surgery** (gather what changes together) ·
**Divergent Change** (split so each module changes for one reason) ·
**Speculative Generality** (delete; inline back until a need shows) ·
**Message Chains** (hide the walk behind one method) · **Middle Man** (cut
it, call the target) · **Refused Bequest** (composition over inheritance).

## Where findings go

- A bug found in review — broken, the project's to fix — follows `tracking`.
- A code smell or convention violation with no bug behind it — a defect.
- "No correct seam for a regression test" is a defect too, not silence.
- Standards the review has to repeatedly assert by hand are convention
  candidates: propose the ruling (and an automated check where it's
  mechanical) rather than re-arguing each time.

## The PR body

When the review closes out a pull request, shape the PR body per
`references/pr-body.md`.

## Related skills

- conventions — the standards the Standards axis reads.
- codebase-design — the vocabulary the smell baseline and seam judgments use.
- tracking — where the review's findings are recorded.