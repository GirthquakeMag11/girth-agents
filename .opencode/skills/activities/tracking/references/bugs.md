# Handling a bug

Bugs move between two states — fixed now, or tracked for later — and neither
is final until the fix lands.

When a bug is **reported** rather than encountered — the user says it is
broken, or an issue describes it — verify the claim first by reproducing it
from the reported steps. A bug written up unverified can steer the next
agent wrong; when it will not reproduce, record the report with a note that
it is unconfirmed.

## Fix now, or track

Three rules, in order:

1. **Blocking → fix now.** If the bug blocks the current task — the task
   cannot proceed until the bug is fixed — fixing it is within the scope of
   the current task, and it does not belong in the tracker. Working around
   the bug is not proceeding: a workaround is the hazard pattern, and it is
   not available to bugs.
2. **Obvious fix → attempt now.** If the solution is as apparent as the bug
   itself — fixing costs less effort than tracking would — attempt the fix
   then and there. A tracking entry is effort too; it is the price you are
   avoiding.
3. **Otherwise → track it** and return to the task.

## Workarounds are for hazards

A known hazard may interfere with a design and require the design to work
around it — that is a hazard's legitimate influence. A bug never gains that
influence by expediency. A bug worked around and left standing turns the
workaround into a quiet design constraint, indistinguishable from a hazard
the design was built around. The task is based on the design; compromising
the design to finish the task makes no sense. Blocking bugs are fixed: not
routed around, and not tracked so they can be routed around later.

## The attempt may end in the tracker

"Attempt" is load-bearing: you may change your mind about a bug you decided
to fix. A fix begun because it looked obvious may prove larger and more
involved than it seemed. When it does, the bug disqualifies itself from the
immediate fix: back out partway and track it. Backing out is the put-down
half of the pick-up/put-down rhythm, and it loses nothing — everything you
tried, learned, or half-fixed goes into the work log.

A blocking bug is never backed out of. The task stays on the bug until it is
fixed, end of story. If the fix grows larger than the task can bear, report
the blocked state to the user; the bug is neither worked around nor moved to
the tracker while the task still needs it fixed.

## Closing

Close the entry when the fix lands. A fix users could notice also gets a
changelog entry.