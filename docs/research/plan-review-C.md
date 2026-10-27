# Plan review C — the safety skeptic's pass on plugin-transition.md

**Reviewer:** C (safety skeptic — trust boundaries and failure paths)
**Plan under review:** `plans/plugin-transition.md` (as read 2026-10-27)
**Criteria sources:** `tracker/QUESTIONS.md`; `docs/research/concurrency-blindspots.md`
(`cb`), `docs/research/remaining-blindspots.md` (`rb`), `docs/research/fog-audit.md`
(`fa`), `docs/research/opencode-engine-mechanics.md` (`em`).
**Citation keys:** `map L#` = plans/plugin-transition.md; `Q L#` = tracker/QUESTIONS.md.

## 1. Trust boundaries

### Closed, with citations

- **The leash + clearance.** `map L185–193` (touches only work it made itself and
  files an agent has cleared; running the tool is the clearance act) is coherent
  with the boundary's one door (`map L178–181`: the plan alone enters) and with
  the confirmation artifact (`map L310–315`: the user's confirmation is recorded
  as a dated marker inside the plan file; the tool validates it — no marker, loud
  rejection; a dead tool run loses nothing). This closes `fa` C4/U-clearance and
  `rb` §2 "confirmed-but-never-cleared."
- **The forbidden list.** `map L316–321` closes `rb` Q1: never force-push/rebase/
  reset history, never delete branches or self-merge, never touch files outside
  the records and its ticket-named files, never copy secrets not handed to it,
  never run network commands beyond its own pushes and self-reports.
- **Absorb-or-alarm (engine-vs-user file discipline).** `map L238–245` closes
  `rb` Q12 and `cb` Q6: every user edit met in working files is checked against
  records/glossary/criteria; accountable edits are absorbed and re-derived on
  top of; unaccountable edits raise through the inbox and the engine never builds
  on or commits around them until the user answers. Coherent with plank four,
  which names this same pairing as the cross-lane reconciliation mechanism
  (`map L226–231`).
- **Consent-gated self-reports.** `map L291–296` closes `rb` §4's privacy gap:
  consent at the moment of sending, declining always available, payload is the
  failing piece's brief and report — typed records only, no inbox prose, no
  secrets; repeated failures coalesce (flood direction ruled, mechanics parked).
  Combined with the gh vehicle and never-store-credentials ruling (`map L269–274`)
  and the exception transport (`map L576–580`), the channel is consent-bounded.
- **Crash mid-push.** `map L232–237` + `map L275–279`: the records are the
  ledger; local commits are the safety; unpushed commits retry on the next pass
  with a pull first; nothing is ever force-pushed; there is no separate engine
  state store. This is the ruling that replaces zeroshot's rejected ledger
  (`cb` §2 mid-push; `fa` U-exactly-once) — the guard is now named, the exact
  forms are spec detail (`map L280–284`).
- **Cleared-file race.** The tool validates the in-file confirmation marker
  (`map L310–315`); post-clearance user edits fall under absorb-or-alarm
  (`map L238–245`); "nothing writes at once" — the serial order (`map L326–329`)
  plus plank two's exclusive step (`map L351–354`) rule the reports-pile write
  protocol that `cb` §1 flagged as missing.
- **Two-checkout dogfooding.** `map L297–302` closes `rb` §5/Q22: the engine
  develops girth-agents from a separate installed copy, and its commits reach the
  install only at the next deliberate plugin update. Coherent with plank four
  (`map L226–231`) and startedness (`map L336–343`).

### Open paths — design defects

- **D1. No off-switch; no consent moment for continuous processing.**
  The start switch exists (`map L97–103`, L336–343: `/bootstrap` activates the
  engine) and has no off-switch counterpart anywhere on the map — the only
  "consent" ruling is the self-report consent (`map L291–296`), and the only
  pause is re-bootstrap exclusivity (`map L251–254`). `rb L94–102` named this
  exact gap ("Consent to continuous processing is unasked… no 'stop the engine'
  ruling at all") and `rb` Q4 (L468–472) asks for it. After the 2026-10-27 round
  of rulings touched startedness, bootstrap, and dogfooding, the question is
  still unanswered, unparked, and has no tracker home — QUESTIONS.md carries no
  entry for it. The user cannot stop the always-awake engine's continuous
  reading and processing of their repository short of uninstalling the plugin.
  Trust boundary unclosed.
- **D2. The engine-spawned sessions' permission ruleset is unassigned.**
  The plugin can set a `permissions` ruleset at session creation, and child
  sessions otherwise inherit the rules in effect at creation (`em L82–84`,
  L283); `ask`-resolving rules headless have no one to answer them (`em L177–183`).
  The map assigns no ruleset to the builder, reviewer, or helper sessions, and
  never says what a headless `ask` does (`rb L55–64`, Q2 L462–466). The forbidden
  list (`map L316–321`) bounds verbs, not the sessions' permission envelope —
  behavior is ruled, authority is not. This also falsifies the unassigned-sums
  ruling's claim that "every direction is decided" (`map L280–284`).
- **D3 (residual). The push-retry loop's end under remote divergence is
  unstated.** Plank four pairs pull-first with absorb-or-alarm (`map L229`), the
  forbidden list forbids merging on its own (`map L318`), and plank three repeats
  pull-before-push, never self-merge (`map L246–250`). A pull that cannot
  fast-forward (diverged remote, same-file conflict) has no named terminal
  state: termination exists only by the unstated inference that pulled-in or
  conflict-marker edits count as "user edits it meets" and route to
  absorb-or-alarm → inbox → user ruling. `cb` Q7 (L303–307) asked for the retry
  and reconciliation policy; the direction is arguably ruled, the loop's end is
  not named. The spec must pin which pull strategy runs and where the conflict
  state lands.

## 2. Failure paths

### Terminated

- **The review loop.** Cap + per-step time limit enforced in code (`map L600–603`);
  exhaustion is the exception, a loud observable failure that self-reports
  (`map L197–204`) — closes `fa` G2.
- **The evade path.** Failure routing (`map L581–588`): a failure only the user
  can rectify must reach them; one they cannot help rectify never inboxes them.
- **Unanswered states' homes.** Questions and hazards are tracker kinds
  (`map L663–667`); inbox messages are referenced never copied (`map L168–177`);
  lessons have the store with verify/stratify/vanish rules (`map L375–392`);
  abandoned sessions are inert, nothing expires, nothing re-asks
  (`map L285–290`).
- **Plan defects discovered downstream.** The direction-change path (amend →
  new revision through the same review; abort closes the workstream; re-answer
  reopens the question) (`map L303–309`) plus failure routing applying "at every
  stage, the plan included" (`map L581–588`) close `fa` G1/C1.
- **Crash mid-stage.** The crash contract (`map L232–237`) rebuilds from
  committed records and their states alone; the report/stamp double-write
  (`map L604–607`) is reconciled by the same contract and by the sidebar's live
  engine-maintained report (`map L330–335`) — closes `cb` §2's
  mid-report-write finding.

### Open

- **D3** above: the push-retry loop under permanent divergence has no named end.
- (Minor) Double-open inbox item and post-reply speech (`rb` Q10, L142–153)
  terminate only by inference through the serial order (`map L326–329`) and the
  re-answering path (`map L303–309`); the plan never states the claim or the
  second-resolution rule.

## 3. Fidelity

**No inversions found.** The map matches the tracker's rulings on every settled
thread cross-checked: concurrency planks (`Q L35–48`), primary agents
(`Q L114–117`), GitHub integration (`Q L132–140`), the pour (`Q L643–646`),
scaffold migration's deferral (`Q L9–20`), recall layer (`Q L89–100`), project
kinds (`Q L162–169`), knowledge management (`Q L192–204`).

**Representation defects** (recorder fixes per the map's own incident rule
`map L20–29`, same disease as the survey inconsistency it names at
`map L64–70`):

- **R1.** "Primary agents: declared open" (`map L457–461`) coexists with
  "Primary agents: settled" (`map L259–263`) in the same Decisions list — a
  stale entry with no superseded marker, precisely the defect the Notes demand
  be folded in for survey 0003.
- **R2.** Four "Not yet specified" entries read open after Decisions settled
  them: Concurrency ("the stance is not one answer but a frontier",
  `map L730–733` — vs settled planks `map L226–231`, L246–250, L351–359);
  Primary agents (`map L735–738`); GitHub integration (`map L739–744` — vs
  settled `map L222–225`, L269–274, L275–279); the change cloud ("awaiting the
  user's last pour… 11 skills and 6 commands with no decision on record",
  `map L762–766` — vs "The pour is complete" `map L264–268` and "every skill
  and command now has a fate" `map L92–93`).
- **R3.** The pour-complete ruling (`map L264–268`) lists "primary agents" as a
  deliberate deferral — stale the moment `map L259–263` settled it.
- **R4.** "Deferred by design" (`map L777–780`) still says the engine-instance
  question was "not yet put to the user" after plank four (`map L226–231`)
  rules one engine per machine, per checkout.

All four are representation defects (stale entries, missing superseded
markers), not design defects — but they must be folded before the spec, because
a spec-writer reading the map today is told both that primary agents are open
and that they are settled.

## 4. Parked threads — honesty check

Parked honestly: scaffold-migration details ("the migration rules' details
remain the circle-back", `map L344–350`, matching `Q L9–20`); the future
concurrency stance ("named, not designed", planks); the spec-time keystones
("verified before building, not open decisions", `map L767–771`, with the
do-not-build warning at `map L58–63`); the spec details ("the spec pins the
shapes", `map L280–284`, L772–776); the shelved handoff//retro/wizard items
(`map L621–625`, L528–531).

Not parked at all, and not answered — the honest-parking list is incomplete:
**D1** (off-switch/consent, `rb` Q4) and **D2** (session permission ruleset,
`rb` Q2) appear in no deferral list and in no tracker question; they are simply
absent from the map while the unassigned-sums ruling claims every direction is
decided. Minor unassigned sums also never listed: the defect entry's schema and
recipient path (`rb` §6.11), the new vocabulary's migration owner (`rb` §6.16),
the inbox name-collision decision (`fa` D-inbox/O6), and the receiver of
"rejected loudly" (`fa` G7).

## Classification summary

| # | Finding | Class |
|---|---------|-------|
| D1 | No off-switch; no consent moment for continuous processing | design defect — unclosed trust boundary |
| D2 | Engine-spawned session permission ruleset unassigned | design defect — unclosed trust boundary |
| D3 | Push-retry loop's end under remote divergence unstated | design residual — failure path end unnamed |
| R1–R4 | Stale entries: duplicate primary-agents decision; four stale "Not yet specified" entries; stale deferral lists | representation defects |
| — | Defect schema, vocabulary migration, inbox name collision, rejection receiver | unassigned sums (completeness) |

The six named boundaries (leash, forbidden list, absorb-or-alarm, consent-gated
self-reports, engine-vs-user discipline, dogfooding separation) close coherently,
and the three named hazards (crash mid-push, cleared-file race, self-report prose
leak) are each terminated by an explicit ruling. But the strict discipline is
PASS only if every trust boundary closes and every failure path terminates: the
always-awake engine can be started and never stopped, with no recorded consent
moment (D1); its dispatched sessions have no assigned permission envelope (D2);
and the push-retry loop's end under divergence is not named (D3). These are the
open paths the plan must close before the spec.

VERDICT: FAIL
