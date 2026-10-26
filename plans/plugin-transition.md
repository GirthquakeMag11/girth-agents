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

- Review gate: every stage's output passes a PASS/FAIL review against
  criteria derived from the upstream reviewed document before the next
  stage consumes it; wayfinding is the ungated entry; a FAIL returns the
  work with the report for rectification and resubmission, until PASS.
  (2026-10-25, narrated)
- Slicing: becomes its own skill; the procedure moves out of the `/slice`
  command body into the skill. (2026-10-25, narrated)
- Destination shape: one umbrella spec covering all five areas, approved
  once; the `decisions/` record is written first and the spec references
  it. (2026-10-25, round 1 — see "Destination shape" in QUESTIONS.md)
- Markdown's place: bundle + register at plugin setup. (2026-10-25,
  round 1 — see "Markdown's place in the plugin" in QUESTIONS.md)

## Not yet specified

- The review gate — the PASS/FAIL review-and-rectify loop, now applied at
  every stage: task → agent performs → a separate agent reviews against
  criteria and writes a report → PASS/FAIL → FAIL rectifies and
  resubmits, until PASS. The gates cascade: wayfinding is the ungated
  entry (criteria from session content and project context); specifying
  reviews against the plan; slicing against the spec; implementing
  against the tickets. Open: the loop's mechanical home (plugin tool,
  skill, reviewer agent type — the agent-type/tool cloud items); where
  graded reports live (a new scaffold piece would enter bootstrapping's
  inventory); how criteria documents are derived and passed; whether
  rectification is bounded; the interplay with the existing checkpoints
  (slice's user approval, spec's approval options). Existing precedent:
  specifying's own fresh-context review, which this generalizes.
  Tracked as "Review loop — the mechanism" and "Review loop — where
  graded reports live".
- Slicing: the `/slice` door's fate — survive as the thin call that starts
  the skill, or model-invoked only — plus the skill's trigger description
  and the knock-ons: `implementing`'s and `specifying`'s `/slice` pointers
  and the README rows. Tracked as "Slicing skill — the /slice door's fate".
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
