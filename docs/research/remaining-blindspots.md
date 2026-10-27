# Remaining blind spots — the plugin-transition wayfinding map

**Target:** `plans/plugin-transition.md` (cited as `map L<range>`, line
numbers as read 2026-10-26; decision titles named for resilience against
reflows). **Cross-checked against:** `tracker/QUESTIONS.md` (cited
`Q <entry title>` or `Q L<range>`), `docs/research/opencode-engine-mechanics.md`
(`mechanics`), `docs/research/opencode-tui-distribution.md` (`tui`),
`docs/research/blind-read.md`, `docs/research/fog-audit.md`,
`docs/research/coverage-matrix.md`.

**Relationship to the earlier audits.** The fog audit hunted
contradictions, double meanings, and gaps *inside* the gate cascade; the
blind read hunted what a spec-writer must guess; the coverage matrix
hunted item fates. This note hunts what none of them hunted: the trust
and permission surface, the interrupted-human flows, arbitrary human
entry into a running chain, the self-report channel's hygiene, the
plugin maintaining itself, and the settled-but-unassigned "who / where /
which" sums. Where a finding genuinely coincides with an earlier audit's,
it is flagged `(also fog-audit …)` rather than re-argued.

---

## 1. Permission and trust surface

The map has exactly one prohibition — the leash: the engine "touches
only work it made itself, and files an agent has cleared"
(`map L185–188`, "The engine is awake"; `L189–193`, "Entry points are
the clearance"). Everything else about what the engine may do, as whom,
and who can see what, is never asked.

- **Read scope is unbounded.** The leash constrains *touching*, never
  *reading*. The engine and its embedded agents (the fact-finder
  "acquires answers", `map L155–158`; the builder reads records to
  build; every spawned session — `map L521–527`, "The engine spawns
  sessions" — ingests whatever context the briefs carry) may read
  everything in a started project: secrets, `.env` files, personal
  drafts, un-cleared files. The map's only read-filtering rule is for
  project *stores* ("agents read the store filtered to their context,
  never the union blob", `map L234–240`) — nothing limits what the
  engine may read outside those stores, and nothing forbids any file
  class from entering engine session context. The sessions the engine
  spawns *are* OpenCode sessions: content synced into them goes to the
  model provider (`mechanics L35–38`), so unattended reading is also
  unattended disclosure.
- **Who does the engine act as?** The map settles that the engine
  "handles commits and pushes for its autonomous work" (`map L328–333`,
  "GitHub integration") and that auth is "gh as the vehicle" — but that
  clause sits in the *open* mechanics (`map L605–610`: "auth (gh as the
  vehicle)… the excluded zeroshot single-writer world is exactly what
  these commits must not assume"). Unasked: whose identity is on every
  granular commit and push (the user's gh, indistinguishably mixed with
  their own commits)? Does the engine get the user's credential, or a
  scoped one? Nothing assigns an author attribution, and the commit-unit
  ruling (`map L222–225`) settles message format *only*.
- **No permission ruleset for engine-spawned sessions.** A plugin
  session is created with a chosen `permissions` ruleset and otherwise
  *inherits the rules in effect at creation*
  (`mechanics L39–41, L82–84`). The map never assigns the engine's
  sessions a ruleset, never says whether they are created under the
  user's own interactive permissions, and never says what happens when a
  permission rule resolves to `ask` inside a headless background session
  — a prompt nobody is there to answer (`mechanics L177–183`; see §2 for
  the hang). The four helpers are "Placed" in the coverage matrix only
  as agent files; their `permissions` fields are unassigned.
- **There is no forbid-list.** The one verb the engine may not perform
  is touching un-cleared files (`map L185–193`). Nothing forbids:
  rewriting history (`git reset`, `rebase`, amend), force-pushing,
  deleting branches, pushing to anything other than the project's
  remote, running build/test commands that reach the network, installing
  dependencies, or executing the project's own scripts — all of which
  the builder-helper's work stage plausibly entails. "Anything the
  engine does can be rolled back in the worst case" (`map L328–333`) is
  an assurance, not a restriction; it holds only for forward commits,
  not for history-rewriting or remote mutation.
- **What the engine may commit, apart from its own work.** Two
  engine-side write paths land in the user's governing records: an inbox
  answer "may be folded into the conventions as the resolution going
  forward" (`map L366–375`, "Convention crashes") and the engine is the
  writer of every record its chain produces. Conventions entries
  engineer-authored from a one-sentence reply are a trust surface the
  map does not gate: no review, no user restatement of the folded text,
  no signature of the change. The glossary side is the same, one step
  removed — only its *admission* is the user's authority
  (`map L312–322`), so engine-authored drafts proceed on one user
  confirmation.
- **Other clones, other engines.** Startedness is per bootstrap run
  (`map L97–102`); nothing stops `/bootstrap` from being run in a second
  checkout of the same repo, after which two engines watch the same
  remote with the same clearance records and the same commit rights. The
  engine-scope question (one instance "across started projects or per
  project", `map L660–663`) is deferred without being put to the user,
  and no rule says an engine may not watch, spawn, or push from a clone
  the user does not think of as active.
- **Consent to continuous processing is unasked.** Prior to this
  design, every agent action sat inside a session the user was present
  in. The always-awake engine processes the project's contents in
  unattended spawned sessions with no recorded moment where the user is
  told (or agrees) that their repo's substance will be continuously read
  and sent to the model, and no kill switch short of... nothing — Escape
  interrupts a *visible* session (`map L46–51`); there is no "stop the
  engine" ruling at all (the start switch has no off-switch counterpart
  anywhere on the map).

## 2. Interrupted-user flows

The user is present at exactly two committed-to moments — `/wayfind`
and the inbox screen — and the map specifies only their happy ending
("confirmed by the user at its end, then cleared" — `map L390–393`;
"prepared to discuss, then to record the user's response" —
`map L513–520`). Every walkaway path is unspecified.

- **The half-charted plan.** A user starts `/wayfind`, the session
  writes a partial `plans/` map, and the user wanders off. The plan was
  never confirmed, so the entry-point tool never ran, so the leash holds
  it out of the engine's hands (`map L178–181`, `L185–193`) — good. But
  nothing expires it, resumes it, or asks about it: the stale
  half-plan lingers as a permanent dead document, and a later attempt to
  re-wayfind against the same premise has no rule against which to
  merge or replace it.
- **The confirmed-but-never-cleared plan.** The user confirms the plan
  and the session dies before the agent runs the entry-point tool
  (crash, Escape-as-interrupt at exactly the wrong moment —
  `map L46–51`). The confirmation lives only in chat; the boundary's
  acceptance criterion is the tool run (`map L189–193`) — and raw chat
  "never carries over that boundary" (`map L455–459`, "The chat's
  boundary"). The user's approval is then unrecoverable *by the rules*:
  nothing detects it, and no path re-runs the tool on a user's
  say-so. `(extends fog-audit C4/U-clearance)`
- **The opened-but-unanswered inbox item.** Opening an item spawns a
  seeded answering session (`map L513–520`). If the user abandons it:
  does the item's count decrement on open, on reply-record, or never?
  Does the item return to "waiting", or stay half-open forever? Items
  are sorted in received order and scrollable (`map L513–520`) but no
  item state exists between "waiting" and "replied", and the sidebar
  counter (`map L537–540`) has no specification for it. The engine's
  wait-side is worse: the documented completion machinery —
  `ctx.session.wait` resolve condition, the `session.idle` payload —
  is an unverified keystone (`map L58–63`; `mechanics L334–353`), and
  "waiting for a human chat turn in a background session" is exactly the
  case the `Idle` outcomes (`succeeded | failed | interrupted`,
  `mechanics L63–70`) do not distinguish from "user typed an answer".
- **Double-open.** Nothing claims an inbox item on open, so the same
  item can be opened twice into two answer sessions (`map L513–520`
  grants the seeded session per open, unconditionally). Two recorded
  replies to one tracker question — which resolution wins, and does the
  loser error loudly? This is a concrete instance of the concurrency
  puzzle the map defers (`map L216–221`) and never names as such.
- **The answer that keeps going.** The helper "records the user's
  response" (`map L513–520`); if the user continues speaking after the
  record is written ("actually, also…"), the follow-on message is
  neither a second reply record nor a rejection, and the recorded-form
  question below assumes one reply per item.
- **No user-side timeout exists anywhere.** Time limits and caps exist
  only for engine steps (`map L466–469`). The re-active flow's whole
  premise is that work waits on the user without halting (`map L168–177`,
  "Inbox and tracker, two jobs") — so the stall is by design, but there
  is no nudge, no escalation, no expiry, no "auto-close as
  user-unreachable", and no rule for how many initiations may pile up
  against a silent user. `(adjacent to fog-audit G2, which covers only
  the engine-side stall)`
- **The re-active → pro-active interleave.** The records once float an
  inbox answer *producing* the next entry-point document (`Q "Pro-active
  flow"` note); if the user answering an inbox item drifts into
  wayfinding and then walks away, both the answer and the newborn plan
  hang together — two interrupted flows interleaved, no state machine on
  the map for either half.

## 3. Chain interruptions and arbitrary human entry

The boundary rule covers which files the *engine* may touch
(`map L108–114`, `L178–181`, `L185–193`). Nothing anywhere covers files
the *user* touches mid-chain — and the design has just removed the user's
interactive doors for every downstream stage (`/spec` dies,
`map L427–431`; `/implement` dies, `map L423–426`), so there is no legal
surface left for a user-side change at all.

- **Hand-editing engine-made work.** The spec written "inside the
  engine" (`map L108–114`) is still a file; a user can edit it by hand
  at any time. The leash is one-directional: the engine will keep
  touching that file because "work it made itself" (`map L185–188`) is
  its belief, which a user edit silently falsifies. Nothing detects the
  edit (no filesystem-watch API exists — `mechanics L132–134` — and the
  engine's only signal is entry-point tool runs, `mechanics L139–149`),
  nothing re-reviews the edit, and the builder's next fix-round will
  happily overwrite the user's words with its own records. The map has
  no "user-edited an engine file" state, stamp, or protest at all.
- **Reopening a settled decision.** The plan is "the user's one
  approval", made where "direction is set" (`map L132–136`) — but
  re-direction is nowhere: once the plan PASSes and the cascade is
  running, a user who changes their mind has no door. The plan cannot
  be edited-then-reapproved, the chain has no rewind or re-confirm
  rule, and the questioning norm about re-confirming "against the user's
  live answer rather than assuming the earlier one still holds"
  (`map L71–76`) is written for *mapmaking* ([Ours]), never extended to
  the machine's own chains. `(fog-audit G1/G5 cover the engine's side —
  a plan defect discovered downstream; this is the inverse — a user
  intent change)`
- **Direct edits to governing records.** Conventions, glossary, and
  tracker files can all be hand-edited. The glossary's form checks
  ("duplicate spellings, malformed entries", `map L285–290`) flag
  *form*, never user meaning-changes; the caregiver's drift-repair
  (`map L312–322`) assumes the proposal pipeline. An un-pipelined user
  glossary edit, a hand convention change (`codifying`'s own job —
  `map L361–365`), or a hand-closed tracker question is invisible to
  the engine and silently supersedes the records its criteria are
  compiled from (`map L291–295`). `(fog-audit U-rulings-in-flow notes the
  no-door; the unstated half is detection)`
- **Running the surviving doors mid-chain.** `/wayfind` survives
  (`map L390–393`) and several plans queue "in received order"
  (`Q "Pro-active flow"`, answered). Unspecified: does a second plan's
  chain wait for the first, can it contradict the first (two plans, one
  project, conflicting directions — which wins?), and does the queue's
  record even have a home (`fog-audit U-plan-queue`)? A second `/wayfind`
  *during* an active chain is the strongest form of arbitrary entry the
  map permits and refuses to choreograph.
- **Forged clearance.** The tool run is the clearance act
  (`map L189–193`), and the tool deliberately has no author check: tool
  hooks don't even carry the session ID (`mechanics L150–153`). Any
  agent in any session — or any human pasting a command — can run the
  tool on any plausible-looking plan file and start a chain. "The
  user-confirmed conclusion" (`map L277–279`, "Wayfinding's ending") is
  asserted, never verified; the map's boundary is a consent boundary
  with no consent verifier.
- **Interrupting a running chain.** Escape interrupts the *current
  visible* session (`map L46–51`); the engine detects and recovers a
  lost *builder* session (`map L194–196`). Missing: a user-side
  *pause* (chain parked until further notice), the user-side *abort*
  (kill a workstream the user no longer wants — does the engine accept
  the ruling, or re-spawn the stage the next tick?), and what
  side-effects a mid-commit interrupt leaves (a pushed granular commit
  with no matching record, `map L222–225`). The checkpoints ruling
  removed every human stop (`map L132–136`) and replaced none of them
  with a human stop *button*.
- **Amending a recorded answer.** A reply lands on the tracker question
  "as its resolution" (`map L168–177`); downstream work then consumes it.
  A user reopening the closed question to amend — second resolution?
  overwrite? new question forking? — is undefined, and the consumed
  stages are already built against the first answer.

## 4. The self-report channel's hygiene

Settled: a loud failure "self-reports to the plugin's own repo (a defect
entry filed from the failing install), carrying typed records only; the
project-side system-defect record and attention signal stand too"
(`map L442–446`); the failure "makes it back to us for figuring out how
to fix" (`map L197–204`). Hygiene: unspecified in every dimension.

- **No lifecycle: who closes them?** "Us" (the maintainers, `map L197–204`)
  is named as the audience, not as the owner. No rule says a filed entry
  becomes a girth-agents tracker item, a GitHub issue, or a
  maintainer-global-config duty; no one is assigned triage, closure,
  or the reply. Deciding "project-local misconfiguration" versus
  "plugin defect" is a judgment nobody holds.
- **No dedup, no rate limit, no loop breaker.** The engine is awake on
  a schedule (`map L185–188`; `mechanics L89–94` for the timer pattern);
  a broken install can re-file the same defect on every tick or restart
  — a crash-loop becomes a defect-flood into the plugin repo. No
  defect-signature dedup, no one-entry-per-class rule, no
  file-and-then-stop (the engine *stops self-reporting and parks*) 
  exists on the map.
- **The reporter can't report.** The "loud, observable failure"
  (`map L197–204`) assumes the reporting machinery itself works. If the
  failure is in the plugin's own loop, or the machine is offline or gh
  is unauthenticated (offline behavior is explicitly *open* in
  `map L605–610`), the report never lands — the map's only fallback is
  the project-side attention signal (`map L442–446`), which is *implied*
  by geometry, never ruled as the degraded path.
- **Privacy is not addressed; typed-records-only is format, not
  hygiene.** Typed records still contain substance: inbox replies are
  raw user prose; reports quote code and paths; a defect report
  carrying the brief, checklist, and verdict can expose a private
  repository's structure, roadmap, ticket contents, and terminology.
  Nothing on the map redacts, scrubs, or summarizes before entry to a
  *public* plugin repository, and nothing gives the user review or
  consent over what leaves their machine. The failure-routing ruling
  ("a failure the user cannot help rectify never inboxes them",
  `map L447–454`) governs *user* messaging, not third-party disclosure.
- **Who pushes the entry, and as whom?** "Filed from the failing
  install" (`map L442–446`) — using the *user's* gh, the user's
  identity, presumably without asking (no consent rule). A shipped
  maintainer token would be a credential leak; the alternative is
  indistinguishable attribution. Neither is chosen, and no version /
  platform / OpenCode-version metadata field on the entry is specified.
- **The self-report breaks the start switch.** The engine "operates
  only where it has been started" (`map L97–102`) — the defect entry is
  a write to a repo the engine is *not* bootstrapped in, made from a
  project it may not even own. Either the ruling has an unrecorded
  exception (network write outside the started project, outside the
  leash of `map L185–188`), or the transport decision contradicts the
  leash and nobody has reconciled them.
- **The reply can never return.** Inbox and tracker are per-project
  (`map L537–540`, `L234–240`). A defect from a foreign project has no
  channel back to its filer; the maintainer's analysis lands in the
  plugin repo where the filing install will never see it. The channel
  is one-way by construction and unacknowledged.

## 5. The plugin maintaining itself

The repo is simultaneously the catalog, the workshop, and the artifact
every user installs (`map L503–506`, "The channel"; `map L137–140`,
"The plugin's layout"; `map L42–45`). The engine's own defect entries
already target it (`map L442–446`). Yet no sentence on the map
acknowledges girth-agents as a *project of the engine's own kind* — and
the circularities are structural.

- **Dogfooding is never named.** girth-agents carries exactly the
  per-project records the engine is designed around (tracker, glossary,
  decisions, plans — survey §2; `map L234–240`), and the map's own
  narration runs a layered workflow on it (`map L5–11`, `L15–29`).
  Nothing says whether, after the ship, the maintainer runs
  `/bootstrap` here; nothing says whether the engine's review chains
  gate the plugin's own spec/ticket/work stages; and the maintainer
  agents deliberately live in global config, *not* the repo (AGENTS.md
  maintenance note), so the engine's own defects would be processed by
  agents outside the engine — a split-brain the map never stances.
- **The engine modifying the plugin it runs from.** The work stage
  builds code; on girth-agents, that code *is the plugin*: the engine's
  builder writes the engine. The running install was loaded from the
  repo (git-spec; branch-tracking installs are update-checked at server
  start — `tui L84–85`), while the engine's work mutates the checkout,
  commits to the repo, and the harness "gates merges to main"
  (`map L141–145`). Three loops nobody has drawn: (a) an engine patch
  changes the semantics of the loop that is still running the pre-patch
  code, and the chain continues under the old rules; (b) a server
  restart may load the *new* engine mid-chain, mid-verdict; (c) the
  builder testing the engine is the engine testing itself — a broken
  builder's test of a broken engine gates on its own brokenness.
  `(The C5 problem — settled agents resting on an unverified
  registration keystone — is the same shape: the design is settled on
  machinery it may not be able to create.)`
- **No pin-and-version rule for the dogfood install.** Git-spec
  installs track branches unless pinned to a full hash (`tui L84–85`);
  the map settles "OpenCode's own plugin-update keeps installs current
  from the repo" (`map L503–506`) without saying the *maintainer's
  install* must pin. An engine editing main from an install that tracks
  main is an engine editing its own execution semantics in real time;
  every chain it runs is potentially invalidated by its own next commit.
- **The bootstrap of the engine's own builders is circular.** After the
  umbrella spec is approved, "building and slicing are the next effort"
  (`map L7–11`) — the first chain, run on this repo, would have the
  builder write the builder's own definition, the reviewer review policy
  for review of the plugin's own reviewer, and `test-driving` teaching
  the harness that gates *itself* (`map L491–495`). Who writes the
  first helper definitions and the first records stand-alone — by hand,
  by [Ours] process — is never stated; the map's destination shape
  (`map L593–596`) covers only the spec, not the chain that follows it.
- **Engine commits to the distribution branch.** Granular pushes land
  "as it goes" (`map L222–225`); branch discipline is open
  (`map L605–610`). For the dogfood repo that open item is the highest
  stakes one on the map: engine commits to *main* are commits to
  everyone's next update. Who merges, and that "green main" (`map L141–145`)
  precedes the push, is unassigned — and for every foreign project the
  same question is merely annoying by comparison.
- **Self-report + dogfood = an engine processing itself.** §4's defect
  entries arrive in the one repo where the receiving engine's own inbox
  and tracker live. Are filed defects tracker DEFECTS the dogfood
  engine would then pick up, prioritize, and maybe build fixes for —
  fixes written by the engine about the engine, gated by the engine,
  shipped as the engine? If yes, the maintenance loop is closed entirely
  inside the system the map is meant to leash; if no, the dogfood
  tracker deliberately excludes the one feed that self-reports into it.
  Unasked either way.

## 6. Unanswered "who / where / which" sums

Mechanisms the map has *settled* — a decision with a named role but no
named executor, home, or form. Each line below is a completeness item;
the closing question backlog carries one question per item. (The map's
own deferred list — `map L655–663` — names several; the additions here
are the settled mechanisms that deferred list misses.)

1. **Typed forms** (brief, checklist, verdict/report) and their homes —
   `map L460–465`, "Hand-offs"; deferred `map L655–659`. Shapes unknown:
   structured or free-form; where the brief and checklist live relative
   to the report pile.
2. **The checklist's compiler** — "the engine compiles the reviewer's
   checklist straight from the earlier approved document" (`map L474–479`,
   "Criteria"); the *compilation mechanism* itself (a hard tool? a
   helper? a transform of the earlier document?) is unnamed, and nothing
   reviews a bad compilation (`fog-audit U-criteria-compilation`).
3. **The plan-stage checklist's source and compiler** — plan criteria
   come from "the session chat and the project context" (`map L77–85`,
   `L474–479`) — the one stage where the compiler and its input record
   are doubly unassigned, and raw chat is the source precisely where
   "raw chat never carries over" (`map L455–465`) is strictest.
4. **The report pile's owning skill and format** — "their own pile… a
   new scaffold piece in each project" (`map L470–473`) with no owner
   (scaffold-family maintenance is deferred, `map L655–659`), no format,
   no bootstrapping-inventory row (`Q "Review loop — where graded
   reports live"` follow-up).
5. **The inbox message and reply forms** — the inbox "keeps its own
   record" (`map L168–177`) and its message/reply "forms are spec
   detail" (`map L655–659`; `Q "The inbox item's home and form"`
   follow-up). Home (file path, pile, tracker-adjacent) and shape are
   both unassigned.
6. **The context-map record's format** — "a root context-map record
   declaring the repository's contexts" (`map L234–240`); format is
   spec detail (`Q "Project kinds"` follow-up, L128–129) and its
   ownership (which skill's format reference) is unnamed.
7. **Budget and cap numbers** — fix-round cap and per-step time limit
   (`map L466–469`: "the exact numbers are spec detail"); recall-layer
   budgets and eviction (`Q "The recall layer"` follow-up, L72–73).
   These are gates the trust story depends on (`map L141–145` asserts
   determinism) but no number exists to write into the loop tool.
8. **The loop tool's executor and interface** — "a hard tool in the
   plugin's code" (`map L480–482`, "The loop's driver") — named as code,
   but its module home `(the repo-root package, `map L137–140`)`, its
   invocation signature, and its inputs (the brief path? stage kind?)
   are unassigned; no one audits the tool against the discipline it
   enforces (`map L466–469`).
9. **The startedness marker** — the engine "operates only where it has
   been started" (`map L97–102`) and must re-learn startedness across
   restarts against `ctx.storage` durability that is an unverified
   keystone (`map L58–63`; `mechanics L265–276, L334–353`). What record
   marks a project started — a scaffold file, a storage key, a registry —
   is never named (`fog-audit U-started-projects-across-restarts`).
10. **The plan queue's home** — multiple cleared plans "queue in
    received order" (`Q "Pro-active flow"`, answered); the queue record's
    home and drainer are unassigned (`fog-audit U-plan-queue`).
11. **The defect entry's schema and recipient path** — "a defect entry
    filed from the failing install" (`map L442–446`): into which file or
    endpoint of the plugin repo, in which form, carrying which metadata —
    unassigned (§4).
12. **The answer-recording actor** — the reply "lands on the inbox
    message and closes the tracker question" (`Q "The inbox answering
    session"`, answered; `map L168–177`); whether the answering helper
    or the engine performs the close-write, and the tracker question's
    closing-line format, are unassigned.
13. **The sidebar's exact derivation** — "read from the records, never
    hand-written" (`map L163–167`); which report-pile fields and ticket
    states map to "being built / under review / sent back" is spec
    detail, unassigned (`Q "Sidebar ongoing-work breakdown"` follow-up).
14. **The engine's instance count** — "whether the engine is one
    instance across started projects or per project" (`map L660–663`) —
    raised by reviewers, never put to the user; it gates §1's
    multi-clone and §2's cross-project stalls.
15. **Helper registration mechanics** — four settled agent types with
    no `add` in the documented editor (`mechanics L198–231`; `map L58–63`
    keystone; `fog-audit C5`): *who verifies* the registration path and
    *when* (spec-time, `map L650–654`) — unassigned as an action item.
16. **The new vocabulary's migration** — the engine's whole vocabulary
    (entry point, cleared, brief, verdict, defect entry) has no recorded
    glossary owner to graduate it (`coverage-matrix`, `domain-modeling`
    row); the caregiver owns *ongoing* care (`map L312–322`), not the
    one-time migration — unassigned.
17. **The umbrella spec's executors** — one spec approved once, then
    "building and slicing are the next effort" (`map L7–11`, `L593–596`);
    who runs that build/slice (the engine's first dogfood chain, or the
    [Ours] process) is unassigned (§5).

---

## Question backlog

Ordered by dependency: earlier answers constrain later ones. Sources
cited per question.

1. What is the complete forbidden-list for the engine — git operations
   (reset, rebase, force-push, branch deletion), file classes (secrets,
   dotfiles, other worktrees), and process actions (network-touching
   commands, installs, arbitrary project scripts)? (§1)
2. What permission ruleset do engine-spawned sessions carry, what do
   `ask`-resolving rules do headless, and does engine work run under the
   user's own permission model or a dedicated one? (`mechanics L82–84`,
   §1)
3. As whom does the engine commit and self-report — the user's gh
   identity, a scoped credential, or something else — and what author
   attribution lands on granular commits? (`map L328–333`, `L605–610`, §1/§4)
4. Does bootstrapping include a consent moment stating what the awake
   engine will continuously read and process, and is there an off-switch
   that parks the engine without uninstalling the plugin? (`map L97–102`,
   §1)
5. What record marks "started", where does it live, and is it durable
   across restarts when `ctx.storage`'s durability is unverified?
   (`map L58–63`, `L660–663`, §6.9/§6.14)
6. How is one engine's activity prevented or regulated when the same
   repo is bootstrapped in a second clone — and how many engine
   instances exist, one per started project or one across them?
   (`map L660–663`, §1)
7. What recorded artifact proves a plan was *user-confirmed* (not
   merely tool-cleared), and what re-triggers clearance when the
   confirmation survives but the tool run never happened? (§2,
   `fog-audit C4/U-clearance`)
8. What does the engine do with a half-written `plans/` map when its
   wayfinding session dies unconfirmed — expire it, resume-promote it,
   or ignore it, and after how long? (§2)
9. Do inbox items have an "opened, unanswered" state, and what does the
   `Inbox: {n}` counter count when items are open-but-unanswered, given
   `session.idle`/`wait` semantics are unverified? (`map L513–520`,
   `L537–540`, §2)
10. Is an inbox item claimed on open, and what happens when the same
    item opens twice or the user speaks after the reply was recorded?
    (§2)
11. Should there be any user-side timeout, nudge, or expiry on
    authority-kind questions that go unanswered for a long time — and if
    so which? (`map L168–177`, §2)
12. When the user hand-edits an engine-made file (spec, tickets, work)
    or a governing record (conventions, glossary, tracker), does the
    engine detect it, and which edits are honored, re-reviewed, or
    flagged? (`map L185–188`, §3)
13. What is the legal path for the user to change direction mid-chain —
    amend the plan, abort a workstream, or re-answer a resolved
    question — and what rewinds or forks result? (`map L132–136`,
    `L423–431`, §3)
14. Can anything other than a user-confirmed wayfinding session legally
    run the entry-point tool, and how does the tool (or the engine) know
    the difference? (`map L189–193`, §3)
15. If several cleared plans queue in one project, do their chains run
    concurrently, do later plans wait, and how are conflicts between two
    plans resolved? (`Q "Pro-active flow"`, §3)
16. Who receives a "rejected loudly" rejection and what state does the
    rejected file land in when the user hand-produces an outside
    document? (`map L570–582` narration, §3)
17. Who owns self-reported defects end to end — triage, close, and
    reply — and into which file or endpoint of the plugin repo are they
    filed? (`map L197–204`, `L442–446`, §4)
18. What dedup signature, rate limit, and file-once-then-park rule keeps
    a crash-looping engine from flooding the plugin repo, and which
    side is cut first when the report itself fails (offline, no gh)?
    (§4)
19. What content is allowed in a defect entry — which typed records, in
    what redacted form — and does the user review or consent to the
    entry before it leaves their machine? (`map L442–446`, §4)
20. Does the defect self-report need an explicit exception to the start
    switch and the leash, and if so how is it recorded in the
    decisions? (`map L97–102`, `L185–188`, `L442–446`, §4)
21. Does the engine get bootstrapped into girth-agents itself, who
    runs the post-spec build and slice, and who writes the first helper
    definitions before any engine chain exists? (`map L7–11`, §5)
22. If dogfooded, what pin discipline (full commit hash) and branch
    discipline keep the engine's install from tracking the very main its
    own chains are editing — and who merges engine branches to the
    distribution branch? (`map L503–506`, `tui L84–85`, §5)
23. Are defect entries filed from foreign installs treated as
    girth-agents tracker DEFECTS that the dogfood engine may pick up and
    build fixes for — and is the maintenance loop allowed to be closed
    entirely inside the engine? (§4/§5)
24. What are the exact typed forms — the brief, the checklist, the
    verdict with its report — structured or free-form, and where does
    each live? (`map L460–465`, `L655–659`, §6.1)
25. Which mechanism compiles the reviewer's checklist from the prior
    document, and who reviews a bad compilation before it becomes the
    unfalsifiable test? (`map L474–479`, §6.2)
26. Who compiles the plan-stage checklist — from what written record of
    the wayfinding session, given raw chat never crosses — and where is
    it stored? (`map L77–85`, `L455–465`, §6.3)
27. Which skill owns the report pile's format, what is it, and what
    bootstrapping-inventory row does the pile get? (`map L470–473`,
    §6.4)
28. Where do the inbox message and reply records live, in what form,
    and who owns that format? (`map L168–177`, §6.5)
29. What is the context-map record's format and which skill owns it?
    (`map L234–240`, §6.6)
30. What are the fix-round cap, the per-step time limit, and the
    recall-layer budgets — as numbers, not placeholders? (`map L466–469`,
    `Q "The recall layer"` follow-up, §6.7)
31. What is the loop tool's invocation interface and module home inside
    the repo-root package? (`map L137–140`, `L480–482`, §6.8)
32. Who performs the inbox answer's closing write to the tracker
    question — the answering helper or the engine on pickup — and in
    what closing-line form? (`map L168–177`, §6.12)
33. Which report-pile and ticket fields drive the sidebar's three
    breakdown states exactly? (`map L163–167`, §6.13)
34. Who verifies the keystone that agent IDs can be registered from a
    plugin, and on what date — before which nothing is built on the
    four helper agents? (`map L58–63`, `L650–654`, §6.15)
35. Who graduates the engine's new vocabulary into the glossary at
    transition time, if the caregiver only owns ongoing care?
    (§6.16)