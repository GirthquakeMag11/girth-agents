# 22: The scenario gate passes

**Parent:** specs/wizard-redesign.md

**Kind:** feature

**Blocked by:** 16 (trigger), 17 (censored input), 18 (verification loop),
19 (launch protocol)

## What it delivers

The redesign's truth test: the scenario list is run across fresh sessions
and models, and the wizard fires at each secret-needed moment — the sudo
install, the auth prompt, the registry token, the CI secret, the
dashboard procedure — instead of the agent handing back instructions.
Each launch follows the offer and the explicit yes; the censored input
shows the mask mid-entry; a wrong value is caught by its check and
re-asked in place. Results are recorded here; failures are fixed or
tracked. The spec is not done until this passes.

## Acceptance criteria

- [ ] Every scenario fires the wizard; no scenario ends in "run these
      commands yourself."
- [ ] Every launch waited for an explicit yes.
- [ ] Mask and re-ask behaviors observed correct in real runs.
- [ ] Results recorded; any failure fixed or tracked.
