# Wizard redesign — trigger, launch, censored input, verification

**Status:** charting

## Destination

An approved `specs/wizard-redesign.md` redesigning the wizard skill end to
end — a trigger that reliably fires, an offer-then-launch protocol,
censored secret input, self-contained instructions, and built-in
verification — touching the skill body, `references/template.sh`, a launch
reference, the `/wizard` command, and the README rows. The approved spec
then slices and implements, as installer-experience was done.

## Notes

- The failure evidence: 0 triggers over repeated scenario tests. At the
  moment a command needs a secret — a sudo password, an auth prompt — the
  agent defers (instructions to run things themselves) instead of firing
  the skill; afterwards it neither offers to launch the wizard in a new
  terminal (the desired middle ground) nor consistently asks, and some
  launched unasked. (User brief, 2026-10-22.)
- Trigger mechanics, researched: OpenCode lists available skills to the
  model every step — ID, name, description, alphabetically, untrimmed.
  Firing is the model matching the situation to that description; there is
  no guaranteed-fire mechanism. The current description matches only after
  the agent has already decided to ask, and lacks the moment's anchor words
  (sudo, password, token, credential). See the settled trigger decision.
- The user's hard requirements: secret input censored, not invisible —
  keystrokes must be visible so a mistyped or truncated paste is caught in
  the moment; every instruction and clarification lives inside the wizard,
  not the chat; a run knows itself — what failed and why — without
  edit-and-relaunch loops.
- Sunk costs this map reuses: the template.sh wizard library, the `/wizard`
  command, the catalog's 300-character description rule, and the
  installer-experience map/spec shape as precedent.
- The bash-script form is settled (the user speaks of editing and
  relaunching the wizard); the fights are over the skill's trigger, its
  protocol, and the library's UX.

## Decisions so far

- Destination: an approved spec for the full redesign, then slice →
  implement. (2026-10-22 — QUESTIONS "Wizard redesign — destination and
  scope")
- Launch: after authoring and static checks, the agent offers to launch
  the wizard in a new terminal and waits for an explicit yes — every time.
  (2026-10-22 — QUESTIONS "Wizard launch protocol — offer then wait")
- Verification: every captured secret or value — and every step that can
  fail — carries a check the wizard runs itself; cheapest meaningful
  probe, format check at minimum, live probe where possible. (2026-10-22 —
  QUESTIONS "Wizard verification — every value carries a check")
- Failure: a failed check re-asks in the same stage and re-checks, looping
  until the value passes or the user explicitly skips; the closing summary
  lists skipped or still-failing items with the exact error. (2026-10-22 —
  QUESTIONS "Wizard failure handling — in-stage retry loop")
- Trigger: description rewritten trigger-first with the situation's anchor
  words, the generate-a-wizard framing last; a concrete scenario list joins
  the skill's Trigger section; validated against the user's scenario tests.
  (2026-10-22 — QUESTIONS "Wizard trigger — description-first rewrite")
- Headless: ruled out of scope — see below. (2026-10-22 — QUESTIONS
  "Headless wizard runs")

## Not yet specified

- The exact trigger description string — drafted in the spec from the
  settled decision and the catalog's 300-character rule.
- The censored-input mechanism in `references/template.sh` (visible mask,
  per keystroke).
- The check-helper interface — how a stage declares its probe and the
  library reports ✓/✗ with the command's own error.
- The cross-platform launch table (terminal-open commands) as a skill
  reference.
- The scenario list's contents — drawn from the user's real tests (sudo
  installs, auth prompts, registry tokens, CI secrets).
- Which probe fits which secret kind.

## Out of scope

- A designed headless/remote branch: the user's sessions always have a
  terminal to open. The launch reference degrades by printing the one-line
  command when opening a terminal fails.