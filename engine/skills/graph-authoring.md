---
name: graph-authoring
description: Author or modify the engine's JSON graph config, validate it with reload, and fix named faults.
---
# Graph authoring

The engine runs agent nodes. A node sends a prompt to an agent, the agent
writes an output file, and the agent pulls exactly one handoff lever to the
next node. The graph is a single JSON file.

## Start

Call `graph_info()` first. It returns the config path and the one graph's
workflows, nodes, and helpers. Read the config file. Edit it. Then call
`reload()`. If `reload` returns `valid: false`, read the named faults, fix
them, and reload again. A reload during an active dispatch is rejected; wait
for the dispatch to finish.

Do not edit the engine's plugin, skills, or source. Edit only the config
file.

## Schema

```json
{
  "version": "3",
  "helpers": [
    {
      "id": "builder",
      "model": "openrouter/~deepseek/deepseek-flash-latest",
      "agent": "build",
      "permissions": ["read", "edit", "shell"],
      "craft": "Standing instructions for this helper."
    }
  ],
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
        "helper": "builder",
        "objective": "Implement the dispatched work.",
        "output": "implementation.md",
        "session": "resume",
        "maxVisits": 20,
        "handoff": {
          "mode": "unconditional",
          "to": "review",
          "description": "The implementation is ready for review."
        }
      },
      {
        "id": "review",
        "helper": "reviewer",
        "objective": "Review the implementation against the dispatched prompt.",
        "output": "review.md",
        "session": "fresh",
        "maxVisits": 20,
        "handoff": {
          "mode": "conditional",
          "labels": [
            { "label": "pass", "to": "done", "description": "The work meets the objective; finish." },
            { "label": "fail", "to": "implement", "description": "Name exactly what must change." }
          ]
        }
      },
      {
        "id": "done",
        "helper": "builder",
        "objective": "Finalize the work and write the final report.",
        "output": "final.md",
        "session": "fresh",
        "handoff": { "mode": "terminal" }
      }
    ]
  }
}
```

## Rules

- `version` is the string `"3"`.
- There is exactly one `graph`. There is no graph id, no graph selector, and
  no "all graphs." A second graph is not part of this schema.
- A helper has `id`, `model` as `provider/model`, optional `agent`
  (default `build`), `permissions` as a non-empty array of real action
  names (`read`, `edit`, `shell`), and optional `craft`.
- The graph has optional `outputRoot` (default `"."`), optional `maxSteps`,
  optional `workflows`, and `nodes`.
- A workflow is a labelled subsection: `id`, `entry`, `exit`, and `nodes`.
  It is a view for reasoning, not a container. The nodes and edges belong
  to the graph; a node may be in more than one workflow. The entry/exit
  must be in the workflow's node list. The engine routes by handoffs, not
  by workflow.
- A node has `id`, `helper`, `objective`, `output` (relative path),
  optional `session`, optional `budgetMs`, optional `maxVisits` (1–100;
  use 20 for a repair loop), and `handoff`.
- `session` is `fresh` (default) or `resume`. Use `resume` for a node that
  should continue its own conversation on a repair loop (the implementation
  node). The reviewer should be `fresh`: a new session on every review
  pass. `resume` sessions are reused within one dispatch and deleted when
  the dispatch ends.
- `handoff` is exactly one of:
  - `{ "mode": "terminal" }` — the node ends after writing its output.
  - `{ "mode": "unconditional", "to": "<node>", "description": "..." }` —
    the agent calls the label `next`.
  - `{ "mode": "conditional", "labels": [{ "label", "to", "description" }] }`
    — the agent calls exactly one label.
- No node mixes handoff modes. Every label has one target. There is no
  catch-all.
- Any node may be a dispatch entry point. Every node must be able to reach
  a terminal node. Every cycle must carry `maxVisits` on each node in the
  cycle.
- `output` must be a relative path with no `..`.

## After editing

Call `reload()`. Success returns `valid: true` and the graph summary.
Failure returns `valid: false` and faults; the old graph stays active.
Fix every fault before dispatching.

The same map/table is written to `GRAPH.md` on every valid reload. The user
can run `/graph` at any time to see the current graph in the chat. `/graph`
is read-only: it cannot dispatch work.
