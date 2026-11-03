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

## Work product is not engine state

The engine owns routing and handoff context. It does not define, locate, verify,
hash, or display the shape of a node's work product. A graph that wants a file
artifact asks for it in its prompt or agent instructions; it is not a schema
field, a dispatch record, or a dashboard field.

## Configuration names

- Agents, skills, and nodes are Markdown documents discovered by directory; a
  document's id is its filename (`agents/builder.md` is agent `builder`). The
  config has no agent list and no inline nodes.
- A node's reference to a graph agent is `agent`, and it names the agent
  document's id (its filename).
- A graph agent is a Markdown document: its frontmatter carries its properties
  and its body is its prompt.
- A graph agent's `skills` field references skill documents directly. There is
  no top-level skill catalog.
- Do not use `helpers`, `graphAgents`, or another alias.
- The engine-owned tool names are reserved as labels. OpenCode built-ins and
  other plugin tools are checked against the live catalog, never a copied
  version list.

## Skills are first-class

- A skill is a Markdown document with a unique `id` and a non-empty instruction
  body. A graph agent's optional `skills` array references those documents.
- The loader follows agent skill references, deduplicates and validates the
  referenced documents, and attaches them to the agent. The brief carries the
  resolved skills; the agent's body is the node session's system prompt (see
  body-as-system), never the brief.
- Unreferenced skill files are not loaded.
- Removing one skill file is not removing skill support. Do not remove the
  agent `skills` field, the reference-driven loader, or brief injection without
  explicit approval.
- The shipped graph using zero skills does not make the capability optional. A
  schema feature is not removed because the current example does not exercise
  it. Do not infer a feature cut from an empty example or an omitted mention in
  a rewrite spec.

## Agents mount; they are not cloned

- An agent is one Markdown document: frontmatter properties plus a prompt
  body. There is no separate graph-agent schema and OpenCode-agent schema.
- Graph agent, primary agent, and subagent are **mounts** — where the agent is
  accessible — not distinct kinds. The same document mounts in more than one
  place.
- Moving an agent between mounts is a keyword change in one place, not a
  rewrite, a copy, or a convention the user must relearn per surface.
- The graph-engine materializes OpenCode's platform artifacts (agent files,
  skills) from these documents. Users author graph-engine documents; they do
  not hand-author OpenCode `agent`/`mode` files, reproduce an inherited base
  prompt, or write a per-agent plugin to express a mount.
- Agent composition is layered, not monolithic: identity, operational
  discipline, and role are separate pieces the materializer assembles.
  Changing one piece must not force the user to re-express the others.
- OpenCode's native agent mechanics (opaque base-prompt inheritance and
  replacement, plugin-owned "mode" behavior, strict RPC shapes) are
  implementation details behind the materializer, never user surface. Do not
  leak them.

## Check before proposing

1. Is the behavior sending context or control to an agent?
2. Can the existing node handoff tool, or the existing `dispatch` tool with a
   target and `resume`, express it?
3. Does the engine already know the target from config, the active session, or
   a retained origin?
4. Would the proposal define a new kind of agent instead of a new place to
   mount the one agent document?

If yes to any, do not introduce a new tool, endpoint, or agent kind.

## Banned active abstractions

`dispatch_reply`, `dispatch_resume`, `answer`, `request_input`,
`pending question tool`, `pending question state`, `question: true`,
`question.ambiguous`, `handoff.no-pending`, message-kind state (`question`,
`answer`, `final`, `response`), model-facing `dispatch_wait`, separate
question/answer endpoints. These may appear only in historical or removal
notes.
