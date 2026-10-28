# 27: The live session driver — spawn, brief, await, resume, deny-rest

**Parent:** specs/engine.md

**Kind:** feature

**Blocked by:** 23 (the attachment finding), 25 (the dispatch lifecycle it serves)

## What it delivers

The real counterpart to the fake driver: a headless session is spawned
through the engine's own server client (or, under the proxy fallback,
through the plugin's context over stdio), created with the helper's
model and pre-granted permissions, prompted with the brief, awaited to
completion by outcome, interrupted on cap, and resumed by continuing the
same session with the reviewer's report — shot from the dispatch-time
check, which compares the objective's requirements against the helper's
fitting and fails loudly before dispatch. Anything outside the fitting
is denied by construction; a needed-but-ungranted capability is a
dispatch-time defect, never a prompt.

## Work so far

- 2026-10-28: built test-first on the client-attachment research (ticket 23). The service module attaches a second process exactly as the TUI does — registration-file discovery, Basic auth, health check with typed defects. The live driver implements the executor's spawn/prompt/interrupt contract over HTTP: creation carries the helper's model, location, and pre-granted rule set; the dispatch-time requirements check fails before any session exists; completion waits on the experimental wait with outcome polling as the documented backstop; interrupt stops the loop. The executor gained resume-by-node (repair continues the graded session) and dispatch-defect surfacing.

- **Done — 2026-10-28:** the live session driver lands at `engine/service.mjs` and `engine/driver.mjs`; eight contract tests against a fake OpenCode server, 31 green across the suite.

- [ ] A headless session spawns with the chosen model and permission set, runs a real brief, and completes with its outcome observed
- [ ] A time-cap breach interrupts the session and reports the structured failure
- [ ] Repair continues the same session with added context; a fresh spawn is used where the graph says fresh
- [ ] A lost or crashed session is detected and the step recovers per the driver's contract
- [ ] A fitting missing a requirement fails at dispatch, not mid-run, and no session ever prompts