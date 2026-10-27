# 11: The report pile, failure routing, and the exception

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 09 (review gate core), 10 (criteria and report shapes), 12 (tracker extensions)

## What it delivers

Every verdict is filed once in the report pile — a scaffold piece owned
by the review craft, its format in `code-review`'s references — and
stamped on the reviewed artifact. Failure routing runs by the settled
rule: whether a failure reaches the user is decided by whether its
rectification requires the user's answer, and in no other case. A
capped-out, un-askable failure is the exception: a loud, stamped,
project-side system-defect record that also self-reports to the
plugin's repo — consent asked at every send, payload limited to the
failing piece's brief and report — with identical failures coalescing
into one report and a new consent ask only when the failure differs.

## Acceptance criteria

- [ ] A report lands in the pile exactly once, and the artifact carries the stamped verdict.
- [ ] The pile reads as the single source for the engine's live report and the sidebar.
- [ ] Routing: the user is asked exactly when rectification requires their answer; nothing else reaches them.
- [ ] A dead-end triggers the loud exception, the consent-gated self-report, and the coalescing rule.
- [ ] The report pile's format lives with `code-review`'s references, and the scaffold inventory lists the pile under it.