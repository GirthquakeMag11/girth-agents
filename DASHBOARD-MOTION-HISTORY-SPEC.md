# Dashboard motion and activity history — post-v1.3 polish

**Status:** draft for review  
**Engine baseline:** v1.3.0  
**Supersedes:** the motion section, the right-side layout, and the running-node
acceptance criterion of `DASHBOARD-SPEC.md`. The rest of
`DASHBOARD-SPEC.md` — native-widget requirement, Graph, workflow
containers, active-only Details, Run console, footer, and `esc` — remains in
force.

## 1. Purpose

The dashboard already has native cards, connectors, workflow containers,
active-only Details, and a read-only Run console. Two things need to change:

1. Active-work motion currently changes contrast. Running node borders and
   surfaces pulse, and workflow containers pulse. That makes node
   text-to-card and card-to-background contrast move every frame. Containers
   must be static. Running-node motion must preserve color tone and
   readability.
2. The right column is one full-height Details pane. Details is already
   live-work-only and must stay that way. The lower right needs an
   engine-process-scoped activity timeline so the right side remains useful
   after a node finishes.

This slice is read-only and native. It adds no editing, dispatch controls,
node selection, or run archive.

## 2. Superseded text

This document replaces these parts of `DASHBOARD-SPEC.md`:

- the in-scope motion phrase in `DASHBOARD-SPEC.md` §1 (now revised there);
- the Motion section (the running-node/container pulse);
- the single full-height right-side Details layout;
- acceptance criterion 5 (“A running node pulses gently”).

Where the old document conflicts with this one, this document wins. The old
document’s other requirements remain. Existing tests that assert a pulse,
container border animation, or the old width-only responsive matrix must be
replaced; passing the old pulse tests is not acceptance.

## 3. Layout

```text
┌ Header ──────────────────────────────────────────────────────────┐
├ Outline ┬ Graph ─────────────────────────┬ Details ──────────────┤
│         │                                │ active work entries    │
│         │                                ├ History ──────────────┤
│         │                                │ activity timeline      │
├─────────┴────────────────────────────────┴───────────────────────┤
│ Run console                                                      │
├──────────────────────────────────────────────────────────────────┤
│ Footer: counts · elapsed · cost/tokens · read-only · esc          │
└──────────────────────────────────────────────────────────────────┘
```

Details is top-right, History is bottom-right. The Run console remains a
separate full-width region above the footer, with the same content, rows, and
height rules it has today.

## 4. Details

- Details contains one entry per active dispatch, in the display model’s
  active-list order. V1 exposes one active dispatch; the model must still
  accept a list for future parallel work.
- With no active dispatch, the Details pane body is empty. Only the pane
  title remains.
- Queued dispatches never create a Details entry. They remain visible in the
  Graph waiting container and the Run console.
- There is no idle/default Details node and no v1 node selection.
- Details content remains the literal node contract: helper, output target,
  max visits, visits, handoff labels and resume behavior, objective, all
  workflow memberships, run state, and written output.
- Membership states in Details are **active** or **inactive**. A queued
  workflow membership on the active node is inactive in Details because
  queued work is not a Details entry. Queue state is shown by the Graph
  waiting container and the Run console.
- Multiple active entries are separated by a thin native divider.

## 5. History

History is a **recent activity timeline**, not a list of past dispatch runs.

### 5.1 Scope and retention

- History is scoped to the **engine process and workspace**, not to an
  individual OpenCode panel session. All OpenCode sessions connected to the
  same engine see the same history.
- It resets when the engine restarts.
- The engine retains the newest 100 entries; entry 101 drops the oldest.
- `seq` is monotonic for the life of the engine process. It starts at 1 and
  is never reused within a boot.

### 5.2 Row grammar

Each History row is one line, newest first:

```text
HH:MM:SS  <dispatchId or —>  <event summary>
```

The event summary mapping is exact:

| Engine entry | Summary |
|---|---|
| `queued` with workflow | `queued · <workflow> · <node>` |
| `queued` without workflow | `queued · node <node>` |
| `dispatched` | `dispatched · <node>` |
| `step`, phase `begin` | `<node> · begin` |
| `step`, phase `end` | `<node> · end · <outcome or —> · <label or —>` |
| `handoff` | `<from> → <to> · <label>` |
| `completion`, status `completed` | `completed · <terminal or —>` |
| `completion`, status `cancelled` | `cancelled · <terminal or —>` |
| `defect` | `defect · <code or —>` |
| `reloaded` | `graph reloaded · valid` or `graph reloaded · invalid` |

Rules:

- Missing `dispatchId` displays `—`.
- Missing `node`, `from`, `to`, `label`, `outcome`, `terminal`, or `code`
  displays `—` in the summary.
- A dispatch defect emits one `defect` entry. The subsequent `completion`
  entry with status `defect` is suppressed so one dispatch termination is
  not shown twice.
- Engine-level defects with no `dispatchId` use the exact row
  `HH:MM:SS  —  defect · <code>` (two spaces between the timestamp, the
  dash, and the summary column).
- Completed and cancelled dispatches each get one completion row.
- Empty History displays exactly `No activity yet.`
- The one-line strip displays `History · <newest row>`; empty displays
  `History · No activity yet.`
- Rows may truncate deliberately. They never wrap accidentally.
- Rows may use static handoff/state colors. A new row does not flash, blink,
  or change the contrast of existing rows.

### 5.3 Timestamps

- Rows display local wall-clock time as `HH:MM:SS`, derived from `at`.
- The formatter is a pure helper with an optional fixed timezone for tests
  and captures; normal display uses the local timezone.
- Capture runs set `TZ=UTC` and use fixed fixture timestamps so captures are
  deterministic.

## 6. Engine runtime history

`graph-map.runtime.history` is a chronological array of the newest activity
entries, oldest to newest. It is the sole source for the History pane and the
connector-runner trigger.

### 6.1 Entry shape

Every entry is a **new object containing exactly these 15 keys**:

```js
{
  seq: 1,
  at: "2026-10-30T20:00:00.000Z",
  kind: "handoff",
  dispatchId: "d-1",
  workflow: "build-review",
  node: null,
  phase: null,
  outcome: null,
  label: "fail",
  from: "review",
  to: "implement",
  status: null,
  terminal: null,
  code: null,
  valid: null
}
```

Allowed `kind` values: `queued`, `dispatched`, `step`, `handoff`,
`completion`, `defect`, `reloaded`.

Fields not applicable to an event are `null`. `valid` is a boolean for
`reloaded` and `null` otherwise.

### 6.2 Projection rules

- History is an **allowlisted projection**, not a copy of the raw engine
  event or `lastEvent`.
- `at` is checked once at capture. If the raw event has an ISO `at`, use it;
  otherwise stamp the capture time.
- `workflow` is enriched from the dispatch record for dispatch events. It is
  `null` for engine-level defects and reloads, and for events whose record
  cannot be found.
- `step` end entries carry `outcome`, `label`, and no session id.
- `handoff` entries carry `from`, `to`, and `label`.
- `completion` entries carry `status`, `terminal`, and `code` from a defect
  when present. A completion with status `defect` is suppressed only when a
  dispatch defect entry was already recorded; an orphan defect completion is
  projected as a `defect` entry so the termination is not lost.
- `defect` entries carry `code` only; the human message is not copied.
- `reloaded` entries carry `valid` only.
- `queued`/`dispatched` carry `node` and `workflow` where available.
- Excluded events: `heartbeat`, `ready`, `version`, `paused`, `resumed`, and
  every other non-activity event.
- Never copy any of these into history: prompt, output content, file content,
  session id, upstream path, session mode, usage, token counts, defect
  message, reload faults, config path.

A key-allowlist test must prove every entry has exactly the 15 keys above and
no forbidden keys.

### 6.3 Ring behavior

- `runtime.historyEpoch` is a string unique to each engine boot and is
  exposed alongside the array. It is not one of the 15 entry keys.
- `runtime.history` is the newest 100 entries, oldest to newest.
- `lastEvent` and `lastDefect` remain for compatibility.
- The dashboard adapter reads `runtime.history` as an array and defaults to
  `[]` when it is absent or malformed. It passes `runtime.historyEpoch`
  through and defaults it to an empty string on older engines.
- History is not written to the workspace or database.

## 7. Motion

### 7.1 Workflow containers

Workflow containers are completely static. Their border, title, label, and
ticks do not pulse, blink, fade, or move. This applies to active main,
connected, and queued waiting containers. Color still conveys state; motion
does not.

### 7.2 Active node border sweep

The running node card is static in color and layout:

- Border color, background color, title, helper text, state marker, and all
  card content remain fixed.
- No surface brightness or text contrast changes.

Motion is a two-cell heavy horizontal segment traveling along the top border
of the running card:

- Segment cells use the node’s running accent hue and the `━━` heavy-line
  glyphs. The base border remains `─`. This is a shape/weight cue, not a
  color pulse.
- The segment is one row high and occupies the top border row of the card.
- The segment starts at `card.x + 1`, moves right one cell at a time, and
  wraps. It never extends into the rounded corners.
- Exact timing: 250ms per cell. The loop period is
  `250 * max(1, card.width - 3)`ms. Offset is
  `floor(elapsedMs / 250) % max(1, card.width - 3)`. For a 34-cell card this
  is 31 positions and a 7750ms loop.
- It is a bounded native positioned component/segment. It is not a
  precomputed character buffer or per-cell style grid.
- It stops immediately when the node is no longer running. Queued, idle, and
  terminal nodes have no sweep.
- It never changes card width, height, padding, text, or position.
- If the card is narrower than 6 cells, no sweep is drawn.

With multiple active dispatches in the future, each running node may have its
own sweep; v1 has one active dispatch.

### 7.3 Connector runner

Links are otherwise static. When a **new handoff entry** appears in
`runtime.history`, a small accent token travels along the actual connector
from the handoff’s `from` node to its `to` node.

#### Trigger and replay

`runtime.historyEpoch` is a string unique to each engine boot, outside the
15-key history entries. It is the reboot watermark.

- At mount, store `epoch = runtime.historyEpoch` and
  `watermark = max(seq)`, or 0 for empty history. Do not animate existing
  entries.
- On every update, if `runtime.historyEpoch !== epoch`, set `epoch` to the
  new value and `watermark = max(seq)` (0 if empty), then animate nothing.
  This covers a reboot whose new maximum is greater than or equal to the old
  watermark.
- Otherwise, find entries with `kind === "handoff"` and `seq > watermark`.
- If none, no animation.
- If one, animate it once.
- If several, animate only the highest `seq`; cancel any earlier token and
  replace it.
- Advance `watermark` to the maximum `seq` in the new history, including
  non-handoff entries.
- If the history is truncated but seq remains monotonic and the epoch is
  unchanged, behavior is unchanged.

#### Geometry and style

- Every layout route exposes an ordered `runnerPath`: points from the source
  card edge to the target card edge, including corners.
- The runner interpolates along `runnerPath` by segment length.
- Self-handoffs are legal but excluded from the runner: they render the
  static edge only, because their route has no distinct source/target
  traversal and their label sits on the route row. A self-handoff must not
  produce a token or crash.
- Back and forward routes put the label chip beside the lane, not on the
  runner path; the token follows the line cells only.
- Token glyph is one cell, `◆`.
- Token duration is 900ms. It is removed at the end.
- The token stays on the route; it does not cut across the graph.
- The token uses the handoff label color:
  - `next` → `theme.text.muted`
  - `pass` → `theme.text.feedback.success.base`
  - `fail` → `theme.text.feedback.error.base`
  - any other label → `theme.text.faint`
- The connector itself does not change color or weight.
- The token does not overlay label chips; it follows the line path only.
- It does not change layout.
- The first active node is not reached by a handoff entry when the dispatch
  starts, so it gets only the border sweep.

## 8. Responsive behavior

### 8.1 Mode flags

Supported minimum size is **60×20**. Below that, the panel may clip but must
not crash; History is guaranteed only at 60×20 and above.

- `split = width >= 120 && height >= 36`
- `detailsPane = split`
- `historyPane = split`
- `showOutline = width >= 90`
- `detailsStrip = !split && width >= 90`
- `historyStrip = !split`
- History is never hidden at a supported size.

### 8.2 Widths

- Outline width: 26 at width ≥160; 22 at 120–159; 20 at 90–119; hidden below
  90.
- Details width in split mode: 42 at width ≥160; 34 at 120–159.
- History width equals the right-column width in split mode.
- Graph content width is:
  `width - 2 (outer padding) - gaps - outlineWidth - detailsWidth - 4
  (Graph border and padding)`, where `gaps` is the number of horizontal
  gaps between body columns: one less than the number of visible body
  columns (Outline, Graph, right column; Graph always counts). Split mode
  uses 2 gaps, Outline+Graph strip uses 1, Graph-only uses 0.
- Expected graph content widths: 160×50 84; 120×40 56; 120×36 56;
  120×35 91; 160×30 127; 119×50 92; 100×30 73; 90×24 63; 80×24 74;
  60×20 54.

### 8.3 Height split

For split mode, let `H` be the available right-column pane height after the
body padding (the same area the current Details pane occupies).

- Reserve one row for the gap between Details and History.
- `historyHeight = max(8, floor((H - 1) * 0.4))`
- `detailsHeight = H - 1 - historyHeight`
- Both panes include their native borders.
- Split is used only when `width >= 120 && height >= 36`.
- At the 120×36 boundary, H=24: History 9 rows, Details 14 rows.
- At 120×35, H=23, so the layout uses the strip mode.
- At 120×40, H=28: History 10 rows, Details 17 rows.
- At 160×50, H=37: History 14 rows, Details 22 rows.

### 8.4 Vertical stack

Split mode:

```text
Header -> body [Outline, Graph, right column{Details, History}] -> Run console -> Footer
```

Strip mode:

```text
Header -> DetailsStrip (width >= 90 only) -> body [Outline?, Graph]
       -> HistoryStrip -> Run console -> Footer
```

- `DetailsStrip` is the existing compact strip: height 2, including its
  bottom border, one content row. It contains the first active entry’s node,
  state, helper, and memberships; if idle it contains only the `Details`
  label.
- `HistoryStrip` is exactly one row high, no border, and sits above the Run
  console. It shows the newest event only.
- In strip mode the Graph keeps the remaining body height. History consumes
  body height only.

### 8.5 Run console

The Run console is unchanged. Its heights remain:

- height > 40 → 8 rows
- 30–40 → 7 rows
- 24–29 → 6 rows
- below 24 → 3 rows

Its content and controls are unchanged. History never takes rows from it.

### 8.6 Size matrix

| Size | Outline | Details | History | Run console |
|---|---|---|---|---|
| 160×50 | 26 | split, 22 rows | split, 14 rows | 8 |
| 120×40 | 22 | split, 17 rows | split, 10 rows | 7 |
| 120×36 | 22 | split, 14 rows | split, 9 rows | 7 |
| 120×35 | 22 | strip, 2 rows | strip, 1 row | 7 |
| 160×30 | 26 | strip, 2 rows | strip, 1 row | 7 |
| 119×50 | 20 | strip, 2 rows | strip, 1 row | 8 |
| 100×30 | 20 | strip, 2 rows | strip, 1 row | 7 |
| 90×24 | 20 | strip, 2 rows | strip, 1 row | 6 |
| 80×24 | hidden | hidden | strip, 1 row | 6 |
| 60×20 | hidden | hidden | strip, 1 row | 3 |

No accidental wrapping. Long History rows truncate. The Graph remains the
primary readable pane. The header and footer stay fixed.

## 9. Component and data contract

- Engine: add the bounded `runtime.history` projection and tests.
- Dashboard adapter: pass `runtime.history` and `runtime.historyEpoch`
  through; never derive either from the human-readable state string.
- `HistoryPane`: native scrollable rows, newest first, static tones.
- `HistoryStrip`: one-line newest-event strip for collapsed layouts.
- `ActiveSweep`: native two-cell moving top-border segment, driven by a pure
  offset function.
- `ConnectorRunner`: one native token following `runnerPath`, driven by the
  history watermark.
- `responsiveLayout`: returns the mode flags, outline/details widths, split
  heights, strip heights, and unchanged console height.
- `details`: active-work only; queued membership is inactive.
- `RunConsole`: unchanged.

## 10. Required tests and evidence

### 10.1 Engine

- History allowlist: exactly 15 keys (`seq`, `at`, `kind`, `dispatchId`,
  `workflow`, `node`, `phase`, `outcome`, `label`, `from`, `to`, `status`,
  `terminal`, `code`, `valid`), no forbidden keys (`sessionId`,
  `upstream`, `sessionMode`, `usage`, `message`, `faults`, `configPath`,
  `prompt`, output/file contents).
- Event kinds and projection: queued (workflow and node dispatch), dispatched,
  step begin/end, handoff, completion completed/cancelled, defect,
  reloaded valid/invalid.
- `workflow` enrichment and `null` fallback.
- `at` stamped for events without one.
- Dispatch defect emits one defect row and suppresses the duplicate
  completion status `defect`.
- Ring cap 100, order oldest→newest, monotonic `seq` starting at 1.
- `lastEvent`/`lastDefect` compatibility.
- `historyEpoch` is a non-empty string, differs across two engine boots, and
  `runtime.history` and `seq` reset on boot.
- `paused`/`resumed`/heartbeat/ready/version are excluded.

### 10.2 Dashboard

- Adapter passes history and historyEpoch through; malformed/missing history
  defaults to `[]`, missing epoch defaults to `""`.
- History row grammar for every kind/status, including missing dispatch id,
  terminal, label, and workflow.
- Empty pane and strip strings.
- Details: idle empty, active entry, queued membership inactive, no idle
  default.
- Static containers: no pulse/transition on container borders, ticks, or
  labels.
- Sweep: pure offset for widths; only running nodes; no border/background/
  text color change; no layout movement.
- Runner watermark: existing history on mount does not animate; one new
  handoff animates once; two new handoffs animate only the highest; an epoch
  change with a new maximum greater than or equal to the old watermark does
  not replay; empty history uses watermark 0.
- Old width-only responsive matrix tests are replaced by height-aware
  boundary tests.
- Runner path: stays on `runnerPath`; correct tone mapping for `next`,
  `pass`, `fail`, other; label chips are not crossed.
- A self-handoff renders the static edge, produces no `◆` token, and does
  not crash; back/forward label chips remain off `runnerPath`.
- Inserting a new History row does not change the tone or contrast of
  existing rows.
- Responsive boundaries: 120×36 vs 120×35, 160×30, 119×50, 90×24, 80×24,
  60×20; flags, widths, split heights, strip heights, unchanged console
  heights.
- No accidental wrapping; explicit wrap policy; anti-canvas check remains
  green.
- Old pulse/container-animation tests and the old width-only responsive
  matrix tests are removed/replaced, not merely passing.

### 10.3 Captures

Captures must come from the real `DashboardView`, freeze `Date.now` at the
snapshot's `fetchedAt`, use fixed active `startedAt` and fixed
`runtime.history` fixtures with fixed `at`/`seq`, and set `TZ=UTC` so History,
Details elapsed, and footer/Run console updated values are deterministic:

1. `160x50` active: populated History + live Details.
2. `160x50` idle: populated History + empty Details.
3. `120x40` active: split layout.
4. `80x24`: one-line History strip.

The proof harness must not use live wall-clock timestamps for History rows,
Details elapsed, or the updated fields.

## 11. Acceptance criteria

1. Workflow containers are completely static during active and queued work.
2. Running node cards preserve border color, background color, text color,
   and layout. Only the two-cell top-border sweep moves.
3. The connector runner animates the actual handoff edge once, on a new
   handoff entry, and does not replay history at mount or after a seq reset.
4. Inactive and queued nodes are still; queued containers are static.
5. The right column splits into Details and History at 160×50, 120×40, and
   the 120×36 boundary.
6. History is a newest-first activity timeline with the specified row
   grammar, engine-process/workspace scope, 100-entry cap, and structured
   `runtime.history`.
7. History collapses to a one-line strip at 120×35, 119×50, 100×30, 90×24,
   80×24, and 60×20; it is not hidden at supported sizes.
8. Run console content, rows, and responsive heights are unchanged.
9. Details is active-work-only, empty idle, with queued membership inactive.
10. `runtime.history` contains exactly the allowlisted fields and no prompts,
    outputs, session ids, tokens, messages, faults, or file contents.
11. All old pulse/container-animation tests and the old width-only responsive
    matrix tests are replaced; engine/dashboard suites pass; anti-canvas
    check is green.
12. Responsive tests cover the boundary matrix and assert no accidental
    wrapping.
13. The real `DashboardView` captures the four required states above.
14. `ROADMAP.md` retargets O1.2 “Dispatch history and tracing” to a
    post-v1.3 section as the run archive, distinguishes it from the activity
    ring, and records the current motion/history slice as the active dashboard
    work.

## 12. Out of scope

- Run archive / completed-dispatch list (ROADMAP O1.2).
- Persisted activity history across engine restarts.
- Per-OpenCode-session history filtering.
- Node selection or pointer/keyboard browsing.
- Dispatch controls, editing, or scoped chat.
- Parallel workflow execution beyond the display model.
- Reduced-motion preference (later).

## 13. Review gate

The independent spec reviewer must confirm:

- The old pulse contract is explicitly superseded and old tests are replaced.
- Details is already live-work-only and this spec does not reintroduce idle
  focus.
- History is an allowlisted 15-key projection with exact row grammar and
  deduplication.
- The connector runner watermark is testable and never replays.
- Responsive flags, thresholds, split formula, strip stack, and unchanged
  console heights are exact.
- The capture set freezes all clocks and the roadmap reconciliation retargets
  O1.2 to post-v1.3.
- `runtime.historyEpoch` is part of the data contract and the reboot test
  covers a new maximum greater than or equal to the old watermark.
