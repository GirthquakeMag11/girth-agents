# Return handoff — engine feature specification

**Status:** ready for implementation; sliced into `tickets/027`–`028`.  
**Baseline:** engine v1.3.0 has no dispatcher target and no return path.  
**Invariants:** `INVARIANTS.md` — one handoff mechanism; a handoff is a
message and a target; no separate reply, answer, request-input, or wait tool.  
**Related:** `SPEC.md`, `specs/HANDOFF-TOOLS-SPEC.md`,
`specs/DISPATCH-RESULT-SPEC.md`,
`SUBAGENTS-AND-DISPATCH-INTERACTION-DESIGN.md`.

## 1. Problem

A node may hand off a message to the dispatcher. The dispatch completes and
the source node session is retained. The dispatcher may later send a message
back to that node by using the same `dispatch` tool with `resume: true`. The
engine validates that the target is the origin of the dispatcher's received
input and resumes the source session.

There is no separate message type. The handoff is a message and a target. The
message is the context.

## 2. Contract

### 2.1 Node handoff to the dispatcher

A node's handoff label may target `$dispatcher`. The active node's graph agent
calls the generated handoff tool with:

```json
{ "message": "The message." }
```

The handoff:

- is validated like any other handoff;
- completes the dispatch with the message as the focused response;
- does not require a terminal node;
- retains the source node session as the origin for a possible return;
- records the message and the source origin on the dispatch.

The node does not mark the message. The dispatcher decides whether to return
a message.

### 2.2 Dispatch return

The dispatcher sends a message back with the same open-ended `dispatch` tool:

```json
{
  "node": "node-a",
  "prompt": "The message.",
  "resume": true,
  "dispatchId": "d-1"
}
```

- `resume: true` is valid only when the target node is the origin of the input
  the sender received. For a dispatcher return, that origin is the node that
  handed off the message.
- `dispatchId` is optional. It identifies the source dispatch when more than
  one retained origin targets the same node. If omitted and the origin is
  unambiguous, the engine binds it. If several origins match, the call is
  rejected with `handoff.ambiguous`.
- The prompt is the message. It becomes the node's upstream context.
- The source session resumes in place; it is not re-dispatched.
- The return is foreground: it returns the source node's next handoff result.
- `workflow` plus `resume: true` is invalid.
- A target that is not the origin is rejected with `resume.not-return`.
- A target whose origin was already resumed or discarded is rejected with
  `handoff.stale`.

There is no separate return tool.

### 2.3 Multiple retained origins

Multiple dispatches may retain origins at the same time.

- Each retained origin belongs to its own dispatch and source session.
- The dispatcher may return messages in any order with the same `dispatch`
  tool; there is no global queue, serialization, or notification order.
- Within one dispatch, one origin is retained because its node is paused.
- If several retained origins target the same node, `dispatchId` binds the
  return. Without it, the call is rejected with `handoff.ambiguous` rather
  than assigned arbitrarily.
- After a node resumes, it may hand off again to any target. That is a new
  handoff, not a special case.

### 2.4 Retention and discard

- The source node session is retained until a return message is delivered or
  the retained origin is discarded.
- The retained origin does not hold a queue slot.
- `dispatch_cancel` on the dispatch id discards the retained origin and its
  source session.
- If the dispatching session disappears, the retained origin remains until it
  is discarded or the engine restarts.
- If the engine restarts, the retained origin and its source session are lost.
  This remains in-memory behavior.

### 2.5 Budget

- The source node budget does not run while the origin is retained.
- The continuation uses the remaining budget.
- Discarding the retained origin does not create a defect.

### 2.6 History

The handoff and its return use the existing `handoff` history kind:

```text
HH:MM:SS  d-1  node-a → dispatcher · <label>
HH:MM:SS  d-1  dispatcher → node-a · <label>
```

The label is the node's declared label for both rows; direction comes from
`from` and `to`. No message content, session id, or origin handle is written
to history. The 15-key history allowlist is unchanged.

## 3. Errors

- `resume.not-return` — the resume target is not the origin of the input the
  sender received, including a dispatcher return with no matching origin.
- `handoff.ambiguous` — more than one retained origin matches the target and
  no `dispatchId` was supplied.
- `handoff.stale` — the retained origin was already resumed or discarded.
- `handoff.message-required` — the message is missing.
- `handoff.message-empty` — the message is empty or whitespace-only.
- `handoff.cancelled` — the retained origin was discarded before the return.

Existing handoff and dispatch errors remain.

## 4. Non-goals

- any message-kind state, separate input protocol, or category-specific tool
  or endpoint;
- `input-required` state;
- dispatcher response source and focused result (covered by
  `DISPATCH-RESULT-SPEC.md`);
- OpenCode dispatch-card rendering;
- graph agent subagents;
- optional node outputs;
- graph configuration architecture;
- persisted origins or session recovery;
- background returns.

## 5. Acceptance tests

1. A node can hand off to `$dispatcher` with `{ message }`; the dispatch
   completes without a terminal node and retains the source session.
2. The dispatch result carries the dispatch id and the handoff message.
3. `dispatch({ node, prompt, resume: true })` resumes the source session; the
   message becomes its upstream context.
4. A resume target that is not the origin is rejected with
   `resume.not-return`.
5. Multiple retained origins for the same node: `dispatchId` binds the return;
   omission is rejected with `handoff.ambiguous`.
6. A return with a stale `dispatchId` is rejected with `handoff.stale`.
7. No queue slot is held while the origin is retained; the continuation uses
   the remaining budget.
8. `dispatch_cancel` on the dispatch id discards the retained origin and its
   session.
9. History shows content-free handoff rows and no message content.
10. No message-kind state, tool, or endpoint exists.

## 6. Implementation notes

The engine already retains a resumable target session for `resume: true`. This
feature extends that retention to a dispatcher handoff origin.

The dispatch record carries the dispatch id, the source node, the source
session id, and the retained-origin state. The return lookup matches the target
node and, when supplied, the dispatch id. It validates that the target is the
origin of the dispatcher's received input, then resumes the retained session.

The dispatching agent uses its existing open-ended `dispatch` tool with a node
target, the message as the prompt, `resume: true`, and optional `dispatchId`.
There is no separate message-kind tool or state.
