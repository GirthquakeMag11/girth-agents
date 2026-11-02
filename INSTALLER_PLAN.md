# Graph Engine in-process installer and uninstaller

Status: proposed. No product source has been changed by this plan.

## 1. Fixed decisions

| Decision | Value |
|---|---|
| Distribution | Plain archive, separate `install.sh`, and SHA-256 checksum file |
| Network | None. No npm, registry, package manager, or download step |
| Install target | OpenCode's global configuration, never a project repository |
| Product shape | One global OpenCode plugin package: `graph-engine` |
| Engine runtime | In-process in the OpenCode background server |
| Engine instances | One process-global engine and queue per OpenCode server |
| Node | Not required and not bundled |
| Dashboard | TUI part of the same plugin, reading through RPC |
| Graph | `$OPENCODE_CONFIG/graph-engine/graph/`, seeded once, user-owned |
| Project writes | None. No generated project `.opencode/`, no engine files in projects |
| Project version | `0.5.0` |
| Graph schema | `5` |
| Platform | POSIX Linux/macOS first |
| OpenCode | V2 plugin API |

## 2. Product boundary

| Context | Contents | Shipped |
|---|---|---|
| Product source | Engine library, plugin package, dashboard, graph template, OpenCode skills, installer, metadata | Yes |
| Development | Tests, proofs, fixtures, repo `.opencode/` | No |
| Runtime | The engine lives inside the OpenCode server process; no separate runtime directory | No |
| User-owned | Installed `graph/`, user edits, and work produced by graph agents | No |

Rules:

- The engine is not a child process.
- The engine is not installed per project.
- The installer never reads the development repo or the developer's OpenCode state.
- The installer seeds `graph/` once and never overwrites it.
- The product creates no `GRAPH.md`, no `work/`, and no output-artifact state.
- The repo's `.opencode/` remains development state only.

## 3. Source layout

```text
engine/                       # in-process engine library
  *.mjs
  test/

opencode/
  plugins/
    graph-engine/
      package.json            # exports ".", "./tui", "./rpc"
      server.ts               # engine host, tools, handoff surface
      tui.tsx                 # dashboard
      rpc.ts                  # dashboard/server contract
  skills/
    graph-authoring/
      SKILL.md
    dispatching/
      SKILL.md

graph/                        # built-in graph template
  config.json
  agents/
    builder.md
    reviewer.md
  skills/                     # present when the template references graph skills

dashboard/                    # dashboard UI source used by tui.tsx
  src/
  test/
  proof/
  fixtures/

installer/
  install.sh                  # separate artifact next to the archive
  uninstall.sh                # travels inside the archive
  build-archive.sh            # development-only packaging script
  test/

product.conf                  # product display name, slug, version, plugin id
VERSION                       # product version; must match engine/version.mjs
```

The build script stages `engine/` and `dashboard/src/` inside the installed
plugin package so the plugin is self-contained.

Deliberately absent:

- root `package.json`;
- `bin/`;
- `run.sh`;
- service descriptor;
- token;
- loopback control server;
- `defaults/`;
- `graph-config/`;
- `dogfood/`;
- `GRAPH.md`;
- `work/`.

## 4. Installed layout

```text
$OPENCODE_CONFIG/                 # $XDG_CONFIG_HOME/opencode or ~/.config/opencode
├── plugins/
│   └── graph-engine/
│       ├── package.json
│       ├── server.ts
│       ├── tui.tsx
│       ├── rpc.ts
│       ├── engine/
│       └── dashboard/
├── graph-engine/
│   ├── graph/
│   │   ├── config.json
│   │   ├── agents/
│   │   └── skills/
│   ├── manifest
│   └── uninstall.sh
└── skills/
    ├── graph-authoring/
    │   └── SKILL.md
    └── dispatching/
        └── SKILL.md
```

No `run.sh`. No descriptor. No token. No `bin/`.

The plugin resolves the graph config from its installed location:

```text
$OPENCODE_CONFIG/plugins/graph-engine/../../graph-engine/graph/config.json
```

No `opencode.json` edit is required. OpenCode discovers global plugins under
`$OPENCODE_CONFIG/plugins/` and global skills under `$OPENCODE_CONFIG/skills/`.

## 5. Engine/plugin interface

### One engine

The plugin uses a process-global singleton:

```js
globalThis[Symbol.for("graph-engine.runtime")]
```

The first plugin setup creates it. Later setups reuse it. The engine owns one
graph config, one queue, one history, and one active dispatch. Plugin cleanup
disposes that plugin instance's tools and RPC registration; it never stops the
engine. The engine ends when the OpenCode server process ends.

### Dispatch location

A dispatch record carries:

- the dispatching session ID;
- a session client bound to the dispatching location;
- the dispatching location directory.

The graph sessions for that dispatch are created in that directory through that
location's client. One engine serves every project. The queue remains single.

### Engine driver

The HTTP service driver is replaced by an adapter over the OpenCode plugin
server client.

Required mapping:

| Engine need | Plugin server client |
|---|---|
| Create graph session | `ctx.session.create` |
| Read session outcome and usage | `ctx.session.get` |
| Read session messages | `ctx.session.context` |
| Prompt and wait | `ctx.session.prompt` and `ctx.session.wait` |
| Interrupt | `ctx.session.interrupt` |
| Remove session | `ctx.session.remove` |
| Plugin preflight | `ctx.plugin.list` |

Before removing the HTTP driver, verify that the V2 server client exposes the
session outcome, token, and cost fields the executor reads. If a field is not
available, adapt the executor to the V2 session shape rather than reintroducing
HTTP.

### Tools

The plugin registers the same surface:

- one handoff tool per declared graph label, input `{ message }`;
- `dispatch`;
- `dispatch_status`;
- `dispatch_cancel`;
- `reload`;
- `graph_info`;
- `graph_map`.

There is no generic handoff tool, no label argument, no separate reply/resume
tool, and no model-facing `dispatch_wait`.

Tool calls go directly into the engine. No fetch, URL, or token.

The handoff context hook asks the engine for the active session's allowed labels
and removes undeclared or colliding tools.

### Dispatch behavior

- Foreground dispatch enqueues and awaits the engine queue, then returns the
  focused display.
- Background dispatch returns an ID immediately and notifies the dispatching
  session through `ctx.session.synthetic` when the queue reaches a terminal
  state.
- `dispatch_cancel` uses the driver stored on the dispatch record.
- `resume` uses the retained origin already tracked by the engine.
- A `$dispatcher` handoff completes the dispatch and cannot use `resume`.

### Reload

`reload` reads the global graph config and swaps it only when valid and no
dispatch is active.

The existing label-set rule remains: a reload that changes the handoff label
set is rejected until the OpenCode server reloads the plugin. Route, prompt, and
description changes apply through normal reload.

### Invalid config

If the global graph config is invalid at plugin setup, setup fails with the
named faults. The tools do not load until the config is fixed and OpenCode
reloads. A bad graph never crashes the OpenCode server.

## 6. Engine refactor

Remove the process and transport layers:

- `engine/engine.mjs` boot loop, stdio loop, heartbeat, and control handlers;
- `engine/stdio.mjs`;
- `engine/control.mjs`;
- `engine/service.mjs`;
- HTTP discovery and the loopback control server.

Add:

- `engine/runtime.mjs`: config loading, queue ownership, dispatch, handoff,
  reload, graph info/map, and runtime snapshot;
- `engine/plugin-driver.mjs`: the OpenCode plugin client adapter.

Modify:

- `engine/queue.mjs`: records carry driver, directory, and dispatching session;
  `run` and `cancel` use the record's driver;
- `engine/executor.mjs`: use the record's directory for graph sessions;
- `engine/plugin.mjs`: remove generated plugin output, `installPlugin`,
  `installSkills`, and HTTP preflight; retain only logic the static plugin
  imports;
- `engine/driver.mjs`: remove HTTP service discovery; keep pure helpers such as
  model references and permission construction.

Unchanged behavior:

- one dispatch at a time;
- queueing;
- retained origins;
- handoff ordering checks;
- max visits;
- workflow boundaries;
- graph faults;
- history;
- work-product neutrality.

## 7. Plugin package

`opencode/plugins/graph-engine/package.json` exports:

```json
{
  "name": "graph-engine",
  "type": "module",
  "exports": {
    ".": "./server.ts",
    "./tui": "./tui.tsx",
    "./rpc": "./rpc.ts"
  },
  "dependencies": {
    "@opencode/plugin": "latest"
  }
}
```

No npm install step is performed by the installer. OpenCode provides the plugin
SDK to local plugin packages.

### Server

`server.ts`:

- creates or reuses the process-global engine;
- loads the global graph config;
- registers per-label handoff tools and control tools;
- registers the context hook;
- registers the dashboard RPC;
- leaves the engine running on plugin unload.

### RPC

`rpc.ts` defines the server/dashboard contract. V1 methods:

- `snapshot` — full graph document, graph info, graph map, and runtime state;
- `dispatchStatus` — live status for one dispatch ID.

The dashboard polls `snapshot` at its existing one-second interval. RPC events
are not required for the first installer.

### TUI

`tui.tsx` is the dashboard. It calls the RPC through `context.client.rpc(...)`.
It no longer reads `.opencode/plugins/engine-handoff/index.ts`, fetches a
loopback URL, or reads the graph config from disk.

## 8. Dashboard changes

Remove:

- `dashboard/src/data.mjs` endpoint parsing;
- `engineEndpoint`, `post`, and `loadDashboard` HTTP behavior;
- the project-directory argument used to locate the engine.

Keep:

- layout, model, motion, responsive, and view tests;
- the full graph document supplied by RPC;
- the one-second refresh;
- full-screen panel behavior.

Add:

- RPC client wiring in `tui.tsx`;
- a dashboard test using a fake RPC client;
- a proof that the dashboard never reads a project-local plugin file.

## 9. Distribution artifacts

```text
graph-engine-0.5.0.tar.gz
graph-engine-0.5.0.tar.gz.sha256
install.sh
```

The archive contains one top-level directory:

```text
graph-engine-0.5.0/
├── plugin/
│   ├── package.json
│   ├── server.ts
│   ├── tui.tsx
│   ├── rpc.ts
│   ├── engine/
│   └── dashboard/
├── graph/
│   ├── config.json
│   ├── agents/
│   └── skills/
├── skills/
│   ├── graph-authoring/SKILL.md
│   └── dispatching/SKILL.md
├── product.conf
├── VERSION
└── uninstall.sh
```

Excluded from the archive:

- engine tests;
- live proofs;
- dashboard tests, proofs, and fixtures;
- `.opencode/`;
- `dist/`;
- `node_modules/`;
- any generated proof artifact.

`install.sh` is not inside the archive. The archive is the product; the script
extracts and installs it.

## 10. `product.conf`

Shell-readable `KEY="value"` lines:

```conf
PRODUCT_NAME="Graph Engine"
PRODUCT_SLUG="graph-engine"
PROJECT_VERSION="0.5.0"
PLUGIN_ID="graph-engine"
PLUGIN_DIR="plugins/graph-engine"
GRAPH_DIR="graph-engine/graph"
```

The installer parses it without `source` or `eval`. The build script verifies
`PROJECT_VERSION` matches `engine/version.mjs`.

## 11. `install.sh`

Interactive by default. Flags:

```text
--archive PATH
--checksum PATH
--config-dir PATH
--yes
--dry-run
--help
```

Flow:

1. Resolve the script directory.
2. Find `graph-engine-*.tar.gz` next to the script. Prompt if absent.
3. Find `<archive>.sha256` next to the archive. Refuse if absent.
4. Detect the OpenCode config directory:
   - `--config-dir`, else
   - `${XDG_CONFIG_HOME:-$HOME/.config}/opencode`.
   Prompt if the directory cannot be determined.
5. Show archive, checksum, config directory, install root, and version. Confirm
   unless `--yes`.
6. Check `tar` and `sha256sum` or `shasum -a 256`. Do not check for Node or
   OpenCode.
7. Verify the archive checksum.
8. Extract to `mktemp -d`; trap cleanup.
9. Validate the archive top-level directory and `VERSION`.
10. Preflight destinations:
    - abort if `plugins/graph-engine` exists;
    - abort if `skills/graph-authoring` or `skills/dispatching` exists;
    - abort if `graph-engine/manifest` exists;
    - preserve an existing `graph-engine/graph/`.
11. Stage installer-owned files.
12. Install the plugin package to `plugins/graph-engine/`.
13. Install the OpenCode skills.
14. Seed `graph/` only when absent.
15. Install `uninstall.sh`.
16. Write the manifest.
17. Publish the staged tree into the config directory.
18. Print:
    - installed version and root;
    - graph path;
    - that OpenCode loads the plugin automatically;
    - to run `/reload` if OpenCode was already running;
    - that no project files are created.
19. Remove temporary directories.

No project path is requested. No writes occur outside the config directory.

## 12. Manifest

Text, tab-separated, relative to `$OPENCODE_CONFIG`:

```text
# graph-engine manifest v1
version	0.5.0
file	<sha256>	plugins/graph-engine/package.json
file	<sha256>	plugins/graph-engine/server.ts
file	<sha256>	plugins/graph-engine/tui.tsx
file	<sha256>	plugins/graph-engine/rpc.ts
file	<sha256>	plugins/graph-engine/engine/runtime.mjs
file	<sha256>	plugins/graph-engine/dashboard/src/view.tsx
file	<sha256>	skills/graph-authoring/SKILL.md
file	<sha256>	skills/dispatching/SKILL.md
```

The manifest is generated dynamically from the staged tree: it lists every
staged plugin (`plugins/graph-engine/**`) and skill file, not a hand-curated
subset.

Rules:

- Paths are relative and contain no `..`.
- The manifest itself is not listed.
- `graph/` is not listed; it is user-owned.
- `uninstall.sh` is not listed; it is the uninstaller.
- The uninstaller validates every path before using it.
- Checksums use `sha256sum` or `shasum -a 256`.

## 13. `uninstall.sh`

Installed at `$CONFIG/graph-engine/uninstall.sh`.

Flags:

```text
--purge
--yes
--dry-run
--help
```

Flow:

1. Resolve `$CONFIG` from the script location.
2. Require `graph-engine/manifest`; refuse to guess.
3. Validate the manifest.
4. Show managed files and whether `graph/` is preserved.
5. Confirm unless `--yes`.
6. Remove each manifest file when its checksum matches.
7. Leave modified files and print a warning.
8. Remove empty installer-owned directories, deepest first.
9. Preserve `graph/`, `manifest`, and `uninstall.sh` by default.
10. With `--purge`, confirm again and remove `graph/`, the manifest, and the
    uninstaller.
11. Never touch project directories or unrelated global plugins/skills.
12. Print the OpenCode reload instruction.

Idempotent: a second run reports nothing to remove and exits 0.

## 14. Build script

`installer/build-archive.sh`:

- reads `product.conf`;
- verifies `PROJECT_VERSION` against `engine/version.mjs`;
- creates `dist/graph-engine-<version>/`;
- copies plugin source plus staged `engine/` and `dashboard/src/`;
- copies graph template, OpenCode skills, `product.conf`, `VERSION`, and
  `uninstall.sh`;
- excludes tests, proofs, fixtures, `.opencode`, `dist`, and `node_modules`;
- creates the tar.gz;
- writes the SHA-256 file;
- copies `install.sh` to `dist/`;
- lists the archive contents and fails on a forbidden path;
- prints the three artifact paths.

## 15. Invariant checks

- **One handoff mechanism:** one tool per declared label, input `{ message }`,
  no generic tool, no separate reply/resume/answer tool.
- **No message-kind taxonomy:** no state, tool, or endpoint names a message
  kind.
- **Work product is not engine state:** no output schema, file check, hash, or
  dashboard field.
- **Configuration names:** `agents`, `agent`, direct skill references.
- **Skills are first-class:** graph skill references and brief injection are
  unchanged.
- **Reserved names:** control tool names stay reserved; collisions are checked
  against the live catalog.
- **No project integration assets:** the installer writes only global
  configuration paths.

## 16. Tests

### Engine

- Update config and map tests to load `graph/config.json`.
- Replace process boot tests with in-process runtime tests.
- Queue tests cover per-record driver and directory.
- Executor tests cover sessions created in the dispatching directory.
- Handoff tests remain direct.
- Remove HTTP control and service discovery tests.

### Plugin

- Load the static `server.ts` through a harness that replaces the
  `@opencode/plugin` import.
- Assert per-label tools, `{ message }` input, control tools, no generic handoff,
  no `dispatch_wait`.
- Assert direct engine calls, not fetch.
- Assert the context hook removes undeclared labels.
- Assert one process-global engine across repeated setup calls.
- Assert plugin cleanup does not stop the engine.

### Dashboard

- Replace HTTP endpoint tests with a fake RPC client.
- Assert the dashboard never reads a project-local plugin file.
- Keep layout, model, motion, responsive, and view tests.

### Installer

- Build the archive into a temporary `dist/`.
- Clean install into a temporary config directory with `--yes`.
- Assert the installed tree, manifest, checksums, plugin, skills, and graph.
- Assert an existing graph is preserved.
- Assert plugin/skill/manifest conflicts abort without writes.
- Assert checksum failure aborts without writes.
- Assert `--dry-run` writes nothing.
- Assert uninstall removes only matching files.
- Assert a modified file is preserved with a warning.
- Assert normal uninstall preserves `graph/`.
- Assert `--purge` removes `graph/`.
- Assert no Node check is performed and no project directory is written.

### Live proof

Use an isolated OpenCode config and project:

- install the archive;
- start the OpenCode server with the installed global plugin;
- dispatch a workflow and reach a terminal;
- dispatch from a second location and confirm the same queue is used;
- confirm graph sessions run in the dispatching directory;
- read the dashboard snapshot through RPC;
- confirm no project `.opencode/` or engine file is created;
- uninstall and confirm the graph remains.

## 17. Implementation order

1. In-process engine runtime and plugin driver.
2. Queue/executor per-record driver and directory.
3. Static plugin package with direct tool calls and per-label handoff tools.
4. RPC contract and dashboard TUI wiring.
5. Source moves: graph template, OpenCode skills, path updates.
6. Installer, uninstaller, manifest, and build script.
7. Installer tests.
8. In-process and isolated live proofs.
9. Roadmap update: installer depends on the in-process engine lifecycle.

Each step lands with its tests green.

## 18. Acceptance criteria

- Distribution is archive + checksum + `install.sh`.
- No npm, registry, network, Node prerequisite, or bundled runtime.
- One global plugin package, one process-global engine, one queue.
- Engine lifetime is the OpenCode server process.
- Dispatch from any location uses that location's directory and session client.
- Handoff tools are one per label, input `{ message }`, no generic tool.
- Dashboard reads through RPC, not HTTP or a project-local plugin file.
- Installer writes only global OpenCode configuration.
- No project integration assets are generated.
- Existing graph is preserved; uninstall preserves it by default.
- Uninstall removes only checksum-matching managed files.
- No `GRAPH.md`, no `work/`, no output-artifact contract.
- Engine, plugin, dashboard, installer, and live tests pass.

## 19. Non-goals

- No npm package or registry.
- No Node requirement.
- No bundled Node or other runtime.
- No child-process engine.
- No service descriptor, token, or loopback control server.
- No per-project engine or per-project install.
- No project-generated integration assets.
- No in-place upgrade in the first release.
- No Windows installer in the first release.
- No dashboard editing or dispatch controls.
- No parallel dispatches.
- No `GRAPH.md`.
- No `work/` or output-artifact state.
