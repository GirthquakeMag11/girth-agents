# Plan review 2C — the safety skeptic's pass on `plans/plugin-transition.md`

**Reviewer:** C (safety skeptic — trust boundaries and failure paths)
**Plan under review:** `plans/plugin-transition.md` (as read 2026-10-27/28)
**Governing rules:** the plan-review mandate the user set at M1200 (raw log
as it exists at review time; every item cites the exact user message; no
unverifiable intent-claims or technical claims; uncleared fog, lying, or
being wrong = FAIL). The verdict is graded against the raw log
`/tmp/opencode/girth-agents-chat-log.md` (1225 messages, M1–M1225) and
primary OpenCode V2 docs (`https://opencode.ai/v2/docs/`).

**Method:** every plan citation was pulled to the cited message and checked
for the user's words (132 question-answers and 74 user messages indexed
from the log); every technical claim was checked against the V2 docs pages
(`/plugins`, `/build/plugins`, `/build/plugins/server`, `/build/plugins/cli`)
and the log's live-probe evidence; repo-factual claims were checked against
the working tree and git history.

---

## Part 1 — The known incident: is the plan clean and honest?

- **Clean:** the fabricated ruling "the helpers are skills, not agents" is
  gone from the plan. No occurrence of "helpers … skills, not agents",
  "helper skills", or "as skills" remains. The plan now carries the
  user's actual model: helpers as the engine's machinery/embedded agents
  behind one interactive primary (plan L325–329, attributed M966; "the
  engine's embedded agents produce everything downstream," L124–130,
  attributed M519). The ordered removal (M1192 "Now, you made up … remove
  it.") was executed. ✔

- **Partial honesty in the plan's own account:** the plan's *status line*
  (L3–5: the premature spec-slice-implement pass "was discarded and the
  lessons it taught are being woven back") and the *platform-facts* bullet
  (L823–831: "the discarded pass paid for these") acknowledge the pass and
  its cost. The mandatory rules bullet (L17–29) records M1200/M1220
  correctly. **But** the "Test scenarios harvested from this effort's own
  incidents" bullet (L816–822) lists only the 2026-10-26 cross-layer
  incident — not the incident that produced the mandate itself (a record
  fabricated a user ruling; a review run without the chat log passed it),
  despite the user's order at M1177 ("Every excruciating learning
  experience is being put to use to improve the design, this being an
  important one"). The map's own most expensive lesson is absent from its
  harvested-scenarios list. **Representation / completeness.**

---

## Part 2 — Findings

### F1 — The plan claims its own review is CLOSED. The log says the opposite. — FAIL-grade

- Plan L793–796: "The plan's own review — closed: the three reviewers'
  first round FAILed with six findings; the rectification settled all six,
  and the second round was unanimous PASS … (chat M969)".
- The cited message does not affirm the item: M969's user words are "Let's
  make the primary interactive agent the 'orchestrator' … Have three
  subagents review the plan against the chat … proceeding to spec only on
  unanimous PASS" — an instruction to run the review, not six findings, not
  a rectification, not an outcome. The citation does not resolve to user
  words affirming the bullet.
- The claimed closure is history the user has since invalidated. M1197
  ("Did you give the review agents access to that resource before
  performing their review?") drew the answer at M1198: "The chatlog was
  never given to any of the review agents, in any round." The round-1
  reports themselves declare their criteria source was `tracker/QUESTIONS.md`
  (plan-review-A.md L3, -B.md L4, -C.md L5) — not the raw log. M1200 rules:
  those grades were produced by compromised reviewers "making them provide
  passing grades for a failure of a plan," and mandates "restart the
  review-rectify loop and do it properly this time."
- The log ends at M1225 with the citation pass in progress; no re-review
  round is dispatched in it, no new review reports exist in the repo
  (plan-review-* files unchanged since the compromised rounds; no newer
  review commits in git). So the plan presents a review state ("closed",
  "unanimous PASS") that does not exist under the plan's own mandatory
  rules. This is a false claim about the plan's own process — the one class
  of error the plan's own Notes say a reviewer must FAIL.
- **Classification:** representation / process-bookkeeping (the map
  misstates its own gate state) — fixable by the recorder marking the
  review open and re-running it; no design question for the user. But per
  the governing rules, the plan cannot be "wholly complete and ready for
  specifying" while its own gate lies closed-with-PASS on a compromised
  round.

### F2 — Survey-inconsistencies note contains two false repo facts — "being wrong" tier

Plan L80–86, four claims. Two are false as of the reviewed state:

- "0003 lacks a superseded marker" — **false.** `decisions/0003-one-skill-class.md`
  L9–11 carries "Status: accepted; superseded in part — decisions/0006
  retired the teaching … skill". The marker landed in commit `6ce90ba`.
  (The companion half — the consequences list still counting seven owners
  incl. `teaching` at L31 — remains true, so the bullet is stale, not
  invented.)
- "the channel's supersession of the installer's clone-only transport
  ruling is not yet recorded in `decisions/`" — **false.**
  `decisions/0007-plugin-transition.md` records exactly that supersession:
  "OpenCode's own plugin machinery supersedes the clone-and-install
  transport." (True remnant: `plans/installer-experience.md` L39–40 still
  carries the old ruling without a superseded marker.)
- The other two claims check out: stale `teaching` references remain in
  `specs/handoff-pickup.md` (L279) and `tracker/tickets/08` (L12, L19, whose
  note marks them historical); the rename-atomicity claim matches
  `scripts/validate.mjs` (skill tool-calls are checked against live skill
  IDs at L261–262 — mid-rename commits do fail the linter).
- **Classification:** representation (stale facts).

### F3 — The keystone Notes contradict the plan's own probe record — internal consistency

- Plan L74–79 lists as "still unverified (do not build on them until
  checked)": `ctx.storage` restart durability; adding brand-new agent IDs
  (the editor has no `add`); `codemode` semantics — while plan L823–831
  records all three as verified in live probes ("the discarded pass paid
  for these"). The same map asserts a fact is both open and closed.
- **Classification:** representation (stale note vs newer record); the
  probe truth is the L823–831 version — verified below.

### F4 — Citation anchors: overwhelmingly sound, with two anchors that do not resolve

The citation pass is substantially real. 130+ individual citations were
checked; nearly all resolve to messages containing the user's words:

- Direct user messages affirming the item: M315 (wayfinding by direction),
  M334–M406 (narrated starting rulings), M413, M418, M489 (the no-lying
  correction), M497, M621, M655, M663, M688, M723, M737, M747, M758, M822,
  M870, M1170–M1220, and the question-answer pairs whose tool results carry
  the user's answers in the cited message itself — checked messages include
  M421 ("Point at GitHub directly"), M428 ("Retire it"), M431, M434, M437,
  M445, M448, M451, M454, M457, M466, M470, M480, M484, M492, M519, M525,
  M535, M541, M547, M550, M557 ("I am pretty sure I have answered this exact
  question three times"), M562, M568, M574, M579, M584, M588, M591, M600,
  M624, M627, M634 (near-verbatim exception ruling), M637, M646, M669,
  M676, M679, M682, M691, M694, M701, M704, M707, M711, M714, M720, M726,
  M771, M778, M784, M788, M793, M796, M818, M825, M828, M831, M834, M855,
  M858 ("fish don't get judged on climbing trees"), M861, M864, M897, M900,
  M903, M906, M910/M911, M914, M917, M920, M926, M929, M932, M935, M938,
  M941, M945, M948, M951, M954, M957, M960, M963, M966, M969 (orchestrator),
  M990, M993 + M998 (the janitor/CFO image is the user's own words), M1001,
  M1004, M1007, M1010, M1024, M1037, M1220.
- Two anchors do not resolve: **(a)** "The plan's own review — closed" →
  M969 (F1); **(b)** the platform-facts bullet cites M1126, which is where
  the probe *code* was written, not where its results landed (the results
  live later in the log — see Part 3). Both are citation-placement errors,
  representation-class.

### F5 — Minor representation defects (non-lethal, but recorded)

- Plan L329: "(2026-10-27, user; named 2026-10-27, user)" — garbled
  duplication.
- Plan L116: the `(chat M492)` anchor is inserted mid-sentence ("the
  engine would scatter files (chat M492) wherever …") — a formatting
  artifact of the citation pass.
- "Not yet specified" concurrency/GitHub/project-kinds/knowledge-management
  bullets restate settled decisions with trailing "(see Decisions so far)"
  — redundant but not wrong.

---

## Part 3 — Technical claims: verification ledger

Checked against primary V2 docs and the log's live probes. **Every
load-bearing technical claim in the plan checked out**:

| Claim (plan) | Verdict |
|---|---|
| `AgentEditor` has no `add`; plugins cannot register brand-new agent IDs (L77, L824–825) | **True.** `/v2/docs/build/plugins/server` `AgentEditor = { list, get, default, update, remove }` — no `add`. Live-probe: service log "disabled plugin after transform failure … 'AgentEditor has no add'" (keystone record, commit `ca6740e`). |
| A plugin does register (update/remove) agents via `ctx.agent.transform` (L59) | **True** — transform exists; only *new IDs* are impossible. |
| `ctx.storage` survives service restarts (L825) | **True.** Docs call it "durable JSON"; probe marker written 23:09:12 read back intact after `opencode service restart` (keystone record). |
| `codemode: true` tools surface in code-mode namespace and execute (L825–827) | **True.** Docs example `options: { namespace, codemode: true }`; live run called `tools.girth.keystones()` from code mode — executed and returned JSON (log, probe session `ses_e806082beffeS0oCyXJAUm444m`). |
| Local-directory plugin loads from `index.ts`/`server.ts` at the package root; package `exports` serve the parts (L827–829) | **True.** `/v2/docs/build/plugins` "Without them, it uses file names at its root: server (else index), tui, and rpc"; the probe added root-level `index.ts`/`tui.ts` re-exports (commit `389caf8`). |
| TUI-only plugins configured separately in `cli.json` (L64) | **True** (`/v2/docs/plugins`, Terminal section). |
| Package plugins install/check/update via `opencode plugin` incl. git specs with `::path:` (L66, M497 ground research) | **True** (`/v2/docs/plugins`, Manage). |
| `./tui` export beside server export — one package, two entries (L63–64) | **True** (`/v2/docs/build/plugins`, Parts). |
| `sidebar.content` slot = right-hand panel readout (L62, L737–739) | **True** — slot documented; the user's own M371 fixes it as the right bar. |
| Menu = command palette, Ctrl+P; Escape = `session.interrupt`, not a menu (L66–67) | **True** (`/v2/docs/cli/keybinds`: `command.palette.show` default `ctrl+p`; bare Escape bound to `session.interrupt`). |
| Routes register whole screens via the TUI router; palette/slash reach needs a keymap command pairing (L65–66) | **True**, with the pairing honestly flagged in the research note as a documented-but-inferred composition. |
| Still unverified, live-TUI-only: git-spec `./tui` auto-load, sidebar-slot live reactivity, `session.idle` payload (L830–831) | **True and honestly labeled** — the keystone record leaves exactly these three unverified (`./tui` untested live, `sidebar` reactivity untested, `session.idle` not observed; the broader event catalog works — first-seen `session.usage.updated`, `session.renamed`). |
| Plugins add skills/commands/tools via transforms with `add` (L48–50) | **True** (`SkillEditor.add`, `CommandEditor.add`, `ToolEditor.add`). |

No technical claim in the plan was found false. (The one *stale*
technical-ish list is F3, an internal consistency problem, not an untruth
about the platform.)

---

## Part 4 — Parked threads: parked or smuggled?

- Shelf (`handoff`, `pickup`, `/retro`, `wizard`) — honestly labeled "kept
  privately out of the plugin… re-judged later" (L137–139, L593–596,
  L841–843); every element user-attested (M366, M591, M714). **Parked as
  parked.**
- Scaffold migration — "declared to revisit… the migration rules' details
  remain the circle-back" (L409–415). One overreach: "The mechanism is now
  found: local bootstrap is the activation AND the migration gate" is the
  recorder's synthesis from the user's M903 (bootstrap must bring a repo
  into the current paradigm) and M920 (activation local; old-schema guard).
  The user never pronounced the mechanism "found." Mild synthesis,
  honestly framed as declared-revisit, not settled. **Parked, leaning
  over-claimed.**
- Future concurrency stance, multi-machine arbitration, spec details —
  labeled "future stance, named but not designed" / "spec detail," each
  user-attested (M897, M917, M954). **Parked as parked.**
- Keystones: three resolved, three genuinely open (Part 3) — the open three
  are labeled live-TUI-only honestly. **Parked as parked.**

No parked thread is smuggled in as a settled decision. The reverse error is
F1: a *settled-looking* "closed" review that is actually open.

---

## Part 5 — User-ordered removals and corrections: residue check

- M1192 "remove it" (helpers-are-skills): **gone.** ✔
- M1170/M1173/M1177 (stop the premature pass, throw away everything since
  planning): executed — spec/slice/implement artifacts deleted by commit
  `31dbf6e`; tracker/plugin-tickets 01–09 removed. ✔
- M1200 (citation pass, raw log to reviewers, no exemption): the citation
  pass is applied; the rules bullet is in the plan, cited to M1200/M1220;
  the log path and count (1225) stated correctly. ✔ — with the F1 caveat:
  the *actual re-review* the mandate calls for has not yet been run.
- M1220 ("the rule about citations must itself be cited"): done (plan
  L17–29 carries the M1200/M1220 anchors). ✔

---

## Part 6 — The plan's claims about its own process, measured against the log

| Plan claim | Verdict |
|---|---|
| Status: "charting — re-entered 2026-10-27; the premature … pass was discarded" (L3–5) | True — commits `31dbf6e` ff. and M1177. |
| Mandatory review rules recorded, citing M1200/M1220 (L17–29) | True. |
| Three-perspective review (2026-10-26) opened four inquiry threads, each since settled (L93–109) | True — fog-audit/blind-read/coverage-matrix exist; the four threads map to settled decisions (plan-gate L292–300/L301–306, two layers L635–640, work check L631–634, survivors sweep). |
| "The plan's own review — closed … unanimous PASS" (L793–796) | **False as current state** — F1. |
| Reviewers' first round FAILed; six findings; rectification settled (L794) | True as history (commit `be25a24`: "the reviews' six frontier findings are queued"); the rectification answers are in the log (M990–M1037). Invalidated-in-context by M1200's ruling. |
| Citations on plan items derive from the raw log | Largely true (F4), with F1/F1b anchors breaking the rule. |

---

## Verdict

The plan is honest on its load-bearing content: the fabricated ruling is
gone, the surviving decisions each trace to the user's actual words, the
technical claims are true against primary docs and the log's live probes,
and deferrals are labeled as deferrals. But it fails the mandate on its own
process and on current facts:

1. **Its own review is not closed** — the "closed / unanimous PASS" claim
   describes the round the user ruled compromised (M1197–M1200; reviewers'
   own headers show `tracker/QUESTIONS.md`, never the chat log); the
   mandated re-review with the raw log has not run, and the plan presents
   the compromised result as the standing state, cited to a message (M969)
   that does not state it.
2. **It is wrong about the repo on two recorded facts** (the 0003 marker;
   the channel supersession in `decisions/0007`).
3. **It contradicts itself** on the keystone list (open vs verified).
4. Its harvested-incidents list omits the incident the map's own rules were
   born from.

All are representation-class errors — the interpreter's repair rules apply,
no design question for the user — but the governing rules are explicit:
being wrong is failure, lying (including a closed review that is not) is
failure, and a plan that is not wholly complete and ready for specifying
FAILs. This one is not ready.

VERDICT: FAIL