# 01: The plugin skeleton and the channel

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** None (can start immediately)

## What it delivers

Pointing OpenCode at this repository loads a working plugin on both
sides: the package manifest lives at the repo root with the server
export and the TUI export, the catalog's Markdown bundles with it and
registers at setup through the skill, command, and agent transforms,
and the end-user install script retires. The build-time keystones that
gate this ticket are verified first, honestly reported either way:
plugin-added brand-new agent IDs, the git-spec `./tui` auto-load,
`ctx.storage` durability and location, the event catalog and
`session.idle` payload, `codemode` semantics, and sidebar-slot
live-reactivity.

## Acceptance criteria

- [ ] The plugin loads from a git-spec install of this repo, server side and TUI side.
- [ ] The Markdown catalog registers through the transforms — skills, commands, agents.
- [ ] The install script's end-user verbs retire; the checker and harnesses remain builder-side.
- [ ] Each of the seven keystones' verification outcomes is recorded where it can be re-read, with no silent assumption.