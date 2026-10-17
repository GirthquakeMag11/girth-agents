---
name: Tracking Bugs
description: Spot a bug and decide: fix it in flight when it blocks the current task or when the fix is obvious and cheaper than tracking it; otherwise record it in tracker/BUGS.md with the bug's details and a dated log of all work already done, so any agent can pick it back up later. A fix attempt that proves bigger than expected may be backed out of at any time and converted into a tracked bug.
---

# Tracking Bugs

Bugs move back and forth between two states: fixed now, or tracked for
later. Neither state is final until the fix lands. The tracker exists so an
agent doing important work never has to choose between derailing its task
and losing the bug.

## Triage: fix now, or track

First classify: if the thing works but is merely bad — a smell or a
violation of the project's conventions or design principles — it is a
**defect**, not a bug, and it belongs to the tracking-defects skill. If the
thing works as it should and the want is for it to do *more*, that is a
**feature**, not a bug, and it belongs to the tracking-features skill.

For a genuine bug — something that prevents working when it should — answer
one question: is it fixed immediately, or recorded in the tracker for
later? Three rules, in order:

1. **Blocking → fix now.** If the bug blocks the current task — the task
   cannot proceed until the bug is fixed — then fixing it is within the
   scope of the current task, and it does not belong in the tracker.
   Proceeding by working around the bug is not proceeding: a workaround is
   the hazard pattern, and it is not available to bugs (see "Workarounds
   are for hazards" below).
2. **Obvious fix → attempt now.** If the solution is as apparent as the bug
   itself — fixing costs less effort than tracking it would — attempt the
   fix then and there. Compare honestly: a tracking entry is also effort,
   and it is the price you are avoiding.
3. **Otherwise → track it.** Record it per "Entry format" below and return
   to the task.

## Workarounds are for hazards

A known hazard may interfere with a design and may require the design to
work around it — that is a hazard's legitimate influence (see the
tracking-hazards skill). A bug must never gain that influence by
expediency. A bug that is worked around and left standing makes the
workaround a quiet design constraint, indistinguishable from a hazard the
design was built around. When the task is itself based on the design,
compromising the design to get the task done makes no sense. Blocking bugs
are fixed — not routed around, and not tracked so they can be routed around
later.

## The fix attempt may end in the tracker

"Attempt" is load-bearing: you may change your mind about a bug you already
decided to fix.

A fix attempt begun because the bug seemed trivially fixable may prove
larger and more involved than first thought. When it does, the bug
disqualifies itself from being fixed immediately: back out partway through
and track it instead. Backing out is not failure; it is the put-down half
of the pick-up/put-down rhythm — and it must never lose information. What
you tried, learned, or half-fixed goes into the entry's work log; the next
agent pays again for anything withheld.

A blocking bug cannot be backed out of. The task stays on the bug until it
is fixed — end of story. If the fix grows larger than the task can bear,
that blocked state is reported to the user; the bug is not worked around,
and it is not moved to the tracker while the task still needs it fixed.

## The tracker file

The canonical file:

```markdown
# BUGS

Bugs the project intends to fix. Entries carry full detail plus a log of
work already done; see the tracking-bugs skill for the triage rules and
entry format.

<!-- entries below, newest first, one `##` section each -->
```

It lives at `tracker/BUGS.md` in the project root. If it does not exist,
load the bootstrapping skill, follow its BUGS section to create the file,
then add the entry.

## Entry format

One `##` section per bug, newest first:

```markdown
## <One-line title> — <YYYY-MM-DD>

- **The bug:** <symptoms, where it lives, how to reproduce, why it matters>
- **Work so far:** <dated, chronological notes — every diagnosis, attempt
  to recreate, fix attempt, thing learned, and where the effort stopped>
```

The work log is the point. It is how a future agent picks the bug up where
it was put down instead of re-earning the ground.

- The timestamp is required; use `YYYY-MM-DD` and add a time only when it
  matters.
- Before writing, read the file. If an entry already covers the bug, do not
  create a new one — append to its work log instead.
- While working on a bug (fixed-now or pick-up), keep appending dated notes
  to the work log as you go, so a put-down mid-fix loses nothing.
- When a tracked bug is fixed, append `**Fixed — <date>:** <what fixed it>`
  to the entry and leave it in place; fixed bugs are history, not garbage.

### Example

```markdown
## Header nav collapses under focus on Safari — 2026-10-09

- **The bug:** tabbing into the nav triggers `:focus` on the `<details>`
  wrapper, closing it. Repro: open the site in Safari 18, click "Docs",
  press Tab twice. Safari only; Chrome and Firefox are fine.
- **Work so far:**
  - 2026-10-09: tried `pointer-events: none` on the summary — kills the
    click toggle instead. Reverted.
  - 2026-10-09: suspected a Safari `<details>` focus quirk; nothing found
    inside the task's timebox — tracked.
  - 2026-10-12: picked up; worked around by blurring the summary on
    `focusout`. Verified in Safari 18 and Chrome.
- **Fixed — 2026-10-12:** blur-on-focusout handler plus a regression test.
```

## Picking up a tracked bug

- Read the entry completely — especially the work log. Start where it
  stopped; do not re-derive what is recorded.
- Append dated notes to the work log as you work, whether or not you
  finish, so the next put-down (or the next agent) loses nothing.
- If you fix it, append the `Fixed` line. If you put it down again, the log
  already speaks for you.

## Related skills

- bootstrapping — creates `tracker/BUGS.md` when it is missing.
- tracking-hazards — sibling tracker; recurring obstacles that will bite
  again belong there, not here (see that skill's "Not hazards"). Hazards
  are the proper home of the workaround (see "Workarounds are for
  hazards").
- tracking-defects — sibling tracker; the boundary is the "works but bad"
  test (see that skill's "Bug or defect first").
- tracking-features — sibling tracker; wanted-but-absent belongs there.
- tracking-questions — sibling tracker.