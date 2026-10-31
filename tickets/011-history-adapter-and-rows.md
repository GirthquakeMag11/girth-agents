# 011 — History adapter and row grammar

**Status:** passed (independent review, 2026-10-30)  
**Sequence:** 2 of 5  
**Depends on:** 010  
**Spec:** `DASHBOARD-MOTION-HISTORY-SPEC.md` §5–6, §9–10.2

## Context

The dashboard needs a deterministic way to turn structured engine history
into the exact rows and one-line strip text defined by the spec. This ticket
keeps that logic pure and testable, separate from the pane layout.

## Work

- Extend the dashboard data adapter to pass `runtime.history` and
  `runtime.historyEpoch` through.
- Default missing/malformed history to `[]`; default missing epoch to `""`.
- Add a pure history model that:
  - sorts newest first by reverse chronological `seq`/array order, not by
    `at` alone, so equal timestamps remain stable;
  - maps every kind/status to the exact spec row grammar;
  - substitutes `—` for missing dispatch id, node, from, to, label, outcome,
    terminal, and code;
  - handles an absent/empty workflow on `queued` as `queued · node <node>`;
  - handles queued workflow and queued node dispatch;
  - handles completed/cancelled completion rows;
  - handles engine-level defect rows with exact two-space column spacing;
  - handles reload valid/invalid;
  - emits exact empty-pane `No activity yet.` and empty-strip
    `History · No activity yet.` strings;
  - returns the exact one-line strip `History · <newest row>`;
  - does not wrap text.
- Use fixed local `HH:MM:SS` formatting from `at` with an optional test
  timezone.
- Add tests for every row form, missing values including missing workflow,
  empty history, both exact strip strings, newest-row strip, equal
  timestamps/seq ordering, adapter defaults, and deterministic timestamps.
- This ticket owns the exact strip text; ticket 012 consumes and renders it.
- No History UI or responsive changes in this ticket.

## Validation condition

Pure dashboard tests pass for every row grammar/missing-value case, including
missing workflow; adapter defaults; empty strings; exact strip strings;
newest-row selection; equal-timestamp ordering; and fixed-time formatting.
The model is safe when history contains unknown extra keys.

## Out of scope

- Rendering HistoryPane/HistoryStrip.
- Right-column split/responsive work.
- Motion.
- Run archive.

## Review gate

The reviewer must read the spec row grammar and implementation, run the
dashboard suite, and answer:

- Does every engine kind/status map exactly as specified?
- Are missing values and empty strings exact?
- Does the adapter never derive history from human-readable state?
- Are timestamps deterministic and is the strip newest-row correct?
