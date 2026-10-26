# Repo ground survey — girth-agents

A factual inventory for the spec-writing effort that turns this OpenCode V2
catalog into a plugin. Everything below is read directly from the files;
each fact is cited by path (and line where it helps). Written read-only
against `HEAD` at survey time.

---

## 1. Catalog inventory

### Skills — `.opencode/skills/` (21 directories)

Each is a directory holding a `SKILL.md` (the directory name is the skill ID,
per `AGENTS.md` lines 20–22):

`bootstrapping`, `codebase-design`, `code-review`, `codifying`,
`curate-inbox`, `diagnosing-bugs`, `domain-modeling`, `find-skills`,
`grilling`, `handoff`, `implementing`, `maintaining-docs`, `prototyping`,
`questionnaire`, `research`, `specifying`, `tdd`, `tracking`, `wayfinding`,
`wizard`, `writing-for-agents`.

(Plus `.opencode/skills/.gitkeep` — an empty-dir placeholder, not a skill.)

### Commands — `.opencode/commands/` (14 flat files)

`bootstrap`, `close-inbox`, `cut-release`, `handoff`, `implement`, `inbox`,
`pickup`, `questionnaire`, `retro`, `slice`, `spec`, `wait-what`, `wayfind`,
`wizard`.

What each body currently does:

- `/bootstrap` — frontmatter only + one line: "Call the skill tool with
  `bootstrapping` and run its full bootstrap… explore, create the missing
  pieces, repair the gaps found" (`bootstrap.md` 1–8).
- `/inbox` — "Call the skill tool with `curate-inbox`"; trailing text is fed
  in as direction (where to start, items to skip) (`inbox.md` 5–8).
- `/close-inbox` — "Call the skill tool with `curate-inbox`" then the close
  play: finish the item in flight, present the wrap-up, confirm the remainder
  is recorded in the tracker, offer to begin execution honouring any
  convention hand-off ruling (`close-inbox.md` 5–11).
- `/slice` — a full 7-step procedure (the only long command body): find the
  item, read it completely, slice into tracer-bullet tickets, assign each
  ticket's `Kind:` (bug-fix/feature/research/refactor), write tickets in the
  `tracking` format, one checkpoint for approval, report and stop
  (`slice.md` 1–42).
- `/cut-release` — a 5-step release protocol per `conventions/On_Versioning.md`:
  read the `[Unreleased]` queue, propose a SemVer bump (Removed/breaking →
  major, Added/Deprecated → minor, Fixed/Security → patch), confirm, apply
  the changelog format via `maintaining-docs`, commit + tag + push, publish
  the GitHub Release via `gh` (routing missing gh to bootstrapping's wizard;
  a declination is a recorded convention) (`cut-release.md` 1–34).
- `/retro` — a session look-back over six categories (Navigation, Automated
  checks, Standards, Steering files, Tool economy, Information access),
  presented in severity order, applied only on approval via
  `maintaining-docs`/`codifying` (`retro.md` 1–45). Note: body is
  command-only (no skill) — see 0002/0004.
- `/wait-what` — "Call the skill tool with …" is NOT used; it says "That last
  message did not land. Re-pitch it … use the terms in `GLOSSARY.md`"
  (`wait-what.md` 1–7).
- `/handoff` — "Call the skill tool with `handoff` and run its write-and-sweep
  protocol" (`handoff.md` 1–5).
- `/pickup` — "Call the skill tool with `handoff` and run its pickup protocol"
  (`pickup.md` 1–5).
- `/implement` — "Call the skill tool with `implementing`"; trailing text is
  direction (which ticket/bug/defect/spec); with none the skill works the open
  frontier (`implement.md` 1–7).
- `/spec` — "Call the skill tool with `specifying`" (`spec.md` 1–7).
- `/wayfind` — "Call the skill tool with `wayfinding`" (`wayfind.md` 1–6).
- `/questionnaire` — "Call the skill tool with `questionnaire`"
  (`questionnaire.md` 1–6).
- `/wizard` — "Call the skill tool with `wizard` and run its process: scope,
  author, statically check, proofread for self-containment, then offer to
  launch … and wait for my yes" (`wizard.md` 1–8).

### Agents — `.opencode/agents/` **(none)**

Only `.opencode/agents/.gitkeep`; the directory is otherwise empty. The
README's Agents table says "🚧 — first agents land here shortly"
(`README.md` 66–70); the plugin map names a "reviewer" agent type as the
first of the new system (`plans/plugin-transition.md` 83–86).

### The ten skills the transition has decided to touch

| Skill | Current description (verbatim, from each `SKILL.md` frontmatter) | What it owns |
| --- | --- | --- |
| `find-skills` | "Discover and install agent skills from the open ecosystem — search skills.sh and the Skills CLI, verify quality, present options, and install. Use when a user asks 'how do I do X' or 'is there a skill for X', where X might be covered by an installable skill." | Nothing (no `references/`). Marked **dead** by the map (`plans/plugin-transition.md` 151–153). |
| `tdd` | "Build and fix code test-first — red, green, refactor — at seams the user has pre-agreed. Use when building a feature or fixing a bug, when the user asks to work test-first, or to make a change a regression test can lock down." | `references/tests.md`, `references/mocking.md`. To be **renamed `test-driving`** and re-scoped (`plans/plugin-transition.md` 92–95, 154–157). |
| `writing-for-agents` | "Write any document an agent consumes — a skill, an AGENTS.md, a doc reached by a pointer — with the same levers: context pointers with their trigger branches, progressive disclosure, leading words, and ruthless pruning. Use when creating or editing a skill or an agent-facing document." | `references/`? No — it has **no `references/` dir** (craft lives entirely in `SKILL.md`). To be **renamed `technical-writing`** (`plans/plugin-transition.md` 154–157, 231–232). |
| `curate-inbox` | "Open the user's inbox: walk the repository for tracker items and stray calls for attention, present them one at a time, record each answer, route — never start — the work answers reveal. Use when the user opens their inbox or wants their open items processed." | Nothing. Fate **held until the inbox-screen shape is visible** (`plans/plugin-transition.md` 206–212). |
| `handoff` | "Carry a session's context across the gap between sessions — write and sweep HANDOFF.md when handing work off, consume it to nothing when picking it up, and leave it alone between the two. Use when the user hands work off or picks it up." | `HANDOFF.md`'s format and both protocols live in `SKILL.md`; no `references/`. **Shelved out of the plugin** (`plans/plugin-transition.md` 88–90, 145–149). |
| `bootstrapping` | "Create a project's management scaffold — whole, or one missing piece. Use when setting up a project, or when work needs a scaffold piece that does not exist yet." | The scaffold **inventory** (the contract for what counts as scaffolding, `SKILL.md` 33–54); reads every other owner's creation reference; owns the gh setup wizard in `references/gh-setup-wizard.md`. To become **eager/programmatic**; `/bootstrap` is the engine's start switch (`plans/plugin-transition.md` 39–44, 158–161). |
| `implementing` | "Work the ticket frontier — already-sliced tickets one at a time, each by its Kind; a feature's tickets answer to its spec. Use when the user asks to implement, build, or fix something planned or recorded, with or without naming it." | Nothing. Its execution cycle names `tdd` (to be re-pointed to `test-driving`); its `/slice` reference is re-pointed when slicing becomes a skill (`plans/plugin-transition.md` 154–157, 271–273). |
| `specifying` | "Turn the current conversation into a spec — the problem, solution, user stories, and the decisions that pin the design down — then refine it with the user and hand it over for approval. Use when a design has settled enough to write down, or when the user asks for a spec." | `specs/` — `references/spec-format.md`, `references/spec-template.md`. Its fresh-context review is the precedent the plugin's review gate generalizes (`plans/plugin-transition.md` 255–270). |
| `tracking` | "Own the tracker — hazards, bugs, defects, features, questions, tickets — and decide whether to deal with an item now or record it. Use when an item comes up, or when picking up, closing, or writing a tracked item." | `tracker/` — seven references (see §2). Gains a question-kind field (`authority` \| `information`) at implementation (`plans/plugin-transition.md` 215–219). |
| `wayfinding` | "Chart a big, foggy effort as a live map in plans/, and work its decision questions until the way to the destination is clear. Use when an effort is too big or too unclear to spec directly." | `plans/` — `references/plan-format.md`, `references/plan-template.md`. Its ending changes: run the entry-point tool on the map (`plans/plugin-transition.md` 182–184). |

---

## 2. Scaffold pieces and their owners

### The bootstrapping inventory (`.opencode/skills/bootstrapping/SKILL.md` 42–54)

Paths are relative to the scaffold root (project root unless designated).

| Piece | Path | Owned by |
| --- | --- | --- |
| Agents guide | `AGENTS.md` | maintaining-docs |
| Contributing guide | `CONTRIBUTING.md` | maintaining-docs |
| Readme | `README.md` | maintaining-docs |
| Changelog | `CHANGELOG.md` | maintaining-docs |
| Glossary | `GLOSSARY.md` | domain-modeling |
| Conventions | `conventions/` | codifying |
| Decisions | `decisions/` | codifying |
| Specs | `specs/` | specifying |
| Plans | `plans/` | wayfinding |
| Trackers | `tracker/HAZARDS.md`, `BUGS.md`, `DEFECTS.md`, `FEATURES.md`, `QUESTIONS.md` | tracking |
| Tickets | `tracker/tickets/` | tracking |

The `gh` CLI is described as "a concern, not an inventory piece" — checked
by bootstrapping, carrying a setup wizard (`references/gh-setup-wizard.md`)
and a recorded-declination ruling (`SKILL.md` 56–70).

### CONTRIBUTING.md's schema table (lines 33–40)

Six skills own scaffold pieces (matches 0006's "six"): `tracking`
(`tracker/` — the six open-item kinds plus `tickets/`), `domain-modeling`
(`GLOSSARY.md`), `codifying` (`conventions/` and `decisions/`),
`maintaining-docs` (`AGENTS.md`, `CONTRIBUTING.md`, `README.md`,
`CHANGELOG.md`), `specifying` (`specs/`), `wayfinding` (`plans/`).

### Full `references/` inventory per skill

- **bootstrapping/references/** — `gh-setup-wizard.md`: the walk from "no gh"
  to an authenticated `gh` CLI (install channel per platform → `gh auth
  login` → verify), with a recorded-declination ruling path.
- **codebase-design/references/** — `deepening.md` (how to deepen a cluster of
  shallow modules safely, by dependency category: in-process /
  local-substitutable / remote-but-owned / true-external); `design-it-twice.md`
  (spawn ≥3 parallel sub-agents with radically different interface designs,
  then compare by depth/locality/seam).
- **code-review/references/** — `pr-body.md` (PR body format: Summary visual,
  Evidence before/after, Merge Danger door+blast-radius).
- **codifying/references/** — `convention-format.md`; `conventions-template.md`
  (create empty `conventions/`, `On_<Domain>.md`, `.gitkeep` if committed);
  `decision-format.md` (three tests for a decision record); `decisions-template.md`.
- **diagnosing-bugs/references/** — `hitl-loop.template.sh` (human-in-the-loop
  reproduction-loop shell template: `step` and `capture` helpers).
- **domain-modeling/references/** — `glossary-format.md`; `glossary-template.md`.
- **maintaining-docs/references/** — `doc-format.md` (the three docs' purpose
  table); `doc-agents.md` (AGENTS.md contents); `doc-contributing.md`
  (CONTRIBUTING contents); `doc-readme.md` (README contents);
  `doc-template.md` (creation templates for the three docs); `changelog.md`;
  `changelog-template.md`.
- **prototyping/references/** — `logic.md` (single self-contained HTML
  state-model demo); `ui.md` (switchable UI variations behind a `?variant=`
  param).
- **specifying/references/** — `spec-format.md`; `spec-template.md`.
- **tdd/references/** — `tests.md` (good/bad tests); `mocking.md` (mock only at
  system boundaries).
- **tracking/references/** — `hazards.md`, `bugs.md`, `defects.md`,
  `features.md`, `questions.md` (the five kind definitions), `template.md`
  (tracker file creation), `tickets.md` (one file per ticket).
- **wayfinding/references/** — `plan-format.md`; `plan-template.md`.
- **wizard/references/** — `template.sh` (the wizard library: stage progress,
  confirmation gates, URL opening, masked secret entry, `.env` upserts,
  checks, closing summary — everything above the `# STAGES:` marker);
  `launching.md` (per-platform "open a fresh terminal" command families +
  degradation sentence).
- Skills with **no `references/` dir**: `curate-inbox`, `find-skills`,
  `grilling`, `handoff`, `implementing`, `questionnaire`, `research`,
  `writing-for-agents`.

---

## 3. Records the transition touches

### Conventions

- **`conventions/On_Chains.md`** (18 lines, three rulings): chains describe,
  they never bind (README's chain map is illustrative; nothing forbids a
  move); recovery is always a step away (the four rails — tracking,
  codifying, `/inbox`, `/bootstrap` — stay reachable from every node);
  commands are the doors, skills the machinery (a command exists only where
  the act is the person's: approve a scaffold, settle a spec, call a release,
  open/close the inbox).
- **`conventions/On_Versioning.md`** (5 lines): releases follow SemVer;
  pre-v1 versions start at 0.1.0; every release (timing and number) is the
  user's to approve.

### Decisions (0001–0006)

- **0001 — Owner/activity schema for skills.** Split skills into owners (one
  per scaffold piece) and activities. `Status: superseded by 0003`.
- **0002 — Session-lifecycle acts live in their commands.** Folded `handoff`
  and `retro` skills into their `/handoff` and `/retro` commands.
  `Status: superseded in part by 0004 — the retro fold stands` (i.e. the
  retro half still governs; retro stays command-only).
- **0003 — One class of skill.** Retired the owner/activity split; nine owner
  skills folded into the working skills; catalog dropped 30 → 21 skills.
  Names **seven** scaffold-piece owners including `teaching` (education).
  No `Status` line flags that 0006 later reduces the count — the change is
  noted only inside 0006's consequences.
- **0004 — Handoff becomes a skill behind two commands.** Unwound 0002 for
  handoff: the `handoff` skill revives behind `/handoff` and `/pickup`;
  `retro` stays folded. `Status: superseded in part by 0005`.
- **0005 — The handoff continues a session; the tracker defers work.** The
  handoff/tracker junction: the handoff carries a session's own continuation
  across the gap, written only on `/handoff`, consumed to deletion by
  `/pickup`; the tracker alone defers work; no third freshness-check trigger.
  `Status: accepted`. This is the **junction the plugin transition leaves
  standing** until the engine's replacement proves out.
- **0006 — The teaching lane retires.** `teaching`, `/teach`, and the
  `education/` scaffold piece are removed; the number of skills owning a
  scaffold piece "drops to six"; 0003 "stands as the record of the time it
  described." `Status: accepted`.

**Flags for the spec writer:**

1. **0003 has no `Status` marker** pointing at 0006, unlike 0001, 0002, 0004
   which all carry a superseded line. 0006 records the correction, but a
   reader of 0003 alone still sees "seven" owners and `teaching` (education).
   Worth a status line when the transition touches 0003.
2. **The installer transport decision lives in
   `plans/installer-experience.md`** ("Transport: the clone stays the only
   transport", lines 39–43), not in `decisions/`. The plugin map
   (`plans/plugin-transition.md` 23–25) supersedes that ruling where it lands.
3. **`specs/handoff-pickup.md`** carries its own "Superseded in part by
   `decisions/0005`" banner (lines 3–6), and 0005's consequences (35–38)
   narrow 0004's pointer to it. Consistent — but note 0005 was applied as
   direct edits without a second spec (0005 Considered options, 16–21).

### Plans (all four)

- **`plans/installer-experience.md`** — **Status: done.** Charted the
  guided/release-synced installer; pinned the transport (clone-only), the
  three policies, the `status` verb, gh-at-the-cut. Superseded in part by the
  plugin map (end-user transport retires).
- **`plans/wizard-redesign.md`** — **Status: done.** Charted the wizard
  trigger/launch/censored-input/verification redesign; approved spec governs.
- **`plans/handoff-untangling.md`** — **Status: done.** Untangled the handoff
  from the tracker; rulings land in 0005, edits follow it; "Not yet
  specified: None".
- **`plans/plugin-transition.md`** — **Status: charting. This is the live
  map.** Destination: a formal `decisions/` record turning the catalog into a
  plugin, then one umbrella spec over five areas. "Not yet specified" and
  "Decisions so far" are itemized in §5.

### Specs and their governing status

- **`specs/installer.md`** — three-verb installer, manifest (`girth.yaml`),
  safety invariants. **Superseded in part** by
  `specs/installer-experience.md`, which states "This spec re-scopes the
  three-verb installer the earlier spec described; where they overlap, this
  one governs" (lines 192–193); and is itself about to be superseded where the
  plugin map retires the end-user transport.
- **`specs/installer-experience.md`** — governs the guided, release-synced
  installer (interactive-first, policy, `status`, gh publication, one-liner).
  **Superseded in part** by the plugin transition (the settle "The old
  install path retires" and "The channel: no package store" —
  `plans/plugin-transition.md` 100–107).
- **`specs/wizard-redesign.md`** — governs the wizard redesign (trigger-first
  description ≤300 chars, offer-then-wait launch, censored-not-invisible
  input, check-per-value, in-stage retry). **Not superseded**; is the
  governing design for the wizard; its scenario gate still stands.
- **`specs/handoff-pickup.md`** — governs the handoff/pickup lifecycle.
  **Superseded in part by `decisions/0005`** (document written only on
  `/handoff`, stays until consumed; no freshness-check trigger) — banner at
  lines 3–6; 0005 narrows 0004's pointer. The handoff/pickup pair is shelved
  out of the plugin, retirement lands on this spec + 0005 later
  (`plans/plugin-transition.md` 226–228).

---

## 4. Tooling seams

### `scripts/validate.mjs` — catalog linter

- **What it does:** lints `.opencode/{agents,skills,commands}` against the
  publishing rules, zero dependencies, Node 18+ (`validate.mjs` 1–11).
- **Interface:** `node scripts/validate.mjs [--root <path>]`; exit 0 clean /
  1 errors / 2 usage; warnings don't fail (comment lines 8–10).
- **What it asserts:** flat `.md` agents/commands (no subdirs); skill IDs from
  directory names, unique leaf names; lowercase-kebab IDs (regex line 33);
  frontmatter `description` required for agents and skills (skill
  descriptions warned over 300 chars, line 98); no V1 agent fields
  (`LEGACY_AGENT_FIELDS` 36–44); command bodies non-empty and no `template`
  key; skill file paths (`references/`, `scripts/`, `assets/`) must resolve
  (86–95, 215–217); no `../` paths (102, 212–214); every "Call the skill tool
  with `<id>`" names a real skill (100, 108–110, 261–263).
- **Reusable for a testing system:** `splitFrontmatter` (47–51),
  `topLevelKeys` (54–61), `scalar` (64–67), `entries` (70–76), `markdownFiles`
  (113–121), `referencedPaths` (86–95), and the err/warn/note aggregators
  (25–31) are a self-contained, dependency-free linter core. The
  plugin map names this (along with the two test harnesses) as the seed for
  the engine's testable seams (`plans/plugin-transition.md` 200–205).

### `scripts/install.sh` — installer

- **What it does:** installs the catalog (symlink by default; `--copy`) into
  `~/.config/opencode` (`$OPENCODE_CONFIG_DIR`/`$XDG_CONFIG_HOME` override,
  line 12); uninstalls exactly what the record lists; updates per policy;
  reports `status`. Records a `girth.yaml` manifest (mode, policy, release,
  per-item source/dest/how/fingerprint).
- **Interface:** verbs `install | uninstall | update | status`, flags `--copy
  --policy manual|notify|auto --notes --dry-run --yes --help`; bare run opens
  an interactive menu; a bare scripted run with unanswered questions fails
  naming the required flag (`usage()` 23–47; arg loop 49–69; entry 556–563).
- **Key functions:** `verify_catalog()` runs the linter before touching
  config (238–246); `reconcile()` re-walks the catalog, re-lays/re-copies,
  prunes retired items (376–468); `uninstall()` removes only
  `still_ours()` items (252–258, 309–371); `update()` honors policy incl.
  dirty-checkout refusal (470–517); `status()` prints the four facts
  (521–548); `catalog_pairs()` enumerates src→dest (270–283); fingerprint =
  sha256/shasum/cksum of content (222–235).
- **Reusable:** the `girth.yaml` record + `still_ours` ownership check is the
  "state file, not hand-edited config" pattern the specs pin; the runner
  is driven by `OPENCODE_CONFIG_DIR` (the test seam). Retires as end-user
  transport under the plugin (`plans/plugin-transition.md` 100–102, and
  QUESTIONS "Installer and release machinery under the plugin").

### `scripts/test-installer.sh` — installer harness (~30 test functions, the
"79-assertion" harness per `plans/installer-experience.md` 18–20)

- **What it does:** drives the installer against a scratch config + small
  fixture catalog, asserting today's behavior holds.
- **Harness pattern:** copies the *real* installer + linter into a temp
  fixture mini-repo (`mk_fixture` 26–31); `add_agent/add_skill/add_cmd/
  add_broken_cmd` build the fixture (33–48); assertions are `ok()`/`fail()`
  counters with a final `[ "$FAIL" -eq 0 ]` exit-code-truth gate (18–19,
  726–728); `expect_link/expect_file/expect_absent` (52–62),
  `expect_installed` diffs the installed set (71–79); `run_install` pipes
  `OPENCODE_CONFIG_DIR` env + stdout capture (81–90); interactive paths run
  via `script -qec` with piped answers (234–245); git fixtures via
  `git_fixture` (448–456), update/status runners (459, 634).
- **What it asserts (the reusable fixture catalog):** symlink install,
  copy install, user file/symlink preservation, retired-item pruning,
  broken-catalog refusal, manifest recording, policy flag recording +
  carry-over + rejection, interactive install, flagless-scripted failure,
  bare-scripted failure, Configuration menu changes, `status --notes`,
  dry-run, help, uninstall (links/copies/user-folders/confirmation/dry-run),
  update (dirty checkout / pull-reconcile / copy-only-changed / dry-run /
  auto-tag-checkout / notify-report), notify lag on install.

### `scripts/test-wizard.sh` — wizard library harness

- **What it does:** exercises the *real* `references/template.sh` library
  (masked secret entry, check helper, re-ask loop, closing summary).
- **Harness pattern:** `mk_wizard` takes the template's real library above
  the `# STAGES:` marker and appends a canned driver stage (27–31), so it
  asserts the shipped library, not a copy; `run` pipes canned stdin and
  captures output/exit code (38–42); `contains`/`count_of` grep assertions
  (35–36); same exit-code-truth gate (198–200).
- **What it asserts:** template parses under `bash -n` (46); one mask per
  keystroke/paste, backspace erases (48–89); re-run shows saved default as
  length-only masks, never the secret (91–106); passing check prints green;
  failed check re-asks with the probe's error verbatim until pass; explicit
  skip recorded, never mistaken for a pass; failing step reported with exit
  code 1; plain mode carries the same floor with a format probe (108–196).

**Reuse note for the future testing system:** all three share one discipline
— zero-framework, deterministic, exit-code-true, driven by canned stdin and
a config-dir/env seam, asserting on observable output ("the same bar", per
`specs/installer.md` 116–134 and `specs/installer-experience.md` 157–176).
The plugin map declares these three "the seeds" for the engine's testable
seams and the release-chain gate (`plans/plugin-transition.md` 200–205).

---

## 5. The live map's open threads

### Still-open tracked questions (`tracker/QUESTIONS.md`)

Open = no `Answered —` line. Each listed with title + its
`Decided (provisional):` line (or note where it has a "Note" instead):

1. **The old inbox helpers — deferred until the shape is visible** (lines
   9–21; authority) — "undecided — held by the user; `/close-inbox`'s wrap-up
   role is likely dead but not ruled; the skill's fate joins the agent-type
   and tool cloud."
2. **The testing system — harness and gate** (23–37) — "undecided — the
   harness's shape and the gate's position are pinned in the spec; the
   existing harnesses seed it; nothing is built on a guess."
3. **The inbox answering session — agent and recorded answer** (39–50) —
   "undecided — the answering agent and the recorded-answer form wait for the
   agent-type cloud and the inbox item's home."
4. **Sidebar ongoing-work breakdown — what counts and what it reads** (150–163)
   — provisional: "derived from the system's own records — never a
   human-written or agent-private state; the exact derivation and list shape
   are pinned in the spec." (No `Answered`, so still open on the derivation
   detail.)
5. **The inbox item's home and form** (165–184) — "undecided — the counter
   requires a deterministically written, project-scoped record; whether that
   is the tracker or a new piece is pinned in the spec" (Note: inbox became
   its own TUI screen).
6. **Eager bootstrapping — what stays human-asked and where it travels**
   (204–221) — provisional: "programmatic derivation fills everything the
   project can state; what genuinely needs the user goes to the inbox …
   the exact whitelist of human-only asks [is] pinned in the spec" (Note:
   `/bootstrap`'s place is settled as the start switch).
7. **Pro-active flow — what counts as an entry-point-producing session**
   (223–236) — provisional: "at least one valid entry-point document; several
   in one session queue as several inputs in document order; the exact
   accounting is pinned in the spec" (Note: clearance = running the
   entry-point tool).
8. **Re-active flow — how system requests land in the inbox** (238–254) —
   "undecided — the inbox surface is settled, the item kind and the writer
   are not" (Note: writer settled to the engine; home/form tracked
   separately).
9. **The engine and the entry-point tool — mechanics** (275–290) — "undecided
   — the spine is declared but its mechanical home waits for the agent-type
   and tool cloud items to land" (Note: always-awake engine + clearance act
   now settled; the parser's accepted kinds remain).
10. **The change cloud — harvesting the item-level changes** (362–380) —
   provisional: "the cloud is narrated in chat … the map and the tracker
   questions are the only durable home between sessions; nothing is designed
   until it is organized." (Ongoing by nature — the harvest.)

### `Answered` questions (map-updated; no longer open)

Session scope (52–66); Loop discipline — machinery vs model (68–81); Session
hand-off payload — typed state only (83–99); Zeroshot inspiration (101–129);
Information-kind questions — who acquires the answer (131–148); Entry points
— how outputs and cleared products are marked (256–273); Review loop — where
graded reports live (292–310); Review loop — the mechanism (312–340); Slicing
skill — the `/slice` door's fate (342–360); The channel (382–402); Installer
and release machinery under the plugin (404–424); Destination shape (426–439);
Markdown's place in the plugin (441–452). Also all six `wizard-redesign`
questions (454–540) and all four `installer-experience` questions (542–604)
are `Answered`.

### The map's "Not yet specified" (`plans/plugin-transition.md` 198–288)

1. The testing system — harness's shape, where real-case tests run, where the
   gate sits before main (200–205).
2. The inbox screen knock-ons — `curate-inbox`'s and `/close-inbox`'s fates
   held; which agent runs the seeded session; the recorded-answer form
   (206–212).
3. Tracked-question kinds — the `tracking` references gain the kind field;
   whether the engine auto-dispatches information-kind questions to research
   (213–219).
4. Sidebar ongoing-work breakdown — what counts as ongoing, and what the
   display reads (220–225).
5. Handoff's retirement — date and form, landing on 0005 and
   `specs/handoff-pickup.md`, decided once the replacement proves out
   (226–228).
6. The renames' knock-ons — mechanical sweep at implementation
   (`writing-for-agents` → `technical-writing`; `tdd` → `test-driving`)
   (229–232).
7. Eager bootstrapping — what stays human-asked and where those asks travel;
   gh check + deviations under an eager run (233–239).
8. The two flows — open mechanics (what counts as a pro-active session; how
   requests land; how flows interleave) (240–249).
9. The engine and the entry-point tool — which file kinds the tool accepts
   (250–255).
10. The review gate — interplay with the existing checkpoints (slice's
    approval, spec's approval options), generalizing specifying's
    fresh-context review (256–270).
11. Slicing's knock-ons — the skill's trigger description; re-point
    `implementing`'s/`specifying`'s `/slice` references and README rows
    (271–273).
12. The change cloud — the full set of skill/command/agent/tool/code changes
    (274–276).
13. Installer/release machinery — one open point: whether each tag also gets
    GitHub release notes (the gh step) (277–282).
14. Agent types and the plugin's tool/code surface — beyond the reviewer
    (283–285).
15. The plugin package's layout inside the repo — where the entrypoints sit
    (286–288).

### Sunk/kept and out-of-scope anchors (for the spec's scope)

- The catalog stays **V2-only** (292); the repo is both "the workshop and the
  thing people install" via OpenCode's git plugin + `opencode plugin update`
  (104–107); zeroshot's four clashing assumptions are explicitly not borrowed
  (292–296).

---

## 6. Current change surfaces — the sweep list

Places that still reference the items the transition decided to
remove/rename. The map decided these (`plans/plugin-transition.md` 151–157)
but the catalog files have **not yet been edited** — the sweep is deferred to
implementation ("The renames' knock-ons — mechanical only now", 229–232).
Grouped by target.

**`find-skills` (dead) — still present in catalog and referenced:**
- `.opencode/skills/find-skills/SKILL.md` — the whole skill directory still
  exists (to be removed).
- `README.md` 91 — Skills table row `find-skills`.
- `README.md` 204 — "Off the spine" line.
- `THIRD_PARTY_NOTICES.md` 46 — "The `find-skills` activity is adapted from
  this repository."
- `CHANGELOG.md` 67 — historical 0.2.0 Added entry (record; not live).

**`/wait-what` (dead):**
- `.opencode/commands/wait-what.md` — the command file still exists.
- `README.md` 123 — Commands table row `/wait-what`.

**`tdd` (→ `test-driving`):**
- `.opencode/skills/tdd/` — the skill directory still exists (rename target).
- `.opencode/skills/implementing/SKILL.md` 43 and 44 — two "call the skill
  tool with `tdd`" instances in the execution-cycle table.
- `README.md` 102 (Skills row), 181 (chain diagram), 221 (working loop).
- `CONTRIBUTING.md` 51 — names `tdd` as a naming example ("otherwise the
  action's own name (`research`, `tdd`, `wizard`)").

**`writing-for-agents` (→ `technical-writing`):**
- `.opencode/skills/writing-for-agents/` — the skill directory still exists
  (rename target).
- `README.md` 99 — Skills table row.
- `CONTRIBUTING.md` 65 — "The *craft* behind them … lives in the
  `writing-for-agents` skill" (the craft pointer named in the map, line 155).
- `.opencode/skills/find-skills/SKILL.md` 11, 83, 88 — three mentions
  (moot once find-skills is removed, but they are "Call the skill tool
  with" / Related-skill references that the linter's dangling-call check will
  catch mid-renaming).

**`curate-inbox` / `/close-inbox` (fate held, not yet decided):**
- `.opencode/skills/curate-inbox/SKILL.md` — whole skill; its own body
  references `/close-inbox` at line 77.
- `.opencode/commands/inbox.md` 5 and `close-inbox.md` 5 — both call
  `curate-inbox`.
- `README.md` 90 (Skills row), 117 (Commands row `/close-inbox`), 153 (driving
  table), 198–200 (Attention rails), 217 (working loop).
- `CHANGELOG.md` 62, 65 — historical 0.2.0 entries (record).

**`teaching` / `/teach` / `education/` (removed by 0006 — leftovers that
0006's sweep did not reach):**
- `.opencode/skills/teaching/` and `.opencode/commands/teach.md` —
  **already absent** from the repo (verified).
- `README.md` — no teaching rows remain (verified; the 0.3.0 collapse removed
  them, and 0006's consequences were applied).
- `specs/handoff-pickup.md` 278 — still says "the teaching skill's `/handoff`
  pointer" (a stale touch-point in a spec that is superseded-in-part).
- `tracker/tickets/08-handoff-touch-points.md` 12, 19, 25 — still references
  "the teaching skill's resume pointer".
- `decisions/0003-one-skill-class.md` 28 — names `teaching` (education) in the
  seven-owner list ("stands as the record of the time it described", per
  0006).
- `CHANGELOG.md` 51 — historical 0.3.0 entry lists `teaching` as the
  reference home for `education` formats (record).

**Installer/README channel surfaces (superseded by the plugin channel):**
- `README.md` 7–62 — the whole Install section (one-line clone+script), the
  verbs table, the artifact-source table, and the "Alternatives and details"
  block, all of which the plugin transition retires for end users.
- `README.md` 54–61 — the skills-by-path JSON alternative (installer leaves it
  alone; arg list to revisit under the plugin).
- `AGENTS.md` 65–68 — the maintenance note describing `install.sh`'s
  install/uninstall/update behavior.

**No references to the removed/renamed items in:** `AGENTS.md` (its content
is rules + workflow, carries none of the six targets), `GLOSSARY.md`,
`conventions/` (both files), `decisions/0001–0006` (except 0003's `teaching`
line and 0006's own text). `plans/plugin-transition.md` and
`tracker/QUESTIONS.md` mention them only *as* the change set, which is
expected.