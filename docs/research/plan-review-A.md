# Plan review A — `plans/plugin-transition.md` (2026-10-27 read)

**Reviewer:** A. **Criteria source:** `tracker/QUESTIONS.md` (every entry's
rulings, notes, and answers are the user's words) and the notes in
`docs/research/` as grounded facts. All line citations are to the files as
read today. Citations: "map Ln" = `plans/plugin-transition.md`; "Q Ln" or
"Q <entry title>" = `tracker/QUESTIONS.md`; "survey", "coverage", "blind",
"fog", "blindspots", "tui", "em" = the matching notes in `docs/research/`.

Severity: HIGH / MEDIUM / LOW. Classification: **R** = representation
defect (the map's own wording; repaired by the recorder, never a question
to the user) — **D** = design defect (the plan re-opens a question for the
user, or leaves a destination item neither decided nor parked).

---

## 1. Fidelity — every settled decision matches the tracker

**Verified faithful (spot-checks against the user's record):**

- Concurrency planks map one-to-one onto the tracker's answered stance
  ("Concurrency — the engine's stance", Q L35–45 → "Answered"): plank one
  (map L355–359) = "serial within a project"; plank two (map L351–354) =
  "a step is exclusive — writers wait, watching never sleeps"; plank three
  (map L246–250) = "everything lands on the working branch (pull-first,
  never force, no self-merging)"; plank four (map L226–231) = "one engine
  per machine, per checkout"; startedness (map L336–343) = "local
  activation by bootstrap (which doubles as the schema gate)"; sidebar
  truth (map L330–335) = "the engine's own live report"; inbox serial
  order (map L326–329); user sessions outside the engine (map L322–325).
  No drift.
- Primary agents / orchestrator (map L255–263) match Q "Primary agents"
  Answered (Q L114–117: one interactive primary; the six helpers behind
  it; `build` and `plan` replaced); the "feature tracker" grounding is
  real (Q L534: "FEATURES.md's orchestrator-agent feature").
- GitHub mechanics (map L222–225, L269–274, L275–279) match Q
  "GitHub integration" Answered (Q L132–138), including gh-as-vehicle,
  optional bootstrap setup, decline consequence, failed pushes holding
  locally.
- Project kinds (map L360–374), knowledge management (map L435–456,
  L475–486), and the recall layer (map L375–418) match their Answered
  entries (Q L162–169, L192–204, L89–100) closely, including the
  caregiver's "fifth helper" and prove-it's "sixth helper" numbering.
- "The pour is complete" (map L264–267) matches Q "The change cloud"
  Answered (Q L643–645) almost verbatim.
- Keystones are honestly labeled unverified (map L58–63) and the labels
  are grounded: "no `add`" (em L202–204, L346); `ctx.storage` durability
  (em L273–275); event catalog / `session.idle` (em L114–115, L338–340);
  git-spec `./tui` auto-load (tui L96, L119); sidebar live-reactivity
  (tui L111, L121); `codemode` (em L170). ✓ honesty criterion holds here.
- The former "Escape menu" tracker inconsistency (fog C7) is already
  fixed: Q L400 now reads "command or the command palette".

**Fidelity findings:**

- **F1 — LOW, R (plus tracker-hygiene):** "GitHub credentials" (map
  L269–274) elaborates Q L136–138 with "the engine never stores
  separately" and "recorded as a ruling like any declination". Plausible
  session substance, supported by nothing in the tracker; not an
  inversion, but record-only support is absent.
- **F2 — LOW, note:** the wizard shelf (map L528–531) supersedes the
  2026-10-22 wizard-redesign answers ("Wizard redesign — destination and
  scope", Q L723–735: "approved spec, full redesign"), which carry no
  superseded marker. The map itself records the newest user ruling
  faithfully, and its inconsistency list (map L64–70) names the 0003 /
  teaching / renames / channel cases but not these wizard entries.
  Tracker-hygiene gap, not a map defect.

## 2. Internal coherence — both layers honored; no same-layer conflict

**Layering verified:** the map labels its layers wherever the doctrine
demands it — "Destination — [Ours]" (map L5), "Checkpoints — [The
system]" (map L132), the two-layers ruling itself (map L570–575), and the
incident note (map L15–29, L205–215). The human-stops pair (plan =
chain's one human stop in [The system] vs the umbrella spec "approved
once" in [Ours]) is resolved as a cross-layer clarification, correctly
labeled, not inverted (map L86–88). ✓ The layer machinery works.

**Coherence findings:**

- **C1 — HIGH, R:** the "Not yet specified" tail restates the
  2026-10-26 world as current, contradicting the Decisions section in the
  same document — on the SAME layer ([The system] throughout). Pairs:
  - "Concurrency — open, being prepared now … fourteen questions … plus
    the 35-question backlog" (map L730–734) vs the four settled planks
    (map L226–231, L246–254, L351–359) and Q L35–45 Answered.
  - "Primary agents — … the replacement is expected to fall out …"
    (map L735–738) vs "The orchestrator: settled" / "Primary agents:
    settled" (map L255–263) and Q L114–117 Answered.
  - "GitHub integration — open mechanics: the commit's unit … offline
    behavior, auth, and the branch discipline" (map L739–744) vs the
    settled commit unit, credentials, offline pushes, branch placement,
    and forbidden list (map L222–225, L246–250, L269–279, L316–321) and
    Q L132–138 Answered.
  - "The change cloud — awaiting the user's last pour … 11 skills and 6
    commands with no decision on record" (map L762–766) vs "The pour is
    complete" (map L264–267) and the fates now on the map.
  - "whether the engine is one instance across started projects or per
    project … not yet put to the user" (map L777–780) vs plank four
    (map L226–231), the user's 2026-10-27 answer; the question *was* put.
  - Same-day self-supersession: the pour-complete entry still lists
    primary agents among open deferrals (map L266) that L255–263 settled.
  Classification: the questions are all answered (same document, tracker
  answered lines); nothing here needs the user — the tail is a stale
  summary, recorder repair. But it is the same-layer conflict shape the
  map's own doctrine says should FAIL correctly, so HIGH: a spec-writer
  copying the tail would resurrect settled fog into the umbrella spec.
- **C2 — MEDIUM, R:** "the four helpers" (map L768) contradicts the
  settled roster of six helpers (map L259–263; Q L114–117 "the six
  helpers"). Stale count from the fog-era four-type world (fog C5);
  recorder repair.
- **C3 — LOW, R:** "Session scope" says "the fixing agent keeps its
  session across fix-rounds" (map L194–196), implying a distinct fixer;
  the fixer ruling (map L150–154) says there is no separate type — the
  builder repairs its own FAILs. Reconcilable in intent, stale in wording
  (blind-read #5 still live on the map).
- **C4 — LOW/MEDIUM, R:** "/slice survives" (map L631–633) carries no
  layer label, while its sibling doors carry explicit splits — /implement
  "dies for its users" (map L557–560), /spec "dies for the system's
  users; [Ours]: our own /spec … is untouched" (map L561–565). Since
  slicing is an engine stage under [The system] and "building and slicing
  are the next effort" under [Ours] (map L10), the unlabeled survival
  reads as a user door in the wrong layer; per the map's own doctrine a
  cross-layer artifact → representation, fixed by labeling. The fog-audit
  C9 corollary (On_Chains "a command exists only where the act is the
  person's" vs the folded slice approval) remains unrecorded as a
  convention amendment on the map.
- **C5 — LOW, R:** "Facts the map leans on" ("package plugins publish to
  npm and install/update/check through `opencode plugin`", map L42–45)
  sits beside the no-package-store decision (map L638–641) written as if
  it described this plugin's live machinery (blind-read #4 unresolved).

## 3. Completeness for the destination

Yes on the big enumerated list: chain plan→reviewed plan→spec→tickets→work
(the plan gate note, map L80–85; "reviewed plans" named as downstream
products, map L108–114; the work check closing fog G3, map L566–569; the
exception closing fog G2, map L197–204); the engine (awake, leashed,
started-only, map L185–193, L336–343); six helpers and the one primary
(roster count checked); the inbox (screen, seeded sessions, own record,
two-jobs, map L120–123, L168–177, L648–655); tracker kinds (questions ×2,
hazards, term proposals, lessons); the concurrency stance (four planks);
GitHub integration (commit unit, credentials, offline, branch, forbidden
list); distribution (git channel, tag + GitHub Release, old transport
retired); testing (harness settled, map L141–145); project kinds and
knowledge management (settled on all open mechanics). 20 of 21 skills and
all 14 commands have explicit fates.

**Completeness findings:**

- **K1 — HIGH, D (design-frontier gap; the FAIL driver):** the
  `domain-modeling` skill has no recorded fate *anywhere* — not in the
  map, not in the tracker. The coverage matrix names it Untouched
  ("Who graduates the new vocabulary … into `GLOSSARY.md`?", coverage
  L36, L96–106), and the map's later rulings fated every other skill but
  this one. Q "Knowledge management" Answered (Q L192–204) moves the
  *discipline* to the caregiver and the *function* is discussed ("The
  function is the necessity", map L487–494; "Domain modeling is a largely
  front-loaded task", map L442–445) — but no ruling keeps, re-fits, or
  retires the skill itself, and nothing parks it. Against that gap stand
  two unsupported completeness claims: "every skill and command now has a
  fate; the sweep complete" (map L92–93) and "every item the user's
  test-driving surfaced is on the map and followed to an answer" (map
  L264–267, matching Q L643–645). The umbrella spec's skills enumeration
  cannot close from the map; either the spec-writer guesses (the design
  session forbids building on guesses) or the user is re-asked. ✓
  design-frontier item reopened.
- **K2 — MEDIUM, D (secondary design-frontier gap):** the "inbox" naming
  collision with OpenCode's own per-session inbox (`Session.Inbox.*`,
  delivery `steer|queue`) is flagged by the research as requiring an
  explicit confrontation ("The spec should confront this naming decision
  explicitly", tui L73, L115) and the map carries only the flag (map L57).
  No decision, no park, no glossary entry anywhere (fog D-inbox/O6 still
  open). Same class as K1; corroborates, does not drive.
- **K3 — LOW, R:** the tracker's kind-set enumeration ("the kind set gains
  it [the lesson kind] at implementation, alongside term proposals", map
  L379–383) never includes the "project-side system-defect record" that
  the exception's transport creates (map L576–580). The umbrella spec's
  tracker-kinds list will need that row; the map itself is silent.
- **K4 — LOW, D(observation), honesty:** two research-raised trust items
  have no map presence at all — no off-switch / park for the always-awake
  engine, and no permission-ruleset for engine-spawned sessions
  (blindspots §1, backlog 1–4). They were not among the prepared rounds
  put to the user (prepared C2 lists seven items, neither is in them), so
  they are neither decided nor parked. Spec-tier detail rather than
  plan-blocking; recorded for the umbrella spec's honesty ledger.

## 4. Honesty

- Keystones honestly unverified and correctly grounded (verified in §1).
- Parked threads properly parked: handoff/pickup, `/retro`, wizard pair
  (map L121–123, L528–531, L621–625, L777–780); scaffold-migration rules
  details remain "the circle-back" with the mechanism honestly split from
  the details (map L344–350). ✓
- Violation: the two sweep-complete claims (map L92–93, L264–267) present
  the item-level harvest as exhausted while `domain-modeling`'s fate is
  nowhere on the record (K1). Presenting-as-settled without record
  support is exactly what criterion 4 prohibits.

## Classification summary

| # | Finding | Class | Severity |
| --- | --- | --- | --- |
| K1 | `domain-modeling` skill fate unrecorded; sweep claims unsupported | D | HIGH |
| K2 | inbox naming collision: flagged, never decided or parked | D | MEDIUM |
| C1 | "Not yet specified" tail stale against Decisions (5 items) | R | HIGH |
| C2 | "the four helpers" vs the six-helper roster | R | MEDIUM |
| C4 | `/slice` survival unlabeled across layers | R | LOW/MEDIUM |
| F2, C3, C5, K3, F1 | wording/count/tracker-hygiene nits | R | LOW |

The design frontier is closed everywhere except K1 and K2. K1 is a
genuine question for the user (or an unfounded guess by the spec-maker):
what becomes of the `domain-modeling` skill? The verdict standard — PASS
only with no design defect at all — is not met.

VERDICT: FAIL