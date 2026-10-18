---
name: Maintaining Docs
description: Write and keep current the project's three standard documents, each for a different reader: AGENTS.md so a new agent can immediately orient itself in the project; CONTRIBUTING.md so a new agent understands the protocols for adding to or modifying the project content; README.md so a new human gets up to speed with the project and the state it is in. Upkeep of the glossary and changelog belongs to the sister skills maintaining-glossary and maintaining-changelog.
---

# Maintaining Docs

Three standard documents, three readers, three jobs:

- **AGENTS.md** — read by a new agent; it must be able to orient itself in
  the project immediately.
- **CONTRIBUTING.md** — read by a new agent; it must convey the protocols
  for adding to or modifying the project content.
- **README.md** — read by a new human; they must get up to speed with the
  project and the state that it is in.

## AGENTS.md — orientation for a new agent

Write it so an agent arriving with zero context can orient immediately.
After reading AGENTS.md alone, the agent should know:

- What the project is and what it is for.
- How to build, run, and test it — the exact commands.
- Where things live — the layout it will actually navigate.
- What standards bind it — pointers to `conventions/`, the glossary, the
  trackers, and where each sits.

Structure to match: a project overview, the commands, the repository
layout, and the pointers. Do not duplicate what the pointed-to pieces say;
point and let them speak. When the layout, the commands, or the standards
change, AGENTS.md changes with them — an agent that trusts a stale
orientation pays for the lie later.

## CONTRIBUTING.md — protocols for a new agent

Write it so a new agent understands how content is added to or changed in
the project:

- How to prepare the environment and verify a change — build, test, lint.
- Where the standards bind (`conventions/`) and what the tracker protocols
  are: where the trackers live and which situations go where, per the
  tracking skills.
- Changelog discipline: point at CHANGELOG.md; its upkeep belongs to
  maintaining-changelog.
- How to propose and land a change.

Update it whenever a protocol changes — commands, conventions, the tracker
flow (for example when a new tracker file appears).

## README.md — the project and its state, for a new human

Write it so a new human gets up to speed with the project **and the state
it is in**:

- What the project is and does — one honest paragraph.
- How to get started — the install/run/use paths that work today.
- The current state — development stage, what works, what is in flight,
  what is not there yet. Keep this truthful, not aspirational.
- Where to go next — documentation, CONTRIBUTING.md, CHANGELOG.md for what
  changed, the features tracker for where the project is heading.

When the project's state changes materially, the README changes with it. A
README that drifts into claiming what is no longer true steers people
wrong.

## Keeping the three current

Drift is the failure mode. Re-read and correct the relevant document
whenever its subject changes: structure or commands change → AGENTS.md;
protocols change → CONTRIBUTING.md; state changes → README.md. After
changing any scaffold piece, check whether the three documents still
describe it truly.

## Out of scope — the sister skills

- GLOSSARY.md — owned by maintaining-glossary.
- CHANGELOG.md — owned by maintaining-changelog.

When the three documents touch the glossary or the changelog, reference
those files and let their skills govern; do not define their upkeep here.

## The files

All three live at the project root. If one is missing, load the
bootstrapping skill and follow that piece's section to create the
skeleton, then bring it up to the standard above.

## Related skills

- bootstrapping — creates the files when they are missing.
- maintaining-glossary, maintaining-changelog — the sister skills this one
  outsources to.
- conventions, tracking — the scaffold these documents point at.