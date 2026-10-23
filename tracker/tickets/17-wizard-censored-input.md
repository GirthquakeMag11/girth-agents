# 17: Secret input shows a mask, never the secret

**Parent:** specs/wizard-redesign.md

**Kind:** feature

**Blocked by:** None (can start immediately)

## What it delivers

Typing or pasting into a secret prompt shows one mask character per
character, so the user knows mid-entry whether the keys registered and the
paste arrived whole — a truncated paste shows as a short mask. Backspace
erases the last masked character; Enter submits. On a re-run the saved
value is still the Enter-keeps-it default, but its characters never
reappear: the prompt offers the default showing nothing beyond the value's
length as filled mask characters.

## Acceptance criteria

- [ ] One mask character echoes per keystroke and per pasted character.
- [ ] Backspace erases exactly one masked character; Enter submits.
- [ ] A re-run offers the saved default with a length-only mask hint,
      never its characters.
- [ ] The visible (non-secret) prompt is untouched.

- **Done — 2026-10-23:** `ask_secret` reads one character at a time and
  echoes a mask bullet per keystroke and per pasted character; backspace
  erases one; Enter submits. A re-run offers the saved default with a
  length-only mask hint (built in bash, since `tr` mangles the multibyte
  bullet outside a UTF-8 locale). Probed red→green on four canned-input
  cases: typed `abc` shows three bullets, an 11-char paste shows eleven
  and captures whole, `ab⌫c` captures `ac`, and a re-run keeps `xyz`
  without leaking a character. `ask` untouched. The harness ticket (20)
  formalizes these probes.
