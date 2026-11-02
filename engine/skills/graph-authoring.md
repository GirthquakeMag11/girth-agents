---
name: graph-authoring
description: Author or modify the engine's graph config, validate it with reload, and fix named faults.
---
# Graph authoring

The engine runs agent nodes. A node's graph agent receives a prompt, writes
any declared output, and calls exactly one generated handoff tool to the next
target. The graph is one JSON manifest plus the Markdown agent documents it
names and the skill documents those agents reference.

## Start

Call `graph_info()` first. It returns the config path and the one graph's
workflows, nodes, and graph agents. Read the config and agent documents. Edit
them. Then call `reload()`. If `reload` returns `valid: false`, read the named
faults, fix them, and reload again. A reload during an active dispatch is
rejected; wait for the dispatch to finish.

Do not edit the engine's plugin, runtime skills, or source. Edit the graph
config, agent documents, and graph skill documents.

## Schema

```json
{
  "version": "4",
  "agents": ["agents/builder.md", "agents/reviewer.md"],
  "graph": {
    "outputRoot": "work",
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
        "output": "implementation.md",
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
        "output": "review.md",
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
        "objective": "Finalize the work and write the final report.",
        "output": "final.md",
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
agent: build
permissions: [read, edit, shell]
skills: [skills/test-first.md]
---
Standing instructions for this graph agent.
```

A skill document is Markdown with frontmatter and a non-empty instruction body:

```markdown
---
id: test-first
name: Test-first at the seams
description: Build the change test-first.
---
Write the failing test first, make it pass, then refactor within the green.
```

## Rules

- `version` is the string `"4"`.
- `agents` lists Markdown agent document paths relative to the config. Each
  agent document has required `id`, `model`, and `permissions`, optional
  `agent` (the OpenCode agent to run, default `build`), and optional `skills`
  references. The body is the agent's prompt; the prompt is not a frontmatter
  field. Agent and skill paths resolve relative to the config.
- A graph agent's optional `skills` array references skill document paths.
  Each skill needs a unique `id` and a non-empty instruction body. The loader
  follows those references, deduplicates them, and reads each referenced skill
  once; unreferenced skill files are not read. Unreadable, malformed,
  duplicate, or empty skills are named faults. The brief appends each resolved
  skill after the agent's prompt.
- There is exactly one `graph`. There is no graph id, no graph selector, and
  no "all graphs." A second graph is not part of this schema.
- The graph has optional `outputRoot` (default `"."`), optional `maxSteps`,
  optional `workflows`, and `nodes`.
- A workflow is a labelled subsection: `id`, `entry`, `exit`, and `nodes`.
  It is a view for reasoning, not a container. The nodes and edges belong
  to the graph; a node may be in more than one workflow. The entry/exit
  must be in the workflow's node list. The engine routes by handoffs, not
  by workflow.
- A node has `id`, an `agent` reference to an agent document's `id`,
  `objective`, `output` (optional relative path), optional `budgetMs`, optional
  `maxVisits` (1–100; use 20 for a repair loop), and `handoff`. A node may omit
  `output`; its handoff `{ message }` is the deliverable. Nodes do not have a
  session mode.
- Session retention is a **handoff** decision. A non-terminal handoff may
  set `"resume": true`; false or omitted starts a new session. `resume` is
  honored only when the handoff target is the node that supplied the
  current input (the return path). The engine keeps that target session
  alive for the return and deletes it when the dispatch ends. A
  `resume: true` handoff to any other node is a loud defect.
- `handoff` is exactly one of:
  - `{ "mode": "terminal" }` — the node ends after writing any declared
    output.
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
  its entry. Every node must be able to reach a terminal target. Every cycle
  must carry `maxVisits` on each node in the cycle.
- `output` is optional; if declared, it must be a relative path with no `..`.
- `workflows[].connections` names other workflows and is transitive.
- `workflows[].strict: true` rejects handoffs outside the main workflow
  and its transitive connections.

## After editing

Call `reload()`. Success returns `valid: true` and the graph summary.
Failure returns `valid: false` and faults; the old graph stays active.
Fix every fault before dispatching.

The same map/table is written to `GRAPH.md` on every valid reload. The
native dashboard reads the graph and the engine's structured runtime state;
the interim `/graph` command and `graph-view` agent are removed.
