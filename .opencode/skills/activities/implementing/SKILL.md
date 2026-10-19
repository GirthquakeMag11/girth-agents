---
name: Implementing
description: Turn an approved spec, bug, or defect into tickets and work the frontier one ticket at a time, each by its Kind; a feature implements through its spec. Use when the user asks to implement, build, or fix something planned or recorded, with or without naming it.
metadata:
  girth/role: activity
---

# Implementing

Execution is tickets, worked one at a time. This skill turns an approved
thing into tickets when it needs to, then runs them.

## 1. Route the input

Work happens through **tickets** — the unit of work. Everything else is a
source of them:

- A **ticket** — already sliced; work it (skip to 4).
- A **spec** — slice it into tickets (2, then the checkpoint in 3).
- A **bug or defect** — a fix sized for one context becomes a single
  `bug-fix` ticket; anything bigger is sliced.
- A **feature** — implements only through its spec: slice the spec its
  `References:` names. No spec yet → call the skill tool with `specifying`,
  and return here once the spec is approved.
- **Nothing named** — the frontier is the input: the open, unblocked
  tickets, in number order. None open → the oldest open bug, defect, or
  spec waiting to be sliced. Nothing open at all → say so; suggest
  `tracking` or `specifying`.

## 2. Decompose if it is not sliced

- Read `references/slicing.md` — the tracer-bullet rules, the wide-refactor
  exception, and the kinds.
- Slice the source into tickets, assigning each ticket's `Kind:` here: a
  bug or defect slices to `bug-fix` (with `research` or `refactor` only
  where the fix demands); a spec slices to `feature`, `research`, or
  `refactor` as the slice demands.
- Write the tickets in the format the tracker skill defines (call the skill
  tool with `tracker`), numbered in dependency order, each naming its
  `Parent:`. Append a dated note to the bug or defect entry's **Work so
  far** naming its tickets, so the trail reads both ways.

## 3. The one checkpoint

Before executing anything, present the graph to the user: which tickets
exist, what each delivers, and — the part only the user knows — the
**blocking edges**. One round; the user corrects dependencies and approves.
With a lone ticket — named by the user or picked from the frontier — there
is no graph: say in one line which ticket and what it delivers, then carry
on.

## 4. Work the frontier, sequentially

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

## 5. Close the loop

- A `bug-fix` ticket that lands closes its bug or defect (call the skill
  tool with `tracking`) and gets a changelog entry where a user would notice
  (call the skill tool with `maintaining-docs`).
- A feature's tickets close the feature **only on the user's approval**, per
  `tracking`.
- A ruling made along the way is recorded by calling the skill tool with
  `codifying`, not left implicit.

## Related skills

- tracker — the tickets' home and format.
- specs — the parent a feature's tickets answer to.
- tracking — where bugs, defects, and feature closures live.
- codifying — where rulings made while building are recorded.