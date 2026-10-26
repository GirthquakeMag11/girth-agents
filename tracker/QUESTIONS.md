# QUESTIONS

Questions that deserve a definitive answer but cannot get one yet. Entries
record the provisional decision made in the meantime, so the answer can be
applied to the work later. See the tracker skill.

<!-- entries below, newest first, one `##` section each -->

## Session scope — fresh plus explicit continue? — 2026-10-25

- **The question:** Is the engine's session-scope model zeroshot's —
  fresh session per stage execution, the rectifying worker keeping its
  session across repair passes through an explicit session ID (with
  lost-session detection), reviewers always fresh?
- **Context:** map `The skillset becomes an OpenCode plugin`;
  `docs/research/zeroshot-open-engine.md`; put to the user 2026-10-25
  with the borrowing recommendation; the user held it.
- **Kind:** authority
- **Decided (provisional):** undecided — held by the user's "decide
  later"; the research notes carry the material.

## Loop discipline — machinery or model? — 2026-10-25

- **The question:** Are the loop's guarantees — bounded loops, attempt
  caps, per-stage timeouts, retry/idempotency semantics — enforced by
  the machinery, never delegated to the model's judgment?
- **Context:** map `The skillset becomes an OpenCode plugin`;
  `docs/research/zeroshot-open-engine.md`; put to the user 2026-10-25
  with the borrowing recommendation; the user held it.
- **Kind:** authority
- **Decided (provisional):** undecided — held by the user's "decide
  later"; the research notes carry the material.

## Session hand-off payload — typed state only? — 2026-10-25

- **The question:** Does the engine pass only typed state between
  sessions — authored briefs compiled from the records, verdict
  signals and diagnostics, a machine-generated JSON contract — and
  never transcripts?
- **Context:** map `The skillset becomes an OpenCode plugin`;
  `docs/research/zeroshot-open-engine.md`; put to the user 2026-10-25
  with the borrowing recommendation; the user held it.
- **Kind:** authority
- **Decided (provisional):** undecided — held by the user's "decide
  later"; the research notes carry the material.

## Zeroshot inspiration — how to take it in practice — 2026-10-25

- **The question:** What exactly should the engine borrow from the
  zeroshot project (the-open-engine) for spawning fresh OpenCode
  sessions and passing information between them — and what should it
  not borrow, given this system's records-first design?
- **Context:** map `The skillset becomes an OpenCode plugin`; the engine
  must spawn sessions for the build-verify-rectify loop; the user takes
  heavy inspiration from zeroshot; the investigation is part of this
  wayfinding and records findings with a pointer to cited notes.
- **Kind:** information
- **Decided (provisional):** undecided — the research runs before any
  mechanics are designed; nothing is built on a guess.
- **Answered — 2026-10-25:** notes at `docs/research/zeroshot-open-engine.md`
  (identified repo `the-open-engine/zeroshot`; claims pinned to commit
  SHAs). Zeroshot shells out to `opencode run` (JSONL events,
  `--session`/`--continue` for the worker across repair passes,
  zero-context reformat sessions), passes only authored briefs and typed
  bindings — never transcripts — and enforces its guarantees in the graph
  (bounded loops, `attempts: 1`, timeouts, SQLite ledger, checkpoint
  resumes). Its workspace-restore, config-outside-repo,
  live-worktree-verification, and single-writer assumptions clash with a
  records-first, user-in-parallel design. (agent research)
- **Follow-up:** map updated — three borrowing decisions graduate to the
  frontier: typed-state-only hand-offs, machinery-enforced guarantees,
  and the session-scope model.
- **Note — 2026-10-25:** the three were put to the user as a grilling
  round; the user held all three ("decide later"). Each is tracked as
  its own authority-kind question, with these notes as its material.

## Information-kind questions — who acquires the answer — 2026-10-25

- **The question:** Does the engine itself dispatch an information-kind
  tracked question to a research agent when it can, so only
  authority-kind questions need the user — or does the user choose the
  answerer every time?
- **Context:** map `The skillset becomes an OpenCode plugin`; ruled:
  tracked questions declare their kind — authority kinds are the user's
  alone; information kinds can be answered by the user or by an agent
  that acquires the information.
- **Decided (provisional):** undecided — the capability is ruled, the
  dispatch policy is not; nothing is built on a guess.

## Sidebar ongoing-work breakdown — what counts and what it reads — 2026-10-25

- **The question:** What counts as "currently ongoing work" for the
  sidebar breakdown — the open ticket frontier, review loops in flight,
  PASS-pending hand-offs, inbox items awaiting the user — and does the
  display derive the view from the system's existing records, or from a
  new state record that itself needs a home?
- **Context:** map `The skillset becomes an OpenCode plugin`; declared:
  the sidebar shows the breakdown, analogous in form to OpenCode's
  experimental todo lists (which are an agent's private tasks via
  `todowrite`); ours is the system's engine-driven work.
- **Decided (provisional):** derived from the system's own records —
  never a human-written or agent-private state; the exact derivation and
  list shape are pinned in the spec.

## The inbox item's home and form — 2026-10-25

- **The question:** Where do formal inbox items live and what is their
  deterministic form — the tracker's question kind, a new scaffold piece
  (which would enter bootstrapping's inventory), or something beside the
  tracker — such that the engine can write them, recognize them, and
  count them for the sidebar's `Inbox: {n}`?
- **Context:** map `The skillset becomes an OpenCode plugin`; declared:
  inbox items are created as formal items the engine recognizes; no
  informal gleaning survives; `/inbox` initiates the re-active workflow;
  the sidebar counter needs a countable, project-scoped record.
- **Decided (provisional):** undecided — the counter requires a
  deterministically written, project-scoped record; whether that is the
  tracker or a new piece is pinned in the spec; until then nothing is
  built on a guess.

## Handoff and pickup — what the shelf means for the plugin — 2026-10-25

- **The question:** What does "on the shelf" mean mechanically — parked
  out of the plugin's published surface until the replacement proves
  out, or shipped dormant — and when does eventual retirement supersede
  decision 0005 and `specs/handoff-pickup.md`?
- **Context:** map `The skillset becomes an OpenCode plugin`; declared:
  shelved for the time being, not cut; the new vision — engine, tracker,
  entry points — carries the continuity the handoff did; decision 0005
  rules the handoff/tracker junction until then.
- **Decided (provisional):** parked out of the plugin's shipped surface;
  the repo keeps the skill, commands, and spec until the replacement
  proves out; 0005 stands unchanged until retirement is declared.

## Eager bootstrapping — what stays human-asked and where it travels — 2026-10-25

- **The question:** Under eager, programmatic bootstrapping, which
  bootstrap questions remain human-only, and do they travel through the
  inbox (per the re-active flow) instead of a blocking in-session
  interview? Does `/bootstrap` survive as the human-triggered re-run
  door?
- **Context:** map `The skillset becomes an OpenCode plugin`; declared:
  bootstrapping happens eagerly and programmatically to the extent
  possible; today's run explores, interviews once for gaps, and creates;
  the re-active flow routes action-needed asks to the user's inbox.
- **Decided (provisional):** programmatic derivation fills everything
  the project can state; what genuinely needs the user goes to the
  inbox, never to a blocking in-session interview; the door's fate and
  the exact whitelist of human-only asks are pinned in the spec.

## Pro-active flow — what counts as an entry-point-producing session — 2026-10-25

- **The question:** When does a session formally count as a pro-active
  flow — must it end in exactly one valid entry-point document, at least
  one, and how are several queued into the engine?
- **Context:** map `The skillset becomes an OpenCode plugin`; declared: a
  pro-active flow is any session that produces a valid entry-point
  document; the entry-point tool validates.
- **Decided (provisional):** at least one valid entry-point document;
  several in one session queue as several inputs in document order; the
  exact accounting is pinned in the spec.

## Re-active flow — how system requests land in the inbox — 2026-10-25

- **The question:** What item shape does a system-to-user request take in
  the inbox — the tracker's question kind, or a new inbox-owned kind —
  and does the existing `/inbox` → curate-inbox machinery present it?
- **Context:** map `The skillset becomes an OpenCode plugin`; declared:
  the re-active flow reaches the user through their inbox; the tracker
  question kind already means "deserves a definitive answer"; the
  engine's needs-information moments are candidates to become tracked
  questions automatically.
- **Decided (provisional):** undecided — the inbox surface is settled,
  the item kind and the writer are not; nothing is built on a guess.
- **Note — 2026-10-25:** the narration then settled the writer: inbox
  items are created as formal items the engine recognizes — the
  non-deterministic gleaning is gone. The home and form are now tracked
  separately as "The inbox item's home and form"; this entry keeps the
  `/inbox`-initiates question only.

## Entry points — how outputs and cleared products are marked — 2026-10-25

- **The question:** What marks a file as a valid entry point, and what
  distinguishes a known system output from a user-interaction product
  still in an undetermined state — so the tool touches the first freely
  and the second only after explicit clearance?
- **Context:** map `The skillset becomes an OpenCode plugin`; the
  entry-point tool is declared; candidates are format markers like the
  map's `Status: done` and the tracker's closing lines; the review gate's
  verdicts ("Reviewed — PASS") belong to the first class.
- **Decided (provisional):** undecided — the marker grammar is pinned in
  the spec once the parser's input kinds are set; until then the
  boundary rule alone governs.

## The engine and the entry-point tool — mechanics — 2026-10-25

- **The question:** What is the engine mechanically — an OpenCode
  plugin's runtime (server-side, hook/event-driven, running across
  sessions) or an agent-driven loop per session — and what is its scope:
  one project, or the whole system?
- **Context:** map `The skillset becomes an OpenCode plugin`; declared in
  the narration: the working loop continuously seeks inputs prepared to
  become outputs; the review gate's loops are candidates to ride it;
  FEATURES.md's orchestrator-agent feature touches adjacent ground.
- **Decided (provisional):** undecided — the spine is declared but its
  mechanical home waits for the agent-type and tool cloud items to land;
  nothing is built on a guess.

## Review loop — where graded reports live — 2026-10-25

- **The question:** Where do review reports and their PASS/FAIL verdicts
  live — a dedicated scaffold piece (which would enter bootstrapping's
  inventory), or attached to each reviewed artifact?
- **Context:** map `The skillset becomes an OpenCode plugin`; the reports
  must be findable from the artifacts they gate — plan → spec → tickets
  → work — and a later agent must be able to see what was reviewed
  against what.
- **Decided (provisional):** undecided — whatever home is chosen, the
  verdict is recorded on the artifact itself, the way tracker closing
  lines are appended; a reports home that becomes a scaffold piece
  follows the scaffold-family maintenance path.

## Review loop — the mechanism — 2026-10-25

- **The question:** What mechanically carries the PASS/FAIL review loop —
  a plugin tool, a skill that spawns the reviewer subagent, a reviewer
  agent type, or a combination — and who writes the criteria used each
  round?
- **Context:** map `The skillset becomes an OpenCode plugin`; the loop's
  shape is pinned on the map; the user's cloud includes "agent types and
  tools that only make sense in the context of the skillset after the
  work"; specifying's existing fresh-context review is the loop's
  piecemeal precedent.
- **Decided (provisional):** undecided — the loop's home waits for the
  agent-type and tool cloud items to land; nothing is built on a guess.
- **Note — 2026-10-25:** the narration then declared the engine — a
  driver for the system's automated aspects — the loop's likeliest home;
  this question and "The engine and the entry-point tool — mechanics"
  resolve together.

## Slicing skill — the /slice door's fate — 2026-10-25

- **The question:** Slicing becomes its own skill, outside the command.
  Does `/slice` survive as the human door — its body shrunk to "Call the
  skill tool with `slicing`" — or does slicing become model-invoked only,
  with the command retired?
- **Context:** map `The skillset becomes an OpenCode plugin`; the user
  ruled the skill's existence; the procedure currently lives in the
  `/slice` command body; the catalog's door-calls-skill shape is
  `/spec` → specifying, `/wayfind` → wayfinding; `implementing` and
  `specifying` ("Approve and Slice") point at `/slice`.
- **Decided (provisional):** the door survives as the thin call — the
  catalog's shape is doors that call skills, and `/slice` is the one the
  README's chain and `/implement` point at; the procedure moves wholesale
  into the skill's body.

## The change cloud — harvesting the item-level changes — 2026-10-25

- **The question:** What is the complete set of changes the user's
  test-driving surfaced — the workflows to optimize for, the
  bloat/imprecision to root out, and the item-level edits aimed at
  cross-cutting concerns?
- **Context:** map `The skillset becomes an OpenCode plugin`; the user
  reports too many disorganized ideas to enumerate linearly — "changes to
  individual items meant to affect cross cutting concerns in a way that I
  can't easily explain in terms of a linear chain". Round 1 confirmed all
  five known workflow areas (spec→slice→implement, tracker/handoff
  junction, bootstrap→conventions/specs, wizard/secret handling,
  release/update) and bloat classes spanning scaffold/docs overhead,
  pacing rigidity, dead commands, overlapping skills, and skill-to-skill
  connections to tighten or loosen.
- **Decided (provisional):** the cloud is narrated in chat over as many
  messages as it takes, and the agent organizes it into the map's tree as
  it comes — the map and the tracker questions are the only durable home
  between sessions; nothing is designed until it is organized.

## The channel — 2026-10-25

- **The question:** How does the plugin reach users — an npm package
  managed by `opencode plugin add/update`, a git spec, or both channels
  alive?
- **Context:** map `The skillset becomes an OpenCode plugin`; the user
  deferred the decision for further consideration. `plans/installer-experience.md`
  ruled package-manager channels out of scope for the installer; this map
  supersedes that ruling where it lands.
- **Decided (provisional):** undecided by choice — the map treats the
  repo as source of truth and the package layout as channel-agnostic
  until this is answered; nothing is built on a guess.
- **Note — 2026-10-25:** the sidebar display adds a TUI wrinkle: the
  plugin ships a `./tui` export beside its server export — one package,
  two entries; a CLI-only plugin would instead configure separately in
  `cli.json`.

## Installer and release machinery under the plugin — 2026-10-25

- **The question:** Does the `install.sh`/update-policy/harness machinery
  retire once the plugin brings its own channel (`opencode plugin
  add/update/check`), and what becomes of `/cut-release`, the gh GitHub
  Release, and the clone one-liner?
- **Context:** map `The skillset becomes an OpenCode plugin`; the user
  had not had the machinery in mind but is open to the case. The agent's
  view, for when the channel is settled: retire the end-user transport;
  keep the lint gate and test harnesses as maintainer tooling (candidates
  for plugin tools later); keep versioning/changelog; re-scope
  `/cut-release` to publishing the plugin.
- **Decided (provisional):** undecided — held with the channel; no
  machinery is retired until the channel answer lands.

## Destination shape — 2026-10-25

- **The question:** Does wayfinding end once the decision is recorded and
  the specs are approved, and is the spec set one umbrella spec or one
  per area?
- **Context:** map `The skillset becomes an OpenCode plugin`; the effort
  must land all at once because the parts are defined by their
  relationships.
- **Decided (provisional):** one umbrella spec covering all five areas,
  approved once; the decision record is written first and the spec
  references it; building/slicing is the next effort.
- **Answered — 2026-10-25:** one umbrella spec, approved once (user).
- **Follow-up:** map updated; the spec's single-source coherence is the
  destination's shape.

## Markdown's place in the plugin — 2026-10-25

- **The question:** How do the Markdown skills, commands, and agents ship
  inside the plugin?
- **Context:** map `The skillset becomes an OpenCode plugin`; Markdown is
  the catalog's identity; the plugin transforms register skills, commands,
  and agents with path and content.
- **Decided (provisional):** bundle the Markdown files and register them
  at plugin setup; Markdown stays the source of truth; nothing converts
  to code unless a trigger needs it.
- **Answered — 2026-10-25:** bundle + register at setup (user).
- **Follow-up:** map updated; the spec pins the packaging mechanics.

## Wizard redesign — destination and scope — 2026-10-22

- **The question:** Is the destination an approved spec redesigning the
  wizard skill end to end — trigger, launch protocol, censored input,
  self-contained instructions, built-in verification (touching the skill
  body, template.sh, a launch reference, `/wizard`, and the README rows) —
  then slice → implement?
- **Context:** map `Wizard redesign — trigger, launch, censored input,
  verification`; the skill's trigger has failed every scenario test so far.
- **Decided (provisional):** approved spec, full redesign — the
  installer-experience shape.
- **Answered — 2026-10-22:** approved spec, full redesign (user).
- **Follow-up:** map updated; the spec is the destination.

## Wizard launch protocol — offer then wait — 2026-10-22

- **The question:** After authoring and statically checking the wizard,
  what does the agent do? The observed failure is both extremes: no offer
  at all, or launching without asking.
- **Context:** map `Wizard redesign — trigger, launch, censored input,
  verification`.
- **Decided (provisional):** offer to launch the wizard in a new terminal,
  then wait for the user's explicit yes — every time.
- **Answered — 2026-10-22:** offer, then wait for an explicit yes — every
  time; that middle ground is the requirement (user).
- **Follow-up:** map updated; the spec pins the protocol wording and the
  launch table.

## Wizard verification — every value carries a check — 2026-10-22

- **The question:** How does a run know whether something went wrong, and
  what, without edit-and-relaunch loops? Must every captured value (and
  every step that can fail) carry a check the wizard runs itself?
- **Context:** map `Wizard redesign — trigger, launch, censored input,
  verification`.
- **Decided (provisional):** yes — a check per value and per fail-able
  step; cheapest meaningful probe, format check at minimum, live probe
  where possible.
- **Answered — 2026-10-22:** yes, every value gets a check (user).
- **Follow-up:** map updated; the spec pins the check-helper interface.

## Wizard failure handling — in-stage retry loop — 2026-10-22

- **The question:** What happens when a check fails mid-run?
- **Context:** map `Wizard redesign — trigger, launch, censored input,
  verification`.
- **Decided (provisional):** re-ask within the same stage and re-check,
  looping until the value passes or the user explicitly skips; the closing
  summary lists skipped or still-failing items with the exact error.
- **Answered — 2026-10-22:** in-stage retry loop with a skip (user).
- **Follow-up:** map updated; the spec pins the retry mechanics.

## Wizard trigger — description-first rewrite — 2026-10-22

- **The question:** The trigger fails to fire: the agent defers to the user
  (instructions to run things themselves) at the exact moment the skill
  should fire. How is the trigger made to fire?
- **Context:** map `Wizard redesign — trigger, launch, censored input,
  verification`; researched — OpenCode lists skills per step by ID, name,
  and description, alphabetically; firing is the model matching the
  situation to the description, with no guaranteed-fire mechanism. The
  current description matches only after the agent has already decided to
  ask, and lacks the moment's anchor words (sudo, password, token,
  credential).
- **Decided (provisional):** description rewritten trigger-first with the
  situation's anchor words, generate-a-wizard framing last; a concrete
  scenario list joins the skill's Trigger section; validated against the
  user's real-world scenario tests.
- **Answered — 2026-10-22:** trigger-first rewrite plus the scenario list,
  validated by real-world tests (user).
- **Follow-up:** map updated; the spec pins the exact string (≤ 300
  characters) and the scenario list.

## Headless wizard runs — 2026-10-22

- **The question:** What happens when no GUI terminal exists to open (SSH,
  headless machine)?
- **Context:** map `Wizard redesign — trigger, launch, censored input,
  verification`.
- **Decided (provisional):** hand the user a one-line command to run in
  their own terminal; the agent still owns the run, but the terminal is the
  user's.
- **Answered — 2026-10-22:** the situation does not arise — the user's
  sessions always have a terminal to open; do not design a branch for it
  (user).
- **Follow-up:** map rules the case out of scope; the launch reference
  degrades by printing the one-line command when opening a terminal fails.

## Notify's network machinery — 2026-10-21

- **The question:** Notify reports a release lag on every verb run. Which
  runs actually consult GitHub, and what happens when the check fails
  (offline, rate-limited)?
- **Context:** map `Installer experience and release-synced updates`;
  policies are Manual / Notify / Auto, Notify settled as "reported on any
  verb run" plus the `status` verb.
- **Decided (provisional):** the check is a cheap `git ls-remote` of tags
  at the repo URL, read out of the client's local config; runs that
  cannot reach the network print nothing about releases and proceed.
  Embodied in the map's Decisions so far; will be pinned in the spec.
- **Answered — 2026-10-21:** every verb run consults the latest release,
  quietly skipped when offline (user).
- **Follow-up:** map updated; the spec pins the wording.

## Non-interactive installs — 2026-10-21

- **The question:** The guided first run makes policy selection mandatory.
  What does install do when there is no terminal to ask — CI, scripts —
  and no policy flag was passed?
- **Context:** map `Installer experience and release-synced updates`;
  policy is recorded at install, selection mandatory.
- **Decided (provisional):** fail with a message telling the user to pass
  the policy flag; the mandatory-selection rule survives scripted runs.
  Embodied in the map's Decisions so far; will be pinned in the spec.
- **Answered — 2026-10-21:** no terminal and unanswered questions → fail
  naming the flag that would answer each (user).
- **Follow-up:** map updated; the spec pins the wording.

## Switching policy after install — 2026-10-21

- **The question:** How does a user change their recorded policy — manual,
  notify, or auto — once the install exists? A new verb, a flag on later
  runs, or re-entering the guided prompts?
- **Context:** map `Installer experience and release-synced updates`;
  the policy lives in the record written at install.
- **Decided (provisional):** the policy flag re-records it on any later
  install or update run — cheapest surface, no new verb. Embodied in the
  map's Decisions so far; will be pinned in the spec.
- **Answered — 2026-10-21:** switching the policy is an interaction with
  the program, never a flag; flags only pre-answer the questions the
  interaction would ask (user).
- **Follow-up:** map updated — the provisional is superseded; the spec
  pins the wording.

## Snapshot bootstrap for one-command install — 2026-10-21

- **The question:** Is the copy-paste install story the plain
  `git clone … && cd girth-agents && ./scripts/install.sh` one-liner, or
  a curl-piped bootstrap that fetches the release tarball — which would
  also let people install without keeping a clone?
- **Context:** map `Installer experience and release-synced updates`; the
  user asked for a copy-pasteable install command from the GitHub repo and
  deferred the transport decision to the maintainer under "simplest
  machinery necessary".
- **Decided (provisional):** clone-only transport; the copy-paste story is
  the plain git one-liner; Auto pins the checkout to the latest release
  tag. Embodied in the map's Decisions so far; will be pinned in the spec.
- **Answered — 2026-10-21:** clone one-liner is the documented story; the
  curl bootstrap goes to the feature tracker to consider later (user).
- **Follow-up:** map updated; the bootstrap is now FEATURES.md's "Curl
  bootstrap for one-command install".