# 21: The /wizard door, the README rows, and the changelog follow

**Parent:** specs/wizard-redesign.md

**Kind:** feature

**Blocked by:** 16 (trigger), 19 (launch protocol)

## What it delivers

The /wizard command's text points at the reworked process — author,
static-check, proofread, offer to launch — with no stale phrasing left
over from the old behavior. The README's skill row says what the rebuilt
trigger and the offer-then-launch protocol do, and its command row says
the same for the door. The changelog's Unreleased queue records the
rework as user-visible changes, beside the /wizard entry already queued.

## Acceptance criteria

- [ ] The /wizard command matches the reworked process, no stale
      phrasing.
- [ ] Both README rows describe the new trigger and the offer-then-launch
      protocol.
- [ ] The changelog's Unreleased section carries the Changed entries.
- [ ] Validator green.

- **Done — 2026-10-23:** the /wizard command now spells the reworked
  process (scope, author, statically check, proofread for
  self-containment, offer to launch and wait for the yes); the README's
  skill row names the trigger, the mask, the per-value checks, and the
  every-time yes, and its /wizard row names the same path; the
  changelog's Unreleased section now leads with the redesign as the
  wizard's Changed entry beside the /wizard Add. Validator green.
