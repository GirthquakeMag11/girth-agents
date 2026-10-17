---
name: Bootstrapping
description: Set up or complete a project's management scaffold (AGENTS.md, CONTRIBUTING.md, GLOSSARY.md, README.md, CHANGELOG.md, tracker/HAZARDS|BUGS|DEFECTS|FEATURES|QUESTIONS.md, conventions/), creating any missing piece and interviewing the user where needed. Use when bootstrapping a project from scratch, or when a missing scaffold piece blocks your work.
---

# Bootstrapping

Sets up a project's management scaffolding — and nothing else. This skill
creates missing scaffold pieces and interviews the user where a piece needs
their input. It does **not** teach how to *use* any piece: each piece's usage
is owned by its own skill or shared skill (see "Related skills").

## The scaffold inventory

This inventory is the source of truth for what counts as scaffolding. If a
piece comes up in conversation and is not listed here, flag it with the user
before treating it as scaffolding.

The scaffold root is the project directory by default. On a full bootstrap,
confirm it with the user — they may designate another location.

| Piece | Path (relative to scaffold root) | Format |
| --- | --- | --- |
| Agents guide | `AGENTS.md` | Markdown, sections below |
| Contributing guide | `CONTRIBUTING.md` | Markdown, sections below |
| Glossary | `GLOSSARY.md` | Markdown, entry list |
| Readme | `README.md` | Markdown, sections below |
| Changelog | `CHANGELOG.md` | Markdown, Keep a Changelog |
| Hazards tracker | `tracker/HAZARDS.md` | Markdown |
| Bugs tracker | `tracker/BUGS.md` | Markdown |
| Defects tracker | `tracker/DEFECTS.md` | Markdown |
| Features tracker | `tracker/FEATURES.md` | Markdown |
| Questions tracker | `tracker/QUESTIONS.md` | Markdown |
| Conventions directory | `conventions/` | Markdown, `On_<Domain>.md` per domain |

## Two ways this skill is used

### 1. Full bootstrap (invoked with the user)

1. Confirm the scaffold root (default: project root).
2. Inventory the pieces above. Note which exist and which are missing.
3. For each missing piece, follow its section under "The pieces".
4. Collect everything the piece sections need to know, then interview the
   user once, as a batch. Do not ask one question per file.
5. Create all missing pieces.
6. Report: what was created, what already existed (and was left untouched),
   and which pieces were created with provisional content.

Existing pieces are left alone. Creating never means rewriting; a section
says explicitly if it expects a piece to be modified later.

### 2. Single piece (referenced mid-task)

When work requires a scaffold piece and it is missing, load this skill, jump
to that piece's section, and create the piece using the minimal default the
section gives. Do not interview mid-task; create the default, and leave a
note in the piece about anything the user should confirm later.

## The pieces

Each section covers: what to create, what to ask on a full bootstrap, the
mid-task default, and what this skill deliberately does not define (owned by
the piece's own skill, where one exists).

### AGENTS.md — `AGENTS.md`

- **Create** a file with these sections:

  ```markdown
  # AGENTS.md

  ## Project overview
  <!-- One to three sentences: what this project is and does. -->

  ## Commands
  <!-- Build / test / lint, exactly as an agent should run them. -->

  ## Repository layout
  <!-- Map of the directories an agent will actually touch. -->

  ## Conventions
  <!-- Pointers to conventions/ files and glossary terms agents must honor. -->
  ```

- **Ask (full bootstrap):** the project overview; the build/test/lint
  commands; anything agents commonly get wrong.
- **Mid-task default:** create the file with overview and conventions filled
  from what is known; leave `<!-- ... -->` placeholders in the rest.
- **Not defined here:** guidance on *keeping* AGENTS.md alive and how agents
  should treat it during work — that belongs to the agents-documentation
  skill (planned).

### CONTRIBUTING.md — `CONTRIBUTING.md`

- **Create** a file with these sections:

  ```markdown
  # Contributing

  ## Setup
  <!-- Steps to get a working development environment. -->

  ## Development workflow
  <!-- Build / test / lint commands, and expectations before committing. -->

  ## Conventions
  <!-- Pointers to conventions/ files, changelog and tracker discipline. -->
  ```

- **Ask (full bootstrap):** dev environment setup steps; workflow commands;
  code style or process preferences.
- **Mid-task default:** create the skeleton with placeholders intact and a
  note to have the maintainer fill them.
- **Not defined here:** the contributor-facing process itself — owned by the
  contributing skill (planned).

### GLOSSARY.md — `GLOSSARY.md`

- **Create** a file with this skeleton:

  ```markdown
  # Glossary

  Terms are added here the first time work gives them a working meaning.

  <!-- Entries as `**term** — definition.` one per line, alphabetical.
       Filled in over time, not during bootstrap. -->
  ```

- **Ask (full bootstrap):** nothing.
- **Mid-task default:** create the skeleton and, if the current task just
  gave a term a working meaning, add that one entry.
- **Not defined here:** how and when terms are added, renamed, or retired —
  owned by the glossary skill (planned).

### README.md — `README.md`

- **Create** a file with this skeleton:

  ```markdown
  # <Project Name>

  <One-line description>

  ## Quick start
  <!-- Minimal usage: what the project does and how to run it. -->

  ## Documentation
  <!-- Where the real docs live. -->

  ## Contributing
  See CONTRIBUTING.md.
  ```

- **Ask (full bootstrap):** project name, one-line description, license.
- **Mid-task default:** create the skeleton with what is known; never guess
  the project name — leave the placeholder.
- **Not defined here:** what a mature README should contain — owned by the
  readme skill (planned).

### CHANGELOG.md — `CHANGELOG.md`

- **Create** a file with this skeleton:

  ```markdown
  # Changelog

  All notable changes to this project are documented in this file.
  Format follows Keep a Changelog (<https://keepachangelog.com>); versions follow SemVer.

  ## [Unreleased]

  ### Added
  ### Changed
  ### Deprecated
  ### Removed
  ### Fixed
  ### Security
  ```

- **Ask (full bootstrap):** nothing. Starts empty.
- **Mid-task default:** same as create.
- **Not defined here:** when and how entries are written and released —
  owned by the changelog skill (planned). The default format above may
  change when that skill lands.

### tracker/HAZARDS.md — `tracker/HAZARDS.md`

Defined by the tracking-hazards skill; create its canonical skeleton exactly
(`# HAZARDS` title, one-line purpose, entries-follow note).

- **Ask (full bootstrap):** nothing — the definition is settled, so no
  maintainer interview is needed.
- **Mid-task default:** same as create; the tracking-hazards skill then
  guides adding the entry itself.
- **Not defined here:** what counts as a hazard and what entries contain —
  owned by the tracking-hazards skill.

### tracker/BUGS.md — `tracker/BUGS.md`

Defined by the tracking-bugs skill; create its canonical skeleton exactly
(`# BUGS` title, one-line purpose, entries-follow note).

- **Ask (full bootstrap):** nothing — the definition is settled, so no
  maintainer interview is needed.
- **Mid-task default:** same as create; the tracking-bugs skill then guides
  adding the entry itself.
- **Not defined here:** triage rules, entry format, and workflow — owned by
  the tracking-bugs skill.

### tracker/DEFECTS.md — `tracker/DEFECTS.md`

Defined by the tracking-defects skill; create its canonical skeleton exactly
(`# DEFECTS` title, one-line purpose, entries-follow note).

- **Ask (full bootstrap):** nothing — the definition is settled, so no
  maintainer interview is needed.
- **Mid-task default:** same as create; the tracking-defects skill then
  guides adding the entry itself.
- **Not defined here:** the bug/defect boundary, entry format, and workflow
  — owned by the tracking-defects skill.

### tracker/FEATURES.md — `tracker/FEATURES.md`

Defined by the tracking-features skill; create its canonical skeleton
exactly (`# FEATURES` title, one-line purpose, entries-follow note).

- **Ask (full bootstrap):** nothing — the definition is settled, so no
  maintainer interview is needed.
- **Mid-task default:** same as create; the tracking-features skill then
  guides adding the entry itself.
- **Not defined here:** entry format, lifecycle, and relationship review —
  owned by the tracking-features skill.

### tracker/QUESTIONS.md — `tracker/QUESTIONS.md`

Defined by the tracking-questions skill; create its canonical skeleton
exactly (`# QUESTIONS` title, one-line purpose, entries-follow note).

- **Ask (full bootstrap):** nothing — the definition is settled, so no
  maintainer interview is needed.
- **Mid-task default:** same as create; the tracking-questions skill then
  guides adding the entry itself.
- **Not defined here:** entry format, the ask-now-or-track test, and the
  resolution flow — owned by the tracking-questions skill.

### conventions/ — `conventions/`

Defined by the conventions skill; at bootstrap this means creating the
empty directory — `On_<Domain>.md` files appear as rulings are recorded,
never during bootstrap.

- **Ask (full bootstrap):** whether the project already has conventions or
  rulings worth capturing now. If the maintainer names any, record them per
  the conventions skill — this is the one piece whose contents come from
  the maintainer's own rulings.
- **Mid-task default:** create the directory; add a domain file only when
  recording a ruling, per the conventions skill.
- **Not defined here:** what counts as a ruling, file naming, and entry
  format — owned by the conventions skill.

## Related skills

Each piece's *usage* is owned by another skill, never by this one. Do not
try to load a skill marked "(not written)".

| Piece | Skill |
| --- | --- |
| AGENTS.md usage | agents-documentation (not written) |
| CONTRIBUTING.md usage | contributing (not written) |
| GLOSSARY.md usage | glossary (not written) |
| README.md usage | readme (not written) |
| CHANGELOG.md usage | changelog (not written) |
| tracker/HAZARDS.md usage | tracking-hazards |
| tracker/BUGS.md usage | tracking-bugs |
| tracker/DEFECTS.md usage | tracking-defects |
| tracker/FEATURES.md usage | tracking-features |
| tracker/QUESTIONS.md usage | tracking-questions |
| conventions/ usage | conventions |

## The inventory is the contract

If work in a project suggests a piece of scaffolding that is not in the
inventory above, stop and check with the maintainer before adding it or
treating it as scaffolding. Pieces whose defining skill does not exist yet
are created per their section's minimal default and marked provisional —
that is the limit of this skill's authority over them.