# 09: The review gate's core — send, grade, repair, repeat

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 07 (six helpers defined), 08 (entry-point tool)

## What it delivers

The PASS/FAIL cycle runs as a hard tool: the engine spawns the fresh
reviewer, reads its verdict, returns a FAIL to the builder — which
keeps its session across fix-rounds — and repeats until PASS or the
cap. The cap (three rounds) and step time limit (ten minutes) are the
plugin's own configuration, enforced by the tool, ungrantable to the
agent's judgment. A lost session is detected and rebuilt from the
records alone. A cleared plan enters as the first work; the plan's
repair chair is the live interactive session, because the plan's
review precedes its confirmation. The plan's review certifies
authority-completeness: every user-answerable question visible in the
session was asked. The work stage is reviewed ticket by ticket — each
ticket's outcome against its ticket, code and test evidence as proof,
the stamp on the ticket. Several cleared plans queue in received
order, first in first out.

## Acceptance criteria

- [ ] Clearing a plan into the engine starts the gate: a fresh reviewer grades it, a FAIL returns it for repair, and the cycle ends at PASS or the cap.
- [ ] The builder keeps its session across fix-rounds; the reviewer is always fresh.
- [ ] The cap and the time limit are enforced by the tool and cannot be bent by the agent.
- [ ] The plan's review checks authority-completeness; the work stage is reviewed ticket by ticket with code and test evidence; several plans queue in received order.
- [ ] A cap too low for the work is the exception, not an override.
- [ ] The inbox carries newness, never deferral — post-confirmation questions are only those a later context newly made visible.
- [ ] A killed session is detected and rebuilt from the records alone.