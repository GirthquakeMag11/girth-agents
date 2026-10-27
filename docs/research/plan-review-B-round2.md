# Plan review B — round 2 — plugin-transition after the six-finding rectification

**Target:** `plans/plugin-transition.md` ("the map", cited `map L<range>`).
**Criteria source:** `tracker/QUESTIONS.md` ("the tracker", cited `Q <entry
title>` or `Q L<range>`), `docs/research/` (round-1 reviews
`plan-review-A/B/C.md`; the audits; the sweep), `GLOSSARY.md` ("the
glossary", cited `GLOS L<range>`).
**Round:** re-review. Round 1 (`plan-review-A/B/C.md`, 2026-10-27) FAILed
with six findings; the user rectified all six (settlements dated
2026-10-27, user, `map L256–288`). This round grades the rectified plan.

**Disposition.** A spec-writer who must turn this plan into the umbrella
spec without inventing a decision, and cannot ask the originating session
anything. Every check answers one question: can I write that spec section
from these records alone?

**Verdict up front:** PASS. All six rectifications are on the map, dated,
and each closes its finding. The specifiability sweep finds every
mechanism the spec must pin is either decided or parked as spec detail;
the remaining findings are representation defects (recorder fixes, never
questions to the user) and shaped-within-bounds watch-items the spec
pins from recorded direction. No invention is forced anywhere.

---

## 1. The six rectifications, verified one by one

| # | Finding (round 1) | Settlement on the map | Closes | Specifiable? |
| --- | --- | --- | --- | --- |
| 1 | Off-switch / park + consent moment (B-D1, C-D1; `rb` Q4) | "The off-switch", `map L284–288` | fully | yes — see 1.1 |
| 2 | Engine sessions' permission ruleset (C-D2; `rb` Q2) | "The helpers' permissions", `map L275–283` | fully | yes — see 1.2 |
| 3 | Who repairs a FAILed plan (B-D2) | "The plan's repair chair", `map L269–273` | fully | yes — see 1.3 |
| 4 | Push-conflict terminal state (C-D3; `cb` Q7) | "Push-conflict terminal", `map L264–268` | fully | yes — see 1.4 |
| 5 | `domain-modeling`'s fate (A-K1) | "`domain-modeling`'s fate", `map L260–263` | fully | yes — see 1.5 |
| 6 | The "inbox" name collision (A-K2; `tui` L73/L115) | "The name 'inbox'", `map L256–259` + glossary entry | fully | yes — see 1.6 |

### 1.1 The off-switch and the consent moment

`map L284–288`: bootstrap states plainly what always-awake processing
means before it starts (the consent moment); a park command stops the
engine on that project, leaves the records in place, resumable by
re-running bootstrap; the engine then stops reading that repository
until restarted.

Round 1 asked exactly this (B's question: stop without uninstalling or
unbootstrapping; what happens to the in-flight chain and queued work;
consent before start). The answer covers the command, the consent
moment, the records, the resume path, and — decisively for C's trust
boundary — that *reading* stops. Consent rides the already-settled
synchronous bootstrap moment (`map L115–120`: the user is present, asks
happen in-session). Specifiable: the spec pins the consent wording (the
established pattern for statement strings — cf. the wizard trigger, "the
spec pins the exact string") and the park command's name; what a stopped
engine leaves in place is already pinned by the crash contract (`map
L233–238`: records are the ledger, restart rebuilds from committed
records alone). In-flight-step nuance: see W1 (§4) — a composition, not
a question.

### 1.2 Per-helper tailored permissions, dispatch-time check, loud-failure mismatch

`map L275–283`: each helper carries its own tailored permission ruleset
(like its configuration, toolset, skills); the forbidden list (`map
L349–354`) is the floor; the orchestrator matches the job's requirements
against the helper's set before dispatch; a mismatch fails loudly there
— a system defect to fix, never a mid-operation permission request
reaching the user.

Round 1 asked what ruleset engine-spawned sessions carry and what a
headless `ask` does (`rb` Q2). The answer assigns per-helper sets, makes
the forbidden list the floor, and routs every shortfall to the
dispatch-time check's loud failure — from which the spec pins
allow/deny-only sets for engine sessions (no `ask` entry can exist,
because the ruling forbids every mid-operation prompt by consequence).
The map's own parked list carries the mechanics: "the dispatch-time
permission check's mechanics (requirements matched against the helper's
set before dispatch — a mismatch is the loud failure, never a
user-facing request)", `map L806–809`. Specifiable. The
orchestrator-matches vs engine-dispatches attribution: see W2 (§4).

### 1.3 The plan's repair chair is the interactive session

`map L269–273`: the agent repairs the FAILed plan with the user,
continuing the conversation the plan came from; the plan's review runs
before its confirmation so a FAIL still has a live session to land in;
only a reviewed-and-confirmed plan enters the engine.

Round 1 (B-D2) found the repair actor seated nowhere for the one stage
the builder doesn't build. The answer seats it — the session itself —
and orders the gate correctly: review → repair-in-session → PASS →
user confirmation (the dated marker, `map L343–348`) → entry-point tool.
The sequence composes with the machinery already pinned: checklist from
the session chat and project context (`map L80–85`, `L641–645`), failure
routing "at every stage, the plan included" (`map L614–621`), the chat
as a plan-review source (`map L622–626`). The interpreter/recorder
semantics from "Reviewer context" (`map L206–215`) remain ruled
semantics; their mechanical seat per stage is the reviewer's own
classification and the engine's routing — a shape, per W4 (§4).
Specifiable.

### 1.4 Push-conflict terminal: hold + inbox

`map L264–268`: on non-fast-forward divergence the engine never merges;
it holds its commits, leaves the working tree alone, and raises through
the inbox (reconciliation is the user's authority); everything waits
intact until answered.

Round 1 (C-D3) found the retry loop's end under permanent divergence
unnamed for the spec. The answer names the terminal state completely —
detection (non-FF), the act (hold; never merge, consistent with the
forbidden list `map L349–354`), the routing (inbox by reference, per the
two-jobs ruling `map L168–177`), and the wait (intact until answered,
consistent with absorb-or-alarm's never-build-on-unanswered-edit `map
L239–245` and plank two's exclusivity `map L384–387`). The pull
strategy's mechanism remains a shape in the parked sums. Specifiable.

### 1.5 `domain-modeling` survives, re-fit

`map L260–263`: the skill survives; the engine-side discipline lives in
the caregiver; the interactive side keeps its function, guiding the user
through term-work when judging proposals and ruling meanings.

Round 1 (A-K1) found the skill's own fate recorded nowhere while the map
claimed "every skill and command now has a fate" (`map L92–93`). The
settlement records the fate and splits the carrier the same way the
knowledge-management answer splits it (caregiver owns the engine-side
discipline, `map L479–489`, Q "Knowledge management" Answered). The
skills enumeration in the umbrella spec can now close; the exact re-fit
wording is the sweep (function-necessity rule, `map L520–527`).
Specifiable.

### 1.6 The name "inbox" is kept, with a glossary entry

`map L256–259`: kept as the user's inbox as designed in this plugin, in
contrast to OpenCode's agent-prompt-queue inbox of the same name.
**Verified present:** `GLOS L12–16` carries exactly this entry —
"**Inbox**: the user-facing screen and the system's asynchronous
send/receive channel to the user — requests the engine writes, answered
in seeded sessions whose recorded replies the engine picks up. In this
project 'inbox' means this, unless OpenCode's own inbox — a session's
pending-prompt queue — is expressly named." That is round 1's whole
demand (A-K2: a decision, a glossary entry, an explicit confrontation of
the collision). Specifiable: the spec names the screen "inbox" and
points at the glossary entry. The one wording delta (decision says
"agent-prompt-queue", glossary says "pending-prompt queue") is the same
referent, no contradiction; the recorder may align the words.

---

## 2. Re-verification — specifiability sweep

**The parked sums are intact and complete** (`map L313–317`): typed forms'
shapes, the reports' owning skill, the context-map's format, the inbox
message forms, the cap and budget numbers, and criterion-compilation
mechanics — every direction decided, the spec pins the shapes. The
parked list has grown to match the rectifications: the dispatch-time
permission check's mechanics are now named there (`map L806–809`), so
rectification #2's own mechanics are parked, not improvised. Keystones
stay honestly labeled unverified-before-building, not open decisions
(`map L796–800`); deferrals stay deferred by design (`map L810–812`):
handoff//retro/wizard shelf, scaffold-migration rules' details, future
concurrency stance, multi-machine arbitration.

**Spot-checked spec sections, written from records alone:**

- *Engine lifecycle:* start (start switch, `map L97–102`), awake/leash
  (`map L185–188`), consent (`map L284–288`), stop (`map L284–288`),
  activation (`map L369–376`), re-bootstrap (`map L252–255`), crash
  rebuild (`map L233–238`), instance model and seriality (planks one,
  two, four: `map L388–392`, `L384–387`, `L227–231`), branch and push
  incl. offline and conflict (`map L247–251`, `L308–312`, `L264–268`),
  user edits (`map L239–245`), commit unit (`map L223–226`), forbidden
  list (`map L349–354`), dogfooding (`map L330–335`). Complete.
- *The gate:* loop tool (`map L647–649`), checker (`map L650–653`),
  criteria incl. plan-stage exception (`map L641–645`), caps enforced in
  code with numbers parked (`map L633–636`), reports + stamps
  (`map L637–640`), exception and its transport (`map L198–205`,
  `map L609–613`), failure routing (`map L614–621`), direction-change
  (`map L336–342`), confirmation artifact (`map L343–348`), plan repair
  and review-before-confirmation (`map L269–273`). Complete.
- *The helpers:* roster six-plus-one (`map L289–297`), per-helper
  tailored configuration/tools/skills and now permissions
  (`map L275–283`), fail-open/no-lying (`map L182–184`), the builder
  and fixer (`map L146–154`), fact-finder (`map L155–158`), inbox
  answerer (`map L159–162`), caregiver (`map L479–489`), prove-it
  (`map L433–441`), five crafts under role-shaped context
  (`map L570–582`), recall layer (`map L408–451`), glossary pipeline
  (`map L452–478`). Complete.
- *The inbox:* screen (`map L681–688`), name + glossary (`map L256–259`),
  item record and by-reference send/receive (`map L168–177`), reply
  landing (`map L168–177`), sidebar counter (`map L705–708`), answering
  helper (`map L159–162`), serial landing of answers (`map L359–362`),
  abandoned items inert — nothing expires, nothing re-asks
  (`map L318–323`). Complete; message/reply forms parked.
- *Trackers and stores:* kinds (questions ×2, hazards, term proposals,
  lessons — `map L412–416`, `L463–467`), one root store + context map +
  scoped reads (`map L401–407`), non-code repositories (`map L393–400`).
  The system-defect record's format is parked (`map L807–808`); its home
  is a shape — see W3 (§4).

**No silent gaps of the round-1 kind remain.** The "Not yet specified"
area summaries now read settled for concurrency, primary agents, GitHub
integration, project kinds, knowledge management, and the change cloud
(`map L770–787`) — the round-1 R1/R2/R3/R4 stalenesses in that tail are
fixed, and the pour-complete bullet no longer lists primary agents among
its deferrals (`map L298–301`). B's soft D3 (engine read scope) is now
covered by direction: role-shaped context (`map L575–582`), per-helper
tailored configuration (`map L275–283`), context-filtered store reads
(`map L401–407`), and typed hand-offs only (`map L627–632`); the exact
context loads are spec shapes. B's soft D5 (self-report schema and
destination) is settled — destination is the plugin's own repo
(`map L609–613`), payload consent and typed-only limits are settled
(`map L324–329`), and the defect record's format is parked
(`map L807–808`).

---

## 3. Stale "open" statements beside settlements — one remains

**R-A (principal).** The "Not yet specified" plan-review bullet
(`map L763–769`) says the six findings "re-open the frontier, in
rectification with the user" and "(Nothing here is settled until that
round closes.)" — beside the six dated settlements a hundred lines above
(`map L256–288`). The round has closed on the user's side; every finding
it names is settled on the page it appears in. A spec-writer taking the
tail at its word resurrects six settled fogs. **Classification:
representation** — the recorder rewrites the bullet as history (review
failed, six findings rectified, pointers to the settlements), the same
disease class as round-1 R1–R4, healed everywhere else on the map. No
question to the user.

**R-B (low).** The bootstrap residual-ask whitelist is still
under-carried (round-1 R10): the map routes the asks (`map L115–120`)
and settles the gh item (`map L302–307`) but never enumerates "(name,
purpose, license when undeclared; starting version when unstated; the
gh install as an action)" (Q "Eager bootstrapping" Answered). The spec
can be written only because the tracker carries the list; the map should
fold it in. **Representation**, recorder fix.

**R-C (low).** The three "declared" bullets for GitHub integration
(`map L495–500`), Project kinds (`map L501–507`), and Knowledge
management (`map L508–519`) still carry no pointer to their settlements
(the bootstrapping pair at `map L720–724` shows the map's own
reconciled-pointer pattern). Round-1 R9, unfixed. **Representation**,
recorder fix.

**R-D (low).** The three-perspective note (`map L77–93`) opens "four
genuine inquiry threads, not settled" and then settles all four inline.
Internal phrasing contradiction, same class as R-A, low severity.
**Representation**, recorder fix.

**R-E (low).** "Wayfinding's ending" (`map L745–747`) still narrates
user-confirmed conclusion → run the entry-point tool, without the
review-before-confirmation step the repair-chair ruling (`map L269–273`)
adds. The later ruling governs; the older narration should say so (the
round-1 R7 pattern). **Representation**, recorder fix.

**R-F (low, carried).** `/slice`'s survival (`map L664–666`) remains
unlabeled across the layers (round-1 A-C4): the `/implement` precedent
(`map L590–593`) splits door-dies-beneath / skill-survives-as-craft, and
the coherent reading of `/slice`'s survival is [Ours]-side, with the
slicing skill live as engine machinery in [The system]. The label applies
the recorded pattern; no invention. **Representation**, recorder fix.

None of R-A..R-F hides an unanswered design decision; all are the
recorder's to fold, per the map's own doctrine (`map L15–29`).

---

## 4. Watch-items the spec pins from recorded direction (no inventions)

- **W1 — park × the in-flight step.** The off-switch ruling does not say
  whether park interrupts the step in flight or waits for it. Direction
  on record is enough: park stops the engine (plain reading of `map
  L285–288`), records stay, resume on re-bootstrap rebuilds from the
  committed ledger (the crash contract, `map L233–238`; lost-session
  detection, `map L194–196`). The spec pins interruption-and-rebuild as
  the composition of those rulings; a graceful-wait reading would be a
  genuine question, and the spec-writer should note the ruling's plain
  reading as authoritative.
- **W2 — orchestrator-matches vs engine-dispatches.** `map L293–297`
  says helpers are "dispatched by the engine"; `map L279–281` says the
  orchestrator matches requirements before dispatch. Compatible
  (coordination vs mechanical dispatch); the match's mechanics are
  already parked (`map L806–809`).
- **W3 — the system-defect record's home.** Direction recorded (a
  project-side record and attention signal stand, `map L609–613`);
  format parked; its home (tracker kind, reports pile, or its own
  piece) is a shape the spec pins inside the parked class.
- **W4 — who reviews the plan pre-confirmation.** The checker is the
  named reviewer (`map L650–653`); the plan's review runs from the
  interactive session with the chat-and-context checklist (`map L82–85`,
  `L622–626`, `L641–645`); the spec pins the dispatch shape. No
  decision needed.
- **W5 — transition-time vocabulary migration.** Caregiver owns glossary
  labor, the user owns admission (`map L479–489`), bootstrap derives
  everything derivable (`map L720–724`); the new vocabulary's
  graduation mechanics are a shape within those directions (round-1 C
  listed it among unassigned sums; it rides the parked shapes).
- **W6 — two queued plans.** Queue order is spec detail (Q "Pro-active
  flow" follow-up); serial plank one (`map L388–392`) makes the second
  chain wait; direction-change machinery (`map L336–342`) handles
  contention. Conflict-between-plans is unruled but bounded; the spec
  states the serial consequence.

None of W1–W6 requires a question to the user; each is either composed
from recorded rulings or pinned as a parked shape.

---

## 5. Classification summary

| # | Finding | Class | Severity |
| --- | --- | --- | --- |
| R-A | N-y-s review bullet: "nothing settled until the round closes" beside the six settlements | representation | medium |
| R-B | Bootstrap residual-ask whitelist under-carried (lives only in the tracker) | representation | low |
| R-C | Unpointed "declared" bullets (GitHub, project kinds, knowledge management) | representation | low |
| R-D | "four inquiry threads, not settled" then settled inline | representation | low |
| R-E | Wayfinding's ending omits review-before-confirmation | representation | low |
| R-F | `/slice` survival unlabeled across layers | representation | low |
| W1–W6 | Shape item the spec pins within ruled direction (see §4) | design, within bounds | watch |

Design frontier: **closed.** Six rectifications verified, dated, and
specifiable; no mechanism forces an invention; the one stale open
statement and six representation nits are recorder fixes, never
questions to the user.

VERDICT: PASS