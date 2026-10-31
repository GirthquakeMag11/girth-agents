# 002 — Extract the frame's factual content

**Status:** superseded by `DASHBOARD-SPEC.md` and tickets 005–009  
**Sequence:** 2 of 4  
**Depends on:** 001

## Context

The frame must show the actual graph, not invented nodes or handoffs. Extract
the content from `engine/example-graph.json` before drawing.

## Work

- Read `engine/example-graph.json`.
- Produce a factual inventory covering the graph, workflow, nodes, handoffs,
  session modes, output paths, and visit limits.
- Do not draw the frame yet.

## Expected inventory

| Item | Content |
| --- | --- |
| Graph | One graph, no graph id; `outputRoot: work`; `maxSteps: 100` |
| Workflow | `build-review`; entry `implement`; exit `done`; nodes `implement`, `review`, `done` |
| `implement` | helper `builder`; output `work/implementation.md`; session `resume`; max visits 20; unconditional handoff `next` → `review` |
| `review` | helper `reviewer`; output `work/review.md`; session `fresh`; max visits 20; `pass` → `done`; `fail` → `implement` |
| `done` | helper `builder`; output `work/final.md`; session `fresh`; terminal; no max visits |

## Validation condition

The inventory matches `engine/example-graph.json` exactly; no node, handoff
label, session mode, output path, or visit limit is invented.

## Out of scope

- Drawing the frame.
- Runtime values such as dispatch ids, elapsed time, cost, or tokens.
- Implementation or code changes.
