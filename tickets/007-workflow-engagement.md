# 007 — Workflow engagement and Details memberships

**Status:** passed (independent review, 2026-10-30)  
**Sequence:** 3 of 5  
**Depends on:** 006  
**Spec:** `DASHBOARD-SPEC.md`

> **Post-review amendment (2026-10-30):** Details is a live-work inspector.
> It shows one entry per active dispatch and is empty when no dispatch is
> active. Queued work is visible in the Graph and Run console, never as a
> Details entry. The idle/default Details node is removed. This supersedes
> the queued and default Details rows in the original ticket text.

## Context

The graph has workflow views, explicit workflow dispatch intent, transitive
connections, strict boundaries, and a distinction between queued, active,
connected, and escaped work. The dashboard must show that state natively
without duplicating shared nodes.

## Work

- Add native workflow containers around engaged workflow node sets.
- Main workflow container: present for a workflow dispatch, including
  queued time. Queued uses the warning/waiting treatment.
- Connected workflow container: present only while the active node is
  inside a valid connected workflow.
- Main precedence: while the active node is in the main workflow, suppress
  all connected containers. Do not draw a duplicate connected container,
  and do not draw a partial rail that suggests a second engaged workflow.
- Node dispatch: no workflow container.
- Multiple queued workflow dispatches: each queued main workflow gets a
  waiting container around its node set. When containers overlap, use
  nested/offset native containers with distinct categorical or warning
  colors; never duplicate a node. The active main workflow is visually
  primary.
- Escape: when the active node leaves the main workflow and all validly
  connected workflows, show a small warning on the active node and a
  Details explanation. Strict mode is enforced by the engine.
- Shared nodes are rendered once. The Graph shows only engaged workflow
  context.
- Details lists all workflow memberships for the Details node, active
  memberships first. Running main and active connected memberships use
  their categorical/saturated treatment; a queued main membership is active
  but uses the warning treatment. Inactive memberships are desaturated.
- Queued nodes use the warning color and remain still; only running nodes
  pulse.
- The display model accepts a list of active dispatches and a queue. The
  v1 engine is single-active, but the dashboard model must not hardcode a
  single active slot.
- No node-selection keybinding in v1. Details follows the first active
  node in the display model, else the first queued node, else `review`,
  else the first node.
- Use categorical theme colors for workflow containers; no hardcoded
  workflow colors.
- Keep layout native. Overlapping containers must use nested/offset
  containers or rails, never duplicate nodes.
- Add `dashboard/fixtures/engagement.json` and
  `dashboard/fixtures/crossing.json`. Add `dashboard/test/layout.test.mjs`
  proving closed containers contain only contiguous members, interleaved
  E/F uses rails, shared nodes are not container children, and no false
  membership is drawn.

## Validation condition

The canonical fixture in `DASHBOARD-SPEC.md` is stored at
`dashboard/fixtures/engagement.json`; the pure engagement model is
unit-tested at `dashboard/test/engagement.test.mjs` against its expected
table. The
rendered/fixture cases demonstrate: node dispatch draws no container; queued
workflow draws a waiting main container; active main workflow draws its
container; a connected workflow appears only while the active node is inside
it; main membership suppresses connected containers entirely and leaves the
connected membership inactive in Details; an escape shows the warning;
queued details use warning treatment; Details membership order and
saturation match engagement; multiple queued main containers can coexist
without duplicate nodes. All shared nodes appear once, and the crossing
fixture produces no false container membership. An independent reviewer
signs off on each row.

## Out of scope

- Animation.
- Editing or dispatch controls.
- Engine/config changes beyond fixing a demonstrated defect.

## Review gate

Before ticket 008, the independent reviewer must run or inspect the pure
engagement tests and check each canonical fixture row against the rendered
result. The reviewer must explicitly answer whether the implementation is
still building a canvas, whether any shared node is duplicated, whether
main/connected/queued/escape semantics are correct, and whether queued
membership styling matches the specification.
