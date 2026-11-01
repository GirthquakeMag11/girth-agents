# Generated handoff tools — engine feature specification

**Status:** ready for implementation; sliced into `tickets/015`–`019`.  
**Baseline:** engine v1.3.0 currently exposes one `handoff({ label })` tool.  
**Invariants:** `INVARIANTS.md` — one handoff interface; no separate reply,
answer, request-input, or wait tool.  
**Related:** `SPEC.md`, `SUBAGENTS-AND-DISPATCH-INTERACTION-DESIGN.md`.

## 1. Problem

The current handoff tool takes a label argument:

```json
{ "label": "pass" }
```

That is the wrong interface. A graph agent should call a tool named after the
handoff label, with no label argument. The engine generates the tool set from
the active graph, and the agent does not need to know the target or the config
specifics behind the label.

This specification replaces the single tool with generated per-label tools. It
does not define dispatcher responses, return handoffs, subagents, optional
outputs, or the graph configuration architecture.

## 2. Contract

### 2.1 Tool set and names

- The engine derives the unique label names from the active graph's node
  handoffs.
- For every unique label, it generates one OpenCode V2 plugin tool named
  exactly that label.
- An unconditional handoff contributes the label `next`.
- A conditional handoff contributes one label per declared entry.
- A terminal node contributes no handoff tools.
- Labels are exact, case-sensitive tool names and must match
  `^[A-Za-z][A-Za-z0-9_-]*$`. Dots, colons, slashes, whitespace, and other
  characters are config faults.
- A label that collides with an engine control tool name is a config fault at
  load. The engine owns this small reserved set; it is not a copy of
  OpenCode's tool catalog.
- Every other collision—an OpenCode built-in, another plugin's tool, or a
  configured graph-agent tool—is checked by the plugin against the live tool
  catalog at setup. The plugin must not overwrite the existing tool. It
  reports the collision to the engine, and dispatch preflight rejects the
  graph with `handoff.tool-collision`.
- The collision check is not version-pinned. It inspects the tools OpenCode
  actually registered for the location, so an OpenCode update that adds,
  removes, or renames built-ins does not require an engine change.
- If two nodes declare the same label, they share the tool name. The engine
  resolves the target from the active node and session, not from the tool
  definition.
- The per-node label description belongs in the node brief. The generated
  tool's own description is generic.

### 2.2 Input

Every generated handoff tool takes exactly:

```json
{
  "message": "string"
}
```

- `message` is required and must be non-empty after trimming.
- There is no size cap on the handoff message in this feature. The loopback
  control endpoint must accept the full message; a generic control-body cap
  must not reject or truncate a handoff.
- The tool name is the label. There is no `label` argument.
- The tool uses `codemode: false`.

### 2.3 Visibility

At every primary agent-loop model request, a graph agent sees:

- its configured agent tools; plus
- exactly the generated handoff tools declared for its active node.

It does not see another node's generated handoff tools. Configured agent tools
are not filtered by this feature. The interactive agent's control tools are
also untouched.

The mechanism is confirmed by the current OpenCode plugin contract:

- `ctx.session.hook("context", async (event) => ...)` receives `sessionID`,
  `agent`, and a mutable `tools` record; the callback may be async.
- The plugin registers the union of unique label tools at install time.
- At each model request, the context hook asks the engine for the active
  node's handoff labels for `event.sessionID`.
- The plugin removes every generated handoff tool not in that set from
  `event.tools`. It does not remove configured agent tools or interactive
  control tools.
- The engine returns the allowed labels and an active-node/config revision.
  The plugin may cache by session plus revision; without a reliable revision,
  query per model request.
- If the lookup fails, fail closed: remove all generated handoff tools. The
  engine records `handoff.visibility-unavailable` on the active dispatch when
  the lookup handler itself fails, so the dispatch ends with that named defect
  rather than only `handoff.none`. A plugin-side transport failure that never
  reaches the engine falls back to `handoff.none`. Never expose all labels.
- The context hook also verifies that each visible generated label still maps
  to the plugin's own tool definition. If a later registration replaced it,
  the plugin hides that label and reports `handoff.tool-collision`; it never
  executes a tool it did not generate.
- A terminal node's allowed set is empty. A session with no active node, a
  session whose node already handed off, and an unrelated session also get an
  empty set.

The engine exposes a loopback control endpoint for this lookup, working name
`/tool/handoff-tools`, authenticated by the engine token. The plugin must not
recurse into the same model request while asking.

The lookup returns `{ labels, revision }`. `revision` includes the config
generation and the active node, so the plugin may cache by session plus
revision; querying each request is also valid. The plugin uses a short timeout
and fails closed.

The lookup only filters the generated node handoff tools. The dispatching
agent's open-ended handoff tool is `dispatch`; it is not a generated node
handoff tool and is not filtered by this lookup.

The lookup only filters tools that were registered. It cannot add a new label
tool; see §2.9.

### 2.4 Permission

- Every generated handoff tool asserts the existing `handoff` permission
  action.
- There are no per-label permission actions.
- A non-terminal node's session allows `handoff`; a terminal node's session
  does not.
- The graph agent's configured tools remain governed by its own permissions.

### 2.5 Engine acknowledgement

Each generated tool posts to the engine's existing handoff endpoint:

- the tool's label, taken from the tool definition;
- the `message`;
- the call id, message id, and server-provided session id;
- the agent identity.

The engine:

1. binds the call to the active dispatch and its current node;
2. rejects the call if the tool/label is not declared for that node;
3. rejects a second accepted handoff for the same session;
4. records the label, message, call id, and output hash if the node declares
   an output;
5. returns success to the tool.

The engine ignores any model-supplied identity. Unknown, child, and forked
sessions are rejected.

### 2.6 Message propagation

The handoff message is the upstream context for the target. When the label
targets another node, that node's brief includes the message.

The message is engine/dispatch context. It is not written to the activity
history. Existing output verification is unchanged; optional output behavior
is out of scope.

### 2.7 Brief

The brief for a non-terminal node lists its generated handoff tools by name and
description, for example:

```text
Handoff tools:
- pass — the work meets the objective
- fail — the work is unmet; state exactly what must change

Call exactly one of these tools with a message, after writing any declared
output. Do not call more than one handoff tool.
```

The brief must not tell the agent to call `handoff({ label })`.

### 2.8 Removal of the old tool

- Remove the single `handoff({ label })` tool outright.
- Do not keep a compatibility alias.
- A call to a handoff tool not declared for the active node is rejected as
  `handoff.unknown-tool`. It is not a fallback to a label argument and does
  not by itself defect the dispatch.

### 2.9 Reload

A valid reload that changes the graph's unique label set must regenerate the
handoff tool definitions before any new prompt. Existing sessions must not keep
a stale tool catalog.

For the first slice, tools are registered at boot. A reload that adds or
removes labels is rejected with `handoff.tools-stale`; the user restarts the
engine to apply the new label set. Dynamic plugin/tool regeneration can be a
later feature.

The visibility lookup cannot add a label tool that was never registered. If
the label set changes, the plugin/tool catalog must be regenerated. If that
cannot be done safely, the reload is rejected with `handoff.tools-stale`.

A reload that changes only targets, descriptions, or node membership without
changing the unique label set requires no tool regeneration; the next
visibility lookup uses the new revision.

## 3. Errors

Suggested named codes:

- `handoff.unknown-tool` — the tool/label is not declared for the active node;
  the call is rejected and the node may continue.
- `handoff.message-required` — the message argument is missing.
- `handoff.message-empty` — the message is empty or whitespace-only.
- `handoff.multiple` — a second handoff was accepted for the same session.
- `handoff.none` — the session ended without an accepted handoff.
- `handoff.not-last` — a tool call followed the accepted handoff.
- `handoff.tools-stale` — a reload changed labels but the tool surface could
  not be refreshed.
- `handoff.tool-collision` — a generated label collides with a tool OpenCode
  or another plugin already registered; the existing tool is preserved and
  the graph is not dispatchable until the label is renamed.
- `handoff.preflight-unavailable` — the plugin did not report its generated
  tool catalog; dispatch is refused rather than assuming there is no
  collision.
- `handoff.visibility-unavailable` — the engine label lookup failed; generated
  handoff tools were hidden rather than exposing all labels.
- `output.changed` — a declared output changed after acceptance.

Existing output errors remain unchanged.

## 4. Non-goals

- dispatcher-target semantics; a declared dispatcher label still contributes
  a generated tool, but `DISPATCH-RESULT-SPEC.md` owns the target behavior;
- focused response or OpenCode dispatch card;
- dispatcher return handoffs or retained origins;
- graph agent subagents;
- optional node outputs;
- graph configuration architecture or file layout;
- dashboard changes beyond consuming the existing tool/dispatch data.

## 5. Acceptance tests

1. A conditional node with labels `pass` and `fail` exposes exactly `pass` and
   `fail`, not `handoff`.
2. An unconditional node exposes exactly `next`.
3. A terminal node exposes no generated handoff tools.
4. A graph agent's configured tools plus only its active node's handoff tools
   are visible; another node's labels are absent.
5. The context hook receives the session id and can await the engine lookup.
6. The interactive agent's control tools are never removed by the filter.
7. A lookup failure removes all generated handoff tools and produces
   `handoff.visibility-unavailable`; it does not expose all labels.
8. Each generated tool's input schema requires only `message`; no `label`
   argument is accepted.
9. Missing and empty messages are rejected.
10. The tool posts its own label, not a model-supplied label.
11. A declared label records the message and routes to the configured target.
12. The next node's brief includes the upstream handoff message.
13. An undeclared tool call is rejected as `handoff.unknown-tool`.
14. A second accepted handoff is `handoff.multiple`.
15. The old `handoff({ label })` tool is absent.
16. All generated tools use the `handoff` permission; no per-label permission
    is required.
17. A label collision with an engine control tool is rejected at load. A
    collision with an OpenCode built-in or another plugin's tool is detected
    by the plugin at setup, the existing tool is preserved, and dispatch is
    rejected with `handoff.tool-collision`. No version-pinned OpenCode tool
    list is required.
18. A generated label whose definition was replaced after setup is hidden and
    reported as `handoff.tool-collision`; it is never executed.
19. A valid reload that changes labels is rejected with
    `handoff.tools-stale` in the first slice; a reload that changes only
    targets/descriptions refreshes visibility without new tool definitions.
20. Handoff messages have no size cap; empty and whitespace-only messages are
    rejected.
21. The activity history contains no handoff message content.

## 6. Implementation notes

The existing plugin installs one tool in `engine/plugin.mjs`. This feature
replaces that with generated tool definitions derived from the graph label set.
The engine's handoff acknowledgement remains authoritative; only the tool
surface changes.

The collision bridge is version-agnostic:

- the generated plugin embeds the label set and adds the engine control tools
  first;
- at setup it compares each label with `editor.list()`, the tools OpenCode
  actually registered for the location;
- it does not add a colliding label and posts the collision to the engine's
  `/tool/handoff-preflight` endpoint;
- the engine stores the report and rejects dispatch with
  `handoff.tool-collision`;
- the context hook checks that each visible generated label is still the
  plugin's own definition; a mismatch hides the label and reports a
  collision.

No OpenCode built-in tool list is copied into the engine or the plugin.

The visibility bridge is confirmed:

- register the union of label tools at plugin install;
- register `ctx.session.hook("context", async (event) => ...)`;
- call the engine's `/tool/handoff-tools` endpoint with `event.sessionID` and
  the engine token;
- receive `{ labels, revision }`;
- delete every generated label tool not in `labels` from `event.tools`;
- leave configured agent tools and interactive control tools untouched;
- cache by session plus revision, or query each request;
- on lookup failure, fail closed.

The engine derives the active node from its session map. It returns the active
node's labels for a running graph agent and an empty set for terminal,
post-handoff, unknown, and unrelated sessions. The dispatching agent's
open-ended `dispatch` tool is outside this lookup. A label-set change still
requires plugin/tool regeneration; the lookup only filters.
