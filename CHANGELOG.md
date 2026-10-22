# Changelog

All notable changes to this project are documented in this file.
Format follows Keep a Changelog (<https://keepachangelog.com>); versions follow SemVer.
Versioning is ruled in `conventions/On_Versioning.md`.

## [Unreleased]

### Added
- `handoff`: a skill carrying a session's context across agents — HANDOFF.md's format, the staleness playbook (untrue → modify or excise, unimportant → replace or excise), and the write-and-sweep and pickup protocols.
- `/pickup`: resumes the project's handoff, consuming context as the work makes it stale, and deletes the document once fully consumed.

### Changed
- `/handoff`: writes HANDOFF.md into the project's repository and commits it (`docs(handoff): record <slug>`), obeying an `On_Handoffs.md` conventions override where one exists — no longer the temp directory.
- `grilling`: asks through the question-asking tool when one is available — one prompt per frontier question, the recommendation as the first option, numbered text as the fallback.
- `specifying`: before the approval ask, the written spec is submitted to an independent fresh-context review — grilling may run again after it if findings open new questions — and the approval itself is put to the user as three options: Approve (Commit), Approve and Slice, Stop and Amend, the freeform fourth coming free with the question tool, offered by hand without one.

### Deprecated
### Removed
### Fixed
### Security

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
