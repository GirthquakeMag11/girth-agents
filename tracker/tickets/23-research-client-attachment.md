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

## Acceptance criteria

- [ ] A recorded finding notes whether a separate process can attach as a server client, how it discovers the server, and how it authenticates, each claim cited to docs or a live probe
- [ ] The finding names the exact client surface available to a second process (session create, prompt, wait/interrupt, context read) with its constraints
- [ ] The go/no-go on the engine's own client is stated, with the proxy fallback invoked or dismissed by the evidence