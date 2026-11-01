# 028 — Return message through dispatch resume

**Status:** ready  
**Sequence:** 2 of 2  
**Depends on:** 027  
**Spec:** `specs/RETURN-HANDOFF-SPEC.md`

## Context

The dispatcher can send a message back to the origin node with the same
`dispatch` tool and `resume: true`. This ticket implements the binding, origin
validation, and in-place resume.

## Work

- `dispatch({ node, prompt, resume: true, dispatchId? })` finds the retained
  origin for the target node.
- `dispatchId` binds a specific source dispatch when more than one retained
  origin targets the same node. Omit it when unambiguous.
- Validate that the target is the origin of the input the dispatcher
  received:
  - a target that is not the origin is `resume.not-return`;
  - several matching origins without `dispatchId` is `handoff.ambiguous`;
  - an origin already resumed or discarded is `handoff.stale`.
- Delivery:
  - the prompt is the message and becomes the node's upstream context;
  - the source session resumes in place; no new session and no re-dispatch;
  - the return is foreground and returns the node's next handoff result;
  - the node budget continues from the remaining budget;
  - no queue slot is held while the origin is retained.
- Record the return as a content-free handoff history row. Do not write the
  message to history.
- `workflow` plus `resume: true` remains invalid; `dispatchId` without
  `resume: true` remains invalid.
- Add tests for: same-session resume; message as upstream context; non-origin
  rejection; ambiguous origin; dispatchId binding; stale origin; foreground
  return; no new session; budget continuation; content-free history.

## Validation condition

A return message resumes the source session in place and becomes its upstream
context. A non-origin target is `resume.not-return`; an ambiguous target is
`handoff.ambiguous`; a stale target is `handoff.stale`. `dispatchId` binds the
correct origin. No new session is created and no message content reaches
history. The engine suite passes.

## Out of scope

- The dispatcher response source.
- Message-kind state or separate input tools.
- Background returns.
- Persisted origins or session recovery.
- Optional node outputs.

## Review gate

The reviewer checks the target is validated against the origin, the resume
uses the same session, and the return is the same `dispatch` tool rather than a
new tool or endpoint.
