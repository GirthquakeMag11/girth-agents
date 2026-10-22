# Handoff becomes a skill behind two commands

The session-lifecycle fold of 0002 is unwound for handoff alone: the
`handoff` skill revives as the machinery behind both `/handoff` and a new
`/pickup` command — the document's format, the staleness playbook, and the
consumption protocol the two doors share. `retro` stays folded in its
command. The design being implemented is `specs/handoff-pickup.md`.

Status: accepted

## Considered options

- Keep `/handoff` command-only and put pickup inside it too — rejected: one
  door doing two acts, and the protocol still needs a home that both doors
  and other agents can reach.
- Rewind the fold outright, reviving `retro` as well — rejected: retro
  still has no distinct trigger of its own and no machinery to share.

## Consequences

- 0002's fold now covers `retro` only; its record gains
  `Status: superseded in part by 0004`.
- The consuming mechanism is framed by five glossary terms — Fresh, Stale,
  and Consumed Context, the Context Consumer, and Partially Consumed
  Context — recorded with this decision; the playbook that acts on them
  lives in the `handoff` skill, nowhere else.
- `specs/handoff-pickup.md` is the governing design; implementation is
  sliced from it into tickets.