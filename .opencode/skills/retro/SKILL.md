---
name: Retro
description: Review a session and propose improvements to the agent's environment — navigation, automated checks, standards, steering files, tool economy, information access — each routed to its home. Use after a session, especially one that went sideways.
metadata:
  girth/role: activity
---

# Retro

A look back at a session to improve the **environment** the agent works in,
not the code. Read the session's primary sources first — commits, tracker
entries, conventions written, the work itself — before proposing anything.

## The categories

- **Navigation.** Did finding the right file or fact take long? A navigation
  pointer would have shortened next time.
- **Automated checks.** Could a check have caught the mistake — lint, types,
  tests? Read the project's own check command first: an existing check
  sitting unwired is the finding, not a reinvention. A repo with **no
  guardrail at all** — no hook and no CI running its checks — is itself a
  finding.
- **Standards.** Should a rule be recorded, removed, or clarified? Classify
  first: mechanical → a check; judgment call → a convention.
- **Steering files.** Is AGENTS.md bloated, or carrying no-op instructions
  that do not change behavior? Name what to cut or move.
- **Tool economy.** Expensive tool calls that a script or command could
  shorten; custom tooling that is token-inefficient.
- **Information access.** What the agent needed and could not reach — logs,
  a repo or account, a service.

## Present, then apply

Present the candidates in severity order, each with a recommendation. Apply
only what the user approves:

- A **navigation pointer**, or a steering-file cut: call the skill tool with
  `docs` and write it per that owner.
- A **standard**: call the skill tool with `codifying` — a judgment call
  becomes a convention; a mechanical one becomes a convention *and* the
  offer of its automated check.
- **Tool economy** and **information access** are recommendations to the
  user — environment changes beyond the scaffold, so nothing is written.

## Related skills

- codifying — where standards accrue as rulings.
- docs — where navigation pointers and steering-file pruning land.