# Design invariants

Hard rules for the engine design. Check every proposed tool, endpoint, state, or
abstraction against these before writing it down.

## One handoff mechanism, two forms

- There is one handoff mechanism. A node receives input, does its work, and
  hands off its output. The source of the input does not create a different
  kind of activation.
- **Node handoff:** the tool is preconfigured by the node. The agent calls it;
  the engine resolves the target. The tool name is the label; the input is
  `{ message }`.
- **Dispatch:** the interactive agent's handoff tool is open-ended. The
  interactive agent chooses the target, the message, and whether the target
  session resumes.
- The same `dispatch` tool starts a node and sends a message back to the
  origin. There is no “start new work” versus “return” category.
- `resume: true` is the return-path mechanism. The engine binds it to the
  origin of the input the sender received.
- The dispatching agent is a valid handoff target.
- No separate reply, resume, answer, request-input, or wait tool. No separate
  input endpoint. No `input-required` state for this mechanism.
- `dispatch` mirrors the subagent tool: foreground blocks; `background: true`
  returns an id and notifies; there is no model-facing `dispatch_wait`.
- A second tool for a context-specific handoff variant is a violation.

## A handoff is a message and a target

- A handoff carries a message and has a target. It is not a message kind.
- Do not introduce question, answer, final, response, request, or reply
  categories as separate state, tools, endpoints, or dispatch outcomes.
- `resume` is not a type. It is the rule that a handoff returns to the node
  that supplied the current input. The engine already knows that origin.
- The dispatcher is a target like any other. A node may send it a message;
  the dispatcher may send a message back with `resume: true`.
- `dispatchId` identifies a dispatch/message. It disambiguates multiple
  retained origins; it is not a question handle.
- If a proposed design needs a label, flag, tool, or state to say whether a
  message is a question, answer, final response, or reply, the design is
  wrong.

## Check before proposing

1. Is the behavior sending context or control to an agent?
2. Can the existing node handoff tool, or the existing `dispatch` tool with a
   target and `resume`, express it?
3. Does the engine already know the target from config, the active session, or
   the retained origin?

If yes to any, do not introduce a new tool or endpoint.

## Banned active abstractions

`dispatch_reply`, `dispatch_resume`, `answer`, `request_input`,
`pending question tool`, `pending question state`, `question: true`,
`question.ambiguous`, `handoff.no-pending`, message-kind state (`question`,
`answer`, `final`, `response`), model-facing `dispatch_wait`, separate
question/answer endpoints. These may appear only in historical or removal
notes.
