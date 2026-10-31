# 013 — Motion: static containers, border sweep, connector runner

**Status:** passed (independent review, 2026-10-30)  
**Sequence:** 4 of 5  
**Depends on:** 012  
**Spec:** `DASHBOARD-MOTION-HISTORY-SPEC.md` §7, §10.2

## Context

The current running-node and container pulse changes contrast and harms
readability. The new motion contract preserves color tone: containers are
static, running nodes get a shape-only border sweep, and new handoffs get a
one-shot runner along the actual connector.

## Work

- Make workflow containers completely static: no border, tick, title, or
  label animation. Queued and active containers are still.
- Remove running-node border/background pulse. Keep active color, fill, text,
  and layout fixed.
- Add `ActiveSweep` as a bounded native positioned segment, never a
  per-cell style grid. It is exactly two `━━` cells in the running accent
  hue at the card's top-border row, starting at `card.x + 1`; the base
  border stays `─`; it never enters the rounded corners. Offset is
  `floor(elapsedMs / 250) % max(1, card.width - 3)`; loop period is
  `250 * max(1, card.width - 3)`ms. No sweep below width 6; no sweep for
  queued/idle/terminal nodes; no color, text, or layout changes.
- Add `runnerPath` to every route, ordered from source card edge to target
  card edge including corners.
- Add `ConnectorRunner`: on `runtime.history` updates, use
  `historyEpoch`/`seq` watermark. Existing history at mount does not animate;
  one new handoff animates once; multiple new handoffs animate only the
  highest and cancel the earlier token; advance the watermark to the maximum
  `seq` in the new history including non-handoff entries; epoch change resets
  the watermark without replay, including when the new maximum is equal to or
  greater than the old watermark; empty history uses watermark 0.
- Runner token `◆`, 900ms, interpolated by route segment length; removed at
  900ms; always on `runnerPath`; connector color/weight never changes; tones:
  `next` muted, `pass` success, `fail` error, other faint.
- Exclude self-handoffs from the runner (static edge, no token, no crash);
  ensure back/forward label chips are off `runnerPath`.
- Replace old pulse/container-animation tests. Add tests for sweep period and
  wrap at widths 5, 6, 7, and 34; two-cell `━━`/base `─`/start/no-corner
  geometry; running-only gating; no color/layout changes; runner
  mount/new/multiple/reboot with new max equal or greater than old; self;
  watermark advance over non-handoff entries; earlier token cancellation;
  token removed at 900ms; always on `runnerPath`; no label-chip crossing;
  connector color/weight unchanged; tones; and static containers.
- Add an executable renderer proof at `dashboard/proof/motion.tsx` with
  client-Solid effects. It must assert a new handoff renders `◆`, a
  self-handoff renders no `◆`, and write the two motion captures.

## Validation condition

Containers never animate. Running cards preserve all color/contrast and only
the two-cell border sweep moves. A new handoff animates the correct edge once;
old history and epoch resets do not replay. Inactive/queued nodes are still.
Dashboard/engine suites pass, and the renderer proof passes: the handoff
capture contains `◆`, the self-handoff capture contains none.

## Out of scope

- History pane layout (ticket 012).
- Captures/docs (ticket 014).
- Reduced-motion preference.
- Run archive.

## Review gate

The reviewer must inspect motion code/tests and answer:

- Are containers fully static?
- Does the node sweep preserve color/contrast and layout?
- Is the runner watermark correct across mount, multiple handoffs, and reboot?
- Does the runner follow the actual route and avoid self-handoff/chip issues?
- Are old pulse tests replaced rather than passing stale behavior?
- Is `ActiveSweep` native and bounded, not a per-cell canvas path?
