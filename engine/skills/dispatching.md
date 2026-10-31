---
name: dispatching
description: Start work in the graph, wait for it or send it to the background, cancel it, and report the product or defect.
---
# Dispatching

A dispatch sends a prompt into the one graph. The engine runs one dispatch
at a time; further dispatches wait in a FIFO queue.

## Start

Call `graph_info()` to see the graph's nodes, workflows, and workflow
connections. Choose exactly one start:

- `workflow: "build-review"` starts at the workflow's entry and engages
  that workflow's boundary.
- `node: "review"` starts at that node and engages no workflow.

Use the form the user asked for. If the user says to run a workflow, use
`workflow`. If the user says to send work to a node, use `node`. Do not
infer a workflow from the node's membership.

## Dispatch

```json
{
  "workflow": "build-review",
  "prompt": "The full work item, verbatim.",
  "wait": true
}
```

Or:

```json
{
  "node": "review",
  "prompt": "The full work item, verbatim.",
  "wait": true
}
```

Exactly one of `node` or `workflow` is required.

- `wait: true` blocks like a normal task and returns the completion or
  defect. Use it for normal work.
- `wait: false` returns a dispatch id immediately. Use `dispatch_status` or
  `dispatch_wait` later. Use it for background work.

The tool returns JSON. A completion includes `dispatchId`, `state`, `usage`,
and the result. A defect includes a `code` and `message`; report both, do
not hide them. Dispatch status also reports the engaged `workflow`, or
`null` for a node dispatch.

## Waiting and checking

- `dispatch_status({ dispatchId })` returns the live state:
  `queued`, `running`, `completed`, `cancelled`, or `defect`.
- `dispatch_wait({ dispatchId, timeoutMs })` waits for completion. If it
  times out it returns `state: "running"`; wait again or report the id.
- `dispatch_cancel({ dispatchId })` removes a queued dispatch or interrupts
  the active one. A cancelled dispatch never becomes a defect. Do not kill
  the engine to stop work.

## Workflow boundaries

A workflow may declare `connections` to other workflows. A workflow
dispatch may move into its main workflow or any workflow reachable through
those connections. If the active node returns to the main workflow, the
connected workflow is no longer engaged.

If the active node leaves the main workflow and all connected workflows:

- when the **main workflow** has `strict: true`, the engine rejects the
  handoff with `workflow.escape` and the dispatch defects;
- otherwise, the dashboard shows an escape indicator.

A node dispatch has no workflow boundary.

## Rules

- The prompt is the work item and is passed verbatim to every node. Put the
  full instruction in the prompt; the node objective is the node's role.
- Do not start a second dispatch as a substitute for waiting; queueing is
  intentional and in order.
- The engine writes outputs under the graph's `outputRoot`. Report the
  output paths from the completion.
- Report the completion's `usage` (cost and tokens) so the user can see
  what the dispatch spent.
- If the completion is a defect, report the defect code and message. Do not
  claim the work succeeded.
