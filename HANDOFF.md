# Handoff: fresh-environment-pickup

**From:** machine set up and checkout verified green; the two tracker features remain.
**Skills for the pickup:** specifying, implementing — wayfinding if a feature proves too foggy to spec.

## Context

- This repository is girth-agents — the published OpenCode catalog plus its development workspace: <https://github.com/GirthquakeMag11/girth-agents.git>.
- The current cut release is **v0.4.0** — tagged, pushed, and published on GitHub with its changelog notes.
- The catalog is installed and the checkout is green on the new machine: validator 0 errors, installer harness 127/127.
- Development rules live in `AGENTS.md` (an agent's view) and `CONTRIBUTING.md` (skill design, publishing rules); both are enforced by the linter.
- The gates: `node scripts/validate.mjs` (zero dependencies) and `bash scripts/test-installer.sh` (127 assertions) — both green before committing.
- Rulings live in `conventions/` (versioning, chains) and `decisions/` (0001-0004); the shared language is `GLOSSARY.md`.
- The design trail: `specs/installer-experience.md` (governs the installer), `specs/handoff-pickup.md` (governs this document's own lifecycle), `specs/installer.md` (older, superseded where they overlap).
- Work flows spec → slice → implement.
- Everything planned is shipped: `tracker/tickets/` holds 15 closed tickets; `tracker/QUESTIONS.md` is settled. In flight: the wizard redesign — `specs/wizard-redesign.md` is approved and awaits slicing.
- Two features wait in `tracker/FEATURES.md`: a curl bootstrap for one-command install, and an orchestrator agent for divide-and-conquer long-form work. No tickets are sliced for either.
- This document consumes as you act: strike a line the moment its work is done, and delete the file (committed) when nothing remains.

## Open work

- [ ] Implement the wizard redesign frontier — tickets 16–22 under `tracker/tickets/`.
- [ ] Pick up development at the open tracker items — the curl bootstrap and the orchestrator agent in `tracker/FEATURES.md` — or the work the user names first.
- [ ] Leave this repository's own handoff home alone unless the user settles one: a committed `HANDOFF.md` at the root applies until a `conventions/On_Handoffs.md` says otherwise.