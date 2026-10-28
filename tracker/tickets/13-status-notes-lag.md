# 13: status, the notes, and the quiet notify lag

**Parent:** specs/installer-experience.md

**Kind:** feature

**Blocked by:** 09, 12 (reads the policy and coexists with policy updates)

## What it delivers

The fourth verb. `status` reports the installed release, the latest cut
release, the chosen policy, and the gap, without mutating anything.
`status --notes` — and the same view from the interactive menu — shows
the changelog sections between the two releases; update's output after a
sync does too. Under the notify policy, every verb run reports the lag
cheaply and stays silent when the network is unreachable.

## Acceptance criteria

- [ ] `status` prints the four facts from the record and the remote, and mutates nothing.
- [ ] `status --notes` prints the changelog sections between installed and latest.
- [ ] Under notify, install, update, status, and uninstall report the lag; manual and auto do not nag.
- [ ] An unreachable remote makes the run proceed silently on release matters.
- [ ] Harness asserts status output and the notify lag; stays green.
- [ ] Validator green.

- **Done — 2026-10-21:** the fourth verb landed — `status` reports
  installed release, latest cut release, policy, and the gap, mutating
  nothing; `status --notes` (and update after a sync onto a tag) prints
  the changelog section between the releases. Under notify, install and
  uninstall also report a lagging release, quiet when the network is
  unreachable. Harness: 117 green (status, notes, and notify-on-install
  driven against fixture remotes and tags). Validator green.
- **Follow-up — 2026-10-21:** the whole-feature review found the menu
  offered no notes and the notes printed only one section; fixed — the
  menu gains an `n. notes` deed, and notes print every section between the
  installed and latest release.
- **Done — 2026-10-27:** retired without work — the parent spec was retired by the plugin transition.
