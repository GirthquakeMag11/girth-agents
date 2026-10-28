# 25: The graph executor core over the config and a fake session driver

**Parent:** specs/engine.md

**Kind:** feature

**Blocked by:** 24 (the config loading it walks the graph from)

## What it delivers

The engine's heart: the hardcoded graph skeleton that walks any
schema-valid graph as data. It dispatches nodes against a fake session
driver (spawn, prompt, await, interrupt), enforces step caps, reads only
the node's configured output artifact, parses its stamp fields, rejects
malformed artifacts as defects, evaluates outbound conditions and routes
unconditionally, honors entry and exit markings, and keeps each project
serial — one current step in flight, everything else ready-but-waiting.
No particular workflow is built in; a fixture graph exercises it.

## Work so far

- 2026-10-27: built test-first at the executor seam — a fake session driver with scriptable outcomes and a held-prompt interrupt. Six green: pass and fail routing through the verdict condition, budget-breach interrupt with the defect named, failed sessions as defects, missing and malformed artifacts as defects, and interleaved projects keeping their serial lanes.

- **Done — 2026-10-27:** the graph executor core walks the fixture graph end to end — dispatch, caps, artifact-only output, stamp-parse conditions, entry/exit terminals, defects aborting — tested at `engine/executor.test.mjs`.

- [ ] A fixture graph drives the executor end to end with the fake session driver, including a condition that routes pass versus fail
- [ ] Step caps fire: a time-budget breach interrupts the step and is reported as a structured failure
- [ ] Only the configured artifact is read as output; its stamp fields are what conditions evaluate
- [ ] A malformed or missing artifact is a defect, never a silent pass
- [ ] With two projects' graphs interleaved, each project stays serial while progress advances across projects