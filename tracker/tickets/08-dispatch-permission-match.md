# 08: Dispatch-time permission matching, mismatches fail loudly

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 07 (six helpers defined)

## What it delivers

Before any helper is dispatched, the orchestrator matches the job's
requirements against that helper's own permission ruleset; a helper
never spins up under-provisioned. A mismatch is a system defect that
fails loudly at dispatch — recorded with a system provenance flag and
surfaced — never a mid-operation permission request reaching the user.
The janitor never emails the CFO.

## Acceptance criteria

- [ ] Every dispatch runs the requirements-versus-ruleset match first, and refuses a mismatched dispatch.
- [ ] A mismatch produces the loud system-defect record; the helper never starts.
- [ ] No engine-session code path can prompt the user for a permission mid-operation.