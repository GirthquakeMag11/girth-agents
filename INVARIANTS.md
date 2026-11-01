# Design invariants

Hard rules. Check every proposed tool, endpoint, state, or abstraction against
these before writing it down.

## One handoff mechanism

- A handoff is a message and a target. It is not a message kind.
- A node handoff tool is preconfigured by the node; the tool name is the label;
  the input is `{ message }`.
- `dispatch` is the interactive agent's open-ended handoff tool. The same tool
  starts a node and sends a message back to a retained origin.
- `resume: true` returns to the origin of the input the sender received. The
  engine already knows that origin.
- `dispatchId` identifies a dispatch. It disambiguates retained origins; it is
  not a question or answer handle.
- The dispatcher is a valid handoff target. A `$dispatcher` label completes the
  dispatch and cannot set `resume: true`.
- No separate reply, resume, answer, request-input, or wait tool. No separate
  input or question endpoint. No `input-required` state.
- `dispatch` mirrors the subagent tool: foreground blocks; `background: true`
  returns an id and notifies; there is no model-facing `dispatch_wait`.
- A second tool for a context-specific handoff variant is a violation.

## No message-kind taxonomy

Do not introduce question, answer, final, response, request, or reply
categories as separate state, tools, endpoints, or dispatch outcomes. A handoff
message is context. If a design needs a flag, label, tool, or state to say what
kind of message it is, the design is wrong.

## Configuration names

- The graph-agent collection is `agents`.
- A node's reference to a graph-agent entry is `agent`.
- Do not use `helpers`, `graphAgents`, or another alias.
- The engine-owned tool names are reserved as labels. OpenCode built-ins and
  other plugin tools are checked against the live catalog, never a copied
  version list.

## Skills are first-class

- A skill is a Markdown document with a unique `id` and a non-empty instruction
  body. The top-level `skills` array declares the documents; a graph agent's
  optional `skills` array references them.
- The loader resolves and validates skills, and the brief appends each resolved
  skill after the agent's `craft`.
- Removing one skill file is not removing skill support. Do not remove the
  `skills` schema field, loader, or brief injection without explicit approval.

## Check before proposing

1. Is the behavior sending context or control to an agent?
2. Can the existing node handoff tool, or the existing `dispatch` tool with a
   target and `resume`, express it?
3. Does the engine already know the target from config, the active session, or
   a retained origin?

If yes to any, do not introduce a new tool or endpoint.

## Banned active abstractions

`dispatch_reply`, `dispatch_resume`, `answer`, `request_input`,
`pending question tool`, `pending question state`, `question: true`,
`question.ambiguous`, `handoff.no-pending`, message-kind state (`question`,
`answer`, `final`, `response`), model-facing `dispatch_wait`, separate
question/answer endpoints. These may appear only in historical or removal
notes.
