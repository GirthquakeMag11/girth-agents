# Spec review 3 — `specs/plugin.md`

Third-pass fresh-context review of `specs/plugin.md` against the format
(`.opencode/skills/specifying/references/spec-format.md`), the settled
record (`plans/plugin-transition.md`, `tracker/QUESTIONS.md`,
`decisions/0007-plugin-transition.md`), and the project's own documents
(`GLOSSARY.md`, `conventions/`, plus `CONTRIBUTING.md`'s scaffold-family
rules where the report pile's ownership is judged). This reviewer did not
write the spec and did not see its drafting; it grades the current file
against the record alone.

Charge: verify every pass-2 rectification landed, then re-run the full
grade. Pass-2 source: `docs/research/spec-review-2.md`.

Classification:

- **Representation defect** — the spec's wording is the problem; the
  writer fixes it from the settled record, no user needed.
- **Design defect** — the spec re-opens something settled or invents
  something the records do not support; this needs the user.
- **Completeness defect** — a settled decision that is missing; listed
  under Completeness with its own classification in brackets.

## Pass-2 FAILings — rectification check

Verdict on the charge: **all nine landed, with one wording lag that can
be tightened but no longer blocks.**

1. **Lost-session detection and recovery — LANDED.** Line 109: "the
   builder repairing its own piece keeps its session, and a lost session
   is detected and recovered from the records alone — the same rebuild
   as any crash." The settled ruler
   (`plans/plugin-transition.md` 207–210) is verbatim in substance.
2. **Re-bootstrap as its own exclusive synchronous step — LANDED.**
   Line 89: "A re-bootstrap of a live project is a step of its own: it
   waits for the step in flight, runs exclusively and synchronously with
   the user, and the engine resumes after" — the three settled limbs
   (wait, exclusive-and-synchronous, resume) from
   `plans/plugin-transition.md` 265–268, all present.
3. **Scaffold-migration details named in Out of Scope — LANDED.**
   Line 151: "the mechanism is settled (bootstrap is the migration
   gate); the rules for each schema transition are pinned when the first
   migration is built" — the parked-by-name shape the plan demands
   (`plans/plugin-transition.md` 836–838; `tracker/QUESTIONS.md`
   scaffold-migration entry).
4. **Dogfooding's two-checkout mechanics in the body — LANDED.**
   Line 97 carries the exact settled mechanism
   (`plans/plugin-transition.md` 359–364): separate installed copy,
   develops the repo's checkout, commits reach the install only at the
   next deliberate plugin update. Story 22 now has its design behind it.
5. **User sessions live outside the engine — LANDED.** Line 96 states
   the plank verbatim: never compete for the queue; outputs cross at the
   already-designed doors (entry-point clearance, inbox replies,
   absorb-or-alarm). Matches `plans/plugin-transition.md` 384–387 and
   the concurrency entry's answered form.
6. **gh-declination's full consequence — LANDED.** Line 89 now states
   the settled triple: "its commits staying local and pushes and
   self-reports unavailable" (`plans/plugin-transition.md` 331–336),
   and line 110's self-report promise now has its honest exception.
7. **The recall layer's read mechanism — LANDED.** Line 130 defines the
   two-mode read: the kind rides into a brief whole only under the
   dispatch's relevance check at the same hard budget as any context;
   otherwise on-demand lookup right before the tool use it informs. That
   is exactly the settled retrieval-injection ground's two options
   (`tracker/QUESTIONS.md` 99–100; documented in
   `docs/research/recall-layer-mechanisms.md` 149–150).
8. **The report pile's owner named — LANDED with a lag.** Line 116
   names the reviewer agent as owner, puts the filing format in the
   reviewer's bundled references, and lists the pile under the reviewer
   in the scaffolding inventory. Note below under Fidelity: the record
   ceded "the report pile's owning **skill** and format"
   (`plans/plugin-transition.md` 829–832;
   `tracker/QUESTIONS.md` 566–569), and the scaffold-family convention
   (`CONTRIBUTING.md` 45, 187) names owning *skills* — the spec answers
   with an agent, and the agent's skill is never named by ID. The
   five-crafts settlement already assigns `code-review` to the helper
   holding review responsibility, so the writer can close the lag with
   one phrase ("the reviewing skill, `code-review`") — no user needed.
   Representation-class, non-blocking.
9. **Shelf naming complete — LANDED.** Verified against the real
   catalog layout: line 68 names `/handoff` and `/pickup` explicitly
   ("sit on the shelf with their skill" — correct: both command bodies
   invoke the `handoff` skill, which carries both protocols), line 67
   names the `handoff` skill and the `wizard` pair, `/retro` is named,
   and `wayfinding`'s survival is stated with its door
   (`/wayfind`). All shelf items are now accounted for by name; nothing
   looks unaccounted for.

## Format

Verdict: **compliant.**

- All seven sections present, in the required order, with the required
  content shape (`spec-format.md` 28–54).
- Implementation Decisions (lines 57–133) contains no file paths and no
  code snippets. Backticked tokens present are command names
  (`opencode plugin update`, `/slice`, `/park`, …), catalog IDs
  (`slicing`, `tdd`, `test-driving`, …), agent names (`build`, `plan`),
  schema-field names (`context:`), the display string `Inbox: {n}`, and
  the API name `setup()`. Each pins a name or schema decision the spec
  was told to pin — inside the format's inline allowance
  (`spec-format.md` 41–44), and the same borderline tokens pass 2
  accepted. The prior-art paths (`scripts/…`) sit in Testing Decisions,
  where the restriction does not apply.
- User Stories is a long, numbered As-a/I-want/so-that list, 22
  stories, each traceable to a settled decision.

## Fidelity

Verdict: **no invention, no drift.**

- **No design defect.** The pass-1 inventions stay gone: no agent-ID
  fallback (line 82 states the keystone and refuses to presume a
  failure path — exactly the plan's "verified before building, not open
  decisions" stance, `plans/plugin-transition.md` 821–826), no cap
  override (line 108: tool-enforced, ungrantable, cap-too-low is the
  exception not an override, `plans/plugin-transition.md` 211–218,
  662–665), and the no-separate-state-store absolute stands unsoftened
  (line 90 leads with it verbatim; the activation registry is framed as
  machine-local fact, never project state, never in the repository).
- Spot-checks land faithful across the settled clusters: one door and
  plan-only entry (101–103); forbidden list complete (86); serial
  scope, exclusive steps, passive watching never sleeps, future stance
  named not designed (87); six helpers with per-helper permission
  rulesets and pre-dispatch loud mismatch (74–81); commit unit, working
  branch, hold-and-inbox on non-fast-forward, offline hold-and-retry
  with pull first (93); the ledger with pull-first retry (90);
  absorb-or-alarm, never guesses intent (95); failure routing by
  answerability and the loud stamped exception with consent-per-send
  self-report, flood coalescing, FIFO plan queue (110–111); tracker
  kinds with authority/information, new kind files on one-file-per-kind,
  defect provenance flag (115); root store, context map, optional
  `context:`, scoped reads, warrant-only placement recorded as a
  deviation (117); prose glossary, form-only mechanical gate (118);
  inbox as channel-not-view with message record and seeded answerer
  sessions (121–122); sidebar counter plus engine-reported live report
  with the ledger as recovery truth (124); caregiver pipeline,
  filtered-not-batched, convention-weight changes, review grades term
  use (126–129); recall capture → idle consolidation → prove-it →
  recurrence → stratification, first occurrence a hazard, unverifiable
  claims to the ordinary question machinery (130); keystone list (156);
  the two layers and the interpreter classification (134, 156–157).
- **Observations, not defects** (all representation-class):
  - The recall cap "one hundred" and the overflow's
    "least-re-ratified" selection rule are within the budget/eviction
    ground the plan ceded as spec detail (`tracker/QUESTIONS.md`
    99–100; `plans/plugin-transition.md` 342–346). "Re-ratification"
    re-uses the record's own recurrence logic (a lesson's life depends
    on how often it has re-proven itself,
    `plans/plugin-transition.md` 451–454), read off the closing-line
    record the spec itself names — coherent, and the tracker's closing
    lines are the right witness. No new decision is being taken over
    the plan's head; the writer may want to make the derivation
    one phrase more explicit.
  - The keystone list (156) carries "the per-machine activation
    registry's storage" beyond the plan's enumerated six
    (`plans/plugin-transition.md` 62–68). This is the existing
    "`ctx.storage` durability and location" keystone re-derived for the
    registry the spec itself was made responsible for, not a new
    unverified claim — lines 90 and 94 already frame the registry's
    storage honestly as a keystone. Coherent; no action needed.
  - Line 89 compresses the gh vehicle to "the optional gh setup as an
    action" without the record's "credentials through gh, never stored
    separately" phrase (`plans/plugin-transition.md` 331–336). The
    declination consequence is now complete (finding 6 above), so the
    credential-handling half is the only unpinned limb; the writer can
    add it from the record, no user needed.

## Completeness

Verdict: **complete.** Every settled decision is carried, either stated
or pinned as the plan ceded it.

- The five destination areas are all covered: skills and commands
  (64–69, with the full sweep), agent types (73–82), tools (entry-point
  tool, review-loop tool, doors, inbox screen, sidebar slot, park),
  code (package, engine, harness, 57–63, 84–97, 132–140).
- The catalog sweep is complete against the record: renames, deaths,
  survivals with shape changes, the atomicity requirement, the
  two-layer re-pointing, the shelved items — all present
  (`decisions/0007-plugin-transition.md` 41–46).
- Bootstrap cluster, direction-change path, convention-crash path
  (folded into `codifying`, 67), cap defaults, criterion-compilation,
  brief fields, flood coalescing, queue order, message record, sidebar
  derivation, plan-queue FIFO, recall budget and eviction — every ceded
  shape is pinned (158 names the list, and the sections deliver it).
- Two settled answers are carried compositionally rather than in one
  sentence, with no behavioral gap left over:
  - *Information-kind dispatch* — the kind declarations (115), the
    fact-finder's role (77), failed-openly helpers (74), failure
    routing (111), and the verbatim parenthetical "information-kind to
    the fact-finder, authority-kind to the inbox" (130) together leave
    no other routing possible. An explicit general-policy sentence
    would be tighter; its absence does not change what gets built.
  - *One engine per machine, per checkout* — carried by machine-local
    registry (90, 94), local startedness (88), machine-local
    un-started default (94), and pull-first reconcile through shared
    history (93). The plank's operations are all in the spec; only the
    label is absent.
- The report pile now sits in the sweep of scaffold pieces the
  decision record requires inventoried at implementation (116).

## Coherence

Verdict: **no internal contradictions.**

- Ledger and registry agree throughout (90, 94): machine-local
  non-state, safe-default loss, nothing in the repository. The sidebar
  truth (124) and the committed ledger stay the two halves of the
  sidebar-truth settlement exactly.
- The pile being the committed verdict store (116) and the live report
  deriving from the engine's own state transitions (124) coexist
  without contradiction: the pile is the source, the transitions are
  the update discipline — the pair is the settled "recovery truth /
  display truth."
- Plan-gate completeness (110) agrees with the one-human-stop statement
  and grilling's battery ruling (289–297).
- The inbox (121–124) matches the GLOSSARY "Inbox" term — screen plus
  send/receive channel plus seeded sessions plus recorded replies — and
  the name-collision contrast with OpenCode's own inbox stands by that
  term.
- The release wording (59) is consistent with the GLOSSARY "Release"
  term and `conventions/On_Versioning.md`: the release remains the
  user's; a GitHub Release page and a tag carry it, nothing here lets
  the engine release.
- The doors kept (`/bootstrap`, `/inbox`, `/wayfind`, `/ideate`,
  `/slice`, `/questionnaire`, `/park`) honor `conventions/On_Chains.md`
  — thin doors over skills, both recovery rails reachable.
- The interpreter classification (134) preserves the two-layer
  discipline exactly as the map's foundational warning demands
  (`plans/plugin-transition.md` 20–34, 219–229).

## Overall

Round 3 lands every rectification pass 2 demanded: lost-session
recovery and the exclusive synchronous re-bootstrap now stand in the
body, the migration deferral is parked by name in Out of Scope,
dogfooding has its two-checkout mechanism, user sessions are declared
outside the engine, the gh declination carries its full triple
consequence, the recall layer has its two-mode read, the report pile
has a named owner and format home, and the shelf is named item by item
against the real catalog. The re-run of the full grade finds no design
defect — nothing re-opens settled ground, nothing is invented beyond
ceded detail, and the numbers the spec pins (3, 10, 100) sit exactly
in the ground the plan ceded as spec detail. Completeness is met for
skills, commands, agent types, tools, code, and every settled
decision. The observations above are all representation-class: the
writer sharpens three phrases from the record where useful (report
pile's owning skill named by ID, the credential-handling limb, and a
standing sentence for information-kind dispatch), none of which
changes what would be built. The spec can govern as written.

VERDICT: PASS