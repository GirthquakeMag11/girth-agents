# Keystone verification record

The plugin's build-time keystones, verified headlessly where honest and
recorded where they cannot be — kept current as tickets advance.

Verified 2026-10-27, ticket 01's probes (scratch project
`/tmp/opencode/girth-probe`, plugin loaded from this checkout):

## ctx.storage — durability and location

- **Roundtrip**: a key written and read back in the same load succeeds.
- **Across a service restart**: the marker written at
  `2026-10-27T23:09:12.909Z` read back intact after `opencode service
  restart` — storage survives restarts. VERIFIED.
- **Location**: OpenCode-managed per-plugin store; its exact filesystem
  home is OpenCode's internal, and the design never reads it directly.
  The activation registry (ticket 21) will live here and inherits this
  outcome.

## Plugin-added brand-new agent IDs

- The catalog currently has no agent files, so the add path could not be
  exercised honestly. The attempt logic stores its outcome in plugin
  storage as "NO AGENTS YET — verification deferred to ticket 07". NOT
  VERIFIED YET.

## git-spec `./tui` auto-load

- Server-side loading verified: a plugins entry pointing at this
  checkout loads the plugin and registers 21 skills and 14 commands.
- The TUI export's loading under a git-spec install has not been
  exercised — it needs a live TUI session. NOT VERIFIED YET
  (re-verified at ticket 16).

## Event catalog and `session.idle`

- The event subscription works; the real catalog is broader than the
  docs' examples — `session.usage.updated` and `session.renamed` were
  observed first.
- `session.idle` was not observed in the short active-window probe. NOT
  CONFIRMED — re-verified at ticket 09 against a real completed session.

## `codemode` semantics

- VERIFIED IN PRACTICE: tools registered with
  `options: { namespace: "girth", codemode: true }` surfaced to the
  model's code-mode tool surface as `tools.girth.<name>(...)` and
  executed from there.

## Sidebar-slot live-reactivity

- The sidebar slot renders in a live TUI — untested headlessly. NOT
  VERIFIED YET (re-verified at ticket 16).