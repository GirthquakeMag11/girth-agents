# girth-agents

A catalog of [OpenCode V2](https://opencode.ai) agents, skills, and slash
commands — written in plain Markdown, developed *in* this repository, and
installed into `~/.config/opencode/` with one script.

## Install

```sh
git clone https://github.com/GirthquakeMag11/girth-agents.git
cd girth-agents
./scripts/install.sh
```

The script symlinks each item into your OpenCode global config:

| Artifact | Source                    | Installed to                      |
| -------- | ------------------------- | --------------------------------- |
| Agents   | `.opencode/agents/*.md`   | `~/.config/opencode/agents/`      |
| Skills   | `.opencode/skills/<id>/`  | `~/.config/opencode/skills/<id>/` |
| Commands | `.opencode/commands/*.md` | `~/.config/opencode/commands/`    |

Because the items are symlinks, `git pull` updates everything in place.
Start a new OpenCode session and the catalog is live.

<details>
<summary>Alternatives and uninstalling</summary>

- **No symlinks (Windows, unusual filesystems):** `./scripts/install.sh --copy`
  copies instead — re-run it after updates.
- **Skills only, via config:** skip the installer and point the `skills` array
  at this checkout in your global `opencode.json(c)`:

  ```jsonc
  "skills": ["/path/to/girth-agents/.opencode/skills"]
  ```

- **Uninstall:**

  ```sh
  find ~/.config/opencode -type l -lname '*girth-agents*' -delete
  ```

  (For copies, delete the files you copied.)
</details>

## Catalog

### Agents

| Agent                              | Use it when |
| ---------------------------------- | ----------- |
| 🚧 — first agents land here shortly |             |

### Skills

The skills manage a **project scaffold**: a set of files in your project's
repository that act as its memory across sessions and agents.

There are two kinds of skill. **Owners** each define one scaffold piece:
what belongs in it and its format. **Activities** are what the agent does
with the pieces; they own none. The agent reaches for each on its own when
the situation fits.

| Owner         | Defines                                                                               |
| ------------- | ------------------------------------------------------------------------------------- |
| `glossary`    | `GLOSSARY.md` — the shared language: what things are                                  |
| `conventions` | `conventions/On_<Domain>.md` — your rulings on how things are done                    |
| `decisions`   | `decisions/NNNN-<slug>.md` — why the project is shaped the way it is                  |
| `tracker`     | `tracker/` — hazards, bugs, defects, features, open questions, and `tickets/`         |
| `docs`        | `AGENTS.md`, `CONTRIBUTING.md`, `README.md` — each for its reader                     |
| `changelog`   | `CHANGELOG.md` — what changed, for the project's users                                |
| `specs`       | `specs/<slug>.md` — one design document per effort                                    |
| `plans`       | `plans/<slug>.md` — one live map per big, foggy effort                                |
| `education`   | `education/` — one learner’s workspace: mission, resources, lessons, learning records |

| Activity             | Use it when                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrapping`      | Creating the scaffold, whole or one missing piece; re-running repairs only the gaps it finds and reports when there is nothing to do                                             |
| `tracking`           | Something comes up that cannot be dealt with now but must not be lost: an obstacle, a bug, a smell, a feature request, an open question; or picking up or closing a tracked item |
| `domain-modeling`    | A term is doing two jobs or drifting, or project language needs settling — the agent challenges it, proposes the canonical term, and has it recorded                             |
| `codifying`          | You say what something means, how something is done, or why the project takes a shape — or say something that might be one, in which case the agent asks before recording it     |
| `curate-inbox`       | Open the inbox — collect tracker items and stray calls for attention, process each with the user, record answers, route the work they reveal                                     |
| `find-skills`        | "How do I do X" where an installable skill might already exist — search skills.sh and the Skills CLI, verify quality, present options, install                                   |
| `maintaining-docs`   | The project's structure, protocols, or state change; after any user-visible change; or when you ask for a release, which `/cut-release` cuts on your confirmation                |
| `specifying`         | A settled design needs writing down as a spec                                                                                                                                    |
| `implementing`       | You ask to build something planned — a spec, bug, or defect — and the agent slices it into tickets and works them one at a time; a feature implements through its spec           |
| `wayfinding`         | An effort is too big or too foggy to spec — the agent charts a live map and resolves its decisions one at a time                                                                 |
| `prototyping`        | A design question needs making concrete — the agent builds throwaway code that answers it and captures the verdict                                                               |
| `wizard`             | A procedure only a human can do — the agent generates a step-by-step script that walks them through it                                                                           |
| `grilling`           | A decision or plan needs working through with you — the agent walks the design tree one round of questions at a time                                                             |
| `writing-for-agents` | Writing a skill or an agent-facing document — the craft of pointers, disclosure, leading words, and pruning                                                                      |
| `questionnaire`      | A decision depends on someone outside the conversation — the agent writes a questionnaire aimed at exactly what you need back                                                    |
| `teaching`           | The user wants to learn a real skill over time — the agent settles the mission, then teaches lesson by lesson in the zone of proximal development                                |
| `diagnosing-bugs`    | Something is broken and the cause is not obvious                                                                                                                                 |
| `tdd`                | Work that should be built or locked down test-first                                                                                                                              |
| `code-review`        | A branch, PR, or work-in-progress change needs reviewing                                                                                                                         |
| `codebase-design`    | A module's interface, seam, or depth is being designed or judged                                                                                                                 |
| `research`           | A question needs facts from primary sources                                                                                                                                      |

### Commands

| Command          | What it does                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/bootstrap`     | Runs a full bootstrap: explores what exists, asks one round of questions for the gaps it found, creates missing pieces and repairs gaps, and reports when there is nothing to do        |
| `/spec`          | Turns the current conversation into a spec for your approval                                                                                                                            |
| `/cut-release`   | Cuts a release: versions the `[Unreleased]` queue into a dated section and tags it, on your confirmation                                                                                |
| `/inbox`         | Opens your inbox — collects everything calling for attention and processes it with you one item at a time                                                                               |
| `/close-inbox`   | Closes the open inbox — wraps up, records the remainder, offers to begin the surfaced work                                                                                              |
| `/implement`     | Implements planned work — a spec, bug, or defect; a feature via its spec — slicing into tickets if needed, with one checkpoint on the blocking edges before work begins                 |
| `/wayfind`       | Charts a big, foggy effort as a live map and works its decisions until the way forward is clear                                                                                         |
| `/retro`         | Reviews a session and proposes environment improvements, most severe first                                                                                                              |
| `/handoff`       | Writes a handoff document for a fresh agent to pick up the conversation                                                                                                                 |
| `/wait-what`     | Re-pitches the last message that didn't land, in plain English using the glossary's terms                                                                                               |
| `/questionnaire` | Writes a questionnaire for the person who holds the knowledge a decision is blocked on                                                                                                  |
| `/teach`         | Starts or resumes teaching, using the education workspace for state across sessions                                                                                                     |

## How the skills hang together

Skills are the edges; the scaffold pieces they write are the homes;
commands are the doors. Each branch below is labelled by its trigger —
the condition is the skill's own "use when" line, composed.

```
initial ideal
│
├─ foggy, too big ── /wayfind → wayfinding · grilling · questionnaire
│
├─ needs proof ───── prototyping
│
├─ needs facts ───── research → one cited document
│
├─ settled design ── /spec → specifying ── /implement → implementing
│                                                        │
│         ┌──────────────────────────────────────────────┤
│         ├── tdd               red, green, refactor
│         ├── codebase-design   deep modules, real seams
│         ├── code-review       Standards + Spec
│         └── diagnosing-bugs   when it breaks
```

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
open ecosystem, verify quality, install), and `teaching` with the
education workspace for the learning lane.

**The working loop — idea to project to product:** `/bootstrap` once to
build the skeleton (glossary, conventions, decisions, plans, specs,
tracker, education, docs, changelog), and again whenever a piece is
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

| The state you're in                         | What you run     | What happens next                                                      |
| ------------------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| The repo is bare, or a scaffold piece is missing | `/bootstrap` | The skeleton is built; gaps found are put to you for approval           |
| The idea is foggy, too big to spec          | `/wayfind`       | A live map; its key questions are put to you, one per session           |
| A decision is blocked on an outside person  | `/questionnaire` | A questionnaire for the person who holds the knowledge                  |
| The design has settled                      | `/spec`          | The conversation becomes a spec for your approval                       |
| A spec sits approved                        | `/implement`     | Tickets by kind, checkpointed on the blocking edges                     |
| Open items and questions pile up            | `/inbox`         | One at a time; answers recorded; `/close-inbox` offers the surfaced work |
| The changelog queue should ship             | `/cut-release`   | A dated, tagged version, on your confirmation                           |
| You want to learn something                 | `/teach`         | A lesson in the education workspace                                     |

### How the work flows

```
                       initial idea
   ┌──────────────┬───────┬┴──────────┬─────────────────────┐
proof needed  facts needed│      foggy, too big to spec
prototyping   research    │          /wayfind
   │               │      │          · wayfinding
   │               ↘      │          · grilling
   │          cited doc ✓ │          · /questionnaire
   │                      │
   └──────────┬───────────┴──────────┘
              ▼
      the design settles ── /spec ↘ spec ✓, approved by you
                                  /implement
                                  implementing — one ticket at a time
                                  ┌──────────────────────────────┐
                                  │ the execution cycle ⇄        │
                                  │ tdd · code-review ·          │
                                  │ codebase-design ·            │
                                  │ diagnosing-bugs — fires when │
                                  │ the moment matches           │
                                  └──────────────────────────────┘
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
open ecosystem, verify quality, install), and `teaching` with the
education workspace for the learning lane.

**The working loop — idea to project to product:** `/bootstrap` once to
build the skeleton (glossary, conventions, decisions, plans, specs,
tracker, education, docs, changelog), and again whenever a piece is
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
