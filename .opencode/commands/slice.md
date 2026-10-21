---
description: Slice an approved spec — or an oversized bug or defect — into tickets, presented for approval
---

Take the item I name — an approved spec under `specs/`, or a bug or defect
too big for one context — and turn it into tickets. Tickets are the only
thing this command produces; working them is `/implement`'s. The chain runs
spec → slice → implement.

1. **Find the item.** The spec I name by slug or path, or the bug or defect
   by its tracker entry. Nothing named → look at the frontier: an approved
   spec waiting to be sliced, or the oldest oversized bug or defect. Nothing
   waiting → say so and stop.
2. **Read it completely**, so the tickets keep its scope — a feature is
   sliced through the spec its `References:` names.
3. **Slice it into tickets.** A ticket is a tracer-bullet vertical slice: a
   thin but *complete* path through every layer, demoable on its own, sized
   for one fresh context window. Wide refactors are the exception — one
   mechanical change spanning the codebase is an expand–contract chain: add
   the new form beside the old, migrate batch by batch, delete the old form
   last. If batches still cannot stay green individually, put them on one
   integration branch — but green is only promised at the end.
4. **Assign each ticket's `Kind:`** here, never later:
   - `bug-fix` — the ticket fixes a bug or defect.
   - `feature` — the ticket builds part of the spec.
   - `research` — the ticket exists to find a fact a later ticket depends
     on.
   - `refactor` — the ticket is mechanical change or deepening, not new
     behavior.
   A slice that needs a decision I have not given is blocked by the
   question, not guessed: track the question (call the skill tool with
   `tracking`), and let the ticket name it as its blocker.
5. **Write the tickets** in the `tracking` skill's format — one file per
   ticket under `tracker/tickets/`, numbered in dependency order, each
   naming its `Parent:`. Append a dated note to a bug or defect entry's
   **Work so far** naming its tickets, so the trail reads both ways. If
   `tracker/` is missing, call the skill tool with `bootstrapping` first.
6. **One checkpoint.** Present the graph — which tickets exist, what each
   delivers, and the blocking edges — and ask me to correct and approve; my
   approval is the slice. Rewrite the tickets to match my corrections.
7. **Report and stop.** The tickets are written and approved; `/implement`
   works the frontier.