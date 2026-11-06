# Graph Engine

v0.5.0 **ALPHA**. Schema and tools may change.

An OpenCode plugin that runs a graph of agent nodes. Work is dispatched into
the graph, each step hands one message to exactly one next step, and runs are
visible in a dashboard.

## How it works

One dispatch runs at a time; further dispatches wait in a FIFO queue. A
dispatch enters at one node or at a workflow's entry. Every node runs its
agent; when the work is done, the agent ends the step by calling the node's
handoff tool: a single `handoff` target, or one tool per labelled target (such
as pass/fail), each taking a message. A terminal node ends the dispatch once
its session succeeds. The handoff message is the only context passed from one
node to the next; the dispatch prompt, the node's prompt and objective, and
referenced skills are re-supplied at every step. A handoff can resume the
target node's existing session instead of starting a new one. A dispatch also
ends when a node hands off to `$dispatcher`, which completes the dispatch
with that message.

The graph is plain files: `config.json` (schema version, `maxSteps`,
workflows) plus Markdown documents in `agents/`, `nodes/`, and `skills/`. A
document's id is its filename.

Workflows are labelled routes (`entry` → `exit`) over nodes. Routing follows
handoffs, never workflow membership; a dispatch at a workflow engages that
workflow's boundary (`connections`, `strict`).

## Install

Requirements: a POSIX shell (`awk`, `sha256sum` or `shasum`). No Node.

```sh
installer/build-archive.sh
sh dist/install.sh \
   --archive  dist/graph-engine-<version>.tar.gz \
   --checksum dist/graph-engine-<version>.tar.gz.sha256
```

`install.sh` verifies the checksum, installs the plugin into OpenCode's global
configuration, seeds a user-owned copy of the graph at
`<config>/graph-engine/graph` (first install only; later installs leave it
untouched), writes the uninstaller at `<config>/graph-engine/uninstall.sh`,
and touches nothing outside the configuration directory. Options: `--dry-run`,
`--yes`, `--config-dir`.

## Using it

Ask your assistant to run work in the graph; it dispatches at a node or
workflow and reports the outcome — foreground waits, background returns an id
and notifies on completion. Running work can be checked or cancelled. A node
that hands off to `$dispatcher` ends the dispatch with a message to you and
keeps its session waiting; a reply resumed into the same node session
continues it.

The install also mounts two assistants, generated from graph documents:

- **Engineer** — edits, builds, tests, and refines the graph with you.
- **Conductor** — plans and executes work by dispatching to the graph agents.

The dashboard (`Alt+G`, or `Ctrl+P` → "Open graph dashboard"; `Esc` to return)
shows the graph, the engaged workflow, active and queued dispatches, per-dispatch
details, and recent history.

The seeded graph is a placeholder example — replace it with your own.

## Editing the graph

Your graph lives in the OpenCode config dir (`<config>/graph-engine/graph`).
Edit the files, then have it validated: a valid graph swaps in, an invalid one
reports named faults and keeps the old graph, and reload is refused while a
dispatch runs. The Engineer agent drives this loop.

## Development

```sh
node --test 'engine/test/*.test.mjs' 'dashboard/test/*.test.mjs' 'installer/test/*.test.mjs'
node engine/live-proof.mjs        # in-process engine + plugin + RPC, scripted model, no network
sh installer/test/install.test.sh # installer suite: build / install / uninstall / config-merge
installer/live-e2e.sh             # build, install, real OpenCode server + real model
```

Test gate and live-verification rules: [AGENTS.md](AGENTS.md). Design rules:
[INVARIANTS.md](INVARIANTS.md).
