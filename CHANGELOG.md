# Changelog

All notable changes to this project are documented in this file.
Format follows Keep a Changelog (<https://keepachangelog.com>); versions follow SemVer.
Versioning is ruled in `conventions/On_Versioning.md`.

## [Unreleased]

### Added
- `engine`: the plugin's always-awake harness now exists as a working process — it boots only on schema-valid config, watches activated projects' records and reconciles their stamps, walks its configured node graph through headless sessions (pre-granted deny-rest permissions, dispatch-time checks, time budgets with interrupts), runs a claimed plan through to an exit that commits its typed awaiting record, delivers its own git per-unit commits with offline retries and a non-fast-forward hold, and answers introspection for any of its task sessions at any time. Specced in `specs/engine.md` and sliced into tickets 23-30.
- `engine` config verification: workflow configs are verified before they are trusted — deep schema constraints each named, structural faults (dangling links, unknown helpers, unreachable nodes, dead exits), and a dry-run matrix that probes every branch and the value nothing routes. What the verifier names is a config problem; a failure on a verified-sound config is an engine problem.
- `engine` retry limits: a task node carries a maxVisits bound with an exhausted link — the structure enforces the loop limit, the config sets the number.
- `engine` the first real workflow — the implement-verify loop: implement-from-ticket routes to review-implementation unconditionally; the review stamps exactly pass or fail, fail routing back to implement-from-ticket, pass to the exit — which writes nothing, the work itself being the outcome. Implement-from-ticket is both the gate (a claimed ticket must carry the ready stamp) and the first work step, the executor supporting an entry that also wears a helper. Every brief names the claimed ticket for the helper to read; a claim without the ready stamp is a loud defect, and a stamp outside pass/fail defects loudly rather than routing. The verifier's matrix follows the loop lap by lap — an escapable cycle terminates its probes, an escapeless one is named a loop fault. The README illustration is a plain-text flow chart generated from the live config (the fail branch drawn as the return arc) and drift-tested.
- `engine` configs are file trees, and skills are first-class: a thin manifest points at one Markdown file per agent, per node, and per skill. An agent's frontmatter carries its job, toolset, permissions, model, and the skills it bears — the engine loads real skill documents and gives them to the agent in its session; tasks and skills are separate concerns, tasks never supplanting skills. A node's file carries its objective and its out-links. The dispatched brief carries the agent's skills, the node's objective, and — on repair — the failed step's report.
- `/wizard`: a command that generates a wizard for a secret or a hands-on procedure and takes the same offer-to-launch path, so manual use matches triggered use.

### Changed
- `wizard`: the trigger now leads with the moment — a command that needs a password, token, API key, or other secret, or a procedure only the user can do. The skill offers to launch the wizard in a new terminal and waits for an explicit yes every time; secret input is censored with a visible mask per keystroke; every captured value is checked before it is persisted, failures re-ask in place, and a run ends listing anything skipped or still failing with the exact error.
- `handoff` and `tracking`: the handoff and the tracker are no longer two competing places for open work — `decisions/0005` rules the junction. The handoff carries a session's own continuation across the gap, written only when `/handoff` is run and consumed to deletion by `/pickup`; the tracker alone defers work. The freshness-check trigger is gone: staleness is handled at the two doors, never in between.
- `wayfinding`: the one-decision-per-session pacing rule is removed from the Work-the-map step, and its echoes in the skill's description and the README follow — the per-session cadence it assumed is not how wayfinding runs.
- `wayfinding`: the tracker's place beside the map is stated — a bug spotted mid-charting goes to a background agent that investigates and creates the tracked bug item where necessary; off-course or deferred questions become tracked questions, never interruptions; features and defects surfaced along the way get tracked items too.

### Deprecated
### Removed
- `teaching` and `/teach`: the learning lane leaves the catalog — teaching across sessions is judged not a fit for this skillset, so the skill and its command go, and the `education/` scaffold piece they owned retires from the bootstrapping inventory with them. Ruled in `decisions/0006`.
### Fixed
### Security

## [0.4.0] - 2026-10-21

### Added
- `handoff`: a skill carrying a session's context across agents — HANDOFF.md's format, the staleness playbook (untrue → modify or excise, unimportant → replace or excise), and the write-and-sweep and pickup protocols.
- `/pickup`: resumes the project's handoff, consuming context as the work makes it stale, and deletes the document once fully consumed.
- `status`: the installer's fourth verb — installed release, latest cut release, update policy, and the gap; `status --notes` prints the changelog sections between the two.
- The update policy — manual, notify, or auto — asked at install, recorded beside it, and obeyed by update.

### Changed
- `/handoff`: writes HANDOFF.md into the project's repository and commits it (`docs(handoff): record <slug>`), obeying an `On_Handoffs.md` conventions override where one exists — no longer the temp directory.
- The installer is interactive by default: a menu of deeds beside Configuration, the two recorded questions answered at install and re-shaped only there; a flagless scripted run fails naming the flag it needed rather than guessing.
- `update` honors the policy — auto checks the checkout out onto the latest cut release, notify reports a newer release and how to take it — and shows the changelog notes after a sync.
- `/cut-release` publishes the GitHub Release — the changelog section as notes, the one-line install in the body — via gh, routing a missing gh to bootstrapping's setup wizard; a declination is recorded in conventions and skipped thereafter.
- `bootstrapping` checks for the gh CLI and offers a setup wizard; a recorded declination skips the check from then on.
- `grilling`: asks through the question-asking tool when one is available — one prompt per frontier question, the recommendation as the first option, numbered text as the fallback.
- `specifying`: before the approval ask, the written spec is submitted to an independent fresh-context review — grilling may run again after it if findings open new questions — and the approval itself is put to the user as three options: Approve (Commit), Approve and Slice, Stop and Amend, the freeform fourth coming free with the question tool, offered by hand without one.

## [0.3.0] - 2026-10-21

### Added
- `/slice`: turns an approved spec — or an oversized bug or defect — into tickets, checkpointed for approval, handing the frontier to `/implement`.
- The installer is one script, three verbs — `install`, `uninstall`, `update` — that verifies the catalog before installing, records every placement in `girth.yaml`, removes exactly what it recorded, and reconciles on update; covered by a 79-assertion test harness.
### Changed
- `implementing` no longer slices: the spec-to-tickets step and its checkpoint move to `/slice`, and `/implement` works already-sliced tickets.
- `specifying`: the spec is written first from the settled conversation, and `grilling` then fills and refines its gaps — the old no-second-interview rule is gone.
- The catalog has one skill class. Nine skills that only held scaffold formats — `glossary`, `conventions`, `decisions`, `tracker`, `docs`, `changelog`, `specs`, `plans`, `education` — fold into the skills that work those pieces, so every skill stands alone and the list drops from 30 to 21.
### Removed
- `glossary`, `conventions`, `decisions`, `tracker`, `docs`, `changelog`, `specs`, `plans`, and `education` as standalone skills; their formats now travel as `references/` in `tracking`, `domain-modeling`, `codifying`, `maintaining-docs`, `specifying`, `wayfinding`, and `teaching`.
### Fixed
- README: a duplicated chain-map section left from the section
  rewrite is removed, so the map is documented once.

## [0.2.0] - 2026-10-20

### Added
- README documents the skill chains — the branches and the working loop
  from bare idea to workable project, with the docs owner's README
  contract extended to keep them true.
- `curate-inbox`: opens the user's inbox — collects tracker items and
  stray calls for attention, processes them one at a time, records each
  answer, and routes — never starts — the work answers reveal.
- `/inbox` and `/close-inbox`: enter and leave the curation flow; the close
  wraps up and offers the surfaced work to execution.
- `find-skills`: discovers and installs skills from the open ecosystem —
  searches skills.sh and the Skills CLI, verifies quality, presents options,
  installs on confirmation.
- `/cut-release`: versions the `[Unreleased]` queue into a dated, tagged
  release on confirmation, so a release is always a deliberate call.
### Changed
- README's chain map speaks the flow language — doors, trigger-fired
  skills, and records; edges mean "typically leads to", and the four
  recovery rails stay reachable from every step, per
  `conventions/On_Chains.md`.
- `maintaining-docs` no longer cuts releases mid-maintenance; it keeps the
  changelog release-ready and points at `/cut-release`.

## [0.1.0] - 2026-10-19

### Added
- Management scaffold: `tracker/`, `GLOSSARY.md`, `decisions/`, and this
  changelog, so items are tracked, the project's terms are shared, and
  decisions are recorded.
### Changed
- `CONTRIBUTING.md` moved to the repository root, so this project matches
  the scaffold layout its own catalog prescribes.
- `implementing` routes inputs by what they are: a ticket is the unit of
  work, a spec or a big bug or defect is a source of tickets, a feature
  implements through its spec, and `/implement` with nothing named works the
  open frontier in order.
- `tracker`: a ticket's `Parent:` names the source it was sliced from — a
  spec path, bug, or defect — not a feature.
- `bootstrapping`: a run adapts to what it finds and re-runs safely —
  missing pieces are created, gaps inside existing pieces (a changelog with
  no versioning established) are repaired, and a run that finds nothing
  reports and stops.
- `changelog`: versioning is a ruling recorded in `conventions/`,
  established by interview when nothing states one; establishing it
  produces no changelog entry.
