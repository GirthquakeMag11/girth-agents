# Session-lifecycle acts live in their commands

The `handoff` and `retro` skills — human-triggered, end-of-session acts with
no callers and no payload beyond prose — were folded into their `/handoff`
and `/retro` commands, and the skills retired. A behavior earns a skill only
when it has a distinct trigger of its own or another skill must reach it;
these acts have neither, so their one true home is the command the human
types.

## Considered options

- Keep the command-shim-plus-skill pattern everywhere — rejected: a
  one-line command pointing at its own skill doubles the moving parts for
  content only the command uses.

## Consequences

- Nothing in the catalog calls `handoff` or `retro`; prose points at
  `/handoff` and `/retro` instead.
- The border between skill and command: a skill is reachable by agents and
  other skills; a command is only a human's entry point.
