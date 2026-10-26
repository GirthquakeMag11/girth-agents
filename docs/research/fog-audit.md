# Fog audit — the plugin-transition wayfinding map

**Target:** `plans/plugin-transition.md` (live map, primary). **Cross-checked
against:** `tracker/QUESTIONS.md`, `docs/research/opencode-engine-mechanics.md`,
`docs/research/opencode-tui-distribution.md`, `docs/research/repo-ground-survey.md`,
and the 21 skill descriptions. Audit date 2026-10-26.

Method: every finding pins two or more records against each other. Line
citations are to the files as they stood at read time. Findings are numbered
C (contradiction), D (double-meaning term), U (unstated dependency), G
(logical gap), O (orphan/scope).

---

## 1. Contradictions

- **C1. The plan stage is both reviewed and ungated, in the same map.**
  Line 70 lists "reviewed plans" as a downstream engine product;
  lines 264–268 narrate "a new plan is the input to a review-and-refinement
  loop whose output is a reviewed plan"; yet lines 280–284 and 347–361
  declare "wayfinding is the ungated entry" and lines 342–346 record "the
  plan alone enters from outside." If the entry plan is never reviewed,
  no "reviewed plan" ever exists; if it is reviewed, wayfinding is not
  ungated. The spec cannot state the chain's first link until this is
  resolved, because everything downstream ("criteria derived from the
  upstream reviewed document", line 281) assumes a reviewed plan exists
  as the criteria source.

- **C2. "One human stop" at the plan vs. the umbrella spec "approved once"
  are both recorded.**
  Line 96: "The user's one approval stays where direction is set — the
  plan at wayfinding's end"; lines 358–360 repeat "the plan approval at
  wayfinding's end is the one human stop." Lines 8–11: the spec is
  "approved once," with "Building and slicing … begin only after
  approval"; `tracker/QUESTIONS.md` 493–504 ("Destination shape") answers
  "one umbrella spec, approved once (user)". If the spec receives an
  approval, there are two human stops; if "approved once" means the gate's
  PASS, the phrase uses "approved" for a machine act (see D-approval). The
  number and location of human stops is the load-bearing invariant of the
  whole gate design, and the records cannot say how many there are.

- **C3. Bootstrap's human asks are told to travel two opposite ways.**
  `tracker/QUESTIONS.md` 251–254 (provisional, still in the record):
  "what genuinely needs the user goes to the inbox, never to a blocking
  in-session interview"; the answer at 258–263 (and map 76–81, 326–331):
  the run is synchronous, "the user is present, the engine is not yet
  alive, and there is no inbox," so asks happen in that session.
  `docs/research/repo-ground-survey.md` 396–400 still reports the dead
  provisional as current. A spec reader who trusts the provisional designs
  inbox-traveling bootstrap asks the settlement has killed.

- **C4. The clearer of a file is named as the agent and as the user.**
  Line 151: "the entry-point tool is how an agent tells the engine a newly
  introduced file is safe to touch" (settled, 150–154); lines 274–276:
  user-interaction products are "touched only after the user explicitly
  clears them"; `tracker/QUESTIONS.md` 277–279: "an agent ran the
  entry-point tool on it and it accepted — the clearance act is the
  flow's output." The narration makes the user the clearer; the settled
  decisions make the tool-run the clearance act, performed by an agent.
  No record says the user's approval (map 278, "user-confirmed
  conclusion") is checked, recorded, or even observable by the engine —
  see U-clearance.

- **C5. Four new agent types are settled even though the documented
  registration API cannot create them.**
  The reviewer, inbox answerer, fact-finder, and builder are each settled
  as named agent types (map 107–123, 177–180, 373–376; QUESTIONS
  "Information-kind questions" note 164–165). The engine research
  documents the constraint: `AgentEditor` has `list/get/default/update/
  remove` — "no `add`"; "New agents must come from config"
  (`docs/research/opencode-engine-mechanics.md` 200–205 and keystone 4,
  345–347). The map's own keystone list flags this ("adding brand-new
  agent IDs from a plugin (the editor has no `add`)", lines 45–46) and
  says "do not build on them until checked" — while the map keeps
  building the whole agent roster on it. The spec must either resolve the
  registration mechanism or the four agent types' existence is unproven.

- **C6. "Any session that produces a valid entry-point document" vs.
  "the plan alone opens the door."**
  Lines 257–263 (the two flows): the pro-active flow is "any session that
  produces a valid entry-point document." Lines 139–142 (the boundary's
  one door) and QUESTIONS 280–284 (answered): only the plan enters; "the
  plan alone opens the door." The older narration remains unamended on
  the map, implying a plural class of entry-point document kinds that the
  settlement closes to one. Whoever writes the spec enumerates the
  accepted kinds; the two texts give different enumerations.

- **C7. Tracker record still says the inbox opens from an "Escape menu."**
  QUESTIONS 202–203: the inbox screen is "opened via command or Escape
  menu." The map settles the opposite facts: "the menu is the command
  palette (Ctrl+P; Escape is interrupt, not a menu)" (lines 30–35; also
  207–214), confirmed by `docs/research/opencode-tui-distribution.md`
  21–26. Stale phrasing in a durable record; whoever writes the
  inbox-screen spec from the tracker will copy the wrong control.

- **C8. Settled decisions rest on keystones the map itself forbids
  building on.**
  Keystone list (map 42–47): do not build until checked —
  `ctx.storage` restart durability; the `session.idle` payload and event
  catalog; live sidebar-slot reactivity; the git-spec `./tui` export
  auto-loading. Already settled on top of them: "the engine detects and
  recovers a lost session" (155–157); the engine "watches on its own,
  advancing ready work even between messages" (146–149); the sidebar
  "read from the records, never hand-written" (124–128); "OpenCode's own
  plugin-update keeps installs current from the repo" (197–200). The map
  is internally split between "verified" and "settled": decisions are
  recorded as settled while their mechanism is flagged unverified. The
  spec inherits promises the research has not made.

- **C9. `/slice` survives as a door although the act it gates was just
  folded away.**
  Line 190–192 (and QUESTIONS 404–422): `/slice` survives as the thin
  shortcut. Lines 93–97: "slice's ticket-graph approval" folds into the
  gate. `conventions/On_Chains.md` (survey 184–186): "a command exists
  only where the act is the person's." After the fold, the person's act
  at slice is gone, so by the project's own convention the door should
  die; it survives on the earlier catalog-shape rationale
  (QUESTIONS 415–418). No convention update is recorded anywhere. The
  spec will either violate On_Chains or need a recorded amendment.

- **C10. Ground-research state contradicts the live record.**
  `repo-ground-survey.md` §5 (372–417) lists ten "still-open" questions,
  most already answered in QUESTIONS on 2026-10-26 (testing system,
  inbox helpers, answering session, sidebar, inbox home, eager
  bootstrapping, both flows, engine mechanics). The survey was written
  2026-10-25 and froze before the answers landed; nothing marks it as
  superseded in part. Two research notes now disagree with the map, and
  the map (48–54) folds in only four named inconsistencies. A spec
  writer mining the survey gets the 2026-10-25 world.

## 2. Double-meaning terms

- **D-entry point.** Four readings, four locations: (a) the
  entry-point *tool* — parser/boundary/clearance instrument (map 269–276);
  (b) a *cleared file* — "Entry points are the clearance… running the
  tool on a file is the act that makes it an entry point" (150–154);
  (c) the *starting document* — "a valid entry-point document"
  (257–263), "the plan… being the entry that starts the chain" (69–75);
  (d) the plugin package's *export entries* — "one package, two entries"
  (31–32) and "where the entrypoints sit" (survey 468). One spec section
  ("the entry-point tool accepts entry points to make entry points")
  needs all four disambiguated or the wording self-collides.

- **D-cleared / clearance.** (a) Clearance-as-user-act: "the user
  explicitly clears them" (275); (b) clearance-as-tool-run: "the marker
  is the act itself — running the tool on a file is the clearance"
  (150–154; QUESTIONS 322–324); (c) "files an agent has cleared" as the
  engine's leash boundary (149). Because (a) and (b) name different
  actors, every use of "cleared" is ambiguous about whether approval has
  happened — see C4.

- **D-approved / approval.** (a) Human approval at wayfinding's end
  ("the user's one approval", 96; "user-confirmed conclusion", 278);
  (b) gate PASS treated as approval ("criteria compiled straight from
  the earlier approved document", 170–173; "the upstream reviewed
  document", 281–282); (c) the spec "approved once" (8–11) with
  "(user)" in QUESTIONS 503 — attribution marker or approval subject?
  The same word carries the chain's only human stop and its
  machine-check, which is exactly where C2's ambiguity comes from.

- **D-inbox.** (a) The product's user-facing screen and send/receive
  channel (map 129–138, 207–214, 231–234); (b) OpenCode's per-session
  pending-prompt queue — `Session.Inbox.*`, delivery `steer|queue`
  (`opencode-tui-distribution.md` 67–73; `opencode-engine-mechanics.md`
  45–54). The research flags a genuine UX/conceptual collision
  (tui note 115) but no map decision confronts it; the glossary and the
  screen both still call it "inbox."

- **D-gate.** (a) The review gate — PASS/FAIL per stage (93–97,
  280–284); (b) the CI gate — "it gates merges to main with no manual
  step" (104–106); (c) the wizard's scenario gate ("its scenario gate
  still stands", survey 264–265). "Folds into the gate" (96) is
  unambiguous only if the reader knows which gate; the three sentences
  above it are about three different ones.

- **D-channel.** (a) Distribution channel — git vs npm, "the channel
  settled to GitHub-pointing" (197–200; QUESTIONS 444–465; "the channel's
  supersession", map 53–54); (b) communication channel — "everything
  else stays inside the engine or flows in through its own channel
  (inbox answers, rulings)" (139–142). Two domains, one word, both in
  settled decisions.

- **D-output.** (a) "Known system outputs (touched freely)" — a
  boundary class of files (274–276); (b) the engine loop's generic
  products — "inputs prepared to become outputs" (264–268); (c) the
  clearance act as "the flow's output" (QUESTIONS 279). (a) is a status
  class, (b) is any stage artifact; a spec line like "the tool touches
  outputs freely" is only true under reading (a).

- **D-stage / step.** (a) Pipeline stage — plan/spec/tickets/work, "every
  stage runs fresh" (155–157, 347–361); (b) wizard step — `template.sh`
  "stage progress", `# STAGES:` marker (survey 165–169); (c) "a time
  limit per step" (162–165) — a subdivision of (a) never named anywhere
  else. The discipline cap unit ("step") has no defined map onto the
  stage structure it disciplines.

- **D-helper(s).** (a) The engine's named agent types — "helpers built
  to fail openly" (116–119), "one named helper does every stage's
  building" (107–110), "the answering helper" (89–92), roster at
  373–376; (b) the wizard's `check helper` (survey 347–359; QUESTIONS
  557–558). Two catalogs of "helpers," one agentic and one bash, meet in
  one spec.

- **D-passed / PASS.** (a) Review verdict PASS/FAIL (280–284); (b)
  transfer between sessions — "the engine can spawn fresh OpenCode
  sessions and pass information between them" (215–221), "never passing
  the entry-point tool" (69–75); (c) "PASS-pending hand-offs" as a
  candidate sidebar state (312–317). Lowercase and uppercase are the
  only divider; "passed the stage" reads as both.

- **D-plan.** (a) The wayfinding map document (`plans/*.md`, the map's
  own format); (b) the first artifact of the gate cascade
  (plan → spec → tickets → work); (c) the generic loop input — "a new
  plan is the input to a review-and-refinement loop" (264–268). The
  current map is (a) and will become (b) when cleared — but is it (c),
  and does (c) get reviewed? That is C1 again.

## 3. Unstated dependencies

- **U-inbox-answer detection.** "The engine picks up answers" (89–92,
  129–138) and "the reply returns through the inbox and lands on the
  tracker question" (134–135) assume the engine can tell when an
  answering session records a reply. Documented detection paths are
  live-only events with no replay (`engine-mechanics.md` 118–120, 356–358)
  and unverified sidebar-side reactivity (`tui-distribution.md` 37, 111).
  No polling, hook, or storage write is assigned to the answer's
  arrival. Untracked anywhere; the inbox round-trip silently requires
  it.

- **U-started-projects-across-restarts.** The engine "operates only
  where it has been started" (58–63) and must re-learn startedness after
  every server start, with "no documented restart/wakeup mechanism"
  (`engine-mechanics.md` 314–318) and `ctx.storage` durability unflagged
  keystone 1 (265–275, 336–338). What marks a project as started (a
  scaffold piece? a storage key? scaffold existence?) is never recorded,
  and none of the options is verified durable.

- **U-clearance ≠ approval.** The engine's only observable trigger is
  the tool run (150–154); the user's approval at wayfinding's end (96–97,
  278) has no recorded representation — no decision, no inbox message, no
  stamp. The chain therefore cannot distinguish "user-approved plan"
  from "agent cleared it anyway," and the map's centerpiece invariant
  (one human stop) is unenforceable as written.

- **U-exactly-once.** Zeroshot's SQLite ledger is among the mechanics
  deliberately not borrowed (map 383–386 rejects the clashing set, not
  the ledger, but the ledger was its exactly-once device); nothing in
  the map replaces it. Two engine wake-ups, a restart mid-stage, or a
  missed live-only event can double-process a widget with no recorded
  guard. The testing-system decision (102–106) even requires
  deterministic, replayable behavior.

- **U-review-of-code-without-a-records-form.** The cascade treats every
  stage's product as a document (plan, spec, tickets) except the last —
  "work" is code in the worktree. Hand-offs carry "only typed essentials"
  (158–161); reports are graded from the records ("verifying the live
  worktree rather than the records" is explicitly out of scope, 383–386);
  the verdict is "stamped on the checked work" (167–168). What the
  implement-stage reviewer actually reads and what receives the stamp
  (the diff? a work report? the tickets?) is assigned to nothing. See
  G-implement.

- **U-criteria-compilation correctness.** "The engine compiles the
  reviewer's checklist straight from the earlier approved document"
  (170–173) produces a generated artifact nobody reviews, then the
  checker "only grades against it" (177–180). A bad compilation is an
  unfalsifiable rejection machine; no record admits the checklist can be
  wrong or says who fixes it.

- **U-plan-queue record.** QUESTIONS 280–284: when more than one plan
  is cleared, "they queue in received order." Received by whom, recorded
  where, drained by what — no home is assigned to the queue itself; the
  scaffold-inventory table has no such piece (survey 102–122).

- **U-rulings in-flow door.** "Flows in through its own channel (inbox
  answers, rulings)" (139–142) — but the entry-point tool accepts only
  plans (the boundary's one door) and the inbox carries engine-written
  messages with user replies. A user who records a convention directly
  in `conventions/` (the codifying skill's whole job) produces a file
  the engine may not touch ("touches only work it made itself, and
  files an agent has cleared", 148–149). The rulings channel has no
  door and no detection.

- **U-engine-scope.** QUESTIONS 328–333 asks "one project, or the whole
  system?" The answered line (350–351) resolves only the inside/outside
  boundary ("the plan only…"); the scope half was never answered, and
  the follow-up claims "the boundary is fully specified." Whether one
  engine instance advances several started projects, and how per-project
  inboxes and records stay separated, is nowhere stated.

- **U-user-can-still-run-doors.** `/spec`, `/implement`, `/slice`,
  `/wayfind` remain live commands; nothing records what happens when the
  human runs one in their own session. Per the boundary (139–142) their
  products are outside documents the tool rejects loudly — a user who
  runs `/spec` generates an artifact the system will refuse. The
  user-facing behavior of "rejected loudly" is undefined.

## 4. Logical gaps in the review-gate cascade

- **G1. A user-approved plan has no path through (or around) review.**
  Wayfinding is ungated (280–284), so the plan never FAILs — yet the
  narration's loop reviews plans (C1). If a plan defect is discovered
  downstream, the cascade's only motion is intra-stage rectification
  (the builder repairs its own FAILed piece, 111–115): the spec can
  loop against flawed plan-derived criteria indefinitely, with no
  mechanism to reopen the plan, and reopening would void the one human
  approval. Where the plan meets the gate is undefined, not just
  undecided.

- **G2. Cap exhaustion has no terminal state.** "A cap on fix-rounds
  and a time limit per step" (162–165); numbers are "spec detail"
  (QUESTIONS 95–96). What happens *at* the cap — piece failed-and-frozen?
  converted to a tracker question for the user? surfaced in the inbox? —
  is recorded nowhere. Note the sidebar decision (124–128) already
  promises capped-out pieces will vanish from the visible list
  ("idle or queued-but-unpicked pieces stay off"), and QUESTIONS 293–295
  merely floats engine-generated tracker questions as "candidates." A
  FAIL loop saturated by bad criteria stalls in an unlisted state, i.e.;
  the loops can indeed stall forever, cap or no cap, because nothing
  consumes the stall.

- **G3. The implement stage's review grades an undefined artifact.**
  Criteria come "straight from" the tickets (170–173); the work is code;
  the reviewer reads and grades "finished work" (177–180) against
  records-only verification (383–386; see U-review-of-code). What is
  submitted, what is stamped, and where the stamp goes for non-document
  work are all open. The cascade is well-defined for its three
  document stages and silently unworkable for its fourth.

- **G4. The decision record is the destination but no stage produces
  it.** The map's own destination is "a formally recorded decision
  (`decisions/`) … then one umbrella spec" (7–11; QUESTIONS 491–504,
  "the decision record is written first"). The gate cascade enumerates
  plan → spec → tickets → work (347–361) — decisions/ appears in no
  stage, no brief, and no gate. The engine will either skip the
  destination's first product or must insert an unrecorded stage, the
  most concrete gap between the wayfinding map and the system it
  describes.

- **G5. Rectification vs. user approval interaction is untouched.**
  Every stage but the plan has one human checkpoint removed
  (93–97). If the checker's FAIL report disagrees with what the user
  already approved at the plan ("the user's one approval"), there is no
  defined re-consultation: authority-kind tracker questions reach the
  user through the inbox (64–68) but nothing says a review dispute
  becomes one. The gate can silently override the user's approval, or
  the loop can spin; the map doesn't say which.

- **G6. The pro-active/re-active interleave is asserted, not defined.**
  "An inbox answer may itself produce the next entry-point document"
  (337–338) — but answers are recorded replies in seeded sessions whose
  settled job is "pose the question, discuss, record the answer"
  (120–123), not wayfinding. Who runs the entry-point tool in that
  session, against what confirmation, is open (332–341) while the
  boundary (139–142) simultaneously says only wayfinding products
  qualify. The engine's own chain-birth path from an answer is
  therefore currently impossible.

- **G7. "Rejected loudly" has no receiver.** Anything not a plan, or
  malformed, "is rejected loudly" (272–273) — but who hears it (the
  calling agent? the user? the sidebar?) and what state the rejected
  file lands in is unrecorded. A user-run `/spec` output disappears
  into this hole (see U-user-can-still-run-doors).

## 5. Scope creep / orphans

- **O1. Eleven of twenty-one skills have no recorded fate.**
  The survey names "the ten skills the transition has decided to touch"
  (survey 83–97). Never mentioned in any decision: `codebase-design`,
  `code-review`, `codifying`, `diagnosing-bugs`, `domain-modeling`,
  `grilling`, `maintaining-docs`, `prototyping`, `questionnaire`,
  `research`, `wizard`. "Bundle + register everything at setup" (290–291)
  presumably sweeps them in, but the map's change cloud (366–368) is
  unharvested, so nothing states they ship unchanged, and the umbrella
  spec's scope line ("the skills, commands, agent types…", 8–9) has no
  inventory behind it.

- **O2. Six commands have no recorded fate.**
  `/spec`, `/implement`, `/wayfind`, `/questionnaire`, `/wizard`,
  `/cut-release` never appear in a settled decision. `/cut-release` is
  the sharpest: release machinery is settled as "tag + GitHub Release
  page, releases tag only from a green main" (85–88, 102–106, 366–372),
  but the command that performs the gh choreography around SemVer bump
  and confirmation (survey 47–52) is left standing with its old body;
  QUESTIONS 466–484 left its re-scope explicitly undecided. Either the
  release chain has a human step the map says it doesn't, or `/cut-release`
  is dead and unburied.

- **O3. `/inbox` is silently repurposed.** The settled world has `/inbox`
  initiate the re-active workflow (235–238) and the inbox screen reached
  "by a command" (207–214); today's `/inbox` body calls `curate-inbox`
  (survey 36–37), which retires. The repurpose itself is never decided —
  the new body, the open-screen behavior, nothing. The retirement
  decision covers the skill and `/close-inbox` only.

- **O4. The folded checkpoints leave stale bodies no sweep covers.**
  Specifying's Approve / Approve-and-Slice / Stop-and-Amend options and
  `/slice`'s "one checkpoint for approval" (survey 44–46) live in files
  the checkpoint decision (93–97) made obsolete; the sweep list
  (survey 480–559) covers renames and dead items but has no rows for
  rewriting specifying's, slicing's, or implementing's execution cycles.
  The catalog will ship approval doors whose approvals were just folded
  away.

- **O5. `research` skill vs. the fact-finder; `code-review` skill vs.
  the reviewer.** The fact-finder is settled as "its own named agent
  type" for information-kind acquisition (116–119); the catalog already
  has a `research` skill whose job is acquiring answers from primary
  sources (survey skill descriptions). The reviewer agent type
  (177–180) coexists with the `code-review` skill (Standards/Spec
  axes). Neither pair is reconciled anywhere; the overlap is either
  intended division of labor (unrecorded) or duplicated machinery.

- **O6. Conventions and glossary are untouched by a change that breaks
  them.** On_Chains's four rails (`tracking`, `codifying`, `/inbox`,
  `/bootstrap`, survey 182–184) describe the pre-plugin world; its
  "commands are the doors" rule collides with C9. The "inbox"
  collision (D-inbox) needs a glossary decision. Neither `conventions/`
  file appears in any decision or sweep row.

- **O7. The installer-supersession still has no decisions/ home.** The
  map itself notes the channel's supersession of the installer's
  clone-only transport "is not yet recorded in `decisions/`" (53–54;
  survey 224–227). Until that record exists, two governing documents
  contradict and the new record's format/form is unspecified.

---

## Top ten fog

1. **C1 / G1 — the plan is reviewed and ungated at once;** the cascade's
   first link is self-contradictory, and a downstream plan flaw has no
   legal path to fix.
2. **C2 — the number of human stops is undecidable:** "one approval at
   the plan" vs. the spec "approved once (user)".
3. **C5 — the four settled agent types cannot be registered by the
   documented plugin API,** and the map settles them while flagging the
   keystone unverified.
4. **C4 / U-clearance — clearance's actor is both the agent and the
   user;** the engine's visible trigger cannot tell approval from tool-run.
5. **C8 — settled behaviors (session-loss recovery, always-awake
   advancement, sidebar-from-records, git-spec update) rest on keystones
   the map orders not to build on.**
6. **G3 / U-review-of-code — the implement stage's "work" has no
   records representation,** so the reviewer grades an undefined artifact
   against records-only verification.
7. **G2 — cap exhaustion has no terminal state;** loops can stall in an
   unlisted state forever despite the cap.
8. **U-engine-scope — "one project or the whole system" was asked and
   never answered,** the answered line resolving the other half of the
   question.
9. **O1/O2/O4 — 11 skills and 6 commands have no recorded fate, and the
   folded per-stage approvals leave stale bodies in three skills no sweep
   covers.**
10. **D-inbox / O6 — the "inbox" naming collision with OpenCode's own
    inbox is flagged by research but confronted by no decision or
    glossary entry.**