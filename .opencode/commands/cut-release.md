---
description: Cut a release — version the changelog's Unreleased queue and tag it
---

Cut a release for this project, per the versioning ruling in
`conventions/On_Versioning.md`:

1. Read the `## [Unreleased]` queue in `CHANGELOG.md`. Empty → say so and
   stop.
2. Propose the version from what the queue holds — Removed or a breaking
   Change → major; Added or Deprecated → minor; only Fixed or Security →
   patch — and present the entries grouped by section. Ask me to confirm or
   override; my confirmation is the release.
3. Apply per the changelog's format (call the skill tool with `changelog`):
   retitle the queue as `## [<version>] - <YYYY-MM-DD>`, drop its empty
   sections, and open a fresh `## [Unreleased]` above it with the full set
   of empty sections. Update comparison links if the project keeps them. If
   a tool owns the changelog, run the tool's release workflow instead.
4. Commit with a conventional message, tag `v<version>`, and push.

Any text below this is my direction, such as a proposed version to confirm
or a section to double-check.