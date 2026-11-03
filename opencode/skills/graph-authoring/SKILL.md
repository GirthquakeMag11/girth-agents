---
name: graph-authoring
description: The reference for the engine's graph schema and reload contract; load it before authoring or modifying the graph.
---
# Graph authoring reference

The authoritative reference for the one graph's schema, its rules, and the
`reload()` contract. The graph is one JSON manifest plus the Markdown agent
documents it names and the skill documents those agents reference.

Call `graph_info()` for the config path and the graph's workflows, nodes, and
graph agents. Read the config and the agent and skill documents it names, edit
them, then validate.

## Schema

```json
{
  "version": "5",
  "agents": ["agents/builder.md", "agents/reviewer.md"],
  "graph": {
    "maxSteps": 100,
    "workflows": [
      {
        "id": "build-review",
        "entry": "implement",
        "exit": "done",
        "nodes": ["implement", "review", "done"]
      }
    ],
    "nodes": [
      {
        "id": "implement",
        "agent": "builder",
        "objective": "Implement the dispatched work.",
        "maxVisits": 20,
        "handoff": {
          "mode": "unconditional",
          "to": "review",
          "description": "The implementation is ready for review."
        }
      },
      {
        "id": "review",
        "agent": "reviewer",
        "objective": "Review the implementation against the dispatched prompt.",
        "maxVisits": 20,
        "handoff": {
          "mode": "conditional",
          "labels": [
            { "label": "pass", "to": "done", "description": "The work meets the objective; finish." },
            { "label": "fail", "to": "implement", "description": "Name exactly what must change.", "resume": true }
          ]
        }
      },
      {
        "id": "done",
        "agent": "builder",
        "objective": "Finalize the work.",
        "handoff": { "mode": "terminal" }
      }
    ]
  }
}
```

An agent document is Markdown. Frontmatter carries its properties; the body is
its prompt:

```markdown
---
id: builder
model: openrouter/~deepseek/deepseek-flash-latest
mounts: [graph]
tools: [read, edit, shell]
skills: [test-first]
---
Standing instructions for this graph agent.
```

A skill document is Markdown: its id is its filename (`skills/test-first.md`
is skill `test-first`), its frontmatter carries an optional `name` and
`description`, and its non-empty body is its instructions:

```markdown
---
name: Test-first at the seams
description: Build the change test-first.
---
Write the failing test first, make it pass, then refactor within the green.
```

## Rules

- `version` is the string `"5"`.
- `agents` lists Markdown agent document paths relative to the config. Each
  agent document has required `id`, `model`, and `mounts`, and optional `tools`,
  `permissions`, `skills`, `description`, and `subagents`. `tools` lists tool
  names acquired by name — tools are deny-by-default, exactly like skills.
  `permissions` is an optional fine-grained list of `{ action, resource,
  effect }` rules (`effect` one of `allow`, `ask`, `deny`), written block-style
  as `- action:` lines with `*` quoted (`"*"`) — a bare `*` is a YAML alias.
  The body is the agent's prompt; the prompt is not a frontmatter field. Agent
  documents resolve relative to the config; skill ids resolve under `skills/`.
- Each agent document has a required `mounts` list — a non-empty subset of
  `graph`, `primary`, `subagent`, with no assumed default and no duplicates.
  `graph` means it runs as a node's agent inside the engine; `primary` and
  `subagent` name the OpenCode surfaces the plugin materializes.
- A graph agent's optional `skills` array references skill documents by id,
  where the id is the skill's filename under `skills/`. The loader follows
  those ids, deduplicates them, and reads each referenced skill once;
  unreferenced skill files are not read. Unreadable, malformed, or empty skills
  are named faults. The brief appends each resolved skill after the agent's
  prompt.
- There is exactly one `graph`. There is no graph id, no graph selector, and
  no "all graphs." A second graph is not part of this schema.
- The graph has optional `maxSteps`, optional `workflows`, and `nodes`.
- A workflow is a labelled subsection: `id`, `entry`, `exit`, and `nodes`.
  It is a view for reasoning, not a container. The nodes and edges belong
  to the graph; a node may be in more than one workflow. The entry/exit
  must be in the workflow's node list. The engine routes by handoffs, not
  by workflow.
- A node has `id`, an `agent` reference to an agent document's `id`,
  `objective`, optional `budgetMs`, optional `maxVisits` (1–100; use 20 for a
  repair loop), optional `tools` (tool names acquired by name, unioned with the
  agent's), optional `permissions` (`{ action, resource, effect }` rules
  appended after the agent's), and `handoff`. The handoff message is the only
  context carried
  from one node to the next; the dispatch prompt, agent prompt and skills, and
  node objective are repeated in every brief. A node's work product is not an
  engine field. Nodes do not have a session mode.
- Session retention is a **handoff** decision. A non-terminal handoff may
  set `"resume": true`; false or omitted starts a new session. `resume` is
  honored only when the handoff target is the node that supplied the
  current input (the return path). The engine keeps that target session
  alive for the return and deletes it when the dispatch ends. A
  `resume: true` handoff to any other node is a loud defect.
- `handoff` is exactly one of:
  - `{ "mode": "terminal" }` — the node ends after its session succeeds.
  - `{ "mode": "unconditional", "to": "<node>", "description": "...",
    "resume"?: true }` — the engine generates the tool `next`.
  - `{ "mode": "conditional", "labels": [{ "label", "to",
    "description", "resume"?: true }] }` — the engine generates one tool per
    label, named exactly the label. The agent calls exactly one generated
    tool with `{ message }`. A label may set `resume: true` only when its
    target is the node that supplied the current input.
- A handoff target may be a node id or `$dispatcher`. A `$dispatcher` label
  completes the dispatch with its message and cannot set `resume: true`. The
  same generated handoff interface is used; there is no separate reply/resume
  tool.
- No node mixes handoff modes. Every label has one target. There is no
  catch-all.
- Any node may be a dispatch entry point. A workflow may be dispatched at
  its entry. Every node must be able to reach a terminal node or a `$dispatcher`
  completion. Every cycle must carry `maxVisits` on each node in the cycle.
- `workflows[].connections` names other workflows and is transitive.
- `workflows[].strict: true` rejects handoffs outside the main workflow
  and its transitive connections.

## Reload contract

Call `reload()`. Success returns `valid: true` and the graph summary.
Failure returns `valid: false` and the named faults; the old graph stays
active. A reload during an active dispatch is rejected; wait for the dispatch
to finish. Fix every fault before dispatching.

The native dashboard reads the graph and the engine's structured runtime
state.