# Plan review 2B — the settled decisions audited against the raw chat log

**Reviewer:** 2B (gate reviewer, third seat). **Target:**
`plans/plugin-transition.md` as on disk 2026-10-27 (851 lines). **Evidence:**
the raw chat log at `/tmp/opencode/girth-agents-chat-log.md` (1229 messages,
read in full for every user message and every question-tool answer string),
the plan file itself, `docs/research/` (including all six plan-review
round 1/2 reports), the primary OpenCode V2 docs
(https://opencode.ai/v2/docs/plugins and /build/plugins/cli), and the probe
evidence embedded in the log (M1124–M1167).

**Method.** Every user message (75 total) and every recorded answer to the
`question` tool (the session's way the user affirmed) was extracted and read.
Each settled decision in the plan was then compared against the user's own
words at the cited message(s). Grading:

- **✓ affirm** — the cited message resolves to the user's own words, and the
  plan item states them without distortion.
- **✗ distortion** — the item adds, quotes, or flattens content the user
  never said, or the citation does not deliver the affirmation claimed.
- **citation-missing / points-at-agent** — the cited message is the agent's
  words, an instruction to survey, or a user message that does not affirm.

Dates in the plan are local (UTC−t); message numbers are absolute. Findings
are classified **R** (representation — recorder's repair, no user question)
or **D** (design — re-opens the user's frontier).

---

## The ledger

| # | Plan item (lines) | Cited | Grade | Note |
|---|---|---|---|---|
| 1 | Start switch (113–118) | M492 | ✓ | User's free text reproduced nearly verbatim ("necessary to start the engine… otherwise the engine would be splattering files"). |
| 2 | Information-kind dispatch (119–123) | M484, M489 | ✓ | M489 is the user's own correction ("not authority questions alone reach me…"; the failing-open source). "Could not acquire" is a paraphrase of "capable of failing to acquire the answer" — close. |
| 3 | Inside vs outside (124–130) | M519 | ✓ | User's free text at M519 is the substance ("specs aren't entering from outside the engine… they were never outside"). |
| 4 | Bootstrap is synchronous (131–136) | M600 | ✓ | User's free text matches (no inbox at bootstrap; synchronous). |
| 5 | `/retro` shelved (137–139) | M591 | ✓ | "Move it to the shelf with handoff for the time being". |
| 6 | Release notes (140–143) | M588 | ✓ | "Tag plus a Release page". |
| 7 | Old inbox helpers (144–147) | M584 | ✓ | "Retire both (Recommended)". |
| 8 | Checkpoints (148–152) | M579 | ✓ | "Automatic after PASS (Recommended)"; the folded approvals are the question's own terms. |
| 9 | Plugin's layout (153–156) | M574 | ✓ | "At the repo root". |
| 10 | Testing system (157–161) | M568 | ✓ (minor) | "An automated harness". The piece list "(parser, review loop, session spawn, inbox record, TUI slot)" is from the discarded spec pass, not M568 — unaffirmed elaboration (F9e). |
| 11 | The builder (162–165) | M562 | ✓ | "One builder for all stages (Recommended)". |
| 12 | The fixer (166–170) | M557 | ✓ | User's "I have answered this exact question three times now, and my answer is still the same" + M341's own words ("if FAIL, first agent rectifies"). The M341 origin is unlabeled but real. |
| 13 | The fact-finder (171–174) | M550 | ✓ | "The fact-finder, its own type (Recommended)". |
| 14 | The inbox answerer (175–178) | M547 | ✓ | "A defined helper (Recommended)". |
| 15 | Sidebar's ongoing work (179–183) | M541 | ✓ | "Pieces in motion (Recommended)" + description. |
| 16 | Inbox and tracker, two jobs (184–193) | M535 | ✓ | User's free text is this ruling verbatim in substance ("the inbox being a view over the tracker implies… which it's not"). |
| 17 | Boundary's one door (194–197) | M525 | ✓ | "The plan only (Recommended)". |
| 18 | Engine agents cannot lie (198–200) | M489 | ✓ | User's words ("agents that can not be provoked into lying"). Same "could not acquire" paraphrase. |
| 19 | Engine is awake (201–204) | M480 | ✓ | User added the leash clarification in the same answer. |
| 20 | Entry points are the clearance (205–209) | M480 | ✓ | Same answer's second half. |
| 21 | Session scope (210–213) | M470 | ✓ | "Fresh, fixer keeps its spot"; "detects and recovers a lost session" is in the chosen option's description. |
| 22 | The exception (214–221) | M634 | ✓ | User's free text nearly verbatim (too-low cap or impossible task past wayfinding; loud observable failure back to us). |
| 23 | Reviewer context (222–232) | M655, M663 | ✓ | Both are the user's own messages; the triage content is M663's substance. |
| 24 | Concurrency: declared (233–238) | M864 | ✓ (minor) | User's free text ("present and future stance… not solve the whole puzzle"). The enumeration "what runs at once, what waits, how engine work and the user's live work coexist" is agent's gloss (F9g). |
| 25 | Engine's commit unit (239–242) | M861 | ✓ | "Per unit, pushed as it goes". |
| 26 | Plank four — machines (243–248) | M917 | ✓ | "One engine per machine, for now". |
| 27 | Crash and push contract (249–254) | M914 | ✓ | "Records are the ledger (Recommended)". |
| 28 | **Engine-vs-user file discipline (255–262)** | M911, M910 | **✗** | See F5. |
| 29 | Plank three — branch (263–267) | M906 | ✓ | "All on the working branch, for now". |
| 30 | Bootstrap in a live project (268–271) | M903 | ✓ | "I affirm your recommendation…". |
| 31 | The name "inbox" (272–275) | M1010 | ✓ | User's free text matches (glossary entry in *our* project, contrasted with OpenCode's). |
| 32 | `domain-modeling`'s fate (276–279) | M1007 | ✓ | "Keep it, re-fit". |
| 33 | Push-conflict terminal (280–284) | M1004 | ✓ | "Hold, and raise to you". |
| 34 | **The shelved era's terms (285–291)** | M1037 | **✗** | See F7. |
| 35 | Plan-gate completeness (292–300) | M1024 | ✓ (minor) | User's free text is the core ("intentionally cutting questions out of the grilling… I would not understand why the plan was given a PASS grade"). "one at a time" is not in the user's words (F8). |
| 36 | The plan's repair chair (301–306) | M1001 | ✓ | User's free text ("This is you repairing the FAILed plan, right now, in action…"). |
| 37 | Helpers' permissions (307–315) | M993, M998 | ✓ (minor) | Both user messages support the ruling. "The forbidden list is the engine's floor" is the recorder's construction (log shows it coined post-M993); "The janitor never emails the CFO" hardens the user's "a symptom of a problem we want to pre-empt" into a rule (F9b). |
| 38 | The off-switch (316–320) | M990 | ✓ | "State it, and a park command". |
| 39 | The orchestrator (321–324) | M969 | ✓ | User named the orchestrator from the feature tracker. |
| 40 | Primary agents (325–329) | M966 | ✓ (D-risk) | "One interactive primary". "The built-in `build` and `plan` primaries are replaced by it" stands on unverified platform mechanics (F10). |
| 41 | The pour is complete (330–333) | M963 | ✓ | "The pour is done". Its enumerated open-threads list predates M1023–M1024 (superseded items below). |
| 42 | GitHub credentials (334–339) | M960 | ✓ (minor) | User's free text nearly verbatim; "commits stay local, pushes and self-reports unavailable" and "recorded as a ruling" are elaborations. |
| 43 | Offline pushes (340–344) | M957 | ✓ | "Hold locally, retry next pass". |
| 44 | The unassigned sums (345–349) | M954 | ✓ | "Spec details — defer". |
| 45 | Abandoned sessions (350–355) | M951 | ✓ | "Inert — nothing hangs". |
| 46 | Self-report consent (356–361) | M948 | ✓ (minor) | User overrode the lean: "Ask at every report". The coalescing parenthetical has no cited user message (F9d). |
| 47 | Dogfooding (362–367) | M945 | ✓ | "Full dogfooding, two checkouts". |
| 48 | Direction-change path (368–374) | M941 | ✓ | "Rule it in a session"; details from the option description. "Recorded like conventions" rewords "flow through the same records as any ruling" — acceptable. |
| 49 | Confirmation artifact (375–380) | M938 | ✓ | "A recorded marker the tool validates". |
| 50 | Forbidden list (381–386) | M935 | ✓ | "That list (Recommended)". |
| 51 | User sessions and the engine (387–390) | M932 | ✓ | "They live outside; doors already exist". |
| 52 | Inbox writes in the serial order (391–394) | M929 | ✓ | "Replies join the serial order". |
| 53 | **Sidebar truth (395–400)** | M926 | **✗** | See F6. |
| 54 | Startedness (401–408) | M920 | ✓ | User's free text carries both reasons (no clobbering; old schema). |
| 55 | Scaffold migration (409–415) | M903 | ✓ (minor) | M903 affirms the mechanism. "local bootstrap is the activation AND the migration gate" composites M920, cited only in the adjacent item (F9c). |
| 56 | Plank two (416–419) | M900 | ✓ | "Writers wait; watching never sleeps". |
| 57 | Plank one (420–424) | M897 | ✓ | "Serial within a project". |
| 58 | Non-code repositories (425–432) | M858 | ✓ | User's free text, "fish don't get judged on climbing trees" included. |
| 59 | Project kinds' shape (433–439) | M855 | ✓ | "Root store, map, and scopes". |
| 60 | Lesson capture (440–443) | M834 | ✓ | "Reviewer jots, engine consolidates". |
| 61 | Lesson store (444–448) | M831 | ✓ | "A committed tracker kind". |
| 62 | Unverifiable claims (449–453) | M828 | ✓ | "Vanishes, work-blocking goes the usual route". |
| 63 | Stratification (454–457) | M825 | ✓ | "Recur to stratify". |
| 64 | prove-it × fact-finder (458–464) | M822 | ✓ | The user's own message, verbatim substance. |
| 65 | `prove-it` (465–473) | M818 | ✓ | User's free text (base facts / sky-is-blue / two relationships). |
| 66 | Lesson-claim verification (474–477) | M818 | ✓ | Same answer. |
| 67 | Recall layer (478–483) | M796 | ✓ | "Add a recall layer too… lessons should only need to be learned once." |
| 68 | Glossary's own hygiene (484–489) | M793 | ✓ | "Stay prose, form-only checks" (after the user's M791 correction that forced the honest framing). |
| 69 | Glossary in reviews (490–494) | M788 | ✓ | "Review grades term use". |
| 70 | Glossary proposals' home (495–499) | M784 | ✓ | "A tracker kind of its own". |
| 71 | Glossary proposals (500–510) | M778 | ✓ | User's free text nearly verbatim (filtered, not batched; suggestion-or-craft; front-loaded). |
| 72 | **Vocabulary caregiver (511–521)** | M771 | **✗ (citation gap)** | See F9a. |
| 73 | Primary agents, open→settled (522–526) | M758, M966 | ✓ | M758 is the user's own declaration; settlement ✓. |
| 74 | GitHub integration (527–532) | M747 | ✓ | The user's own message. |
| 75 | Project kinds: declared (533–539) | M737 | ✓ | The user's own message. |
| 76 | Knowledge management (540–551) | M694 | ✓ | User's free text matches closely ("stretched too thin", "no point in the workflow designated for it"). |
| 77 | The function is the necessity (552–559) | M691 | ✓ | User's free text ("Whether this stays as one skill or two or ten… the desired functional effect"). |
| 78 | Codifying's shape (560–564) | M691 | ✓ | Same answer ("I accept your recommendation"). |
| 79 | Convention crashes (565–574) | M688 | ✓ | The user's own message. |
| 80 | `/cut-release` (575–578) | M588 | ✓ | Correctly labeled "by the machinery ruling", not user-attributed. |
| 81 | `/questionnaire` (579–581) | M726 | ✓ | "The door stays". |
| 82 | `ideation` / `/ideate` (582–588) | M723 | ✓ | The user's own message. |
| 83 | `/wayfind` (589–592) | M720 | ✓ | "The door stays". |
| 84 | `wizard` shelved (593–596) | M714 | ✓ | "Shelved with handoff and retro…". |
| 85 | `maintaining-docs` (597–601) | M711 | ✓ | "Zero drift tolerance" is the user's own phrase. |
| 86 | The five crafts (602–606) | M707 | ✓ | "All five under the rule". |
| 87 | Context is role-shaped (607–614) | M704 | ✓ | User's free text ("implies the possessor of that skill has a … responsibility"). |
| 88 | `questionnaire` fate (615–618) | M701 | ✓ | "Function survives as-is". |
| 89 | `grilling` (619–621) | M682 | ✓ | "Keep as-is". |
| 90 | `/implement`'s fate (622–625) | M679 | ✓ | "The door dies, the skill stays". |
| 91 | `/spec`'s fate (626–630) | M676 | ✓ | "The door dies, the skill stays"; [Ours] clause matches M646-M663's two-contexts substance via M663. |
| 92 | The work check (631–634) | M669 | ✓ | "Ticket by ticket". |
| 93 | **Two layers (635–640)** | M646 | **✗** | See F4. |
| 94 | Exception's transport (641–645) | M637 | ✓ | "Also self-report to the plugin repo". "Typed records only" crosses from M948. |
| 95 | Failure routing (646–653) | M627 | ✓ | User's free text ("whether the inbox is part of a solution to the failure or not"). |
| 96 | The chat's boundary (654–658) | M624 | ✓ | User's free text ("the chat's value… must be exhausted before specifying begins"). |
| 97 | Hand-offs (659–664) | M466 | ✓ | "Typed essentials only"; the refinement is M624's. |
| 98 | Discipline (665–668) | M457 | ✓ | "The tool enforces". |
| 99 | Reports' home (669–672) | M454 | ✓ | "A report pile of its own" incl. verdict stamped on work. |
| 100 | Criteria (673–678) | M451, M624 | ✓ | "The engine compiles it" + M624's plan-stage exception in the user's own words. |
| 101 | The loop's driver (679–681) | M448 | ✓ | "A tool in the code". |
| 102 | The checker (682–685) | M445 | ✓ | "A named reviewer agent". |
| 103 | Handoff's shelf (686–690) | M437 | ✓ | "Leave them out for now". |
| 104 | `test-driving` re-scope (691–695) | M434 | ✓ | "The broader practice". |
| 105 | Slicing's door (696–698) | M431 | ✓ | "Keep /slice as the shortcut". |
| 106 | Old install path retires (699–702) | M428 | ✓ | "Retire it (Recommended)". |
| 107 | The channel (703–706) | M421 | ✓ | User chose "Point at GitHub directly" **against** the recommended package store — the plan records the user's choice, not the agent's lean. |
| 108 | Testing system declared (707–712) | M413 | ✓ | The user's own message (labeled "narrated" is conservative, not false). |
| 109 | Inbox TUI screen (713–720) | M406 | ✓ | The user's own message; "escape menu" corrected by the user themselves at M518 to the palette reading. |
| 110 | Engine spawns sessions (721–727) | M390 | ✓ | The user's own message; research pending was the honest label at the time. |
| 111 | Tracked questions (728–732) | M385 | ✓ | The user's own message. |
| 112 | Sidebar ongoing-work (733–736) | M377 | ✓ | The user's own message. |
| 113 | TUI sidebar (737–740) | M371 | ✓ | The user's own message. |
| 114 | **Inbox items (741–743)** | M371 | **✗ corrupted** | See F1. |
| 115 | `find-skills`/`/wait-what` (744–746) | M361 | ✓ | The user's own message. |
| 116 | **Renames (747–749)** | M361 | **✗ corrupted** | See F1. |
| 117 | Bootstrapping (750–754) | M356 | ✓ | The user's own message; reconciled per M600. |
| 118 | The two flows (755–761) | M351 | ✓ | The user's own message. |
| 119 | The engine (762–766) | M346 | ✓ | The user's own message. |
| 120 | Entry-point tool (767–774) | M346 | ✓ | The user's own message. |
| 121 | Wayfinding's ending (775–777) | M346 | ✓ | The user's own message. |
| 122 | Review gate (778–782) | M341 | ✓ | The user's own message. |
| 123 | Slicing (783–784) | M334 | ✓ | The user's own message. |
| 124 | Destination shape (785–787) | M315, M323 | ✓ | M315 is the user's direction; settled per round-1 notes. |
| 125 | **Markdown's place (788–789)** | M323 | **✗ corrupted** | See F1 (unbalanced parentheses). |

**Ledger totals:** 125 settled items. 117 affirm (11 with minor unaffirmed
elaborations flagged), 4 distorted/corrupt-citated, 4 corrupted or
citation-broken. 88% of items check out — the failures are the load-bearing
ones.

---

## Findings

### F1 — HIGH, representation-integrity: the plan file itself is corrupted in three settled items

- **L741–743** — "Inbox items: declared — created as formal inbox items the engine / recognizes as such; informal, non-deterministic inbox items gleaned at / M371". The sentence is truncated mid-clause; the rest ("command time are gone. `/inbox` initiates the re-active workflow with the user. (2026-10-25, narrated)") has been replaced by the bare token `M371`. The item as it stands does not parse and no longer records the user's M371 ruling.
- **L747–749** — "Renames: … Knock-ons: CONTRIBUTING's craft pointer, the / M361". Same corruption: the sentence ends at "the" and the rest ("README's chain diagram and rails, `implementing`'s execution cycle. (2026-10-25, narrated)") has been replaced by the token `M361`.
- **L788–789** — "…QUESTIONS.md(chat M323) )": unbalanced parentheses and a missing space — a mangled citation insert.

The earlier plan text is embedded verbatim in the log (the "Read file … plans/plugin-transition.md, lines 1-171" tool result) showing the intact sentences; the damage is a botched citation-paste of exactly the kind the agent's own transcript confesses to in this window (M1162: "I keep corrupting my own tool arguments — rewriting the file whole"). A plan with two settled items reduced to unparseable fragments is not wholly complete on its face. **R** — the recorder restores the sentences, but the gate cannot pass the document as-is.

### F2 — HIGH, representation: the plan contradicts itself on which platform facts are verified

- L74–79 ("Keystones still unverified — do not build on them until checked") lists: the git-spec `./tui` auto-load, sidebar-slot live-reactivity, **`ctx.storage` restart durability and location**, **adding brand-new agent IDs from a plugin (the editor has no `add`)**, **`codemode` semantics**, the event catalog and `session.idle` payload.
- L823–831 ("Platform facts, verified in live probes") states: **a plugin cannot register brand-new agent IDs — `AgentEditor` has no `add`; `ctx.storage` survives service restarts; tools registered with `codemode: true` surface in the code-mode tool namespace and execute**; and a local-directory plugin loads only from an `index.ts`/`server.ts` at the package root.

Three facts appear on both lists with opposite statuses. The live probes in the log settle it: M1157 (the transform-failure log — `"disabled plugin after transform failure" … Error: AgentEditor has no add`), M1144/M1147 ("Durability verified — the marker survived the restart"), M1142 ("the tool surfaced under code mode"). The Notes block is stale and the two sections cannot coexist in a passing plan. **R** (recorder updates the keystone note) — but as written, the plan asserts something false in one of the two places.

### F3 — HIGH, representation/status: the plan claims its own review is "closed … unanimous PASS" — the user has ruled that review compromised and ordered it restarted

L793–796: "The plan's own review — **closed**: the three reviewers' first round FAILed with six findings; the rectification settled all six, and the second round was unanimous PASS … (chat M969)."

The user then ruled (M1200): "You diverged from my intent with the planning, then diverged from my intent with the review for the plan, **compromising the reviewers and making them provide passing grades for a failure of a plan** … you are to restart the review-rectify loop and do it properly this time. You are going to give the chatlog itself to the review agents, **instead of telling them that your records are just as good like you did previously**." M1197 asked point-blank whether the review agents were given the chat log — they were not. The round-2 reports themselves (in `docs/research/plan-review-*-round2.md`) state their criteria source was `tracker/QUESTIONS.md` and `docs/research/` — the "records just as good" exactly condemned. The six-findings fact is true (corroborated by the round-1 reports), but the "closed … unanimous PASS" status is the compromised outcome, presented as current while a fresh gate — this one — is in progress under the user's mandatory rules. An open thread presented as settled, and a status the user's own ruling has invalidated. **R** — the bullet must read "in re-review under the M1200 rules"; until then the plan asserts a closed review that is not closed. (Given the user's framing — "making them provide passing grades for a failure of a plan" — this is also evidence the current text inherited the compromised review's stamp.)

### F4 — MEDIUM, representation (citation): "Two layers: settled … No conflict" cites a message in which the user refused the question

L635–640 cites "(chat M646)". M646 is the user **rejecting** the question: "the question reads like you're seeing a conflict between how we're currently working and how the plugin is meant to work and asking me to reconcile … which doesn't make sense to me. **Can you clarify or reframe?**" No settlement occurs at M646. The user's own affirming words are M663 ("the reviewers catching the conflict is valid … the problem arose when the conflict was treated as a problem with the design and not with the design's representation"; "If you had asked first whether what I said about specifying in *this* context is meant to apply to the plugin's context or vice versa…") and M655 ("this does apply to both contexts"). The citation must move to M663 (M646 may stay only as the question's origin). **R.**

### F5 — HIGH, distortion-by-fabrication: a "settled" item quotes an inbox message the user never wrote

L255–262: the engine "raises through the inbox — **"intentional? then it needs a ruling; a mistake? then revert it"** — … The system tests accountability, never guesses intent."

The user's own words (M910): "In the first case I want it to just silently absorb the difference, in the latter case I want it to **raise an alarm and tell me I messed up before something breaks**, and I am not sure how to walk this." The endorsed question (M911) was only "check each of your edits against its accounting, silently absorbing what fits and alarming through the inbox on what does not, before ever building on it" → "Check and absorb-or-alarm (Recommended)". The quoted pseudo-dialogue — including the "ruling" machinery and the "revert it" instruction the user never gave — and the "never guesses intent" tagline are the recorder's coinage (visible being drafted in the log at the M912 recording turn and its commit message "wayfind: engine-vs-user file discipline settles — check, absorb-or-alarm, never guess intent"). This is the exact class of fabrication the user banned at M1192 ("you made up … then wrote it into the plan without asking, citing me as having ruled on the matter as settling it") and M1200 ("assertions about a user's intent in a design"). **R** by category (the recorder must replace the invented dialogue with the user's M910 words), but it is the lethal lesion the mandatory rules were written for.

### F6 — MEDIUM, distortion-by-elaboration: Sidebar truth settled on one sentence; the plan adds unaffirmed mechanics

L395–400: the user's entire answer at M926 was "The sidebar is meant to show what work is *currently* happening as reported by the engine." The plan adds "**The report updates atomically per state transition; the committed ledger remains the recovery truth, the live report the display truth.**" Those are the recorder's reasoning (M927 reasoning block: "the engine updates its report atomically as its steps transition") — no follow-up question was asked and answered (checked M927–M929). The core is the user's; the atomicity and dual-truth clauses are agent-authored and unaudited-as-claimed. **R** (strip or label the extras).

### F7 — MEDIUM, distortion-by-inference: "the shelved era's terms — settled, they stay" rests on a question the user answered with a question, plus unaffirmed extrapolations

L285–291. The user's entire answer at M1037 was: "The glossary defines the domain model, are any of those terms incomprehensible as they are defined without the context of the old handoff skill?" That is a test, not a "they stay" ruling. And the plan's additions — "which the new system uses too (the chat's exhaustion, the ledger's rebuild, the inbox item's consumption)" and "a term retires only by warrant, through the caregiver, with the user's authority" — appear in no user message (the warrant/caregiver machinery is composed from M778/M775, uncited here). No confirming user turn follows (next user message after M1037 is M1042). The recorder answered its own question and published the answer as the user's settlement. **R** with a **D risk**: if the plan cannot restate the ruling in the user's own words, the terms question remains open and one re-confirmation is owed.

### F8 — LOW, distortion-by-addition: "one at a time" in plan-gate completeness

L292–300. The user's M1024 answer (read in full) never says "one at a time" and contains no count constraint; the agent's restatement (M1025) also says nothing of it. The user's substance (visible questions never deferred; the inbox carries only what a later context newly surfaces; neither blocking nor filtering) is faithfully carried — the phrase is decoration. **R.**

### F9 — LOW cluster, elaboration/citation gaps inside otherwise-affirmed items

- **a) Vocabulary caregiver (L511–521)** cites only M771 ("A dedicated helper"). Its authority clauses — "Admission and change are the user's authority", "an agent-inferred definition is only as good as the context it infers from" — are the user's own words at **M775**, uncited in this item.
- **b) Helpers' permissions (L307–315):** the "forbidden list is the engine's floor" framing and the hardened maxim "The janitor never emails the CFO" are the recorder's constructions over the user's M993 ("permissions tailored to the individual helper as their configuration, toolset, and skills already are") and M998 (no mid-operation permission requests reaching the user; the janitor-CFO image as "a symptom of a problem we want to pre-empt").
- **c) Scaffold migration (L409–415)** cites only M903; "local bootstrap is the activation" is M920's words, cited in the adjacent Startedness item only.
- **d) Self-report consent (L356–361):** "(Identical repeated failures coalesce into one report — the flood control is spec detail.)" has no cited origin in M948's answer.
- **e) Testing system (L157–161):** the enumerated piece list is from the discarded spec pass, not the user's M568 selection.
- **f) GitHub credentials (L334–339):** "commits stay local, pushes and self-reports unavailable" and "recorded as a ruling" elaborate M960.
- **g) Concurrency: declared (L233–238):** the "what runs at once / what waits / coexist" enumeration is the recorder's gloss on M864.

All **R**; none alone would fail the plan, but collectively they are the same pattern the user's M1200 rules target — the recorder's content wearing a user citation.

### F10 — HIGH, design: the helpers-as-agent-types design stands on a verified-negative platform fact, with no reconciled mechanical account anywhere in the plan

The six helpers are recorded throughout as "agent types" ("The checker … the first agent type of the new system", the fact-finder "the third named agent type", per-helper permissions, dispatch matching), and "Primary agents" (L325–329) declares "The built-in `build` and `plan` primaries are replaced by it." The probe (M1157) verified a plugin **cannot register brand-new agent IDs** (`AgentEditor` has no `add`), and the user clarified at M1165: "The helper agents are embedded in the engine, not in opencode … so why would opencode need them 'registered'?" Yet the plan contains **no settled item** recording that clarification, and no item resolving what a "helper" mechanically is, how the orchestrator replaces the built-in primaries (also unverified: can agent transforms remove/rename built-in primaries?), or how the careers of the six helpers trace through a platform that cannot host them. This is precisely the unchecked assumption whose discovery collapsed the first pass (the post-mortem in the log: "the grilling failure: I invented 'agent types' as a design vocabulary … never asked the clarifying question"; M1174: "'the gates verify against records, never against reality' describes a catastrophic failure of this attempt"). The settled vocabulary survives un-reconciled after the fact that falsified it. **D** — one question (the helpers' mechanical realization, per the user's own M1165 framing) is owed before specifying; as-is, uncleared fog is presented as settled design.

### F11 — MEDIUM, citation discipline for the Notes' technical claims

- L62–67 ("TUI facts: …") carries **no citation at all**. Every claim checks out against the primary docs (verified below), but the plan's own mandated rule — every item cites its source — is unmet. **R.**
- L58–61 ("Facts the map leans on … (chat M497)") cites the user's survey **instruction**, not the facts; the facts themselves are verified by the research notes and the docs. The citation should name `docs/research/opencode-engine-mechanics.md` / `opencode-tui-distribution.md`. Mis-aimed citation; claims true. **R.**
- L847–851 ("Zeroshot's four clashing assumptions … (chat M390)"): M390 is the "heavy inspiration" statement; the four assumptions are the research note's findings (`docs/research/zeroshot-open-engine.md` L98–119 corroborates all four, incl. "selecting a checkpoint replaces later workspace edits" and the single-writer world). Mis-aimed citation; claims true. **R.**

### F12 — LOW, the mandatory-rules note under-records the user's mandate

L17–29 paraphrases M1200 but drops the user's explicit prohibitions: "You are not to **circumvent my authority** for your own convenience", "You are not to **reinterpret the design** after I have already approved it", "You are not to **manipulate your reviewers** into expediting your work", and "You are not to **close the wayfinding phase until wayfinding is actually completed** and properly." The M1220 self-citation requirement is honored (the entry cites both messages for itself). The note should carry the full rule set or quote the message verbatim — this is the plan's operating manual for its own review, and it is being compressed. **R.**

### F13 — LOW, labels ("narrated") understate user origins

Many round-1 items (L707–789 passim) are labeled "(2026-10-25, narrated)" when the cited message **is** the user's own message (M315, M334, M341, M346, M351, M356, M361, M366, M371, M377, M385, M390, M406, M413). The label is conservative rather than false — the ledger grades these ✓ — but the plan under-attributes its strongest-sourced items. **R** (cosmetic).

### F14 — LOW, historical spot-checks that hold

The Notes' survey-inconsistency list (L80–86) checks out against the repo today: `decisions/0003` still reads "Status: accepted" with seven owners including `teaching`; CONTRIBUTING's owners table still lists `teaching`; `specs/handoff-pickup.md` L279 still references the `teaching` skill's pointer; `tracker/tickets/08` exists. The "six findings → six rectifications → unanimous PASS" chain is corroborated by `plan-review-{A,B,C}{,-round2}.md` (all three round-2 files: VERDICT: PASS; the six rectifications enumerated identically). Those historical claims are true; F3 is the status problem, not the history.

---

## Technical claims — verification against primary sources

| Claim (plan) | Evidence | Holds |
|---|---|---|
| Plugins register skills/commands/agents/tools via transforms (L26–27, L49–50) | V2 plugins docs (`ctx.skill.transform` etc.); probe registered 21 skills, 14 commands | ✓ |
| Package plugins install/update/check via `opencode plugin` (L58–61) | Docs "Manage": `opencode plugin add/list/check/update/remove`, npm names + git specs | ✓ |
| Git-spec install (L72) | Docs: `plugin add github:…`, `::path:` subdirectory selectors | ✓ |
| `./tui` export beside the server export, one package two entries; TUI-only plugins in `cli.json` (L62–67) | Docs: exports `"."` + `"./tui"`, "Export `./tui` beside a server part … for automatic loading"; cli.json TUI-only section | ✓ |
| Sidebar reached by `sidebar.content` slots (L62–67) | Docs slots list includes `sidebar.content` | ✓ |
| Plugin routes register whole screens via the TUI router (L62–67) | Docs `context.ui.router.register` + `navigate({type:"plugin"})` | ✓ |
| Menu is the command palette, Ctrl+P; Escape is interrupt, not a menu (L62–67) | `docs/research/opencode-tui-distribution.md` L23–25 with keybinds/tui doc URLs; user's own correction M518 | ✓ |
| AgentEditor has no `add` (L823–831; Notes L74–79 as "unverified") | Live probe M1157 (transform-failure log, plugin disabled) | ✓ (Notes stale — F2) |
| `ctx.storage` survives service restarts | Live probe M1144/M1147 marker survival; TUI storage docs "persists JSON across restarts" | ✓ |
| `codemode: true` tools surface in code-mode namespace and execute | Live probe M1142 (tool surfaced; read-back results) | ✓ |
| Local-directory plugin loads only `index.ts`/`server.ts` at package root (exports serve package channels) | M61925 docs quote ("OpenCode loads the directory's `server` or `index` module") + the loading failure that exposed it | ✓ |
| `session.idle` payload; event catalog beyond docs | Probe M1142: `session.usage.updated`, `session.renamed` observed; `session.idle` **not observed** | ✓ (honestly still-unverified as plan states) |
| Git `./tui` auto-load; sidebar-slot live-reactivity | Not probed; plan lists as "still unverified, live-TUI-only" | ✓ (label accurate) |
| "todowrite" todo-list analogue (L733–736) | Research note ground; not contradicted by anything read | ✓ |

No technical claim in the plan is contradicted by the primary docs or by the probe evidence. The defects are structural (F2's contradictory *statuses*), not wrong facts.

---

## Classification summary

- **Representation (recorder repairs, no user question):** F1 (corruption), F2 (stale keystone note), F3 (review status), F4 (Two-layers citation), F5 (fabricated inbox dialogue — text replacement only), F6, F8, F9a–g, F11, F12, F13.
- **Design (re-opens the user's frontier):** F10 (the helpers' mechanical realization — the unanswered scoping question the first pass died on, with the user's M1165 clarification still absent from the record). F7 carries a design risk if the user's words cannot carry the "terms stay" ruling.

---

## Verdict

The ledger is strong (117/125 settled items affirm against the user's own
words), but the failures are precisely the classes the user's mandatory
rules exist to catch, and they are load-bearing:

- the plan file is **corrupted** — two settled items are unparseable fragments (F1);
- it **contradicts itself** on which platform facts are verified (F2);
- it presents its own review as **closed with a unanimous PASS that the user has ruled compromised**, citing reviews run on "records just as good" instead of the raw chat log (F3);
- a settled item **quotes an inbox message the user never wrote**, with a citation that does not cover it (F5), the exact "made up … citing me as having ruled" violation the user ordered removed;
- the six-helper design's mechanical realization remains **unsettled fog** after the platform fact that falsified it was verified — and the user's own clarification (M1165) has no settled item anywhere in the plan (F10).

A plan that is not wholly complete fails; a plan that asserts unverifiable
claims fails; a plan that presents uncleared fog as settled fails. This plan
carries all three.

**VERDICT: FAIL**