# Plan review B — the plugin-transition plan, from a spec-writer's chair

**Target:** `plans/plugin-transition.md` ("the map", cited `map L<range>`).
**Criteria source:** `tracker/QUESTIONS.md` ("the tracker", cited `Q L<range>`
or by entry title). **Context skimmed:** `docs/research/` (the four audits,
the blindspots backlogs, the sweep).

**Disposition.** Not an auditor: a fresh spec-writer who must turn this plan
into the umbrella spec and cannot ask the originating session anything. The
test throughout is: can I write every spec section from these records
without inventing a decision? Citations are to the files as read.

**Verdict up front:** the map is close — almost all of the six parked sums
are parked deliberately and almost every tracker answer is carried — but
two spec sections still force an invention, and the map's stale
"Not yet specified" entries contradict the settlements on the same page.
**FAIL**, with one question to the user. Findings follow.

---

## 1. Criterion 1 — Specifiability

**The six mechanisms a spec must pin.** The plan parks all six, by name, in
"The unassigned sums" (`map L280–284`): "the typed forms' exact shapes, the
reports' owning skill, the context-map's format, the inbox message forms,
the cap and budget numbers, and criterion-compilation mechanics are spec
details: every direction is decided, and the spec pins the shapes." Each
parking agrees with its tracker follow-up:

| Mechanism | Map (direction → parked detail) | Tracker agreement |
| --- | --- | --- |
| Typed forms (brief, checklist, verdict/report) | decided direction `map L594–599`; shapes parked `L280–284` | "the typed shapes themselves are pinned in the spec", Q L307–311 |
| Reports' home | decided: own pile per project + verdict stamped on the checked work, `map L604–607` | Q L564–569, including "the piece needs an owning skill and a bootstrapping-inventory row — done with the spec" |
| Context map | decided shape `map L368–374`; format parked `L280–284` | Q L167–169 ("the context map's format … spec detail") |
| Inbox message forms | decision "its own record", never copied, `map L168–177`; forms parked `L280–284` | Q L410–417 ("the message and reply forms are spec detail") |
| Cap numbers | decided enforcement-in-code `map L600–603`; numbers parked `L280–284` | Q L291–293 ("the cap's exact number is spec detail") |
| Criterion compilation | decided direction `map L608–613` + hard loop tool `L614–616`; mechanics parked `L280–284` | Q L594–603 (incl. the plan-stage exception, L601–602) |

Also specifiable without invention: the plan-gate criteria's source (session
chat + project context, `map L80–85`, `L611–613`), the reports' verdict
side-channel, the confirmation marker (`map L310–315`), the swept item fates
(`map L92–93` — with one soft caveat, D6 below), and the startedness marker
(pinned by construction: "no separate engine state store", `map L232–237`,
plus "State travels through the records; activation is local", `map L336–343`).

**But "never silently missing" fails in two places.**

- **The engine's stop semantics are not merely parked — they are absent.**
  Every ruling is start-facing: the start switch (`map L97–102`), always-awake
  (`map L185–188`), startedness-as-activation (`map L336–343`), re-bootstrap's
  pause-then-resume as a bootstrap-exclusivity step (`map L251–254`). No
  ruling, no deferred note, no tracker entry (Concurrency's answer, Q L35–48,
  covers seriality, never stopping) touches how or whether the engine is
  stopped, parked, or un-bootstrapped. See D1.
- **The plan gate's rectification is "fully settled" except for its actor.**
  Criteria, routing, dead-end, user-side amendment, and
  representation-vs-design triage are all ruled (`map L80–85`, `L197–204`,
  `L205–215`, `L303–309`, `L581–588`) — but who performs a FAILed plan's
  repair when no user answer is needed is seated nowhere (see D2). "a FAIL
  repairs normally" (`map L82`) has no "normally" to attach to for the one
  stage the builder doesn't build (`map L146–154`).

**Specifiability: FAIL on the two forced inventions; the named six sums
themselves are clean.**

---

## 2. Criterion 2 — Fidelity to the tracker

Sampled settled-vs-answered pairs — no quiet inversions found:

- Channel: git, no package store, tag releases + release-note pages
  (`map L638–641`, `L124–127` vs Q L664–669, L684–693) ✓
- Commit unit / push cadence / branch / offline / gh auth
  (`map L222–225`, `L246–250`, `L269–279`, `L232–237` vs Q L132–140) ✓
- Concurrency planks one through four, one per machine per checkout
  (`map L226–231`, `L246–250`, `L351–359` vs Q L35–48) ✓
- Primary agents → the orchestrator primary, seis helpers, build/plan
  replaced (`map L257–263` vs Q L114–117 vs `tracker/FEATURES.md` L15–18,
  "Realized — 2026-10-27" — the reference resolves) ✓
- The pour is complete (`map L264–268` vs Q L643–646) ✓
- Bootstrap synchronous + gh-credentials option and declination
  (`map L115–120`, `L269–274` vs Q L455–461) ✓
- The unassigned sums and every parked spec detail match the tracker's
  follow-ups (Q L307–311, L381–382, L416–417, L567–569, L291–293, L167–169)
  ✓
- One tracker answer the map does **not** carry: the bootstrap residual-ask
  whitelist — "(name, purpose, license when undeclared; starting version
  when unstated; the gh install as an action)" (Q L458–459). The map's
  synchronous-bootstrap bullet (`map L115–120`) routes the asks but never
  enumerates them; a spec-writer on the map alone invents the list. Not an
  inversion — a carry-through gap (recorder-fixable, R10).

**Fidelity: PASS** — the settled decisions carry the user's recorded
answers without inversion; one answer is under-carried (R10), and the
inversion-class problems are map-internal staleness (criterion 3), not
tracker inversions.

---

## 3. Criterion 3 — Contradictions, classified

**Representation defects** (the map's wording; the recorder fixes — never a
question to the user):

- **R1. Concurrency's open status is over-claimed.**
  "Not yet specified" says "the stance is not one answer but a frontier"
  (`map L730–734`), while the stance *is* answered, plank by plank
  (`map L226–250`, `L351–359`; Q L35–48 "Answered — 2026-10-27"). The
  declaration bullet carries no reconciliation pointer (`map L216–221` —
  contrast the bootstrapping pair's "(reconciled …)" at `map L687–691`).
  What genuinely remains open is only the *future* stance (`map L247–250`,
  `L357–359`; Q L46–48) plus spec-detail mechanics.
- **R2. Primary agents are listed open after being settled.**
  "Not yet specified" (`map L735–738`) and "Primary agents: declared open"
  (`map L457–461`, unpointed) stand beside "Primary agents: settled"
  (`map L259–263`, 2026-10-27, user) and the tracker's answer (Q L114–117).
  The pour-complete bullet itself lists "primary agents" among open
  deferrals (`map L266`) — contradicting the settlement five lines above it.
- **R3. GitHub integration is listed as open mechanics while every listed
  mechanic is settled.** The N-y-s entry names "the commit's unit … the
  push cadence, offline behavior, auth (gh as the vehicle), and the branch
  discipline" as open (`map L739–744`); each is settled on the same page
  (`map L222–225`, `L232–237`, `L246–250`, `L269–279`) and answered in the
  tracker (Q L132–140). The declared bullet (`map L462–466`) is unpointed.
  Only the residual the tracker names — the monorepo changelog-tooling
  tension via the deviations rule (Q L139–140) — survives, and the map
  doesn't say so.
- **R4. The change cloud is "awaiting the user's last pour" after the pour
  is recorded complete.** N-y-s (`map L762–766`) vs "The pour is complete:
  settled" (`map L264–268`) and Q L643–646.
- **R5. The engine-instance question is deferred "not yet put to the user"
  after being put and answered.** Deferred list (`map L777–780`) vs plank
  four, one engine per machine per checkout (`map L226–231`; Q L40–41).
- **R6. The two-flows narration still promises a plural entry-point class.**
  "any session that produces a valid entry-point document" (`map L692–698`)
  vs the one-door settlement, plan only (`map L178–181`; Q L477–480). The
  older narration is unamended; a spec-writer enumerating accepted kinds
  gets two different enumerations (the fog-audit's C6, still live).
- **R7. "Wayfinding is the ungated entry" (`map L719`) reads against "the
  plan gate — fully settled" (`map L80–85`) and failure routing "applies at
  every stage, the plan included" (`map L587–588`).** Resolvable on the
  record — "ungated" is the session/entry act, the plan still passes its
  own gate (criteria exception, `map L611–613`) — but the wording leaves
  the chain's first link ambiguous to a reader. Low severity; wording fix.
- **R8. Two sidebar-source rulings coexist without a pointer.**
  "read from the records, never hand-written" (`map L163–167`) vs
  "Sidebar truth": "a live, engine-maintained current-work report, not a
  reading of half-written records" (`map L330–335`). Reconcileable (the
  later ruling refines the display source and keeps the ledger as recovery
  truth) but unpointed, unlike the map's own reconciled-pair pattern.
- **R9. Declared bullets for Project kinds and Knowledge management carry
  no pointer to their settlements.** "very foggy and must be investigated
  thoroughly" (`map L468–474`), "needs a deep dive" (`map L475–486`) vs the
  settled shapes (`map L360–374`, `L446–456`; Q L162–167, L192–204). Low
  severity — the N-y-s entries for both were already corrected — but the
  same staleness class as R1–R3.
- **R10. The bootstrap residual-ask whitelist exists only in the tracker**
  (Q L458–459); the map names the routing (`map L115–120`) and the gh item
  (`map L269–274`) but not the list. Carried-with direction recorded; a
  carry-through gap, not an invention-worthy hole.

**Design defects** (no recorded direction; a spec section must invent —
see §4 for the questions):

- **D1. Engine stop/park/off-switch** — absent from every record (see §1).
- **D2. Plan-gate repair actor and the "interpreter"/"recorder" seats** —
  the roles are named, seated nowhere in [The system] (see §1).
- D3–D6 (soft, listed in §4): engine read scope; the "inbox" name
  collision; the self-report's destination/schema; the domain-modeling
  skill's carrier.

---

## 4. Criterion 4 — The gaps a spec-writer would hit

**Hard gaps (a spec section invents here):**

- **D1 — the "Engine lifecycle" section.** The spec must state start,
  watch, and stop semantics. Start is fully ruled (`map L97–102`, `L336–343`);
  watch is fully ruled (`map L185–188`, planks); **stop is nowhere** —
  not settled, not parked as spec detail, not deferred, not tracked
  (`map L777–780`'s deferred list omits it; no QUESTIONS entry touches it).
  The only records even adjacent are bootstrap-exclusivity pauses
  (`map L251–254`). A spec-writer writing "how the engine stops" is
  deciding: park command? un-bootstrap? uninstall-only? Does bootstrap's
  consent moment state the always-awake processing before it starts?
  All inventions. (The research-side echo is the remaining-blindspots
  backlog, §1/Q4 — raised, never asked.)
- **D2 — the "Review gate — the plan stage's rectification" section.** The
  plan gate's criteria, routing, dead-end, and amendment paths are ruled,
  but the repair actor isn't. The fixer ruling binds the builder to "its
  own FAILed piece" (`map L150–154`); the plan is an outside,
  user-confirmed document (`map L108–114`, `L178–181`, `L310–315`); yet
  "reviewed plans" are named as *inside* products of the engine's embedded
  agents (`map L109–110`) and "a FAIL repairs normally" (`map L82`). The
  roles of interpreter ("for both layers", `map L205–215`) and recorder
  (`map L208`) are settled in semantics but seated in no component: the
  roster is six helpers plus the interactive primary (`map L259–263`), and
  none of the seven is the triager/repairer for the one stage the builder
  doesn't build. A spec-writer must seat them somehow — that seat is a
  decision.

**Soft gaps (direction mostly recorded; the spec must fill in, but only
within ruled bounds — flagged so the spec-writer watches for them):**

- **D3 — engine read scope.** The forbidden list constrains touching,
  history, branches, secrets, and network (`map L316–321`) — never reading;
  store reads are context-filtered (`map L368–374`) but nothing scopes what
  enters an engine-spawned session's context outside the stores.
- **D4 — the "inbox" naming collision** with OpenCode's session inbox: the
  map flags it in ground research (`map L56`) but no decision confronts it;
  the spec must name the screen.
- **D5 — the self-report's destination and schema.** Consent and payload
  class are settled (`map L291–296`, `L576–580`) and flood-control coalescing
  is spec detail, but the defect entry's destination and shape aren't in
  the parked sums (`map L280–284`).
- **D6 — domain-modeling's carrier.** The survivors claim ("every skill
  and command now has a fate", `map L92–93`) holds for every item except
  this one: the discipline's owner is settled (the caregiver,
  `map L446–456`; Q L192–204) but the skill item itself is never named.
  The function-necessity and role-shaped-context rules (`map L487–494`,
  `L542–549`) delegate carrier assignment to spec time — arguably parking
  it — but those rules enumerate five crafts, not domain-modeling.

---

## The one question

Both hard gaps force an invention, but D1 is the pure one: zero recorded
direction, never asked. If the gate allows one question:

> **How does the user stop the engine?** Is there an off-switch — a command
> or ruling that parks the engine without uninstalling the plugin or
> unbootstrapping the repository — and if so, what happens to the in-flight
> chain and queued work; and should bootstrap's synchronous moment include
> the consent statement for the always-awake processing before the engine
> starts?

(D2's question, for the record: "Who repairs a plan that FAILs its gate
when the repair needs no user answer — the builder, a fresh orchestrator
session, or a repair role seating the interpreter/recorder?")

---

## Grades

| Criterion | Grade |
| --- | --- |
| 1. Specifiability | FAIL — the six named sums are parked correctly; engine stop semantics (D1) and plan-gate repair seating (D2) are silently missing |
| 2. Fidelity | PASS — settled decisions match tracker answers; one under-carried list (R10) |
| 3. Contradictions | FAIL — representation defects R1–R9 need recorder fixes; design defects D1–D2 need the user |
| 4. Gaps | FAIL — two spec sections (engine lifecycle; plan-gate rectification) require invention, D1 and D2 |

VERDICT: FAIL