# Changelog

All notable changes to this project are documented in this file.
Format follows Keep a Changelog (<https://keepachangelog.com>); versions follow SemVer.

## [Unreleased]

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
### Deprecated
### Removed
### Fixed
### Security
