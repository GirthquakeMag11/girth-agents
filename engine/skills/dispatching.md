---
name: dispatching
description: Start work in the graph, wait for it or send it to the background, cancel it, and report the product or defect.
---
# Dispatching

A dispatch sends a prompt into the one graph at a named node. The engine
runs one dispatch at a time; further dispatches wait in a FIFO queue.

## Start

Call `graph_info()` to see the graph's nodes and workflows. Choose the node
where the work should begin. Any node may be a start.

## Dispatch

```json
{
  "node": "implement",
  "prompt": "The full work item, verbatim.",
  "wait": true
}
```

Call `dispatch` with those fields. There is no graph id.

- `wait: true` blocks like a normal task and returns the completion or
  defect. Use it for normal work.
- `wait: false` returns a dispatch id immediately. Use `dispatch_status` or
  `dispatch_wait` later. Use it for background work.

The tool returns JSON. A completion includes `dispatchId`, `state`, `usage`,
and the result. A defect includes a `code` and `message`; report both, do
not hide them.

## Waiting and checking

- `dispatch_status({ dispatchId })` returns the live state:
  `queued`, `running`, `completed`, `cancelled`, or `defect`.
- `dispatch_wait({ dispatchId, timeoutMs })` waits for completion. If it
  times out it returns `state: "running"`; wait again or report the id.
- `dispatch_cancel({ dispatchId })` removes a queued dispatch or interrupts
  the active one. A cancelled dispatch never becomes a defect. Do not kill
  the engine to stop work.

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
