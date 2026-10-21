# Changelog

## Purpose

`CHANGELOG.md`, at the project root, tells the project's users what changed,
release by release. Its reader holds a version number and one question: what
does this change mean for me? Every entry answers that question. Its creation template is `references/changelog-template.md`.

## What belongs

- **Every change a user of the project could notice:** a new capability,
  changed behavior, a deprecation, a removal, a fix, a security patch.
- **Nothing users cannot observe:** refactors, test changes, and internal
  tooling stay out.
- **One entry per change.**

Some projects generate the changelog with a tool — changesets,
release-please, git-cliff, a conventional-commits generator — leaving traces
such as a `.changeset/` directory, `release-please-config.json`,
`cliff.toml`, or release scripts in the package manifest. In such a
project the file belongs to the tool: entries are written in the form the
tool takes as input, and the generated file is never edited by hand. The
entry rules below still govern what each entry says.

## Format

The format follows Keep a Changelog, with SemVer versions. `## [Unreleased]` sits at the top,
then one `## [<version>] - <YYYY-MM-DD>` section per release, newest first.
Each holds these sections, in this order:

| Section    | For                                |
| ---------- | ---------------------------------- |
| Added      | New capabilities                   |
| Changed    | Changes to existing behavior       |
| Deprecated | Capabilities scheduled for removal |
| Removed    | Capabilities taken out             |
| Fixed      | Bug fixes                          |
| Security   | Vulnerability fixes                |

An entry:

```markdown
- <The affected thing>: <what changed>, so <why it matters to the reader>.
  <What the reader must do, if anything.>
```

- **Leads with the affected thing** — the command, option, endpoint, page,
  or behavior — named in the glossary's terms.
- **Carries the so-what.** "`export` now writes UTF-8 by default, so files
  open correctly in spreadsheet tools" tells the reader something; "changed
  export encoding" makes them work it out.
- **Gives a breaking change its migration step** — the exact action the
  reader takes ("rename `config.yml` to `settings.yml`"). A removal names its
  replacement, or states that there is none.
- **Points at the source** where one exists: the tracker entry, issue, or
  pull request.
- **Speaks to the user, not the implementer.** Internal file and function
  names appear only when they are the user's interface.

The versioning is a project ruling, not a changelog detail: the concrete
scheme — the starting version and who approves each bump — is recorded in
`conventions/` as a convention, and the changelog head cites it after the
SemVer line. When no manifest version, tag, or convention states a scheme,
interview the user and record the answer; never invent one.

## Changing it

- `## [Unreleased]` is the queue: entries land there as changes are made.
- A release retitles the queue as `## [<version>] - <YYYY-MM-DD>`, drops its
  empty sections, and opens a fresh `## [Unreleased]` above it with the full
  set of empty sections. Comparison links at the bottom of the file, if the
  project keeps them, are updated to match.
- The version follows SemVer from what the release holds: anything Removed
  or a breaking Change → major; Added or Deprecated → minor; only Fixed or
  Security → patch.
- Released sections are history and are not rewritten.
- Establishing the versioning scheme, or repairing head metadata, is not a
  user-visible change and produces no entry.
- A changelog adopted after work has begun starts with `## [Unreleased]`
  and records changes from then on; nothing is reconstructed.
