# 07: The six helpers, defined and role-shaped

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 01 (plugin skeleton and channel), 04 (engine skeleton)

## What it delivers

The six helpers exist as named agents with their own descriptions,
context, toolset, skills, and permission rulesets — builder, reviewer,
fact-finder, prove-it, answerer, caregiver — each failing openly rather
than asserting unless the job needs an assertion it can verify. The
orchestrator — the one interactive primary — fronts the user's sessions.
The agents register with the plugin; the agent-ID keystone, verified in
ticket 01, governs how they arrive, and a failed verification is taken
to the user — the spec presumes no fallback.

## Acceptance criteria

- [ ] Six named helpers register and are dispatchable by the engine.
- [ ] Each helper's description, context, toolset, skills, and permission ruleset are its own, per the spec's role assignments.
- [ ] The one interactive primary is the orchestrator, and `build` and `plan` are replaced.
- [ ] The fact-finder and prove-it carry their mutual-check relationship in their definitions.