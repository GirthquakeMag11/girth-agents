# The skillset becomes an OpenCode plugin

The girth-agents catalog — a set of skills, commands, and agents that
create and maintain a project's management scaffold, distributed today
by cloning the repo and running an install script — becomes an OpenCode
plugin. The plugin is the product: an always-awake engine that runs a
plan→review→spec→tickets→work chain behind six named helper agents,
an inbox as the asynchronous channel to the user, a tracker holding the
project's open work and learned lessons, a glossary kept true by a
dedicated caregiver under the user's authority, and a real-case test
harness that gates every merge to main.

Status: accepted.

## Evidence

`plans/plugin-transition.md` — a map worked decision by decision from
2026-10-25 to 2026-10-27, now `done` — carries the full trail. It
passed its own three-reviewer gate unanimously on the second round;
every thread it opened is followed to an answer or parked by name. Its
decisions are recorded in `tracker/QUESTIONS.md`, its ground research in
`docs/research/`.

## Considered options

- Keep the install-script distribution — rejected: the map's channel
  ruling points users at the repository itself, and OpenCode's own
  plugin machinery supersedes the clone-and-install transport.
- Publish to a package registry (npm) — rejected for now: the channel
  ruling chose pointing OpenCode at the GitHub repository; a registry
  publication remains a later option, not a contradiction.
- The plugin as described — accepted: plain Markdown stays the product
  form, bundled and registered at plugin setup; the machinery around it
  is code.

## Consequences

- The repo is both workshop and the install artifact: the plugin lives
  at the repository root, and users load it by pointing OpenCode at the
  repo.
- The catalog is rebuilt around the engine: `ideation` and `/ideate`
  join it; `find-skills`, `/wait-what`, `curate-inbox`,
  `/close-inbox`, and their retiree siblings leave; `tdd` becomes
  `test-driving`, `writing-for-agents` becomes `technical-writing`,
  and `slicing` becomes its own skill behind the thin `/slice` door;
  `handoff`, `pickup`, `/retro`, and the wizard pair wait on the shelf.
- The scaffold gains pieces: a reports pile, an inbox message record,
  a context map, and tracker kinds for term proposals and lessons —
  all inventoried by the scaffold-family maintenance at
  implementation.
- What remains open is parked by name, not fog: the spec-time keystones
  (verified at build), the spec details the umbrella spec pins, the
  scaffold-migration rules, and the future concurrency stance.
- The umbrella spec — one document covering the skills, commands,
  agent types, tools, and code — is the next effort, approved once,
  and the details of this decision stand or fall with it.