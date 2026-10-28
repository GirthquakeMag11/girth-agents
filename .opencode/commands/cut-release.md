---
description: Cut a release — version the changelog's Unreleased queue, tag it, and publish it
---

Cut a release for this project, per the versioning ruling in
`conventions/On_Versioning.md`:

1. Read the `## [Unreleased]` queue in `CHANGELOG.md`. Empty → say so and
   stop.
2. Propose the version from what the queue holds — Removed or a breaking
   Change → major; Added or Deprecated → minor; only Fixed or Security →
   patch — and present the entries grouped by section. Ask me to confirm or
   override; my confirmation is the release.
3. Apply per the changelog's format (call the skill tool with
   `maintaining-docs`):
   retitle the queue as `## [<version>] - <YYYY-MM-DD>`, drop its empty
   sections, and open a fresh `## [Unreleased]` above it with the full set
   of empty sections. Update comparison links if the project keeps them. If
   a tool owns the changelog, run the tool's release workflow instead.
4. Commit with a conventional message, tag `v<version>`, and push.
5. Publish the release on GitHub: the changelog's new section as the notes
   via `gh release create`. Check first whether a declination is already
   recorded in the project's conventions; a recorded "no gh" means skip
   publication silently. Otherwise, if the `gh` CLI is present, create the
   GitHub Release with it. If it is missing, call the skill tool with
   `bootstrapping` and offer its gh setup wizard — walked with the user —
   before publishing; a decline is a ruling, recorded in `conventions/` by
   calling the skill tool with `codifying`, and publication is skipped from
   then on.

Any text below this is my direction, such as a proposed version to confirm
or a section to double-check.