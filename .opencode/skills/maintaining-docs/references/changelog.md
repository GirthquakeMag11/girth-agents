# CHANGELOG.md — what changed, for the project's users

The changelog's reader holds a version number and one question: what does
this change mean for me? Every entry answers that question.

## When to record

- **At change time, in the same change.** `## [Unreleased]` is the queue:
  entries land there as the work lands, not at release time and never
  reconstructed later from commit history.
- **Every change a user could notice:** a new capability, changed behavior,
  a deprecation, a removal, a fix, a security patch. Changes no one outside
  the project can observe — refactors, test changes, internal tooling — stay
  out.
- **One entry per change.** If the change extends an entry already under
  Unreleased, extend that entry.

## Where an entry goes

Under `## [Unreleased]`, in the section that fits:

| Section | For |
| --- | --- |
| Added | New capabilities |
| Changed | Changes to existing behavior |
| Deprecated | Capabilities scheduled for removal |
| Removed | Capabilities taken out |
| Fixed | Bug fixes |
| Security | Vulnerability fixes |

The trackers feed it: a fixed bug goes under Fixed; a feature whose closure
the user approved goes under Added or Changed; a remediated defect goes under
Changed only when a user could notice the difference.

## Writing an entry

```markdown
- <The affected thing>: <what changed>, so <why it matters to the reader>.
  <What the reader must do, if anything.>
```

- **Lead with the affected thing** — the command, option, endpoint, page,
  or behavior — named in the glossary's terms.
- **Carry the so-what.** "`export` now writes UTF-8 by default, so files
  open correctly in spreadsheet tools" tells the reader something; "changed
  export encoding" makes them work it out.
- **Give breaking changes their migration step** — the exact action the
  reader takes ("rename `config.yml` to `settings.yml`"). A removal names
  its replacement, or states that there is none.
- **Point at the source** where one exists: the tracker entry, issue, or
  pull request.
- **Write for the user, not the implementer.** Internal file and function
  names appear only when they are the user's interface.

## Releasing

Cutting a release is the user's call; entries stay under Unreleased until
the user asks for one. When asked:

1. Propose the version from what Unreleased holds, per SemVer: anything
   Removed or a breaking Change → major; Added or Deprecated → minor; only
   Fixed or Security → patch. The user confirms or overrides.
2. Retitle the queue as `## [<version>] - <YYYY-MM-DD>`, drop its empty
   sections, and open a fresh `## [Unreleased]` above it with the full set
   of empty sections.
3. Update the comparison links at the bottom of the file if the project
   keeps them.

## When a tool owns the changelog

Some projects generate `CHANGELOG.md` with a tool — changesets,
release-please, git-cliff, a conventional-commits generator. Look for its
traces: a `.changeset/` directory, `release-please-config.json`,
`cliff.toml`, release scripts in the package manifest. Where one exists, its
workflow governs: write the fragment, file, or commit message the tool
expects, and leave the generated file to the tool. The entry-writing rules
above still govern what you write.