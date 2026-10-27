# Plan review A — re-review (round 2) of `plans/plugin-transition.md`

**Reviewer:** A. **Round:** re-review after the six round-1 findings were
rectified with the user (2026-10-27). **Criteria source:**
`tracker/QUESTIONS.md` (Q Ln) and `docs/research/`. **Target:**
`plans/plugin-transition.md` (map Ln); `GLOSSARY.md` cited as GL Ln.

Scope: verify the six rectifications are present and coherent on the map;
re-verify round-1 criteria (fidelity, coherence, no stale "open"
statements); classify every new finding as representation defect (R —
recorder's to fix) or design defect (D — re-opens the user's frontier).
Settled rulings the user has answered are not re-litigated.

---

## 1. The six rectifications — all six hold

| # | Rectification | Where | Verdict |
|---|---|---|---|
| 1 | Engine off-switch: consent at bootstrap + park command, resumable | map L284–288 | Holds |
| 2 | Helper permissions: tailored per helper, dispatch-time check, mismatch = loud system failure | map L275–283 | Holds |
| 3 | Plan repair chair: the interactive session repairs with the user; review precedes confirmation | map L269–274 | Holds |
| 4 | Push-conflict terminal: hold commits, raise through the inbox | map L264–268 | Holds |
| 5 | `domain-modeling`: kept, re-fit | map L260–263 | Holds |
| 6 | "inbox" naming: kept + `GLOSSARY.md` entry | map L256–259 + GL L12–16 | Holds |

**1. Off-switch** (map L284–288): "bootstrap states plainly what
always-awake processing means before it starts (the consent moment), and
a park command stops the engine on that project, leaving the records in
place and resumable by re-running bootstrap; the engine then stops
reading that repository until restarted." All three asked-for elements
present: consent at bootstrap, a park command, resumability. Coherent
with the start switch (L97–102, engine operates only where started),
startedness (L369–376, activation is local), and the crash contract's
"no separate engine state store" (L233–238): state lives in the records,
so parking loses nothing. The literal command name is left unnamed — a
spec-detail of the same class as the parked sums (L801–809), not a
missing direction. Closes round-1 C–D1 (off-switch/consent absent).

**2. Helper permissions** (map L275–283): "each helper carries its own
tailored permission ruleset"; "the forbidden list is the engine's floor
and each helper's set builds inside it"; "the orchestrator matches the
job's requirements against the helper's set before dispatch, and a
mismatch fails loudly there — a system defect to fix, never a
mid-operation permission request reaching the user." The headless-`ask`
gap round-1 C–D2 named is closed: an unsatisfiable permission
requirement fails loudly at dispatch instead of surfacing a mid-run
request. Coherent with the forbidden list (L316–321, the floor named)
and failure routing (L581–588: a failure the user cannot help rectify
never inboxes them — a dispatch mismatch is the system's own defect).
The check's mechanics are properly parked as spec detail (L807–809),
keeping the "direction decided, shapes parked" discipline intact. Closes
C–D2.

**3. Plan repair chair** (map L269–274): "the interactive session
itself: the agent repairs the FAILed plan with the user, continuing the
very conversation the plan came from. This is why the plan's review runs
before its confirmation: a FAIL still has a live session to land in, and
only a reviewed-and-confirmed plan enters the engine." Answers B–D2
(who repairs a FAILed plan). Coherent with the confirmation artifact
(L343–348: the marker is recorded in-session before the entry-point
tool), the chat boundary (L622–626: the plan's review is the one place
the chat is a source — the repair continues that same chat), and
abandoned sessions (L318–323: an unconfirmed plan touches nothing, so no
repair scenario loses its chair). One stale clause beside it — see
R2 below; it does not disturb the ruling.

**4. Push-conflict terminal** (map L264–268): "on non-fast-forward
divergence the engine never merges: it holds its commits, leaves the
working tree alone, and raises through the inbox (the reconciliation is
the user's authority); everything waits intact until answered." Closes
C–D3, which demanded a named end to the push-retry loop under
divergence. Coherent with plank three (L246–250, pull-first, never
self-merge), plank four (L226–231, absorb-or-alarm as the cross-lane
reconciler), offline pushes (L308–312: network failure holds locally and
retries — a distinct trigger from divergence, both ends named), and the
forbidden list (L316–321: never merge on its own).

**5. `domain-modeling` kept, re-fit** (map L260–263): "the skill
survives, re-fit: the engine-side discipline lives in the caregiver; the
interactive side keeps its function, guiding the user through term-work
when judging proposals and ruling meanings." Closes A–K1. Coherent with
the caregiver (L479–489, the fifth helper, glossary-only context),
glossary proposals (L463–478: proposals reach the user with the
caregiver's suggested definition — the interactive term-work the skill
now fronts), and the function-necessity ruling (L520–527). The survivors
claim ("every skill and command now has a fate", L92–93) and the
pour-complete ruling (L298–301) are now supported instead of
over-claimed.

**6. "inbox" naming kept** (map L256–259): "kept, with a glossary entry
in girth-agents' own GLOSSARY.md defining it as the user's inbox as
designed in this plugin, in contrast to OpenCode's own agent-prompt-queue
inbox of the same name." Verified: `GLOSSARY.md` L12–16 carries the
entry — "**Inbox**: the user-facing screen and the system's asynchronous
send/receive channel … In this project 'inbox' means this, unless
OpenCode's own inbox — a session's pending-prompt queue — is expressly
named." The entry matches the ruling (the map says "agent-prompt-queue",
the glossary says "pending-prompt queue" — same referent, no defect).
Closes A–K2; the collision is now confronted by an explicit
disambiguation rather than left flagged.

## 2. Fidelity — no inversions; one carry-through note

Re-spot-checked the round-1 pairs against `tracker/QUESTIONS.md`
concurrency planks (Q L35–48), primary agents/orchestrator (Q L114–117),
GitHub machinery (Q L132–140), project kinds (Q L162–169), knowledge
management (Q L192–204), the recall layer (Q L89–100), the pour
(Q L643–646), and the six parked sums (Q L307–311 etc.): no divergences,
no quiet inversions. Fidelity holds.

- **Rf — LOW, R (tracker hygiene, F1-class):** the six rectification
  rulings live only on the map ("settled … (2026-10-27, user)"). A grep
  of `tracker/` finds no QUESTIONS entries for off-switch, permission
  ruleset, repair chair, push-conflict, `domain-modeling`'s fate, or the
  inbox name. Round-1 had flagged the first two as having "no tracker
  home." The answers are now recorded on the map with user attribution —
  record-only support, exactly round-1's F1 class — not an inversion.
  The recorder should note or track them; nothing here re-opens the
  frontier (the answers exist and are attributed).

## 3. Re-verification of round-1 representation items — mostly cleaned

Fixed since round 1 (re-verified): the "Not yet specified" tail now
reads "settled … (see Decisions so far)" for Concurrency, Primary
agents, GitHub integration, Project kinds, Knowledge management, and the
change cloud (L770–788); "the four helpers" is gone (roster is six,
L259–263, L797); session scope now says "the builder fixing its own
piece" (L194–196); "Primary agents: declared open" now carries
"(settled 2026-10-27 — see 'The orchestrator')" (L490–494); the
deferred-by-design list no longer says the engine-instance question was
"not yet put to the user" (L810–812). Each of A–C1/C2/C3, C–R1/R2/R4 is
resolved.

Remaining and new representation items (all recorder-side):

- **R1 — MEDIUM, R (new):** the first "Not yet specified" bullet
  (L763–769) still narrates the six findings as re-opened: "six findings
  re-open the frontier, in rectification with the user … (Nothing here is
  settled until that round closes.)" The same document settles all six
  (L256–288). This is a stale status note about the plan's own gate,
  contradicted by the Decisions section; the recorder updates it when
  recording the verdict. It is *not* a frontier reopening — every
  finding it names is answered.
- **R2 — LOW, R (new):** the plan-gate note (L80–85) says "a FAIL
  repairs normally with the inbox entering exactly when rectification
  requires the user's answer," while the repair chair (L269–274) seats
  the repair in the still-live interactive session, the user present.
  The later ruling supersedes the earlier clause (same-layer); it needs
  the map's own reconciliation marker/wording (the pattern
  "(reconciled …)" / "(settled … see …)" used at L490–494, L720–724).
  Resolvable by ordering — no question to the user.
- **R3 — LOW, R (carried over, B–R9):** "Project kinds: declared"
  (L501–507) and "Knowledge management: declared" (L508–519) retain
  fog-era language ("very foggy," "needs a deep dive") with no pointer to
  their settled shapes (L360–374, L435–489).
- **R4 — LOW, R (new):** dispatch wording — helpers are "dispatched by
  the engine" (L295–296) while "the orchestrator matches the job's
  requirements … before dispatch" (L281–282). Reconcilable (orchestrator
  coordinates, engine spawns, L289–292) but unpointed.
- **R5 — LOW, R (observation):** pour-complete names three deferrals as
  "the only open threads" (L298–301) while "Deferred by design, not open
  now" lists six (L810–812). Compatible only by reading the shelf items
  as "not open now"; the enumerations don't align.

## 4. Classification and verdict

No new design defect. Every item above resolves without a user question:
the six rectifications are answered and coherent; the residual items are
stale narration or missing reconciliation pointers — recorder repairs of
the exact kind the map's own incident doctrine (L15–29, L205–215)
assigns to the recorder, never the user. The design frontier is closed:
all six round-1 reopenings are settled, and nothing on the map re-opens
them or opens a new one.

The findings R1–R5 plus Rf are cited for the recorder to fold in at
record-time (R1 in particular should be rewritten when the PASS is
stamped).

VERDICT: PASS