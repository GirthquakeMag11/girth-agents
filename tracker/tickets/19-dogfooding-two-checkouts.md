# 19: Dogfooding — the two-checkout separation and the self-report's home

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 04 (engine skeleton), 12 (report pile, routing, exception)

## What it delivers

The engine develops girth-agents itself — the point of dogfooding —
safely: it runs from a separate installed copy while developing this
repo's checkout, and its own commits reach the install only at the next
deliberate plugin update. The self-report channel's receiving end is
defined: defect entries filed from an install land in this repo's
tracker with their consent-gated, sanitized payload, and the project
side works them like any defect — ours to close, with the same
deduplication that governs repeated failures.

## Acceptance criteria

- [ ] The running plugin executes from an installed copy distinct from the checkout it develops.
- [ ] A self-committed change reaches the install only on a deliberate plugin update.
- [ ] A consent-gated self-report lands in this repo's tracker as a defect with its sanitized payload.
- [ ] Repeated identical reports coalesce with a count; a closure path exists for them.