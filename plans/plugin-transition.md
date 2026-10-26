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

- Handoff and pickup: shelved for the time being — neither cut nor
  carried into the new system's active surface. The new vision
  ultimately makes them obsolete: the engine, tracker, and entry points
  carry the cross-session continuity the handoff did; decision 0005
  stands until the replacement proves out and supersedes it.
  (2026-10-25, narrated)
- `find-skills` and `/wait-what`: dead — removed from the catalog; their
  surfaces (the README's off-the-spine find-skills line, `/wait-what`'s
  rows) go with them. (2026-10-25, narrated)
- Renames: `writing-for-agents` becomes `technical-writing`; `tdd`
  becomes `test-driving`. Knock-ons: CONTRIBUTING's craft pointer, the
  README's chain diagram and rails, `implementing`'s execution cycle.
  (2026-10-25, narrated)
- Bootstrapping: declared — done eagerly and programmatically to the
  extent possible: the scaffold is created on the system's initiative,
  not on invitation, with everything derivable from the project derived
  rather than asked. (2026-10-25, narrated)
- The two flows: declared — the user interfaces with the system through
  two formally accounted workflows. The pro-active flow: the user
  provokes the system into re-action — any session that produces a valid
  entry-point document. The re-active flow: the system provokes the user
  into re-action — when the system needs information or action from the
  user, the request reaches the user through their inbox. (2026-10-25,
  narrated)
- The engine: declared — a driver for the system's automated aspects,
  whose working loop continuously seeks inputs prepared to become outputs
  (a new plan is the input to a review-and-refinement loop whose output
  is a reviewed plan). No human motion survives except where the
  interaction is genuinely due. (2026-10-25, narrated)
- The entry-point tool: declared — as generic a parser as possible:
  pointed at a file, it determines whether the file is a valid entry
  point into the system and incorporates its contents into the chain its
  kind calls for; anything not a valid entry point, or malformed in a way
  a parser can catch, is rejected loudly. It is the concrete boundary
  between known system outputs (touched freely) and user-interaction
  products (touched only after the user explicitly clears them).
  (2026-10-25, narrated)
- Wayfinding's ending: declared — no more "offer options on what to do
  next"; on user-confirmed conclusion the agent runs the entry-point tool
  on the map file. (2026-10-25, narrated)
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

- Handoff on the shelf — what the shelf means for the plugin: parked out
  of the published surface until the replacement proves out, or shipped
  dormant; when and how retirement lands on decision 0005 and
  `specs/handoff-pickup.md`. Tracked as "Handoff and pickup — what the
  shelf means for the plugin".
- The renames' open detail: whether `test-driving` purely renames `tdd`
  or carries a re-scope with it — the user's own "test driving" phrasing
  hints the practice matters to this effort's shape.
- Eager bootstrapping — what remains human-asked, and where those asks
  travel: the interview's fate (derivation fills everything the project
  can state; the rest travels to the inbox per the re-active flow rather
  than blocking in session), the gh CLI check and deviations under an
  eager programmatic run, and whether `/bootstrap` survives as the
  human-triggered re-run door. Tracked as "Eager bootstrapping — what
  stays human-asked and where it travels".
- The two flows — open mechanics: what a session must produce to count as
  a pro-active flow (one entry point? at least one? how several queue);
  how a system-to-user request lands in the inbox — the tracker question
  kind, or a new inbox-owned kind — and how curate-inbox's "stray calls
  for attention" changes; how the flows interleave (an inbox answer may
  itself produce the next entry-point document). Tracked as "Re-active
  flow — how system requests land in the inbox" and "Pro-active flow —
  what counts as an entry-point-producing session".
- The engine and the entry-point tool — mechanics still fog: whether the
  engine is plugin runtime (server-side, event-driven, across sessions)
  or an agent-driven loop; which files count as valid entry points
  (plans, specs, tickets, work — every stage output?); what markers
  distinguish known outputs from cleared and undetermined user products;
  the interplay with "Review loop — the mechanism" (the engine likely
  hosts the loop) and "Review loop — where graded reports live" (the
  reports' home likely feeds the parser's input classes). Tracked as
  "The engine and the entry-point tool — mechanics" and "Entry points —
  how outputs and cleared products are marked".
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
