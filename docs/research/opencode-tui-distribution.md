# OpenCode V2: TUI extension points and git-based plugin distribution

**Question:** Our plugin ships a "TUI surface" — an inbox screen (a whole pane, opened by a slash command and from the Escape/command menu) and a sidebar readout (`Inbox: {n}` plus a breakdown of ongoing work) — distributed by pointing OpenCode at the GitHub repo (git-spec plugin). Verify the exact mechanics against OpenCode V2 primary sources and flag any naming collisions.

**Date:** October 25, 2026

**Method:** All claims cite OpenCode V2 primary documentation. Sources were located via `https://opencode.ai/v2/llms.txt`. V1 docs (`https://opencode.ai/docs/`) were not consulted. The OpenAPI schema was read from `https://opencode.ai/v2/openapi.json` (linked from the API reference).

---

## 1. Full-screen routes

- Plugin routes are registered with `context.ui.router.register({ name, render })`; the example `render: ({ data }) => <text>{String(data?.title ?? "Acme")}</text>` shows `render` receives an object with the `data` passed at navigation. `register` returns an unregister function. — https://opencode.ai/v2/docs/build/plugins/cli/
- Navigation is `context.ui.router.navigate({ type: "plugin", name: "dashboard", data: { title: "Status" } })`, `navigate({ type: "session", sessionID })`, or `navigate({ type: "home" })`. Current route is read with `context.ui.router.current()`. — https://opencode.ai/v2/docs/build/plugins/cli/
- The docs describe this section as "Register a JSX route, inspect the current route, and navigate to home, a session, or the plugin page." A plugin route is therefore a full destination on the same level as home and session. — https://opencode.ai/v2/docs/build/plugins/cli/
- Palette / slash / keyboard entries come from a **separate** API: a reactive keymap layer, not from the router. The command shape is `{ id, title, group, bind, palette: true, slash: { name, aliases, arguments }, enabled, suggested, run }`, registered inside `context.keymap.layer(() => ({ mode, priority, commands, bindings }))`. `run` is an arbitrary callback receiving the command input. — https://opencode.ai/v2/docs/build/plugins/cli/
- **Reachability from the palette/slash menu is therefore via a keymap command whose `run` calls `context.ui.router.navigate(...)`, not an automatic property of registering a route.** The docs do not show a palette/slash entry that navigates to a plugin route in one example; both APIs are documented side by side and nothing in the docs restricts what `run` does. This pairing is a safe but **undocumented inference** — flagged in Feasibility and risks. — https://opencode.ai/v2/docs/build/plugins/cli/
- The keymap layer supports `slash` (`{ name, aliases, arguments }`) for the `/` command list and `palette: true` for palette visibility; the layer is created reactively and removed when the plugin is disabled/reloaded or the creating component is disposed. Initial command-shape errors (e.g. a palette command without an `id`) throw from `layer()`. — https://opencode.ai/v2/docs/build/plugins/cli/
- Commands can be dispatched programmatically via `context.keymap.dispatch(id, ...)`. — https://opencode.ai/v2/docs/build/plugins/cli/

### The "Escape menu" reading — corrected

- The Escape-accessible menu in OpenCode V2's TUI is **the command palette**, and it is opened with **Ctrl+P** (`command.palette.show`, default `ctrl+p`, "List available commands"), not with Escape. — https://opencode.ai/v2/docs/cli/keybinds/
- The TUI guide states: "Press **Ctrl+P** to open the command palette for every action available in the current view." — https://opencode.ai/v2/docs/cli/tui/
- In the default keymap, the bare **Escape** key is bound to `session.interrupt` ("Interrupt current session"); other Escape uses are context-specific (close dialogs/diff viewer, hide autocomplete, leave shell mode). There is no global "Escape menu". — https://opencode.ai/v2/docs/cli/keybinds/
- The built-in palette lists commands available in the current view. Whether a plugin palette command appears in it is the documented role of `palette: true` ("Register palette, slash, and keyboard commands in a reactive keymap layer"); the docs do not spell out that the palette is the same surface as `command.palette.show`, but the command layer is the only documented plugin mechanism for contributing entries. — https://opencode.ai/v2/docs/build/plugins/cli/ and https://opencode.ai/v2/docs/cli/keybinds/

---

## 2. Sidebar slots

- Slots are registered with `context.ui.slot({ placement: "name", render })` where placement is one of `prepend`, `append`, `before`, `after`, or `replace`; `render` returns JSX and the registration is returned for cleanup. — https://opencode.ai/v2/docs/build/plugins/cli/
- Documented slot names: `app`, `home.footer`, `home.footer.status`, `prompt.footer`, `prompt.footer.status`, `prompt.footer.file`, `session.composer.top`, `sidebar.content`, `sidebar.footer`. — https://opencode.ai/v2/docs/build/plugins/cli/
- The sidebar slot's render receives `sessionID`: `render: ({ sessionID }) => <text>{context.data.session.get(sessionID)?.title}</text>`. — https://opencode.ai/v2/docs/build/plugins/cli/
- `home.footer.status` is the built-in footer row: "Status contributions appear after OpenCode's health indicators and before the version," e.g. `context.ui.slot({ append: "home.footer.status", render: () => <text>SYNCED</text> })`. — https://opencode.ai/v2/docs/build/plugins/cli/
- Sidebar content is Solid JSX. `usePlugin()` from `@opencode/plugin/tui` returns the current context "inside JSX rendered by a route, dialog, or slot"; several reads are explicitly reactive ("`current()` and `variant.list()` are reactive when read in a Solid computation"). Slot and keymap-layer lifecycles are tied to the Solid reactive computation that created them. — https://opencode.ai/v2/docs/build/plugins/cli/
- Whether the sidebar slot **re-renders** when session data changes is only partially documented: `context.data.session.*` is presented as a list/get + `sync()`/`invalidate()` cache driven by `context.data.on(...)` events, not an auto-reactive store. A live `Inbox: {n}` readout is expected to be built by subscribing to events and invalidating/syncing or holding Solid signals. This is flagged in Feasibility and risks. — https://opencode.ai/v2/docs/build/plugins/cli/

### `session.panel` contributions

- `session.panel` is an ordinary slot registered via `context.ui.slot({ append: "session.panel", render })`, then opened from a command with `context.ui.panel.open("acme.review")` (optionally `{ presentation: "fullscreen" }`); `context.ui.panel.current()` and `context.ui.panel.close()` manage it. "The host owns sizing, focus, and full-screen presentation; the plugin owns its contents." — https://opencode.ai/v2/docs/build/plugins/cli/
- Every contribution receives a reactive `PanelInput` with `name`, `sessionID`, `width`, `presentation`, `focused`, plus `focus`, `close`, and `toggleFullscreen` actions; each contribution decides whether to render (e.g. `<Show when={panel.name === "acme.review"}>`). Opening with no matching renderer leaves the slot empty; "names are shared selection values, not registered claims. Use a plugin-prefixed name." — https://opencode.ai/v2/docs/build/plugins/cli/
- Note for our design: `session.panel` is session-scoped (opening outside a session returns `false`), so it fits a per-session pane but not a global inbox screen reachable from the home/palette. — https://opencode.ai/v2/docs/build/plugins/cli/

---

## 3. Opening / seeding a session from the TUI

- `context.ui.router.navigate({ type: "session", sessionID })` navigates to an **existing** session. The docs do not show a create-then-navigate example. — https://opencode.ai/v2/docs/build/plugins/cli/
- `context.client` is "the generated OpenCode client" that "can call the connected server, including a remote server" (example: `context.client.plugin.list(...)`). — https://opencode.ai/v2/docs/build/plugins/cli/
- The client exposes `client.session.create({ location: { directory } })` and `client.session.prompt({ sessionID, text })` — so the pieces to create a session and seed a prompt exist via `context.client.session.*`. — https://opencode.ai/v2/docs/build/client/
- `context.data.session.*` in the CLI plugin is a **read/cache** API only: `list`, `get`, `root`, `family`, `cost`, `status`, plus `pending` / `message` / `permission` / `form` sub-namespaces with `sync`/`list`/`invalidate`. It has no `create` or `prompt`. Creating and prompting must go through `context.client` (or a server plugin). — https://opencode.ai/v2/docs/build/plugins/cli/
- A server (main) plugin can do both on the server side: `ctx.session.create({ title })`, `ctx.session.prompt({ sessionID, text })`, `ctx.session.command(...)`, `ctx.session.isolate`/`switchAgent`/`generate`, with `SessionContext` documented in the plugin build guide. — https://opencode.ai/v2/docs/build/plugins/
- **Net:** "navigate to a new session and seed a prompt" is `const s = await context.client.session.create(...)` then `await context.client.session.prompt(...)` then `context.ui.router.navigate({ type: "session", sessionID: s.id })` — supported in pieces but the combined flow is not shown as a single documented example. — https://opencode.ai/v2/docs/build/plugins/cli/ and https://opencode.ai/v2/docs/build/client/

---

## 4. The todos analogy

- Changelog v2.1.0 (2026-10-20), "Todo Lists in the TUI": "Enable `{ "experimental": { "todo": true } }` to give models the `todowrite` tool and display their task list in the session and sidebar." — https://opencode.ai/changelog
- Config reference (opencode.jsonc) documents `experimental.todo`: "Set `todo` to `true` to give agents a `todowrite` tool for tracking multi-step work. Defaults to `false`." It sits under the `experimental` key with the warning that experimental settings "may change, break, or be removed in any release without notice." — https://opencode.ai/v2/docs/config/
- The CLI-settings reference has its own `experimental` object ("feature IDs to booleans", "only use feature IDs currently listed by the TUI's Experiments dialog"); the `todo` flag is documented on the **opencode.json** side, and neither the changelog nor the cli.json reference states whether `experimental.todo` also lives in `cli.json`. — https://opencode.ai/v2/docs/cli/config/
- The feature is **not an API a plugin can reuse.** It is a feature flag that (a) registers a model-facing `todowrite` tool and (b) causes OpenCode's own behavior for rendering a task list in the session and sidebar. No plugin hook, slot, event, or data namespace named for todos is documented. Its value to us is purely the analogy: "a model writes structured tasks, the TUI surfaces them in session + sidebar." — https://opencode.ai/changelog and https://opencode.ai/v2/docs/config/

---

## 5. Naming collisions: OpenCode's "inbox"

- OpenCode's HTTP API "inbox" is a per-session queue of pending/admitted inputs: `GET /api/session/{sessionID}/inbox` ("List session inbox"), `PATCH /api/session/{sessionID}/inbox/{inboxID}` ("Update inbox item"), `DELETE /api/session/{sessionID}/inbox/{inboxID}` ("Cancel inbox input"). — https://opencode.ai/v2/docs/api/
- The schema names: `Session.Inbox.Info` is the union `Session.Inbox.User | Session.Inbox.Synthetic | Session.Inbox.Compaction | Session.Inbox.Move`; `Session.Inbox.Delivery` is `"steer" | "queue"`; each item carries `{ id, sessionID, time.created, type, payload, delivery }`. — https://opencode.ai/v2/openapi.json (linked from https://opencode.ai/v2/docs/api/)
- The CLI plugin guide uses the word directly: "Pending inbox items and messages have list, lookup, sync, and invalidate APIs" — i.e. `context.data.session.pending.*`. — https://opencode.ai/v2/docs/build/plugins/cli/
- `Session.Info` itself has **no** `inbox` field (its documented properties are `id`, `parentID`, `fork`, `projectID`, `agent`, `model`, `cost`, `allowance`, `tokens`, `outcome`, `time`, `title`, `subpath`, `metadata`, `permissions`, `revert`, `location`); pending items are a separate endpoint/namespace. — https://opencode.ai/v2/openapi.json
- **Plain finding for the spec (not decided here):** in OpenCode V2, "inbox" already and specifically means *a session's pending prompts queued for delivery* (delivery `steer` vs `queue`, managed by the TUI's "Manage queued prompts" keybind `session.queued_prompts`). Our product-level "inbox" is a different concept (our own items-to-answer screen). There is no namespace-level technical collision (no plugin uses "inbox" as an ID, and our sidebar text is our own JSX), but there is a genuine **UX/conceptual naming collision**: a user of both will see two different "inbox" notions, and docs/support uses of the word will be ambiguous. — https://opencode.ai/v2/docs/api/ and https://opencode.ai/v2/docs/cli/keybinds/

---

## 6. Git-spec distribution

### `opencode plugin add` — git specifications

- "Package installation accepts npm names with versions, tags, or ranges, plus npm-compatible Git package specifications. Git repositories can use hosted shortcuts, HTTPS, or SSH, including private repositories available through your existing Git credentials." — https://opencode.ai/v2/docs/plugins/
- Documented git forms: `opencode plugin add github:acme/opencode-plugin`, `opencode plugin add git+ssh://git@github.com/acme/opencode-plugin.git#main`, and a subdirectory selector `opencode plugin add 'github:acme/plugins#main::path:packages/opencode-plugin'`. — https://opencode.ai/v2/docs/plugins/
- "Branches, tags, complete commit hashes, and npm's `::path:` repository-subdirectory selectors are supported. Configure local paths directly; tarball and npm alias targets are not accepted by `plugin add`." — https://opencode.ai/v2/docs/plugins/
- Update semantics: on server startup OpenCode "checks unpinned npm and Git plugins for updates without changing the installed package. Exact npm versions and full Git commit hashes stay pinned." `plugin check` "checks server and TUI-only package plugins for updates"; `plugin update` "updates every outdated package"; "Local plugins and exact package revisions are skipped." — https://opencode.ai/v2/docs/plugins/
- So a `github:owner/repo` spec (branch shorthand, e.g. tracking `main`) is **unpinned and update-checked**, while pinning a **full commit hash** stays pinned. — https://opencode.ai/v2/docs/plugins/

### Package entrypoints

- Server (main) plugin package shape (build guide, "Publish"): `"name"`, `"version"`, `"type": "module"`, `"exports": { ".": "./src/index.ts", "./rpc": "./src/rpc.ts" }`, `"dependencies": { "@opencode/plugin": "latest" }`; `./rpc` is optional. — https://opencode.ai/v2/docs/build/plugins/
- CLI/TUI plugin package shape (CLI plugin guide, "Publish and load"): `"exports": { ".": "./src/index.ts", "./tui": "./src/tui.tsx" }` with `"peerDependencies": { "@opentui/core": ">=0.6.6", "@opentui/solid": ">=0.6.6", "solid-js": ">=1.9.0" }` and `@opencode/plugin` as a dependency. The guide says: "Expose the CLI plugin through `./tui`; add OpenTUI peers when the plugin renders JSX" and "Export `./tui` beside the main plugin for automatic loading." — https://opencode.ai/v2/docs/build/plugins/cli/
- Loading behavior: "Plugins configured in `opencode.json(c)` that expose a TUI component are loaded automatically by the CLI … You do not need to add the same package to `cli.json`. The CLI gets the active plugin list from the connected OpenCode server." A pure CLI-only package is instead listed in `cli.json` so it "remains active against remote servers." — https://opencode.ai/v2/docs/cli/plugins/ and https://opencode.ai/v2/docs/build/plugins/cli/
- Local (non-package) plugins use a parallel layout in `index.ts` / `tui.ts` beside each other ("Each plugin uses the same layout as a published package, with server and TUI entrypoints kept together"); local directories load "the directory's `server` or `index` module". — https://opencode.ai/v2/docs/cli/plugins/ and https://opencode.ai/v2/docs/plugins/

### Unverified assumption (keystone)

- **Loading a git-spec plugin's `./tui` export is not explicitly documented.** `plugin add` installs git specs as npm-compatible **packages**, and the `./tui`-export loading contract is documented for packages generically — but no doc shows a `github:owner/repo` source being resolved through the `exports` map with a `./tui` entry. The assumption is that a git-spec install lands in the package plugin path (`opencode.jsonc` `plugins` → package → `./tui` auto-loaded), and Node package resolution honors the `exports` map. **This must be verified against the installed artifact**, and a monorepo-style repo additionally depends on npm's `::path:` subdirectory selector behaving with the `exports` map. — https://opencode.ai/v2/docs/plugins/ and https://opencode.ai/v2/docs/build/plugins/cli/

---

## Feasibility and risks

**Inbox screen (full pane + slash + menu entry)**

- Fully supported: a plugin route (`context.ui.router.register` + `navigate({ type: "plugin" })`) gives a full screen at the same level as home/session. — https://opencode.ai/v2/docs/build/plugins/cli/
- Supported but inferred: reaching it from the slash menu (`slash: { name: "inbox" }`) and the command palette (`palette: true`) requires a keymap command whose `run` calls `navigate`; the docs document both halves but no combined example. — https://opencode.ai/v2/docs/build/plugins/cli/
- "Escape menu" must become "command palette (Ctrl+P)": Escape itself is bound to `session.interrupt`, and the palette is `command.palette.show` (`ctrl+p`). The reachability requirement is unaffected (a palette command can navigate), but the phrasing in our spec is wrong. — https://opencode.ai/v2/docs/cli/keybinds/

**Sidebar readout**

- Fully supported as a slot: `context.ui.slot({ append: "sidebar.content", render: ({ sessionID }) => ... })` (and `sidebar.footer`, or `home.footer.status` for the home row). Solid JSX + `usePlugin()` are documented. — https://opencode.ai/v2/docs/build/plugins/cli/
- Partially documented risk: live reactivity of the readout. Slot JSX is Solid-rendered and some reads are documented reactive, but `context.data.session.*` is a sync/invalidate + event-subscription cache, so an always-current `Inbox: {n}` readout likely needs our own signal updated from `context.data.on(...)` events, then invalidate/sync. Unverified until built. — https://opencode.ai/v2/docs/build/plugins/cli/

**Naming collisions**

- No technical/namespace collision (our route name, keymap id, and slot text are plugin-owned). But OpenCode's own "inbox" (per-session pending prompts, `Session.Inbox.*`, delivery `steer|queue`) collides with our product-level "inbox" in UX and terminology. The spec should confront this naming decision explicitly. — https://opencode.ai/v2/docs/api/

**Not-yet-verified keystones**

1. Whether a `github:`/`git+ssh://` git-spec plugin's `exports["./tui"]` entry is actually resolved and auto-loaded (docs combine git install + `./tui` loading only by implication; no explicit statement or example). — https://opencode.ai/v2/docs/plugins/
2. Whether a keymap palette/slash command can navigate to a plugin route as we assume (documented pieces; no combined example). — https://opencode.ai/v2/docs/build/plugins/cli/
3. Live re-render behavior of `sidebar.content` slot content when session/pending data changes (Solid reactivity of `context.data.session.*` reads is not explicitly documented). — https://opencode.ai/v2/docs/build/plugins/cli/
4. The exact `data` shape passed to a plugin route and whether routes/palette entries are scoped per-view ("every action available in the current view") affects whether our inbox command shows on the home screen. — https://opencode.ai/v2/docs/build/plugins/cli/ and https://opencode.ai/v2/docs/cli/tui/
5. Whether `experimental.todo` is exclusively an `opencode.json` setting (documented there) or also honors `cli.json`'s `experimental` object — only matters if we cite it as config precedent. — https://opencode.ai/v2/docs/config/ and https://opencode.ai/v2/docs/cli/config/