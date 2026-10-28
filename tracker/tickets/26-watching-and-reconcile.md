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

## Acceptance criteria

- [ ] A record change on disk to produce a ready stamp surfaces as ready work after the engine's own watch or its next pass
- [ ] Changes made while the engine is down are found by the reconcile pass at start — missed events are not lost work
- [ ] A kill during an in-flight step leaves no in-flight stamp behind; restart re-picks the piece from its last durable stamp
- [ ] Each poke is surfaced through the transport into the watcher's behavior; claim-input hands a file to the entry node's flow