# 06: Handoff write path — the skill's format, playbook, and sweep behind /handoff

**Parent:** specs/handoff-pickup.md

**Kind:** feature

**Blocked by:** None (can start immediately)

## What it delivers

The revived `handoff` skill, carrying the write side of the protocol: the
HANDOFF.md format (title, From, Skills for the pickup, one-consumable-unit-
per-line Context claims and Open work tasks), the staleness playbook (untrue
→ modified or excised; unimportant → replaced or excised), and the
write-and-sweep protocol. `/handoff` becomes the thin door over it: sweep an
existing HANDOFF.md for staleness, extend it with the new session's content,
and commit — obeying a project's On_Handoffs.md override, else the default
home of the repo-root document and the prescribed commit message.

## Acceptance criteria

- [ ] The skill exists; its description is word-for-word the spec's, under 300 characters.
- [ ] The write-and-sweep protocol is complete: home resolution (override first, repo-root HANDOFF.md default), the sweep (stale modified or excised, fresh kept), the write (title, From, Skills for the pickup, Context, Open work), redaction of secrets and personal data, and the commit protocol.
- [ ] `/handoff` is the thin door: description "Write this conversation into the project's handoff and commit it", body exactly the call to the skill's write-and-sweep protocol.
- [ ] Played in a scratch project: `/handoff` writes HANDOFF.md to the repo root and commits it as `docs(handoff): record <slug>`.
- [ ] Played again over a document holding a planted stale claim and a planted fresh claim: the stale one is modified or excised, the fresh one kept, the new content extended in — one commit, no struck-through lines left behind.
- [ ] Played in a scratch project whose On_Handoffs.md expresses another home, or no commit: the override is obeyed.
- [ ] Validator green; a fresh-context reviewer replays the write scenarios against the skill's text and reports.

- **Done — 2026-10-21:** the `handoff` skill landed with the format, the
  staleness playbook, and the write-and-sweep protocol; `/handoff` is the
  thin door over it. Replayed in scratch projects: in-repo write + one
  `docs(handoff): record <slug>` commit, sweep modifying a planted untrue
  claim and excising a planted unimportant one while keeping a fresh one,
  and an On_Handoffs.md override whose relocated, uncommitted home was
  obeyed. Fresh-context reviewer passed all seven criteria; its two polish
  flags (the slug defined, the no-commit escape hatch restated) are fixed.
  Validator green.