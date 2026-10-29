# Roadmap

**Baseline:** v1.2 (tag `v1.2.0`). The engine runs one graph of agent-node
workflows, enforces one handoff per node, queues dispatches FIFO, validates
and reloads config, resumes the implementation session across a review
loop, keeps the reviewer fresh, cancels queued or active work, reports
cost and tokens, and gives the interactive agent a deterministic read-only
graph view.

This document tracks deferred work. It is not a wish list: each item has a
target version and an acceptance condition. Check an item only when its
acceptance condition has been demonstrated, and prefer live proof over a
green stand-in.

## Current focus: dogfood

The next milestone is not another engine feature. It is **using the engine
to develop the engine**.

- **Freeze the engine during a dogfood cycle.** Change the graph, not the
  engine. Record engine defects and sharp corners; fix them as versioned
  engine work after the run, never as a hot-patch in the middle of the
  work.
- **The map is the contract.** If the engine's behavior is not explainable
  by `/graph` and `GRAPH.md` — nodes, sessions, handoffs, outputs,
  `maxVisits`, workflow — that is a defect in the map or the engine. The
  user must be able to reason from the graph without reading engine code.
- **The first real task is a straightforward implementation task in this
  repo.** It must change real code, run the real tests, and pass the
  reviewer. The interactive agent dispatches it, waits, reads the
  completion or defect, and reviews the diff.
- **Measure the friction.** Using the engine must become easier and more
  efficient than doing the task directly. Every extra step, wait, or
  ambiguity is a sharp corner to record.
- **The testing cap is gone.** The build-review workflow uses
  `maxVisits: 20`; 100 is the engine's hard backstop, not the workflow's
  policy.

**Priority order:** sandbox and tool-surface enforcement first, then
handoff atomicity and durability, then model/cost resilience, then
operations, then reach. v1 is usable, but the trust boundary is still
cooperative helpers.

### Dogfood log — first real task (v1.2.0)

Task: add `--version` and `--help` to `engine/engine.mjs`, with a CLI test
and README update. Dispatched through the product `build-review` graph.

- **Result:** implement 1 → review 1 (pass) → done 1. The reviewer ran the
  suite; 44 tests passed. The task cost about $0.0090 and 28,816 input /
  4,028 output tokens. No engine meta-edit during the dispatch; the task
  diff was committed after review.
- **Sharp corner: command output was rewritten.** The original markdown
  `/graph` command ran a `subagent: true` child, and the parent summarised
  the child's map. Fixed by registering `/graph` as a plugin command that
  runs the deterministic CLI, switches the session to the read-only
  `graph-view` agent for one reply, and restores the prior agent. Verified
  exact output, no tools, no dispatch, agent restored.
- **Sharp corner: plugin reload after a recreated workspace.** OpenCode did
  not reliably load a plugin when a scratch workspace directory was deleted
  and recreated under the same path. The live proof now uses a unique
  scratch workspace per run; a stable workspace restart was reliable.
- **Sharp corner: `node` on PATH.** Non-interactive shells here do not have
  `node` on PATH; the builder used the fnm Node install. The installed
  `/graph` command embeds the engine's absolute `process.execPath`.
- **Residual risk: the chat reply is an echo.** The CLI output is
  deterministic and read-only, but the one reply that displays it is still
  a model echo. It complied exactly in the proof; a future version can
  replace the echo if OpenCode exposes a direct assistant-message channel.
- **Deferred: shared `work/`.** The first task wrote `work/*.md`; a second
  dispatch would overwrite them. Per-dispatch output isolation remains a
  separate decision.

## Shipped in v1

- [x] One JSON graph config with strict validation and named faults.
- [x] Helpers, nodes, outputs, terminal/unconditional/conditional handoffs.
- [x] Any node can be a dispatch entry point; every node must reach a
  terminal; every cycle carries `maxVisits` 1–100 (the shipped graph uses
  20; 100 is the engine backstop).
- [x] Live OpenCode 2.2.0 sessions with leading-deny permissions.
- [x] One handoff plugin tool surface, installed and preflighted by the
  engine.
- [x] Engine-side handoff acknowledgement: session/node binding, label
  validation, output existence, first-call-wins, output hash.
- [x] Post-idle order check: session outcome, no later tool call, no tool
  completed after the handoff, output unchanged.
- [x] FIFO dispatch queue, dispatch ids, wait/background, status,
  pause/resume.
- [x] Live config reload with named faults; the old graph stays on a bad
  edit.
- [x] Interactive tools: `dispatch`, `dispatch_wait`, `dispatch_status`,
  `dispatch_cancel`, `reload`, `graph_info`, `graph_map`.
- [x] Interactive skills: graph-authoring, dispatching.
- [x] 44 offline tests and a live proof covering stdio dispatch, queue,
  interactive dispatch/wait, config authoring/reload, cancellation, cost,
  and the read-only graph view; background dispatch (wait:false then
  dispatch_wait) was exercised in a separate live probe.

## Shipped after v1 (v1.1 graph-model slice)

- [x] **Workflows are labelled subsections of a graph.** A workflow is
  `{ id, entry, exit, nodes }`; it is a view, not a container, not a
  runtime unit, and not a dispatch target. Nodes and edges belong to the
  graph; a node may be in zero, one, or multiple workflows. The engine
  routes by handoffs, never by workflow.
- [x] **Session modes.** A node declares `session: "fresh"` (default) or
  `"resume"`. The implementation node resumes its original builder session
  on a fail loop; the resumed brief carries the reviewer's output path.
  The reviewer is fresh on every review pass. An offline fake-driver test
  proves one builder session id across three visits and different
  reviewer session ids on both visits; no second workflow is added to the
  product graph.
- [x] **Graph view.** `graph_map` returns a deterministic Mermaid map,
  workflow table, node table, legend, and live state. `/graph` prints them
  verbatim with no narrative; `GRAPH.md` is written on boot and every
  valid reload.
- [x] **Session lifecycle cleanup.** Fresh sessions are deleted after
  their visit; resume sessions are deleted at dispatch end.

## v1.2 — One graph and a read-only view

- [x] **One graph only.** The top-level `graphs` array and graph id are
  gone. The config is `{ version: "3", helpers, graph }`; workflows remain
  labelled subsections. `dispatch({ node, prompt })`, `graph_info()`, and
  `graph_map()` carry no graph id. Multiple separate graphs are not
  planned.
- [x] **Read-only, argument-free `/graph`.** The plugin command takes no
  arguments, runs `engine/graph-view.mjs` for the exact text, switches the
  session to a `graph-view` agent for one reply, and restores the previous
  agent. The agent's permissions deny the mutating tools. The CLI prints
  the map/tables/legend/state directly and falls back to the config with
  `Engine not running.` when the engine is down.
- [x] **Failure-path coverage.** Failed, interrupted, and timed-out
  sessions produce `session-failed`, `session-interrupted`, or
  `session-timeout` with the session id; the old `session is not defined`
  ReferenceError is fixed and regression-tested.
- [x] **Cancellation.** `dispatch_cancel` removes a queued dispatch or
  interrupts the active one; a cancelled dispatch ends as `cancelled`,
  never a defect. Killing the engine is no longer the stop mechanism.
- [x] **Cost and tokens.** Step and completion notices carry per-step and
  per-dispatch cost and token usage; introspection exposes the same.

## v1.1 — Hardening

Target: safe enough for daily use with untrusted or prompt-injected helper
work, and strong enough that a second engine or a reconnect cannot
double-route.

### Safety and trust boundary

- [ ] **H1.1 Helper sandbox.**
  - What: run helpers in a separate UID/container (or equivalent); mount
    the plugin and config read-only outside the writable workspace; no
    access to `service.json`, engine state, or the acknowledgement token.
  - Acceptance: a live hostile-helper probe cannot read the service file,
    forge a handoff, create an engine session, or rewrite the plugin; the
    engine reports the attempt as a defect; the sandbox is documented as
    an operating requirement.
  - Why now: the v1 trust boundary assumes cooperative helpers.

- [ ] **H1.2 Session tool-surface assertion.**
  - What: after session creation, assert the snapshot is exactly the
    handoff lever plus the helper's allowed actions; fail the node before
    prompting on a mismatch. Use the event/context snapshot or a plugin
    context hook.
  - Acceptance: a live session with an extra visible tool is rejected
    before any prompt; an allow-only list is never treated as deny-rest.

- [ ] **H1.3 Tools after the handoff.**
  - What: remove or reject every tool call after the handoff ack; reject a
    handoff step that carries a sibling tool call; keep the post-idle
    chronological check.
  - Acceptance: the red-team's sleep+handoff and write-after-handoff cases
    both defect; a normal write-then-handoff turn still passes.

- [ ] **H1.4 Plugin and secret lifecycle.**
  - What: pinned plugin version, per-boot (or per-run) token, endpoint and
    token rotation, read-only plugin source, documented hot-reload and
    upgrade behavior.
  - Acceptance: a helper cannot rewrite the plugin; a restarted engine
    rewrites the endpoint and the next session uses it; a stale plugin is
    refused.

### Handoff atomicity and durability

- [ ] **H1.5 Tool-side exactly-once / idempotency.**
  - What: idempotency key per session+call; engine ack store rejects
    duplicates; the tool surface reports `handoff.multiple` without a
    second route.
  - Acceptance: a duplicate call never routes twice; a lost HTTP response
    can be retried without a duplicate route.

- [ ] **H1.6 Output digest at pull / atomic output.**
  - What: carry the output digest (or content) with the handoff call, or
    make the receiver verify the exact bytes at acceptance; keep the
    post-idle hash check.
  - Acceptance: a write after the handoff, a partial write, and a changed
    output all defect; the next node never reads a stale/final race.

- [ ] **H1.7 Durable ack store and reconciliation.**
  - What: persist accepted handoffs and dispatch state outside the
    process; reconcile after a restart, SSE gap, or receiver outage; do
    not rely on `Last-Event-ID` replay.
  - Acceptance: killing the engine after an ack does not double-route on
    restart; a missed event is reconciled from the message history/ack
    store.

- [ ] **H1.8 Per-run endpoint and run identity.**
  - What: per-run token/endpoint or a run id multiplexed through one
    receiver; bind session→dispatch→node explicitly.
  - Acceptance: two engine processes/workspaces cannot cross-route; a
    forged session id is rejected.

### Models, cost, and failure policy

- [ ] **H1.9 Model fallback and retry.**
  - What: classify 429/quota/transient provider failures; fall back to a
    configured model or retry with a small cap; otherwise a loud
    `session.*` defect. Never silently pass.
  - Acceptance: a simulated 429 completes on the fallback or defects with
    the provider reason; no duplicate handoff.

- [ ] **H1.10 Cost and token accounting.**
  - What: report per-session, per-node, per-dispatch cost/tokens; enforce a
    configurable dispatch budget; stop with a loud defect on breach.
  - Acceptance: a dispatch over its budget stops and reports the spend; the
    live proof reports totals.

- [ ] **H1.11 Per-node model/helper overrides.**
  - What: allow a node to override the helper model/agent/permissions
    without cloning the helper; verify the override.
  - Acceptance: a node uses its override and the verifier rejects an
    unknown model/agent.

- [ ] **H1.12 Timeout and retry policy.**
  - What: one documented node-budget default; retries only for declared
    retryable errors; the graph's `maxVisits` bound with the 100-visit
    engine backstop; no hidden retries.
  - Acceptance: timeout, interrupt, and provider failure each produce the
    declared outcome; the configured bound is enforced.

### Verification

- [ ] **H1.13 Expanded live failure matrix.**
  - What: duplicate, invalid label, early output, late output, changed
    output, tool after handoff, child/forged session, plugin inactive,
    SSE gap, 429, timeout, reload during dispatch.
  - Acceptance: every case is a named defect or the declared route; no
    silent success; results recorded in the live proof.

- [ ] **H1.14 Fake-server drift gate.**
  - What: the stand-in mirrors the 2.2.0 wire and rejects drift; it never
    certifies a behavior the live server refuses.
  - Acceptance: a deliberate wire drift fails the fake; the live proof
    remains the authority.

- [ ] **H1.15 Sandbox regression suite.**
  - What: hostile-helper probes for secrets, plugin rewrite, session
    creation, forged handoff, and cross-run access.
  - Acceptance: every probe is blocked or defected in the sandbox.

## v1.2 — Operations and product

Target: dependable daily operation, visible history, and a product that
can be installed and run without the author in the loop.

### Durability and operations

- [ ] **O1.1 Durable queue and dispatch recovery.**
  - What: persist queued/running dispatch state; recover or explicitly
    defect after a restart; no silent loss.
  - Acceptance: a restart during a queue preserves or names every dispatch.

- [ ] **O1.2 Dispatch history and tracing.**
  - What: per-dispatch event history, outputs, sessions, costs, defects;
    an introspection/history query; retention policy.
  - Acceptance: a completed or failed dispatch can be reconstructed after
    the process moves on.

- [ ] **O1.3 Cancellation.**
  - What: cancel a queued or active dispatch; interrupt the session; emit
    `completion status:"cancelled"`; never route a cancelled handoff.
  - Acceptance: cancel before/after handoff behaves loudly and atomically.

- [ ] **O1.4 Opt-in parallel dispatches and multiple workspaces.**
  - What: keep the default one-active model; allow explicit concurrency
    with per-dispatch isolation and run ids.
  - Acceptance: parallel dispatches do not cross sessions, receivers, or
    output roots.

- [ ] **O1.5 Engine lifecycle and CLI.**
  - What: start/stop/status, config path, workspace, service attach,
    install/upgrade, heartbeat and readiness; no plugin supervision.
  - Acceptance: `engine start`, `engine status`, `engine stop` work without
    manual process handling.

- [ ] **O1.6 Observability.**
  - What: structured logs, metrics (active, queued, visits, cost, defects),
    optional SSE event stream.
  - Acceptance: an operator can see the queue, the active node, and the
    last defect without reading source.

### Product and usability

- [ ] **O1.7 Install and onboarding.**
  - What: one-command install; config template; plugin/skill install;
    version pin; first-run proof.
  - Acceptance: a fresh workspace reaches a live dispatch without editing
    engine source.

- [ ] **O1.8 Graph library and templates.**
  - What: reusable build-review, review-only, and background examples;
    import/export; validate on import.
  - Acceptance: templates validate and run live; no drift from the schema.

- [ ] **O1.9 Agent-facing errors.**
  - What: defects include the exact node, label, path, and recovery hint;
    the skills explain each.
  - Acceptance: a user can act on the defect without asking the engine
    author.

- [ ] **O1.10 Permission UX.**
  - What: interactive tools request/allow cleanly; helper sessions remain
    deny-rest; no wildcard denials that hide the lever.
  - Acceptance: a first-time interactive session can use the tools after
    the documented allow step.

- [ ] **O1.11 Documentation.**
  - What: product guide, recipes, troubleshooting, trust boundary,
    versioning.
  - Acceptance: the guide matches the live proof and the spec.

## v2 — Reach

Target: the deferred node kinds and input surfaces, only where v1 has a
proven gap.

- [ ] **V2.1 Programmatic node type.**
  - What: a work kind that parses content and computes a label without an
    agent; same handoff surface and routing. The node's work slot is
    reserved.
  - Acceptance: a live graph mixes agent and programmatic nodes; the
    programmatic node is deterministic, testable, and verifier-checked.

- [ ] **V2.2 Triggers, watches, and schedules.**
  - What: external input that queues a dispatch — directory changes,
    schedules, or explicit events — with one match per idle turn,
    alphabetical resolution, and the same queue.
  - Acceptance: an external event starts a dispatch without an interactive
    agent; the trigger is an extension of the existing queue, not a new
    engine.

- [ ] **V2.3 Graph composition and subgraphs.**
  - What: reusable graph fragments or nested graphs, with explicit
    boundaries and validation.
  - Acceptance: a composed graph validates and runs live without special
    engine code.

- [ ] **V2.4 Schema versioning and migration.**
  - What: config version negotiation and migration; reject unknown
    versions with named faults.
  - Acceptance: a version-3 config loads on the declared engine version and
    a migration from an older config is tested.

- [ ] **V2.5 Bounce-back ladder.**
  - What: config-composed retry/exhaustion ladders beyond the configured
    `maxVisits` bound and the 100-visit engine backstop, without breaking
    the one-label/one-target rule.
  - Acceptance: a live exhausted loop follows the composed ladder or
    defects loudly.

## Not planned

- Documents as state, stamps, stamp vocabulary, projects, records,
  watchers, reconciler, delivery/engine commits.
- Entry and exit node types; the graph begins where a dispatch names a
  node and ends at a terminal.
- The plugin ecosystem, catalog, skillset marketplace, inbox, supervisor.
- A UI as the primary surface; the conversation is the product surface.
  A read-only dashboard may be considered in O1.6.
- Parallel dispatches by default; one active dispatch remains the default.
- Multiple separate graphs or a graph selector. One config is one graph;
  workflows are subsections, not separate graphs. A second graph would need
  a separate ruling and a separate version.

## Open roadmap decisions

These need a ruling before their item is built:

1. **Sandbox:** separate UID, container, or OpenCode server isolation?
2. **Durable store:** JSONL/SQLite/file layout for acks, queue, history?
3. **Receiver:** one engine endpoint with run ids, or one endpoint per run?
4. **Programmatic node:** a new work kind in the same node class, or a
   separate node type? (The spec reserves the work slot.)
5. **Trigger source:** directory watch vs schedule vs explicit event;
   what a match carries.
6. **Cost budget:** per dispatch, per node, or per graph? Who sets it?
