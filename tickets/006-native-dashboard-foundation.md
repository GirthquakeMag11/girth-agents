# 006 — Native dashboard foundation

**Status:** passed (independent review, 2026-10-30)  
**Sequence:** 2 of 5  
**Depends on:** 005  
**Spec:** `DASHBOARD-SPEC.md`

## Context

The current graph-dashboard panel is a pre-rendered character canvas with
per-cell color spans. The specification requires native OpenTUI widgets and
theme surfaces. This ticket replaces the canvas foundation before any
workflow-container work is added.

## Work

- Create the tracked `dashboard/` package: `dashboard/src/` for the TUI
  entry and pure models, `dashboard/fixtures/`, and `dashboard/test/`. Make
  `.opencode/plugins/graph-dashboard` load that tracked package and remove
  the old ignored `tui.tsx`/`render.mjs`; do not edit only `.opencode`.
- Replace the character-canvas rendering path with native OpenTUI
  components in `dashboard/src/`.
- Add the layout shell: header, Outline, Graph, Details, Run console, and
  footer.
- Use the active OpenCode theme's semantic tokens for surfaces, text,
  borders, and accents. No hardcoded colors and no raw ANSI escapes.
- Label the panes **Outline**, **Graph**, and **Details**.
- Use `esc to close` in the header and footer.
- Render the configured nodes as native node cards and the configured
  handoffs as native connectors inside the Graph pane. Show all configured
  nodes once; do not key off only `workflows[0]`.
- Render every handoff label as a native chip attached to its connector
  with a tick/line. Do not omit labels, and do not float them in open
  space or enumerate edges in a detached list.
- Apply the A mapping for node state and handoff color. Inactive nodes are
  still and desaturated.
- Replace the state-string adapter: use `graph-map.runtime.active` and
  `graph-map.runtime.queue`, not the human-readable `Active:` / `Queue:`
  strings. Remove the `Dashboard.state` parsing field. Add a test that a
  human-readable state string cannot drive active or queue state.
- Keep the data adapter for graph config, `graph-info` (including
  `version`/`valid`), and active/queued `dispatch/status`.
- Delete `render.mjs` and remove `renderFrame`, `frame`, `segments`, and
  every equivalent coordinate-painted character rendering path. Do not
  leave it as dead code.
- Implement the native layout model from the spec: positioned native node
  cards and bounded native connectors. No precomputed character buffer and
  no coordinate-indexed style array.
- Add `dashboard/test/no-canvas.test.mjs`, run by
  `node --test dashboard/test/*.test.mjs`. It scans **`dashboard/src/` only**
  and fails on `renderFrame`, `canvas`, `styles[row][col]`, `paint`,
  `hline`, `vline`, a graph-level `box(` helper, a row-per-line string
  grid, or `render.mjs`.
- Implement the row-per-line grid pattern as a concrete scan (for example
  `Array.from`/`Array(W).fill` buffers, `canvas.map`, or `row.join("")`),
  and use a table-driven set of known-bad fixtures, one per pattern, to
  prove each scan fails. Known-bad fixtures live outside `dashboard/src/`
  and are excluded from the live scan.
- Header renders `graph-info.version` (displayed with a `v` prefix) and
  `graph-info.valid`; no literal version or validity values. The engine
  returns `1.3.0`; the header displays `v1.3.0`.
- Header content: graph identity, workflow/node counts, live/idle engine
  state, read-only, `esc to close`.
- Outline content: all workflows, all nodes, engagement/shared indicators,
  graph summary.
- Details content: helper, handoff resume behavior, objective/brief, output path, max
  visits, handoffs, all workflow memberships, run state, output.
- Run console content: active/queued dispatches, defects, cost/tokens,
  recent state; no dispatch controls.
- Footer content: active/queued/defect counts, elapsed, cost/tokens,
  read-only, `esc to close`.
- Node cards: id, state marker/state, compact helper cue. No node session labels.

## Validation condition

The panel is built from native OpenTUI components and theme tokens; the
static anti-canvas check passes; `render.mjs` is deleted; there is no
precomputed character buffer or per-cell tinting path. The Graph pane shows
every configured node once with native cards and connectors, and every
handoff label attached to its connector. The Header,
Outline, Details, Run console, Footer, and node-card content match the
content checklist. The panel opens at the available panel size without a
wrapped/broken frame and closes with `esc` to the same chat. An independent
reviewer inspects all rendering code and runs the check.

## Out of scope

- Workflow containers, queued/connected/escape rendering.
- Animation.
- Editing or dispatch controls.
- Changing the engine/config model.

## Review gate

Before ticket 007, the independent reviewer must read this ticket, the
specification, and the implementation diff, and explicitly answer:

- Is this native OpenTUI, or is any part still a character canvas?
- Does the static anti-canvas check pass, and is `render.mjs` gone?
- Are node cards and connectors native positioned components rather than a
  pre-rendered grid?
- Does the Graph show the configured graph rather than one workflow?
- Are the pane labels and `esc to close` correct?
- Does the panel load at the available size without accidental wrapping or
  clipping?
- Does it use structured runtime rather than parsing the state string?
- Does the header use `graph-info.version`/`valid` rather than literals?
- Does the anti-canvas check scan the live source root and all named
  patterns, with known-bad fixtures?
