# Plan review 3C — the safety skeptic's round-3 pass: is the fog cleared?

**Reviewer:** C (safety skeptic — the "fog cleared" seat, per the M1262
focus division; this focus does not constrain what else I grade).
**Target:** `plans/plugin-transition.md` as on disk 2026-10-28 (895 lines).
**Governing rules:** the user's mandate at M1200, reaffirmed M1220, and the
M1262/M1269 rulings — raw chat log as it exists at review time; every item
cites the exact user message it derives from and each citation must resolve
to the user's own words genuinely affirming the item; claims require
verification and citation; no unverifiable assertions about intent or
technical matters; uncleared fog is failure, lying is failure, being wrong
is failure.

**Evidence:** the raw chat log snapshot
`/tmp/opencode/girth-agents-chat-log-round3.md` (1310 stored message rows,
M1–M1306; read in targeted passes: all 78 user messages verbatim, every
question-tool answer string behind the settled items, the round-2
rectification batch, and the round-3 dispatch tail), the plan file itself,
and the round-2 findings I was charged to regress against
(`docs/research/plan-review-2A/B/C.md`).

**Method.** Each still-open question from round 2 was re-checked against
the current plan text and the cited message; each new entry added since
M1225 was checked against its cited message; each new user message
(M1262, M1269, M1273) was checked for complete and faithful recording; and
the plan's residual open items were tested for whether they are genuine
questions for the user or quietly resolved in the text.

---

## Verdict summary

The round-3 rectification is real and fixed the load-bearing round-2
findings: the fabricated file-discipline dialogue is replaced by the
user's own M910 words, the "plan's own review — closed / unanimous PASS"
self-claim is now an honest "open" record, the keystone list and the
platform-facts list no longer contradict each other, the sidebar-truth
entry lost its invented atomicity/dual-truth machinery, the shelved-era
terms are relabeled OPEN, the corrupted entries are restored, the helpers'
realization (M1165's embedded ruling) is finally recorded, and the
zeroshot exclusions are honestly relabeled as research findings.

But the plan is not wholly complete, and fog remains:

1. **The M1173/M1174 design rulings are absent from the plan entirely** —
   the user's rulings that a changed ticket invalidates its whole effort
   and re-opens the spec, that a design cohering with records but not
   reality FAILs, and that the gate must refuse work resting on an
   unverified load-bearing fact. The user ordered these incorporated into
   the planning stage's design (M1177). The plan records none of them,
   and lists none of them open. **Design fog, terminal.**
2. **The mandatory-rules entry records M1200 incompletely** — the four
   explicit prohibitions the user enumerated ("You are not to…") are still
   absent (round-2 finding F12, unfixed). The plan's own operating manual
   is compressed past what the user asked be incorporated.
3. **A residue of citations that do not resolve to user words** survives
   inside settled items — the "too disorganized" Notes miscite (F10), the
   TUI-facts bullet still entirely uncited (F11), and several glosses
   wearing user citations the cited answers do not carry (per-package
   placement / M855, "recorded as a ruling like any declination" / M960,
   "one at a time" / M1024, the testing piece list / M568, the caregiver's
   authority clauses cited only to M771 though they are M775's, the
   scaffold-migration "mechanism is now found" over-claim).
4. **The harvested-incidents list still omits the incident the mandate
   itself was born from** (the fabricated ruling + log-less review that
   passed it), and the third open thread (flood-control coalescing) is
   omitted from the plan's own accounting of reopened threads, which
   counts two where three exist.

Under the rules as given — "uncleared fog is failure… being wrong is
failure" (M1200) — the plan cannot transition to specifying yet.

---

## 1. Regression: round-2 findings against the current plan

| Round-2 finding | Current state | Grade |
|---|---|---|
| 2A-F1 / 2B-F3 / 2C-F1 — "plan's own review — closed … unanimous PASS" | Now "open", records M1197/M1198/M1200, round-2 FAIL, round 3 following (plan L831–838). True per the log and the 2A/B/C files. | FIXED |
| 2A-F2 — "OpenCode V1 support" out-of-scope with no user derivation | Deleted. The user never ruled on V1 anywhere in the log (verified: no user message mentions V1). 2A's fix said "either find the user message… or route it through the scoping-clarification question." Neither happened: the item was silently dropped. The design question is now neither settled nor listed open. | NOT FIXED (by deletion — fog, small) |
| 2A-F3 / 2B-F2 — Notes claim agents register via transforms; keystone vs platform-facts contradiction | "Facts the map leans on" now reads "commands, skills, and tools via transforms — but NOT agents"; keystone list and platform-facts tail reconciled (L76–80, L93–99, L866–874). But the catalog-identity bullet (L65–68) still says the plugin "registers them through the skill/command/agent transforms" — the pre-verification triplet survives in one place. | PARTLY FIXED |
| 2A-F4 / 2B-F4 — "Two layers" cites M646 | Now "(chat M663; raised at M646)" (L671–676). | FIXED |
| 2A-F5 / 2B-F7 — shelved-era terms "settled — they stay" | Now labeled OPEN, "Unresolved, to be put to the user" (L305–314). Caveat below (R5). | FIXED (with caveat) |
| 2A-F6 — zeroshot exclusions cited to M390 | Reframed as "the research's findings, not the user's words", borrowing held "Decide later" (M401) (L890–895). | FIXED |
| 2A-F7 / 2C-F2 — stale survey bullets (0003 marker; 0007 supersession) | Refreshed: "The other two earlier findings … were since folded" (L100–104). Verified true: `decisions/0003` has the marker, `decisions/0007` records the supersession. | FIXED |
| 2A-F8 / 2B-F9 — uncited glosses inside settled items | 5 of 8 cleaned (quotations around "could not acquire", inbox "by reference", sidebar atomicity, self-report coalescing now labeled open, helpers' "forbidden list is the engine's floor"). 3 stand: per-package placement (L474–475), "recorded as a ruling like any declination" (L377–378), "one at a time" (L321). 2B-F9 adds three more standing: the testing piece list (L177), the caregiver's M775 clauses uncited (L551–556), the scaffold-migration "mechanism is now found" composite (L446–451). | NOT FIXED (tail) |
| 2A-F9 / 2B-F1 — corrupted entries | Inbox items, Renames, Markdown's place all restored and normalized (L777–787, L826–827). | FIXED |
| 2A-F10 — "too disorganized" miscited to M315/M418 | Still cites "(chat M315, M418)" (L69–72). Neither message contains the words; they are the user's own words inside M323's question-answer ("I have too many ideas that are too disorganized to enumerate here at once, a lot of them are changes to individual items meant to affect cross cutting concerns…"). M323 is not in the citation. | NOT FIXED |
| 2B-F5 — fabricated "intentional? then it needs a ruling; a mistake? then revert it" inbox dialogue | Replaced with the user's verbatim M910 two cases; the walk is labeled "unruled, to be put to the user" (L272–282). | FIXED |
| 2B-F6 — sidebar-truth atomicity/dual-truth | Reduced to the user's single M926 sentence (L434–436). | FIXED |
| 2B-F10 — helpers' mechanical realization unrecorded | New entry "Helpers' realization" (L356–365) carries the M1165 verbatim answer, the `AgentEditor` negative, and the spec-shape labeling. This resolves the round-2 design fog at the ruling level. | FIXED |
| 2B-F11 — TUI facts uncited; M497 as fact-source | TUI facts bullet (L81–86) still carries **no citation at all**. The claims themselves are true (round-2 technical ledgers all verify them), but the plan's own mandated rule — every item cites its source — is unmet. | NOT FIXED |
| 2B-F12 — mandatory-rules note under-records M1200 | Still compressed (L34–47; see D2 below). | NOT FIXED |
| 2C-Part 1 — harvested scenarios omit the M1200 incident | Still only the two 2026-10-26 cross-layer scenarios (L859–865). The M1200 incident (a fabricated record a review-without-the-log passed) and the M1173 incident (a ticket edited under a gate that verified records, not reality) are absent, despite M1177's "Every excruciating learning experience is being put to use." | NOT FIXED |
| 2C-F4(b) — platform facts cite M1126 (probe-code turn, not results) | Still "(chat M1126)" (L77–80, L866–874). M1126 is the assistant's probe-design reasoning; the results (transform-failure log, storage readback, codemode execution) land later (M1142–M1157). Verification true, anchor mis-aimed. | NOT FIXED (minor) |
| 2C-F5 — garbled "(user; named … user)" label; mid-sentence "(chat M492)" | Both still present verbatim (L355; L134). | NOT FIXED (cosmetic) |

Net: 9 of the substantive findings fixed; 9 fully or partly unfixed, of
which two (D1, D2 below) are fog, not polish.

---

## 2. Design findings (re-open the user's frontier / uncleared fog)

### D1 — The M1173/M1174 design rulings are recorded nowhere in the plan — DESIGN, terminal

The most expensive correction of the whole effort produced concrete
rulings about the system's work-stage gates, and the plan carries none of
them:

- **M1173 (user):** "If you need to edit a ticket to complete a task, that
  means the ticket should have never passed in the first place… A ticket
  *needing* to change means that one part of a greater effort is wrong…
  it invalidates *all* of the tickets sharing that effort as well as the
  spec they came from. If a ticket coheres with a spec but not *reality*
  then that spec in part also does not cohere with reality and that spec
  FAILs… it's an example of something that should be entirely impossible
  and unnecessary in what we're building."
- **M1174 (user's answer):** "the line 'the gates verify… never against
  reality' describes a catastrophic failure of this attempt… in all of my
  talks about facts, evidence, verification and proof… you're describing
  *facts* as being separate from *reality*." — i.e., the gate verifies
  facts (records carry facts); an "unverified" recorded item is a hole the
  gate must refuse, not a state to pass over.
- **M1177 (user):** "We then have to find what should have happened in the
  planning stage, make it happen, and incorporate it into the planning
  stage's design. Every excruciating learning experience is being put to
  use to improve the design, this being an important one."

The plan's work-stage entries remain exactly as they were before the
incident: "The work check" (L667–670) grades ticket-by-ticket with "the
PASS stamps the ticket itself" — no immutability rule, no re-open-the-effort
rule; "Criteria" (L709–714) compiles the checklist from the earlier
approved document and "the checker only grades against it" — no
reality-verification obligation, no refusal of unverified load-bearing
keystones; "Discipline" (L701–704) caps fix-rounds only. The only
reality-checking ever recorded in the plan is the M1262 division of the
*plan's own review* ([Ours]), and the M1200 rules for that same review —
not the system's spec/slice/work gates, which are the thing being
designed. The M1174 correction turned on exactly this: the gate that
"verifies against records, never against reality" was called "a
catastrophic failure of this attempt."

Nothing in the plan resolves these rulings, and nothing lists them open.
They are unrecorded user rulings about the design under construction —
uncleared fog, and precisely the class M1200 says is failure.

### D2 — "OpenCode V1 support" was deleted, not asked — DESIGN/scope, small

2A-F2 required the V1 out-of-scope item to be cited or routed through the
scoping-clarification question, and noted docs show a plugin *can* ship
V1+V2 from one package, making it a genuine choice. The current plan
deletes the item outright (verified: no V1 text remains; no user message
anywhere in the log mentions V1). The design question — does the plugin
bear V1 support at all — is now neither settled nor listed open nor asked
of the user. The repo's standing V2-only identity makes the answer
probable, which is why this is small — but it is a dropped question, and
"the map never smuggles an open thread out of sight" is the standard the
plan itself adopts everywhere else.

---

## 3. Representation findings (recorder-class; citations that do not resolve)

### R1 — The "too disorganized" citation points at messages that do not contain the words (2A-F10, unfixed)

Plan L69–72 cites "(chat M315, M418)". M315 is the destination direction;
M418 is the "refresh yourself / take it slowly / I misspeak" instruction.
Neither contains "too disorganized to enumerate linearly". Those words are
the user's own, inside M323's round-1 answer. Re-cite to M323.

### R2 — Unaffirmed glosses still wearing user citations (2A-F8 / 2B-F9 tail, unfixed)

- L474–475 "per-package physical placement only on warrant, recorded as a
  deviation like any other" — M855's answer is only "Root store, map, and
  scopes (Recommended)". The clause comes from the mediation research
  doc, not the user. Presented inside a "settled" item.
- L377–378 "recorded as a ruling like any declination" — M960's answer
  says the declination lets the engine proceed without GitHub; it says
  nothing about recording rulings.
- L321 "one at a time" — M1024's long answer contains no count
  constraint.
- L175–177 "(parser, review loop, session spawn, inbox record, TUI slot)"
  — M568's answer is only "An automated harness (Recommended)"; the piece
  list is from the discarded spec pass.
- L551–556 caregiver authority clauses ("Admission and change are the
  user's authority… an agent-inferred definition is only as good as the
  context it infers from") — these are the user's words at **M775**
  ("changes to a glossary should be taken as seriously as changes to a
  convention" — verified verbatim), but the entry cites only "(chat M771)".
- L446–451 scaffold migration: "The mechanism is now found: local
  bootstrap is the activation AND the migration gate" — M903 says the
  bootstrap "needs to be able to bring a repo into the current paradigm"
  (a requirement), not that the mechanism is found; "activation" is
  M920's word, cited only in the adjacent Startedness entry. The user
  never pronounced the mechanism "found".
- L251–253 the concurrency enumeration "what runs at once, what waits,
  and how engine work and the user's own live work coexist" — M864's
  answer names "asynchronous, concurrent, and parallel work across
  codebases and operations of different sizes"; the enumeration is the
  recorder's expansion.

Each alone is a phrase; together they are the exact pattern the M1200
rules were written to stop — the recorder's content wearing a user
citation.

### R3 — TUI facts carry no citation (2B-F11, unfixed)

Plan L81–86. Every claim was verified true against the primary docs by all
three round-2 reviewers, but the plan's own mandated rule — every item
cites its source — is unmet. Cite the research note/touched docs or mark
the provenance.

### R4 — The harvested test-scenarios list omits the two defining incidents (2C Part 1 + M1177, unfixed)

Plan L859–865 lists only the 2026-10-26 cross-layer incident. Missing:
(a) the M1200 incident — a fabricated record of a user ruling plus a
review run without the raw log that passed it — the incident the
mandatory rules were born from; (b) the M1173 incident — a gate that
verified records, not reality, letting a ticket through that reality then
invalidated. M1177: "Every excruciating learning experience is being put
to use to improve the design, this being an important one." The plan's
own most expensive lessons are still not on its scenario list.

### R5 — The shelved-terms OPEN item carries an assertive draft answer

Plan L311–312: "Each definition stands alone — none requires the handoff
paradigm to be comprehensible…" — that is the answer to the user's own
M1037 test ("are any of those terms incomprehensible…?"), which the user
never affirmed, stated as fact inside the item, with only "the answer is
the user's" after it. The open label is honest; the assertive gloss should
be marked as the map's draft, not stated as established. Borderline.

### R6 — Open-thread accounting undercounts: three OPENs, two counted

The plan now labels three threads bound for the user: the shelved-era
terms (L305–314), the file-discipline walk (L272–282), and flood-control
coalescing (L399–400: "an uncited elaboration — open, to be ruled"). The
pour entry (L369–372) and the change-cloud bullet (L856–858) both say
round 2 "reopened two threads". The third open item exists nowhere in
the accounting. Internal inconsistency, minor — but the plan promises
every open thread is visible, and one is not.

### R7 — Small residue: labels, anchors, and a miscite

- L355 "(2026-10-27, user; named 2026-10-27, user)" — garbled (2C-F5).
- L134 "(chat M492)" inserted mid-sentence (2C-F5).
- L838 "The gate closes only on unanimous PASS under the citation rules
  (chat M1200)" — M1200 gives the FAIL rules; "unanimous PASS" is M969's
  wording. Hybrid miscite.
- L77–80/L866–874 cite M1126 for verified probe facts whose results land
  at M1142–M1157 (2C-F4b).
- L65–68 still presents the pre-verification triplet — the plugin
  "registers them through the skill/command/agent transforms" — which the
  plan's own fact bullets now deny for agents (F3 half-fixed).

---

## 4. What I verified as true this round (fixes that land, and process claims)

- **M1262 recorded faithfully** (L17–22, L23–27): the three-focus division
  ("This does not constrain the specifics of what they are allowed to grade
  on, only what their intended focus…") and the plugin's citation-access
  design ("request the message based on the citation provided with the
  item") both match the user's verbatim message.
- **M1269 recorded faithfully** (L28–33): the snapshot-timing rule matches
  ("The reviewer gets the chatlog as it is at the time of the review…").
- **M1273's rebuke is absorbed by the M1269 entry** — the plan's interim
  mechanism ("fresh snapshot export at each reviewer launch, never an
  earlier one carried forward") is exactly the correction M1273 demanded;
  the log tail (M1290–M1306) shows the round-3 snapshot exported at the
  dispatch moment and handed to the reviewers, so the plan's process claim
  "the snapshot for round 3 is taken at dispatch" is TRUE.
- **The review-open entry is true**: rounds 1–2 ran against the records
  (M1197/M1198; the round-1 report headers confirm); M1200 invalidated
  them; round 2 (2A/B/C) FAILed; the rectification happened in the log;
  a round 3 follows (this one). Verified against the 2A/B/C files and the
  log's rectification batch.
- **The fixes listed "FIXED" in §1** were each re-verified against the
  user's words: file-discipline now quotes M910 verbatim with the walk
  OPEN; sidebar-truth is M926's single sentence; helpers' permissions
  carry M993's sentence and M998's janitor-CFO metaphor, with the
  orchestrator mechanism honestly labeled the map's, "not the user's
  words"; shelved-era terms are OPEN "to be put to the user"; helpers'
  realization quotes M1165 verbatim and cites the probe negative;
  two-layers cites M663 (raised at M646); zeroshot relabeled as research
  findings with the user's M401 "Decide later".
- **The three labeled-OPEN items are genuine questions for the user** —
  none was answered in any later user message (the only new user messages
  since M1225 are M1262, M1269, M1273, none of which answer them).
- **No residue of M1192's ordered removal**: the "helpers are skills, not
  agents" fabrication is absent from the plan (verified by search).

---

## 5. Classification summary

- **Design (re-opens the user's frontier):** D1 (the M1173/M1174 gate
  rulings unrecorded — terminal), D2 (V1 scope question dropped, never
  asked).
- **Representation (recorder repairs, no user question):** R1–R7, plus the
  unfixed 2C-F5 labels and the M1126 anchor. R5 and R6 sit on the border;
  both are recorder-class.

The current plan is markedly more honest than the round-2 target: its
load-bearing content is sourced, its self-history is true, and its open
threads are labeled. But the gate's standard is totality — "a plan that is
not wholly complete and ready for specifying FAILs" — and this plan still
carries unrecorded user rulings (D1), a compressed-to-incomplete record
of the user's own mandatory rules (F12, D-findings above), citations that
do not resolve (R1–R3), and the recorder's content wearing user citations
inside settled items (R2). Uncleared fog is failure.

VERDICT: FAIL