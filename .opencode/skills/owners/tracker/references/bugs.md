# Bugs

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

## Closing

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