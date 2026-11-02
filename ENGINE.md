# Engine contract

Current behavior only. Future work lives in `ROADMAP.md`; hard rules live in
`INVARIANTS.md`.

## 1. Shape

The engine is one process per workspace. It attaches to the OpenCode background
service through `~/.local/state/opencode/service.json` (or
`OPENCODE_SERVICE_FILE`). It owns one graph, one active dispatch, and an
in-memory FIFO queue. No durable dispatch state or history survives a restart.

The engine writes and regenerates:

- `.opencode/plugins/engine-handoff/` — the generated handoff tools and the
  interactive control tools;
- `.opencode/skills/{graph-authoring,dispatching}/SKILL.md`;
- `GRAPH.md` — Mermaid map, workflow table, node table, legend.

The plugin reaches the engine through a loopback HTTP control endpoint with a
per-boot token. The engine also speaks JSON-lines on stdio for development and
proof. The workspace is the engine's working directory; config and generated
files resolve against it.

### Versioning

The project version covers the engine and dashboard. It means design/readiness:
`1.0.0` is reserved for the original v1 target, not for the current
implementation. It is not bumped for individual corrections. The generated
`engine-handoff` plugin inherits the project version of the engine that created
it; it is not independently versioned.

The graph schema version in the config is a format version. It increments when
the on-disk shape changes incompatibly and does not imply design progress. The
two numbers are independent.

## 2. Configuration

The graph is one JSON manifest plus the Markdown agent documents it names and
the skill documents those agents reference. Schema version is the string `"5"`.

```json
{
  "version": "5",
  "agents": ["agents/builder.md", "agents/reviewer.md"],
  "graph": {
    "maxSteps": 100,
    "workflows": [],
    "nodes": []
  }
}
```

The top-level keys are `version`, `agents`, and `graph`. There is no top-level
`skills`, no `helpers`, and no `graphAgents`. A node's `agent` field references
an agent document's `id`.

An agent is a Markdown document. Its frontmatter carries its properties and its
body is its prompt:

```markdown
---
id: builder
model: provider/model
agent: build
permissions: [read, edit, shell]
skills: [skills/test-first.md]
---
Standing instructions.
```

An agent document has:

- `id` — required and unique among agent documents;
- `model` — required, `provider/model`;
- optional `agent` — the OpenCode agent to run (default `build`);
- `permissions` — required, non-empty action names;
- optional `skills` — skill document paths.

The body is the agent's prompt; an empty body means no standing prompt. The
prompt is not a frontmatter field. Unknown fields are faults.

Agent document paths and agent skill references resolve relative to the graph
config file. The loader reads every listed agent, follows its skill references,
deduplicates by resolved path, reads and validates each referenced skill once,
and attaches the resolved skills before the config is usable. Skill files that
no agent references are not read.

A skill document is Markdown with frontmatter and a non-empty instruction body:

```markdown
---
id: test-first
name: Test-first at the seams
description: Build the change test-first.
---
Write the failing test first, make it pass, then refactor within the green.
```

Each skill needs a unique non-empty `id` and a non-empty body. A missing
referenced skill is `skill.unreadable`; malformed frontmatter, missing ids,
duplicate ids, and empty instructions are named faults. Each resolved skill is
appended to the brief as `# Skill: <id>` after the agent's prompt and before
the work prompt.

A node has:

- `id`
- `agent` — reference to an agent document's `id`
- `objective`
- optional `budgetMs`
- optional `maxVisits` (1–100; the engine hard ceiling is 100)
- `handoff`

A handoff is exactly one of:

- `terminal` — no handoff tool; the node ends after its session succeeds.
- `unconditional` — one target; generated tool `next`.
- `conditional` — one tool per declared label, named exactly the label.

A dispatcher target is the reserved literal `$dispatcher`. It may be used in
`unconditional.to` or a conditional label's `to`. A `$dispatcher` label cannot
set `resume: true`. `$dispatcher` is not a node id.

The config is strict; unknown fields are faults. There is exactly one graph.
Workflows are labelled subsections:

```json
{
  "id": "build-review",
  "entry": "implement",
  "exit": "done",
  "nodes": ["implement", "review", "done"],
  "connections": [],
  "strict": false
}
```

Workflows are views for reasoning and optional dispatch boundaries. The engine
routes by handoffs, never by workflow. A workflow dispatch may enter its main
workflow and any transitively connected workflow; `strict: true` makes a
handoff outside that set a `workflow.escape` defect. Every node must reach a
terminal or dispatcher completion, and every cycle must carry `maxVisits`.

`reload` validates and swaps a config only while no dispatch is active. A
reload that changes the unique handoff label set is rejected with
`handoff.tools-stale`; the old config and generated tools stay in place. Other
valid changes swap, reread agent and skill documents, and regenerate
`GRAPH.md`.

## 3. Tools

Each unique label becomes one generated OpenCode tool. The tool name is the
label; its input is exactly `{ "message": "string" }`; it uses
`codemode: false` and the `handoff` permission. A graph agent sees only the
generated labels for its active node, plus its configured tools. An accepted
handoff must be the node's last tool call and may happen only once.

The interactive agent has:

- `dispatch({ node?, workflow?, prompt, background?, resume?, dispatchId? })`
- `dispatch_status({ dispatchId, raw? })`
- `dispatch_cancel({ dispatchId })`
- `reload()`
- `graph_info()`
- `graph_map()`

Exactly one of `node` or `workflow` is required. `background` defaults to
false. Foreground blocks until completion, defect, or cancellation.
`background: true` returns the dispatch id immediately and delivers one
synthetic session notification on the terminal state. `dispatch_status` returns
a focused display by default and the structured snapshot with `raw: true`.
There is no model-facing `dispatch_wait` tool.

`resume: true` is the same dispatch tool's return form. It requires a `node`
target that is the origin of the input the sender received, plus `sessionID`
from the interactive session. `dispatchId` identifies the source dispatch when
more than one retained origin matches. The prompt becomes the upstream message
and the source session resumes in place. Missing/blank/wrong sender, wrong
node, ambiguous origin, and stale origin are rejected. `workflow` plus
`resume`, `background` plus `resume`, and `dispatchId` without `resume` are
invalid.

## 4. Lifecycle

A dispatch creates or resumes a session, sends one brief, waits for idle, and
verifies:

- the session outcome is `succeeded`;
- the accepted handoff is declared for the active node;
- the handoff is the last tool call and no tool finished after acceptance.

The brief contains the graph agent's prompt, any attached skill instructions,
dispatch prompt, node objective, upstream message, and the active node's
generated handoff tools with descriptions. A node's work product is not part of
the brief contract; the handoff message is the context carried to the next node.

A node with a terminal handoff completes after its session succeeds. The
completion carries no engine-defined work product. A `$dispatcher` handoff
completes with `terminal: null`, records the handoff message, and returns the
message as `result.response` capped at 16 KiB of UTF-8. The source session is
retained as the origin for a return message. A failed or cancelled dispatcher
handoff does not retain it. `dispatch_cancel` on a retained origin discards the
origin and deletes the session.

Errors are named. Key codes: `handoff.unknown-tool`, `handoff.message-required`,
`handoff.message-empty`, `handoff.multiple`, `handoff.none`,
`handoff.not-last`, `handoff.tool-collision`, `handoff.tools-stale`,
`handoff.visibility-unavailable`, `resume.not-return`, `handoff.ambiguous`,
`handoff.stale`, `workflow.escape`, `agent.unreadable`, `agent.frontmatter`,
`agent.missing-id`, `agent.duplicate-id`,
`skill.unreadable`, `skill.frontmatter`, `skill.missing-id`,
`skill.duplicate-id`, `skill.instructions`.

## 5. Dashboard

The native dashboard is a full-screen, read-only OpenCode panel. It shows the
configured nodes, workflows, handoffs, and labels; active and queued dispatches;
workflow engagement and escapes; Details for active work; and a bounded History.
It uses native OpenTUI components and theme tokens, not a character canvas.

`$dispatcher` is a completion target, not a graph node. It appears in the node
contract, result, and history, but is excluded from the connector layout so it
cannot create a phantom node or route. The dashboard does not edit, dispatch,
cancel, or change the session.

## 6. Proof

```sh
cd engine && node --test test/*.test.mjs
cd dashboard && node --test test/*.test.mjs
node engine/live-proof.mjs
node dashboard/proof/live.mjs 2>&1 | tee dashboard/proof/live-proof.log
```

The engine live proof uses the real OpenCode service and plugin. The dashboard
proof covers the runnable boundary fixtures and the native panel captures.

## 7. Trust boundary

The handoff contract is enforced by the engine, not by OpenCode. It is not a
security boundary against a graph agent with unrestricted filesystem or shell
access: such an agent can read the service registration or engine token, or
rewrite the plugin. Run adversarial graph agents in a separate UID/container
with only the workspace writable. v1 assumes cooperative graph agents.
