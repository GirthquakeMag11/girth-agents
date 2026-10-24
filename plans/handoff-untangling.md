# Untangling the handoff from the tracker

**Status:** done

## Destination

The catalog states one coherent account of the handoff — a free-form
catch-all carrying a session's own continuation across a gap, born only
when the user runs `/handoff`, consumed and deleted by `/pickup`, never a
standing second record of open work — and the tracker alone defers work;
the skill, its mirrors, and the surrounding docs are edited to say exactly
that. Reached: the rulings are recorded (`decisions/0005`), the map is
done, and the edits follow `decisions/0005` as their governing record.

## Notes

- The effort began with the user questioning an observed behavior: the
  agent's rolling maintenance of `HANDOFF.md` while working. Grilling
  sharpened it into the trilemma — a system-induced problem, a misread
  solution, or dead instructions — and the verdict, confirmed by the user,
  was the first: the then-governing spec (`specs/handoff-pickup.md`)
  instructed extend-in-place, sweep-on-every-read, and a freshness-check
  trigger with no junction rule, so the system provoked its own problem.
- Skills consulted: grilling (the interview), codifying (the ruling
  record). The implementation instruments are the repo's normal ones:
  direct edits to the catalog files, the validator, per-change commits,
  and the changelog.
- Standing preference recorded during the effort: rulings then direct
  edits — a second governing spec was considered and rejected.

## Decisions so far

- Verdict: the rolling handoff was a system-induced problem, not agent
  error — confirmed by the user; recorded in `decisions/0005`.
- The junction, by kind: the tracker defers work; the handoff continues a
  session; pickup never deposits cargo into the tracker; tracked work is
  referenced, not copied; a handoff item that proves to be deferral takes
  the ordinary decide-now-or-record call — `decisions/0005`.
- The lifecycle: a handoff comes into being when the user runs `/handoff`
  and may stay until it is consumed — `decisions/0005`.
- Staleness is door-bounded: the playbook runs inside `/handoff`'s
  sweep-and-extend over an existing document and `/pickup`'s consumption;
  no third, opportunistic trigger — `decisions/0005`.
- The fix's shape: rulings then direct edits, no redesign spec —
  `decisions/0005`, Considered options.
- This repo's own leftover `HANDOFF.md`: consume and delete it now; the
  next one is written when the user next runs `/handoff` — settled in
  session, action logged in that commit.

## Not yet specified

- None — no decision remains open; what is left is doing the edits.

## Out of scope

- A second governing spec re-orienting `specs/handoff-pickup.md`.
- Retiring or re-naming `/handoff` or `/pickup`.
- Changing the `On_Handoffs.md` override mechanics (home and
  committed-ness stay a project's to express).
- Multi-machine or cross-project routing; the pickup stays human-triggered.