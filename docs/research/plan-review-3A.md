# Plan review 3A — intent claims audited against the raw chat log

**Reviewer A — round 3 (intent-claims focus, per the user's standing
assignment at chat M1262).** Target: `plans/plugin-transition.md` (895
lines). Evidence: the raw log snapshot
`/tmp/opencode/girth-agents-chat-log-round3.md` (M1–M1306, exported at
this review's launch), the three round-2 reports being regressed, and
the plan on disk.

**Method.** Every settled plan item was checked against the message its
citation names, read in this log: user text messages verbatim, and
question-tool answer rounds (the user's answers recorded inside the
cited assistant message's tool results). A citation that lands on the
agent's question, an option's text, or another topic is graded invalid
unless the cited message contains the user's own answer. Round-2
findings (2A/2B/2C) were each checked for genuine resolution against
the current plan.

---

## The ledger

| # | Plan item (lines) | Cited | Grade | Note |
|---|---|---|---|---|
| N1 | Three focuses (17–22) | M1262 | ✓ | User's words carried; "constrains nothing else they may grade on" is M1262's clause. |
| N2 | Citation access (23–27) | M1262 | ✓ | "request the message based on the citation" is the user's phrase. |
| N3 | Snapshot timing (28–33) | M1269 | ✓ | M1269 verbatim in substance; the interim-practice sentence is unlabeled agent mechanism (minor). |
| N4 | Mandatory rules (34–47) | M1200, M1220 | ✓ (partial) | All rules present and verbatim-true; the four "You are not to …" prohibitions still omitted (2B F12 unfixed). |
| N5 | Two layers, reviewers honor them (49–63) | *uncited* | ✓/◇ | True to M655/M663; the bullet itself carries no `(chat M#)`. |
| N6 | Catalog identity (65–68) | M323 | ✓ | "Bundle + register at setup (Recommended)" — the user's own selection. |
| N7 | Change set "too disorganized" (69–72) | M315, M418 | ✗ citation | The phrase lives in M323's answer, not M315/M418 (2A F10 unfixed). |
| N8 | Installer-experience ruling (73–75) | M421 | ✓ | M421's later supersession of the survey-era ruling; consistent. |
| N9 | Facts the map leans on (76–80) | M497 | ◇ | M497 is the survey *order*; the facts check out but are cited to the instruction (2B F11 unfixed). |
| N10 | TUI facts (81–86) | *uncited* | ◇ | Claims true against docs (2B/2C verified); no citation at all (2B F11 unfixed). |
| N11 | Ground research (87–92) | M497 | ✓ | M497 ordered the survey; notes exist. |
| N12 | Keystones still unverified (93–99) | M1126 | ✓ | Reconciled with platform facts (2B F2 fixed). |
| N13 | Survey findings (100–104) | M497 | ✓ | Two false repo-claims removed ("were since folded") — 2A F7/2C F2 fixed. |
| N14 | Questioning notes (105–110) | M418, M621 | ✓ | M621's own words carried. |
| N15 | Three-perspective review (111–127) | M497, M870 | ✓ | M870 ordered the pass; four threads map to settled entries. |
| D1 | Start switch (131–136) | M492 | ✓ | "would be splattering files wherever opencode's working dir happened to be" — user's words. |
| D2 | Information dispatch (137–141) | M484, M489 | ✓ | M489's correction carried. |
| D3 | Inside vs outside (142–148) | M519 | ✓ | User's correction text at M519 is the substance. |
| D4 | Bootstrap synchronous (149–155) | M600 | ✓ | "very synchronous… no inbox yet" — user's words. |
| D5 | `/retro` shelved (155–157) | M591 | ✓ | "Move it to the shelf with handoff". |
| D6 | Release notes (158–161) | M588 | ✓ | "Tag plus a Release page". |
| D7 | Inbox helpers retire (162–165) | M584 | ✓ | "Retire both (Recommended)". |
| D8 | Checkpoints (166–170) | M579 | ✓ | "Automatic after PASS (Recommended)". |
| D9 | Plugin layout (171–174) | M574 | ✓ | "At the repo root". |
| D10 | Testing system (175–179) | M568 | ✓ | "An automated harness (Recommended)"; the piece list is **inside M568's adopted option description**, so 2B F9e's premise was wrong — not a gloss. |
| D11 | Builder (180–183) | M562 | ✓ | "One builder for all stages (Recommended)". |
| D12 | Fixer (184–188) | M557 | ✓ | "answered this exact question three times"; "the first agent rectifies" is M341 verbatim. |
| D13 | Fact-finder (189–193) | M550 | ✓ | "The fact-finder, its own type (Recommended)". |
| D14 | Inbox answerer (194–196) | M547 | ✓ | "A defined helper (Recommended)". |
| D15 | Sidebar ongoing (197–201) | M541 | ✓ | "Pieces in motion (Recommended)". |
| D16 | Inbox/tracker two jobs (202–210) | M535 | ✓ | User's M535 words carried nearly verbatim; "by reference, never copied" removed (2A F8 fixed). |
| D17 | Boundary's one door (211–214) | M525 | ✓ | "The plan only (Recommended)". |
| D18 | Cannot lie (215–217) | M489 | ✗ minor | User said "capable of failing to acquire the answer"; the quoted report-string **"could not acquire"** is recorder coinage (2A F8 unfixed). |
| D19 | Engine awake (218–221) | M480 | ✓ | "Your recommendation, with the clarification…". |
| D20 | Entry clearance (222–226) | M480 | ✓ | Same answer's second half. |
| D21 | Session scope (227–230) | M470 | ✓ | "Fresh, fixer keeps its spot (Recommended)". |
| D22 | Exception (231–238) | M634 | ✓ | User's near-verbatim ruling. |
| D23 | Reviewer context (239–249) | M655, M663 | ✓ | Both user messages verified; "does this apply here or there?" is a compressed quote of M663's longer sentence (minor). |
| D24 | Concurrency declared (250–255) | M864 | ◇ | User's words carried; the "what runs at once…" enumeration is the recorder's gloss (2B F9g unfixed). |
| D25 | Commit unit (256–259) | M861 | ✓ | "Per unit, pushed as it goes (Recommended)". |
| D26 | Machines (260–265) | M917 | ✓ | "One engine per machine, for now (Recommended)". |
| D27 | Crash/push contract (266–271) | M914 | ✓ | "Records are the ledger (Recommended)". |
| D28 | **File discipline (272–282)** | M910 | **✗ status-inverted** | See R1. The user's two-case words quoted verbatim ✓; but the walk is labeled "unruled", when the user endorsed it at M911. |
| D29 | Branch placement (283–287) | M906 | ✓ | "All on the working branch, for now (Recommended)". |
| D30 | Bootstrap in a live project (288–291) | M903 | ✓ | "I affirm your recommendation…". |
| D31 | Inbox name (292–295) | M1010 | ✓ | User's own wording incl. "*our project*" glossary entry. |
| D32 | domain-modeling fate (296–299) | M1007 | ✓ | "Keep it, re-fit (Recommended)". |
| D33 | Push-conflict terminal (300–304) | M1004 | ✓ | "Hold, and raise to you (Recommended)". |
| D34 | Shelved era's terms (305–314) | M1037 | ✓ fixed | OPEN, agent-inference admitted, "the answer is the user's" — 2A F5/2B F7 fixed. No user answer appears anywhere after M1037 (checked M1042–M1061, M1124, M1170–M1306). |
| D35 | Plan-gate completeness (315–323) | M1024 | ◇ | User's M1024 substance carried; "one at a time" is not in the user's words (2A F8/2B F8 unfixed). |
| D36 | Repair chair (324–329) | M1001 | ✓ | "This is you repairing the FAILed plan, right now, in action" — verbatim. |
| D37 | Helpers' permissions (330–341) | M993, M998 | ✓ | M993 verbatim ✓; the janitor-CFO metaphor is M998's own words ✓; the orchestration mechanism explicitly labeled as the map's, not the user's (2B F9b fixed). |
| D38 | Off-switch (342–346) | M990 | ✓ | "State it, and a park command (Recommended)". |
| D39 | Orchestrator (347–350) | M969 | ✓ | User named the orchestrator from the feature tracker. |
| D40 | Primary agents (351–355) | M966 | ✓ | "One interactive primary (Recommended)"; tail "(…user; named 2026-10-27, user)" garbled (2C F5 unfixed). |
| D41 | **Helpers' realization (356–365)** | M1165, M1126 | ✓ | New settled entry; M1165's tool result carries the user's verbatim answer ("The helper agents are embedded in the engine, not in opencode…") — the round-2 F10 fog is cleared. "Agent type" phrasing elsewhere is compatible with the user's own "helper agents". |
| D42 | Pour complete (366–372) | M963 | ✓ then ✗ sentence | M963 ✓ ("The pour is done (Recommended)"); the appended sentence "The round-2 review reopened two threads…" is false for the walk half (see R1). |
| D43 | GitHub credentials (373–378) | M960 | ◇ | User's words carried; "commits stay local, pushes unavailable" and "recorded as a ruling" are uncited elaborations (2A F8/2B F9f unfixed). |
| D44 | Offline pushes (379–383) | M957 | ✓ | "Hold locally, retry next pass (Recommended)". |
| D45 | Unassigned sums (384–388) | M954 | ✓ | "Spec details — defer (Recommended)". |
| D46 | Abandoned sessions (389–394) | M951 | ✓ | "Inert — nothing hangs (Recommended)". |
| D47 | Self-report consent (395–400) | M948 | ✓ | "Ask at every report"; the coalescing gloss now explicitly labeled uncited/open (2A F8 fixed). |
| D48 | Dogfooding (401–406) | M945 | ✓ | "Full dogfooding, two checkouts (Recommended)". |
| D49 | Direction changes (407–413) | M941 | ✓ | "Rule it in a session (Recommended)". |
| D50 | Confirmation artifact (414–419) | M938 | ✓ | "A recorded marker the tool validates (Recommended)". |
| D51 | Forbidden list (420–425) | M935 | ✓ | "That list (Recommended)". |
| D52 | User sessions (426–429) | M932 | ✓ | "They live outside; doors already exist (Recommended)". |
| D53 | Inbox writes (430–433) | M929 | ✓ | "Replies join the serial order (Recommended)". |
| D54 | Sidebar truth (434–436) | M926 | ✓ | Only the user's words now; atomicity/dual-truth gloss removed (2A F8/2B F6 fixed). |
| D55 | Startedness (437–444) | M920 | ✓ | User's own two reasons. |
| D56 | Scaffold migration (445–451) | M903 | ◇ | M903 carries the migration gate; the "activation" half is M920's, uncited here (2B F9c unfixed). |
| D57 | Plank two (452–455) | M900 | ✓ | "Writers wait; watching never sleeps (Recommended)". |
| D58 | Plank one (456–460) | M897 | ✓ | "Serial within a project (Recommended)". |
| D59 | Non-code repos (461–468) | M858 | ✓ | "Fish don't get judged on climbing trees" — user's words. |
| D60 | Project kinds' shape (469–475) | M855 | ◇ | "Root store, map, and scopes (Recommended)"; the option itself says "per-package files only on warrant" ✓; "recorded as a deviation like any other" is not in option or answer (2A F8 unfixed). |
| D61 | Lesson capture (476–479) | M834 | ✓ | "Reviewer jots, engine consolidates (Recommended)". |
| D62 | Lesson store (480–484) | M831 | ✓ | "A committed tracker kind (Recommended)". |
| D63 | Unverifiable claims (485–489) | M828 | ✓ | "Vanishes, work-blocking goes the usual route (Recommended)". |
| D64 | Stratification (490–493) | M825 | ✓ | "Recur to stratify (Recommended)". |
| D65 | prove-it × fact-finder (494–500) | M822 | ✓ | User's own message verbatim in substance. |
| D66 | prove-it (501–509) | M818 | ✓ | User's sky-is-blue / two-kind split. |
| D67 | Lesson-claim verification (510–513) | M818 | ✓ | Same answer. |
| D68 | Recall layer (514–519) | M796 | ✓ | "lessons should only need to be learned once" — user's words. |
| D69 | Glossary hygiene (520–525) | M793 | ✓ | "Stay prose, form-only checks (Recommended)". |
| D70 | Glossary in reviews (526–530) | M788 | ✓ | "Review grades term use (Recommended)". |
| D71 | Proposals' home (531–535) | M784 | ✓ | "A tracker kind of its own (Recommended)". |
| D72 | Proposals (536–546) | M778 | ✓ | User's filtered-not-batched, suggestion-or-craft, front-loaded words. |
| D73 | Caregiver (547–557) | M771 | ◇ | ✓ for the helper itself; the authority clauses are the user's M775 words, uncited in this item (2B F9a unfixed). |
| D74 | Primaries open→settled (558–562) | M758, M966 | ✓ | M758's declaration verified ("build and plan don't make sense…"); settlement at M966. |
| D75 | GitHub integration (563–568) | M747 | ✓ | User's own message. |
| D76 | Project kinds declared (569–575) | M737 | ✓ | User's own message. |
| D77 | Knowledge management (576–587) | M694 | ✓ | User's free text carried. |
| D78 | Function is necessity (588–595) | M691 | ✓ | User's free text ("function is the necessity"). |
| D79 | Codifying (596–600) | M691 | ✓ | "I accept your recommendation…" same answer. |
| D80 | Convention crashes (601–610) | M688 | ✓ | User's own message. |
| D81 | `/cut-release` (611–614) | M588 | ✓ | Labeled "by the machinery ruling" — honest. |
| D82 | `/questionnaire` (615–617) | M726 | ✓ | "The door stays (Recommended)". |
| D83 | ideation + `/ideate` (618–624) | M723 | ✓ | User's own message. |
| D84 | `/wayfind` (625–628) | M720 | ✓ | "The door stays (Recommended)". |
| D85 | wizard shelved (629–632) | M714 | ✓ | "Shelved with handoff and retro…" — user's words. |
| D86 | maintaining-docs (633–637) | M711 | ✓ | "zero drift tolerance" — user's phrase. |
| D87 | Five crafts (638–642) | M707 | ✓ | "All five under the rule (Recommended)". |
| D88 | Context role-shaped (643–650) | M704 | ✓ | User's free text. |
| D89 | questionnaire fate (651–654) | M701 | ✓ | "Function survives as-is (Recommended)". |
| D90 | grilling (655–657) | M682 | ✓ | "Keep as-is (Recommended)". |
| D91 | `/implement` (658–661) | M679 | ✓ | "The door dies, the skill stays (Recommended)". |
| D92 | `/spec` (662–666) | M676 | ✓ | Same; [Ours] clause per M663. |
| D93 | Work check (667–670) | M669 | ✓ | "Ticket by ticket (Recommended)". |
| D94 | Two layers (671–676) | M663 (+M646) | ✓ | Fixed: M663 carries it, M646 named only as origin (2A F4/2B F4 fixed). |
| D95 | Exception transport (677–681) | M637 | ✓ | "Also self-report to the plugin repo". |
| D96 | Failure routing (682–689) | M627 | ✓ | User's free text. |
| D97 | Chat boundary (690–694) | M624 | ✓ | User's free text. |
| D98 | Hand-offs (695–700) | M466 | ✓ | "Typed essentials only (Recommended)"; M624 refinement. |
| D99 | Discipline (701–704) | M457 | ✓ | "The tool enforces (Recommended)". |
| D100 | Reports' home (705–708) | M454 | ✓ | "A report pile of its own (Recommended)". |
| D101 | Criteria (709–714) | M451, M624 | ✓ | "The engine compiles it (Recommended)" + M624's plan-stage exception. |
| D102 | Loop driver (715–717) | M448 | ✓ | "A tool in the code (Recommended)". |
| D103 | Checker (718–721) | M445 | ✓ | "A named reviewer agent (Recommended)". |
| D104 | Handoff shelf (722–726) | M437 | ✓ | "Leave them out for now (Recommended)". |
| D105 | test-driving re-scope (727–731) | M434 | ✓ | "The broader practice (Recommended)". |
| D106 | Slicing door (732–734) | M431 | ✓ | "Keep /slice as the shortcut (Recommended)". |
| D107 | Install path retires (735–738) | M428 | ✓ | "Retire it (Recommended)". |
| D108 | Channel (739–742) | M421 | ✓ | "Point at GitHub directly" — against the recommended package store; recorded faithfully. |
| D109 | Testing declared (743–748) | M413 | ✓ | User's own message. |
| D110 | Inbox screen (749–756) | M406 | ✓ | User's own message (palette correction at M518 applies). |
| D111 | Engine spawns sessions (757–763) | M390 | ✓ | User's own message. |
| D112 | Tracked questions (764–768) | M385 | ✓ | User's own message. |
| D113 | Sidebar ongoing (769–772) | M377 | ✓ | User's own message. |
| D114 | TUI sidebar (773–776) | M371 | ✓ | User's own message. |
| D115 | Inbox items (777–780) | M371 | ✓ | Restored after round-2 corruption (2B F1 fixed). |
| D116 | find-skills/wait-what (781–783) | M361 | ✓ | User's own message. |
| D117 | Renames (784–787) | M361 | ✓ | Restored (2B F1 fixed); the knock-ons list is reconstituted context, not M361's words (minor). |
| D118 | Bootstrapping (788–792) | M356 | ✓ | "eagerly and programmatically" — user's words; reconciled by M600. |
| D119 | Two flows (793–799) | M351 | ✓ | (M351 verified in round-2 leaders; consistent with rest.) |
| D120 | Engine (800–804) | M346 | ✓ | User's own message. |
| D121 | Entry-point tool (805–812) | M346 | ✓ | User's own message. |
| D122 | Wayfinding ending (813–815) | M346 | ✓ | User's own message. |
| D123 | Review gate (816–820) | M341 | ✓ | User's own message. |
| D124 | Slicing (821–822) | M334 | ✓ | Round-1 narrated; consistent. |
| D125 | Destination shape (823–825) | M315, M323 | ✓ | "One umbrella spec, approved once (Recommended)". |
| D126 | Markdown's place (826–827) | M323 | ✓ | "Bundle + register at setup (Recommended)". |
| U1 | Plan's own review — open (831–838) | M1197/8, M1200 | ✓ | True: M1198 admits no log was given; M1200 rules compromised; round 2 FAILed (M1276/1278 subagent results); a round 3 is running. "Unanimous PASS" cites M1200 though the phrase is M969's (minor mis-aim). |
| U2–U7 | Settled summaries 839–855 | (multiple) | ✓ | All re-sourced to the settled entries above. |
| U8 | **Change cloud (856–858)** | M963, M1037, M910 | **✗ walk half** | See R1. |
| U9 | Harvested scenarios (859–865) | M655, M663 | ◇ | True to the 2026-10-26 incident; the M1200 incident (fabricated ruling + log-less review that passed it) is still absent from the list (2C Part-1 unfixed). |
| U10 | Platform facts (866–874) | M1126 | ◇ | Facts verified by 2B/2C against docs and probes; the citation still points at the probe's *start* (M1126), not where results landed (M1157) — 2C F4b unfixed. |
| O1 | Zeroshot out of scope (890–895) | M401, M390 | ✓ | Presented as research findings; "Decide later" verified at M401 (2A F6 fixed). |

**Ledger totals:** 137 rows. 120 ✓, 7 ◇ (standing minor gloss/•
citation defects), 8 ✗/partial ✗ of which one — D28/U8 (the walk) —
is substantive. Outside the ledger: the V1-out-of-scope item from
round 2 is now absent from the plan entirely — the false claim is
removed, but the scoping question 2A F2's fix prescribed routing to
the user was never asked; the scope boundary now goes silently
unstated.

---

## Findings

### R1 — HIGH, representation (status-inversion): the file-discipline walk is labeled OPEN "unruled, to be put to the user" — the user endorsed it at M911

- **Plan lines 272–282** (file discipline), **366–372** (pour
  complete), **856–858** (change cloud).
- The plan quotes the user's M910 answer correctly ("I want it to
  just silently absorb the difference" / "I want it to raise an alarm
  and tell me I messed up before something breaks" / "I am not sure
  how to walk this") and then asserts: "this map's proposed walk
  (check each edit against the engine's known context and raise the
  remainder through the inbox before building on it) is unruled, to
  be put to the user … the walk OPEN".
- **The log contradicts this.** M911's answer round records the
  user's endorsement: *"'Does that walk hold — the engine checks each
  of your edits against its accounting, silently absorbing what fits
  and alarming through the inbox on what does not, before ever
  building on it?' = 'Check and absorb-or-alarm (Recommended)'"*.
  That is the plan's own proposed walk, settled by the user's
  selection.
- The same error is dressed as history at lines 366–372 ("The round-2
  review reopened two threads bound for the user — the shelved-era
  terms and the file-discipline's walk") and lines 856–858 (the
  change cloud "reopened since … the file-discipline's walk (chat
  M910)"). **No round-2 finding reopened the walk**: 2A listed file
  discipline among its *verified* items; 2B's F5 demanded only that
  the fabricated inbox dialogue be replaced with the user's words —
  and 2B's own report records the M911 endorsement. Citing M910 for
  the "reopen" is doubly wrong: M910 holds no walk.
- This is the mirror image of the offense the mandatory rules target:
  where the old plan fabricated a *settled* ruling, this one
  un-settles an *endorsed* ruling — a false claim about the user's
  answer and about the plan's own review history. It would drive the
  next phase either to re-ask the user a question they answered
  (noise) or to treat ruled design as fog.
- **Fix:** mark the walk settled citing M911 (the answer round), drop
  the "unruled/to be put to the user" language, and correct or delete
  the two "reopened" claims. If the recorder instead wants a
  re-confirmation per the M621 questioning note, it must say so
  explicitly as re-confirmation — M621's live-answer rule, not
  "unruled". Recorder-class; no new user question required. The
  shelved-terms half of those sentences is correct and should stand.

### R2 — MEDIUM-LOW cluster: round-2 gloss findings left standing (recorder-class, flagged in round 2, still present)

Verified against the hash of the log in this round; no fix applied
since round 2 for:

- **D18 / line 215–217** — quoted report-string `"could not
  acquire"`: the user's M489 words are "capable of failing to acquire
  the answer"; the quoted phrase is coinage presented as the report
  text (2A F8, 2B F5-note).
- **D35 / line 320–322** — "honestly new and one at a time": "one at
  a time" is not in M1024's answer (2A F8, 2B F8).
- **D43 / lines 373–378** — GitHub credentials: "(commits stay
  local, pushes and self-reports unavailable), recorded as a ruling
  like any declination" elaborates M960 (2A F8, 2B F9f).
- **D60 / lines 473–475** — project kinds' shape:
  "recorded as a deviation like any other" is in neither M855's
  answer nor its adopted option (2A F8).
- **D73 / lines 547–557** — caregiver cites M771 only; its authority
  clauses are the user's words at M775, uncited (2B F9a).
- **D56 / lines 445–451** — scaffold migration's "local bootstrap is
  the activation" half is M920's ruling, uncited in this item (2B
  F9c).
- **D24 / lines 250–255** — concurrency-declared enumeration ("what
  runs at once…") glosses M864 (2B F9g).
- **N7 / lines 69–72** — "too disorganized to enumerate linearly"
  cites (M315, M418); the words are the user's at **M323** (2A F10).

Each is recorder-class on its own (strip, source, or relabel as the
map's wording — exactly the pattern the permissions entry now models
correctly), but collectively they are the same "recorder content
wearing a user citation" pattern round 2 FAILed; several were
explicitly ordered fixed and were not.

### R3 — LOW, representation: uncited and mis-aimed citations still stand (2B F11, 2C F4b)

- **Lines 81–86** (TUI facts) — no citation at all; every claim is
  true (2B/2C verified against the V2 docs), but the plan's own
  mandated rule (M1200: every item cites its source) is unmet.
- **Lines 76–80** ("Facts the map leans on") — cites M497, the
  user's survey *instruction*; the facts themselves live in the
  research notes and probes.
- **Lines 866–874** (platform facts) — "verified in live probes …
  (chat M1126)": M1126 is where the probe code was written; the
  verification results landed later (the transform-failure log at
  M1157). 2C F4b flagged this in round 2; unfixed.

### R4 — LOW, representation: the mandatory-rules note still under-records the mandate (2B F12)

- **Lines 34–47.** M1200's four standing prohibitions — "You are not
  to circumvent my authority for your own convenience", "not to
  reinterpret the design after I have already approved it", "not to
  manipulate your reviewers into expediting your work", "not to close
  the wayfinding phase until wayfinding is actually completed" — are
  compressed to "The agent is not exempt and may not alter these
  rules." Everything present is correct; the note is the plan's own
  operating manual for its review and the compression was flagged in
  round 2.

### R5 — LOW, representation/completeness: the harvested-incidents list still omits the incident the rules were born from (2C Part 1)

- **Lines 859–865** list only the 2026-10-26 cross-layer incident.
  The M1200 incident — a fabricated ruling recorded as the user's, and
  a review run without the chatlog that issued PASS grades — is the
  map's most expensive lesson and the user ordered such learnings put
  to use (M1177). The incident is now *narrated* truthfully in U1
  (lines 831–838), but the design-input list that feeds the testing
  system's regression scenarios still lacks it.

### R6 — LOW, representation: garbled attribution tail (2C F5)

- **Line 355** — "(2026-10-27, user; named 2026-10-27, user)" — the
  duplication 2C flagged is untouched.

### R7 — LOW, citation mis-aim: "unanimous PASS" cited to M1200

- **Lines 837–838** — "The gate closes only on unanimous PASS under
  the citation rules (chat M1200)". The rule content is M1200's; the
  "unanimous PASS" phrase is the user's at **M969** ("proceeding to
  spec only on unanimous PASS"). Add M969 or drop the phrase.

### R8 — Scoping residue, design-adjacent: V1 support silently dropped (2A F2)

- The round-2 Out-of-scope line "OpenCode V1 support: the catalog is
  V2-only" (with no user derivation) is gone from the current plan —
  the false claim is removed, which is correct. But 2A F2's fix
  prescribed either finding the affirming user message or routing the
  question through the scoping-clarification machinery; neither
  happened, and the V1-support boundary now appears nowhere in the
  plan. If the plugin's scope genuinely includes a V1/V2 choice (the
  docs show one package can serve both), the map should either route
  the question or record it as explicitly open; a decision removed
  without a trace leaves its area unstated. Not a false intent claim
  — the removal is honest — but the prescribed routing was skipped.

---

## Regression table — every round-2 FAIL finding

| Round-2 finding | Status in current plan |
|---|---|
| 2A F1 / 2B F3 / 2C F1 — "plan's own review closed" | **Fixed** — U1 states the open state truthfully (verified against M1197/M1198/M1200 and M1276/M1278). |
| 2A F2 — V1 out-of-scope, no user derivation | **Half** — false claim removed; prescribed scoping question never asked (R8). |
| 2A F3 — Notes "plugins register agents … via transforms" | **Fixed** — now "but NOT agents … verified negative live (chat M1126)". |
| 2A F4 / 2B F4 — Two layers cited M646 | **Fixed** — "(chat M663; raised at M646)". |
| 2A F5 / 2B F7 — shelved terms inferred from M1037 | **Fixed** — OPEN, inference admitted, answer reserved to the user (D34). |
| 2A F6 — zeroshot exclusions uncited | **Fixed** — research findings vs "Decide later" (M401) (O1). |
| 2A F7 / 2C F2 — stale survey repo-facts | **Fixed** — both false claims removed (N13). |
| 2A F8 — eight uncited glosses | **4 of 8 fixed** (self-report, sidebar, permissions, inbox-by-reference). Remaining: "could not acquire", "one at a time", GitHub-credentials, "recorded as a deviation" (R2). |
| 2A F9 / 2B F1 — three corrupted entries | **Fixed** — all restored and cited (D115, D117, D126). |
| 2A F10 — "too disorganized" cited M315/M418 | **Unfixed** — words live at M323 (R2/N7). |
| 2B F2 / 2C F3 — keystone contradiction | **Fixed** — reconciled (N12/U10). |
| 2B F5 — fabricated inbox dialogue | **Fixed** — dialogue removed; M910's words quoted verbatim. **But the repair overcorrected into R1.** |
| 2B F6 — sidebar atomicity/dual-truth | **Fixed** — M926's words only (D54). |
| 2B F8 — "one at a time" | **Unfixed** (R2). |
| 2B F9a — caregiver M775 uncited | **Unfixed** (R2). |
| 2B F9c — scaffold-migration activation uncited | **Unfixed** (R2). |
| 2B F9e — testing-system piece list | **No defect in fact**: the list is inside M568's adopted option description; the plan is fine (D10). |
| 2B F9f — GitHub-credentials glosses | **Unfixed** (R2). |
| 2B F9g — concurrency enumeration | **Unfixed** (R2). |
| 2B F10 — helpers' mechanical realization fog | **Fixed** — the central fog; settled entry quoting M1165's answer plus the M1126 negative (D41). |
| 2B F11 — uncited TUI facts; M497 mis-aim | **Unfixed** (R3). |
| 2B F12 — mandatory rules compressed | **Unfixed** (R4). |
| 2B F13 — "narrated" labels | Unfixed (cosmetic; conservative, not false). |
| 2C Part 1 — M1200 incident missing from harvested scenarios | **Unfixed** (R5). |
| 2C F4(b) — platform facts cited to M1126 | **Unfixed** (R3). |
| 2C F5 — garbled "user; named … user" | **Unfixed** (R6). |

## Verified-cohering core (kept as is)

Independently re-read in this round and confirmed against the user's
own words at the cited message: the mandatory rules (M1200, M1220);
the three focuses and citation-access entries (M1262); snapshot
timing (M1269, M1273); catalog identity and Markdown's place (M323);
channel (M421); start switch (M492); information dispatch and
cannot-lie core (M484, M489); inside/outside (M519), boundary door
(M525), engine awake and clearance (M480), session scope (M470);
checker, loop driver, criteria, reports' home, discipline, hand-offs
(M445, M448, M451+M624, M454, M457, M466); question-answer rulings
M371, M406, M413, M428, M431, M434, M437, M535, M541, M547, M550,
M557, M562, M568, M574, M579, M584, M588, M591, M600, M627, M634,
M637, M669, M676, M679, M682, M688, M691, M694, M701, M704, M707,
M711, M720, M723, M726, M737, M747, M758, M771, M778, M784, M788,
M793, M796, M818, M822, M825, M828, M831, M834, M855, M858, M861,
M864, M897, M900, M903, M906, M914, M917, M920, M926, M929, M932,
M935, M938, M941, M945, M948, M951, M954, M957, M960, M963, M966,
M969, M990, M993+M998 (incl. the janitor/CFO metaphor, which is the
user's own), M1001, M1004, M1007, M1010, M1024, M1037 (as an
unanswered question — correctly OPEN), M1126 (probe work), M1165
(helpers' realization, quoting the user's verbatim answer); the
2026-10-25 narrated items M334, M341, M346, M356, M361, M371, M377,
M385, M390, M406, M413; the two-layers/reviewer-context/two-layers
settlements (M655, M663); questioning notes (M418, M621); survey
order and pass (M497, M870); zeroshot's "Decide later" (M401) and
inspiration (M390). The plan's account of its own review rounds —
compromised earlier rounds (M1197/M1198/M1200), round-2 FAIL under
the raw log (M1276/M1278 in this log), rectification in progress,
snapshot taken at dispatch — is **true**.

---

## Verdict

The plan is honest on its load-bearing core: the fabrication of round
1 is gone, the helpers' mechanical fog that killed the first pass is
settled on the user's own M1165 words, the review state is told
truthfully, and ~120 of 137 items were re-verified affirm against the
user's recorded words. But it is not whole. One settled decision is
represented backwards: the file-discipline walk the user endorsed at
M911 is labeled OPEN, "unruled, to be put to the user," and that
error is compounded by two false claims that the round-2 review
reopened it (it did not — it demanded only the removal of a
fabricated quote). A plan that asserts the user left a question
unanswered when the record shows the answer, and misstates its own
review history, is wrong about the user's intent and its own process
— the two things the governing rules make terminal. Standing beside
it: nine round-2 findings were left unfixed (four uncited glosses,
four uncited/mis-aimed citation defects, the compressed rules, the
omitted incident, the garbled tail, the dropped V1 scoping question).
Under "uncleared fog is failure, lying is failure, being wrong is
failure" (M1200), and with every defect above being recorder-class
and fixable without a new user ruling except the V1 routing, this
plan is not yet ready to transition to specifying.

VERDICT: FAIL