---
name: Implementing
description: Work the ticket frontier — already-sliced tickets one at a time, each by its Kind; a feature's tickets answer to its spec. Use when the user asks to implement, build, or fix something planned or recorded, with or without naming it.
---

# Implementing

Execution is tickets, worked one at a time. Slicing an approved thing into
tickets is `/slice`'s job — the chain is spec → slice → implement. This
skill runs the tickets.

## 1. Route the input

Work happens through **tickets** — the unit of work:

- A **ticket** — already sliced; work it (skip to 3).
- A **spec** — its tickets should already exist; if they do not, hand the
  user `/slice` and stop.
- A **bug or defect** — a fix sized for one context becomes a single
  `bug-fix` ticket, written in the `tracking` skill's format; anything
  bigger is handed to `/slice`.
- A **feature** — implements through its spec: call the skill tool with
  `specifying` if none exists yet, then `/slice` turns the spec into
  tickets.
- **Nothing named** — the frontier is the input: the open, unblocked
  tickets, in number order. None open → the oldest open bug, defect,
  or spec not yet sliced; unsliced work is handed to `/slice`, never
  sliced here. Nothing open at all → say so; suggest
  `tracking` or `specifying`.

## 2. The one line before executing

There is no ticket graph here — that checkpoint lives in `/slice`. With a
lone ticket, named by the user or picked from the frontier, say in one line
which ticket and what it delivers, then carry on.

## 3. Work the frontier, sequentially

For each open, unblocked ticket, run it by its `Kind:`:

| Kind       | How                                                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bug-fix`  | Obvious fix → build it test-first (call the skill tool with `tdd`); otherwise call the skill tool with `diagnosing-bugs` and run its loop, then fix with a regression test. |
| `feature`  | Call the skill tool with `tdd` at the pre-agreed seams from the parent spec, then call the skill tool with `code-review` against that spec.                                 |
| `research` | Call the skill tool with `research`; the ticket closes with a pointer to the cited notes.                                                                                   |
| `refactor` | Call the skill tool with `codebase-design` for the discipline, and run the expand–contract chain each ticket declares.                                                      |

Append dated notes to the ticket file as you work, finished or not — a
put-down here loses nothing. Recompute the frontier after each close, and
continue until it is empty or the user stops you.

## 4. Close the loop

- A `bug-fix` ticket that lands closes its bug or defect (call the skill
  tool with `tracking`) and gets a changelog entry where a user would notice
  (call the skill tool with `maintaining-docs`).
- A feature's tickets close the feature **only on the user's approval**, per
  `tracking`.
- A ruling made along the way is recorded by calling the skill tool with
  `codifying`, not left implicit.

## Related skills

- `/slice` — the command that turns a spec or oversized fix into the tickets
  this skill works.
- tracking — the tickets' home and format, and where bugs, defects, and
  feature closures live.
- specifying — where a feature's parent spec is written.
- codifying — where rulings made while building are recorded.