# Plan review C, round 2 — the safety skeptic's re-read of the rectified plan

**Reviewer:** C (safety skeptic — trust boundaries and failure paths)
**Plan under review:** `plans/plugin-transition.md` (as read 2026-10-27, post-rectification)
**Round:** re-review of the six findings that FAILed round 1 (`plan-review-A/B/C.md`)
**Criteria sources:** `tracker/QUESTIONS.md`; `docs/research/remaining-blindspots.md`
(`rb`), `docs/research/concurrency-blindspots.md` (`cb`), `docs/research/fog-audit.md`
(`fa`), `docs/research/opencode-engine-mechanics.md` (`em`).
**Citation keys:** `map L#` = plans/plugin-transition.md; `Q L#` = tracker/QUESTIONS.md.

The gate: PASS only if every trust boundary closes and every failure path
terminates. This round verifies that the six rectifications close the six
paths that FAILed round 1, then re-verifies the whole boundary set for
anything the rectifications themselves opened.

---

## 1. The six rectifications, verified

### R1. Off-switch and consent moment — `map L284–288`

What it had to close (`rb` Q4; round-1 D1): the always-awake engine read the
repository continuously, with no recorded consent and no way to stop it short
of uninstalling the plugin.

The ruling: bootstrap states plainly what always-awake processing means
before it starts (the consent moment); a park command stops the engine on
that project, leaves the records in place, and is resumable by re-running
bootstrap; "the engine then stops reading that repository until restarted."

Path check:

- **The halt is real and stated:** "stops reading that repository until
  restarted" terminates the reading/disclosure path verbatim. Consistent
  with startedness being per-directory activation (`map L369–376`): park is
  the symmetric de-activation, so the plugin-level runtime does not keep
  watching a parked project.
- **The consent moment is at the user's presence:** bootstrap is synchronous
  (`map L115–120`), so the statement is delivered to a present user before
  activation — the consent is asked, not assumed. Running `/bootstrap` after
  hearing it is the acceptance.
- **Mid-step park has a terminal:** the crash contract (`map L233–238`) makes
  the committed records the ledger and rules that a restarted engine rebuilds
  from them alone. A park mid-step is therefore a voluntary crash: nothing
  dangling, everything reconstruable. Uncommitted working-tree state is
  re-derived on restart — the direction covers the path; the exact park
  semantics (wait-for-step like re-bootstrap, or immediate stop) are spec
  detail.

**Closed.** Residual naming for the recorder, not a gap: the park command's
form and the parked-state marker belong in the deferred spec sums
(`map L801–809`); the startedness marker that must now also carry "parked"
is already an unassigned sum (`rb` Q5/§6.9), and adding a third state to it
is direction-faithful, not an invention.

### R2. Per-helper permission rulesets + dispatch-time check — `map L275–283`

What it had to close (round-1 D2; `rb` Q2): engine-spawned sessions had no
assigned permission envelope, `ask`-resolving rules had no one to answer
them headless, and the forbidden list bounded verbs only.

The ruling: each helper carries its own tailored permission ruleset, exactly
as its configuration, toolset, and skills are tailored; the forbidden list
is the engine's floor and each helper's set builds inside it; a helper is
never dispatched without the permissions its job needs — the orchestrator
matches the job's requirements against the helper's set before dispatch,
and a mismatch fails loudly there, a system defect to fix, never a
mid-operation permission request reaching the user. "The janitor never
emails the CFO."

Path check — all three demanded terminations are verbatim:

- **No helper spins up under-provisioned:** "never dispatched without the
  permissions its job needs … matches the job's requirements against the
  helper's set before dispatch."
- **No headless prompt can dangle:** a headless `ask` (the `em L177–183`
  hazard) is structurally impossible — the ruleset is complete for the job
  before the session exists, and "never a mid-operation permission request
  reaching the user" rules out the deferred-grant path (`em`'s inheritance
  trap) entirely.
- **Mismatch fails loudly:** stated, at dispatch, as a system defect.

The emergent case (a permission need that could not have been anticipated at
dispatch) terminates through already-ruled machinery: the job's requirements
were under-declared — a system defect, not a user question — and the helper
built to fail openly reports inability rather than prompting or fabricating
(`map L182–184`), which lands in failure routing (`map L614–621`). The
mechanics of the dispatch-time check are honestly parked in the deferred
spec sums (`map L801–809`). Consistent with role-shaped context
(`map L575–582`): the ruleset is tailored exactly as the context, toolset,
and skills are.

**Closed.**

### R3. The plan's repair chair — `map L269–274`

What it had to close (round-1 D2 in review B): the plan gate's criteria,
routing, and dead-end paths were ruled, but the actor who repairs a FAILed
plan was seated nowhere — the one stage the builder doesn't build had a
FAIL with no "normally" to attach to.

The ruling: the interactive session itself — the agent repairs the FAILed
plan with the user, continuing the very conversation the plan came from.
This is why the plan's review runs before its confirmation: a FAIL still has
a live session to land in, and only a reviewed-and-confirmed plan enters the
engine.

Path check:

- **No orphaned FAIL:** review precedes confirmation, so every FAIL arises
  while the originating session is live; the repair lands in it. The
  session's agent performs representation-class repairs without the user and
  asks in-session for anything needing the user's answer.
- **Dead-session path terminates:** if the session dies before confirmation,
  the abandoned-sessions ruling (`map L318–323`) makes it inert — no entry
  point, touches nothing, nothing expires or re-asks. A FAILed plan whose
  session died is a frozen document, not a dangling obligation; the user can
  resume the session or start over.
- **The enters-the-engine predicate is ruled:** "only a reviewed-and-confirmed
  plan enters the engine." The confirmation artifact (`map L343–348`) gives
  the door its marker check; the conjunction with the reviewed-PASS state is
  direction — the spec pins the tool validating both halves as one
  acceptance predicate (see §3, N4).

One pointer-worthy staleness: the plan-gate note (`map L80–85`) still says
"a FAIL repairs normally with the inbox entering exactly when rectification
requires the user's answer." That note predates this ruling; with the live
session seated as the chair, the plan-stage repair asks in-session, and the
abandoned case is inert, not inboxed. The note needs a pointer to the
repair-chair ruling so a spec-writer doesn't write an inbox re-ask path for
plan FAILs. Classification: representation (superseded note, no marker),
never a design question.

**Closed.**

### R4. Push-conflict terminal — `map L264–268`

What it had to close (round-1 D3; `cb` Q7): under non-fast-forward
divergence the retry loop had no named end — pull-first existed, never-merge
existed, but the wall the loop hits had no terminal.

The ruling: on non-fast-forward divergence the engine never merges: it
holds its commits, leaves the working tree alone, and raises through the
inbox (the reconciliation is the user's authority); everything waits intact
until answered.

Path check:

- **End of the loop, named:** pull → non-fast-forward → hold commits, tree
  untouched → inbox message (by reference to the tracker per the two-jobs
  ruling, `map L168–177`) → user's authority decides → reply returns through
  the inbox → retry with pull-first. Every leg of that loop exists on the map.
- **Nothing lost while it waits:** "holds its commits" + "everything waits
  intact until answered" — consistent with the offline-push ruling
  (`map L308–312`, held locally, retried) and the ledger's safety
  (`map L233–238`). No force-push, no self-merge (forbidden list,
  `map L349–354`; plank three, `map L247–250`). Consistency with plank
  four's cross-lane absorb-or-alarm (`map L227–231`) holds: the divergence
  path is now the explicit terminal where the machines' reconciliation
  needs an authority.
- **Answered state has a home:** the reply lands on the tracker question as
  its resolution (`map L168–177`), which the engine picks up; if the user
  never answers, the abandoned-sessions / nothing-expires rules keep it a
  parked, visible wait — a home, not a hang.

**Closed.** (The pull strategy's exact mechanics remain specable within this
direction; the terminal itself is now decided.)

### R5. `domain-modeling`'s fate — `map L260–263`

What it had to close (round-1 K1/D6): the one catalog item with no recorded
fate, which falsified "every skill and command now has a fate" and forced
the spec-writer to invent or re-ask.

The ruling: the skill survives, re-fit — the engine-side discipline lives
in the caregiver; the interactive side keeps its function, guiding the user
through term-work when judging proposals and ruling meanings.

Path check:

- **No un-fated item remains:** the skill is named, kept, and both of its
  halves have recorded owners. The caregiver side matches the vocabulary-
  caregiver ruling (`map L479–489`) and the knowledge-management answer
  (`Q L192–204`); the interactive side matches the glossary-proposals ruling
  (`map L468–478`), where the user confirms or crafts definitions — the
  judgment work the skill guides.
- **The falsified claims are now true:** "every skill and command now has a
  fate; the sweep complete" (`map L92–93`) and "The pour is complete"
  (`map L298–301`) hold against the record.
- No contradiction with "The function is the necessity" (`map L520–527`):
  the re-fit is exactly a carrier assignment serving the function under the
  two-layer split.

**Closed.**

### R6. The "inbox" name — `map L256–259`

What it had to close (round-1 K2/D4): the collision with OpenCode's own
per-session inbox (the agent-prompt-queue) was flagged by research but never
confronted — the spec had to name the screen with no decided ground.

The ruling: the name is kept, with a glossary entry in girth-agents' own
GLOSSARY.md defining it as the user's inbox as designed in this plugin, in
contrast to OpenCode's inventory of agent-prompt-queues of the same name.

Path check:

- **The collision is decided, not flagged:** the research demand ("the spec
  should confront this naming decision explicitly", `tui` L73) is met — a
  decision with a recorded contrast, so the spec names the screen against a
  ruled entry and a spec-writer invents nothing.
- Consistent with the settled substance of the thing being named: the
  two-jobs ruling (`map L168–177`) and the inbox's own record keep the
  semantic distinctness the glossary entry now states.
- The glossary entry lives in the plugin's own defining records (the repo's
  GLOSSARY.md); how the contrast text ships into user-facing docs is
  follow-through at spec time, not a decision.

**Closed.**

The six open paths from round 1 are closed. Each rectification is dated
2026-10-27, attributed to the user, and consistent with every neighboring
ruling it touches.

---

## 2. Re-verification: boundaries, loops, homes

### Trust boundaries — all coherent, all closed

| Boundary | Status |
| --- | --- |
| Leash + clearance-by-run (`map L185–193`) | closed (unchanged) |
| One door, plan-only (`map L178–181`) + confirmation marker (`map L343–348`) | closed; the reviewed-state half of the acceptance predicate is ruled, mechanics spec-pinned (N4) |
| Forbidden list (`map L349–354`) | closed (unchanged) |
| Absorb-or-alarm (`map L239–246`) | closed; now also seated as the cross-machine reconciliation beside the push-conflict terminal (`map L227–231`) |
| Consent-gated self-reports (`map L324–329`) | closed (unchanged) |
| Crash contract — records as ledger (`map L233–238`) | closed |
| Off-switch + consent moment (`map L284–288`) | closed by R1 |
| Session permission envelopes (`map L275–283`) | closed by R2 — complements the forbidden list: behavior was bounded, now authority is too |
| Dogfooding two-checkout separation (`map L330–335`) | closed (unchanged) |

No boundary the rectifications touched is contradicted by another: the
permission floor (forbidden list) and the helper ceilings nest; park is the
symmetric counterpart of per-directory activation; the repair chair composes
with one-door and abandoned-sessions.

### Loops with ends

- Review loop: cap + limit in code; exhaustion → the exception, loud, stamped
  and self-reported (`map L198–205`).
- Fix-rounds: builder repairs its own FAILs (`map L150–154`).
- Push retry: offline → hold + retry (`map L308–312`); divergence → hold +
  inbox (R4). Both loops now end at a named terminal.
- Recall loop: verify → stratify → vanish, with the blocking case routed to
  the question machinery (`map L417–421`).

### Unanswered states have homes

Questions/hazards/lessons/proposals are tracker kinds with owners
(`map L408–425`, `L463–467`, `L501–519`); inbox items never expire but stay
visible (`map L318–323`); half-built plans are inert outside the boundary
(`map L318–323`); lesson claims unverifiable vanish or become questions
(`map L417–421`); plan defects discovered downstream ride the
direction-change path (amend → new revision through review; abort closes;
re-answer reopens, `map L336–342`). Re-answered resolutions supersede
(`map L336–342`), which also gives the double-open / post-reply-speech edge
(`rb` Q10) its decided direction — the inbox open-claim and second-resolution
protocol remain a pinned spec sum, not an open question.

### Parked threads, honestly

Shelf (handoff, `/retro`, wizard, `map L121–123`, `L561–564`, `L810–813`);
scaffold-migration mechanics found, rules-details the circle-back
(`map L377–383`); keystones labeled unverified with the do-not-build warning
(`map L58–63`, `L796–800`); spec-detail sums parked with decided directions
(`map L313–317`, `L801–809`); future concurrency stance and multi-machine
arbitration named-not-designed (`map L226–231`, `L388–392`, `L810–813`).
The off-switch and the permissions check, which round 1 found absent from
every deferral list, are now settled rulings and (for their mechanics)
named in the spec sums (`map L801–809` carries the dispatch-time check).

---

## 3. New and remaining findings, classified

### Representation defects (recorder repairs — never user questions)

- **R-round2-1 — MEDIUM.** The plan's own review bullet (`map L763–769`)
  still narrates the six findings as "re-open the frontier … Nothing here is
  settled until that round closes." The six are now settled in the same
  document (`map L256–288`). Fair reading: the settlements' finality awaits
  this round's verdicts, so the note is a status marker; but on round close
  the recorder must rewrite it to record FAIL → six rectifications → round-2
  verdict, or a spec-writer copies "nothing settled" into the spec.
- **R-round2-2 — LOW.** The plan-gate note's "the inbox entering" for plan
  repair (`map L80–85`) is superseded by the repair-chair ruling (R3); needs
  a pointer, per the map's own reconciled-pair pattern.
- **R-round2-3 — LOW.** The two-flows narration still promises a plural
  entry-point class ("any session that produces a valid entry-point
  document", `map L725–731`) against the one-door settlement (`map L178–181`;
  `Q L477–480`).
- **R-round2-4 — LOW.** "Wayfinding is the ungated entry" (`map L748–751`)
  still reads against the plan-gate and failure-routing rulings; resolvable,
  wording only.
- **R-round2-5 — LOW.** `/slice` survives with no layer label (`map L664–666`)
  while its sibling doors carry explicit splits.
- **R-round2-6 — LOW.** The two sidebar-source rulings (`map L163–167` vs
  `map L363–368`) coexist without a pointer.
- **R-round2-7 — LOW.** The "declared" bullets for Project kinds
  (`map L501–507`) and Knowledge management (`map L508–519`) are unpointed
  to their settlements; the npm-facts line (`map L42–45`) and the
  gh-credentials elaboration (`map L302–307`) carry the same record-only
  caveats noted in review A.

None of these opens a boundary or leaves a path unterminated; all are the
fold-in-before-spec class the plan's own incident rule (`map L15–29`)
assigns to the recorder.

### Spec-detail sums to pin (direction decided; spec names the shape)

- **N1.** The park command's form, and the startedness marker carrying
  "parked" (extends the `rb` Q5/§6.9 sum).
- **N2.** The consent moment's wording in bootstrap.
- **N3.** The plan-stage review's mechanical seat — decidable from the
  record: chat-as-source (`map L622–626`) and the leash (`map L185–193`)
  jointly imply session-side review, since an engine-side checker touching
  an un-cleared plan would leak the boundary.
- **N4.** The door's acceptance predicate as one conjunction — confirmation
  marker AND reviewed-PASS — so a FAILed-but-marked plan cannot pass the
  tool (`map L269–274` direction; `map L343–348` mechanics).
- **N5.** Inbox open-claim and second-resolution protocol (`rb` Q10 — the
  serial order and re-answer rulings give the direction).
- **N6.** Plan-queue conflict semantics (`rb` Q15): serial execution in
  received order is ruled (`map L388–392`); cross-plan contradiction
  surfaces in downstream review against records, and the spec pins what a
  new plan colliding with an older plan's produced records does — direction
  exists (review-against-records), edge semantics don't.

All six are same-class as the sums already parked (`map L313–317`,
`L801–809`); none is a question for the user.

---

## Classification summary

| # | Item | Class |
| --- | --- | --- |
| R1–R6 | The six round-1 findings — off-switch/consent, permission envelopes, repair chair, push-conflict terminal, `domain-modeling` fate, "inbox" name | closed by rectification — verified above |
| R-round2-1..7 | Review-bullet status note, plan-gate-note pointer, plural-entry narration, "ungated entry", `/slice` label, sidebar pair, unpointed declared bullets / npm facts / gh elaboration | representation — recorder folds before spec |
| N1–N6 | Park form/marker state, consent wording, plan-stage review seat, door predicate, inbox claim, plan-queue semantics | decided direction; spec pins the shape — future sums, not open questions |

Every trust boundary closes and every failure path terminates. The six
rectifications close the six paths that FAILed round 1, each verifiable
against the map's own rulings without inference alone. What remains is
recorder-class fold-in (representation) and direction-decided mechanics for
the spec stage — neither class reopens a question for the user nor forces a
spec-writer to invent.

VERDICT: PASS