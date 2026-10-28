# The skillset becomes an OpenCode plugin

**Status:** charting — re-entered 2026-10-27; the premature
spec-slice-implement pass was discarded and the lessons it taught are
being woven back into this map's own mechanics.

## Destination — [Ours: this effort's own working process]

A formally recorded decision (`decisions/`) turning this catalog into an
OpenCode plugin, then one umbrella spec — the skills, commands, agent
types, tools, and code of that plugin — written as one coherent set and
approved once. Building and slicing are the next effort and begin only
after approval.

## Notes

- Plan review — the three focuses (chat M1262): of the three plan
  reviewers, one verifies claims about the user's intent against the
  chatlog, one verifies claims about technical matters against reality,
  and one verifies that the fog is cleared and no unanswered questions
  remain. This sets each reviewer's intended focus for the grading, and
  constrains nothing else they may grade on.
- Plan review — citation access (chat M1262): the plugin itself gives
  plan reviewers direct access to the session's chatlog — no manual
  export, no manual sifting — and a reviewer requests the message a
  plan item cites, by that citation. The citation is the query; the
  access is the plugin's, not a maintainer's chore.
- Plan review — snapshot timing (chat M1269): the reviewer receives
  the chatlog as it is at the time of the review — a snapshot exported
  earlier and handed over later is stale by construction. Until the
  plugin's citation access exists, the standing interim practice is a
  snapshot taken at the moment the reviewers are launched, never
  before.
- Plan review — mandatory rules (chat M1200; reaffirmed M1220 with the
  rule that this entry itself must be cited): plan reviewers receive the
  raw chat log as it exists at review time — never a substitute; every
  item in the plan cites the exact user message it was derived from,
  and the reviewer confirms each item coheres with something specific
  the user actually said; claims require verification and citation; a
  reviewer FAILs a plan that is not wholly complete and ready for
  specifying; the plan may never assert anything unverifiable — an
  assertion about the user's intent, or about a technical matter;
  uncleared fog is failure, lying is failure, being wrong is failure.
  The agent is not exempt and may not alter these rules. The interim
  mechanism until the plugin's citation access exists: a fresh
  snapshot export at each reviewer launch, never an earlier one
  carried forward; the snapshot for round 3 is taken at dispatch.

- **Two layers, and reviewers must honor them.** [Ours] = this effort's
  own working process — how girth-agents itself is being built, its
  approvals, its testing, its releases. [The system] = the machine the
  plugin will be — the engine, the gate, the helpers, the chains it
  runs on projects. Every decision below rules exactly one layer. A
  reviewer flagging an apparent conflict BETWEEN the layers has done
  its job: the representation FAILs, correctly. The interpreter then
  classifies: a cross-layer artifact is a representation problem — the
  map's conflation, fixed by the recorder, never a question to the
  user; a same-layer conflict is a genuine design question; unclear
  scope gets the scoping-clarification question, never a demand to
  reconcile two separate contexts. (Incident of 2026-10-26: an
  unlabeled map produced a legitimate FAIL, and the interpreter treated
  the representation problem as a design problem — the inversion this
  warning exists to prevent.)

- The catalog's identity carries into the plugin: skills, commands, and
  agents stay plain Markdown, ship bundled with the plugin, and the
  plugin's `setup()` registers them through the skill/command/agent
  transforms. Nothing converts to code unless a trigger needs it. (chat M323)
- The user's test-driving surfaced the change set: many item-level
  changes aimed at cross-cutting concerns — too disorganized to enumerate
  linearly. The map is the organizer: the cloud is harvested, then worked
  decision by decision. (chat M315, M418)
- `plans/installer-experience.md` ruled package-manager channels out of
  scope for the installer. The plugin supersedes that ruling where it
  lands; the channel decision settles how far. (chat M421)
- Facts the map leans on: plugins register commands, skills, and tools
  via transforms — but NOT agents, verified negative live (`AgentEditor`
  has no `add`, chat M1126); package plugins publish to npm and
  install/update/check through `opencode plugin`; the repo remains the
  dev workspace regardless of channel. (chat M497)
- TUI facts: the right-hand panel is the sidebar, reached by CLI-plugin
  slots (`sidebar.content`); a package ships a `./tui` export beside its
  server export — one package, two entries; CLI-only plugins configure
  separately in `cli.json`; plugin routes register whole screens through
  the TUI router; the menu is the command palette (Ctrl+P; Escape is
  interrupt, not a menu).
- Ground research (2026-10-25 survey, three cited notes in
  `docs/research/`): engine mechanics — spawning, driving, and awaiting
  sessions, always-awake lifetime, and detection all supported by the
  plugin context; TUI + distribution — routes, sidebar slots, palette,
  git-spec install, and the "inbox" name-collision flag; repo grounds —
  the full inventory, sweep lists, and the open-questions checklist. (chat M497)
- Keystones still unverified (do not build on them until checked): the
  git-spec plugin's `./tui` export actually auto-loading; sidebar-slot
  live-reactivity; the full event catalog and the `session.idle`
  payload. The rest of the old keystone list are verdicts now — no
  plugin-added agent IDs (`AgentEditor` has no `add`), `ctx.storage`
  survives restarts, code-mode tools execute — recorded under
  Platform facts below (2026-10-27 live probes; chat M1126).
- Survey findings to fold in before the spec: the `tdd`/
  `writing-for-agents` renames should land as one change, not a
  half-renamed catalog. (The other two earlier findings — 0003's
  marker and the channel's supersession record — were since folded;
  chat M497 ordered the survey.)
- Questioning notes (2026-10-26, user): the design is charted through
  unknown territory; the user may misspeak, make mistakes, hold ideas
  that conflict, or change a mind that was never firmly made up. Doubling
  back over settled ground is expected — when a thread resurfaces,
  re-confirm against the user's live answer rather than assuming the
  earlier one still holds. (chat M418, M621)
- Three-perspective review (2026-10-26; notes in `docs/research/`:
  `fog-audit.md`, `blind-read.md`, `coverage-matrix.md`) opened four
  genuine inquiry threads; each is since settled in the Decisions and
  thread notes below. (chat M497, M870)
  1. The plan gate — settled: the review loop precedes the plan's very
     name; the checklist comes from the session chat and the project
     context; a FAIL returns to the live interactive session that made
     the plan (the repair chair — review before confirmation); a
     dead-end is the loud exception, stamped and self-reported.
  2. The human stops — settled by clarification, not a ruling: the
     umbrella spec's approval is OUR effort's own process, while the
     checkpoints ruling (the plan as the chain's one human stop)
     governs the plugin being mapped. Two layers, no conflict.
  3. The work stage — settled: reviewed ticket by ticket; the code and
     the test-drive proof are evidence, the PASS stamps the ticket.
  4. The survivors — settled: every skill and command now has a fate;
      the sweep complete.

## Decisions so far

- The start switch: settled — bootstrapping is how the engine is
  started in a project; the engine operates only where it has been
  started. The `/bootstrap` command is the necessary on-switch — without
  it the always-awake engine would scatter files (chat M492) wherever OpenCode's
  working directory happened to be. Eager and programmatic, but always
  *within* a deliberately started project. (2026-10-25, user)
- Information-kind dispatch: settled — the engine sends its own help to
  answer an information-kind question. That help cannot fabricate, so
  it can fail openly; when it fails and the failure is not itself the
  answer, the question reaches the user after all. Authority-kind
  questions reach the user, period. (2026-10-25, user) (chat M484, M489)
- Inside vs outside: settled — the engine's embedded agents produce
  everything downstream (reviewed plans, specs, tickets, work, and
  their reports), and that stays inside, never passing the entry-point
  tool. Only products of user-interaction sessions are outside, and
  they cross the boundary through the tool — the plan from an
  interactive wayfinding session being the entry that starts the chain.
  (2026-10-26, user) (chat M519)
- Bootstrap is synchronous: settled — the run begins with the command
  and the user is present, so the residual asks happen right there, not
  through the inbox; at bootstrap the engine is not yet alive, nothing
  else is pending, and there is no inbox to put things in. Eager and
  programmatic describe the filling — everything derivable is derived —
  not the moment. (2026-10-26, user) (chat M600)
- `/retro`: shelved — joins handoff and pickup on the shelf for now,
  kept privately out of the plugin; its fate re-judged when the engine
  exists. (2026-10-26, user) (chat M591)
- Release notes: settled — each release tag also gets a GitHub Release
  page carrying the changelog section (minus the old one-line install).
  The old install line's audience is gone; the notes stay as history.
  (2026-10-26, user) (chat M588)
- The old inbox helpers: settled — `curate-inbox` and `/close-inbox`
  retire; every old job has a new home (the screen, the answering
  helper, the engine picking up answers), and the helper's know-how
  lives in its own definition. (2026-10-26, user) (chat M584)
- Checkpoints: settled — [The system]. After a stage PASSes, the work proceeds on its
  own; the old per-stage approvals (spec's Approve / Approve-and-Slice /
  Stop-and-Amend, slice's ticket-graph approval) fold into the gate.
  The user's one approval stays where direction is set — the plan at
  wayfinding's end. (2026-10-26, user) (chat M579)
- The plugin's layout: settled — the plugin's package file and code
  live at the repo root, beside the catalog and the records; the
  install points at the repo itself, no extra path segment.
  (2026-10-26, user) (chat M574)
- The testing system: settled — a committed automated harness drives
  the real pieces (parser, review loop, session spawn, inbox record,
  TUI slot) with assertions that map to trust; it gates merges to main
  with no manual step, and releases tag only from a green main, keeping
  the release chain clean. (2026-10-26, user) (chat M568)
- The builder: settled — one named helper does every stage's building,
  pointed at each brief in turn; the stage differences live in the
  briefs and the skills, not in separate agent descriptions. (2026-10-26,
  user) (chat M562)
- The fixer: settled — no separate type; the builder repairs its own
  FAILed piece from the report, keeping its session across fix-rounds —
  settled from the start, in the loop's first narration ("the first
  agent rectifies") and again in the session-scope answer. (2026-10-26,
  user, re-affirmed) (chat M557)
- The fact-finder: settled — its own named agent type; it acquires
  answers for information-kind questions and is one of the helpers
  built to fail openly rather than fabricate. The third named agent
  type. (2026-10-26, user) (chat M550)
- The inbox answerer: settled — a defined helper with its own job
  description runs each opened inbox item's seeded session (pose the
  question, discuss, record the answer), the same pattern as the
  reviewer. The second named agent type. (2026-10-26, user) (chat M547)
- Sidebar's ongoing work: settled — the breakdown lists the engine's
  pieces in motion — being built, under review, sent back for repair —
  read from the records, never hand-written; the inbox counter covers
  the user's side, and idle or queued-but-unpicked pieces stay off the
  list. (2026-10-26, user) (chat M541)
- Inbox and tracker, two jobs: settled — the user's words (chat M535,
  the answer round): the inbox is not an interface for the tracker;
  the tracker is how the engine tracks things internally; the inbox
  is how the system sends and receives information to and from the
  user asynchronously; questions are tracked like bugs and tickets
  because they block work, and everything must not grind to a halt
  while a resolution awaits. How an inbox message references its
  tracker entry, and where a reply lands, are record-form shapes for
  the spec (chat M954) — not ruled here. (2026-10-26, user)
- The boundary's one door: settled — the plan from an interactive
  wayfinding session is the only outside document the entry-point tool
  accepts; everything else stays inside the engine or flows in through
  its own channel (inbox answers, rulings). (2026-10-26, user) (chat M525)
- Engine agents cannot lie: settled — agents the engine dispatches must
  never fabricate an answer; each is built to fail openly, reporting
  "could not acquire" rather than inventing one. (2026-10-25, user) (chat M489)
- The engine is awake: settled — the engine lives in the plugin and
  watches on its own, advancing ready work even between messages, on a
  strict leash: it touches only work it made itself, and files an agent
  has cleared. (2026-10-25, user) (chat M480)
- Entry points are the clearance: settled — the entry-point tool is how
  an agent tells the engine a newly introduced file is safe to touch;
  running the tool on a file is the act that makes it an entry point.
  A file the tool has never been pointed at stays out of the engine's
  hands. (2026-10-25, user) (chat M480)
- Session scope: settled — every stage runs fresh; the builder fixing
  its own piece keeps its session across fix-rounds (the engine detects
  and recovers a lost session); the checker is always fresh.
  (2026-10-25, user) (chat M470)
- The exception: settled — a piece that exhausts its fix-rounds
  while still broken, with no answerable question to rectify it, is an
  exception, not a parked state: it means either the fix-round cap was
  too low for the task's scope, or an impossible task slipped through
  wayfinding — the destination on the far side of an uncrossable gap,
  which wayfinding was supposed to catch. It produces a loud, (chat M634)
  observable failure that makes it back to us for figuring out how to
  fix. (2026-10-26, user)
- Reviewer context: settled, for both layers — a review FAILing a
  broken representation is correct behavior, not noise. The
  interpreter's triage decides what the failure means: a cross-layer
  artifact is a representation problem, fixed by the recorder and never
  a question to the user; a same-layer conflict is a genuine design
  question; genuinely unclear scope gets the scoping-clarification
  question ("does this apply here or there?", as asked with
  test-driving), never a demand to reconcile two separate contexts.
  The 2026-10-26 incident is the worked example: a legitimate FAIL on
  an unlabeled map, mishandled as a design question — the inversion
  this entry rules out. (chat M655, M663) (2026-10-26, user)
- Concurrency: declared — the map has not yet addressed asynchronous,
  concurrent, and parallel work across codebases and operations of
  different sizes. The present and future stance must be on the record:
  what runs at once, what waits, and how engine work and the user's own
  live work coexist. The full puzzle is for later; the stance is now. (chat M864)
  (2026-10-26, user)
- The engine's commit unit: settled — one commit per meaningful unit
  of engine work (a record change, a ticket outcome, a verdict), with
  a conventional message, pushed as it goes — the maintainer's own
  working practice, formalized for the engine. (chat M861) (2026-10-26, user)
- Concurrency, plank four — machines: settled — one engine per
  machine, per checkout, for now: each machine's engine works its own
  checkout as its own serial lane, reconciled through the shared git
  history and the records (pull-first, absorb-or-alarm). A single
  global engine across machines is the future stance, needing
  arbitration not yet designed. (chat M917) (2026-10-27, user)
- Crash and push contract: settled — the records are the ledger:
  local commits are the safety; a restarted engine rebuilds where
  things stood from the committed records and their states alone;
  unpushed commits retry on the next pass with a pull first; nothing
  is ever force-pushed. There is no separate engine state store. (chat M914)
  (2026-10-27, user)
- Engine-vs-user file discipline: settled — the user's own words
  (chat M910, the answer round): an edit to a file the engine also
  works is either one the system's context can account for — "I want
  it to just silently absorb the difference" — or an accident; in the
  latter case "I want it to raise an alarm and tell me I messed up
  before something breaks". What tells the two apart is the open
  piece — the user's own "I am not sure how to walk this" — and this
  map's proposed walk (check each edit against the engine's known
  context and raise the remainder through the inbox before building
  on it) is unruled, to be put to the user. (2026-10-27, user for
  the two cases; the walk OPEN)
- Concurrency, plank three — branch placement: settled — the present
  stance: everything the engine does lands on the working branch
  (records, reports, tickets, code alike), pulling before pushing,
  never force-pushing, never merging on its own; scope-based branching
  is deferred to the future stance. (chat M906) (2026-10-27, user)
- Bootstrap in a live project: settled — a re-bootstrap is a step of
  its own: it waits for the step in flight, runs exclusively and
  synchronously with the user, and the engine resumes after. (chat M903)
  (2026-10-27, user)
- The name "inbox": settled — kept, with a glossary entry in
  girth-agents' own GLOSSARY.md defining it as the user's inbox as
  designed in this plugin, in contrast to OpenCode's own
  agent-prompt-queue inbox of the same name. (chat M1010) (2026-10-27, user)
- `domain-modeling`'s fate: settled — the skill survives, re-fit: the
  engine-side discipline lives in the caregiver; the interactive side
  keeps its function, guiding the user through term-work when judging
  proposals and ruling meanings. (chat M1007) (2026-10-27, user)
- Push-conflict terminal: settled — on non-fast-forward divergence the
  engine never merges: it holds its commits, leaves the working tree
  alone, and raises through the inbox (the reconciliation is the user's
  authority); everything waits intact until answered. (chat M1004) (2026-10-27,
  user)
- The shelved era's terms: OPEN — the user asked whether any of the
  four definitions are incomprehensible without the old handoff skill
  (chat M1037); the earlier "they stay" verdict was the agent's own
  inference, never ruled by the user. Unresolved, to be put to the
  user. Each definition stands alone — none requires the handoff
  paradigm to be comprehensible — and they describe the lifecycle of
  context itself, which the new system uses too (the chat's
  exhaustion, the ledger's rebuild, the inbox item's consumption).
  Whether the four survive the shelf is the open question; the
  answer is the user's. (open — awaits the user)
- Plan-gate completeness: settled — the plan's PASS means the
  interactive grilling exhausted every user-answerable question
  visible in the wayfinding context, and the session never
  intentionally defers a visible question to a headless stage. The
  delineation between the two kinds of question: what the session can
  see must be asked before PASS; what only the specifying context can
  surface arrives afterward through the inbox, honestly new and one at
  a time. The inbox carries newness, never deferral — grilling's
  battery belongs to the interactive session. (chat M1024) (2026-10-27, user)
- The plan's repair chair: settled — the interactive session itself:
  the agent repairs the FAILed plan with the user, continuing the very
  conversation the plan came from. This is why the plan's review runs
  before its confirmation: a FAIL still has a live session to land in,
  and only a reviewed-and-confirmed plan enters the engine. This very
  rectification is the worked example. (chat M1001) (2026-10-27, user)
- The helpers' permissions: settled — the user's words: "We should
  have permissions tailored to the individual helper as their
  configuration, toolset, and skills already are" (chat M993, the
  answer round); and helpers must never spin up without the
  permissions a job needs — a janitor at one store emailing the CFO
  for Windex is a symptom to pre-empt, not a routing question (chat
  M998, the user's own metaphor). The orchestration realization — the
  orchestrator matches each job's requirements against the helper's
  set before dispatch, a mismatch failing loudly as a system defect
  — is this map's mechanism serving those two rulings, not the
  user's words; it goes to the spec as a shaped claim. (2026-10-27,
  user for the two rulings)
- The off-switch: settled — bootstrap states plainly what always-awake
  processing means before it starts (the consent moment), and a park
  command stops the engine on that project, leaving the records in
  place and resumable by re-running bootstrap; the engine then stops
  reading that repository until restarted. (chat M990) (2026-10-27, user)
- The orchestrator: settled — the one interactive primary is the
  orchestrator agent from the feature tracker: the face that runs the
  user's sessions and coordinates the swarm of helpers behind it. (chat M969)
  (2026-10-27, user)
- Primary agents: settled — one interactive primary: the agent that
  runs the user's sessions (ideation, wayfinding, rulings); the six
  helpers are the machinery behind it, dispatched by the engine, never
  chosen as faces. The built-in `build` and `plan` primaries are
  replaced by it. (chat M966) (2026-10-27, user; named 2026-10-27, user)
- Helpers' realization: settled — the helpers are embedded in the
  engine. The user's answer to the keystone-failure question (chat
  M1165, the answer round): "The helper agents are embedded in the
  engine, not in opencode, they're not subagents deployed from an
  interactive session so why would opencode need them 'registered'?"
  The platform side holds the negative: a plugin cannot register
  brand-new agent IDs — `AgentEditor` has no `add` (chat M1126, live
  probe). How the engine holds, configures, and runs each helper is
  engine internals — a spec shape, never an OpenCode registry entry.
  (2026-10-27, user for the embedded ruling; chat M1126 the fact)
- The pour is complete: settled — every item the user's test-driving
  surfaced is on the map and followed to an answer; the only open
  threads are the deliberate deferrals (the scaffold-migration
  details, the future concurrency stance, and the spec details). (chat M963) (2026-10-27, user). The
  round-2 review reopened two threads bound for the user — the
  shelved-era terms and the file-discipline's walk (labeled OPEN
  above).
- GitHub credentials: settled — bootstrapping includes an optional gh
  setup: the user who takes it provides credentials through gh, which
  the engine never stores separately; a declination lets the engine
  proceed without the GitHub integration (commits stay local, pushes
  and self-reports unavailable), recorded as a ruling like any
  declination. (chat M960) (2026-10-27, user)
- Offline pushes: settled — a failed push holds its commits locally —
  the ledger loses nothing — and retries on the next pass; there is
  no extra queue beyond the local unpushed commits themselves, and the
  pull-first discipline applies on the network's return. (chat M957) (2026-10-27,
  user)
- The unassigned sums: settled — the typed forms' exact shapes, the
  reports' owning skill, the context-map's format, the inbox message
  forms, the cap and budget numbers, and criterion-compilation
  mechanics are spec details: every direction is decided, and the spec
  pins the shapes. (chat M954) (2026-10-27, user)
- Abandoned sessions: settled — an abandoned interactive session is
  inert: an opened inbox item stays waiting in the inbox (nothing
  expires, nothing re-asks), and a half-built wayfinding session holds
  no entry point until confirmed, so it touches nothing. Timeouts
  apply only to the engine's own steps, which are already capped. (chat M951)
  (2026-10-27, user)
- Self-report consent: settled — each self-report asks the user's
  permission at the moment of sending, and declining is always
  available; the payload stays the failing piece's brief and report —
  typed records only, no inbox prose, no secrets (chat M948).
  Flood-control coalescing of repeated failures is an uncited
  elaboration — open, to be ruled.
- Dogfooding: settled — the engine develops girth-agents fully, plugin
  code included — the point of dogfooding — made safe by the
  two-checkout separation: it runs from a separate installed copy while
  developing this repo's checkout, and its own commits reach the
  install only at the next deliberate plugin update. (chat M945) (2026-10-27,
  user)
- The direction-change path: settled — the user rules direction
  changes in a session, and the ordinary machinery carries them:
  amending the plan becomes a new plan revision through the same
  review; aborting closes the workstream's records with the reason;
  re-answering reopens the resolved question with the new answer.
  Direction changes are authority, recorded like conventions. (chat M941)
  (2026-10-27, user)
- The confirmation artifact: settled — the wayfinding session records
  the user's confirmation inside the plan file itself (a dated marker
  line) before the entry-point tool runs; the tool validates the
  marker as part of accepting the file — no marker, loud rejection. A
  dead tool run loses nothing: the marker survives and the tool
  re-runs. (chat M938) (2026-10-27, user)
- The forbidden list: settled — beyond the leash's one "never touch
  un-cleared files": never force-push, rebase, or reset history; never
  delete branches or merge on its own; never touch files outside the
  records and the files its tickets name; never copy secrets it was
  not handed for the task; never run network commands beyond its own
  pushes and self-reports. (chat M935) (2026-10-27, user)
- User sessions and the engine: settled — the user's sessions live
  outside the engine and never compete for its queue; their outputs
  cross the boundary at the already-designed doors (the entry-point
  clearance, inbox replies, absorb-or-alarm). (chat M932) (2026-10-27, user)
- Inbox writes in the serial order: settled — the user's
  answering-session record-writes join the serial order like any other
  step: they land at the next slot, imperceptibly after the engine's
  current step. Nothing writes at once. (chat M929) (2026-10-27, user)
- Sidebar truth: settled — the user's words: the sidebar shows what
  work is *currently* happening, as reported by the engine.
  (chat M926, the answer round) (2026-10-27, user)
- Startedness: settled — the bootstrap command activates the engine
  locally, per machine, per directory. A repo bootstrapped elsewhere
  is just a directory of files until `/bootstrap` runs there; the
  engine treats nothing as records before local activation. Two
  reasons: it must not clobber files inappropriately, and it must not
  pick up a project on an old schema without a bootstrap update first.
  State travels through the records; activation is local. (chat M920)
  (2026-10-27, user)
- Scaffold migration: declared to revisit — when the plugin's
  schematics change, bootstrap must bring a repository into the current
  paradigm from its previous state, whether that state is a previous
  plugin version or none at all. The mechanism is now found: local
  bootstrap is the activation AND the migration gate — running it
  brings the repo into the current paradigm; the migration rules'
  details remain the circle-back. (chat M903) (2026-10-27, user)
- Concurrency, plank two: settled — a chain's step is exclusive:
  every writing helper (checker, fact-finder, prove-it, caregiver,
  the consolidation pass) waits for the step in flight; only the
  engine's passive watching runs always. (chat M900) (2026-10-27, user)
- Concurrency, plank one: settled — within a project, the engine does
  one thing at a time: one chain's current step in flight, everything
  else ready-but-waiting; parallelism exists only across separate
  projects. Several chains in one project at once is the future
  stance, named but not designed. (chat M897) (2026-10-27, user)
- Non-code repositories: settled — the same system applies to every
  repository kind, but the substance's own kind sets the bar: every
  file representing a project's substance — code, writing, or a
  combination — is accounted for and judged by criteria appropriate to
  its kind. The work stage of a docs or research repository produces
  documents, graded on writing's merits; mixed repositories grade each
  part on its own. Fish are not judged on tree-climbing. (chat M858)
  (2026-10-26, user)
- Project kinds' shape: settled — one root store per repository (the
  tracker, glossary, inbox, reports); a root context-map record
  declaring the repository's contexts and their inter-context
  relationships; an optional `context:` field for domain-qualified
  senses; agents read the store filtered to their context, never the
  union blob; per-package physical placement only on warrant, recorded
  as a deviation like any other. (chat M855) (2026-10-26, user)
- Lesson capture: settled — the reviewer jots candidate claims while
  writing its report (the separate pair of eyes mid-evidence); the
  engine's idle consolidation pass collects them, checks them against
  what is already known, and hands them to prove-it. (chat M834) (2026-10-26, user)
- The lesson store: settled — a committed tracker kind of its own:
  generalized, verified, recurring lessons, with their evidence
  referenced and held out of context; recall is how the agents read the
  store into their working context. The tracker's kind set gains it at
  implementation, alongside term proposals. (chat M831) (2026-10-26, user)
- Unverifiable claims: settled — a lesson-claim prove-it can neither
  verify nor falsify vanishes from the recall path; if the uncertainty
  behind it blocks work, the ordinary question machinery handles it
  (information-kind to the fact-finder, authority-kind to the inbox).
  The recall layer never harasses. (chat M828) (2026-10-26, user)
- Stratification: settled — a verified lesson-claim stratifies into the
  recall store only after it recurs across separate pieces of work; a
  single occurrence stays a specific hazard, found again on collision.
  Learn-once rides the second-time signal. (chat M825) (2026-10-26, user)
- prove-it and fact-finder, mutual checks: settled — they keep each
  other in line: the fact-finder acquires facts that keep prove-it's
  reasoning grounded in evidence, and can correct it; prove-it verifies
  that reported facts cohere with the accepted knowledge — offering
  proof where a reported "fact" is incorrect — and pushes back to keep
  the fact-finder's reporting diligent and accurate. Both fail openly. (chat M822)
  (2026-10-26, user)
- `prove-it`: settled — a new named helper whose job is verifying the
  truth of claims that are not observable fact, held against what the
  system confirms it knows to be true; it works alone or in concert
  with the fact-finder. The two hold different relationships to the
  knowledge base: the fact-finder acquires base facts from authentic
  sources (assumed true — beyond proof and denial in context, like "the
  sky is blue"), and prove-it checks other claims against that
  confirmed knowledge. The sixth helper; both fail openly rather than
  assert. (chat M818) (2026-10-26, user)
- Lesson-claim verification: settled — prove-it verifies a
  lesson-claim before it stratifies into the recall store, marshalling
  the fact-finder where the check needs new base facts; a claim that
  cannot be verified does not stratify. (chat M818) (2026-10-26, user)
- Recall layer: settled — in scope: the engine's agents remember
  lessons across work, separate from the canonical glossary, governed
  by one principle — lessons should only need to be learned once. Its
  shape is settled in the sibling entries: reviewer jots, prove-it
  verifies, recurrence stratifies, first occurrences are hazards, and
  the store is a committed tracker kind. (chat M796) (2026-10-26, user)
- Glossary's own hygiene: settled — the glossary stays prose (a term
  and its definition); the mechanical gate checks only form (duplicate
  spellings, malformed entries, empty definitions). Meaning — one
  concept per entry, drift — is never a linter's job, always the
  caregiver's and the user's, through the proposal pipeline. (chat M793)
  (2026-10-26, user)
- Glossary in reviews: settled — the project side of glossary
  enforcement: glossary-consistency joins the criteria the engine
  compiles from the records, and a stage's work that uses a term in a
  drifted sense fails its check — the glossary is a record the criteria
  can point at. (chat M788) (2026-10-26, user)
- Glossary proposals' home: settled — term proposals are a tracker kind
  of their own, like questions and hazards: classified, recorded, and
  processed by the caregiver, with the inbox question referencing the
  proposal entry. The tracking skill's kind set and the bootstrapping
  inventory gain the new kind at implementation. (chat M784) (2026-10-26, user)
- Glossary proposals: settled — filtered, never batched: filtered means
  "this isn't worth attending to," and the caregiver never acts on its
  own — filtered items never change the glossary. Each warranted
  proposal opens its own inbox question, carrying the term's context
  and the caregiver's suggested new or updated definition whenever it
  can form one. The user then spends seconds confirming the suggestion,
  or crafts and corrects in the same breath — one interface, two depths
  of investment: precise crafting or leaning on suggestions. Domain
  modeling is a largely front-loaded task, and a reliable domain model
  is worth the user's attention at a project's outset. (chat M778) (2026-10-26,
  user)
- The vocabulary caregiver: settled — a new, small dedicated helper
  whose only context is the glossary. Its job is the labor — curating
  proposals, checking definitions machine-style, spotting conflicts,
  drafting entries from each proposal's context, and running
  drift-repair. Admission and change are the user's authority:
  glossary entries shape a project like conventions shape a project,
  and an agent-inferred definition is only as good as the context it
  infers from — so changes to a glossary are taken as seriously as
  changes to a convention, with the human in the loop. The fifth
  helper; precisely tailored context per the role-shaped ruling. (chat M771)
  (2026-10-26, user)
- Primary agents: declared open, then settled — the built-in `build`
  and `plan` primaries do not make sense in the new system's context;
  the replacement landed once the surroundings settled: one
  interactive primary, named the orchestrator. (chat M758, M966) (2026-10-26, user;
  settled 2026-10-27 — see "The orchestrator")
- GitHub integration: declared — the system integrates with GitHub for
  the end user, beyond a script that checks gh is installed. The engine
  handles commits and pushes for its autonomous work: many granular
  commits — hard for a human to parse, but assurance that no engine
  work is lost to bad circumstances — and anything the engine does can
  be rolled back in the worst case. (chat M747) (2026-10-26, user)
- Project kinds: declared — the system's design has been shaped for
  single-project, code-based repositories; monorepos and projects
  outside purely code work were deferred at the original domain-modeling
  adaptation. How the system accounts for different kinds of projects
  and repositories — touching bootstrapping, the engine's scope,
  scaffold placement, and every per-project record — is very foggy and
  must be investigated thoroughly. (chat M737) (2026-10-26, user)
- Knowledge management: declared — a new major area on the map. The
  test driving showed domain-modeling and the glossary to be thoroughly
  undercooked: their function — keeping the user and the agents in sync
  on what terms and phrases mean, continuously and incrementally, one
  piece at a time as each matters — is essential, but the discipline
  was given to interactive agents whose attention was stretched too
  thin to follow it interwoven with everything else they do. And the
  tracker models `ask question → new conventions` and `encounter
  problem → new hazards` as first-class pipelines, while `learned term
  → new glossary entry` was treated as its own separate thing with no
  point in the workflow designated for it. The area needs a deep dive
  into domain-modeling, theoretical and practical. (chat M694) (2026-10-26, user)
- The function is the necessity: settled — skills exist to facilitate a
  function, and the function is the unit of judgment. When the user
  affirms a skill "unchanged," it means they see no way the skill needs
  to change to serve its function at the time they were asked; the exact
  content of every surviving skill will almost certainly be re-fit to
  its role in the new system, and whether a function lives as one skill
  or several is decided by what serves the functional effect. (chat M691)
  (2026-10-26, user)
- Codifying's shape: settled — the convention-crash path folds into
  `codifying`: one skill, two arrival paths — discretionary rulings in
  interactive sessions, and resolving inbox questions spawned by
  convention crashes, folding the answers into conventions as the
  resolutions. (chat M691) (2026-10-26, user)
- Convention crashes: declared — conventions must be shapeable over
  time, since the need for change is often not visible before it is
  forced. The in-flight agent that collides with them is the first-hand
  witness that the conventions as written are blocking the engine's
  operation in that context; the collision spawns an authority-kind
  question that reaches the user through the inbox, and the user's
  answer may be folded into the conventions as the resolution going
  forward. In contrast, `codifying`'s discretionary path records what
  the user rules at their own initiative in an interactive session. (chat M688)
  (2026-10-26, user)
- `/cut-release`: settled — re-scoped by the machinery ruling: it cuts
  the tag and publishes the GitHub Release page with the changelog
  notes, minus the old one-line install. (chat M588) (2026-10-26, by the machinery
  ruling)
- `/questionnaire`: settled — the door stays; turning a decision blocked
  on an outside person into a written questionnaire is untouched by the
  new system. (chat M726) (2026-10-26, user)
- `ideation` + `/ideate`: declared — a new command-invoked skill for the
  optional preliminary phase before wayfinding: interactively building
  the idea cloud — as the harvest did — before transitioning to
  questioning. Wayfinding can begin directly when the user can state
  the destination specifically at the outset; ideation optionally
  precedes it when the user's ideas need gathering first, providing
  the context wayfinding then charts. (chat M723) (2026-10-26, user)
- `/wayfind`: settled — the door stays; it is the pro-active flow's
  entry: the interactive session that charts the plan, confirmed by the
  user at its end, then cleared through the entry-point tool. (chat M720)
  (2026-10-26, user)
- `wizard` and `/wizard`: shelved — join handoff, pickup, and `/retro`
  on the shelf: useful in concept, but after test driving the wizard
  needs a lot of work before it carries its own weight; re-judged
  later. (chat M714) (2026-10-26, user)
- `maintaining-docs`: settled — zero drift tolerance: if something
  documented changes, the documentation changes — never chance-based,
  never deferred to a session or a release. The docs' contracts (which
  document describes which record) are `maintaining-docs`' to own. (chat M711)
  (2026-10-26, user)
- The five crafts: settled — `diagnosing-bugs`, `code-review`,
  `codebase-design`, `prototyping`, and `research` all fall under the
  role-shaped-context rule: their functions survive, their exact
  carriers are assigned when the helper contexts are designed. (chat M707)
  (2026-10-26, user)
- Context is role-shaped: settled — a skill loaded into an agent implies
  that agent holds its responsibility. The new system must give each
  engine agent measured, precisely tailored context, never excessive
  and diverse context. The work-loop crafts' exact places are therefore
  in flux: `diagnosing-bugs`, `code-review`, `codebase-design`,
  `prototyping`, and `research` are assigned to the roles that hold the
  responsibility (candidates: the builder and the reviewer), not
  ambiently available to all. (chat M704) (2026-10-26, user)
- `questionnaire`: settled — its function (decisions blocked on outside
  people → a written questionnaire aimed at what is needed back)
  survives as-is for now; wording re-fits with the sweep. (chat M701)
  (2026-10-26, user)
- `grilling`: settled — kept as-is, the standing machinery of
  interactive sessions; only its wording is re-fit during the sweep. (chat M682)
  (2026-10-26, user)
- `/implement`'s fate: settled — in [the system], the engine works the
  ticket frontier itself, so the `/implement` door dies for its users;
  the `implementing` skill stays as the builder's craft for the work
  stage. (chat M679) (2026-10-26, user)
- `/spec`'s fate: settled — in [the system], the plan is the only
  user-shaped document; specs are made inside the engine, so the
  interactive spec session's door dies for the system's users. The
  `specifying` skill stays — it is the builder's craft. [Ours]: our own
  `/spec` for the umbrella spec is untouched. (chat M676) (2026-10-26, user)
- The work check: settled — the work stage is reviewed ticket by
  ticket: each ticket's recorded outcome graded against its own
  criteria, with the code changes and the test-drive proof as evidence;
  the PASS stamps the ticket itself. (chat M669) (2026-10-26, user)
- Two layers: settled — the destination's approvals (the umbrella spec
  approved once, by the user) are THIS effort's working process, not
  the plugin's rules; the checkpoints ruling (the plan is the chain's
  one human stop) governs the plugin the map is designing. No conflict:
  the mapmaker works one way, the machine it maps works another. (chat M663; raised at M646)
  (2026-10-26, user)
- The exception's transport: settled — the loud failure also
  self-reports to the plugin's own repo (a defect entry filed from the
  failing install), carrying typed records only; the project-side
  system-defect record and attention signal stand too. (chat M637) (2026-10-26,
  user)
- Failure routing: settled — whether a failure reaches the user is
  decided by whether its rectification requires their answer. A failure
  caused by missing information is what questions are for; the
  fact-finder works those, and a question reaches the user when it
  needs their authority, or when the finding-out failed and the failure
  is not itself the answer. A failure the user cannot help rectify
  never inboxes them; a failure only the user can rectify must. This
  applies at every stage, the plan included. (chat M627) (2026-10-26, user)
- The chat's boundary: settled — the plan's own review is done with the
  chat that created it as a source; everything valuable in the chat
  must be accounted for in the plan before the plan is finalized; once
  finalized, the chat can provide no value, so raw chat never carries
  over that boundary. (chat M624) (2026-10-26, user)
- Hand-offs: settled — only typed essentials travel between
  stage-sessions: the brief compiled from the records, the checklist,
  and the verdict with its report. Raw chat never carries over past the
  plan's finalization — its whole value must be folded into the
  finalized plan first; the plan's own review is the one place the chat
  is a source. (chat M466) (2026-10-25, user; refined 2026-10-26)
- Discipline: settled — the cycle's rules are enforced by the tool in
  code: a cap on fix-rounds and a time limit per step; the agent obeys
  and cannot bend them. The exact numbers are spec detail. (chat M457) (2026-10-25,
  user)
- Reports' home: settled — the graded reports live in their own pile (a
  new scaffold piece in each project), and the verdict is also stamped
  on the checked work, so the engine and the sidebar read one place. (chat M454)
  (2026-10-25, user)
- Criteria: settled — the engine compiles the reviewer's checklist
  straight from the earlier approved document (plan for the spec, spec
  for the tickets, tickets for the work); the checker only grades
  against it. The plan stage is the exception: its checklist comes from
  the session's content — the wayfinding chat — and the project's
  context. (chat M451, M624) (2026-10-25, user; refined 2026-10-26)
- The loop's driver: settled — the cycle itself (send in the reviewer,
  read the verdict, return the work for fixes on FAIL, repeat until
  PASS) is a hard tool in the plugin's code. (chat M448) (2026-10-25, user)
- The checker: settled — a named reviewer agent type with its own job
  description; the engine points it at finished work to read and write
  the PASS/FAIL report. The first agent type of the new system. (chat M445)
  (2026-10-25, user)
- Handoff's shelf: settled — the handoff and pickup pair stays out of
  the plugin for now, kept privately in the repo; the engine, tracker,
  and entry points carry the cross-session continuity the handoff did,
  `decisions/0005` stands until the replacement proves out and
  supersedes it, and retirement is judged later. (chat M437) (2026-10-25, user)
- `test-driving`: re-scoped — the renamed skill becomes the broad
  practice of testing changes in real cases before trusting them; the
  plugin's own testing system is part of what it teaches and drives.
  It is not just tests-first-then-code under a new name. (chat M434) (2026-10-25,
  user)
- Slicing's door: `/slice` survives as the thin shortcut that starts the
  skill — its body shrinks to the starting instruction. (chat M431) (2026-10-25,
  user)
- The old install path retires: settled — users reach the plugin only by
  pointing OpenCode at the repo; the download-and-run-a-script method
  retires. The builder-side tools stay: the catalog checker and the test
  harnesses. (chat M428) (2026-10-25, user)
- The channel: settled — no package store. People point OpenCode
  straight at the GitHub project to load the plugin; OpenCode's own
  plugin-update keeps installs current from the repo. The repo is both
  the workshop and the thing people install. (chat M421) (2026-10-25, user)
- A testing system for this project: declared — changes and updates are
  thoroughly test-driven in real cases before commit to main, so nothing
  questionable pollutes the release chain; every part of the engine is
  constructed with testability in mind; and the tests passing must be
  assertable as trustworthy — test results that map to real confidence,
  not green theater. (chat M413) (2026-10-25, narrated)
- The inbox is its own TUI screen: declared — no longer a pseudo-mode
  activated and deactivated by a command; reached by a command and the
  command palette (Ctrl+P), visually an email inbox, items sorted in
  received order,
  scrollable and selectable. Opening an item enters a new chat session
  with an agent seeded with the message asking the user the question —
  prepared to discuss, then to record the user's response for the engine
  to pick up and drive forward. (chat M406) (2026-10-25, narrated)
- The engine spawns sessions: declared — the engine can spawn fresh
  OpenCode sessions and pass information between them; this is the
  substrate the build-verify-rectify loop runs on — each stage a fresh
  session, the reviewer separate, hand-offs through the records. Heavy
  inspiration from the zeroshot project (the-open-engine); how to take
  that inspiration in practice is a research task inside this wayfinding. (chat M390)
  (2026-10-25, narrated; research pending)
- Tracked questions: two kinds — questions tracked for lack of
  authority (answerable only by the user) and lack of information
  (answerable by the user or by an agent that acquires the information);
  each tracked question entry declares which kind it is. (chat M385) (2026-10-25,
  narrated)
- The sidebar also breaks down currently ongoing work — analogous in form
  to OpenCode's experimental todo lists (their list is an agent's
  private per-session tasks via `todowrite`; ours is the system's
  engine-driven work in flight). (chat M377) (2026-10-25, narrated)
- The TUI sidebar — the right-hand panel of the TUI, addressed by the
  CLI plugin's `sidebar.content` slot — displays `Inbox: {n}`: the
  number of items waiting in the user's inbox for the current project. (chat M371)
  (2026-10-25, narrated)
- Inbox items: declared — created as formal inbox items the engine
  recognizes as such; informal, non-deterministic inbox items gleaned at
  command time are gone. `/inbox` initiates the re-active workflow with
  the user. (chat M371) (2026-10-25, narrated)
- `find-skills` and `/wait-what`: dead — removed from the catalog; their
  surfaces (the README's off-the-spine find-skills line, `/wait-what`'s
  rows) go with them. (chat M361) (2026-10-25, narrated)
- Renames: `writing-for-agents` becomes `technical-writing`; `tdd`
  becomes `test-driving`. Knock-ons: CONTRIBUTING's craft pointer, the
  README's chain diagram and rails, `implementing`'s execution cycle.
  (chat M361) (2026-10-25, narrated)
- Bootstrapping: declared — done eagerly and programmatically to the
  extent possible: the scaffold is created on the system's initiative,
  not on invitation, with everything derivable from the project derived
  rather than asked. (chat M356) (2026-10-25, narrated; reconciled 2026-10-26 —
  see "Bootstrap is synchronous")
- The two flows: declared — the user interfaces with the system through
  two formally accounted workflows. The pro-active flow: the user
  provokes the system into re-action — any session that produces a valid
  entry-point document. The re-active flow: the system provokes the user
  into re-action — when the system needs information or action from the
  user, the request reaches the user through their inbox. (chat M351) (2026-10-25,
  narrated)
- The engine: declared — a driver for the system's automated aspects,
  whose working loop continuously seeks inputs prepared to become outputs
  (a new plan is the input to a review-and-refinement loop whose output
  is a reviewed plan). No human motion survives except where the
  interaction is genuinely due. (chat M346) (2026-10-25, narrated)
- The entry-point tool: declared — as generic a parser as possible:
  pointed at a file, it determines whether the file is a valid entry
  point into the system and incorporates its contents into the chain its
  kind calls for; anything not a valid entry point, or malformed in a way
  a parser can catch, is rejected loudly. It is the concrete boundary
  between known system outputs (touched freely) and user-interaction
  products (touched only after the user explicitly clears them). (chat M346)
  (2026-10-25, narrated)
- Wayfinding's ending: declared — no more "offer options on what to do
  next"; on user-confirmed conclusion the agent runs the entry-point tool
  on the map file. (chat M346) (2026-10-25, narrated)
- Review gate: every stage's output passes a PASS/FAIL review against
  criteria derived from the upstream reviewed document before the next
  stage consumes it; wayfinding is the ungated entry; a FAIL returns the
  work with the report for rectification and resubmission, until PASS. (chat M341)
  (2026-10-25, narrated)
- Slicing: becomes its own skill; the procedure moves out of the `/slice`
  command body into the skill. (chat M334) (2026-10-25, narrated)
- Destination shape: [Ours] one umbrella spec covering all five areas, approved
  once; the `decisions/` record is written first and the spec references
  it. (chat M315, M323) (2026-10-25, round 1 — see "Destination shape" in QUESTIONS.md)
- Markdown's place: bundle + register at plugin setup. (2026-10-25,
  round 1 — see "Markdown's place in the plugin" in QUESTIONS.md) (chat M323)

## Not yet specified

- The plan's own review — open. The earlier rounds ran against the
  tracker, not the raw chat log (chat M1197, M1198), and were ruled
  compromised — passing grades for a failing plan (chat M1200). The
  re-review against the raw log (round 2,
  `docs/research/plan-review-2A/B/C.md`) FAILed on this plan's false
  self-claims, citation corruptions, and uncited glosses; those are
  being rectified and a round 3 follows. The gate closes only on
  unanimous PASS under the citation rules (chat M1200).
- Concurrency — settled: serial within a project, steps exclusive,
  writers wait, watching never sleeps, pull-first working-branch
  commits, absorb-or-alarm on user edits, records as the crash ledger,
  one engine per machine, local bootstrap activation (see Decisions
  so far; future stance named, not designed). (chat M897, M900, M906, M914, M917, M920)
- Primary agents — settled: one interactive primary, named the
  orchestrator (see Decisions so far). (chat M966, M969)
- GitHub integration — settled: per-unit commits pushed as they go,
  optional gh setup, held-locally retries (see Decisions so far). (chat M861, M957, M960)
- Project kinds — settled: one root store, a root context-map record,
  an optional `context:` field, scoped reads, per-package placement
  only on warrant; non-code repositories run the same system with
  criteria fitting the substance's kind (see Decisions so far). (chat M855, M858)
- Knowledge management — settled: the caregiver owns the discipline
  and labors while the user rules admissions; proposals are a tracker
  kind; the review gate grades term use; the glossary stays prose with
  form-only mechanical checks (see Decisions so far). (chat M771, M778, M784, M788, M793)
- The change cloud — closed at chat M963 (the pour); reopened since:
  the shelved-era terms (chat M1037) and the file-discipline's walk
  (chat M910), both labeled OPEN above and bound for the user.
- Test scenarios harvested from this effort's own incidents: (1) a
  representation with a cross-layer conflict FAILs review — the flag is
  correct behavior, not a bug; (2) the interpreter classifies the
  finding: representation repair for cross-layer artifacts, the design
  question for same-layer conflicts, the scoping clarification for
  unclear scope — never the reconciliation question that presumes one
  layer (incident of 2026-10-26). (chat M655, M663)
- Platform facts, verified in live probes (2026-10-27; the discarded
  pass paid for these): a plugin cannot register brand-new agent IDs —
  `AgentEditor` has no `add`; `ctx.storage` survives service restarts;
  tools registered with `codemode: true` surface in the code-mode tool
  namespace and execute; a local-directory plugin loads only from an
  `index.ts` or `server.ts` at the package root, the package exports
  serving package channels. Still unverified, live-TUI-only: the git
  `./tui` auto-load, sidebar-slot live-reactivity, the full event
  catalog, and the `session.idle` payload. (chat M1126)
- Spec details deferred by design: the typed forms (brief, checklist,
  verdict/report) and where each lives; the inbox message and reply
  forms; the cap's numbers; the test harness's shape, seams, and gate
  mechanics; the report pile's owning skill and format (scaffold-family
  maintenance); the inbox message record's home and form; the
  system-defect record kind's format (the exception's project-side
  loud failure); the dispatch-time permission check's mechanics
  (requirements matched against the helper's set before dispatch — a
  mismatch is the loud failure, never a user-facing request). (chat M954)
- Deferred by design, not open now: handoff, `/retro`, and the wizard
  pair's shelf retirement; the scaffold-migration rules' details; the
  future concurrency stance; multi-machine arbitration. (chat M366, M870, M903, M917)

## Out of scope

- Zeroshot's four clashing assumptions — the research's findings, not
  the user's words: the workspace-restore/copy-checkout, keeping
  pipeline config outside the repo, verifying the live worktree rather
  than the records, and the single-writer world with no human TUI
  beside it. The borrowing decisions themselves the user held with
  "Decide later" (chat M401); inspiration named at chat M390.
