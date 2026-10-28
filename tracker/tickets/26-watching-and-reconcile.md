# 26: Watching the records and reconciling from stamps

**Parent:** specs/engine.md

**Kind:** feature

**Blocked by:** 25 (the executor it feeds) and 24 (the watch-list it watches from)

## What it delivers

The engine's eyes: each activated project's records tree is watched by
the engine's own filesystem watch, rounded out by a periodic
reconciliation pass and the plugin's pokes — claim-input, activation
added or removed, pause, resume. Any change a watch misses is caught by
the next pass; the platform's live-only event stream is never relied
on, or read. Reconciliation derives ready work from the committed
stamps and nothing else: in-flight is never committed, and a vanished
in-flight piece falls back to its last durable stamp and is re-picked.

## Work so far

- 2026-10-27: built test-first — the reconciler (stamps from committed records; the durable vocabulary; unknown states collected), the watcher (fs-watch per project plus periodic pass; pause/resume; watch errors yield to the next pass, never the event stream), and the engine wiring (boot reconcile finds records written while down; a kill leaves only what was seeded — no in-flight marks, same re-pick on restart; all five pokes surface; claim-input retained as pending claims until the runner exists).

- **Done — 2026-10-27:** watching and reconciliation land at `engine/reconciler.mjs`, `engine/watcher.mjs`, wired in `engine/engine.mjs`; 21 tests green across the suite.

- [ ] A record change on disk to produce a ready stamp surfaces as ready work after the engine's own watch or its next pass
- [ ] Changes made while the engine is down are found by the reconcile pass at start — missed events are not lost work
- [ ] A kill during an in-flight step leaves no in-flight stamp behind; restart re-picks the piece from its last durable stamp
- [ ] Each poke is surfaced through the transport into the watcher's behavior; claim-input hands a file to the entry node's flow