# The skillset becomes an OpenCode plugin

**Status:** charting

## Destination

A formally recorded decision (`decisions/`) turning this catalog into an
OpenCode plugin, then one umbrella spec — the skills, commands, agent
types, tools, and code of that plugin — written as one coherent set and
approved once. Building and slicing are the next effort and begin only
after approval.

## Notes

- The catalog's identity carries into the plugin: skills, commands, and
  agents stay plain Markdown, ship bundled with the plugin, and the
  plugin's `setup()` registers them through the skill/command/agent
  transforms. Nothing converts to code unless a trigger needs it.
- The user's test-driving surfaced the change set: many item-level
  changes aimed at cross-cutting concerns — too disorganized to enumerate
  linearly. The map is the organizer: the cloud is harvested, then worked
  decision by decision.
- `plans/installer-experience.md` ruled package-manager channels out of
  scope for the installer. The plugin supersedes that ruling where it
  lands; the channel decision settles how far.
- Facts the map leans on: plugins register agents, commands, skills, and
  tools via transforms; package plugins publish to npm and
  install/update/check through `opencode plugin`; the repo remains the
  dev workspace regardless of channel.

## Decisions so far

- Destination shape: one umbrella spec covering all five areas, approved
  once; the `decisions/` record is written first and the spec references
  it. (2026-10-25, round 1 — see "Destination shape" in QUESTIONS.md)
- Markdown's place: bundle + register at plugin setup. (2026-10-25,
  round 1 — see "Markdown's place in the plugin" in QUESTIONS.md)

## Not yet specified

- The change cloud — the full set of changes to skills, commands, agents,
  tools, and code, narrated in chat and organized into the tree as it
  arrives. Tracked as "The change cloud".
- The channel — npm package, git spec, or both; deferred by the user.
  Tracked as "The channel".
- The installer/release machinery's fate under the plugin. Tracked as
  "Installer and release machinery under the plugin".
- Agent types and the plugin's tool/code surface — hang off the change
  cloud and the channel.
- The plugin package's layout inside the repo.

## Out of scope

- OpenCode V1 support: the catalog is V2-only and stays so.
