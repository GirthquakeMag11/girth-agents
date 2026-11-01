# 018 — Handoff message propagation, brief, and order checks

**Status:** ready  
**Sequence:** 4 of 5  
**Depends on:** 017  
**Spec:** `specs/HANDOFF-TOOLS-SPEC.md`

## Context

The generated tool now carries a message. That message is upstream context for
the target node and the answer when a session resumes. The engine must also
recognize the generated tool name in the session history.

## Work

- Carry the accepted handoff message through `runNode` and `runDispatch`.
- When a label targets another node, include the message in that node's brief
  as upstream context. When the target is a resume, include the answer as
  upstream context.
- Update `composeBrief` to list the active node's generated handoff tools by
  name and description. Remove every instruction to call
  `handoff({ label })`. For an unconditional node, name the `next` tool.
  For a terminal node, say not to call a handoff tool.
- Update `checkHandoffOrder` to find the generated tool by its label name in
  the session history, not `name: "handoff"` with `input.label`. Keep the
  call-id path and the existing not-last rule.
- Keep the activity history content-free: record only from/label/to, never
  the message.
- Add tests for missing/empty messages, message propagation across nodes,
  resume-answer propagation, brief content, order checks by generated tool
  name, and content-free history.

## Validation condition

A declared label records its message and routes to the configured target. The
next node's brief contains the upstream message and lists only its own
generated tools. A resumed node sees the answer. `handoff.not-last` still
detects a tool call after the generated handoff tool. The activity history
contains no message content. The engine suite passes.

## Out of scope

- Reload rejection.
- Dispatch result, return handoff, optional outputs, or graph
  configuration architecture.

## Review gate

The reviewer checks that the message is upstream context, not output content;
that the brief never mentions the old tool shape; and that history remains
content-free.
