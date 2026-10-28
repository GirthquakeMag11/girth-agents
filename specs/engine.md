# The engine

## Problem Statement

The system's build-verify-rectify chain — plan made, spec built from it,
tickets sliced from that, work built from the tickets, every piece
reviewed and repaired until it passes — stalls whenever it depends on a
human and lives in whichever session's chat happens to hold it. The
user has ruled (plans/plugin-transition.md) that this chain is the
engine's job, not an interactive one: the engine is the always-awake
harness that watches a project's records, dispatches headless helper
sessions for each step, moves work through a configured node graph, and
halts only where an answer outside the system is genuinely required.
This engine does not exist yet — its identity, its watching, its
graph, its state, and its seams are rulings waiting for a build.

## Solution

One engine: a process of its own, spawned from the plugin's server side
inside the OpenCode background server — exactly one per machine, alive
as long as that server lives, serving every activated project on it,
supervised by the plugin and respawned if it dies.

The engine is a graph runner. It executes one canonical workflow graph
whose nodes, links, conditions, prompts, and limits are data — a
schema-validated JSON config the package ships, booting loudly or not
at all — while the graph's flow structure is the engine's hardcoded
skeleton. Each node gives one helper one objective in one headless
session — spawned through the engine's own OpenCode server client, with
that helper's model and pre-granted, deny-rest permissions — and, when
the session is done, reads exactly the output artifact the node's
config names, routing onward or out by what it parses from that
artifact's stamp fields. Entry and exit nodes are the seam: the exit
routes a node's output conditions to something outside the system, the
entry routes outside input back in.

All durable progress is stamps on the project's committed records;
transient position is memory, re-derived by a reconcile-from-records
pass that is every start's first act. A crash is therefore an
idempotent restart, not a loss. The plugin and the engine speak over a
stdio JSON-lines channel — pokes in, notices out, periodic heartbeats
out, and on-demand introspection of any engine task session — and
nothing the engine relies on depends on OpenCode's live-only event
stream.

Refinement loops, the bounce-back ladder, cleanup, and the enforced
stages are not engine internals: they are protocols composed of
ordinary nodes and conditions in the config. The engine knows the
graph; the config knows the work.

## User Stories

1. As the user of a bootstrapped project, I want the engine to start
   working it on my `/bootstrap`, so that the chain runs without me
   staffing it.
2. As a user, I want the engine to keep advancing ready work after I
   close every TUI window, so that long chains are not hostage to a
   window being open.
3. As a user, I want a crash or restart to resume exactly where the
   committed records say things stood, so that no settled step is lost
   or repeated ambiguously.
4. As a user, I want `/bootstrap` to state plainly what always-awake
   processing means before it starts, and a park command to remove a
   project from the watch while my other projects keep running, so
   that consent and control are mine.
5. As a user, I want the engine to commit and push each unit of its
   work as it goes, so that its work is never lost to bad
   circumstances and can be rolled back.
6. As a user, I want a helper that cannot do its job to fail as a
   visible, typed defect rather than fabricate an answer, so that I
   can trust everything the engine produces downstream.
7. As a user, I want a question only I can answer to halt the chain as
   a typed record awaiting my answer — and to resume the chain when my
   answer arrives — so that work waits on me without stalling anything
   else.
8. As the maintainer of the workflow, I want to define helpers and
   nodes comprehensively in JSON config, so that changing the workflow
   graph never touches the engine's code.
9. As a maintainer, I want malformed or invalid config to make the
   engine refuse to boot, loudly, so that a broken workflow can never
   run silently.
10. As a maintainer, I want refinement loops and bounce-backs composed
    from ordinary nodes and conditions, so that the engine core stays
    small and the workflow stays visible as data.
11. As a user, I want a needed capability my helper's fitting lacks to
    break at dispatch time as a defect, never mid-run as a prompt, so
    that headless work is deterministic.
12. As a user with several activated projects, I want one engine to
    serve them without their chains interfering with each other, so
    that my machine runs one engine, not a sprawl of them.
13. As the plugin's integrator, I want a thin stdio protocol —
    pokes in, notices out — so that the two processes stay loosely
    coupled and the engine dies with its parent.
14. As the user of this repository, I want the engine dogfooding its
    own development from a separate checkout, so that every engine
    feature is proven in a real case before it reaches main.
15. As a maintainer, I want to introspect any engine task session —
    in flight or finished — at any time, and to see the engine
    heartbeat, so that the engine is never a black box waiting to
    surprise me.

## Implementation Decisions

1. **Process, cardinality, supervision.** The engine is spawned by the
   plugin's server side as a child process when the plugin loads; it
   shares the OpenCode background server's lifetime — surviving TUI
   closes, dying with the service. One engine per machine serves every
   activated project. The plugin supervises the child: unexpected exit
   triggers a respawn with backoff; no respawn during the server's own
   shutdown. Every engine start begins with reconcile-from-records and
   is idempotent.
2. **The stdio protocol.** JSON-lines in both directions, all typed.
   Pokes into the engine: activation-added, activation-removed,
   claim-input (a file to claim as a new input — after which the
   engine's entry node runs its own configured validity check and
   parsing), project-paused, project-resumed. Notices out: ready
   (reconcile finished), step-began, step-finished (with the parsed
   stamps), defect (a structured failure), exit-committed (an awaiting
   record was written), and a periodic heartbeat. The framing carries
   a protocol version from day one; unknown message kinds are logged,
   never fatal. Introspection is part of the contract: the plugin may
   request the full state of any engine task session — in flight or
   finished — at any time, and the engine answers in typed state.
   The engine is never a black box.
3. **The config, the agents, and the skills.** A thin JSON manifest at
   the package root points at one Markdown file per agent, one per
   node, and one per skill. Skills are first-class: real skill
   documents in the engine's skill library, each its own file with a
   body of instructions. An agent's frontmatter carries its job,
   toolset, permissions, model, and the skills it bears — resolved
   against the loaded skill library, with an unknown reference a named
   load fault; its body is a role line. A node's frontmatter carries
   its identity, objective, dispatched agent, the one output artifact,
   the step limits, and its out-links — unconditional, conditional on
   the artifact's stamp fields, or exhausted. Tasks and skills are
   separate concerns: some of the catalog's task-shaped skills become
   tasks, and the engine's ability to give its agents skills stands
   independent of that. A missing or malformed piece is a named load
   fault, and the boot is a loud refusal on any invalid config. The
   frontmatter is a strict, constrained subset — anything outside it
   is a typed rejection, never a half-parse. Projects feed the graph
   data from their records and never ship graph structure; a
   per-project graph would be an explicit, reviewed extension if it
   ever earns a need.
4. **The graph executor core.** Hardcoded structure, config-driven
   graph: the executor owns dispatch, artifact reading, condition
   evaluation, routing, entry/exit semantics, and step caps — and knows
   nothing about any particular workflow. Routing is strict: a node's
   out-links are either exactly one unconditional link or a set of
   conditional links — never a mixture, never a catch-all — and a
   stamp that matches no declared condition is a loud defect naming
   the node and the stamp, never a route; an agent's
   contract-breaking output never becomes another agent's
   instructions. Refinement loops and the bounce-back ladder are
   compositions in config, cleanup tasks included; the core carries no
   special machinery for them.
5. **The node's execution lifecycle.** On entering a node: the
   dispatch-time check compares the objective's requirements against
   the helper's fitting, and a mismatch is a structured defect at
   dispatch, never a prompt mid-run. Then a headless session is
   spawned through the engine's own OpenCode server client: the
   helper's model and pre-granted permissions are set at creation; the
   brief — the agent's skills, the claimed input's file (named so the
   helper reads it; the input is the work's contract), the node's
   objective and body, the artifact to produce, and, on repair, the
   failed step's report — is
   the prompt. The engine awaits completion through the client's session
   wait and outcome state, holding its own time cap and interrupting on
   breach. When the session ends, the engine reads only the configured
   output artifact; session completion state is read for control, and
   is never an output. The artifact is committed per the commit-unit
   rule before outbound conditions are evaluated.
6. **Repair resumes the original session.** A repair step dispatches
   by continuing the graded helper's existing session with the
   reviewer's report as added context; the engine supports both
   spawning fresh sessions and continuing existing ones, and the
   choices live in config. The shipped graph encodes the settled
   session-scope rule: the builder keeps its session across
   fix-rounds, the checker always runs fresh. The engine detects a
   lost or failed session and recovers per the session driver's
   contract.
7. **Entry and exit nodes.** Exit nodes are the representations of
   where a node's output conditions route to something outside the
   system; entry nodes are the reverse, input routed in from outside.
   Whether an incoming file is a valid entry point is the entry node's
   own configured judgement: the claim-input poke hands the file to
   the engine, and the entry node parses and validates it against its
   config — an invalid or malformed claimed input is rejected loudly
   as a defect, never silently adopted. On the inside, an exit commits
   its typed record — a question or a defect, per kind — stamped
   awaiting-answer or awaiting-attention, and the chain terminates.
   The answer's record re-enters through an entry node and the chain
   resumes. The inbox itself is deferred; the engine's entire user
   boundary is entry-and-exit-node-shaped.
8. **Watching and reconciliation.** The engine watches each activated
   project's records tree with its own filesystem watch, makes a
   periodic reconciliation pass, and is poked by the plugin when the
   user does something relevant (an entry-point run, a bootstrap or a
   park). It never depends on the platform's event stream — that
   stream is live-only with no replay. The machine's list of activated
   projects is kept by the plugin in its storage and handed to the
   engine at start and on change; the list is association data, not
   work state.
9. **State.** Durable progress is stamps on the records themselves —
   the one place the engine and the sidebar read. The stamps the
   engine core recognizes: ready, stamped-done, stamped-pass,
   stamped-fail, awaiting-answer, awaiting-attention, invalidated —
   the pass/fail pair and the awaiting pair written out from the
   plan's open placeholder and the exit-node contract, and
   invalidated from the invalidation ruling that marks, never
   deletes. In-flight is never committed; on recovery an in-flight
   piece falls back to its last durable stamp and is re-picked.
   Transient position lives in memory and is re-derived. There is no
   separate engine state store.
10. **Delivery.** The engine does its own git delivery: one commit per
    meaningful unit with a conventional message, pushed as it goes,
    pull-first, unpushed commits held locally and retried on the next
    pass, never a force-push, rebase, reset, or self-performed merge.
    Non-fast-forward divergence holds the commits, leaves the working
    tree alone, and raises a typed stop through the exit path — the
    reconciliation is the user's authority.
11. **The engine's server client.** The engine holds its own OpenCode
    server client in its own process. The exact cross-process
    attachment — server discovery and authentication from a second
    process on the same machine — is unverified and is the first fact
    checked at build. This spec's designated fallback, if a direct
    client proves impossible, is for the plugin to proxy session
    operations over the stdio channel — flagged for approval
    attention, as it widens the channel. The engine never uses
    plugin-side storage, tools, or events.
12. **Bounce-back composition.** When an irrecoverable failure is
    encountered, the bounce-back ladder is what the configured graph
    does about it: retrograde conditions route the work back a layer
    at a time — with logging thorough enough to diagnose the mistake
    and the problem's context carried into the retrograde review and
    repair tasks — escalating one layer per exhausted retry limit or
    conceded impossibility, until an exit node terminates the chain.
    All of it — conditions, loop limits, context — is config; marks
    move in the records, bytes are preserved.
13. **Config verification — the config problem gate.** Before a
    workflow graph ships, it passes a verifier that answers "is this a
    config problem?" in three layers: the deep schema (every constraint
    named), the graph's structure (dangling references, unknown
    helpers, requirements beyond a fitting, unreachable nodes, exits
    that route, entries without a path), and a dry-run matrix that
    drives the config through the real executor against a fake driver —
    probing every condition's branch and the value nothing routes.
    Sound means the verifier names nothing. The division of labor that
    follows: anything the verifier names is the config's fault; a
    failure on a config the verifier proved sound is the engine's. The
    same gate runs on every shipped workflow config before it is
    trusted.
The executor's hardcoded skeleton gains one more structural
    enforcement: a task node may carry a maxVisits bound, and its
    exhausted link is the route taken on the visit after the last —
    the structure enforces loop limits, the config sets the number.
    The first shipped workflow config (`config.json` beside the engine)
    is implement-from-ticket: a ticket stamped ready enters, the builder
    implements it and reports, the reviewer verifies and stamps
    pass-fail, a fail routes to repair resuming the builder's session
    with three retries, a bounce exit writes the awaiting question when
    the limit trips, and a pass terminates at the implemented exit —
    which writes nothing; the work itself is the outcome.
14. **Scheduling, the leash, and user edits.** Within a project the
    engine does one thing at a time: one current step in flight,
    everything else ready-but-waiting; a step is exclusive — every
    writing helper waits for the step in flight — while the watching
    never sleeps; parallelism exists only across separate projects.
    The leash is absolute: the engine touches only work it made itself
    and files an agent has cleared, and never the forbidden list's
    operations. A user edit to a file the engine also works is checked
    against its accounting — silently absorbed when it fits the
    system's context, raised as an alarm through the exit path when it
    does not — before the engine ever builds on it. Defect records
    bound for the plugin's own repository — the self-report path — are
    sent only with consent asked at the moment of sending, declining
    always available; a report awaiting consent is itself an exit
    record. Step caps and time budgets are configuration with shipped
    defaults — the structure enforces, the config sets; no number is
    hardcoded in the engine.

## Testing Decisions

The engine is constructed testably around a small set of seams, and
each seam has a fake: the config loader and its validator (invalid
config refuses loudly); the condition evaluator (expressions over
artifact stamp fields, including malformed-artifact rejection); the
graph executor (a step machine driven with a fake session driver —
spawn, await, interrupt, read-artifact are faked deterministically,
including time-cap breach and session loss); the records reconciler
(rebuild-from-stamps on every start, in-flight fallback, no zombie
stamps); the watcher (fs-watch plus periodic pass plus pokes; missed
changes are caught by the next pass, never by the event stream); the
delivery module (commit-unit, pull-first, local-held retries, and the
non-fast-forward hold); the stdio framing (versioned JSON-lines,
unknown-kind tolerance); and the supervisor (respawn with backoff, no
respawn on shutdown).

The config verifier is itself a seam: it drives the real executor with
a fake driver over a branch matrix, so a config fault is named without
any live platform, and a sound verdict is what the workflow-graph work
gates on — engine problems and config problems never masquerade as each
other.

Two structural rules: everything the engine does against OpenCode goes
through the session driver interface, so the executor — the engine's
heart — is testable with no live platform; only the driver itself
touches the live client. And what a test asserts must map to trust:
observables are committed records, stamps, and git history — the same
surfaces the bug would show up on in real operation — not internal
counters that prove nothing.

Real-case proving happens through dogfooding on this repository from a
separate installed checkout, driven before merge to main, per the
project's testing system. Prior art for the design: the research notes
on OpenCode plugin mechanics and the zeroshot open-engine study.

## Out of Scope

The inbox beyond entry-and-exit records; the workflow's node topology,
including the enforced stages and the plan-stage question (they are
config content shipped after the engine core); the full typed forms —
brief, checklist, verdict-and-report — beyond the stamp fields this
engine reads (the umbrella spec pins the complete shapes); the
scaffold-migration rules; multi-machine arbitration; package
publication; the TUI surfaces and the catalog's transforms (the
plugin's own spec); GitHub integration beyond delivery; the project's
own testing harness, which is this effort's working process, not the
engine's.

## Further Notes

The verification seam (Implementation Decision 13) was ordered after
the engine was built, before any workflow graph ships: configs are
verified sound before they are trusted, so a later failure on a sound
config means the engine — that is the divider between the two kinds of
problem.

Settled in the plan's engine objectives — including the engine-gap
grilling of 2026-10-27 — and recorded in the glossary where terms are
defined (the engine, helper agent, entry node, exit node). The
standing decision `decisions/0007-plugin-transition.md` names the
umbrella spec as the next effort; the user has since directed, in the
session of 2026-10-27, that the engine be carried through to
implementation first — a pivot to be recorded formally in `decisions/`
at or before this spec's approval.

Spec-shaped decisions flagged for approval attention, not plan-sourced:
the commit-before-route ordering in Implementation Decision 5; the
proxy fallback in Decision 11; and the stamp vocabulary written out in
Decision 9, which completes the plan's open awaiting-… placeholder.

Facts verified at build start, not before: the cross-process client
attachment (Implementation Decision 11); session wait and outcome
semantics on a live build; any property a live probe can check faster
than a spec can guess.

Settled in the refinement pass: the poke vocabulary (claim-input
replaces entry-point validity in the engine; validity is the entry
node's config), the notice stream (with periodic heartbeat and
on-demand introspection — no black boxes), and cadence and budgets are
config with shipped defaults. The workflow graph's actual content —
deferred at the user's direction until the engine existed — is now
shipped: the implement-from-ticket workflow of Decision 13, its entry
marker the ticket's ready stamp (`**Ready:**`, dated). Still open: the
cross-process client attachment (fact-checked first at build), live
session-wait and outcome semantics, the chain's forward extension
(ticket-from-spec), and the shipped default numbers, which the config
writer sets when the config is written.