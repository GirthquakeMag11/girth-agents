---
name: graph-authoring
description: The reference for the engine's graph schema and reload contract; load it before authoring or modifying the graph.
---
# Graph authoring reference

The authoritative reference for the one graph's schema, its rules, and the
`reload()` contract. The graph is one JSON config plus the Markdown agent, node,
and skill documents discovered around it.

Call `graph_info()` for the config path and the graph's workflows, nodes, and
graph agents. Read the config and the documents it organizes, edit them, then
validate.

## Schema

The config is version, an optional `maxSteps`, and the workflows. Agents,
nodes, and skills are Markdown documents discovered by directory; every
document's id is its filename.

```json
// config.json
{
  "version": "6",
  "maxSteps": 100,
  "workflows": [
    {
      "id": "build-review",
      "entry": "implement",
      "exit": "done",
      "nodes": ["implement", "review", "done"]
    }
  ]
}
```

```markdown
<!-- nodes/review.md -->
---
agent: reviewer
objective: Review the implementation against the dispatched prompt.
maxVisits: 20
handoff:
  mode: conditional
  labels:
    - label: pass
      to: done
      description: The work meets the objective; finish.
    - label: fail
      to: implement
      description: Name exactly what must change.
      resume: true
---
Judge the implementation against the dispatched prompt and the upstream
handoff message.
```

An agent document is Markdown. Frontmatter carries its properties — the id is
its filename — and the body is its prompt:

```markdown
<!-- agents/builder.md -->
---
mounts: [graph, primary, subagent]
tools: [read, edit, shell]
skills: [test-first]
---
Standing instructions for this agent.
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

- `version` is the string `"6"`.
- The config has only `version`, optional `maxSteps`, and optional `workflows`.
  Agents, skills, and nodes are discovered from `agents/`, `skills/`, and
  `nodes/` by filename; a document's id is its filename. There is no manifest
  listing of agents and no inline nodes.
- Each agent document has required `mounts`, and optional `model`
  (`provider/model`), `tools`, `permissions`, `skills`, `description`,
  `subagents`, and `color`. An agent without a `model` inherits the session
  default on every mount.
  `mounts` is a non-empty subset of `graph`, `primary`, `subagent`, with no
  assumed default and no duplicates; `graph` means it runs as a node's agent
  inside the engine, while `primary` and `subagent` name the OpenCode surfaces
  the plugin materializes. The body is the agent's prompt; the prompt is not a
  frontmatter field.
- An agent id is unique. The graph is the authoritative agent catalog: every id
  it declares is owned, published or not. A second definition of that id
  elsewhere (e.g. an OpenCode config-document agent) is a named
  `agent.collision` defect at dispatch. Change an agent by editing its
  document, or use an id the graph does not declare.
- `tools` lists tool names acquired by name — tools are deny-by-default, the
  same shape as skills. On a `primary`/`subagent` mount the same acquisitions
  become the agent's OpenCode permissions (deny-by-default ruleset); on a
  `graph` mount they shape the node session's rule set.
- `permissions` is an optional fine-grained list of `{ action, resource,
  effect }` rules (`effect` one of `allow`, `ask`, `deny`) that refine the
  baseline; write rules block-style as `- action:` lines with `*` quoted
  (`"*"`) — a bare `*` is a YAML alias. On a `primary`/`subagent` mount,
  `@GRAPH_DIR@` in a rule's `resource` expands to the graph's own directory
  at materialization, so a rule can scope to the graph without knowing the
  install path.
- An agent's optional `color` is a six-digit hex (`#RRGGBB`, quoted or
  unquoted) or a lowercase theme token (`primary`, `secondary`, `accent`,
  `success`, `warning`, `error`, `info`), mirroring OpenCode's agent color.
  It surfaces on `primary`/`subagent` mounts only; a `graph`-only mount
  ignores it.
- An agent's optional `skills` array references skill documents by id, where
  the id is the skill's filename under `skills/`. The loader follows those ids,
  deduplicates them, and reads each referenced skill once; unreferenced skill
  files are not read. Unreadable, malformed, or empty skills are named faults.
  The brief carries each resolved skill; the agent's body is the node session's
  system prompt, not the brief. Referenced skills follow a mount into
  OpenCode's skill registry.
- A node document has required `agent` (a graph agent's id) and `handoff`, and
  optional `objective`, `budgetMs`, `maxVisits` (1–100; use 20 for a repair
  loop), `tools` (tool names acquired by name, unioned with the agent's), and
  `permissions` (`{ action, resource, effect }` rules appended after the
  agent's). The body is the node's own layered prompt, combined with the
  agent's. The handoff message is the only context carried from one node to the
  next; the dispatch prompt, the resolved skills, the node prompt, and the node
  objective are repeated in every brief (the agent's body is the session system
  prompt). A node's work product is not an engine field. Nodes do not have a
  session mode.
- `handoff` is exactly one of:
  - `mode: terminal` — the node ends after its session succeeds.
  - `mode: unconditional` with `to`, `description`, optional `resume` — the
    engine generates the single tool `handoff`.
  - `mode: conditional` with a `labels` list of `{ label, to, description,
    resume? }` — the engine generates one tool per label, named exactly the
    label. The agent calls exactly one generated tool with `{ message }`. A label
    may set `resume: true` only when its target is the node that supplied the
    current input.
- Session retention is a **handoff** decision. A non-terminal handoff may set
  `resume: true`; false or omitted starts a new session. `resume` is honored only
  when the handoff target is the node that supplied the current input (the
  return path). The engine keeps that target session alive for the return and
  deletes it when the dispatch ends. A `resume: true` handoff to any other node
  is a loud defect.
- A handoff target may be a node id or `$dispatcher`. A `$dispatcher` label
  completes the dispatch with its message and cannot set `resume: true`. The
  same generated handoff interface is used; there is no separate reply/resume
  tool.
- A workflow is a labelled subsection: `id`, `entry`, `exit`, and `nodes`. It is
  a view for reasoning, not a container; a node may be in more than one
  workflow. Entry/exit must be in the workflow's node list. The engine routes by
  handoffs, not by workflow. `workflows[].connections` names other workflows and
  is transitive; `workflows[].strict: true` rejects handoffs outside the main
  workflow and its transitive connections.
- There is exactly one `graph`. There is no graph id, no graph selector, and no
  "all graphs." No node mixes handoff modes; every label has one target; there
  is no catch-all. Any node may be a dispatch entry point; every node must reach
  a terminal node or a `$dispatcher` completion; every cycle must carry
  `maxVisits` on each node in the cycle.

## Reload contract

Call `reload()`. Success returns `valid: true` and the graph summary.
Failure returns `valid: false` and the named faults; the old graph stays
active. A reload during an active dispatch is rejected; wait for the dispatch
to finish. Fix every fault before dispatching.

The native dashboard reads the graph and the engine's structured runtime
state.