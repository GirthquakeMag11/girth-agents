# 11: The interactive surface — menu, questions, Configuration

**Parent:** specs/installer-experience.md

**Kind:** feature

**Blocked by:** 09 (recorded policy makes Configuration real)

## What it delivers

Running the script without flags becomes an interactive menu: the
deeds — install, update, status, uninstall — beside a Configuration
submenu holding the two recorded questions, how items land and how
updates behave. A first install asks the questions it needs; later runs
re-open Configuration to change a recorded choice, the only way one
changes. With no terminal and a question unanswered, the run fails naming
the flag that would answer it.

## Acceptance criteria

- [ ] A scripted first install (piped stdin) asks mode then policy and records the answers.
- [ ] A later interactive run shows the recorded choices and can change them through Configuration.
- [ ] A no-terminal run with an unanswered question fails naming the needed flag; a flagged run proceeds.
- [ ] The copy flag and the policy flag answer their questions while pending and never silently re-record a prior answer.
- [ ] The harness drives the menu by piping canned answers; assertions stay green.
- [ ] Validator green.

- **Done — 2026-10-21:** a bare run in a terminal opens a menu — install,
  update, uninstall, and a Configuration submenu that shows the recorded
  choices and re-records changes; a bare scripted run fails asking for a
  verb and flags. A first interactive install asks mode (links
  recommended) then policy (mandatory); a scripted run with an unanswered
  policy fails naming --policy. The copy and policy flags re-answer their
  questions wherever passed; a scripted re-install with no flag carries
  the recorded policy. Harness now 99 green (four new pty-driven tests
  via `script`, plus the two failure cases). One spec sentence that
  overreached during review ("a flag never re-records a prior answer") is
  tightened to the honest rule. Validator green.
- **Follow-up — 2026-10-21:** the whole-feature review found Configuration
  could not actually re-shape mode; fixed — a chosen mode is honored (the
  carry only applies when nothing was chosen) and reconcile re-lays every
  item into the new mode, tested in both directions.