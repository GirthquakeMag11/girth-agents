# Dispatch result and lifecycle — engine feature specification

**Status:** ready for implementation; sliced into `tickets/023`–`026`.  
**Baseline:** engine v1.3.0 returns JSON and exposes a separate `dispatch_wait`
tool for background work.  
**Invariants:** `INVARIANTS.md` — one handoff interface; no separate reply,
answer, request-input, or wait tool.  
**Related:** `SPEC.md`, `specs/HANDOFF-TOOLS-SPEC.md`,
`specs/RETURN-HANDOFF-SPEC.md`,
`SUBAGENTS-AND-DISPATCH-INTERACTION-DESIGN.md`.

## 1. Problem

A graph dispatch should use the same usage pattern as the OpenCode subagent
tool:

- foreground is the default and blocks until the result;
- `background: true` returns an id immediately and notifies the interactive
  session when the dispatch finishes;
- there is no separate “put it in the background, then wait in the foreground”
  tool.

The current `dispatch_wait` surface is backward. This specification removes it
from the model-facing tool set and defines the focused dispatch result and
background notification.

## 2. Contract

### 2.1 Dispatch surface

```json
{
  "node": "node-a",
  "prompt": "The complete work item.",
  "background": false,
  "resume": false,
  "dispatchId": "d-1"
}
```

or the same shape with `workflow`. Exactly one of `node` or `workflow` is
required.

- `background` is optional and defaults to `false`.
- `resume` is optional and defaults to `false`.
- `dispatchId` is optional and valid only with `resume: true`. It identifies
  the source dispatch when more than one retained origin targets the same
  node. Omit it when one origin matches; if several match and it is omitted,
  the return feature rejects the call with `handoff.ambiguous`.
- Foreground dispatch blocks until the dispatch reaches a terminal state and
  returns the focused result or defect.
- `background: true` returns immediately with the dispatch id and initial
  state. The engine notifies the dispatching session when the dispatch
  finishes.
- The model-facing `dispatch_wait` tool is removed. Internal engine waiting may
  remain for foreground implementation; it is not a graph agent or interactive
  agent tool.
- `dispatch_status` remains as a read-only diagnostic snapshot.

`dispatch` is the interactive agent's open-ended handoff tool. `resume: true`
is the same tool's return form: it targets the origin of the sender's received
input, delivers the prompt as the message, and resumes that origin's session.
Use `dispatchId` when the node target is ambiguous across retained origins. It
is not a separate reply or answer tool. `workflow` plus `resume: true` is
invalid, and `dispatchId` without `resume: true` is invalid. A resume target
that is not the origin is `resume.not-return`; an ambiguous origin is
`handoff.ambiguous`. The return handoff spec owns retention and binding.

### 2.2 Dispatcher handoff

A node label may target the dispatching agent. The reserved target literal is
`$dispatcher`, and the config validator accepts it wherever a handoff `to`
accepts a node id. That label is a valid generated handoff target from
`specs/HANDOFF-TOOLS-SPEC.md`. A `$dispatcher` label may not set
`resume: true`; `resume` is the return-to-origin rule and the dispatcher is not
a node. The return handoff spec retains the source session.

A dispatcher handoff:

- completes the dispatch;
- does not require a terminal node;
- carries the handoff message as the focused response;
- identifies the handing node and label;
- preserves any declared output record, without making the output file the
  response.

The return lifecycle is out of scope here; the dispatch tool's `resume: true`
form is the same open-ended handoff used to send a message back to the origin.
See `specs/RETURN-HANDOFF-SPEC.md`.

### 2.3 Completed result

Foreground success returns a focused display by default. The raw snapshot
carries:

```json
{
  "dispatchId": "d-1",
  "state": "completed",
  "node": "node-b",
  "workflow": "flow-a",
  "handoff": {
    "from": "node-b",
    "label": "pass",
    "message": "The review passed."
  },
  "result": {
    "response": "The review passed.",
    "responseTruncated": false
  },
  "usage": {
    "cost": 0.0123,
    "tokens": { "input": 0, "output": 0 }
  }
}
```

- `result.response` is the handoff message, UTF-8, capped at 16 KiB.
- If capped, set `responseTruncated: true` and mark the display.
- `output` remains `{ path, bytes, hash }` when the handing node declares an
  output. Optional node outputs are a separate feature.
- The response is not written to activity history.

### 2.4 Defect, cancellation, and queued/running results

- A defect result carries `state: "defect"` and `defect: { code, message }`.
- A cancelled dispatch carries `state: "cancelled"` and no defect.
- A background dispatch started successfully carries the dispatch id and its
  initial `queued` or `running` state.
- A diagnostic status can return a queued/running snapshot without waiting.

### 2.5 Focused display

The default presentation is a focused response, not raw JSON. The display
formatter renders:

- the response content, if any;
- a compact footer with dispatch id, state, terminal/handing node, visits,
  cost, tokens, and elapsed time;
- a defect code and message for a defect;
- a short queued/running line for a diagnostic snapshot.

A completed display must not be a serialized snapshot. Raw JSON is available
only through diagnostics.

### 2.6 Background notification

When a background dispatch completes, defects, or is cancelled, the engine
pushes one notification into the dispatching interactive session.

- The notification contains the same focused display as a foreground result.
- It is delivered as a session notification, not as a tool result the agent
  must poll for.
- Exactly one terminal notification is delivered per background dispatch.
- If the dispatching session no longer exists, the notification is dropped;
  the dispatch still completes and `dispatch_status` remains available.
- A notification failure must not change the dispatch outcome.
- A background dispatch that retains an origin for a return message is owned
  by the return handoff feature; this specification does not define that
  notification.

The notification transport mirrors OpenCode's background subagent completion:
the plugin waits on the engine's internal wait endpoint and posts a
`session.synthetic` message to the dispatching session. It is not a prompt and
does not trigger a model-facing polling tool. The text carries the focused
display inside a graph-dispatch marker; metadata identifies the dispatch id,
state, and target. The observable contract is a focused message arriving in the
dispatching session without a `dispatch_wait` call.

### 2.7 Diagnostic status

`dispatch_status({ dispatchId, raw? })`:

- default: focused display of the current state;
- `raw: true`: the structured snapshot;
- never waits;
- works for foreground and background dispatches.

`dispatch` foreground may use the internal wait endpoint; the interactive
agent never calls a wait tool.

## 3. Errors

Suggested named codes:

- `dispatch.invalid-background` — `background` is not a boolean.
- `dispatch.invalid-resume` — `resume` is used with `workflow`, or `dispatchId`
  is used without `resume: true`.
- `dispatch.invalid-dispatch-id` — `dispatchId` is present but is not a
  non-empty string.
- `dispatch.notification-failed` — a background notification could not be
  delivered; log it, but keep the dispatch result.
- `handoff.ambiguous` and `resume.not-return` are owned by
  `specs/RETURN-HANDOFF-SPEC.md`.
- Existing dispatch-target, prompt, and dispatch-id errors remain.

## 4. Non-goals

- retained-origin state, origin binding, and resumable sessions; the
  `resume`/`dispatchId` surface is defined here, but
  `specs/RETURN-HANDOFF-SPEC.md` owns its behavior;
- OpenCode dispatch-card rendering (separate spec);
- graph agent subagents;
- optional node outputs;
- graph configuration architecture;
- dashboard changes beyond consuming the actual result;
- persisted dispatch history or run archive.

## 5. Acceptance tests

1. Foreground `dispatch` blocks and returns a focused display, not JSON.
2. `background: true` returns an id immediately; the dispatch continues.
3. A background completion delivers one synthetic session notification to the
   dispatching session with the focused display; it is not a prompt.
4. Background defect and cancellation each deliver one notification.
5. A missing dispatching session drops the notification but does not change
   the dispatch.
6. There is no model-facing `dispatch_wait` tool.
7. `dispatch_status` returns a focused display by default and a structured
   snapshot with `raw: true`; it never waits.
8. A dispatcher handoff completes without a terminal node and returns the
   handoff message as `result.response`.
9. A response over 16 KiB is truncated and marked.
10. A declared output record remains in the snapshot; the response is the
    handoff message.
11. Activity history contains no response or handoff message content.
12. A dispatcher handoff with a declared output still returns the handoff
    message as the response, not the output content; optional output behavior
    remains out of scope.
13. `$dispatcher` is accepted as a handoff target in config, and
    `resume: true` on a `$dispatcher` label is rejected.
14. `dispatchId` is accepted only with `resume: true`; `workflow` plus
    `resume: true` and `dispatchId` without `resume` are rejected.
15. A resume target that is not the origin is `resume.not-return`; multiple
    matching origins without `dispatchId` is `handoff.ambiguous`. These are
    cross-feature checks verified by `specs/RETURN-HANDOFF-SPEC.md`.

## 6. Implementation notes

The current plugin exposes `dispatch_wait` in `engine/plugin.mjs`. Remove that
tool from the model-visible control surface. The `dispatch` tool takes
`background`, `resume`, and optional `dispatchId`; it no longer takes `wait` or
`timeoutMs`. Foreground calls the internal wait endpoint after enqueueing and
returns the focused display. Background returns the id immediately; the plugin
starts one internal wait and posts the terminal display with
`ctx.session.synthetic` for the dispatching session. The engine stores the
dispatching session id on the dispatch record.

The engine's `$dispatcher` handoff target is a sentinel in config validation
and routing. A handoff to it completes the dispatch with `result.response` from
the message and no terminal node. The display formatter is a pure function
shared by foreground, background, and `dispatch_status`. The raw snapshot
remains available with `dispatch_status({ raw: true })`.
