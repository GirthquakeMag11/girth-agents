# 09: The review gate's core — send, grade, repair, repeat

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 06 (six helpers defined), 08 (entry-point tool)

## What it delivers

The PASS/FAIL cycle runs as a hard tool: the engine spawns the fresh
reviewer, reads its verdict, returns a FAIL to the builder — which
keeps its session across fix-rounds — and repeats until PASS or the
cap. The cap (three rounds) and step time limit (ten minutes) are the
plugin's own configuration, enforced by the tool, ungrantable to the
agent's judgment. A lost session is detected and rebuilt from the
records alone. A cleared plan enters as the first work; the plan's
repair chair is the live interactive session, because the plan's
review precedes its confirmation.

## Acceptance criteria

- [ ] Cleaning a plan into the engine starts the gate: a fresh reviewer grades it, a FAIL returns it for repair, and the cycle ends at PASS or the cap.
- [ ] The builder keeps its session across fix-rounds; the reviewer is always fresh.
- [ ] The cap and the time limit are enforced by the tool and cannot be bent by the agent.
- [ ] A killed session is detected and rebuilt from the records alone.