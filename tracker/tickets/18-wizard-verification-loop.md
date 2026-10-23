# 18: Every value is checked, and failures re-ask in place

**Parent:** specs/wizard-redesign.md

**Kind:** feature

**Blocked by:** None (can start immediately)

## What it delivers

The wizard's library gains a labelled check: a passing probe prints its
label green; a failing probe prints the label red with the probe's own
error output, verbatim, and records the failure. A failed check re-asks
the value in the same stage and re-checks, looping until the value passes
or the user explicitly skips it — a skip is recorded with its reason,
never mistaken for a pass. The closing summary lists everything skipped or
still failing with the exact error shown at the failure, and the run's
exit code is true to whether anything failed. The skill's authoring
guidance states the floor: every captured value carries its cheapest
meaningful probe — a format check at the very least — before it is
persisted, and steps that can fail carry checks too.

## Acceptance criteria

- [ ] The check helper shows green on pass, red plus the probe's own
      error on fail.
- [ ] A failing check re-asks in the same stage until pass or explicit
      skip; skips are recorded with their reason.
- [ ] The closing summary lists skipped and failing items with their
      exact errors; the exit code stays true to failures.
- [ ] The skill's authoring guidance states the per-value probe floor.
