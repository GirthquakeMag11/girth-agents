# 07: Handoff pickup path — the consumption protocol behind /pickup

**Parent:** specs/handoff-pickup.md

**Kind:** feature

**Blocked by:** 06 (the skill it extends)

## What it delivers

The pickup half of the protocol in the `handoff` skill, and the new
`/pickup` door over it. The pickup agent is the context consumer of
whatever its work renders stale and excises those units the moment it
happens; a partially consumed unit is rewritten in place to hold only its
untouched, fresh parts; when nothing un-consumed remains, the document is
deleted. A bare freshness check runs the same playbook.

## Acceptance criteria

- [ ] The consumption protocol is complete: consumer semantics, immediate surgical excision riding the same commit as the consuming work, never struck-through-and-left, partially consumed units rewritten to their untouched fresh parts, deletion at full consumption, and the freshness check as the third trigger.
- [ ] `/pickup` exists: description "Resume this project's handoff", body exactly the call to the skill's pickup protocol.
- [ ] Scripted lifecycle replay in a scratch project: write → pickup works → a unit consumed mid-work is excised in the same commit as the work that consumed it → a partly-done task is rewritten in place, its untouched parts kept → all units consumed, HANDOFF.md deleted in the final commit.
- [ ] No handoff document is present: `/pickup` reports there is nothing to pick up and stops.
- [ ] Validator green; a fresh-context reviewer replays the lifecycle against the skill's text and reports.

- **Done — 2026-10-21:** the pickup protocol landed in the skill —
  consumer semantics, excise-in-the-consuming-commit, partial-consumption
  rewrite in place, deletion at full consumption, and the freshness check
  as the named third trigger — and `/pickup` is the thin door over it.
  Replayed the full lifecycle in a scratch project: write, sweep-and-extend,
  consumption rides the work commits, a partial rewrite lands as a one-line
  in-place edit, and the document is deleted in the final commit.
  Fresh-context reviewer accepted all five criteria; its one wording gap
  (still-fresh claims at deletion) is closed in the skill. Validator green.
- **Done — 2026-10-27:** retired without work — the parent spec was retired by the plugin transition.
