# Handoff: fresh-environment-pickup

**From:** girth-agents development, handed to a brand-new machine that has nothing installed yet.
**Skills for the pickup:** install first (below), then `tracking`, `specifying`, `implementing`, and the `/slice`, `/implement`, `/cut-release` doors.

## Context

- This repository is girth-agents — the published OpenCode catalog plus its development workspace: <https://github.com/GirthquakeMag11/girth-agents.git>.
- The current cut release is **v0.4.0** — tagged, pushed, and published on GitHub with its changelog notes.
- To set up on the new machine: `git clone https://github.com/GirthquakeMag11/girth-agents.git && cd girth-agents && ./scripts/install.sh`.
- The installer is interactive by default (a menu, plus Configuration). Run from inside this checkout with a terminal, or script it: `./scripts/install.sh install --copy --policy manual` answers its questions by flag.
- The install records `girth.yaml` in `~/.config/opencode/` (override with `OPENCODE_CONFIG_DIR`); `status` reports installed and latest release, and `update` follows the policy (manual / notify / auto).
- Start a fresh OpenCode session after installing — the catalog's skills and commands register only then.
- Development rules live in `AGENTS.md` (an agent's view) and `CONTRIBUTING.md` (skill design, publishing rules); both are enforced by the linter.
- The machine gates: `node scripts/validate.mjs` (zero dependencies) and `bash scripts/test-installer.sh` (a 127-assertion harness) — both must be green before committing.
- Rulings live in `conventions/` (versioning, chains) and `decisions/` (0001-0004); the shared language is `GLOSSARY.md`.
- The design trail: `specs/installer-experience.md` (approved, governs the installer), `specs/handoff-pickup.md` (approved, governs this very document's lifecycle), `specs/installer.md` (superseded where the newer one overlaps).
- The chain is spec → slice → implement; doors include `/bootstrap`, `/spec`, `/slice`, `/implement`, `/inbox`, `/questionnaire`, `/cut-release`, `/handoff`, `/pickup`.
- Everything planned is shipped: `tracker/tickets/` holds 15 closed tickets; the four answered questions in `tracker/QUESTIONS.md` are settled. Nothing is in flight.
- Two features wait in `tracker/FEATURES.md`: a curl bootstrap for one-command install, and an orchestrator agent for long-form divide-and-conquer work. No tickets are sliced for either.
- This document consumes as you act: strike a line the moment its work is done, and delete this file (committed) when nothing remains.
- You are reading this without the catalog installed, so you will not yet have `/pickup` — installing above is the whole first step.

## Open work

- [ ] Clone the repository and install the catalog with the command in Context, then start a new OpenCode session so the skills register.
- [ ] Run the validator and the test harness once to confirm the checkout is green on the new machine.
- [ ] Pick up development at the tracker's open items — the curl bootstrap and the orchestrator agent in `tracker/FEATURES.md` — or the work the user names first.
- [ ] For anything new and sizable, walk the chain: `/spec` an approved spec, `/slice` it into tickets, `/implement` the frontier.
- [ ] Leave this repository's own handoff home alone unless the user settles one: the default (committed `HANDOFF.md` at the root) applies until a `conventions/On_Handoffs.md` says otherwise.