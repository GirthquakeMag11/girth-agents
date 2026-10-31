# 003 — Draw the 120×40 dashboard frame

**Status:** superseded by `DASHBOARD-SPEC.md` and tickets 005–009  
**Sequence:** 3 of 4  
**Depends on:** 002

## Context

The user found the three-column dashboard frame directionally appealing. The
first version is a read-only understanding surface: structure, behavior, and
state in one frame.

## Work

Post one fenced `text` frame in chat. Do not create HTML, PNG, or any other
artifact.

### Size and layout

- 120 columns × 40 rows.
- Top bar with graph identity, active workflow, `valid`, engine state,
  `v1.2.0`, `read-only`, and `esc close`.
- Left sidebar: `Graph`, `workflows`, `build-review`, `nodes`, `implement`,
  `review`, `done`.
- Center: `Canvas / Table`, top-down `implement → review → done`, edges
  `next`, `pass`, and `fail ↺`, state markers, session modes, visit counts.
- Right inspector: selected `review`, with `Contract`, `Brief`, `Run`, and
  `Output`.
- Bottom run console: read-only active dispatch, queue, cost/tokens, and event
  log. No start-node selector, prompt field, or `[Dispatch]` control.
- No product/agent tabs and no scoped chat.

### State snapshot

- `implement` running at visit 1/20, session resume.
- `review` queued at visit 0/20, session fresh.
- `done` idle/terminal.
- Active dispatch `d-7`; queued dispatch `d-8`; illustrative cost and tokens.
- The live/queue area is a list, not a single slot.

### Presentation

- Unicode box drawing and `●` running, `◌` queued, `○` idle, `■` terminal,
  `↻` resume, `✦` fresh.
- Every state also has a text label; no color and no ANSI escapes.
- A short caption below the frame: 80×24 collapse behavior, and the note that
  the exact OpenCode panel/keybinding API is a separate implementation check.

## Validation condition

The posted frame has 40 rows and no line wider than 120 columns, contains every
required region and label above, contains none of the forbidden controls
`[Validate]`, `[Apply]`, `[Run]`, `[Dispatch]`, `start node`, `prompt`,
`Product`, `Agent tabs`, or `scoped chat`, and uses only the inventory from
ticket 002.

## Out of scope

- Implementation, TUI code, or engine changes.
- A second layout variant.
- A full 80×24 frame.
- Files, images, or browser rendering.
