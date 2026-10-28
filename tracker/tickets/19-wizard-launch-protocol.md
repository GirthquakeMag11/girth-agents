# 19: The skill offers to launch, and waits for a yes

**Parent:** specs/wizard-redesign.md

**Kind:** feature

**Blocked by:** None (can start immediately)

## What it delivers

After authoring and statically checking the wizard, the agent offers to
launch it in a new terminal and waits for an explicit yes — every time,
with no standing permission and no silent launch. On the yes it opens the
terminal with the wizard running and stays through the run; if no terminal
can be opened it prints the exact one-line command for the user's own
terminal. The launch mechanics live in a reference of the wizard skill:
the per-platform commands that open a fresh terminal, from the same family
as the library's URL opener, plus the single degradation sentence. The
process also gains the self-containment proofread: walk the finished
wizard as a user who has only the terminal, and write into the wizard any
instruction still living only in the chat — the launch offer stays a
summary, never a duplicate step.

## Acceptance criteria

- [ ] The process reads: author → static checks → proofread → offer to
      launch; the offer is one line and waits for an explicit yes every
      time.
- [ ] The launch reference lists the per-platform terminal-open commands
      and the degradation sentence.
- [ ] The proofread step forbids any required instruction living only in
      the chat.
- [ ] Validator green.

- **Done — 2026-10-23:** the process now reads author → static checks →
  proofread → offer to launch; the offer is one line and waits for an
  explicit yes every time, with no standing permission. The launch
  reference lists the per-platform terminal-open commands (GNOME, KDE,
  any-desktop, macOS, Windows, WSL) with a read-pause so the closing
  summary stays on screen, plus the degradation sentence — no terminal
  openable → print the one-line command, never run the interactive
  wizard inside the chat session. Red→green through the linter's
  dead-path rule: referencing the launch file before creating it failed
  validation, and landing it turned the run green.

- **Done — 2026-10-27:** retired without work — the parent spec was retired by the plugin transition.
