# Changelog

All notable changes to this project are documented in this file.
Format follows Keep a Changelog (<https://keepachangelog.com>); versions follow SemVer.
Versioning is ruled in `conventions/On_Versioning.md`.

## [Unreleased]

### Added
- `find-skills`: discovers and installs skills from the open ecosystem —
  searches skills.sh and the Skills CLI, verifies quality, presents options,
  installs on confirmation.
- `/cut-release`: versions the `[Unreleased]` queue into a dated, tagged
  release on confirmation, so a release is always a deliberate call.
### Changed
- `maintaining-docs` no longer cuts releases mid-maintenance; it keeps the
  changelog release-ready and points at `/cut-release`.
### Deprecated
### Removed
### Fixed
### Security

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
