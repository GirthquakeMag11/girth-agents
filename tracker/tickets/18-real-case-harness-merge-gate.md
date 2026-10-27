# 18: The real-case harness and the merge gate

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 01 (plugin skeleton and channel), 09 (review gate core), 14 (inbox machinery), 16 (inbox screen and sidebar)

## What it delivers

A committed automated harness drives the engine's real pieces — the
parser, the review loop, the session spawning, the inbox record, the
TUI slot — with assertions that map to trust, and it gates merges to
main: no merge lands without it green. The harvested scenarios become
regression cases: a representation FAIL is correct review behavior and
the interpreter classifies it — representation repair, the design
question, or the scoping clarification, never the reconciliation
question that presumes one layer; the plan-gate completeness holds; the
permission mismatch fails loudly; a crashed engine rebuilds the truth
from records alone.

## Acceptance criteria

- [ ] The harness drives each named seam with real components and trust-mapping assertions.
- [ ] A merge to main requires the harness green.
- [ ] Each harvested scenario exists as a regression case and fails when its defect is reintroduced.