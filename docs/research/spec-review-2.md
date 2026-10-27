# Spec review 2 — `specs/plugin.md`

Second-pass fresh-context review of `specs/plugin.md` against the format
(`.opencode/skills/specifying/references/spec-format.md`), the settled
record (`plans/plugin-transition.md`, `tracker/QUESTIONS.md`,
`decisions/0007-plugin-transition.md`), and the project's own documents
(`GLOSSARY.md`, `conventions/`). This reviewer did not write the spec and
did not see its drafting; it grades the current file against the record
alone.

Charge: verify each round-1 rectification landed with fidelity, then
re-run the full grade. Round-1 source:
`docs/research/spec-review-1.md`.

Classification:

- **Representation defect** — the spec's wording is the problem; the
  writer fixes it from the settled record, no user needed.
- **Design defect** — the spec re-opens something settled, or invents
  something the records do not support; this needs the user.
- **Completeness defect** — a settled decision that is missing; listed
  under Completeness with its own classification in brackets.

## Round-1 FAILings — rectification check

Verdict on the charge: **all six headline rectifications landed; three
members of the round-1 minor list did not.**

1. **The missing catalog sweep — FIXED.** `specs/plugin.md` 64–69 now
   carries the full item-by-item rebuild: the renames (`tdd` →
   `test-driving` as the broad real-case practice, `writing-for-agents`
   → `technical-writing`), the retirements (`find-skills`,
   `curate-inbox`, `/wait-what`, `/close-inbox`, `/spec` and
   `/implement`'s doors with `specifying`/`implementing` living on as the
   builder's craft), the survivals re-shaped (`slicing` into its own
   skill behind the thin `/slice` door; `codifying` gaining the
   convention-crash arrival path; `domain-modeling` re-fit across the
   caregiver and the interactive side; `maintaining-docs` zero-drift;
   `bootstrapping` eager, programmatic, synchronous; `grilling` and
   `questionnaire` keeping their functions; the five crafts under the
   role-shaped-context rule; the tracking skill's reference extension),
   the addition (`ideation`/`/ideate`), and the shelf (`handoff`,
   `/retro`, the wizard pair). All match
   `plans/plugin-transition.md` 104–106, 273–276, 557–561, 594–618,
   742–748, 782–783; `decisions/0007-plugin-transition.md` 41–46.
   One naming nit survives — see R9.
2. **The invented agent-ID fallback — FIXED.** Line 82 now states the
   keystone and refuses to presume a fallback; a failed verification is
   "a genuinely new moment, taken to the user when it arises," which is
   the honest stance the record demands (`plans/plugin-transition.md`
   62–68, 821–826) and consistent with the working-loop note that the
   user is asked exactly when information is genuinely required.
3. **The invented cap override — FIXED.** Line 106: the cap is three
   fix-rounds and ten minutes per step, "enforced by the tool,
   ungrantable to the agent's judgment," and "a cap too low for the work
   is the exception, not an override" — the exact shape of the settled
   exception (`plans/plugin-transition.md` 211–218, 662–665).
4. **The softened "no separate engine state store" absolute — FIXED to
   the standard round 1 set.** Line 91 leads with the absolute verbatim
   and frames the per-machine activation registry as "machine-local
   fact — never project state, never written into the repository; its
   storage is a build-time keystone." Line 94 adds the safe-default
   behavior and repeats that no activation state enters the repository.
   The registry is the defensible embodiment of settled local
   activation (`plans/plugin-transition.md` 399–405) with its storage
   honestly listed among the build-time keystones (line 153). No
   "except" clause survives.
5. **File paths in Implementation Decisions — FIXED.** The section
   (lines 57–133) no longer contains any path: `validate.mjs`,
   `tracker/TERMS.md`, `tracker/LESSONS.md`, and `inbox.md` are gone.
   Remaining backticked tokens (`opencode plugin update`, `setup()`,
   `context:`, `Inbox: {n}`, catalog IDs) each pin a name or schema
   decision the spec was told to pin — inside the format's
   inline-snippet allowance (`spec-format.md` 41–44), the same
   borderline round 1 accepted. The prior-art paths at line 138 sit in
   Testing Decisions, where the restriction does not apply.
6. **The bootstrap cluster and the direction-change path — FIXED.**
   Lines 88–90 carry: local startedness doubling as consent moment and
   schema gate; eager, programmatic, synchronous bootstrap with the
   derivation-exhausted whitelist (name, purpose, license; starting
   version; optional gh setup as an action) and declination recorded as
   a ruling; and the direction-change path verbatim — amend becomes a
   new reviewed plan revision, abort closes the workstream's records
   with the reason, re-answer reopens the resolved question
   (`plans/plugin-transition.md` 128–133, 365–371;
   `tracker/QUESTIONS.md` 455–461).
7. **The unpinned ceded shapes — MOSTLY FIXED.** The brief's fields
   (line 92), the criterion-compilation mechanics (line 106), the flood
   coalescing and the plan-queue FIFO order (line 109), the message
   record's fields (line 120), the sidebar's derivation from the
   engine's own state transitions (line 122), and the recall budget and
   eviction (line 128: one hundred entries, overflow proposes the
   least-re-ratified for retirement) are all pinned. Two ceded shapes
   remain thin — R7 and R8.

## Format

Verdict: **compliant.**

- All seven sections present, in the required order, with the required
  content shape (`spec-format.md` 28–54).
- Implementation Decisions contains no file paths and no code
  snippets; the section's backticked tokens pin names the spec was told
  to pin (see rectification item 5).
- User Stories is a long numbered As-a/I-want/so-that list covering the
  feature's aspects; 22 stories, each traceable to a settled decision.

## Fidelity

Verdict: **high; no invention, no drift found in this pass.**

- Spot-checks against the record land faithful: the one door and
  plan-only entry (99–101 vs. `plans/plugin-transition.md` 191–194);
  the forbidden list (86 vs. 378–383); serial scope, exclusive steps,
  watcher-never-sleeps, future stance named not designed (87 vs.
  413–421); builder repairs its own FAIL keeping its session, reviewer
  always fresh, plan's repair chair the live session (75, 107 vs.
  159–167, 298–303); the six helpers with per-helper permission
  rulesets and loud pre-dispatch mismatch (74–81 vs. 304–312); commit
  unit and push discipline, hold-and-inbox on non-fast-forward, offline
  retries with pull-first (91–93 vs. 236–251, 277–281, 337–341);
  absorb-or-alarm with never-guesses-intent (95 vs. 252–259); failure
  routing by answerability, the loud stamped exception with
  consent-per-send self-report (109 vs. 638–650); the tracker kinds
  with authority/information declaration and the new term-proposal and
  lessons kinds, one-file-per-kind convention (113 vs. 725–729,
  441–445, 492–496); the report pile as scaffold piece with double
  recording (114 vs. 666–669); the root store, context map, optional
  `context:` field, scoped reads, warrant-only per-package placement
  (115 vs. 430–436); prose glossary with form-only mechanical gate
  (116 vs. 481–486); the inbox as send/receive channel never a tracker
  view, message record fields, seeded answerer sessions, replies
  joining the serial order, abandoned sessions inert (120 vs. 181–190,
  388–391, 347–352); the sidebar counter plus the engine's own live
  report, ledger the recovery truth and live report the display truth
  (122 vs. 392–397); the caregiver pipeline with filtered-not-batched
  proposals, convention-weight changes, and review-grade term use
  (126–127 vs. 487–518); the recall layer's capture, idle-pane
  consolidation, prove-it verification, recurrence-stratification,
  first-occurrence-as-hazard, and unverifiable-claims routing (128 vs.
  437–480); the keystone list complete and unbuilt-on (153 vs. 62–68);
  the two layers honored with the cross-layer interpreter
  classification (133, 154 vs. 219–229, 815–821).
- No round-1-style quiet additions found. Nothing in the spec re-opens
  a settled question; every number (3, 10, 100) sits inside ground the
  plan ceded as spec detail.

## Completeness

Verdict: **fails, narrowly — by settled decisions still not carried,
all representation-class.**

The five destination areas are covered: skills and commands (the
catalog section, 64–69), agent types (the orchestrator and the six
helpers, 71–82), tools (the entry-point tool, the review-loop tool, the
doors, the inbox screen and sidebar slot, 97–123), and code (the
engine, the plugin package, the harness, 57–63, 84–95, 130–139).

Settled decisions that remain absent or half-carried:

- **[Representation defect]** Lost-session recovery is still missing.
  The settled session-scope ruling includes "the engine detects and
  recovers a lost session" for the builder keeping its session across
  fix-rounds (`plans/plugin-transition.md` 207–210). Lines 75 and 107
  carry the keep-its-session half only. This was round-1 finding 5 —
  it survived.
- **[Representation defect]** A re-bootstrap being its own step is
  still missing. The settled ruling: a re-bootstrap waits for the step
  in flight, runs exclusively and synchronously with the user, and the
  engine resumes after (`plans/plugin-transition.md` 265–268). Line 88
  covers park-resume ("resumable by re-running bootstrap") but never
  the mid-flight step behavior. This was round-1 finding 5 — it
  survived.
- **[Representation defect]** The scaffold-migration deferral is still
  not named in Out of Scope. The spec rightly stops at the gate
  (line 88: "an old-schema project cannot be picked up without its
  bootstrap migration first") without baking the migration rules — but
  "the scaffold-migration rules' details" (`plans/plugin-transition.md`
  836–838; `tracker/QUESTIONS.md` scaffold-migration entry) joins
  neither Out of Scope nor Further Notes, unlike every other
  parked-by-name deferral. This was round-1 finding 5 — it survived.
- **[Representation defect]** The dogfooding mechanics are not in the
  body. Story 22 names the want; the settled safety mechanism — the
  two-checkout separation, the engine running from a separate installed
  copy while developing this repo's checkout, its commits reaching the
  install only at the next deliberate plugin update
  (`plans/plugin-transition.md` 359–364) — appears nowhere in
  Implementation Decisions, so the story has no design behind it.
- **[Representation defect]** The engine/user coexistence plank is
  compressed to silence. The settled concurrency answer includes "the
  user's sessions live outside the engine entirely" and never compete
  for its queue (`plans/plugin-transition.md` 384–387;
  `tracker/QUESTIONS.md` concurrency entry, Answered). Lines 87 and
  99–101 imply it; the guarantee itself is never stated.
- **[Representation defect]** The gh-declination consequence is
  stated at one third. The settled triple: without the integration,
  commits stay local, and pushes and self-reports are unavailable
  (`plans/plugin-transition.md` 331–336). Line 89 states "commits
  staying local" only; the spec elsewhere promises self-reports
  (line 109) without ever saying when they cannot be sent.
- **[Representation defect]** The recall layer's retrieval-injection
  mechanics remain unpinned. The ceding was "budget, eviction, and
  retrieval-injection mechanics are spec detail"
  (`tracker/QUESTIONS.md` 99–100), and the settled shape includes
  "recall is how the agents read the store into their working context"
  (`plans/plugin-transition.md` 441–445). Line 128 pins the budget
  (one hundred) and eviction (least-re-ratified retirement proposals)
  but never says the store is read into working context at all — the
  layer has capture, verification, admission, and a ceiling, but no
  read mechanism.
- **[Representation defect]** The report pile's owning skill is
  unnamed. The ceded pair was "the report pile's owning skill and
  format" (`plans/plugin-transition.md` 342–346; `tracker/QUESTIONS.md`
  566–569: the piece "needs an owning skill and a
  bootstrapping-inventory row"). Line 114 pins the format's home (the
  reviewer agent's bundled references) but never names the owning
  skill the scaffold-family maintenance expects.
- **[Representation defect, nit]** The shelf's item list is
  incomplete against the real catalog. The catalog inventory is 21
  skills and 14 commands; the shelf holds the `handoff` skill, the
  `/handoff`, `/pickup`, and `/retro` commands, and the wizard pair.
  Line 67 names `` `handoff`, `/retro`, and the `wizard` pair ``; the
  `/handoff` and `/pickup` command doors appear by name nowhere except
  Out of Scope line 148 ("the shelved pair — handoff and pickup"), and
  the `wayfinding` skill's fate is only implied by `/wayfind`'s
  survival. The sweep's substance is settled and present; the naming
  list should match the inventory so nothing looks unaccounted for.

No design-class completeness finding exists: nothing here re-opens a
settled question; each gap is filled by quoting the record.

## Coherence

Verdict: **no internal contradictions found.**

- The ledger/registry claims agree (91, 94): records are the recovery
  truth, the registry is machine-local non-state with a safe-default
  loss, and activation never enters the repository.
- The pile (114) and the live report (122) agree: the pile is
  committed verdicts, the live report is the display truth derived
  from state transitions, "never a parse of half-written files" — the
  pile is never half-written.
- Plan-gate completeness (108) agrees with the one-human-stop
  statement and with grilling's battery ruling
  (`plans/plugin-transition.md` 289–297).
- `Inbox: {n}`, the email-inbox screen, seeded sessions, and recorded
  replies agree with the GLOSSARY "Inbox" term, including its
  name-collision contrast with OpenCode's own inbox.
- The release wording (59) agrees with `conventions/On_Versioning.md`
  and the GLOSSARY "Release" term — releases stay the user's to
  approve.
- The doors the spec keeps (`/bootstrap`, `/inbox`, `/wayfind`,
  `/ideate`, `/slice`, `/questionnaire`, `/park`) are consistent with
  `conventions/On_Chains.md` "commands are the doors, skills the
  machinery" and leave both recovery rails reachable.
- The two-layer note (154) and the interpreter classification (133)
  honor the map's foundational warning (`plans/plugin-transition.md`
  20–34) exactly.

## Overall

Round 2 delivers everything the headline charge demanded: the catalog
sweep is in, the invented fallback and the invented cap override are
out, the "no separate engine state store" absolute stands restored with
the registry honestly framed as machine-local non-state whose storage
is a keystone, file paths are out of Implementation Decisions, and the
bootstrap cluster, the direction-change path, and nearly every ceded
shape are pinned with fidelity to the record. Nothing in the spec
re-opens settled ground, and nothing is invented — there are no design
questions for the user anywhere in this review.

What remains is a short list of settled statements the spec still does
not carry: two of them (lost-session recovery, re-bootstrap
exclusivity) and a third (the migration deferral's Out-of-Scope row)
were named in round 1's finding 5 and are still absent, and five more
small gaps were found on the full re-run (dogfooding's two-checkout
mechanics, the user-sessions-outside-the-engine plank, the
self-reports-unavailable limb of the gh declination, the recall
layer's read mechanism, the report pile's owning skill). Every one is
representation-class — the writer fixes each by quoting the record; the
user is not needed. Until those sentences land, the spec remains silent
on settled behaviors the builder will meet, and by the completeness bar
a missing settled decision counts against PASS.

VERDICT: FAIL