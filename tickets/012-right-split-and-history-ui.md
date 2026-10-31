# 012 — Right column split and History UI

**Status:** passed (independent review, 2026-10-30)  
**Sequence:** 3 of 5  
**Depends on:** 011  
**Spec:** `DASHBOARD-MOTION-HISTORY-SPEC.md` §3–5, §8–10.2

## Context

The right side is one full-height Details pane. It must become Details on top
and History on bottom at split sizes, with a one-line History strip at
collapsed sizes. The Run console remains separate and unchanged.

## Work

- Add native `HistoryPane` and `HistoryStrip` components.
- Split the right column at `width >= 120 && height >= 36`.
- Use the spec split formula: one-row gap;
  `historyHeight = max(8, floor((H - 1) * 0.4))`;
  `detailsHeight = H - 1 - historyHeight`.
- In split mode, Details top and History bottom are native bordered panes
  with titles; History is a scrollbox, newest first.
- In strip mode, preserve the existing DetailsStrip (height 2 including its
  bottom border; active content or only the title when idle) and add a
  one-row, borderless HistoryStrip above the Run console. It renders the
  exact text owned by ticket 011.
- History is never hidden at supported sizes 60×20 and above.
- Update `responsiveLayout` with exact flags, widths, split/strip heights,
  graph-width formula, and unchanged console heights.
- Ensure Details remains live-work-only/empty idle; queued memberships are
  inactive.
- Keep the Run console content, rows, and heights unchanged.
- Ensure History rows are static; no row animation.
- Add explicit assertions for the full responsive matrix:
  - Flags: `split`/`detailsPane`/`historyPane` true at 160×50, 120×40,
    120×36; false at 120×35, 160×30, 119×50, 100×30, 90×24, 80×24,
    60×20. `showOutline` true at width ≥90 (160×50, 120×40, 120×36,
    120×35, 160×30, 119×50, 100×30, 90×24), false at 80×24/60×20.
    `detailsStrip` true at !split && width≥90 (120×35, 160×30, 119×50,
    100×30, 90×24), false at 80×24/60×20. `historyStrip` true at every
    non-split size.
  - Graph widths: 160×50 84; 120×40 56; 120×36 56; 120×35 91;
    160×30 127; 119×50 92; 100×30 73; 90×24 63; 80×24 74; 60×20 54.
  - Outline widths: 26 at ≥160, 22 at 120–159, 20 at 90–119, hidden below.
  - Details/History widths: 42/42 at ≥160, 34/34 at 120–159.
  - Split heights: Details/History 22/14 at 160×50, 17/10 at 120×40,
    14/9 at 120×36.
  - Strip heights: Details 2/History 1 at 120×35, 160×30, 119×50, 100×30,
    90×24; Details hidden/History 1 at 80×24 and 60×20.
  - Console heights: 8 at 160×50 and 119×50; 7 at 120×40/120×36/120×35/
    160×30/100×30; 6 at 90×24/80×24; 3 at 60×20.
  - No accidental wrapping and no old width-only tests.
- Add a below-60×20 smoke test: may clip but must not crash, and History is
  not guaranteed.
- Add a static-row test: inserting a new History row does not change the tone
  or contrast of existing rows.
- Retain/add Details assertions: active entry populated; queued membership
  inactive; idle body empty; no idle/default node.

## Validation condition

At 160×50, 120×40, and 120×36 the right column splits with the exact
Details/History heights and widths above. At 120×35, 160×30, 119×50,
100×30, and 90×24, Details is a 2-row strip and History a 1-row borderless
strip. At 80×24 and 60×20, Details is hidden and History remains a 1-row
borderless strip. Flags match the matrix. Details is active-only: populated
for the active node, queued membership inactive, empty idle, no default. Run
console rows/heights are unchanged, including 119×50 = 8. Responsive, shell,
and no-wrap tests pass; below 60×20 does not crash.

## Out of scope

- Motion (containers, node sweep, connector runner).
- Captures/docs/roadmap (ticket 014).
- Run archive.
- Node selection/editing.

## Review gate

The reviewer must inspect the responsive model, pane components, and tests,
and answer:

- Is the split/strip behavior exact at every boundary?
- Is History never hidden at supported sizes?
- Is the Run console unchanged?
- Is Details active-only with queued membership inactive?
- Are there no accidental wraps and no old width-only tests left?
