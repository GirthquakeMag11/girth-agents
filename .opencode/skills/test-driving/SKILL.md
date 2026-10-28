---
name: Test-Driving
description: The broad practice of testing changes in real cases before trusting them — build and fix test-first at pre-agreed seams; the project's own testing system is part of what it teaches and drives. Use when building a feature, fixing a bug, or locking a change down with a regression test.
---

# Test-Driving

Test-driving is the broad practice of testing changes in real cases
before trusting them — not just tests-first-then-code under a new name.
The project's own testing system is part of what it teaches and drives:
a change ships because real cases drove it, not because the ceremony
ran.

At the heart of the practice is the red → green loop, made to produce
tests worth keeping: what a good test is, where tests go, the
anti-patterns, and the rules of the loop. Consult these before and
during each cycle, not after.

Before working, read what the project already knows and name things in
the glossary's terms.

## What a good test is

Tests verify behavior through public interfaces, not implementation
details. A good test reads like a specification — "user can checkout with a
valid cart" — and survives refactors because it does not care about
internal structure. See `references/tests.md` for examples and
`references/mocking.md` for when to mock.

## Seams: where tests go

A **seam** is the public boundary you test at — the interface where you
observe behavior without reaching inside. Tests live at seams, never
against internals.

**Test only at pre-agreed seams.** Before writing any test, write down the
seams under test and confirm them with the user. You cannot test
everything; agreeing the seams up front is how effort lands on the critical
paths instead of every edge case. Ask: "what's the public interface, and
which seams should we test?" Give each proposed seam a one-line note on
what it catches and what it misses. When the shape of the interface itself
is in question, call the skill tool with `codebase-design` for the
vocabulary.

## Anti-patterns

- **Implementation-detail tests:** mocks internal collaborators, tests private
  methods, or verifies through a side channel. The tell: the test breaks on
  a refactor while behavior is unchanged.
- **Tautological:** the assertion recomputes the expected value the way the
  code does, so it passes by construction. Expected values come from an
  independent source of truth — a literal, a worked example, the spec.
- **Horizontal slicing:** all tests first, then all implementation. That
  tests *imagined* behavior. Work in **vertical slices** — one test, one
  implementation, repeat — each slice a tracer bullet responding to what the
  last cycle taught.

## Rules of the loop

- **Red before green.** Write the failing test, then only enough code to
  pass it. No speculative features.
- **One slice at a time.** One seam, one test, one minimal implementation
  per cycle.
- **Refactoring is not part of the loop.** It belongs to review (call the
  skill tool with `code-review`), not the red → green cycle.

## Related skills

- codebase-design — the vocabulary for deciding where a seam goes.
- code-review — where refactoring belongs.
- tracking — a bug found on the way follows that skill's fix-or-record
  rules.