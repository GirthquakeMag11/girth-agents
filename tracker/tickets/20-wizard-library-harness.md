# 20: A harness proves the wizard's library behaviors

**Parent:** specs/wizard-redesign.md

**Kind:** feature

**Blocked by:** 17 (censored input), 18 (verification loop)

## What it delivers

A zero-framework harness, in the installer harness's spirit, pipes canned
answers through fixture wizards and asserts what a machine can see: the
mask echo — one mask character per keystroke and per pasted character,
erasure on backspace — the check helper's pass and fail paths with the
probe's own error text, the in-stage re-ask loop until pass or explicit
skip, the closing summary's skipped-and-failing list, and the run's exit
code staying true to failures. The static checks keep standing on the
template and on every generated wizard.

## Acceptance criteria

- [ ] The harness asserts every behavior named above, deterministically,
      with exit-code truth.
- [ ] A failing fixture check fails the harness run.
- [ ] The template passes bash -n; shellcheck runs clean where present.
