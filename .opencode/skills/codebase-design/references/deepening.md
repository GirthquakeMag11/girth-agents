# Deepening

How to deepen a cluster of shallow modules safely, given its dependencies.
Uses the codebase-design skill's vocabulary: **module**, **interface**,
**seam**, **adapter**. The seam discipline lives in that skill and is not
repeated here.

## Dependency categories

Classify the candidate's dependencies before merging; the category decides
how the deepened module is tested across its seam.

1. **In-process.** Pure computation, in-memory state, no I/O. Always
   deepenable: merge the modules and test through the new interface
   directly. No adapter needed.
2. **Local-substitutable.** Dependencies with local test stand-ins (PGLite
   for Postgres, an in-memory filesystem). Deepenable where the stand-in
   exists: test with the stand-in in the suite. The seam stays internal; no
   port at the module's external interface.
3. **Remote but owned.** Your own services across a network (microservices,
   internal APIs). Define a **port** at the seam: the logic lives in the
   deep module, the transport is injected as an **adapter** — HTTP/gRPC in
   production, in-memory in tests.
4. **True external.** Third-party services you do not control (payments,
   mail, and the like). The deepened module takes the dependency as an
   injected port; tests provide a mock adapter.

A category fixes the *test strategy* for the merge: in-process and
local-substitutable merge freely; remote-but-owned and true-external merge
behind a port.

## Replace, don't layer

- Old unit tests on the shallow modules become waste once tests at the
  deepened interface exist; delete them.
- Write the new tests at the deepened module's interface — the interface is
  the test surface.
- Assert observable outcomes through the interface, not internal state.
- A test that must change whenever the implementation changes is testing
  past the interface; rewrite it at the seam.