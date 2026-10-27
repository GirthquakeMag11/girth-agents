# OpenCode V2: Project / Location Mechanics

**Question this feeds:** Our plugin's engine is scoped "per project" — bootstrapping, the
tracker, the inbox, the report pile, and the glossary all live in a project. The whole
design assumed a single-project, code-based repository. We must now learn exactly what
"a project" and "a location" mean to OpenCode V2 itself, so we can design how the engine
accounts for monorepos (nested packages) and non-code repositories.

**Date:** 2026-10-26
**Sources:** OpenCode V2 docs (https://opencode.ai/v2/docs/…, found via
https://opencode.ai/v2/llms.txt) and the OpenAPI schema (https://opencode.ai/v2/openapi.json).
No blogs, no V1 docs. Claims that could not be verified against these sources are listed
in "Unverified" under each section and in the closing summary.

---

## 1. Locations vs projects vs workspaces

### The Location type (plugin view)

- `ctx.location` "describes the location where this plugin instance is loaded. It includes
  `directory`, optional `workspaceID`, and `project` metadata (`id`, `directory`, and
  `canonical`). It is available in both Promise and Effect plugins. This is the plugin
  instance's location, not the location of every session it can access or event it
  receives." — https://opencode.ai/v2/docs/build/plugins/ (Lifecycle → Context)
- The Effect plugin context carries the same shape: `readonly location: Location.Info`.
  — https://opencode.ai/v2/docs/build/plugins/effect/ (Context interface)
- In the Promise plugin, all location-scoped domain reads (`ctx.skill.list()`,
  `ctx.command.list()`, `ctx.agent.list()`, `ctx.reference.list()`, `ctx.plugin.list()`,
  `ctx.mcp.list()`, `ctx.vcs.*`) are described as reading "at a location" / "available at a
  location" — i.e., they resolve against the plugin instance's location.
  — https://opencode.ai/v2/docs/build/plugins/ (API sections)
- A plugin can enumerate sessions *of that location*:
  `ctx.session.list({ directory: ctx.location.directory, limit: 20 })`.
  — https://opencode.ai/v2/docs/build/plugins/ (API → Sessions)

### The Location type (server/OpenAPI view)

- `Location.PublicInfo` (OpenAPI schema, `#/components/schemas/Location.PublicInfo`):
  ```json
  {
    "directory": "<AbsolutePath>",
    "project": {
      "id":       "<Project.ID>",
      "directory": "<AbsolutePath>",
      "canonical": "<AbsolutePath>"
    }
  }
  ```
  `directory` and `project` are **required**; all three project fields (`id`, `directory`,
  `canonical`) are **required**. — https://opencode.ai/v2/openapi.json
- `Location.PublicRef` — the lightweight form used as the `location` input/output on
  sessions — has only `{ "directory": "<AbsolutePath>" }`, required.
  — https://opencode.ai/v2/openapi.json (`#/components/schemas/Location.PublicRef`)
- `GET /api/location` resolves "the requested location or the server default location" and
  returns `Location.PublicInfo`; unknown locations produce `LocationNotFoundError`.
  — https://opencode.ai/v2/openapi.json (operation `location.get`)
- `POST /api/location/reload` shuts down and rebuilds **every loaded location**; running
  sessions continue with fresh services at the next step boundary.
  — https://opencode.ai/v2/openapi.json (operation `location.reload`)

### The Project type

- `Project` (OpenAPI schema, `#/components/schemas/Project`): `id` (Project.ID, required),
  `canonical` (AbsolutePath, required), `vcs` (Project.Vcs, optional), `name`, `icon`,
  `commands` (optional, containing an optional `start` "Startup script to run when creating
  a new workspace (worktree)"), `time`, `sandboxes`. — https://opencode.ai/v2/openapi.json
- `GET /api/project` lists known projects ("Archived projects are excluded unless
  archived=true"); `PATCH /api/project/{projectID}` "Update the project canonical
  directory, display metadata, and workspace commands."
  — https://opencode.ai/v2/openapi.json (operations `project.list`, `project.update`)
- The `canonical` directory is the project's saved primary checkout: "Worktree creation and
  refresh load configuration from the project's saved canonical checkout, including when
  other clones share its project ID." — https://opencode.ai/v2/docs/config/ (Worktrees)
- Without a configured worktree directory, worktree creation defaults to the server's data
  directory under `worktree/<first-six-project-ID-characters>` — i.e., the project ID is
  the durable identity that worktrees key on. — https://opencode.ai/v2/docs/config/ (Worktrees)
- Worktree operations are keyed by `projectID`, not by directory:
  "The plugin context exposes the same project-based worktree operations as the client.
  Every operation requires a `projectID`." — https://opencode.ai/v2/docs/build/plugins/
  (API → Worktrees)
- The SDK shows the same pattern: `const projectID = session.projectID` is passed to
  `opencode.worktree.create({ projectID, name })`. — https://opencode.ai/v2/docs/build/sdk/
  (Worktrees)

### "Workspace" — three different meanings in the V2 docs

- **Console workspace** (account/billing construct): "A workspace holds everything in the
  Console: members, credits, budgets, providers, policies, and service accounts. Usage and
  billing are tracked per workspace." Connected via `/connect`.
  — https://opencode.ai/v2/docs/console/workspaces/
- **Working directory** (loose usage): the instructions guide refers to the "current
  workspace directory" as the place AGENTS.md discovery starts.
  — https://opencode.ai/v2/docs/instructions/
- **Worktree** (glossed as a workspace): the OpenAPI description of `Project.Commands.start`
  says "Startup script to run when creating a new workspace (worktree)".
  — https://opencode.ai/v2/openapi.json (`#/components/schemas/Project.Commands`)

### What `workspaceID` is — chase-down result

- The only V2 documentation of `ctx.location.workspaceID` is the single line in the
  plugins guide: it exists and is optional. — https://opencode.ai/v2/docs/build/plugins/
  (Lifecycle → Context)
- The OpenAPI schema does not contain `workspaceID` anywhere. Its only "workspace"
  references are the Console usage-limits route ("the OpenCode Console workspace the
  location is signed in to") and the worktree gloss above.
  — https://opencode.ai/v2/openapi.json (grep of `workspace`: `/api/experimental/usage/limits`
  description and `Project.Commands.start`)
- **Unverified:** no primary source states where `workspaceID` is set or what it
  identifies. The plausible reading (Console workspace identity when `/connect`ed) is an
  inference, not a documented fact. Treat `workspaceID` as "may be present, meaning
  unspecified."

---

## 2. Config discovery across a monorepo

- Config file places: system directory (`/etc/opencode` on Linux, plus `agents/`,
  `commands/`, `skills/`, `plugins/`), global `~/.config/opencode/opencode.json(c)`, and
  project files — either `opencode.json(c)` at the project root **or**
  `.opencode/opencode.json(c)`. — https://opencode.ai/v2/docs/config/ (Locations)
- Discovery order (verbatim): "OpenCode searches from the current directory to the
  filesystem root. It first merges direct `opencode.json(c)` files from the farthest
  directory to the closest, then merges files inside `.opencode` directories in the same
  order. This means every discovered `.opencode` config overrides every direct config."
  — https://opencode.ai/v2/docs/config/ (Locations)
- The monorepo example: starting from `/home/user/projects/acme/packages/web`, the
  applied files are, lowest to highest precedence:
  1. `~/.config/opencode/opencode.json`
  2. `/home/user/projects/acme/opencode.json`
  3. `/home/user/projects/acme/packages/web/opencode.json`
  4. `/etc/opencode/opencode.json`
  "The package config overrides matching settings from the repository config, which
  overrides the global config. The system config overrides all of them. Settings that do
  not conflict are preserved. Policies from global and project files evaluate in the
  reverse order, and system policies outrank all of them."
  — https://opencode.ai/v2/docs/config/ (Locations)
- So nested packages **do not create separate projects in config terms**: package configs
  are *merge layers* of one config chain rooted at the current directory, and conflicting
  settings resolve nearest-wins (closest package > repo root > global; system on top).
  — https://opencode.ai/v2/docs/config/ (Locations)
- Managed settings (`ai.opencode.managed` on macOS) have the highest precedence over all
  of the above. — https://opencode.ai/v2/docs/config/ (Locations)
- The `skills` array is additive across configs: "Every discovered config file contributes
  its entries. `skills` arrays are combined rather than replaced."
  — https://opencode.ai/v2/docs/skills/ (Sources)
- **Unverified:** the config guide's discovery runs "to the filesystem root" and does not
  stop at any repository boundary — unlike `.opencode` *directory* discovery for agents/
  skills/instructions, which stops at "the project root" (see §4). What "the project
  root" is (VCS root? a directory that owns a config? the `Project.directory` from the
  API?) is **not defined on any page we read**. Same for the boundary between "nested
  package" and "new project": no doc states that a package with its own `opencode.json`
  becomes its own `Location.PublicInfo.project`. The API shape (one location → exactly one
  `project` object) is all we have.

---

## 3. Session scoping

- `Session.Info` (OpenAPI, `#/components/schemas/Session.Info`) **requires** `id`,
  `projectID`, `cost`, `tokens`, `time`, and `location`; optional fields include
  `parentID`, `subpath` (RelativePath), `title`, `agent`, `model`, `permissions`,
  `metadata`. `location` is a `Location.PublicRef` — a single `directory`.
  — https://opencode.ai/v2/openapi.json
- So every session carries exactly **one directory** (`location.directory`) and exactly
  **one project ID** (`projectID`). — https://opencode.ai/v2/openapi.json
  (`#/components/schemas/Session.Info`)
- Session creation accepts an optional `location` ({ `directory` }) and a `parentID`:
  "A parentID creates a linked child session at its parent's location."
  — https://opencode.ai/v2/openapi.json (operation `session.create`)
- Listing sessions is filterable by directory and by project:
  `GET /api/session` accepts `directory` (AbsolutePath), `project` (Project.ID), and
  `subpath` (RelativePath) filters. — https://opencode.ai/v2/openapi.json
  (operation `session.list`)
- The plugin API example uses exactly the directory filter:
  `ctx.session.list({ directory: ctx.location.directory, limit: 20 })`.
  — https://opencode.ai/v2/docs/build/plugins/ (API → Sessions)
- A session is single-directory and single-project by construction, and is moved rather
  than spanning: `POST /api/session/{sessionID}/move` — "Move a session to another project
  directory at the requested delivery boundary" — requires the new `directory`.
  — https://opencode.ai/v2/openapi.json (operation `session.move`)
- CLI binding: "Run the CLI in a project… Pass a directory to work in a different
  project: `opencode ~/code/my-project`". — https://opencode.ai/v2/docs/cli/ (Intro)
- Shell commands "run in the session's working directory". — https://opencode.ai/v2/docs/cli/tui/
- The TUI can start new sessions at the launch directory or inherit the active session's
  location (`session.new_location: "launch" | "inherit"`), and tabs can be scoped per
  working directory (`tabs.scope: "cwd" | "global"`). — https://opencode.ai/v2/docs/cli/config/
  (Sessions, Tabs)
- The SDK creates sessions by directory: `opencode.sessions.create({ location:
  { directory: "/workspace" } })`. — https://opencode.ai/v2/docs/build/sdk/ (Create a host)
- **Can one session span multiple packages?** Not as multiple roots: a session has one
  `location.directory` + `projectID`. The only documented intra-project path field is
  `Session.Info.subpath` (a RelativePath) — **unverified** what it denotes (likely a
  subdirectory focus within the location; no doc explains it). Nothing in the docs
  describes sessions bound to a *list* of directories or to multiple projects.
  — https://opencode.ai/v2/openapi.json (`#/components/schemas/Session.Info`)

---

## 4. Location scoping of skills, agents, commands, references, MCP, plugins

The common pattern: each domain is a **registry resolved per location (directory)**; the
server API endpoints for these domains all take an optional `location` query param
(`{ directory }`) and return the resolved `Location.PublicRef` alongside the data
(seen on `agent.list`, `agent.get`, `plugin.list`, `mcp.list`, `vcs.get`, and the other
location-scoped routes). — https://opencode.ai/v2/openapi.json (operations `agent.list`,
`plugin.list`, `mcp.list`, `vcs.get`)

### Skills

- Discovery scopes: Global `~/.config/opencode/skills`; project `.opencode/skills`;
  compatibility dirs `.claude/skills`, `.agents/skills`. "For project sources, OpenCode
  searches from the current directory up to the project root and includes matching
  directories at every level." — https://opencode.ai/v2/docs/skills/ (Discovery)
- Precedence order for ID collisions (lowest → highest): built-ins; `.claude/skills`;
  `.agents/skills`; `~/.config/opencode/skills`; "Project `.opencode/skills`, from the
  project root toward the current directory" (so deeper project skills override shallower
  ones); explicit `skills` config entries "in config priority and array order".
  — https://opencode.ai/v2/docs/skills/ (Precedence)
- Relative paths in explicit `skills` config entries "resolve from the active OpenCode
  working directory, not the config file". — https://opencode.ai/v2/docs/skills/ (Sources)

### Agents

- "OpenCode discovers project `.opencode` directories from the current directory up to the
  project root. A nested path becomes part of the agent ID."
  — https://opencode.ai/v2/docs/agents/ (Locations)
- JSONC agents can be defined in *any* config file; "Agent definitions merge in
  configuration order. Later scalar values replace earlier values…"
  — https://opencode.ai/v2/docs/agents/ (Merging)
- Plugin view: `ctx.agent.list()` reads the agents of the plugin instance's location.
  — https://opencode.ai/v2/docs/build/plugins/ (API → Agent)

### Commands

- Global `~/.config/opencode/commands/`, project `.opencode/commands/`. "Project sources
  take precedence over global sources, and nearer project sources take precedence over
  ancestor sources." — https://opencode.ai/v2/docs/commands/ (Loading)
- Command shell blocks "run with the configured shell in the active project location".
  — https://opencode.ai/v2/docs/commands/ (Shell)

### References

- References are named config entries (local `path` or git `repository`); "Relative paths
  resolve from the directory containing the config file."
  — https://opencode.ai/v2/docs/references/ (Local)
- The API route is "Location-scoped project references": `GET /api/reference` with the
  location param. — https://opencode.ai/v2/openapi.json (tags on the `reference` group)
- References do **not** expand the location: "References do not grant extra tool
  permissions. Access outside the active Location still follows normal tool rules and the
  `external_directory` permission." — https://opencode.ai/v2/docs/references/ (Permissions)

### MCP

- MCP servers are defined in any config file; "Global `mcp.timeout` values apply to
  servers defined in configuration files; each server's `timeout` overrides them."
  — https://opencode.ai/v2/docs/config/ (MCP)
- The MCP registry is per-location: `ctx.mcp.list()` lists "MCP servers and their current
  connection state" for the plugin's location, and `GET /api/mcp` takes the `location`
  param. — https://opencode.ai/v2/docs/build/plugins/ (API → MCP);
  https://opencode.ai/v2/openapi.json (operation `mcp.list`)

### Plugins

- "Plugins under `.opencode/plugins/` are loaded automatically"; other plugins come from
  `plugins` entries in the config chain. — https://opencode.ai/v2/docs/build/plugins/
  (Overview)
- `ctx.plugin.list()` returns "the plugins currently active for a location".
  — https://opencode.ai/v2/docs/build/plugins/ (API → Plugins)
- Plugin registrations (transforms, hooks) "remain scoped to the plugin runtime; project
  operations use the canonical checkout's registry." — https://opencode.ai/v2/docs/build/plugins/
  (API → Worktrees)

### Instructions (AGENTS.md) — a different scoping rule

- "OpenCode loads the global file followed by every `AGENTS.md` from the current workspace
  directory toward the home directory. For workspaces outside the home directory, it
  stops at the project root." Files are **combined** — "OpenCode combines the files and
  does not resolve conflicts between them." — https://opencode.ai/v2/docs/instructions/ (Scope)
- Nested `AGENTS.md` below the workspace load lazily as the agent explores ("Reading a
  file or listing a directory loads any `AGENTS.md` files between that target and the
  workspace"). — https://opencode.ai/v2/docs/instructions/ (Discovery)
- Configured `instructions` entries: relative paths/globs are "Searched in each directory
  from the workspace up to the project root". — https://opencode.ai/v2/docs/instructions/
  (Configuration)

### Cross-cutting observation

- `references` are **config-file-anchored** (relative paths resolve from the config file's
  own directory — which differs from skills, whose explicit paths resolve from the
  working directory). A reference defined at the repo root config therefore has a
  different meaning than one defined in a package config. — https://opencode.ai/v2/docs/references/
  (Local) vs https://opencode.ai/v2/docs/skills/ (Sources)

---

## 5. Workspaces / multi-root / monorepo search results

- "multi-root" and "monorepo": **zero occurrences** in the V2 docs pages listed in
  https://opencode.ai/v2/llms.txt and **zero occurrences** in
  https://opencode.ai/v2/openapi.json. No V2 doc describes multi-root workspaces, workspace
  folders, or monorepo-specific behavior beyond the config-merge example above.
- "workspace" occurrences in the OpenAPI schema are limited to: (a) the Console
  usage-limits route ("the OpenCode Console workspace the location is signed in to"),
  (b) `Project.Commands.start` ("new workspace (worktree)").
  — https://opencode.ai/v2/openapi.json
- The config guide's monorepo example demonstrates layered config *merging* within one
  tree — it never names the packages "projects" and never shows a per-package project
  ID. — https://opencode.ai/v2/docs/config/ (Locations)
- `Location.PublicInfo` carries exactly **one** `project` object — structurally, a
  location cannot belong to several projects. — https://opencode.ai/v2/openapi.json
  (`#/components/schemas/Location.PublicInfo`)
- VCS plugin callbacks "receive the current location, working-copy root, canonical project
  root, and optional repository store" — the only doc that separates "working-copy root"
  from "canonical project root" (consistent with: project = repository identity shared
  across clones; canonical = saved primary checkout). — https://opencode.ai/v2/docs/build/plugins/
  (API → VCS)
- The plugin guide's Worktrees section: "Remote workspace provisioning is not part of
  this interface." — https://opencode.ai/v2/docs/build/plugins/ (API → Worktrees)
- **Unverified:** whether a monorepo is "one project or many" is **not answered anywhere**
  in the primary sources. Evidence leans one-project-per-repository (one `project` per
  location, project ID shared across clones), but no doc states the project boundary
  rule, and none defines "project root".

---

## 6. Warming and startup — which projects get loaded

- Warming is **session**-level cache keeping, not project loading: "Session warming sends
  periodic model requests to preserve provider-side prompt caches… It is disabled by
  default." A warming request "uses the session's current model, agent, instructions, and
  conversation context" and "does not admit input, add messages to history, or mutate
  durable session state." — https://opencode.ai/v2/docs/warming/ (intro, Requests)
- Warming therefore does **not** determine which projects/locations get loaded, and does
  not trigger tool execution. — https://opencode.ai/v2/docs/warming/ (Requests)
- The actual location-loading lifetime control is config `experimental.location_idle_timeout`:
  "how long a project location can go without session activity before OpenCode unloads its
  services… defaults to `"60 minutes"`. Running sessions and background jobs keep a
  location loaded. Set it to `false` to never unload idle locations. Project config can
  override the global value."
  — https://opencode.ai/v2/docs/config/ (Experimental → Location idle timeout)
- Server-side view of loaded locations: `GET /api/debug/location` "List loaded locations";
  `DELETE /api/debug/location` "Evict a loaded location"; `POST /api/location/reload`
  "Shut down and rebuild every loaded location… running sessions continue with fresh
  services at the next step boundary." — https://opencode.ai/v2/openapi.json
  (operations `debug.location.list`/`debug.location.evict`/`location.reload`)
- A location is thus an **on-demand service bundle** in the shared server: the server
  "owns sessions, configuration, integrations, permissions, and tool execution", and
  troubleshooting frames issues as "in a client, the shared server, or a specific
  project." — https://opencode.ai/v2/docs/cli/ (Background service);
  https://opencode.ai/v2/docs/troubleshooting/ (intro)
- **Implication for our plugin:** our plugin's `setup(ctx)` runs per *plugin instance
  location* (see §1) — i.e., when a location is loaded, and its services unload on idle
  unless sessions/background jobs keep it alive. A per-project engine is therefore
  naturally bound to `ctx.location` and will be torn down by the same idle timeout.
  — https://opencode.ai/v2/docs/build/plugins/ (Lifecycle → Context);
  https://opencode.ai/v2/docs/config/ (location_idle_timeout)

---

## Boundary facts

### What OpenCode V2 guarantees (documented)

1. **A Location is a directory + one project.** `Location.PublicInfo` = `directory`,
   `project { id, directory, canonical }` (all required). `Location.PublicRef` (what
   sessions carry) is just `directory`. — https://opencode.ai/v2/openapi.json
2. **A session is bound to exactly one directory and one project ID**, both queryable
   (`Session.Info.location.directory`, `Session.Info.projectID`) and filterable
   (`session.list` accepts `directory`, `project`, `subpath`). Sessions move by setting a
   new directory (`session.move`); they never hold multiple roots. — https://opencode.ai/v2/openapi.json
3. **Config is a single merge chain from the current directory to the filesystem root**
   (direct `opencode.json(c)` farthest→closest, then `.opencode/` configs same order,
   `.opencode` always winning over direct; system config on top; managed settings above
   all). Nested package configs are *overrides within one chain*, not separate projects.
   — https://opencode.ai/v2/docs/config/
4. **Per-domain registries are location-resolved**: skills/agents/commands discovered
   from the current directory "up to the project root" with nearest-wins precedence
   (skills/commands) or merge semantics (agents, instructions); MCP/plugins/references
   resolve per location from the config chain; the HTTP API routes these domains by a
   `location={directory}` param. — https://opencode.ai/v2/docs/skills/,
   https://opencode.ai/v2/docs/agents/, https://opencode.ai/v2/docs/commands/,
   https://opencode.ai/v2/docs/instructions/, https://opencode.ai/v2/openapi.json
5. **Locations are service bundles with an idle lifetime** — loaded per directory, unloaded
   after `location_idle_timeout` (default 60 min) without session activity; running
   sessions and background jobs pin them. — https://opencode.ai/v2/docs/config/
6. **"Project" is a durable, cross-checkout identity**: worktrees key on `projectID`,
   config/plugin loading for project operations uses the saved `canonical` checkout, and
   multiple clones share one project ID. — https://opencode.ai/v2/docs/config/,
   https://opencode.ai/v2/docs/build/plugins/

### What OpenCode V2 does NOT guarantee / does not document

- **No definition of "project root"** — the term is used by skills/agents/instructions
  discovery, but no page defines it (VCS root? first config owner? something else?).
- **No monorepo semantics**: nothing says whether packages are sub-projects or one
  project; no multi-root workspace support exists; "multi-root" and "monorepo" appear
  nowhere.
- **No documented meaning for `ctx.location.workspaceID`** (where set, what it identifies).
- **No documented derivation rule for `Project.ID`**, nor an explicit statement that the
  project boundary equals the VCS/repository boundary (inferred from worktree behavior
  and "working-copy root vs canonical project root" in VCS callbacks, not stated).
- **No documented semantics for `Session.Info.subpath`** and no statement on whether a
  session can "span packages" (only that it has one directory + one project + move).
- **No requirement that a project be a code repository**: nothing forbids a non-code
  directory from being a location (VCS is optional — plugins can `init` a repo in an
  empty location — and `Project.Vcs` is optional). But nothing documents behavior for
  non-VCS projects either.

### Implications for scoping our engine "per project"

- **The honest per-location identity is `ctx.location.directory`** (and
  `ctx.location.project.id` for anything that must survive across clones/worktrees).
  A "project" in the user's sense (one repo) maps cleanly only when the user's repo is
  what OpenCode considers one location; the docs give us the *fields* but not the
  boundary rule, so we should **derive** our project key ourselves and treat OpenCode's
  as input, not authority.
- **Monorepos:** package configs are merge layers of one location; a plugin loaded at
  `packages/web` sees one `ctx.location` whose config chain already blends repo-root and
  package configs. If our engine wants per-package state (tracker/inbox/glossary per
  package), OpenCode offers **no per-package project object** to hang it on — we must
  key on directory (or repo-relative subpath) ourselves, and handle the ambiguity that
  OpenCode does not define where "package" ends and "project" begins.
- **Sessions** are 1 directory + 1 projectID, so a session started in `packages/web` can
  filter/group cleanly by `directory`; sessions started at the repo root would not
  automatically associate with package-scoped engine state — `subpath` may be the bridge,
  but its semantics are undocumented.
- **Non-code repos:** nothing stops a non-VCS directory from being a location, so the
  engine must not assume VCS metadata exists; conversely nothing guarantees first-class
  support for non-code directories, so treat anything VCS-dependent as optional and
  degrade gracefully.
- **Lifecycle:** per-location plugin instances load/unload with the location (idle
  timeout, reload-all), so an engine keyed to `ctx.location` inherits that lifecycle for
  free; an engine holding state outside that lifecycle (e.g., one global engine across
  locations) is *against* the grain of the platform.
