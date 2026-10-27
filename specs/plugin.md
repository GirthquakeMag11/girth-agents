# The girth-agents plugin

## Problem Statement

The girth-agents catalog — skills, commands, and agents that create and
maintain a project's management scaffold — is distributed by cloning the
repo and running an install script. Every unit of work is hand-driven
session by session; the chain from a settled idea through a spec and
tickets to finished work depends on a human remembering to run each
door; records drift because nothing owns their truth; and questions that
block work wait on whoever happens to notice. The user wants the catalog
to become an OpenCode plugin whose always-awake engine carries the work,
whose records never drift, and whose one channel to the user is an inbox
that asks only what the user alone can answer.

## Solution

An OpenCode plugin: the catalog stays plain Markdown, bundled and
registered at plugin setup. An always-awake engine — on a strict leash,
only inside deliberately started projects — runs a review-gated chain
(plan → reviewed plan → spec → tickets → work) behind six named helper
agents, with the user's single interactive primary agent, the
orchestrator, as the face they talk to. The engine commits its own work
per unit to the working branch and pushes it. An inbox screen is the
asynchronous channel between the system and the user; the tracker holds
everything in flight; a glossary, tended by a dedicated caregiver under
the user's authority, keeps the shared language true; and a real-case
test harness gates every merge to main.

## User Stories

1. As a project owner, I want to start the system by running `/bootstrap`, so that I knowingly turn on continuous processing for this repository, in this directory, on this machine.
2. As a project owner, I want bootstrap to state plainly what always-awake processing means before it starts, so that my consent is real.
3. As a project owner, I want a park command that stops the engine on a project without touching the records, so that I can halt it without uninstalling the plugin.
4. As a project owner, I want my idea and its fog gathered before charting, so that I can run `/ideate` when my thoughts are not yet a destination.
5. As a project owner, I want `/wayfind` to end by confirming the plan with me and clearing it into the engine, so that nothing proceeds on my unspoken word.
6. As a project owner, I want the plan I approve to pass a review before it is acted on, so that a mistake is caught while I am still in the room to fix it.
7. As a project owner, I want the plan's review to satisfy itself that every question I could have answered was answered in-session, so that I never say "let it fly" and then face a flood of questions I should have been asked moments earlier.
8. As a project owner, I want each later stage — spec, tickets, work — to proceed on the reviewer's PASS without my re-approval, so that my attention is spent on direction, not paperwork.
9. As a project owner, I want any FAIL to be repaired by whoever made the work, by the report, up to a hard cap, so that the loop terminates instead of spinning.
10. As a project owner, I want a dead-end failure — capped out with no answerable question — to fail loudly as evidence the system itself failed, and to reach me and the plugin's maintainers, so that it is fixed rather than parked.
11. As a project owner, I want questions that genuinely need my word to reach me through an inbox I open myself, not via interruptions, so that I answer on my time.
12. As a project owner, I want each inbox item to open a chat with an agent that asks me the question and records my answer, so that answering is a conversation, not a form.
13. As a project owner, I want the sidebar to show how many things await me and what the engine has in motion, so that I can see the system's state at a glance.
14. As a project owner, I want the engine to commit its work in small units pushed as it goes, so that nothing it did is ever lost and anything can be rolled back.
15. As a project owner, I want the engine to never force-push, rebase, merge, or clobber my edits, so that its work never risks mine.
16. As a project owner, I want my edits checked against the system's understanding — absorbed when accounted for, raised to me when not — so that my mistakes are caught before they break something.
17. As a project owner, I want the project's records to stay the single ledger, so that a crashed or restarted engine rebuilds the truth from them alone.
18. As a project owner, I want the glossary kept true — proposals from the work, my authority on admissions — so that the words the system and I share never drift apart.
19. As a project owner, I want lessons the engine learns to be learned once, so that the same mistake is not paid for twice.
20. As a maintainer, I want the catalog's Markdown to stay the source of truth, bundled into the plugin, so that the identity of the product survives the machinery.
21. As a maintainer, I want every change to gate through a real-case test harness before main, so that a release is only cut from a proven state.
22. As a maintainer, I want the plugin to develop itself — dogfooded — separated from the running install, so that we build the system with the system.

## Implementation Decisions

### Distribution and identity

- The plugin lives at the repository root; users load it by pointing OpenCode at the repository. No package registry. `opencode plugin update` keeps installs current; releases are tags on the repo, each with a GitHub Release page carrying the changelog section.
- The catalog's skills, commands, and agents remain plain Markdown in the repo — the source of truth — bundled with the plugin and registered at `setup()` through the skill, command, and agent transforms. Nothing converts to code unless a trigger needs code.
- The install script and its end-user transport retire. The existing catalog checker and the test harnesses stay as builder-side tooling — candidates to become plugin tools.
- The package carries both the server export and the TUI export. `/cut-release` re-scopes to tag plus Release page.

### The catalog

- The catalog is rebuilt around the engine, item by item. No skill or command survives only because it survived.
- **Skills.** `slicing` becomes its own skill, its procedure moved out of the `/slice` command body; `test-driving` is the broad real-case testing practice, `tdd` under its true name; `writing-for-agents` becomes `technical-writing`; `codifying` gains the convention-crash arrival path (an in-flight collision spawns an authority question whose answer may fold into the conventions); `domain-modeling` survives re-fit (engine-side discipline in the caregiver, interactive side guiding the user); `maintaining-docs` carries zero drift tolerance — if something documented changes, the documentation changes; `bootstrapping` becomes eager, programmatic, and synchronous; `grilling` and `questionnaire` keep their functions as the machinery of interactive sessions; the five crafts — diagnosing-bugs, code-review, codebase-design, prototyping, research — survive under the role-shaped-context rule, assigned to the helpers that hold the responsibility. `ideation` is new: the optional cloud-gathering phase before wayfinding. `find-skills` and `curate-inbox` retire; `handoff`, `/retro`, and the `wizard` pair sit on the shelf.
- **Commands.** `/slice` stays the thin door over the skill; `/spec` and `/implement` lose their doors in the system (their skills live on as the builder's craft); `wayfinding` keeps its function and its door, `/wayfind`, as the pro-active flow's entry; `/bootstrap` is the local activation and schema gate; `/park` is the off-switch; `/ideate` is new; `/questionnaire` stays; `/wizard` joins the shelf with its skill; `/close-inbox` and `/wait-what` retire; `/cut-release` re-scopes to tag plus Release page. `/handoff` and `/pickup` sit on the shelf with their skill.
- **The tracking skill's reference work** extends for the new kinds; the removals and renames run as one atomic sweep — the linter fires mid-rename otherwise; the readers of renamed or removed items are re-pointed in the same change. Two layers keep them straight: the system's catalog loses `/spec`'s door, while this repo's own working process uses its own spec flow untouched.

### The primary agent and the helpers

- One interactive primary agent, **orchestrator**, runs the user's sessions — ideation, wayfinding, rulings — and coordinates the machinery behind it. `build` and `plan` are replaced.
- Six helpers, each with its own description, context, toolset, skills, and permission ruleset, each failing openly rather than asserting:
  - **builder** — does every stage's work, one helper for all stages, pointed at each brief in turn; repairs its own FAILs, keeping its session across fix-rounds.
  - **reviewer** — grades finished work against the compiled criteria, writes the report, always fresh.
  - **fact-finder** — acquires base facts from authentic sources; they are assumed true and are the knowledge base's base evidence.
  - **prove-it** — verifies claims that are not bare facts, against what the system confirms it knows; keeps the fact-finder in line and is corrected by it in turn.
  - **answerer** — runs each opened inbox item's seeded session: poses the question, discusses, records the reply.
  - **caregiver** — the glossary's designated labor: curates term proposals, checks definitions, drafts entries, watches drift; the user's authority admits and changes terms.
- A helper is never dispatched without the permissions its job needs: the orchestrator matches the job's requirements against the helper's ruleset before dispatch, and a mismatch fails loudly as a system defect — never as a mid-operation request reaching the user.
- Keystone (verified at build): whether a plugin can register brand-new agent IDs. The spec does not presume a fallback; a failed verification is a genuinely new moment, taken to the user when it arises.

### The engine

- The engine is always awake inside the plugin, under a strict leash: it touches only work it made and files an agent cleared, only inside deliberately started projects, and never anything the forbidden list holds: no force-push, rebase, or history reset; no branch deletion or self-merging; no files outside the records and its tickets' named files; no secrets it was not handed for the task; no network commands beyond its own pushes and self-reports.
- The engine's working loop seeks inputs prepared to become outputs. Its scope is serial: one act at a time within a project, a step exclusive — every writing helper waits; only passive watching never sleeps. Parallelism exists across separate projects only. Several chains in one project, scope-based branching, and cross-machine arbitration are the future stance, named but not designed.
- Startedness is local: `/bootstrap` activates the engine for a project in a directory on a machine. A repo bootstrapped elsewhere is inert until bootstrap runs there; this is both the consent moment (bootstrap states the always-awake processing plainly) and the schema gate (an old-schema project cannot be picked up without its bootstrap migration first). The park command stops the engine on a project, records untouched, resumable by re-running bootstrap.
- Bootstrap itself is eager, programmatic, and synchronous: the engine derives everything the project can state, and the few residual asks — name, purpose, and license when undeclared; the starting version when nothing states one; the optional gh setup as an action — happen in that same session. A re-bootstrap of a live project is a step of its own: it waits for the step in flight, runs exclusively and synchronously with the user, and the engine resumes after. A declination of the gh setup is recorded as a ruling: the engine proceeds without the GitHub integration, its commits staying local and pushes and self-reports unavailable.
- The direction-change path: the user rules direction changes in a session, carried by the ordinary records — amending the plan becomes a new reviewed plan revision; aborting closes the workstream's records with the reason; re-answering reopens the resolved question with the new answer.
- The records are the ledger. A restarted engine rebuilds where things stood from the committed records alone; unpushed commits retry next pass with a pull first; nothing is ever force-pushed. There is no separate engine state store: the per-machine activation registry records which directories are started, and is machine-local fact — never project state, never written into the repository; its storage is a build-time keystone.
- Hand-offs carry only typed essentials: the brief, the checklist, and the verdict with its report. The brief is compiled at dispatch from the records — never stored separately — and carries the project, the stage, the source artifact, the compiled context scoped to the recipient, the task, and the boundary. Raw chat is a criteria source for the plan's own review and is exhausted into the finalized plan; past that boundary it carries nothing. The verdict carries its checklist reference, the per-criterion findings, and the repair pointer.
- The engine commits one meaningful unit per commit, conventionally messaged, pushed as it goes, to the working branch. On a non-fast-forward wall it never merges: it holds, and raises through the inbox — reconciliation is the user's authority. Offline, commits hold locally and retry.
- The park command is its own thin door, `/park`; the engine's records are untouched by it. The per-machine activation registry lives in the plugin's own durable storage, keyed per directory; its loss is a safe default — the machine's projects simply appear un-started until bootstrap re-runs, and no activation state is ever written into the repository.
- User edits in engine-touched files are checked against the engine's accounting: what it can account for is absorbed silently; what it cannot raises through the inbox before the engine builds on it. The engine tests accountability, never guesses intent.
- User sessions live outside the engine and never compete for its queue; their outputs cross the boundary at the doors already designed — the entry-point clearance, inbox replies, and the absorb-or-alarm check.
- The engine dogfoods on this very repository: it develops girth-agents fully, plugin code included, safe by the two-checkout separation — the engine runs from a separate installed copy while developing the repo's checkout, and its own commits reach the install only at the next deliberate plugin update.

### The entry point

- The entry-point tool is the clearance act: an agent runs it on a file to tell the engine the file is touchable. Only one thing may enter from outside — the plan from an interactive wayfinding session.
- The interactive session records the user's confirmation inside the plan file (a dated marker) before the tool runs; the tool validates the marker and rejects it loudly when absent. A dead tool run loses nothing — the marker survives and the tool re-runs.
- Everything downstream stays inside the engine and never crosses the tool.

### The review gate

- Every stage output passes a review before the next consumes it: plan (criteria from the session chat and the project context), spec (criteria from the reviewed plan), tickets (from the reviewed spec), work (from the reviewed tickets). The work stage is reviewed ticket by ticket — each ticket's outcome against its ticket, code and test evidence as proof, the stamp on the ticket.
- The cycle's checklist is compiled mechanically: the compiler reads the reviewed upstream artifact and extracts its decision-bearing lines, each checklist criterion carrying its source pointer. For the plan, the reviewer reads the session's recorded rulings plus the project records and writes the checklist the same way — a typed list of criterion statements, one per line, each with its source. The checklist rides the review and is stored with its report. The cap is three fix-rounds and the per-step time limit ten minutes — the plugin's own configuration, enforced by the tool, ungrantable to the agent's judgment. A cap too low for the work is the exception, not an override.
- The reviewer is always fresh; the builder repairing its own piece keeps its session, and a lost session is detected and recovered from the records alone — the same rebuild as any crash. The plan's repair chair is the live interactive session itself — the review precedes the plan's confirmation, so a FAIL still has a session to land in.
- A PASS carries the work forward; the plan's confirmation at wayfinding's end is the chain's one human stop. The plan's PASS also certifies authority-completeness: every user-answerable question visible in the session was asked; the inbox afterwards carries only questions newly visible under a later stage's context — newness, never deferral.
- Failure routing: whether a failure reaches the user is decided by whether its rectification requires the user's answer — exactly then, and in no other case. A capped-out, un-askable failure is the exception: a loud, stamped, project-side system-defect record that also self-reports to the plugin's repo, with the user's consent asked at every send, payload limited to the failing piece's brief and report. Identical repeated failures coalesce into one report with a count; a new consent ask comes only when the failure itself differs. Several cleared plans queue in received order, first in, first out.

### The records

- The tracker keeps the project's open work. Its kinds: hazards, bugs, defects, features, questions (each declaring **authority** — the user's alone — or **information** — the user's or a finding agent's), and tickets. New kinds: **term proposals** and **lessons**, each following the tracker's one-file-per-kind convention. Defects gain a system provenance flag for the exception's record.
- The report pile is a scaffold piece: every verdict filed once, the verdict also stamped on the reviewed artifact; the engine's live report and the sidebar read the pile. Its owner is the reviewer agent — the filing format lives with the reviewer's bundled references, and the scaffolding inventory lists the pile under the reviewer.
- One root store per repository, with a root context-map record declaring the repository's contexts and their relationships, an optional `context:` field for domain-qualified senses, and scoped reads — agents see their context's slice, never the union blob. Per-package physical placement happens only on warrant, as a recorded deviation. Non-code repositories run the same system with criteria fitting the substance's kind.
- The glossary stays prose — a term and its definition. The mechanical gate checks form only: duplicate spellings, malformed entries, empty definitions. Meaning is never a linter's job.

### The inbox and the sidebar

- The inbox is the system's asynchronous send-and-receive channel to the user, never a view over the tracker. Its items are messages the engine writes, referencing tracker entries without copying them. The message record is one file in the scaffold, one entry per sent request — its kind, its referenced entry, its status, and the reply once recorded. Each warranted item opens a seeded conversation with the answerer, whose recorded reply lands on the inbox message and closes the referenced tracker question. Replies join the serial order. Abandoned sessions are inert.
- The inbox is reached through a command and the command palette; it presents as an email inbox, sorted by receipt, scrollable and selectable. The `/inbox` door remains; the old curation skill and its closing command retire.
- The sidebar shows `Inbox: {n}` and the engine's live report of pieces in motion — built, under review, sent for repair — reported by the engine, derived from its own state transitions, updated per transition, never a parse of half-written files. The committed ledger stays the recovery truth; the live report is the display truth.

### Knowledge management and recall

- The glossary is the project's shared language, kept by the caregiver and ruled by the user. Anyone meeting a term-that-matters jots a proposal (a tracker kind); the caregiver filters — "not worth attending to" ends there, with no caregiver-side changes — and each warranted proposal opens an inbox question carrying the context and the caregiver's suggested definition; the user confirms in seconds or crafts precisely. Changes to a glossary carry convention weight. The review gate grades whether work uses terms as defined.
- Review grades term use; the caregiver and the user keep the words true; the mechanical gate keeps only the form.
- The recall layer answers "lessons learned once." The reviewer jots candidate claims while writing its report; the engine's idle consolidation pass collects them, checks them against what is already known, and hands them to prove-it. Verified claims stratify only after they recur across separate work — a first occurrence stays a hazard; an unverifiable claim vanishes into the ordinary question machinery only if its uncertainty blocks work. The store is the committed lessons kind, subordinate to the canonical records, capped at one hundred entries: overflow proposes the least-re-ratified entries for retirement through their recorded closing lines. Reading is two-mode: the kind rides into a brief whole only when the dispatch's relevance check says so, under the same hard budget as any context; otherwise the engine looks up entries on demand, right before the tool use they would inform.

### Testing

- A committed automated harness drives the real pieces — the parser, the review loop, the session spawning, the inbox record, the TUI slot — with assertions that map to trust. It gates merges to main; releases tag only green main. The existing harnesses seed it.
- Harvested scenarios: a representation FAIL is correct review behavior, and the interpreter classifies it — representation repair, design question, or scoping clarification — never a reconciliation question that presumes one layer.

## Testing Decisions

- Each engine piece exposes a testable seam; the harness drives the real components, not mocks, where the seam allows, and asserts outcomes that mean trust (a FAIL is correct, a flood is not, a ledger rebuild recovers the truth).
- Prior art: `scripts/test-installer.sh` and `scripts/test-wizard.sh` — zero-framework, exit-code-true assertion style against fixture catalogs; `scripts/validate.mjs` — the mechanical gate's proven shape.
- The harvested scenarios — the cross-layer conflict; the plan-gate completeness; the permission-mismatch loud failure; the crash-rebuild from records alone — become regression cases.

## Out of Scope

- OpenCode V1 support.
- Zeroshot's four clashing assumptions: workspace-restore/copy-checkout, pipeline config outside the repo, verifying the live worktree rather than the records, and a single-writer world with no human TUI.
- A package-registry publication (a later option, not a contradiction).
- The future concurrency stance: parallel chains within a project, scope-based branching, cross-machine arbitration.
- A recall layer beyond the committed lessons kind (agent-private auto memory).
- The shelved pair — handoff and pickup, `/retro`, the wizard and `/wizard` — which wait for the engine to prove their replacement.
- The scaffold-migration rules' details — the mechanism is settled (bootstrap is the migration gate); the rules for each schema transition are pinned when the first migration is built.

## Further Notes

- The design's full decision trail lives in `plans/plugin-transition.md` (done) and `tracker/QUESTIONS.md`; the formal turn is `decisions/0007-plugin-transition.md`; ground research is `docs/research/`.
- Build-time keystones to verify before implementation: plugin-added brand-new agent IDs; git-spec `./tui` auto-load; sidebar-slot live-reactivity; `ctx.storage` durability and location; the event catalog and `session.idle` payload; `codemode` semantics; the per-machine activation registry's storage.
- Two layers stay distinct: [Ours] — this repo's own working process (this spec's approval, releases, testing) — and [The system] — the plugin's rules on the projects it runs. An apparent conflict between them is a representation artifact, never a design tension.
- The shapes the plan ceded to this spec are pinned in the sections above: `/park`, the activation registry, the report filing format, the message record, the new kind files' conventions, the cap defaults, the criterion-compilation mechanics, the brief's fields, the flood coalescing, the plan-queue order, and the recall budget.