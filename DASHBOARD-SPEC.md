# Graph dashboard — TUI specification

**Status:** accepted design direction; implementation specification under independent review  
**Version:** 1  
**Related:** `SPEC.md` (engine contract), `THREADS.md` (design record)

> **Motion/history amendment (2026-10-30):** `DASHBOARD-MOTION-HISTORY-SPEC.md`
> supersedes this document's motion section, its single full-height
> right-side Details layout, and acceptance criterion 5. Where they conflict,
> the amendment wins.

## 1. Purpose

The dashboard is a full-screen, read-only view of the graph as it is
configured and as it is currently behaving. It exists so the user can open
one surface, see the graph's structure, current work, and workflow
engagement at a glance, and return to the same chat without changing
context.

The dashboard is part of the OpenCode TUI. It is not a chat message, not a
separate web application, and not a styled character canvas. It is built
from OpenCode's native terminal widgets and inherits the active theme.

The v1 view is optimized for understanding. The user configures the graph
and starts work through the interactive agent. The dashboard observes and
explains; it does not edit or dispatch.

## 2. Product principles

- **UX before UI.** The view exists to reduce the effort of understanding
  and the decoherence between the user's model, the agent's model, and the
  project state.
- **The graph is the subject.** The view represents the graph as
  configured: all nodes, all handoffs, and all workflow memberships. It
  does not privilege the first workflow.
- **Structure and behavior share one view.** Nodes and edges show the
  configuration; state, work, and workflow engagement show what is
  happening now.
- **Native widgets.** Node cards, workflow containers, panes, headers,
  and status elements are OpenTUI components styled with semantic theme
  tokens. A pre-rendered character grid with per-cell colors is not an
  acceptable implementation.
- **Read-only by construction.** The view cannot modify the graph, edit the
  config, dispatch work, or change the session. Those actions belong to the
  interactive agent.
- **No context switch.** The overlay opens over the current session and
  Escape returns to the same chat, session, and agent.

## 3. Scope

### In scope

- Full-screen OpenCode TUI panel opened from the command palette and/or a
  key combination.
- Read-only graph structure: nodes, handoffs, workflows, connections.
- Live behavior: active and queued dispatches, visits, sessions, cost,
  tokens, defects, and recent state.
- Workflow engagement: main workflow, connected workflows, queued
  workflow, and escape indication.
- Live-work Details: contract, objective, workflow memberships, run state,
  and output for the active dispatch(es); empty when no work is active.
- Theme-driven visual hierarchy, active emphasis, inactive desaturation,
  a shape-only moving border accent for running nodes, and static workflow
  containers.
- Responsive layout using the panel's available dimensions.

### Out of scope

- Editing the graph, draft preview, Validate/Apply actions.
- Starting or cancelling dispatches from the dashboard.
- Product/agent tabs, scoped chat, or a local web workbench.
- A table-only fallback as the primary graph representation.
- Multiple graphs or a graph selector.
- General-purpose graph layout for arbitrarily large graphs beyond a
  reasoned vertical layout with clipping/overflow behavior.

## 4. Surface and interaction

- **Surface:** the OpenCode TUI `session.panel` slot, opened with
  `presentation: "fullscreen"`.
- **Open:** command palette entry and/or key combination.
- **Close:** `esc` closes the panel and returns to the same chat, session,
  and agent. It does not change tabs.
- **Refresh:** graph structure refreshes after an applied graph change;
  runtime state refreshes while the panel is open.
- **Focus:** the panel is read-only. It may support selecting a node to
  inspect, but no control may mutate the graph or start work.
- **Chrome:** header, body, and footer are native flex layouts that fill
  the available panel area. Text is clipped or collapsed deliberately at
  narrow sizes; it must not wrap into a broken frame.

## 5. Terms and state model

### Graph and workflows

There is one graph per engine config. A workflow is a labelled view of a
subset of the graph and is not a container. A node dispatch has no
workflow boundary. A workflow dispatch defines a boundary consisting of
the main workflow and its transitive connections. A node may belong to
zero, one, or many workflows. Workflows may declare directed
`connections` to other workflows.

### Dispatch intent

- A **workflow dispatch** starts at the workflow's entry and records the
  workflow as the dispatch's **main workflow**.
- A **node dispatch** starts at a named node and records no workflow.
- Exactly one of `node` or `workflow` is supplied.

### Engaged workflows

For a workflow dispatch, the **allowed set** is the main workflow plus all
workflows reachable through the transitive `connections` graph.

- The **main workflow** is engaged for the life of the dispatch, including
  queued time and handoffs.
- A **connected workflow** is engaged only while the active node belongs to
  it.
- If the active node belongs to the main workflow, the main workflow takes
  precedence; all connected containers are suppressed while the active node
  is in main.
- If the active node leaves the main workflow and every allowed connected
  workflow, the dispatch has **escaped**.
- If the main workflow is `strict: true`, an attempted handoff outside the
  allowed set is a loud engine defect. Otherwise it is allowed and shown as
  an escape.

A node dispatch never engages a workflow and never draws a workflow
container.

### Queued workflow

A queued workflow dispatch still has a main workflow. The main container is
shown in a waiting/queued style. No connected container is shown until an
active node enters one.

### Shared nodes

A node is drawn once. The Graph shows only engaged workflow containers and
only the engaged workflow context for a node. Details lists the active
node's workflow memberships.

### Details and plural active work

- The display model accepts a list of active dispatches, even though the v1
  engine runs one dispatch at a time. The extension point is the list, not a
  single fixed active slot.
- Details shows one entry per active dispatch, in the display model's active
  order. With one active dispatch it shows one entry; with several it shows
  several live entries.
- With no active dispatch, the Details pane is empty (only its pane title
  remains). Queued work is shown by waiting containers and the Run console,
  not as a Details entry.
- v1 has no node-selection keybinding and no idle/default Details node.
  Arbitrary idle-node browsing, if wanted later, requires an explicit visible
  selection with a focus ring.

### Canonical engagement fixture

The implementation must test this fixture, independent of the live engine.

### Display fixture

Main workflow A is **non-strict** for the display cases. The engine-strict
case is separate.

| Workflow | Entry | Exit | Nodes | Connections | Strict |
|---|---|---|---|---|---|
| A (main) | a1 | a2 | a1, a2, x, z | B, C | false |
| B (connected) | x | y | x, y | C | false |
| C (connected) | y | o2 | y, o2 | none | false |
| D (unconnected) | d1 | d1 | d1 | none | false |

Shared nodes: `x` is in A+B; `y` is in B+C. Node `z` is A only; `o` is in no
workflow; `d1` is D only.

Expected display:

| Case | Containers | Details entries |
|---|---|---|
| Node dispatch at `x` | none | empty |
| Workflow A queued at `a1` | A, queued style | empty |
| A active at `z` | A | `z`: A active |
| A active at `x` | A only (main precedence) | `x`: A active; B inactive |
| A active at `y` | A, B, and C | `y`: B and C active |
| A active at `o` | A plus escape warning | `o`: no active memberships |
| A active at `d1` | A plus escape warning | `d1`: D inactive |
| Two active: A at `z`, B at `y` (B is a workflow dispatch) | A and B, offset/overlapping, no duplicate nodes | `z`: A active; `y`: B active, C inactive |

### Strict fixture

Main workflow A has `strict: true`. A handoff from any allowed node to `o`
or `d1` is an engine defect `workflow.escape`. The pure display model does
not test the defect row; the engine test does.

### Crossing fixture

Workflow E contains nodes `e1, e3`; workflow F contains `e2, e4`; the
layout interleaves them. A bounding rectangle would falsely include
non-members. The layout must use rails/brackets or a contiguous-layout
guarantee in this case; it must not draw a closed container that claims
non-members.

The pure engagement model must be unit-tested against the display fixture.
The layout model must be unit-tested against the crossing fixture. Strict
behavior is tested by the engine. The display fixture is a model fixture,
not a runnable engine config; ticket 009 defines the valid non-strict and
strict temporary engine graphs.

## 6. Layout

The dashboard has these regions:

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

- **Header:** graph identity, number of workflows/nodes, engine validity
  and live/idle state, version, `read-only`, `esc to close`.
- **Outline:** all workflows, all nodes, engagement/state badges, shared
  membership indicators, graph summary. It is navigation/context, not a
  duplicate graph canvas.
- **Graph:** the configured graph. Nodes are native cards; handoffs are
  native connectors. Workflow containers enclose engaged workflow node
  sets. This pane is labelled **Graph**.
- **Details:** one entry per active dispatch. Each entry contains the hidden
  literal detail: helper, handoff resume behavior, objective/brief, output,
  max visits, handoffs, workflow memberships, run state. The pane is empty
  when no dispatch is active.
- **History:** a newest-first activity timeline for the engine process.
  Details sits above it at split sizes; collapsed layouts use a one-line
  History strip. See `DASHBOARD-MOTION-HISTORY-SPEC.md` for exact behavior.
- **Run console:** read-only active/queued dispatch information, cost,
  tokens, defects, and recent state. No start-node selector, prompt field,
  or dispatch control.
- **Footer:** `active` / `queued` / `defect` counts, elapsed, cost/tokens,
  `read-only`, and `esc to close`.

## 7. Visual system

### Theme

All colors come from the active OpenCode theme's semantic tokens. The
dashboard inherits gruvbox or any other active theme. No hardcoded hex
colors, no raw ANSI escape codes, and no unthemed default text outside the
theme's normal text tokens.

### A mapping

Color carries state and handoff meaning:

- **Node state:** running, queued, idle, terminal.
- **Node emphasis:** active nodes are bright and visually leading;
  inactive nodes are still and comparatively desaturated.
- **Handoff edges:** `next` is neutral; `pass` uses success; `fail` uses
  error. Other labels use a neutral/muted edge style.
- **Workflow containers:** categorical theme hue per workflow; the main
  container is visually primary. Queued main uses the warning surface.
- **Details active entry:** the active entry and active containers use accent
  or categorical emphasis.
- **Escape:** a small, noticeable warning treatment on the active node and
  a Details explanation.
- **Workflow membership:** quiet badges or container membership. The Graph
  does not list every workflow a node belongs to; Details carries the full
  list.

Icons and labels reinforce color. Meaning must not depend on color alone.

### Node cards

A node is a native bordered card, not a row in a character grid. It shows:

- node id
- state icon/marker and state
- a compact helper cue where space allows

Detailed contract, objective, visits, and output move to Details. Inactive
cards use muted/faint theme tokens; active cards use the state color and a
raised surface where appropriate.

### Links

Links are native connectors with clean corners and arrows. Every handoff
label is rendered as a small native chip attached to its connector with a
short tick or line; labels are not omitted and do not float in open space.
The chip and connector use the handoff color. Nodes have no session mode.
A return handoff with `resume: true` carries a resume marker on its chip
and in Details; there is no free-standing node `resume`/`fresh` label.
Cross-workflow movement is visible through the workflow containers and the
node positions, not through extra prose.

### Workflow containers

- Main workflow: always present for a workflow dispatch; active or queued.
- Connected workflow: present only while the active node is inside it, and
  only when no main precedence applies.
- Inactive workflows: no container.
- Containers use a thin native border and a compact label.
- Overlapping/shared workflows in future concurrency use nested/offset
  containers or dedicated rails with distinct categorical colors. Shared
  nodes are never duplicated.
- A node dispatch draws no container.

### Details

Each Details entry corresponds to an active dispatch. It contains all
workflow memberships for that node, active memberships first. Active
memberships are saturated and use the workflow color; inactive memberships
are desaturated/muted. Contract, objective, run state, and output remain
literal and readable. With no active dispatch, the pane body is empty.

### Motion

Workflow containers are static. Running node cards keep their border,
surface, text, and layout fixed; a two-cell heavier segment moves slowly
along the top border in the same running accent hue. A new handoff may play
a one-shot token along the actual connector. Inactive and queued content is
still. See `DASHBOARD-MOTION-HISTORY-SPEC.md` §7 for the exact contract.

## 8. Component architecture

The dashboard is implemented in a tracked `dashboard/` package and loaded
as the OpenCode TUI plugin. Live source is `dashboard/src/`; fixtures are
`dashboard/fixtures/`; tests are `dashboard/test/`. The
`.opencode/plugins/graph-dashboard` path must point at or install that
tracked package; the ignored `.opencode` tree is not the source of truth.
The old ignored `tui.tsx`/`render.mjs` must be removed.

The dashboard is implemented in the OpenCode TUI plugin, natively:

- `Dashboard` — flex layout and data orchestration.
- `Header` — graph/workflow identity and status chips.
- `Outline` — workflows/nodes/navigation.
- `GraphPane` — configured graph, node cards, connectors.
- `WorkflowContainer` — main/connected/queued boundary.
- `NodeCard` — native node card and state styling.
- `Connector` — native link/arrow/corner rendering.
- `Details` — active-work entries, contract and membership sections.
- `RunConsole` — read-only current state and recent events.
- `StatusBar` — counts, cost/tokens, read-only, close hint.

The implementation must not use a monolithic pre-rendered string grid with
per-cell color spans. Layout, borders, padding, surfaces, and focus are
owned by OpenTUI components. Character text may be used inside a connector
or label, but not as the entire dashboard rendering medium.

### Native layout model

The Graph pane is a positioned native container. A pure layout model
computes native component rectangles; it does not allocate a character
buffer or a coordinate-indexed style array.

- One native `NodeCard` is rendered per configured node.
- Native `WorkflowContainer` boxes are positioned behind the node cards
  with lower z-index. They enclose the bounding rectangle of the workflow's
  node cards **only when that rectangle contains no non-members**. The
  layout model must guarantee contiguous ranges for closed containers.
- When a workflow's nodes are interleaved with non-members, use a native
  rail/bracket attached to the member cards instead of a closed box. A
  closed box must never imply false membership.
- Shared nodes are not children of containers; they exist once in the node
  layer. Multiple containers/rails may reference the same node.
- Containers that overlap use offset insets, distinct categorical colors,
  and distinct labels. They must not duplicate a node.
- Connectors are bounded native text elements: a short orthogonal segment
  or arrow between two node cards. They are positioned by the layout
  model. A connector may use box-drawing glyphs; it may not render the
  whole graph as a text drawing.
- Responsive sizing changes the layout model's available rectangle and
  component visibility; it does not switch back to a character grid.

### Anti-canvas check

Ticket 006 must include an executable static check at
`dashboard/test/no-canvas.test.mjs`, run by
`node --test dashboard/test/*.test.mjs`. It scans **`dashboard/src/` only**
(excluding fixtures and tests) and fails on `renderFrame`, `canvas`,
`styles[row][col]`, `paint`, `hline`, `vline`, a graph-level `box(` helper,
a row-per-line string grid, or `render.mjs`. Known-bad fixtures live outside
the scanned root and prove each pattern fails. The check is part of the
review gate, not a comment in the spec.

## 9. Data contract

The dashboard reads:

- Graph config: nodes, helpers, handoffs, workflows, connections, strict.
- Engine `graph-info` for the config path, graph/workflow metadata,
  `version` (the engine version string), and `valid` (whether the loaded
  config is valid). The header displays the engine version; the config
  schema version is not the display version.
- Engine `graph-map` for structured runtime: `runtime.active`,
  `runtime.queue`, `runtime.lastDefect`, `runtime.lastEvent`,
  `runtime.history`, and `runtime.historyEpoch`.
- `dispatch/status` for active and queued dispatch details, including
  `node`, `workflow`, state, visits, usage, output, and defect.

The dashboard must not parse the human-readable `graph-map.state` string
to discover active or queued dispatches. Structured runtime fields are the
contract.

A workflow dispatch's status includes its main `workflow`; a node dispatch
has `workflow: null`.

The engine is authoritative for strict boundary errors. The view computes
the display of main/connected/escaped state from the active node and the
configuration.

## 10. Responsive behavior

The dashboard fills the panel and uses flex layout. It must not depend on a
fixed 120×40 or 225×67 character grid. The motion/history amendment defines
the split Details/History right column and the never-hidden History strip.

- Wide: Outline, Graph, Details, and Run console visible.
- Medium: Details may narrow; node cards remain readable.
- Narrow: Details and/or Outline collapse before the Graph becomes
  unreadable; the Graph remains the primary pane.
- Height: the Graph and Run console share available space; the header and
  footer remain fixed. Secondary content may clip or scroll deliberately;
  the frame must not wrap accidentally.

### Size matrix

| Size | Required behavior |
|---|---|
| 160×50 | Outline, Graph, split Details/History, Run console visible |
| 120×40 | Full layout; right column split Details/History; Details may narrow |
| 120×36 | Split boundary: Details/History panes visible |
| 120×35 | Details strip and one-line History strip; Graph, Run console, header, footer visible |
| 100×30 | Details strip and one-line History strip; Outline narrows |
| 80×24 | Outline and Details hidden; Graph, one-line History strip, Run console, header, footer visible |
| 60×20 | Graph, one-line History strip, header/footer; Run console deliberately clipped |

The right column splits at width ≥120 and height ≥36; below that height the
Details/History strips are used. History is never hidden at supported sizes.
The Graph remains the primary readable pane at every size. No accidental
row wrapping is allowed. Resizing the terminal reflows the layout without
requiring a restart.

## 11. Acceptance criteria

The work is complete when a reviewer can verify:

1. The dashboard is built from native OpenTUI components and theme tokens;
   no character-canvas renderer or per-cell tinting is used for the
   dashboard.
2. The middle pane is labelled **Graph** and shows the configured graph,
   not only the first workflow.
3. All configured nodes are represented once; edges reflect handoffs.
4. Active nodes are visually prominent; inactive nodes are still and
   desaturated.
5. A running node has a shape-only top-border sweep; inactive and queued
   nodes are still, and workflow containers are static.
6. A workflow-targeted dispatch draws the main workflow container; a node
   dispatch draws none.
7. A queued workflow draws a waiting main container.
8. A connected workflow container appears only while the active node is
   inside it; main precedence suppresses duplicate connected containers.
9. An escape outside main and connected workflows shows a small warning;
   strict mode produces an engine defect.
10. Details lists all memberships for each active entry, active first, with
    saturated active and desaturated inactive states; it is empty when no
    dispatch is active.
11. `esc` closes the panel and returns to the same chat/session/agent.
12. The layout responds to terminal size without the broken frame/wrap
    failure.
13. The previous `graph-view` agent and `/graph` command are not
    reintroduced.
14. The engine/config/API tests and the dashboard checks pass.
15. Node cards show id, state, and a compact helper cue; Outline
    lists all workflows and nodes with engagement/shared indicators;
    Header shows graph identity, validity, engine state, and version;
    Footer shows counts, elapsed, cost/tokens, read-only, and close hint.
16. Details shows each active node's helper, handoff resume behavior,
    objective, output, max visits, handoffs, all workflow memberships, run
    state, and output path.
17. The Run console shows active and queued dispatches, defects, cost, and
    tokens, and never shows dispatch controls.
18. The dashboard consumes structured runtime data and does not parse the
    human-readable state string.
19. The canonical engagement fixture and pure engagement tests pass.
20. A graph reload while the panel is open updates the structure without a
    TUI restart; a strict escape defect is visible in the Run console or
    footer.
21. The responsive size matrix passes at 160×50, 120×40, 100×30, 80×24,
    and 60×20.

## 12. Deferred

- Concurrent and parallel workflow execution beyond the displayed data
  model.
- Editing, draft/apply, and dispatch controls in the dashboard.
- A table view as a first-class alternative.
- A general graph layout engine for arbitrarily large graphs.
- Entropy/coherence mechanisms outside the graph view.
