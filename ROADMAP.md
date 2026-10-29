# Roadmap

**Baseline:** v1 (tag `v1`, commit `236e2e9`) plus the v1.1 graph-model
slice — live-proven on OpenCode 2.2.0. The engine runs agent-node graphs,
enforces one handoff per node, queues dispatches FIFO, validates and
reloads config, resumes the implementation session across a review loop,
keeps the reviewer fresh, and gives the interactive agent a graph map,
artifact, and command.

This document tracks deferred work. It is not a wish list: each item has a
target version and an acceptance condition. Check an item only when its
acceptance condition has been demonstrated, and prefer live proof over a
green stand-in.

**Priority order:** sandbox and tool-surface enforcement first, then
handoff atomicity and durability, then model/cost resilience, then
operations, then reach. v1 is usable, but the trust boundary is still
cooperative helpers.

## Shipped in v1

- [x] One JSON graph config with strict validation and named faults.
- [x] Helpers, nodes, outputs, terminal/unconditional/conditional handoffs.
- [x] Any node can be a dispatch entry point; every node must reach a
  terminal; every cycle carries `maxVisits` 1–3.
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
  `reload`, `graphs`.
- [x] Interactive skills: graph-authoring, dispatching.
- [x] 28 offline tests and a live proof covering stdio dispatch, queue,
  interactive dispatch/wait, config authoring/reload; background
  dispatch (wait:false then dispatch_wait) was exercised in a separate
  live probe.

## Shipped after v1 (v1.1 graph-model slice)

- [x] **Workflows are labelled subsections of a graph.** A workflow is
  `{ id, entry, exit, nodes }`; it is a view, not a container, not a
  runtime unit, and not a dispatch target. Nodes and edges belong to the
  graph; a node may be in zero, one, or multiple workflows. The engine
  routes by handoffs, never by workflow.
- [x] **Session modes.** A node declares `session: "fresh"` (default) or
  `"resume"`. The implementation node resumes its original builder session
  on a fail loop; the resumed brief carries the reviewer's output path.
  The reviewer is fresh on every review pass. The live proof shows one
  builder session id across three visits and different reviewer session
  ids on both visits.
- [x] **Graph view.** `graph_map` returns a deterministic Mermaid map,
  workflow table, node table, legend, and live state. `/graph` prints them
  verbatim with no narrative; `GRAPH.md` is written on boot and every
  valid reload. The live proof renders the map in an interactive session
  and checks the resume/fresh markers.
- [x] **Session lifecycle cleanup.** Fresh sessions are deleted after
  their visit; resume sessions are deleted at dispatch end.

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
    retryable errors; a hard 3× cap; no hidden retries.
  - Acceptance: timeout, interrupt, and provider failure each produce the
    declared outcome; the cap is enforced.

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
  - Acceptance: a v2 config loads on the declared engine version and a
    migration is tested.

- [ ] **V2.5 Bounce-back ladder.**
  - What: config-composed retry/exhaustion ladders beyond the hard 3× cap,
    without breaking the one-label/one-target rule.
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
