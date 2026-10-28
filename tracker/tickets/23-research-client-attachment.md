# 23: Research the cross-process server-client attachment

**Parent:** specs/engine.md

**Kind:** research

**Blocked by:** None (can start immediately)

## What it delivers

The engine is its own process, and every step it runs needs a headless
OpenCode session. This ticket settles, with primary evidence, whether a
second process on the same machine can attach as an OpenCode server
client — how it discovers the running server and how it authenticates —
and thereby decides between the engine holding its own client or the
plugin proxying session operations over stdio.

## Work so far

- 2026-10-27: picked up from the frontier; the research skill's pass begins.
- 2026-10-27: findings in `docs/research/engine-client-attachment.md` — a second process attaches as a server client the same way the TUI does: the service registration file (mode-0600, loopback-bound), HTTP Basic with the file's password, full session surface plus the live SSE stream. GO on the engine holding its own client; the proxy fallback is dismissed.

- **Done — 2026-10-27:** cited note at `docs/research/engine-client-attachment.md`; the engine attaches its own client — decision (c) GO, proxy dismissed.

## Acceptance criteria

- [ ] A recorded finding notes whether a separate process can attach as a server client, how it discovers the server, and how it authenticates, each claim cited to docs or a live probe
- [ ] The finding names the exact client surface available to a second process (session create, prompt, wait/interrupt, context read) with its constraints
- [ ] The go/no-go on the engine's own client is stated, with the proxy fallback invoked or dismissed by the evidence