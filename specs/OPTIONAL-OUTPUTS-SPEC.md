# Optional node outputs — engine feature specification

**Status:** ready for implementation; sliced into `tickets/020`–`022`.  
**Baseline:** engine v1.3.0 requires every node to declare and write an output
file.  
**Invariants:** `INVARIANTS.md` — one handoff interface; no separate reply,
answer, request-input, or wait tool.  
**Related:** `SPEC.md`, `specs/HANDOFF-TOOLS-SPEC.md`,
`specs/DISPATCH-RESULT-SPEC.md`,
`SUBAGENTS-AND-DISPATCH-INTERACTION-DESIGN.md`.

## 1. Problem

The current engine treats an output file as a universal node contract. That
prevents read-only graph agents and message-only nodes from participating, and
it makes a handoff message secondary to a file.

The target is:

- `output` is optional on a node;
- a declared output keeps the existing verification;
- an omitted output means the engine verifies no file;
- the handoff message can be the deliverable.

## 2. Contract

### 2.1 Node configuration

A node's `output` is optional.

- If present, it must be a relative path with no `..` and no NUL.
- If absent, the node has no output artifact.
- The config validator must accept both forms.
- Existing `outputRoot` behavior applies only to nodes that declare an output.

### 2.2 Declared output

If a node declares `output`:

- the brief includes the exact absolute output path;
- the node must write a non-empty regular file;
- the handoff acknowledgement checks the file exists, is a file, and is
  non-empty;
- the engine records `{ path, bytes, hash }`;
- after idle, the file must be unchanged from the accepted hash;
- existing errors remain: `output.missing`, `output.not-file`, `output.empty`,
  `output.check`, and `output.changed`.

Declaring an output is a node choice, not an engine-wide requirement.

### 2.3 Omitted output

If a node does not declare `output`:

- the brief contains no output path and does not ask for a file;
- the handoff acknowledgement performs no file check;
- the dispatch records `output: null` and no output hash;
- no `output.*` defect is raised for that node;
- the generated handoff tool's `{ message }` is the deliverable.

A node with no output can still hand off to another node; the message is the
upstream context for the target.

### 2.4 Terminal nodes

A terminal node may complete without an output file.

- If it declares an output, existing terminal verification applies.
- If it omits output, the dispatch completes with no output artifact and no
  response content beyond the completion itself.
- A graph that needs a terminal response should use a dispatcher-target
  handoff or declare an output.

### 2.5 Dispatcher handoff

A dispatcher-target handoff may complete with its message and no output file.
The response is the handoff message, as defined by
`specs/DISPATCH-RESULT-SPEC.md`.

If the node also declares an output, the output record is preserved in the
snapshot, but the response remains the handoff message. The dispatcher-target
response source and its verification are owned by `DISPATCH-RESULT-SPEC.md`;
this feature only removes the output-file requirement.

### 2.6 Brief and snapshot

- The brief includes an `# Output` section only when the node declares an
  output.
- When omitted, the brief must not mention an output path or require one.
- The dispatch snapshot carries `output: null` for a node with no output.
- The dashboard/details must tolerate a null output path.

### 2.7 Read-only graph agents

A graph agent whose configured tools do not include edit/write can participate
when its node has no output. It can read, inspect, and hand off with a message.
This feature does not add write access.

### 2.8 Reload

A valid reload must accept nodes with declared or omitted output. A node that
changes from declared to omitted, or vice versa, follows the new config on the
next node activation.

## 3. Errors

Existing output errors remain for declared outputs. No new output error is
raised for an omitted output.

Suggested config error remains `schema.path` for an invalid declared path.

## 4. Non-goals

- changing handoff tools or message requirements;
- choosing the dispatch response source;
- OpenCode dispatch-card rendering;
- graph agent subagents;
- graph configuration architecture or file layout;
- per-dispatch output isolation or archives;
- dashboard redesign;
- persisted output content.

## 5. Acceptance tests

1. A node with no `output` can hand off with `{ message }`; no file is checked.
2. The next node's brief includes the handoff message and no upstream output
   path when the source had none.
3. A node with a declared output preserves the existing existence, non-empty,
   hash, and post-handoff unchanged checks.
4. A declared output that is missing, not a file, empty, or changed produces
   the existing defect.
5. A terminal node with no output completes without an output record.
6. The brief omits the output section for a node with no output.
7. The snapshot carries `output: null` for a node with no output.
8. A read-only graph agent can complete a node with no output.
9. Config reload accepts both declared and omitted output.
10. An invalid declared output path is still rejected.

Dispatcher-target response cases are verified by
`specs/DISPATCH-RESULT-SPEC.md`, not here.

## 6. Implementation notes

The relevant current points are:

- `engine/config.mjs` validates `node.output` as required and `outputPathFor`
  resolves it;
- `engine/brief.mjs` always adds an output section;
- `engine/executor.mjs` always calls `checkOutput` at terminal and handoff
  boundaries.

The change is to make the output path nullable through those paths. Declared
outputs keep the existing code path unchanged; omitted outputs skip the check
and hash.

`outputRoot` remains meaningful only when at least one node declares an output.
