# Open threads

Working record of unconcluded design threads. This is not a spec, a roadmap,
or a decision log. It exists so a side-track does not erase the thread that
was in progress, and so a later architectural ruling has the full context.

When a thread closes, move the decision into `SPEC.md` or `ROADMAP.md` and
remove it here.

Last updated: 2026-10-29

## T1 — Refining the engine through dogfood

**Status:** open, paused by T2  
**Question:** does using the engine to develop the engine actually make real
work easier and more efficient than doing it directly?

### Settled

- The engine is frozen at **v1.2.0** (tag `v1.2.0`, commit `c538678`) for the
  dogfood cycle. During the cycle, change the graph, not engine semantics.
- The first real task was adding `--version` / `--help` to `engine/engine.mjs`,
  with `engine/test/cli.test.mjs` and README updates.
- That task ran through the product `build-review` graph:
  implement 1 → review 1 (pass) → done 1.
- The reviewer ran the suite: 44/44 tests passed. Cost was about $0.0090
  (28,816 input / 4,028 output tokens).
- The task diff was committed after review as `ebc601c`.
- The dogfood run's sharp corners are recorded in `ROADMAP.md`: the command
  echo, plugin reload in a recreated workspace, non-interactive `node` PATH,
  the residual model echo, and the shared `work/` directory.

### Open

- **Was it actually easier?** We have one successful task and a token cost,
  but no explicit comparison against doing the same task manually: setup
  time, dispatch/wait overhead, review value, interventions, rework, and
  wall-clock cost.
- **Was the review meaningful?** It passed on the first visit, so the fail
  loop was not exercised in this run. That is one data point, not proof that
  review catches real defects.
- **What is the next dogfood task?** Continue with a straightforward real
  implementation task, choose one likely to trigger a review fail, or pause
  dogfood until T2 is ruled.
- **Which sharp corners block further dogfood?** Shared `work/` output,
  the graph command echo, plugin reload behavior, and the missing explicit
  friction comparison.
- **When does the freeze end?** Any engine change discovered during dogfood
  must become versioned engine work after the cycle, not a mid-run hot-patch.

### Next decision

After the broad design goals are stated, decide whether to continue dogfood
under v1.2.0, resolve T2 first, or close the cycle and version the next engine
work. Then choose the next task and the friction measurements to record.

## T2 — The `/graph` rendering surface

**Status:** open, awaiting a ruling; current implementation works but is not
accepted as the final design  
**Question:** where should the deterministic graph output be rendered, and
how much OpenCode involvement is acceptable to get it there?

### Settled

- `/graph` is argument-free: one graph, no graph id, no subcommands.
- It is read-only by construction: the command cannot dispatch work.
- The output is produced by `engine/graph-view.mjs`: it asks the running
  engine for `/tool/graph-map`, or renders the same map/tables from the
  config and appends `Engine not running.` when the engine is down.
- The current implementation is a plugin-registered command. It runs the
  CLI, switches the session to the `graph-view` agent for one reply, and
  restores the previous agent. Verified live: exact output, no tools, no
  dispatch, agent restored, engine idle.
- The agent is doing no work. It is a renderer for the CLI output.
- OpenCode V2's command executor returns `void`; there is no documented
  assistant-message append API. The current in-chat paths are:
  - prompt → agent (the current echo),
  - synthetic → notice, not rendered Markdown,
  - shell → raw text, not Mermaid/tables.

### Open

- **Is chat non-negotiable?** Must the graph render in the chat transcript,
  or is a dedicated read-only surface acceptable?
- **Will we patch OpenCode?** A small local patch could add command output or
  `ctx.session.message.append`. That gives chat plus no agent, but means
  running and maintaining a patched OpenCode until it lands upstream.
- **Is upstream-only acceptable?** It is the clean long-term fix, but it is
  not a plan for getting this done now.
- **If we keep the echo as an interim,** how do we avoid showing the prompt?
  A prompt hook or a local echo provider could reduce it, but both are
  workarounds and may introduce their own coupling.
- **What is the long-term graph surface?** Chat message, TUI panel/dialog,
  local web view, or several surfaces fed by the same deterministic view.

### Options

| Option | Chat? | Agent? | Prompt visible? | Cost | Main risk |
|---|---|---|---|---|---|
| Current echo | yes | yes | yes | model echo | unnecessary work; sausage |
| TUI panel/dialog | no | no | no | none | not the transcript |
| Local web view | no | no | no | none | separate surface |
| Patch OpenCode | yes | no | no | patch upkeep | fork/maintenance |
| Upstream request only | yes eventually | no | no | waiting | not a current plan |

### Next decision

Do not patch OpenCode or switch surfaces yet. State the broad design goals
first; they determine whether chat is the product surface, whether a
dedicated view is acceptable, and whether carrying a local OpenCode patch is
worth it.

## Settled decisions that should not be relitigated accidentally

- One graph per engine config. No graph id, no graph selector, no “all
  graphs.” Workflows are labelled subsections, not containers.
- The product graph is `build-review` only. `session-check` is not a product
  workflow; the session-resume/fresh proof is an offline fake-driver test.
- `implement` resumes its builder session on a fail loop; `review` is fresh
  every visit.
- `maxVisits: 20` on implement and review; 100 is the engine backstop.
- `/graph` is argument-free and read-only; `GRAPH.md` is generated on boot
  and every valid reload.
- Engine v1.2.0 is the frozen dogfood baseline.
