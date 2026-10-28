# The engine

The always-awake harness that runs a claimed plan through a configured
node graph of headless agent sessions, graded and repaired until it
passes. Specced in `specs/engine.md`; the mechanics live as plain
Node ESM modules beside this file, tested with `node --test engine/`.

## The current workflow graph

```mermaid
flowchart LR
    classDef entry fill:#e8e8e8,stroke:#555,stroke-width:2px
    classDef task fill:#dbeafe,stroke:#1d4ed8,stroke-width:2px
    classDef decide fill:#fef9c3,stroke:#a16207,stroke-width:2px
    classDef done fill:#dcfce7,stroke:#15803d,stroke-width:2px
    classDef bounce fill:#fee2e2,stroke:#b91c1c,stroke-width:2px
    classDef defect fill:#f3e8ff,stroke:#7e22ce,stroke-width:2px,stroke-dasharray: 5 2

    IN(["in — entry · marker: CONFIRMED"]):::entry
    BUILD["build — task · builder · work/out.json"]:::task
    GRADE{"grade — task · checker · work/verdict.json"}:::decide
    REPAIR["repair — task · builder · resumes build's session · maxVisits: 3"]:::task
    OUTDONE(["out-done — exit"]):::done
    BOUNCE(["bounce — exit · question · awaiting-answer"]):::bounce
    DEAD_GRADE(["loud defect — chain halts, nothing routes"]):::defect

    IN --> BUILD
    BUILD --> GRADE
    GRADE -- "verdict = pass" --> OUTDONE
    GRADE -- "verdict = fail" --> REPAIR
    REPAIR --> GRADE
    REPAIR -- "after 3 repairs" --> BOUNCE
    GRADE -. "any other stamp" .-> DEAD_GRADE
```

This diagram is generated from the live graph config and tested for
drift: any change that touches the graph must keep this block in sync,
and the drift test fails until it does.

A stamp that matches no declared condition — `verdict: "maybe"` or a
missing field — is a loud defect naming the stamp; it is never routed
anywhere. Out-links are conditional or unconditional, never a mixture,
never a catch-all.

Legend: gray = entry, blue = task, yellow = decision, green/red = the
two exits. The refinement loop is the circle through `grade` and
`repair`; `maxVisits: 3` is the structure's bound — the number is the
config's.

## The config tree

`config.json` is a thin manifest of pointers; every agent, node, and
skill is its own Markdown file with constrained frontmatter:

- `agents/<name>.md` — the fitting (job, model, capabilities,
  permissions) and the skills the agent bears; the body is the role line.
- `nodes/<id>.md` — the node's identity, objective, dispatched agent,
  artifact, limits, and its out-links (links live with the node they
  leave).
- `skills/<id>.md` — a real skill document; the body is the instructions
  the brief carries into the session.

Every config change is gated before it is trusted: `node
engine/verify-config-cli.mjs engine/config.json` names any fault —
load, schema, structure, or a trapped matrix path — and sound means a
later failure is the engine's, not the config's.