---
name: graph-authoring
description: Author or modify the engine's JSON graph config, validate it with reload, and fix named faults.
---
# Graph authoring

The engine runs agent nodes. A node sends a prompt to an agent, the agent
writes an output file, and the agent pulls exactly one handoff lever to the
next node. The graph is a single JSON file.

## Start

Call `graphs()` first. It returns the config path and the current graphs and
nodes. Read the config file. Edit it. Then call `reload()`. If `reload`
returns `valid: false`, read the named faults, fix them, and reload again.
A reload during an active dispatch is rejected; wait for the dispatch to
finish.

Do not edit the engine's plugin, skills, or source. Edit only the config
file.

## Schema

```json
{
  "version": "2",
  "helpers": [
    {
      "id": "builder",
      "model": "openrouter/~deepseek/deepseek-flash-latest",
      "agent": "build",
      "permissions": ["read", "edit", "shell"],
      "craft": "Standing instructions for this helper."
    }
  ],
  "graphs": [
    {
      "id": "build-review",
      "outputRoot": "work",
      "maxSteps": 100,
      "nodes": [
        {
          "id": "implement",
          "helper": "builder",
          "objective": "Implement the dispatched work.",
          "output": "implementation.md",
          "maxVisits": 3,
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
          "maxVisits": 3,
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
          "handoff": { "mode": "terminal" }
        }
      ]
    }
  ]
}
```

## Rules

- `version` is the string `"2"`.
- A helper has `id`, `model` as `provider/model`, optional `agent`
  (default `build`), `permissions` as a non-empty array of real action
  names (`read`, `edit`, `shell`), and optional `craft`.
- A graph has `id`, optional `outputRoot` (default `"."`), optional
  `maxSteps`, and `nodes`.
- A node has `id`, `helper`, `objective`, `output` (relative path),
  optional `budgetMs`, optional `maxVisits` (1–3), and `handoff`.
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

Call `reload()`. Success returns `valid: true` and the new graph list.
Failure returns `valid: false` and faults; the old graph stays active.
Fix every fault before dispatching.
