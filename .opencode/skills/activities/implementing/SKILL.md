---
name: Implementing
description: Take an approved thing — a spec, a feature, a bug, or a defect — slice it into tickets if it is not yet sliced, and work the frontier one ticket at a time, running each by its kind. Use when the user asks to implement, build, or fix something that has been planned or recorded.
metadata:
  girth/role: activity
---

# Implementing

Execution is tickets, worked one at a time. This skill turns an approved
thing into tickets when it needs to, then runs them.

## 1. Take the thing

The input is one of: a spec (`specs/<slug>.md`), a feature or bug or defect
entry, or a lone ticket already sliced.

## 2. Decompose if it is not sliced

- Read `references/slicing.md` — the tracer-bullet rules, the wide-refactor
  exception, and the kinds.
- Slice the thing into tickets, assigning each ticket's `Kind:` here: a bug
  or defect slices to `bug-fix`; a spec or feature slices to `feature`,
  `research`, or `refactor` as the slice demands.
- Write the tickets in the format the tracker skill defines (call the skill
  tool with `tracker`), numbered in dependency order, each naming its
  `Parent:`. A sliced bug or defect entry gains a pointer to its tickets.

## 3. The one checkpoint

Before executing anything, present the graph to the user: which tickets
exist, what each delivers, and — the part only the user knows — the
**blocking edges**. One round; the user corrects dependencies and approves.
On a lone ticket the user already named, skip this.

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