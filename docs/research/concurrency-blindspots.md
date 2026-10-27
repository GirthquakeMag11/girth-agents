# Concurrency blind spots in the engine map

**Question:** where does the plugin-transition map silently assume one thing
happens at a time, what breaks when two things happen at once, what evidence
lets a fresh engine reconstruct in-flight work after a crash, where are the
race points, what happens with two checkouts or worktrees — and which parts
of the stance are answerable now?

**Date:** 2026-10-26. **Read-only hunt;** this report is the only
deliverable. Sources: the map (`plans/plugin-transition.md`), the tracker
(`tracker/QUESTIONS.md`), and the research notes
(`docs/research/opencode-engine-mechanics.md`, `opencode-tui-distribution.md`),
with crunch from `fog-audit.md`, `zeroshot-open-engine.md`, and
`project-locations-mechanics.md`. The stance question this hunt feeds is
tracked at `QUESTIONS.md` L9–21.

**Citation key (line numbers):** `map` = plans/plugin-transition.md;
`Q` = tracker/QUESTIONS.md; `em` = opencode-engine-mechanics.md;
`tu` = opencode-tui-distribution.md; `zs` = zeroshot-open-engine.md;
`pl` = project-locations-mechanics.md; `fa` = fog-audit.md.

## 1. Settled rulings that silently assume one thing at a time

- **The reports pile has no write protocol.** The pile is one scaffold piece
  in each project that "the engine and the sidebar read one place" (`map
  L470–472`), and the verdict is double-written: report to the pile, stamp on
  the checked work. Nothing rules who may write the pile at once, where a
  report lands (per piece, in order, named how), or what a reader does with a
  half-written report. Two reviews of different pieces — or the reviewer and
  the idle lesson-consolidation pass that "collects" reviewer-jotted claims
  (`map L241–244`) — interleave writes to one shared directory with no
  ordering rule. Breaks: the sidebar's derivation (below) and the PASS/FAIL
  read the fixer acts on (`map L150–154`).
- **The sidebar derivation presumes a quiescent records set.** Pieces "in
  motion — being built, under review, sent back for repair" are "read from
  the records, never hand-written" (`map L163–167`). That derivation has no
  verdicts about torn reads: a report written while the sidebar renders it
  shows a piece in two states or none. The TUI half is unverified anyway —
  slot live-reactivity is a flagged keystone (`map L58–63`, L649–654;
  `tu` L36–37, L111).
- **Entry-point clearing assumes one plan at a time.** Running the tool is
  the clearance act (`map L189–193`); several cleared plans "queue in
  received order" (`Q` L437–441). Two wayfinding sessions clearing plans
  nearly simultaneously race on who was "received" first, and the queue
  itself has no recorded home (see §2; `fa` L270–273).
- **The reviewer is always fresh, one reviewer per piece.** "Every stage
  runs fresh; the fixing agent keeps its session; the checker is always
  fresh" (`map L194–196`). Nothing rules out two review dispatches of the
  same piece (e.g., engine restarts and re-sends the review — see §2), and
  nothing bounds a review while the builder's kept session is still live in
  the same tree (`map L150–154`, L432–435).
- **Bootstrap is synchronous — and therefore implicitly exclusive.** "The
  engine is not yet alive, nothing else is pending, and there is no inbox"
  (`map L115–120`). True only if bootstrap never overlaps a running engine.
  But the engine is always-awake in the plugin (`map L185–188`) — nothing
  stops it watching a second started project (or spawning for a plan cleared
  mid-bootstrap) while `/bootstrap` fills the scaffold; and the re-run door
  is the start switch itself (`map L97–103`), so a second bootstrap of a
  live project is un-ruled. Breaks: the scaffold is written while the engine
  writes the records that the same scaffold just created.
- **Checkpoint-fold assumes linear stage flow.** After a PASS the work
  "proceeds on its own" (`map L132–136`); the loop driver sends in the
  reviewer, reads the verdict, repeats until PASS (`map L480–482`). The
  ruling describes exactly one stage transition at a time and says nothing
  about two chains in one project, or a FAIL landing while the builder still
  holds its session.
- **Commit-and-push-as-it-goes presumes sequential units.** "One commit per
  meaningful unit… pushed as it goes" (`map L222–225`) with granular commits
  as rollback insurance (`map L329–333`). Two units finishing at once — or
  the idle pass and a review verdict both committing — have no ordering rule
  on the shared index, and the user's own commits share the same repo (§3).

## 2. Crash-recovery gaps

- **No record of "started".** The engine "operates only where it has been
  started" (`map L97–103`), but what marks startedness — a scaffold piece? a
  storage key? — is never named, `ctx.storage` durability is an unverified
  keystone (`map L58–63`, L649–654; `em` L265–275, L334–338), and the
  plugin has "no documented restart/wakeup mechanism" (`em` L314–318;
  `fa` L230–236). A fresh engine after a machine reboot cannot know which
  projects to resume watching.
- **The engine's only completion signal is live-only.** Event subscriptions
  are live-only, no replay, no reconnection (`em` L117–120), and `wait`'s
  exact resolve condition is undocumented (`em` L57–59, L296–308). Rulings
  that assume event evidence: the engine "detects and recovers a lost
  session" (`map L194–196`) — by what marker, into what state, is unsaid;
  "the engine picks up answers" from inbox sessions (`map L159–162`,
  L513–520; `Q` L205–223, L370–377; `fa` L220–228). An engine that dies and
  restarts while a helper session is mid-flight has no stream from which to
  learn the session finished.
- **Mid-stage death has no resume device.** Zeroshot's crash-safe SQLite
  ledger is the device deliberately not borrowed (`map L665–671` names the
  rejected four, but nothing replaces the ledger; `fa` L245–251: two engine
  wake-ups or a restart mid-stage can double-process a widget with no
  recorded guard). The typed hand-offs — brief, checklist, verdict+report
  (`map L460–465`) — describe a stage's inputs and outputs, not its
  in-flight position. Death mid-review leaves a piece that is neither
  un-reviewed nor PASSed; nothing states which record a fresh engine reads
  to tell, and the rulings above assume it can tell.
- **A helper session lost mid-fix loses everything typed records don't
  carry.** The builder "keeps its session across fix-rounds" and the engine
  recovers a lost one (`map L150–154`, L194–196); hand-offs carry "only
  typed essentials," raw chat never crosses (`map L460–465`). But a fix's
  working state — which files were touched, which test run, what remains —
  lives in the worktree and the session transcript, neither of which the
  typed hand-off captures. A recovered fixing session against the work stage
  (`fa` L253–261: "work" is code with no records form) starts from a verdict
  that says only FAIL.
- **Mid-push and mid-report-write both violate the double-write rule.**
  "The verdict is also stamped on the checked work, so the engine and the
  sidebar read one place" (`map L470–472`) — report-write and stamp-write
  are not atomic; a crash between them leaves one place saying PASS and the
  other empty. Likewise the commit unit's push ("pushed as it goes",
  `map L222–225`) leaves a fresh engine unable to tell committed-but-
  unpushed from pushed; offline behavior and push retry are the explicitly
  open GitHub-integration mechanics (`map L604–610`, `Q` L88–100).
- **Engine scope is un-ruled, so "fresh engine" may be plural.** Whether
  the engine is one instance across started projects or per project was
  "raised by the reviews, not yet put to the user" (`map L659–663`). Crash
  recovery cannot be specified until the answer says how many engines might
  wake up and share the state.

## 3. Race points

- **Engine commits vs. the user editing the same file.** The branch
  discipline "varied with the scope of the work" is the open crux; the
  "excluded zeroshot single-writer world is exactly what these commits must
  not assume" (`map L604–610`). The leash — touches only work it made
  itself and files an agent cleared (`map L185–188`, L189–193`) — has no
  file-level ownership record, and the user's live TUI sessions edit the
  same checkout freely. A commit unit spanning a file the user just edited
  merges the user's changes into an engine commit, or clobbers them on
  checkout.
- **Two projects' engines both self-report to the plugin repo.** The
  exception self-reports "a defect entry filed from the failing install",
  typed records only (`map L442–446`) — a second repo the engine commits
  and pushes to, with no coordination among reporting projects. Two failing
  installs push concurrent defect records to one repo. Same shape, closer to
  home: the repo the plugin installs from is also the dev workspace
  (`map L42–45`, L501–506) — see §4.
- **Inbox items written while being answered.** The answerer's seeded
  session "records the user's response" while the engine keeps writing new
  messages to the same inbox ("the inbox keeps its own record — the messages
  it sent and the replies received"); the reply additionally "lands on the
  tracker question as its resolution" (`map L159–162`, L168–177`). An
  answering session recording a reply while the engine writes a follow-up
  message, or closes/re-files the tracker question, has no ordering rule.
- **Sidebar reading records mid-write.** Derived live from the records
  (`map L163–167`), reactive-reading unverified (`tu` L36–37, L111);
  combine with the pile's missing write protocol (§1) and the readout can
  show halves of two states.
- **Bootstrap running while a chain runs.** The synchronous-bootstrap
  ruling (`map L115–120`) excludes this by assumption, not by mechanism
  (§1); the start-switch is the re-run door (`map L97–103`).
- **Idle consolidation vs. active review.** The engine's idle pass gathers
  and checks reviewer-jotted claims "against what is already known"
  (`map L241–244`) while a review of the same piece may be in flight, and
  prove-it/fact-finder keep each other in line (`map L259–265`) — two
  background helpers reading records a builder is committing concurrently.
- **Checker fresh vs. builder still holding its session.** The reviewer is
  "always fresh" (`map L194–196`); the work stage grades "the code changes
  and the test-drive proof as evidence" (`map L432–435`). Nothing makes the
  builder's kept session quiescent during review — the PASS can stamp code
  that changes under it.

## 4. Multi-machine, worktrees, push conflicts

- **Two checkouts, two engines, one project.** "Project" is a durable,
  cross-checkout identity — OpenCode keys worktrees on `projectID`, and
  config/plugin loading uses the saved canonical checkout (`pl` L64–84,
  L386–413; `map` L611–624). But the map's "one root store per repository"
  (`map L234–240`) is a *place*, not an *election*: nothing prevents two
  always-awake engines in two clones of one repo from both advancing the
  same root tracker, both committing, both pushing. With engine scope
  itself un-ruled (`map L659–663`), the second machine's OpenCode install
  knowing "where it has been started" (§2) is the only existing brake, and
  it is un-recorded.
- **Worktree strategies exist and the map is silent on them.** OpenCode
  has worktree operations keyed by projectID, a `worktree.updated` event,
  and startup commands for new workspaces (`em` L110–111; `pl` L64–84).
  Zeroshot ran its staged agents in a separate worktree — and its
  workspace-restore/copy-checkout machinery is explicitly out of scope
  (`map` L665–671`), so the engine's stages run where OpenCode's working
  directory points: the human's own checkout. Whether stages get worktrees
  of their own, or records branch, is never asked; if they did, the single
  root record store would be written from two trees with merge as the only
  convergence.
- **Push conflict between engine and user.** Same-remote pushes have no
  policy (`map` L604–610`): the user's TUI-session commits, the engine's
  unit pushes (`map` L222–225`), and — on this very repo — the maintainer's
  interactive work share one origin. A rejected non-fast-forward push loses
  an engine unit unless recovered; nothing rules the retry.
- **The two-layer map lives in a repo the engine could itself watch.**
  [Ours] process and [The system] are ruled separate layers (`map` L15–29`,
  L436–441`), and the destination is that this catalog *becomes* the plugin
  (`map` L5–11`). The map never asks whether the plugin repo is also a
  started project later — at which point the engine's chain (writing
  tracker, inbox, reports under [The system]) and the maintainers' own
  process (writing plans, decisions, specs under [Ours]) coexist in one
  checkout with disjoint record families but one git index.

## 5. The now-vs-future axis

Answerable now — stance, not mechanism:

- Engine scope: one engine across started projects, or per project — the
  reviews raised it and it has never reached the user (`map` L659–663`).
- Whether two chains / two stages may be in flight in one project at once
  (the checkpoint fold, `map` L132–136`, only rules sequence within one
  chain).
- Whether helpers run concurrently with the builder and each other
  (`map` L150–162`, L241–244`, L259–265`).
- Whether bootstrap is exclusive with engine work in that project, and
  what a re-bootstrap of a live project is (`map` L97–103`, L115–120`).
- Commit-and-push principles in the presence of the user's live commits:
  the discipline is declared, the mechanics deliberately deferred
  (`map` L329–333`, L604–610`; `Q` L88–100`).
- Whether the engine may assume it is the only engine for a repository
  (cross-checkout identity is settled at `pl` L386–413; the election is
  not).

Genuinely blocked on the record system existing:

- Exactly-once per unit: a crash-safe "state transition" record (cleared →
  queued → picked up → reviewed → fixed → passed) does not exist as a type
  yet; the typed forms are themselves spec-deferred (`map` L651–657`),
  and no ruling names the guard that replaces zeroshot's ledger
  (`fa` L245–251`).
- Crash resumption of a helper session: depends on the work-stage record
  shape — what the implement-stage reviewer reads and what receives the
  stamp is "assigned to nothing" (`map` L432–435`; `fa` L253–261`).
- The plan queue's home ("received by whom, recorded where")
  (`fa` L270–273`; `Q` L437–441`).
- Inbox read/write protocol: message and reply forms are spec detail
  (`map` L651–657`; `Q` L217–222`, L370–377`), so channel races cannot be
  ruled against typed messages yet.
- Cross-checkout arbitration: a lock/lease/ownership record would itself
  be a new record kind entering the kind set — a record-shaped answer, not
  a stance answer.

## 6. What typed records already buy, and where they don't reach

Buys for concurrency:

- **Records are the single serialization point.** Briefs compiled from the
  records, verdicts with reports, stamps on the checked work
  (`map` L460–465`, L470–472`) mean two writers converge on *named, typed
  state* rather than transcripts — the precondition for any lock, compare-
  and-swap, or idempotent rewrite the stance might choose. Questions-as-
  tracker-kinds sent "by reference, never copied" (`map` L168–177`),
  L296–300`) eliminate divergent copies of the same pending question.
- **Records-first enables a lock record cheaply.** One root store, scoped
  reads, context-tagged senses (`map` L234–240`) mean a lease or
  ownership record slots into the existing store without a new scaffold
  piece.
- **The engine's leash is already an ownership concept.** "Touches only
  work it made itself, and files an agent has cleared" (`map` L185–193`)
  is exactly the vocabulary a write discipline needs; the typed records
  only have to carry it to make it checkable.

Where it silently doesn't reach:

- **The worktree's code files have no envelope.** The records pipeline
  treats every stage's product as a document except the last: work is code
  (`fa` L253–261`), verifying the live worktree rather than the records
  is explicitly out of scope (`map` L665–671`), and raw chat's value must
  be folded in before the boundary (`map` L455–465`) — but the implement
  stage's touching, changing, committing is the one place the leashed state
  has no typed form. Records-first reaches the boundary between stages;
  it does not reach the files inside the work stage, which the user edits
  in parallel with no door at all.
- **Git is the only concurrency control there, and it is the one declared-
  but-open mechanic** (`map` L604–610`, `Q` L88–100`): branch discipline,
  commit-unit collisions with user edits, and push-conflict recovery all
  live precisely where the typed records stop.
- **Engine-local state is outside the records.** `ctx.storage` (unverified
  durable, `em` L265–275`) and in-memory event streams (`em` L117–120`)
  are the engine's only non-record state, and the sidebar's live-read path
  (`tu` L36–37`) depends on exactly that un-typed layer — the one place the
  map leans on state that is neither a record nor verified.

## Stance frontier

Distinct questions the stance must answer; each next-round question is one
line:

1. Scope: one engine per started project, per machine, per clone — or one
   engine across all started projects — and what arbitrates when two live
   engines see one project?
2. Per-project parallelism: may ready stages of different chains run at the
   same time, and may one project hold more than one chain in flight?
3. Helper concurrency: may the checker, fact-finder, prove-it, caregiver,
   and the idle consolidation pass run while a builder holds a live session
   — and while each other?
4. Bootstrap exclusivity: is bootstrap mutually exclusive with engine work
   in the project, and what is a re-bootstrap of a live project (the
   start-switch door run again)?
5. Entry ordering: when several plans are cleared near-simultaneously, what
   defines "received order" — and may two chains' stages interleave?
6. Engine-vs-user file discipline: what keeps an engine commit unit from
   carrying (or clobbering) the user's live edits to the same files, beyond
   the leash's self-restraint?
7. Branch and push sharing: do engine commits and user commits share
   branches, and what is the retry and reconciliation policy on push
   failure or mid-push death?
8. Cross-checkout and worktrees: may two checkouts or worktrees of one
   repository each run an engine, and if the root record store is single,
   what elects or locks its writer?
9. Crash contract: what must a fresh engine reconstruct from records alone —
   startedness, queue positions, in-flight stage state, lost helper
   sessions — given live-only events and unverified storage durability?
10. Exactly-once: which recorded transition (a ledger-style record, per-unit
    state stamps, or the reports pile's own protocol) prevents a restart or
    a missed event from double-processing a unit?
11. Read consistency of the derived sidebar: are record writes atomic per
    unit, and does the breakdown show a torn mid-write view, settle
    eventually, or freeze?
12. Inbox channel discipline: who may write inbox messages, replies, and
    tracker resolutions at once, and what happens when an answer lands on a
    question the engine simultaneously re-asks or closes?
13. Human doors alongside the engine: what happens when the user runs
    `/bootstrap`, `/wayfind`, `/spec`, or `/implement` in their own live
    session while the engine runs — pause, detect, or conflict?
14. Two-layer coexistence: when the plugin repo itself is a started project,
    how do [Ours] process records and [The system] engine records coexist
    in one checkout and one git index?