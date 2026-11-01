# Graph dashboard — TUI specification

**Status:** living implementation specification.  
**Version:** 2 — merged motion and activity history.  
**Related:** `SPEC.md` (engine contract), `THREADS.md` (design record).

## 1. Purpose and principles

The dashboard is a full-screen, read-only OpenCode TUI view of the graph as
configured and as it is currently behaving. It opens over the current session;
`esc` returns to the same chat, session, and agent.

- **The graph is the subject.** Show all configured nodes, handoffs, and
  workflow memberships. Do not privilege the first workflow.
- **Structure and behavior share one view.** Nodes and edges show the
  configuration; state, work, and engagement show what is happening now.
- **Native widgets.** Use OpenTUI components and semantic theme tokens. A
  pre-rendered character grid with per-cell colors is not acceptable.
- **Read-only by construction.** The dashboard cannot edit the graph, dispatch
  work, cancel work, or change the session.
- **No context switch.** Opening and closing the panel does not change the chat,
  session, or agent.

## 2. Scope

In scope:

- full-screen `session.panel` opened from the palette or a key binding;
- configured nodes, handoffs, workflows, connections, and strict policy;
- active and queued dispatches, visits, sessions, cost, tokens, defects, and
  recent state;
- main/connected/queued workflow engagement and escape indication;
- active-work Details, empty when no work is active;
- a bounded activity History pane or one-line strip;
- static workflow containers, a running-node border sweep, and a one-shot
  connector runner;
- responsive layout from the panel dimensions.

Out of scope:

- editing, draft/apply, dispatch controls, or scoped chat;
- a table-only primary graph view;
- multiple graphs or a graph selector;
- a general graph-layout engine for arbitrarily large graphs;
- run archive, persisted history, or per-session history filtering;
- reduced-motion preference.

## 3. Surface and interaction

- **Surface:** OpenCode TUI `session.panel`, opened with
  `presentation: "fullscreen"`.
- **Open:** command palette entry and/or key combination.
- **Close:** `esc` closes the panel and returns to the same chat, session, and
  agent.
- **Refresh:** structure refreshes after a valid graph reload; runtime state
  refreshes while the panel is open.
- **Focus:** read-only. Node selection may be added later only with an explicit
  visible focus ring; v1 has no node selection.
- **Chrome:** native flex layout. Text truncates or collapses deliberately at
  narrow sizes; it must not wrap into a broken frame.

## 4. State model

### 4.1 Graph and workflows

There is one graph per engine configuration. A workflow is a labelled view of
a subset of the graph, not a container. A node dispatch has no workflow
boundary. A workflow dispatch defines a boundary consisting of the main
workflow and its transitive `connections`. A node may belong to zero, one, or
many workflows.

### 4.2 Dispatch intent

- A **workflow dispatch** starts at the workflow entry and records that
  workflow as the **main workflow**.
- A **node dispatch** starts at a named node and records no workflow.
- Exactly one of `node` or `workflow` is supplied.

### 4.3 Engaged workflows

For a workflow dispatch, the **allowed set** is the main workflow plus every
workflow reachable through transitive `connections`.

- The **main workflow** is engaged for the dispatch lifetime, including queued
  time and handoffs.
- A **connected workflow** is engaged only while the active node belongs to it.
- If the active node is in the main workflow, main takes precedence and
  connected containers are suppressed.
- If the active node leaves main and every allowed connected workflow, the
  dispatch has **escaped**.
- If main is `strict: true`, a handoff outside the allowed set is an engine
  `workflow.escape` defect. Otherwise it is allowed and shown as an escape.

A node dispatch never engages a workflow and never draws a workflow container.
A queued workflow dispatch shows its main container in queued style; no
connected container appears until an active node enters one.

### 4.4 Shared nodes

Draw a node once. The Graph shows only engaged containers and only the engaged
workflow context for a node. Details lists all of the active node's workflow
memberships.

### 4.5 Details and plural active work

- The display model accepts a list of active dispatches even though the v1
  engine runs one at a time.
- Details shows one entry per active dispatch, in active-list order.
- With no active dispatch, the Details body is empty; only the pane title
  remains. Queued work is shown by waiting containers and the Run console.
- v1 has no node-selection keybinding and no idle/default Details node.

### 4.6 Canonical fixtures

The pure engagement model must be tested against this display fixture:

| Workflow | Entry | Exit | Nodes | Connections | Strict |
|---|---|---|---|---|---|
| A (main) | a1 | a2 | a1, a2, x, z | B, C | false |
| B (connected) | x | y | x, y | C | false |
| C (connected) | y | o2 | y, o2 | none | false |
| D (unconnected) | d1 | d1 | d1 | none | false |

Shared nodes: `x` is in A+B; `y` is in B+C. Node `z` is A only; `o` belongs to
no workflow; `d1` is D only.

| Case | Containers | Details entries |
|---|---|---|
| Node dispatch at `x` | none | empty |
| Workflow A queued at `a1` | A, queued | empty |
| A active at `z` | A | `z`: A active |
| A active at `x` | A only | `x`: A active; B inactive |
| A active at `y` | A, B, C | `y`: B and C active |
| A active at `o` | A plus escape | `o`: no active memberships |
| A active at `d1` | A plus escape | `d1`: D inactive |
| Two active: A at `z`, B at `y` | A and B, offset/overlapping, no duplicate nodes | `z`: A active; `y`: B active, C inactive |

The strict fixture makes A `strict: true`: a handoff to `o` or `d1` is an
engine `workflow.escape` defect. The layout crossing fixture has workflow E
(`e1,e3`) interleaved with F (`e2,e4`); a closed container must not claim a
non-member. Use rails/brackets or a contiguous-layout guarantee.

The display fixture is a model fixture, not a runnable engine config. Runnable
boundary fixtures are `dashboard/fixtures/live-boundary.json` and
`dashboard/fixtures/live-boundary-strict.json`.

## 5. Layout

```text
┌─ Header ──────────────────────────────────────────────────────────────┐
│ graph identity · workflow state · validity · engine state · version   │
├─ Outline ───────┬─ Graph ──────────────────────────────┬─ Details ────┤
│ workflows       │ nodes, links, workflow containers    │ active work  │
│ nodes           │                                       ├─ History ────┤
│ engagement      │                                       │ activity     │
│ state           │                                       │ timeline     │
│ graph summary   │                                       │              │
├─────────────────┴───────────────────────────────────────┴──────────────┤
│ Run console / recent state                                             │
├────────────────────────────────────────────────────────────────────────┤
│ counts · elapsed · cost/tokens · read-only · esc to close              │
└────────────────────────────────────────────────────────────────────────┘
```

- **Header:** graph identity, workflow/node counts, validity, live/idle state,
  version, `read-only`, `esc to close`.
- **Outline:** all workflows and nodes, engagement/state badges, shared-node
  indicators, graph summary.
- **Graph:** configured graph; native node cards, connectors, and engaged
  workflow containers. Labelled **Graph**.
- **Details:** one entry per active dispatch: graph agent, handoff resume
  behavior, objective/brief, output, max visits, handoffs, workflow
  memberships, run state, output path. Empty when idle.
- **History:** newest-first recent activity for the engine process. Split mode
  gives it a pane under Details; collapsed modes use a one-line strip.
- **Run console:** read-only active/queued work, cost, tokens, defects, recent
  state. No start-node selector, prompt field, or dispatch control.
- **Footer:** active/queued/defect counts, elapsed, cost/tokens, `read-only`,
  `esc to close`.

Details is top-right and History is bottom-right. The Run console remains a
separate full-width region above the footer.

## 6. Visual system

### 6.1 Theme and mapping

All colors come from the active OpenCode theme. No hardcoded hex colors, raw
ANSI, or unthemed default text.

- **Node state:** running, queued, idle, terminal.
- **Emphasis:** active nodes are bright; inactive nodes are still and
  desaturated.
- **Handoff edges:** `next` neutral; `pass` success; `fail` error; other labels
  neutral/muted.
- **Containers:** categorical theme hue per workflow; main is visually primary;
  queued main uses warning.
- **Details:** active entry and active containers use accent/categorical
  emphasis.
- **Escape:** small warning on the active node and a Details explanation.
- **Membership:** quiet badges; Graph does not list every membership; Details
  carries the full list.

Icons and labels reinforce color; meaning must not depend on color alone.

### 6.2 Node cards

A native bordered card shows node id, state marker/label, and a compact
graph-agent cue where space allows. Contract details move to Details. Inactive
cards use muted/faint tokens; active cards use state color and a raised surface.

### 6.3 Links

Native connectors with clean corners and arrows. Every handoff label is a
small native chip attached to its connector; labels are not omitted or left
floating. Chip and connector use the handoff color. A return handoff with
`resume: true` carries a resume marker on its chip and in Details; there is no
free-standing node `resume`/`fresh` label. Cross-workflow movement is visible
through containers and node positions, not extra prose.

`$dispatcher` is a completion target, not a graph node. It is shown in the
node contract, result, and history, and is intentionally excluded from the
connector layout so it cannot create a phantom node or route.

### 6.4 Workflow containers

- Main workflow: always present for a workflow dispatch; active or queued.
- Connected workflow: present only while the active node is inside it, and
  only when main precedence does not suppress it.
- Inactive workflows: no container.
- Thin native border and compact label.
- Overlapping/shared workflows use nested/offset containers or rails with
  distinct categorical colors. Never duplicate a shared node.
- A node dispatch draws no container.

### 6.5 Details

Each details entry is an active dispatch. List all workflow memberships,
active first; active memberships are saturated in the workflow color, inactive
memberships muted. Contract, objective, run state, and output are literal and
readable. With no active dispatch, the pane body is empty. Multiple active
entries are separated by a thin native divider.

## 7. Motion

### 7.1 Containers

Workflow containers are completely static. Their border, title, label, and
ticks never pulse, blink, fade, or move. Color conveys state; motion does not.

### 7.2 Running-node border sweep

The running card's border color, background, title, graph-agent text, state
marker, content, and layout remain fixed. Motion is a two-cell heavy horizontal
segment (`━━`) traveling along the top border:

- one row high, on the top border, starting at `card.x + 1`;
- moves right one cell at a time and wraps; never enters the rounded corners;
- 250ms per cell; period `250 * max(1, card.width - 3)`ms; offset
  `floor(elapsedMs / 250) % max(1, card.width - 3)`;
- for a 34-cell card: 31 positions, 7750ms loop;
- bounded native positioned component/segment, not a character buffer or
  per-cell style grid;
- stops immediately when the node is no longer running; queued, idle, and
  terminal nodes have no sweep;
- never changes card width, height, padding, text, or position;
- no sweep below 6 cells.

With multiple active dispatches, each running node may have its own sweep.

### 7.3 Connector runner

When a new `handoff` entry appears in `runtime.history`, one accent token
travels along the actual connector from its `from` node to its `to` node.

**Trigger:** on mount, store `historyEpoch` and the maximum `seq` (or 0); do
not animate existing entries. If the epoch changes, reset the watermark and
animate nothing. Otherwise animate entries with `kind === "handoff"` and
`seq > watermark`: one new handoff animates once; several animate only the
highest `seq`, replacing earlier tokens. Advance the watermark to the maximum
`seq` in the new history. A truncated but monotonic history with the same epoch
behaves unchanged.

**Geometry:** each layout route exposes an ordered `runnerPath` from source
card edge to target card edge, including corners. Interpolate by segment
length. Self-handoffs are legal but produce no token and do not crash. Back and
forward label chips stay off the path; the token follows line cells only.

**Style:** one-cell `◆`; 900ms; removed at end; stays on the route; does not
overlay label chips; does not change layout. Token color by handoff label:
`next` muted, `pass` success, `fail` error, other faint. The connector itself
does not change color or weight. The first active node gets only the border
sweep, not a handoff token.

## 8. History

History is a recent activity timeline, not a run archive.

### 8.1 Scope and retention

- Scoped to the engine process and workspace, shared by all OpenCode sessions
  connected to that engine.
- Resets when the engine restarts.
- Newest 100 entries; entry 101 drops the oldest.
- `seq` is monotonic for the engine boot, starts at 1, and is never reused.

### 8.2 Row grammar

Each row is one line, newest first:

```text
HH:MM:SS  <dispatchId or —>  <event summary>
```

| Engine entry | Summary |
|---|---|
| `queued` with workflow | `queued · <workflow> · <node>` |
| `queued` without workflow | `queued · node <node>` |
| `dispatched` | `dispatched · <node>` |
| `step`, phase `begin` | `<node> · begin` |
| `step`, phase `end` | `<node> · end · <outcome or —> · <label or —>` |
| `handoff` | `<from> → <to> · <label>` |
| `completion`, `completed` | `completed · <terminal or —>` |
| `completion`, `cancelled` | `cancelled · <terminal or —>` |
| `defect` | `defect · <code or —>` |
| `reloaded` | `graph reloaded · valid` or `graph reloaded · invalid` |

Rules:

- Missing `dispatchId` displays `—`.
- Missing `node`, `from`, `to`, `label`, `outcome`, `terminal`, or `code`
  displays `—`.
- A dispatch defect emits one `defect` row; the following `completion` with
  status `defect` is suppressed. An orphan defect completion is projected as
  a `defect` row.
- Engine-level defects with no `dispatchId` use
  `HH:MM:SS  —  defect · <code>`.
- Completed and cancelled dispatches get one completion row.
- Empty History displays exactly `No activity yet.`
- The strip displays `History · <newest row>`; empty displays
  `History · No activity yet.`
- Rows may truncate deliberately; they never wrap accidentally.
- Rows may use static handoff/state colors. New rows do not flash, blink, or
  change existing contrast.

### 8.3 Timestamps

Display local wall-clock `HH:MM:SS` from `at`. The formatter is pure with an
optional fixed timezone for tests/captures; normal display uses local time.
Capture runs set `TZ=UTC` and fixed fixture timestamps.

### 8.4 Engine runtime history

`graph-map.runtime.history` is a chronological array, oldest to newest, and is
the sole source for History and the connector runner.

Every entry is a new object with exactly these 15 keys:

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
`completion`, `defect`, `reloaded`. Fields not applicable are `null`; `valid`
is boolean for `reloaded` and `null` otherwise.

Projection rules:

- History is an allowlisted projection, not a copy of a raw event or
  `lastEvent`.
- `at`: use the raw ISO `at`, else stamp capture time.
- `workflow`: enrich from the dispatch record; `null` for engine-level
  defects/reloads or unknown records.
- `step` end carries `outcome`, `label`, no session id.
- `handoff` carries `from`, `to`, `label`.
- `completion` carries `status`, `terminal`, and a defect `code` when present.
  A `defect` completion is suppressed only when a dispatch defect was already
  recorded; an orphan is projected as `defect`.
- `defect` carries `code` only; no message.
- `reloaded` carries `valid` only.
- `queued`/`dispatched` carry `node` and `workflow` where available.
- Exclude `heartbeat`, `ready`, `version`, `paused`, `resumed`, and every
  non-activity event.
- Never copy prompt, output/file content, session id, upstream path, session
  mode, usage, tokens, defect message, reload faults, or config path.

`runtime.historyEpoch` is a unique string per engine boot, outside the 15
entry keys. `runtime.history` is the newest 100 entries. `lastEvent` and
`lastDefect` remain for compatibility. The dashboard adapter defaults missing
or malformed history to `[]`, passes the epoch through, and defaults a missing
epoch to `""`. History is not written to disk.

## 9. Responsive behavior

Supported minimum is **60×20**. Below that the panel may clip but must not
crash; History is guaranteed at 60×20 and above.

Mode flags:

- `split = width >= 120 && height >= 36`
- `detailsPane = split`
- `historyPane = split`
- `showOutline = width >= 90`
- `detailsStrip = !split && width >= 90`
- `historyStrip = !split`
- History is never hidden at a supported size.

Widths:

- Outline: 26 at ≥160; 22 at 120–159; 20 at 90–119; hidden below 90.
- Details in split: 42 at ≥160; 34 at 120–159.
- History width equals the right-column width in split.
- Graph width:
  `width - 2 - gaps - outlineWidth - detailsWidth - 4`, where `gaps` is one
  less than the number of visible body columns and Graph always counts.
- Expected graph widths: 160×50 84; 120×40 56; 120×36 56; 120×35 91;
  160×30 127; 119×50 92; 100×30 73; 90×24 63; 80×24 74; 60×20 54.

Height split (split mode): let `H` be the available right-column pane height
after body padding.

- reserve one row between Details and History;
- `historyHeight = max(8, floor((H - 1) * 0.4))`;
- `detailsHeight = H - 1 - historyHeight`;
- both include native borders;
- at 120×36, H=24: History 9, Details 14;
- at 120×35, H=23: strip mode;
- at 120×40, H=28: History 10, Details 17;
- at 160×50, H=37: History 14, Details 22.

Stack:

```text
split:  Header -> body [Outline, Graph, right column{Details, History}] -> Run console -> Footer
strip:  Header -> DetailsStrip (width >= 90 only) -> body [Outline?, Graph]
        -> HistoryStrip -> Run console -> Footer
```

- `DetailsStrip`: height 2 including bottom border, one content row; first
  active entry's node, state, graph agent, and memberships; idle shows only
  the `Details` label.
- `HistoryStrip`: exactly one row, no border, above the Run console; newest
  event only.
- In strip mode the Graph keeps the remaining body height. History takes body
  height only.

Run console heights: >40 → 8 rows; 30–40 → 7; 24–29 → 6; below 24 → 3. History
never takes rows from it.

Size matrix:

| Size | Outline | Details | History | Run console |
|---|---|---|---|---|
| 160×50 | 26 | split, 22 | split, 14 | 8 |
| 120×40 | 22 | split, 17 | split, 10 | 7 |
| 120×36 | 22 | split, 14 | split, 9 | 7 |
| 120×35 | 22 | strip, 2 | strip, 1 | 7 |
| 160×30 | 26 | strip, 2 | strip, 1 | 7 |
| 119×50 | 20 | strip, 2 | strip, 1 | 8 |
| 100×30 | 20 | strip, 2 | strip, 1 | 7 |
| 90×24 | 20 | strip, 2 | strip, 1 | 6 |
| 80×24 | hidden | hidden | strip, 1 | 6 |
| 60×20 | hidden | hidden | strip, 1 | 3 |

No accidental wrapping. Long History rows truncate. The Graph remains the
primary readable pane. Header and footer stay fixed.

## 10. Data contract

The dashboard reads:

- graph config: nodes, graph agents, handoffs, workflows, connections, strict;
- `graph-info`: config path, graph/workflow metadata, engine `version`,
  `valid`; the header shows the engine version, not the config schema version;
- `graph-map.runtime`: `active`, `queue`, `lastDefect`, `lastEvent`, `history`,
  `historyEpoch`;
- `dispatch/status` for active/queued details: node, workflow, state, visits,
  usage, output, defect.

Do not parse `graph-map.state` to discover active or queued dispatches;
structured runtime fields are the contract. A workflow dispatch carries its
main `workflow`; a node dispatch has `workflow: null`. The engine is
authoritative for strict boundary errors; the view computes main/connected/
escaped display from the active node and the config.

## 11. Component architecture and anti-canvas

The dashboard is a tracked `dashboard/` package loaded as the OpenCode TUI
plugin. Live source is `dashboard/src/`; fixtures are `dashboard/fixtures/`;
tests are `dashboard/test/`. The ignored `.opencode` tree is not the source of
truth.

Components: `Dashboard`, `Header`, `Outline`, `GraphPane`,
`WorkflowContainer`, `NodeCard`, `Connector`, `Details`, `HistoryPane`,
`HistoryStrip`, `ConnectorRunner`, `RunConsole`, `StatusBar`.

The Graph pane is a positioned native container. A pure layout model computes
native component rectangles; it does not allocate a character buffer or
coordinate-indexed style array.

- One `NodeCard` per configured node.
- Workflow boxes sit behind cards. A closed box is allowed only when its
  rectangle contains no non-members; otherwise use a rail/bracket.
- Shared nodes exist once. Multiple containers/rails may reference the same
  node. Overlapping containers use offset insets, distinct colors, and labels.
- Connectors are bounded native text elements positioned by the layout model.
- Responsive sizing changes available rectangles and visibility, never back to
  a character grid.

Anti-canvas check: `dashboard/test/no-canvas.test.mjs` scans `dashboard/src/`
only (not fixtures/tests) and fails on `renderFrame`, `canvas`,
`styles[row][col]`, `paint`, `hline`, `vline`, a graph-level `box(` helper, a
row-per-line string grid, or `render.mjs`. Known-bad fixtures live outside the
scanned root and prove each pattern fails.

## 12. Tests and acceptance

The work is complete when:

1. The dashboard uses native OpenTUI components and theme tokens; no
   character-canvas renderer or per-cell tinting.
2. The Graph pane shows the configured graph, not only the first workflow.
3. All nodes appear once; edges reflect handoffs; inactive nodes are still and
   desaturated; active nodes are prominent.
4. A running node has only the shape-only top-border sweep; containers are
   static; inactive/queued nodes are still.
5. A workflow dispatch draws its main container; a node dispatch draws none; a
   queued workflow draws a waiting main container.
6. Connected containers appear only while the active node is inside them; main
   precedence suppresses duplicates; escapes show a warning, and strict mode
   produces an engine defect.
7. Details lists all memberships per active entry, active first, saturated
   active and muted inactive; it is empty when idle; queued work is not a
   Details entry.
8. History has the specified row grammar, engine-process/workspace scope,
   100-entry cap, structured 15-key projection, and one-line strip; it is
   never hidden at supported sizes.
9. The connector runner animates a new handoff once, never replays history at
   mount or after a seq reset, and self-handoffs produce no token.
10. The responsive matrix, split formula, strips, and unchanged console heights
    pass; no accidental wrapping; `esc` returns to the same chat/session/agent.
11. The dashboard consumes structured runtime and never parses the
    human-readable state string; graph reload updates structure without a TUI
    restart.
12. Engine/dashboard suites pass; anti-canvas is green; the real
    `DashboardView` captures active-split, idle-split, 120×40, and 80×24 states
    with frozen clocks and `TZ=UTC`.

## 13. Deferred

- Run archive / completed-dispatch list.
- Persisted activity history or per-OpenCode-session filtering.
- Node selection or pointer/keyboard browsing.
- Dispatch controls, editing, or scoped chat.
- Parallel workflow execution beyond the display model.
- Reduced-motion preference.
- A general layout engine for arbitrarily large graphs.
