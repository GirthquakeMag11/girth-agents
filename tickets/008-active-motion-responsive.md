# 008 — Active motion and responsive polish

**Status:** passed (independent review, 2026-10-30)  
**Sequence:** 4 of 5  
**Depends on:** 007  
**Spec:** `DASHBOARD-SPEC.md`

## Context

The dashboard should make active work visually lead without becoming
distracting, and it must remain usable as the terminal size changes.

## Work

- Add the default gentle pulse for running nodes and active workflow
  containers.
- Keep inactive nodes, inactive workflows, and queued nodes still; no
  animation.
- Ensure the pulse does not change layout, move text, or delay state
  updates.
- Add responsive behavior: collapse Details and/or Outline before the
  Graph becomes unreadable; keep the header/footer fixed.
- Verify the exact size matrix: 160×50, 120×40, 100×30, 80×24, 60×20.
- No accidental row wrapping. Deliberate clipping or scrolling of secondary
  content is allowed at the smaller sizes; the Graph and header/footer must
  remain readable.
- Confirm `esc` still closes to the same chat/session/agent.

## Validation condition

Reviewer-verified behavior at 160×50, 120×40, 100×30, 80×24, and 60×20
shows the specified collapse behavior, no accidental row wrapping, a
readable Graph and header/footer, and a subtle pulse only on running
content. Inactive and queued content remains still. Deliberate clipping or
scrolling of secondary content is allowed and recorded.

## Out of scope

- Changing workflow engagement semantics.
- Editing or dispatch controls.
- A new layout engine for arbitrarily large graphs.

## Review gate

Before ticket 009, the independent reviewer must check motion, inactive and
queued stillness, the exact size matrix, and the absence of accidental
wrapping, and must call out any return to character-canvas thinking.
