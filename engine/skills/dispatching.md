---
name: dispatching
description: Start work in a graph, wait for it or send it to the background, and report the product or defect.
---
# Dispatching

A dispatch sends a prompt into a graph at a named node. The engine runs one
dispatch at a time; further dispatches wait in a FIFO queue.

## Start

Call `graphs()` to see the current graphs and their nodes. Choose the graph
and the node where the work should begin. Any node may be a start.

## Dispatch

```json
{
  "graph": "build-review",
  "node": "implement",
  "prompt": "The full work item, verbatim.",
  "wait": true
}
```

Call `dispatch` with those fields.

- `wait: true` blocks like a normal task and returns the completion or
  defect. Use it for normal work.
- `wait: false` returns a dispatch id immediately. Use `dispatch_status` or
  `dispatch_wait` later. Use it for background work.

The tool returns JSON. A completion includes `dispatchId`, `state`, and the
result. A defect includes a `code` and `message`; report both, do not hide
them.

## Waiting and checking

- `dispatch_status({ dispatchId })` returns the live state:
  `queued`, `running`, `completed`, or `defect`.
- `dispatch_wait({ dispatchId, timeoutMs })` waits for completion. If it
  times out it returns `state: "running"`; wait again or report the id.

## Rules

- The prompt is the work item and is passed verbatim to every node. Put the
  full instruction in the prompt; the node objective is the node's role.
- Do not start a second dispatch as a substitute for waiting; queueing is
  intentional and in order.
- The engine writes outputs under the graph's `outputRoot`. Report the
  output paths from the completion.
- If the completion is a defect, report the defect code and message. Do not
  claim the work succeeded.
