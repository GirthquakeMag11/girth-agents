---
name: dispatching
description: Start work in the graph, wait for it or send it to the background, cancel it, and report the product or defect.
---
# Dispatching

> **Design correction (2026-10-31).** The current dispatch tool returns a
> focused display; raw JSON is available only through
> `dispatch_status({ raw: true })`. The target presentation is a graph dispatch
> card. A node's dispatcher handoff uses the normal generated handoff tool; the
> dispatcher sends a message back through `dispatch` with `resume: true`. There
> is no separate reply/resume/answer tool, no message kind, and no
> `input-required` state.

A dispatch sends a prompt into the one graph. The engine runs one dispatch
at a time; further dispatches wait in a FIFO queue.

## Start

Call `graph_info()` to see the graph's nodes, workflows, and workflow
connections. Choose exactly one start:

- `workflow: "<workflow-id>"` starts at the workflow's entry and engages
  that workflow's boundary.
- `node: "<node-id>"` starts at that node and engages no workflow.

Use the form the user asked for. If the user says to run a workflow, use
`workflow`. If the user says to send work to a node, use `node`. Do not
infer a workflow from the node's membership.

## Dispatch

```json
{
  "workflow": "<workflow-id>",
  "prompt": "The full work item, verbatim."
}
```

Or:

```json
{
  "node": "<node-id>",
  "prompt": "The full work item, verbatim."
}
```

Exactly one of `node` or `workflow` is required.

- The default is foreground: the call blocks like a normal subagent call and
  returns the focused completion or defect.
- `background: true` returns a dispatch id immediately. The engine notifies
  this session when the background dispatch completes. Do not add a separate
  foreground wait call.

The dispatch tool returns a focused display. Raw JSON is available only with
`dispatch_status({ dispatchId, raw: true })`. A completion includes
`dispatchId`, `state`, `usage`, and the result. A defect includes a `code` and
`message`; report both, do not hide them. Dispatch status also reports the
engaged `workflow`, or `null` for a node dispatch.

## Waiting and checking

- `dispatch_status({ dispatchId, raw? })` returns a focused display by default
  and the structured snapshot with `raw: true`: `queued`, `running`,
  `completed`, `cancelled`, or `defect`. It is not the normal waiting step.
- A background dispatch arrives as a completion or defect notification.
  Report it when it arrives.
- `dispatch_cancel({ dispatchId })` removes a queued dispatch or interrupts
  the active one. A cancelled dispatch never becomes a defect. Do not kill
  the engine to stop work.

## Return handoff

A node may hand off a message to the dispatching agent. The dispatch completes
with the message as the focused response and retains the source node session as
the origin. To send a message back, call the same `dispatch` tool with that
node, the message as `prompt`, `resume: true`, and optional `dispatchId` when
several retained origins target the node. The node resumes in the same
session. There is no question/answer/final/response type and no separate
reply/answer tool.

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
- Report the completion's terminal node and `usage` (cost and tokens) so the
  user can see what the dispatch spent.
- If the completion is a defect, report the defect code and message. Do not
  claim the work succeeded.
