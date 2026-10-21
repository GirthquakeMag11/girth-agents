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

## The entry

What follows is the kind's definition and entry format. An entry closes by
its closing line below.

## Definition

A bug prevents something from working when it should, and is the project's
to fix. A bug is fixed, never designed around: a workaround left standing
would turn it into a quiet design constraint, indistinguishable from a
hazard.

## Entry

```markdown
## <One-line title> — <YYYY-MM-DD>

- **The bug:** <symptoms, where it lives, how to reproduce, why it matters>
- **Work so far:** <dated, chronological notes — every diagnosis, attempt
  to recreate, fix attempt, thing learned, and where the effort stopped>
```

The work log is the point: it carries all work already done on the bug, so
whoever picks it up starts where it was put down instead of re-earning the
ground.

## Closing line

`- **Fixed — <YYYY-MM-DD>:** <what fixed it>`

## Example

```markdown
## Header nav collapses under focus on Safari — 2026-10-09

- **The bug:** tabbing into the nav triggers `:focus` on the `<details>`
  wrapper, closing it. Repro: open the site in Safari 18, click "Docs",
  press Tab twice. Safari only; Chrome and Firefox are fine.
- **Work so far:**
  - 2026-10-09: tried `pointer-events: none` on the summary — kills the
    click toggle instead. Reverted.
  - 2026-10-09: suspected a Safari `<details>` focus quirk; nothing found
    inside the task's timebox — entry opened.
  - 2026-10-12: picked up; blurred the summary on `focusout`. Verified in
    Safari 18 and Chrome.
- **Fixed — 2026-10-12:** blur-on-focusout handler plus a regression test.
```