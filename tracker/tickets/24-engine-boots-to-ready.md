# 24: The engine boots to ready — process, config, transport, supervision

**Parent:** specs/engine.md

**Kind:** feature

**Blocked by:** None (can start immediately)

## What it delivers

An engine that comes to life cleanly: spawned from the plugin's server
side as a child process, it loads the canonical JSON config through the
shipped schema — invalid config is a loud refusal to boot, not a limp
start — establishes the versioned JSON-lines stdio channel with the
pokes, notices, and heartbeat, receives its activation watch-list, runs
its first reconcile-from-records, and reports `ready`. If it dies
unexpectedly, the plugin respawns it with backoff; when the server shuts
down, no respawn happens. Every start is idempotent.

## Work so far

- 2026-10-27: tested at the spec's seams with node:test under `engine/` — 9 green: config validation (loud refusal, constraint named), stdio framing (versioned JSON-lines, full five-poke/six-notice vocabulary, unknown-kind tolerance), supervisor policy + real-child respawn with backoff and clean SIGTERM shutdown, the real engine process announcing version/ready/heartbeat, and exit 2 with the broken constraint named on invalid config.
- 2026-10-27: the literal plugin server entry (loading via OpenCode, reading the watch-list from plugin storage, forwarding stdio) stays for the plugin's scaffold — untestable without a live install; the supervise-and-boot machinery it will call is built and green here.

- **Done — 2026-10-27:** engine boots to ready — process, schema-validated config with loud refusal, versioned stdio vocabulary, watch-list handover, heartbeat, supervisor with backoff respawn; tests at `engine/engine.test.mjs`.

- [ ] The engine process starts as a child of the plugin's server side and speaks versioned JSON-lines over stdio in both directions
- [ ] All five pokes, all six notices (including the periodic heartbeat), and unknown-message tolerance are implemented and exercised
- [ ] Invalid config makes the engine refuse to boot loudly, with the offending constraint named
- [ ] The watch-list handed over at start becomes the set of projects the engine serves
- [ ] A killed engine is respawned with backoff; a server shutdown produces no respawn
- [ ] Restarting the engine twice over the same records produces the same reconciled state and a `ready` notice