# The skillset becomes an OpenCode plugin

**Status:** charting

## Destination

A formally recorded decision (`decisions/`) turning this catalog into an
OpenCode plugin, then one umbrella spec — the skills, commands, agent
types, tools, and code of that plugin — written as one coherent set and
approved once. Building and slicing are the next effort and begin only
after approval.

## Notes

- The catalog's identity carries into the plugin: skills, commands, and
  agents stay plain Markdown, ship bundled with the plugin, and the
  plugin's `setup()` registers them through the skill/command/agent
  transforms. Nothing converts to code unless a trigger needs it.
- The user's test-driving surfaced the change set: many item-level
  changes aimed at cross-cutting concerns — too disorganized to enumerate
  linearly. The map is the organizer: the cloud is harvested, then worked
  decision by decision.
- `plans/installer-experience.md` ruled package-manager channels out of
  scope for the installer. The plugin supersedes that ruling where it
  lands; the channel decision settles how far.
- Facts the map leans on: plugins register agents, commands, skills, and
  tools via transforms; package plugins publish to npm and
  install/update/check through `opencode plugin`; the repo remains the
  dev workspace regardless of channel.
- TUI facts: the right-hand panel is the sidebar, reached by CLI-plugin
  slots (`sidebar.content`); a package ships a `./tui` export beside its
  server export — one package, two entries; CLI-only plugins configure
  separately in `cli.json`; plugin routes register whole screens through
  the TUI router, and the Escape-accessible menu (command palette)
  carries entries.

## Decisions so far

- Criteria: settled — the engine compiles the reviewer's checklist
  straight from the earlier approved document (plan for the spec, spec
  for the tickets, tickets for the work); the checker only grades
  against it. (2026-10-25, user)
- The loop's driver: settled — the cycle itself (send in the reviewer,
  read the verdict, return the work for fixes on FAIL, repeat until
  PASS) is a hard tool in the plugin's code. (2026-10-25, user)
- The checker: settled — a named reviewer agent type with its own job
  description; the engine points it at finished work to read and write
  the PASS/FAIL report. The first agent type of the new system.
  (2026-10-25, user)
- Handoff's shelf: settled — the handoff and pickup pair stays out of
  the plugin for now, kept privately in the repo; retirement lands
  later, once the engine has proved out the replacement. (2026-10-25,
  user)
- `test-driving`: re-scoped — the renamed skill becomes the broad
  practice of testing changes in real cases before trusting them; the
  plugin's own testing system is part of what it teaches and drives.
  It is not just tests-first-then-code under a new name. (2026-10-25,
  user)
- Slicing's door: `/slice` survives as the thin shortcut that starts the
  skill — its body shrinks to the starting instruction. (2026-10-25,
  user)
- The old install path retires: settled — users reach the plugin only by
  pointing OpenCode at the repo; the download-and-run-a-script method
  retires. The builder-side tools stay: the catalog checker and the test
  harnesses. (2026-10-25, user)
- The channel: settled — no package store. People point OpenCode
  straight at the GitHub project to load the plugin; OpenCode's own
  plugin-update keeps installs current from the repo. The repo is both
  the workshop and the thing people install. (2026-10-25, user)
- A testing system for this project: declared — changes and updates are
  thoroughly test-driven in real cases before commit to main, so nothing
  questionable pollutes the release chain; every part of the engine is
  constructed with testability in mind; and the tests passing must be
  assertable as trustworthy — test results that map to real confidence,
  not green theater. (2026-10-25, narrated)
- The inbox is its own TUI screen: declared — no longer a pseudo-mode
  activated and deactivated by a command; reached by a command or the
  Escape menu, visually an email inbox, items sorted in received order,
  scrollable and selectable. Opening an item enters a new chat session
  with an agent seeded with the message asking the user the question —
  prepared to discuss, then to record the user's response for the engine
  to pick up and drive forward. (2026-10-25, narrated)
- The engine spawns sessions: declared — the engine can spawn fresh
  OpenCode sessions and pass information between them; this is the
  substrate the build-verify-rectify loop runs on — each stage a fresh
  session, the reviewer separate, hand-offs through the records. Heavy
  inspiration from the zeroshot project (the-open-engine); how to take
  that inspiration in practice is a research task inside this wayfinding.
  (2026-10-25, narrated; research pending)
- Tracked questions: two kinds — questions tracked for lack of
  authority (answerable only by the user) and lack of information
  (answerable by the user or by an agent that acquires the information);
  each tracked question entry declares which kind it is. (2026-10-25,
  narrated)
- The sidebar also breaks down currently ongoing work — analogous in form
  to OpenCode's experimental todo lists (their list is an agent's
  private per-session tasks via `todowrite`; ours is the system's
  engine-driven work in flight). (2026-10-25, narrated)
- The TUI sidebar — the right-hand panel of the TUI, addressed by the
  CLI plugin's `sidebar.content` slot — displays `Inbox: {n}`: the
  number of items waiting in the user's inbox for the current project.
  (2026-10-25, narrated)
- Inbox items: declared — created as formal inbox items the engine
  recognizes as such; informal, non-deterministic inbox items gleaned at
  command time are gone. `/inbox` initiates the re-active workflow with
  the user. (2026-10-25, narrated)
- Handoff and pickup: shelved for the time being — neither cut nor
  carried into the new system's active surface. The new vision
  ultimately makes them obsolete: the engine, tracker, and entry points
  carry the cross-session continuity the handoff did; decision 0005
  stands until the replacement proves out and supersedes it.
  (2026-10-25, narrated)
- `find-skills` and `/wait-what`: dead — removed from the catalog; their
  surfaces (the README's off-the-spine find-skills line, `/wait-what`'s
  rows) go with them. (2026-10-25, narrated)
- Renames: `writing-for-agents` becomes `technical-writing`; `tdd`
  becomes `test-driving`. Knock-ons: CONTRIBUTING's craft pointer, the
  README's chain diagram and rails, `implementing`'s execution cycle.
  (2026-10-25, narrated)
- Bootstrapping: declared — done eagerly and programmatically to the
  extent possible: the scaffold is created on the system's initiative,
  not on invitation, with everything derivable from the project derived
  rather than asked. (2026-10-25, narrated)
- The two flows: declared — the user interfaces with the system through
  two formally accounted workflows. The pro-active flow: the user
  provokes the system into re-action — any session that produces a valid
  entry-point document. The re-active flow: the system provokes the user
  into re-action — when the system needs information or action from the
  user, the request reaches the user through their inbox. (2026-10-25,
  narrated)
- The engine: declared — a driver for the system's automated aspects,
  whose working loop continuously seeks inputs prepared to become outputs
  (a new plan is the input to a review-and-refinement loop whose output
  is a reviewed plan). No human motion survives except where the
  interaction is genuinely due. (2026-10-25, narrated)
- The entry-point tool: declared — as generic a parser as possible:
  pointed at a file, it determines whether the file is a valid entry
  point into the system and incorporates its contents into the chain its
  kind calls for; anything not a valid entry point, or malformed in a way
  a parser can catch, is rejected loudly. It is the concrete boundary
  between known system outputs (touched freely) and user-interaction
  products (touched only after the user explicitly clears them).
  (2026-10-25, narrated)
- Wayfinding's ending: declared — no more "offer options on what to do
  next"; on user-confirmed conclusion the agent runs the entry-point tool
  on the map file. (2026-10-25, narrated)
- Review gate: every stage's output passes a PASS/FAIL review against
  criteria derived from the upstream reviewed document before the next
  stage consumes it; wayfinding is the ungated entry; a FAIL returns the
  work with the report for rectification and resubmission, until PASS.
  (2026-10-25, narrated)
- Slicing: becomes its own skill; the procedure moves out of the `/slice`
  command body into the skill. (2026-10-25, narrated)
- Destination shape: one umbrella spec covering all five areas, approved
  once; the `decisions/` record is written first and the spec references
  it. (2026-10-25, round 1 — see "Destination shape" in QUESTIONS.md)
- Markdown's place: bundle + register at plugin setup. (2026-10-25,
  round 1 — see "Markdown's place in the plugin" in QUESTIONS.md)

## Not yet specified

- The testing system — the harness's shape: where real-case tests run
  (the existing validate.mjs / test-installer.sh / test-wizard.sh
  harnesses are the seeds; the engine's parts — parser, review loop,
  session spawning, inbox record, TUI slot — each need a testable seam),
  and where the gate sits in the release chain before main. Tracked as
  "The testing system — harness and gate".
- The inbox screen — knock-ons: `curate-inbox`'s and `/close-inbox`'s
  fates are held until the new system's shape is visible (`/close-inbox`'s
  wrap-up role is likely dead, but not ruled); which agent runs the
  per-item seeded session; and the form the recorded answer takes so the
  engine picks it up. Tracked as "The inbox answering session — agent
  and recorded answer" and "The old inbox helpers — deferred until the
  shape is visible".
- Zeroshot borrowing — research done (`docs/research/zeroshot-open-engine.md`);
  the fog cleared into three borrowing decisions, each put to the user
  and held ("decide later"): typed-state-only hand-offs, machinery-enforced
  guarantees, and the session-scope model. Borrowing exclusions: the
  workspace-restore/copy-checkout, config-outside-repo,
  live-worktree-verification, and single-writer assumptions. Tracked as
  "Session hand-off payload — typed state only?",
  "Loop discipline — machinery or model?", and
  "Session scope — fresh plus explicit continue?".
- Tracked-question kinds — knock-ons: the `tracking` skill's questions
  reference and entry format gain the kind field (authority |
  information), and existing entries — this map's among them — retrofit
  at implementation. Open lead: whether the engine itself dispatches an
  information-kind question to a research agent when it can, so only
  authority-kind questions surface to the user via the inbox. Tracked as
  "Information-kind questions — who acquires the answer".
- Sidebar ongoing-work breakdown — what counts as ongoing: the open
  ticket frontier, review loops in flight, PASS-pending hand-offs, inbox
  items awaiting the user? And what the display reads — a derived view
  over the system's records, or a new state record that itself needs a
  home. Tracked as "Sidebar ongoing-work breakdown — what counts and
  what it reads".
- Handoff's retirement — when the engine's replacement proves out, the
  retirement lands on `decisions/0005` and `specs/handoff-pickup.md`;
  date and form decided then. (The shelf itself is settled.)
- The renames' knock-ons — mechanical only now: the skill's body is
  written for the broad practice; the names, README rows, and references
  sweep in implementation. (`writing-for-agents` → `technical-writing`
  is a plain rename.)
- Eager bootstrapping — what remains human-asked, and where those asks
  travel: the interview's fate (derivation fills everything the project
  can state; the rest travels to the inbox per the re-active flow rather
  than blocking in session), the gh CLI check and deviations under an
  eager programmatic run, and whether `/bootstrap` survives as the
  human-triggered re-run door. Tracked as "Eager bootstrapping — what
  stays human-asked and where it travels".
- The two flows — open mechanics: what a session must produce to count as
  a pro-active flow (one entry point? at least one? how several queue);
  how a system-to-user request lands in the inbox — settled in
  direction: engine-written formal inbox items, deterministically
  countable — leaving the item's home and form, and curate-inbox's
  former gleaning role; how the flows interleave (an inbox answer may
  itself produce the next entry-point document). Tracked as "Re-active
  flow — how system requests land in the inbox", "The inbox item's home
  and form", and "Pro-active flow — what counts as an
  entry-point-producing session".
- The engine and the entry-point tool — mechanics still fog: whether the
  engine is plugin runtime (server-side, event-driven, across sessions)
  or an agent-driven loop; which files count as valid entry points
  (plans, specs, tickets, work — every stage output?); what markers
  distinguish known outputs from cleared and undetermined user products;
  the interplay with "Review loop — the mechanism" (the engine likely
  hosts the loop) and "Review loop — where graded reports live" (the
  reports' home likely feeds the parser's input classes). Tracked as
  "The engine and the entry-point tool — mechanics" and "Entry points —
  how outputs and cleared products are marked".
- The review gate — the PASS/FAIL review-and-rectify loop, now applied at
  every stage: task → agent performs → a separate agent reviews against
  criteria and writes a report → PASS/FAIL → FAIL rectifies and
  resubmits, until PASS. The gates cascade: wayfinding is the ungated
  entry (criteria from session content and project context); specifying
  reviews against the plan; slicing against the spec; implementing
  against the tickets. Open: the checker is a named reviewer agent type,
  the cycle is a tool in the code, and the criteria are compiled by the
  engine from the upstream document (all settled); what remains — where
  graded reports live (a new scaffold piece would enter bootstrapping's
  inventory), whether rectification is bounded; the interplay with the
  existing checkpoints
  (slice's user approval, spec's approval options). Existing precedent:
  specifying's own fresh-context review, which this generalizes.
  Tracked as "Review loop — the mechanism" and "Review loop — where
  graded reports live".
- Slicing's knock-ons — the skill's trigger description, and re-pointing
  `implementing`'s and `specifying`'s `/slice` references and the README
  rows. (The door's fate is settled.)
- The change cloud — the full set of changes to skills, commands, agents,
  tools, and code, narrated in chat and organized into the tree as it
  arrives. Tracked as "The change cloud".
- The installer/release machinery — settled: the end-user script
  retires, the builder-side checker and test harnesses stay (candidates
  to become plugin tools), the release is a tag on the repo. The one
  open point: whether each tag also gets GitHub release notes (the gh
  step). Tracked as "Installer and release machinery under the
  plugin".
- Agent types and the plugin's tool/code surface — the reviewer agent
  is the first named type; the rest hang off the change cloud and the
  just-settled channel.
- The plugin package's layout inside the repo — where the plugin's
  entrypoints sit (repo root, or a subdirectory named with the git
  plugin's path selector), now that the repo itself is the distribution.

## Out of scope

- OpenCode V1 support: the catalog is V2-only and stays so.
