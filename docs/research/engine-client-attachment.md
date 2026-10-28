# Can a second process attach as an OpenCode server client? — engine client attachment research

**Question:** The girth-agents engine runs as a SEPARATE process on the same
machine (spawned from the plugin's server-side code). It must drive OpenCode
sessions (create, prompt, wait, interrupt, read completion). Can a second
process attach as an OpenCode server client — and exactly how (discovery,
auth) — or must session operations be proxied through the plugin's in-process
context? This settles ticket 27's driver backend: engine's own client vs.
plugin proxy over stdio.

**Date:** 2026-10-27/28 (docs current on this date; live probe on this machine)

**Primary sources used:**

- https://opencode.ai/v2/docs/build/client/ (SDK package, client semantics, local service API)
- https://opencode.ai/v2/docs/build/sdk/ (@opencode/sdk embedded host — the other package)
- https://opencode.ai/v2/docs/build/plugins/ (plugin context ≡ server client, sessions surface)
- https://opencode.ai/v2/docs/api + openapi.json (v2, saved 2025-10-25 at /tmp/opencode/openapi.json; 124 paths, 298 schemas; the running server is v2.1.4)
- https://opencode.ai/v2/llms.txt (index — no further client/attach pages beyond the above)
- npm registry: `@opencode/client@2.2.0` (published dist files read from unpkg), `@opencode/sdk`
- GitHub source: github.com/anomalyco/opencode (default branch `dev`; repo verified via the package's own `repository` field), files cited per claim
- Live probe of THIS machine (OpenCode 2.1.4): processes, sockets, data/state dirs, /proc environ, credentialed HTTP probes (read-only)

---

## 1. YES — and this is how OpenCode's own TUI works

A second process on the same machine attaching as a server client is not an
edge case; it is the shipped architecture. OpenCode's TUI is itself a thin
client of a headless `opencode serve --service` server.

**Live probe (this machine, 2026-10-28):**

- `ps -ef --forest`: pid 2446 `/home/george/.opencode/bin/opencode` (interactive
  TUI, since Oct 25) → its child is pid 145808 `opencode serve --service`
  (since 2026-10-27 15:12). The TUI spawned the headless server.
- `ss -tlnp`: the only OpenCode listener is `127.0.0.1:49374`, owned by pid
  145808 (fd 8). No unix sockets.
- `ss -tnp`: `ESTAB 127.0.0.1:49374 ↔ 127.0.0.1:55436` between pid 145808
  (fd 9) and pid 2446 (fd 11) — the TUI is a **separate process attached as a
  TCP client of the server right now**.
- `/proc/145808/environ`: **no `OPENCODE_*` variables at all** (environment
  identical to the parent TUI's). The connection is not env-configured.
- Server process fds: 0,1 → `/dev/null`, 2 → a socket (stderr pipe to the
  spawner, matching the client SDK's `stdio: ["ignore","ignore","pipe"]`),
  10 → `~/.local/share/opencode/opencode.db` (shared data dir).

## 2. Discovery: a JSON registration file in the XDG state directory

The server writes its connection details to a registration file when it
starts; clients poll that file.

**Server side writes it** — `ServiceRegistration.register(...)` writes
`{ id, version, url, pid, password }` with mode 0600 to the registration file,
then a background fiber re-verifies ownership every 5 s and shuts the server
down if the file is replaced.
(https://github.com/anomalyco/opencode/blob/dev/packages/cli/src/services/service-registration.ts)

**Live probe:** `/home/george/.local/state/opencode/service.json` (mode 0600;
mtime 2026-10-27 15:12:32 — exactly the server's spawn second) contains:

```json
{ "id":"ba39de03-249…", "version":"2.1.4",
  "url":"http://127.0.0.1:49374", "pid":145808, "password":"zS5X…" }
```

`pid` matches the running process; `url` matches the listener from `ss`.

**Client side reads it** — `@opencode/client/service`:

- `Service.discover()` → reads JSON at `file` (default: the XDG state
  directory, i.e. `~/.local/state/opencode/service.json`), health-checks
  `GET /api/info` with the auth headers, verifies the response's `pid` and
  `version` match the file, returns `endpoint { url, auth }`.
- `Service.ensure()` → if discovery finds nothing healthy, spawns
  `opencode serve --service` (detached; `onStart` callback; custom `file`,
  `command`, `version`, and `env` accepted) and polls the file until a
  compatible service answers.
- `Service.stop()` stops exactly the registered instance.

(`@opencode/client@2.2.0`, dist/promise/service.js + chunks/service-timing-8ye1ye6f.js;
source: packages/client/src/service.ts — "Absolute registration file path.
Defaults to the XDG state directory.")

**The port is not random.** In service mode the default listen port is a
per-channel constant: `0xC0DE` (decimal **49374**) for the mainline channel,
`0xC0DF` for `local`, else derived from the channel name. That is exactly the
port observed live. `--port`/`--hostname` (default `127.0.0.1`) override it.
(https://github.com/anomalyco/opencode/blob/dev/packages/cli/src/services/service-config.ts;
https://github.com/anomalyco/opencode/blob/dev/packages/cli/src/server-process.ts)

Also on disk: `~/.config/opencode/service.json` is the *service config file*
(optional `hostname`, `port`, `password`, `cors`, `env`, `remote`). Its
`{ "password": … }` (Oct 21, still present) is the password persisted from the
first service start — the server keeps one password across restarts
(`config.password || randomBytes(32).toString("base64url")`,
packages/cli/src/server-process.ts). The two service.json files are different
files in different XDG dirs.

## 3. Authentication: HTTP Basic, fixed username `opencode`, password from the file

- Server: `packages/server/src/auth.ts` fixes the username:
  `this.of({ ...input, username: "opencode" })`, and `authorized()` accepts a
  request when `credentials.username === "opencode"` and the password matches
  literally — **or** is a signed session token (HMAC-SHA256 keyed on the
  server password, TTL 30 days) issued by the pairing flow (`GET
  /auth/connect/{code}`, operation `server.connect`: "requests that accept
  JSON receive a session token to use as the password"). Browsers instead get
  a cookie `opencode_session_<port>`. Rotating the password revokes every
  session token.
- Client: `Service.headers(endpoint)` returns
  `authorization: "Basic " + base64("opencode:" + password)`.
  (`@opencode/client@2.2.0` service-timing-8ye1ye6f.js, `headers2()`.)
- The OpenAPI spec itself declares **no security** (`security: []`, no
  `securitySchemes`; the only header parameter anywhere is
  `x-opencode-ticket` on PTY connect-token routes). Auth is server middleware
  applied uniformly, invisible to the spec.

**Live probe (the machine as primary evidence), 2026-10-28:**

| request to `http://127.0.0.1:49374` | result |
|---|---|
| `GET /api/info` no credentials | `401 {"_tag":"UnauthorizedError","message":"Authentication required"}` |
| `?password=…` / `Authorization: Bearer …` / `x-opencode-password: …` | `401` |
| `GET /api/info` with `-u opencode:<pw-from-file>` | `200 {"version":"2.1.4","pid":145808,"urls":["http://127.0.0.1:49374"],"paths":{"tmp":"/tmp/opencode"},"capabilities":{"persistentPty":true}}` |
| `GET /api/session` with Basic auth | `200` — full session list (includes the live deepseek session `ses_e7e8…` with agent/model/cost/tokens) |
| `GET /api/event` with Basic auth, 3 s | SSE stream: `server.connected` marker, `: heartbeat`, then live `session.tool.success` events carrying `sessionID` |

**So a process that is not OpenCode at all (curl) attached to the running
server, discovered it via the registration file, authenticated with the file's
secret, listed sessions, and subscribed to live events.** Token lifetime to
note for headless clients: the *password* itself does not expire; only
pairing-issued session tokens expire (30 days).

## 4. The exact client surface available to a second process

Everything the plugin's `ctx` can do over its in-process client, a second
process can do over HTTP — the plugin context "is essentially an OpenCode
server client" whose methods "use the same inputs and responses as the
client", so the surfaces are the same contract by construction.
(https://opencode.ai/v2/docs/build/plugins/#context)

Operations (openapi.json v2, verified against the v2.1.4 server):

- **Create:** `POST /api/session` `session.create` — accepts `id`, `parentID`,
  `agent`, `model`, `location`, `metadata`, `permissions` in one call.
- **Prompt:** `POST /api/session/{sessionID}/prompt` `session.prompt`
  ("Send message") — resolves on admission, delivery `steer`|`queue`.
- **Wait:** `POST /api/experimental/session/{sessionID}/wait`
  `experimental.session.wait` ("Wait for session") — experimental, same as the
  plugin surface exposes.
- **Interrupt:** `POST /api/session/{sessionID}/interrupt`
  `session.interrupt`.
- **Read context/completion:** `GET /api/session/{sessionID}/context`
  `session.context`; poll state via `GET /api/session/{sessionID}`
  (`session.get` → `Session.Info.outcome` / `time.idle`); message list ends in
  `Session.Message.Idle { outcome: succeeded|failed|interrupted }`.
- **List:** `GET /api/session` `session.list` (verified live), plus
  `GET /api/session/active`. Per-directory listing with cursor pagination.
- **Events:** `GET /api/event` `event.subscribe` — SSE
  (`text/event-stream`, envelope `{ id, event, data: V2EventEncoded }`),
  live-verified from curl including `session.idle` (the documented completion
  event) and `server.connected` for late subscribers. Same constraints as the
  plugin: live-only, no replay, no automatic reconnection
  (https://opencode.ai/v2/docs/build/client/#stream-events).
- Everything else the OpenAPI exposes (config, permissions, forms, compact,
  rpc, …) is equally callable with the same headers.

**Constraints:**

1. Auth: Basic header on every request including the event stream;
   username literal `opencode`; password from the registration file. Wrong
   creds → 401.
2. Discovery: read the registration JSON (default XDG state dir/`service.json`,
   override via the SDK's `file` option); a `pid`+`version` check against
   `/api/info` is part of the official discovery handshake.
3. The server listens on loopback by default (`hostname ?? "127.0.0.1"`,
   server-process.ts) — local-machine only unless the user configures
   remote/`--hostname`.
4. The service is per-channel, per-machine: the registration file is **global
   for the machine**, one opencode data dir is shared
   (`~/.local/share/opencode/opencode.db`), and any attached client sees and
   manipulates the same session namespace. For the engine, `Service.ensure()`
   (not a bare `discover()`) is the safe attach pattern — it starts a service
   when the TUI hasn't.
5. Isolation levers exist for a *second, dedicated* headless server: the
   binary exposes `OPENCODE_CONFIG_DIR`, `OPENCODE_DB`, `OPENCODE_DRIVE`
   (among others — extracted from the running 2.1.4 binary's strings), and
   the SDK's `Service.ensure({ file, command, env })` allows a custom
   registration file and spawn command, e.g. `["opencode","serve","--service",
   "--port","0"]` with isolated env; the client reads the real URL back from
   the registration file, so an ephemeral port is fine.
6. `opencode serve --stdio` also exists as a transport mode (serve flag list,
   live probe) — a single-client, stdio-bound server; it is the server-side
   counterpart of the proxy option, not of the multi-client attach.

## 5. Notes on the adjacent package (@opencode/sdk)

`@opencode/sdk` ("hosts OpenCode directly inside your application … assembles
the OpenCode server and routes API calls through its HTTP router in memory. It
opens no HTTP listener.") exists
(https://opencode.ai/v2/docs/build/sdk/). It is for applications that *embed*
the server — not a fit here (the server already exists and is driven by the
user's client), but it caps the design space: the engine cannot "embed a
second server in its process" without taking over server responsibilities;
attaching as a client (or spawning a second serve process) are the supported
shapes.

---

## Verdict

**(a) Can a separate process attach as a server client? YES.** Discovery: the
server writes `{ id, version, url, pid, password }` (mode 0600) to
`~/.local/state/opencode/service.json` at startup
(packages/cli/src/services/service-registration.ts; live file observed,
mtime = spawn time, pid/url matching `ss`), listen default
`127.0.0.1:0xC0DE` = port 49374 per channel
(packages/cli/src/services/service-config.ts). Authentication: HTTP Basic,
username fixed `opencode`, password = the file's secret
(packages/server/src/auth.ts; client: `Service.headers` →
`authorization: Basic base64("opencode:"+pw)`, service-timing-8ye1ye6f.js).
Live-proven from a foreign process: unauthenticated → 401; with the file's
credentials → `/api/session` list and `/api/event` SSE both return live data
(probe of pid 145808, 2026-10-28). OpenCode's own TUI (pid 2446) is currently
doing exactly this against its `serve --service` child (ESTAB TCP, fd 11).
The SDK path is `@opencode/client` + `@opencode/client/service`:
`Service.ensure()` → `OpenCode.make({ baseUrl: endpoint.url, headers:
Service.headers(endpoint) })` (https://opencode.ai/v2/docs/build/client/,
service.d.ts).

**(b) Client surface for a second process:** full — session create
(`session.create`), prompt (`session.prompt@POST /api/session/{id}/prompt`),
wait (`experimental.session.wait`, experimental), interrupt
(`session.interrupt`), context read (`session.context`),
list/active/poll (`session.list`, `session.get` → `Session.Info.outcome` /
`Session.Message.Idle`), and the live SSE stream `/api/event`
(`server.connected` marker, `session.idle`, per-event JSON with sessionID —
live-verified). Constraints: Basic auth on every request incl. SSE; discovery
only through the registration file (with a pid+version health check);
loopback-only by default; one shared machine-wide session store (a second
client sees the user's sessions and vice versa); waiting on
`experimental.*`; events live-only, no replay. For a *dedicated* engine
server, `Service.ensure({ file, command, env })` plus the
`OPENCODE_CONFIG_DIR` / `OPENCODE_DB` / `OPENCODE_DRIVE` env vars provide an
isolated second instance.

**(c) Go/no-go for ticket 27's backend: GO — the engine holds its own
client; the proxy is dismissed.** Attaching as a client is the shipped,
first-class pattern (the TUI itself is such a client), documented end to end
(client docs + SDK types + server source), and live-proven here with a
foreign process driving sessions and events. The proxy (plugin re-serializing
its in-process `ctx` over stdio) would re-implement exactly this client
surface through a private wire, for strictly more code, a new protocol to
design/test, and no additional capability — the plugin `ctx` "uses the same
inputs and responses as the client" anyway
(https://opencode.ai/v2/docs/build/plugins/#context). Decision left to ticket
27's design, from the evidence: **attach via `Service.ensure()` to the
machine's service** (recommended: reuse the running headless server, engine
sessions visible to the user, prompts pre-granted so no dialogs) **or spawn a
dedicated headless service** with isolated registration file + `OPENCODE_*`
env when session-namespace separation matters. The only real constraint to
codify in the driver: authentication is a file-backed shared secret; read it
via the SDK's discovery, never hardcode the port or the password.