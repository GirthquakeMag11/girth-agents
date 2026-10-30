# Open threads

Working record of unconcluded design threads. This is not a spec, a roadmap,
or a decision log. It exists so a side-track does not erase the thread that
was in progress, and so a later architectural ruling has the full context.

When a thread closes, move the decision into `SPEC.md` or `ROADMAP.md` and
remove it here.

Last updated: 2026-10-29

## Process rules

- **Record user decisions before proposing or implementing the next step.**
  When the user explains something in detail, write down what was decided
  and what was explained before moving on. Otherwise the user cannot tell
  how the explanation landed and does not know what context the next action
  was taken in.
- **Keep user decisions separate from our proposals.** A proposal is not a
  decision. Do not let a design draft or an implementation choice silently
  become part of the shared context.
- **State what we are about to do before doing it.** If we are producing a
  draft, a mockup, a test, or a code change, say so and say why.
- **One active thread at a time.** When a side-track opens, record it here
  and mark the original thread paused, rather than abandoning it.

## T1 — Refining the engine through dogfood

**Status:** open, paused by T2/T3  
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
  dogfood until the UI/entropy system is defined.
- **Which sharp corners block further dogfood?** Shared `work/` output,
  the graph command echo, plugin reload behavior, and the missing explicit
  friction comparison.
- **When does the freeze end?** Any engine change discovered during dogfood
  must become versioned engine work after the cycle, not a mid-run hot-patch.

### Next decision

After the UI/entropy thread is defined, decide whether to continue dogfood
under v1.2.0, resolve the UI thread first, or close the cycle and version the
next engine work. Then choose the next task and the friction measurements to
record.

## T2 — The `/graph` rendering surface

**Status:** surface decided at a high level; concrete overlay design open in
T3. The current chat echo is an interim, not the target.  
**Question:** where should the deterministic graph output be rendered, and
how much OpenCode involvement is acceptable to get it there?

### User ruling

- The graph view is a **full-screen overlay inside OpenCode**, opened from
  the command palette and/or a key combination, and dismissed back to chat.
- It is a **bird's-eye view** used both to manage the graph and to observe it
  working.
- It is not a separate local web workbench and not a chat message. The
  separate web workbench was rejected for context-switching and for making
  the OpenCode relationship ill-defined.
- The first version is **optimized for understanding**, not editing.
  Editing happens through the skilled interactive agent via the
  configuration schema; editing in the view can be considered later.
- The view updates when a graph change is applied, not on every draft edit.
- The chat `/graph` echo is therefore no longer the target surface. It may
  remain as an interim until the overlay exists.

### Settled

- `/graph` in chat is argument-free: one graph, no graph id, no subcommands.
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

- The concrete overlay design: visual grammar, layout, interaction, and
  information hierarchy. See T3.
- Whether the overlay is implemented as an OpenCode TUI plugin/panel, a
  command-palette screen, or another native OpenCode surface. This must be
  proven against the installed version, not assumed.
- Whether the chat echo is kept as a fallback or removed once the overlay
  exists.
- Whether any direct chat-rendering API is still wanted after the overlay
  exists. This is no longer on the critical path for the graph view.

### Proposals (not approved)

These were discussed but are not decisions:

- a TUI panel opened by `/graph`, with map/inspector/run/coherence tabs;
- a persistent sidebar and composer status line;
- a coherence ledger and draft/apply flow;
- a local web workbench (rejected).

## T3 — UI/UX and graph perception

**Status:** open; user decisions recorded; no UI design approved; no
implementation started.  
**Question:** how should the user perceive and reason about the graph in the
same OpenCode context, with minimal friction and entropy?

### User decisions

- **UX is the priority; UI is second.**
- The engine is a **meta-system**: it lets users build systems that produce
  work via a graph of connected agents with their own configurations,
  skills, and tools.
- An **optional built-in graph** is provided so users can start working out
  of the box. The built-in graph is an on-ramp, not the product.
- The purpose is **systems without friction**: systems built with the
  meta-system should be able to work without necessarily increasing
  entropy, and entropy itself should be wrangleable without necessarily
  increasing entropy.
- The user's graph is **enforced in code**, not suggested in instructions.
  Outcomes must be predictable and measurable; the process that produced
  the outcome must be reason-able separately from the product. The user
  must be able to trust that the operation they defined executes as defined.
- The system must make the user's ability to **reason about the graph and
  its elements as easy and convenient as possible**, minimizing the friction
  of refining the graph. If the user can understand the graph easily, they
  can configure it, direct the interactive agent, and trust that decisions
  will not produce contextual drift that compounds.
- **No local web workbench.** It introduces context switching and makes the
  OpenCode relationship ill-defined. The UI should use OpenCode while
  OpenCode is the chosen infrastructure; if OpenCode becomes a hindrance,
  divorce from it deliberately.
- The graph view is a **full-screen overlay in the command palette** (and/or
  a key combination), dismissed back to chat. It lives in the same OpenCode
  context, not a separate application or window.
- Other parts of the UI are not defined enough to distract from the
  bird's-eye view; the overlay is the current target.
- It is a **bird's-eye view** of the graph, for both managing the graph and
  observing it work. It should show which nodes are currently active with
  work. The state model should anticipate **plural active nodes** and
  concurrent/parallel workflow execution in the future, even if the engine
  is single-active today.
- The **same top-down view** shows structure and behavior. The user can
  press a key and look at the graph instead of asking an agent to explain
  its state in prose every time.
- A graph change should be represented visually **immediately after it is
  applied**. The user's understanding should have no latency relative to the
  agent's understanding and the graph's actual state.
- For current goals, **editing the graph happens through the skilled
  interactive agent via the configuration schema**. The first version of the
  view is optimized for **understanding**, not editing. Editing in the view
  can be considered later.
- The first version should **update on application of a graph change**, not
  live-edit/draft preview. Edits are not expected to be continuous enough
  to require live update.
- The user wants to **iterate on visual design drafts**, not debate visual
  elements they cannot see.

### User definitions

- **Friction:** the amount of effort required on the user's part to initiate
  productive work. Changing a lightbulb is productive work, but if the right
  lightbulbs are missing, the user must first overcome the friction of
  acquiring more before the actual lightbulb changing can begin. An agent
  may be prepared to change a lightbulb but not to do the complex multi-step
  preliminary task of acquiring more. A workflow may be prepared, but it
  depends on tasks and context that only concretely exist in the user's head;
  the user must expand the existing workflow to account for the missing
  prerequisite.
- **Entropy:** a measurement of disorder across a project, repository, or
  codebase, estimated in terms of decoherence between the user's
  understanding, the agent's understanding, and the state of the project.
  Higher entropy means the user must bear more cognitive load to account for
  the project state, the agent's understanding, the shared context, and how
  it will change. Any imprecision in an instruction can produce noise that
  gets stratified into deeper context without the user's knowledge. A
  predictable, stable session then requires increasing cognitive demand; any
  momentary lapse produces drift, and the user must notice, identify,
  compensate for, and surgically remove the flawed context without
  introducing more. Cognitive demand rises continuously; failing to meet it
  makes it shoot up rapidly. More entropy means more friction to perform
  work that does not introduce additional entropy; failing to overcome that
  friction increases entropy, and lowering entropy later requires even more
  friction.

### Not decided

- The concrete entropy-wrangling/coherence system. The user explicitly says
  it is not in place yet. A UI must not be treated as if it were the system.
- The visual grammar, layout, interaction model, and information hierarchy
  of the overlay.
- Whether any of our proposals — coherence ledger, sidebar, composer status,
  inspector tabs, run history, draft/apply — are accepted. None are approved.
- How to represent plural active nodes, queues, concurrency, and future
  parallel workflows.
- The exact OpenCode surface and API for the overlay, and whether the
  installed version supports it. This must be proven, not assumed.
- Whether the current `/graph` chat echo remains as a fallback or is removed.

### Process correction

- Drafts A and B (map + right inspector; full-width map + bottom drawer) were
  produced before this record was updated. They are **exploratory, not
  approved**, and should not be treated as the design. They were an attempt
  to respond to the request for visual drafts; the record should have been
  updated first.
- The Firefox activity was those mockups being rendered to images. That was
  not stated before the tool calls, so the user saw unexplained browser
  activity. Say what is being done and why before doing it.
- The next step is to agree on the record and the unresolved questions
  before producing more drafts or implementation.

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
