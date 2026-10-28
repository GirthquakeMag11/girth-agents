# The engine

The always-awake harness that runs a claimed input — today, a tracker
ticket stamped ready — through a configured node graph of headless
agent sessions, implemented, reviewed, and repaired until it passes.
Specced in `specs/engine.md`; the mechanics live as plain Node ESM
modules beside this file, tested with `node --test engine/`.

## The current workflow graph

```
                 ticket-in
            [entry · **Ready:**]
                     │
                     ▼
                 implement
    [builder · work/implementation.json]
                     │
                     ▼
                   review
       [reviewer · work/review.json]

      verdict=pass        verdict=fail
            │                   │
       implemented
         [exit]
                             repair
                  [resumes implement's session]
                  re-grade — back up to review
                         after 3 repairs
                                │
                                ▼
                             bounce
               [exit · question · awaiting-answer]

review · any other verdict → loud defect: the chain halts, nothing routes
```

This diagram is generated from the live graph config and tested for
drift: any change that touches the graph must keep this block in sync,
and the drift test fails until it does.

A stamp that matches no declared condition — `verdict: "maybe"` or a
missing field — is a loud defect naming the stamp; it is never routed
anywhere. Out-links are conditional or unconditional, never a mixture,
never a catch-all.

The entry admits a claimed ticket only when it is stamped
`**Ready:**`, and the brief names the claimed ticket's file for every
helper to read — the ticket is the contract both sides work from. The
refinement loop is the circle through `review` and `repair` — the
`re-grade` arc — and `maxVisits: 3` is the structure's bound; the
number is the config's.

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