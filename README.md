# girth-agents

A catalog of [OpenCode V2](https://opencode.ai) agents, skills, and slash
commands — written in plain Markdown, developed *in* this repository, and
installed into `~/.config/opencode/` with one script.

## Install

Point OpenCode at this repository and it loads the plugin — the engine,
its helpers, and the management scaffold it maintains:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [{"package": "github:GirthquakeMag11/girth-agents", "options": {}}]
}
```

Updates reach installs through `opencode plugin update`. Releases are
tags on this repository, each with a GitHub Release page carrying the
changelog section.

The catalog also loads directly as working skills for its maintainers —
a checkout on the `skills` path in `opencode.json(c)` or the builder
script in `scripts/install.sh` (see CONTRIBUTING); that path is
maintainer tooling, not the user's channel.

## Catalog

### Agents

| Agent                              | Use it when |
| ---------------------------------- | ----------- |
| 🚧 — first agents land here shortly |             |

### Skills

The skills manage a **project scaffold**: a set of files in your project's
repository that act as its memory across sessions and agents.

Each skill is one thing the agent does, reached on its own when the
situation fits. Where that thing owns a scaffold piece — `tracker/`,
`GLOSSARY.md`, and the four standard documents — `AGENTS.md`,
`CONTRIBUTING.md`, `README.md`, `CHANGELOG.md` — the skill carries the
piece's format in its `references/` and names the piece in its
description.

| Skill                | Use it when                                                                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrapping`      | Creating the scaffold, whole or one missing piece; re-running repairs only the gaps it finds and reports when there is nothing to do                                                                  |
| `tracking`           | The tracker: something comes up that cannot be dealt with now but must not be lost — classify it, decide now-or-record, and write it in the tracker's format; or picking up or closing a tracked item |
| `domain-modeling`    | A term is doing two jobs or drifting, or project language needs settling — the agent challenges it and has it recorded; owns GLOSSARY.md, its terms and format                                        |
| `codifying`          | You say what a thing means, how something is done, or why the project takes a shape — the agent records it in conventions/ or decisions/ (or the glossary, via domain-modeling)                       |
| `curate-inbox`       | Open the inbox — collect tracker items and stray calls for attention, process each with the user, record answers, route the work they reveal                                                          |
| `find-skills`        | "How do I do X" where an installable skill might already exist — search skills.sh and the Skills CLI, verify quality, present options, install                                                        |
| `maintaining-docs`   | The project's structure, protocols, or state change; after any user-visible change; or for a release via `/cut-release` — keeps AGENTS.md, CONTRIBUTING.md, README.md, CHANGELOG.md true              |
| `specifying`         | A settled design needs writing down as a spec — the agent writes it, grills its gaps, submits it to an independent fresh-context check, and puts the approval options to you: commit, commit and slice, or stop and amend |
| `implementing`       | You ask to build something planned — a spec, bug, or defect — and the agent slices it into tickets and works them one at a time; a feature implements through its spec                                |
| `wayfinding`         | An effort is too big or too foggy to spec — the agent charts a plans/ map and resolves its decisions one at a time                                                                                    |
| `prototyping`        | A design question needs making concrete — the agent builds throwaway code that answers it and captures the verdict                                                                                    |
| `wizard`             | A command needs a password, token, or other secret, or a step is mine alone to do — the agent fires immediately, generates a wizard that masks my keystrokes and checks every value, and offers to run it in a new terminal, waiting for my yes every time |
| `grilling`           | A decision or plan needs working through with you — the agent walks the design tree one round of questions at a time                                                                                  |
| `writing-for-agents` | Writing a skill or an agent-facing document — the craft of pointers, disclosure, leading words, and pruning                                                                                           |
| `questionnaire`      | A decision depends on someone outside the conversation — the agent writes a questionnaire aimed at exactly what you need back                                                                         |
| `diagnosing-bugs`    | Something is broken and the cause is not obvious                                                                                                                                                      |
| `tdd`                | Work that should be built or locked down test-first                                                                                                                                                   |
| `code-review`        | A branch, PR, or work-in-progress change needs reviewing                                                                                                                                              |
| `codebase-design`    | A module's interface, seam, or depth is being designed or judged                                                                                                                                      |
| `research`           | A question needs facts from primary sources                                                                                                                                                           |
| `handoff`           | A session hands its work across the gap to the next, or a fresh one picks it up — the hand-off writes HANDOFF.md, the pickup consumes it to nothing and deletes it; deferring work is the tracker's job, not the handoff's                                  |

### Commands

| Command          | What it does                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/bootstrap`     | Runs a full bootstrap: explores what exists, asks one round of questions for the gaps it found, creates missing pieces and repairs gaps, and reports when there is nothing to do        |
| `/spec`          | Turns the current conversation into a spec for your approval                                                                                                                            |
| `/slice`         | Slices an approved spec — or an oversized bug or defect — into tickets, presented for your approval before `/implement` works them                                                      |
| `/cut-release`   | Cuts a release: versions the `[Unreleased]` queue into a dated section, tags it, and publishes the GitHub Release — on your confirmation                                                                 |
| `/inbox`         | Opens your inbox — collects everything calling for attention and processes it with you one item at a time                                                                               |
| `/close-inbox`   | Closes the open inbox — wraps up, records the remainder, offers to begin the surfaced work                                                                                              |
| `/implement`     | Works the ticket frontier — one ticket at a time, each by its Kind                                                                                                                      |
| `/wayfind`       | Charts a big, foggy effort as a live map and works its decisions until the way forward is clear                                                                                         |
| `/retro`         | Reviews a session and proposes environment improvements, most severe first                                                                                                              |
| `/handoff`      | Writes this conversation into the project's handoff and commits it — updating an existing one, never a sibling, stale context swept first                                              |
| `/pickup`       | Resumes this project's handoff — works and consumes it as it goes stale, deletes it when nothing remains                                                                          |
| `/wait-what`     | Re-pitches the last message that didn't land, in plain English using the glossary's terms                                                                                               |
| `/questionnaire` | Writes a questionnaire for the person who holds the knowledge a decision is blocked on                                                                                                  |
| `/wizard`        | Generates a wizard for a secret or a hands-on procedure, then offers to run it in a new terminal, waiting for my yes                                                                        |

## How the skills hang together

A map of the work, not a state machine: no path here is required, and no
line forbids a move — every skill fires when its trigger matches, wherever
the agent stands. Three kinds of node: `/doors` are commands, the only
things you type; *skills* are machinery that fires on its trigger;
**records** are homes things land in (marked ✓) and later steps consume.
Edges read `→` *typically leads to*, `·` *choose by situation*, `⇄`
*repeat until done*. From any step, the four recovery rails stay open:
**record** the stray (`tracking`), **settle** the meaning (`codifying`),
**surface** open items (`/inbox`), **re-check** the scaffold
(`/bootstrap`).

### Driving the catalog

The state you're in picks the door; everything between doors is
machinery.

| The state you're in                              | What you run     | What happens next                                                        |
| ------------------------------------------------ | ---------------- | ------------------------------------------------------------------------ |
| The repo is bare, or a scaffold piece is missing | `/bootstrap`     | The skeleton is built; gaps found are put to you for approval            |
| The idea is foggy, too big to spec               | `/wayfind`       | A live map; its key questions are put to you, one at a time              |
| A decision is blocked on an outside person       | `/questionnaire` | A questionnaire for the person who holds the knowledge                   |
| The design has settled                           | `/spec`          | The conversation becomes a spec for your approval                        |
| A spec sits approved                             | `/slice`         | It becomes tickets, checkpointed for your approval                       |
| Open tickets await work                          | `/implement`     | The frontier, one ticket at a time, each by its Kind                     |
| Open items and questions pile up                 | `/inbox`         | One at a time; answers recorded; `/close-inbox` offers the surfaced work |
| The changelog queue should ship                  | `/cut-release`   | A dated, tagged version, on your confirmation                            |
| The session is ending with work in flight        | `/handoff`       | A HANDOFF.md carrying the session's continuation, committed              |
| A handoff awaits a fresh session                 | `/pickup`        | The work resumes; the document is worked, consumed, and deleted when nothing remains |

### How the work flows

```
                       initial idea
        ┌────────────────┬─────────────────────────┬─────────────────────────┐
        │ proof needed   │ facts needed            │ foggy, too big to spec  │
        │ prototyping    │ research                │ /wayfind                │
        │                │                         │                         │
        │                │ ↘                       │ · wayfinding            │
        │                │ cited doc ✓             │ · grilling              │
        │                │                         │ · /questionnaire        │
        │                │                         │                         │
        └────────────────┴─────────────────────────┴─────────────────────────┘
                        ▼
                 the design settles
                 /spec ↘ spec ✓, approved by you
                        │
                 /slice ↘ tickets ✓, approved
                        │
                   /implement
                        │
                 implementing — one ticket at a time
                        │
   the execution cycle ⇄ per ticket — tdd · code-review · codebase-design ·
   diagnosing-bugs, until the ticket closes
                        │
                maintaining-docs ──► /cut-release ↘ release
```

The four branches are four ways to reach one door: have the design
settled, or settle it through proof, facts, or walking the fog. A record
the work makes now — the cited document, the approved spec — is what a
later step consumes.

**The rails that run beside every step:**

- **Records** — `codifying` (rulings → conventions/), `domain-modeling`
  (terms → glossary), and decisions (the load-bearing whys). They fire
  mid-chain, the moment a meaning settles.
- **Attention** — `tracking` when anything comes up (act now, or record it
  by kind) → `/inbox` → `curate-inbox` (one item at a time; answers
  recorded; revealed work routed, never started) → `/close-inbox` →
  implementing.
- **Truth** — `maintaining-docs` after every user-visible change;
  `/cut-release` when the queue should ship.

**Off the spine** — `find-skills` when a capability is missing (search the
open ecosystem, verify quality, install).

**The working loop — idea to project to product:** `/bootstrap` once to
build the skeleton (glossary, conventions, decisions, plans, specs,
tracker, docs, changelog), and again whenever a piece is
missing.

```
new thing surfaces
│
└─ tracking ────── act now, or record it by kind
     │
     └─ questions pile up → /inbox → curate-inbox
            │
            ├── ruled terms, conventions → codifying
            ├── revealed work → routed via tracking, never started in the loop
            └─ /implement ── tickets by kind, worked with tdd, code-review,
                   │          codebase-design, diagnosing-bugs
                   └─ maintaining-docs ── everything stays true
                          └─ /cut-release ── the queue ships, dated and tagged
```

Then the loop turns again.

## Contributing

- `CONTRIBUTING.md` — how to add agents, skills, and commands; the
  publishing rules; the tooling.
- `AGENTS.md` — the same rules, written for an OpenCode agent working on this
  repo.
- `scripts/validate.mjs` — the linter that enforces the rules
  (`node scripts/validate.mjs`).

## License

MIT — see [LICENSE](LICENSE). Material adapted from other repositories is
accounted for in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
