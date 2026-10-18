---
name: Diagnosing Bugs
description: Find the cause of a hard bug systematically — build a tight, red-capable reproduction loop before theorising, minimise it, rank falsifiable hypotheses, and fix with a regression test. Use when the user reports something broken or asks to debug it, or when you have tried and failed to fix a bug.
metadata:
  girth/role: activity
---

# Diagnosing Bugs

A discipline for hard bugs. Skip phases only when you can justify it. Before
working, read what the project already knows: hazards for the area,
conventions that bind it, decisions that touch it.

## Redact

You will show commands, outputs, and captured artifacts. **Redact every
secret first**: write `<REDACTED>` in its place; build loops against
environment variables so the credential stays in the environment; quote
only the signal-carrying lines of a captured artifact. If the redacted
output is not enough to diagnose, say so and ask the user.

## Phase 1: Build a feedback loop

**This is the skill.** Everything else is mechanical. A **tight, red-capable
loop** — one command that goes red on *this* bug — is what bisection,
hypothesis-testing, and instrumentation all consume. Without it, staring at
code saves nothing. Spend disproportionate effort here.

Ways to construct one, roughly in order: a failing test at the seam that
reaches the bug; a curl or HTTP script against a running dev server; a CLI
invocation with a fixture input diffed against a known-good snapshot; a
headless browser script; replaying a captured trace; a throwaway harness
that exercises the path with one call; a property or fuzz loop for
"sometimes wrong"; a bisection harness between two known states; a
differential loop (old vs new version); and, last resort, a
human-in-the-loop script that keeps the loop structured.

**Tighten it.** Make it faster, sharper (assert the exact symptom), and more
deterministic. A 30-second flaky loop is barely better than none; a
2-second deterministic one is the debugging superpower.

**Non-deterministic bugs:** the goal is a higher reproduction rate, not a
clean repro. Loop 100×, parallelise, add stress, narrow timing windows. 50%
is debuggable; 1% is not — keep raising it.

**When you genuinely cannot build a loop**, stop and say so. List what you
tried, then ask the user for access to the reproducing environment, a
redacted captured artifact, or permission to add temporary instrumentation.
Never proceed to hypothesise without a loop.

Completion: name one command you have **already run at least once** that is
red-capable (drives this bug's path and asserts the user's exact symptom),
deterministic, fast, and agent-runnable.

## Phase 2: Reproduce + minimise

Run the loop and watch it go red. Confirm it reproduces the failure the
**user** described, not a nearby one — wrong bug, wrong fix. Capture the
exact symptom. Then shrink the repro to the smallest scenario that still
goes red, cutting inputs, callers, config, data, and steps **one at a
time**, re-running after each cut. Done when removing any remaining element
makes the loop go green.

## Phase 3: Hypothesise

Generate **3–5 ranked, falsifiable hypotheses** before testing any of them.
Each states its prediction: "if X is the cause, then changing Y makes the
bug disappear, or changing Z makes it worse." A hypothesis that cannot state
a prediction is a vibe — discard or sharpen it. Show the ranked list to
the user; they often re-rank instantly. Don't block on it — proceed with
your ranking if the user is away.

## Phase 4: Instrument

Each probe maps to one prediction; **change one variable at a time**.
Prefer a debugger or REPL inspection; otherwise targeted logs at the
boundaries that distinguish hypotheses — never "log everything and grep".
Tag every debug log with a unique prefix like `[DEBUG-a4f2]` so cleanup is
one grep. For performance regressions, measure before fixing: establish a
baseline, then bisect.

## Phase 5: Fix + regression test

Write the regression test **before the fix**, but only at a **correct
seam** — one that exercises the real bug pattern where it occurs at the
call site. A too-shallow seam gives false confidence. If **no correct seam
exists, that is the finding**: note it, and record it as a defect (call the
skill tool with `tracking`) — the architecture is preventing the bug from
being locked down. Otherwise: turn the minimised repro into a failing test,
watch it fail, apply the fix, watch it pass, and re-run the Phase 1 loop on
the original scenario.

## Phase 6: Cleanup

The original repro no longer reproduces; the regression test passes (or the
missing seam is recorded); all `[DEBUG-…]` instrumentation removed; throwaway
prototypes deleted; the hypothesis that proved correct stated in the commit
message so the next debugger learns.

## Related skills

- tracking — a bug that must not be fixed now goes to the tracker through
  it; a fix that lands closes the bug there.
- maintaining-docs — a fix a user could notice gets a changelog entry.