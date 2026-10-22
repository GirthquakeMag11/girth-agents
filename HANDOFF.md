# Handoff: fresh-environment-pickup

**From:** girth-agents development, handed to a brand-new machine that has nothing installed yet.
**Skills for the pickup:** none needed to start — read everything below as plain files; the catalog's skills matter only after it is installed.

## Context

- This repository is girth-agents — the published OpenCode catalog plus its development workspace: <https://github.com/GirthquakeMag11/girth-agents.git>.
- The current cut release is **v0.4.0** — tagged, pushed, and published on GitHub with its changelog notes.
- Read directly, as files — no command, no skill tool. A first pickup is a standing exception: open the documents named here and work from them.
- To set up the machine: `git clone https://github.com/GirthquakeMag11/girth-agents.git && cd girth-agents && ./scripts/install.sh` — interactive by default, or script it: `./scripts/install.sh install --copy --policy manual`.
- The install records `girth.yaml` in `~/.config/opencode/` (override with `OPENCODE_CONFIG_DIR`); `status` reports installed vs latest, and `update` follows the policy (manual / notify / auto).
- Start a fresh OpenCode session after installing — the catalog registers only then; nothing about continuing depends on it, since every document stays readable as a file.
- The pickup spans two sessions: the first installs and ends at the restart; the second continues wherever the remaining lines point, still reading files.
- Development rules live in `AGENTS.md` (an agent's view) and `CONTRIBUTING.md` (skill design, publishing rules); both are enforced by the linter.
- The gates: `node scripts/validate.mjs` (zero dependencies) and `bash scripts/test-installer.sh` (127 assertions) — both green before committing.
- Rulings live in `conventions/` (versioning, chains) and `decisions/` (0001-0004); the shared language is `GLOSSARY.md`.
- The design trail: `specs/installer-experience.md` (governs the installer), `specs/handoff-pickup.md` (governs this document's own lifecycle), `specs/installer.md` (older, superseded where they overlap).
- Work flows spec → slice → implement once the catalog is installed; before then, read the spec documents directly and proceed in their spirit.
- Everything planned is shipped: `tracker/tickets/` holds 15 closed tickets; `tracker/QUESTIONS.md` is settled; nothing is in flight.
- Two features wait in `tracker/FEATURES.md`: a curl bootstrap for one-command install, and an orchestrator agent for divide-and-conquer long-form work. No tickets are sliced for either.
- This document consumes as you act: strike a line the moment its work is done, and delete the file (committed) when nothing remains.

## Open work

- [ ] Clone the repository and install the catalog with the command in Context, then start a new OpenCode session.
- [ ] Run the validator and the test harness once to confirm the checkout is green on the new machine.
- [ ] Pick up development at the open tracker items — the curl bootstrap and the orchestrator agent in `tracker/FEATURES.md` — or the work the user names first.
- [ ] Leave this repository's own handoff home alone unless the user settles one: a committed `HANDOFF.md` at the root applies until a `conventions/On_Handoffs.md` says otherwise.