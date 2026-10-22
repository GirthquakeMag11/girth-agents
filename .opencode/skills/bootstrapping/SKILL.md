---
name: Bootstrapping
description: Create a project's management scaffold — whole, or one missing piece. Use when setting up a project, or when work needs a scaffold piece that does not exist yet.
---

# Bootstrapping

Creates a project's management scaffold, whole or one piece at a time. Each
piece is owned by one skill, which holds the piece's creation template in
its `references/`; this skill decides what to create and runs the creation.

## What a run does

A run adapts to what it finds; exploration comes first, and the interview
contains only what the exploration surfaced:

- **Empty or new** — nothing exists: the full interview, then every piece
  is created.
- **Partial** — some pieces exist: the interview covers the missing
  pieces' questions and the gaps found inside existing ones — a changelog
  with no versioning established, a deviation not yet settled.
- **Complete** — every piece exists and no gaps were found: report that
  there is nothing to do, and stop.
- **Work already begun** — the repository has commits, or a changelog is
  being adopted mid-project: the changelog starts forward-looking, never
  reconstructing history, and establishing its versioning is an interview
  item unless the project states one.

Re-running is the normal case: a second run touches nothing that already
conforms, and previously recorded rulings decide what still counts as a
deviation.

## The inventory

The inventory is the contract for what counts as scaffolding. When work
suggests a piece that is not listed here, flag it to the user; it becomes
scaffolding only once the user agrees to add it.

Paths are relative to the scaffold root: the project root, unless the user
designates another location.

| Piece              | Path                                                                         | Owned by         | Asked on a full bootstrap                                                            |
| ------------------ | ---------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| Agents guide       | `AGENTS.md`                                                                  | maintaining-docs | Only what exploration cannot fill, plus what agents commonly get wrong here          |
| Contributing guide | `CONTRIBUTING.md`                                                            | maintaining-docs | Setup steps and process preferences exploration cannot find                          |
| Readme             | `README.md`                                                                  | maintaining-docs | Name, description, and license where the project does not state them; current status |
| Changelog          | `CHANGELOG.md`                                                               | maintaining-docs | The starting version, when no manifest, tag, or convention states one                |
| Glossary           | `GLOSSARY.md`                                                                | domain-modeling  | Nothing; the domain line comes from the project overview                             |
| Conventions        | `conventions/`                                                               | codifying        | Whether rulings already exist worth capturing now                                    |
| Decisions          | `decisions/`                                                                 | codifying        | Whether decisions already exist worth recording now                                  |
| Specs              | `specs/`                                                                     | specifying       | Whether any design effort needs its spec written now                                 |
| Plans              | `plans/`                                                                     | wayfinding       | Nothing; created when an effort needs a map                                          |
| Education          | `education/`                                                                 | teaching         | Whether the user wants an education workspace now                                    |
| Trackers           | `tracker/HAZARDS.md`, `BUGS.md`, `DEFECTS.md`, `FEATURES.md`, `QUESTIONS.md` | tracking         | Nothing                                                                              |
| Tickets            | `tracker/tickets/`                                                           | tracking         | Nothing; created with the first ticket, never at bootstrap                           |

## Release tooling: the gh CLI

The scaffold's release flow leans on one tool beyond the repository
itself: the `gh` CLI, which `/cut-release` uses to open the GitHub
Release. Bootstrapping checks for it. The check is a concern, not an
inventory piece — the wizard below is the piece, and it lives in this
skill's `references/`.

- **Present** — nothing to do, and nothing asked.
- **Missing** — the interview offers to set it up: walk the user through
  `references/gh-setup-wizard.md`, which installs and readies gh. The
  offer is never pushed on a user who declines.
- **Declined** — at bootstrap or later at `/cut-release` — the declination
  is a ruling: record it in `conventions/` by calling the skill tool with
  `codifying`, and the check skips silently from then on.

## Deviations

The inventory is the default, not the law: a project's own conventions
outrank this skill's prescriptions. When exploration finds the project
deviating from what a section above prescribes — a document kept at another
path, an existing structure that conflicts with a template — the deviation
is an interview item, never silently fixed and never silently kept.

Exploration reads `conventions/` before declaring anything a deviation: a
deviation the user already affirmed and recorded is a ruling, and produces
no interview item:

- **Recommend the skill's prescription** — moving the piece to its inventory
  path, conforming to the template — and ask the user.
- **If the user accepts,** bring the piece into line. No convention is
  needed; the project now matches the default.
- **If the user affirms the deviation as valid,** it stands as the project's
  ruling: record it as a convention by calling the skill tool with
  `codifying`, and leave the piece where the project keeps it.

A user-directed deviation from the default is a ruling establishing a
convention — exactly what `conventions/` is for.

## Creating a piece

Call the skill tool with the owning skill and read its creation
reference. Create the piece from the template, filling what is known. Leave
placeholders for the rest, never guessing facts the project has not
stated, and leave a note in the piece for anything the user should confirm
later.

## One piece, mid-task

When work needs a piece that does not exist, create that piece as above,
skipping the interview, and return to the work that needed it. If the piece
turns out to exist at another path, that is a deviation — follow the
Deviations rule instead of creating a duplicate.

Done when the piece exists and that work can continue.

## Full bootstrap

When the user asks to bootstrap a project (the `/bootstrap` command starts
this):

1. **Confirm the scaffold root.** Default: the project root.
2. **Explore.** Note which pieces exist, and **where** — a piece living at a
   path other than the inventory's is a deviation, not a missing piece; the
   Deviations rule governs it. Gather every fact the project can tell you —
   name, purpose, license, build/test/lint commands (package manifests,
   build files, CI configuration), layout, any changelog tool, and any
   versioning the project states — a manifest version field, git tags, a
   versioning convention. Note whether work has already begun and whether
   the `gh` CLI is installed. Finding facts is your job; the user is asked
   only for what the project cannot tell you.
3. **Interview once.** Present what you found, then call the skill tool with
   `grilling` to work through the missing pieces' questions and any gaps
   the exploration found, in rounds until none remain. A run whose
   exploration found nothing to create, repair, or settle reports it and
   stops before interviewing. Wait for the answers.
4. **Create every missing piece and repair the gaps found.** Existing
   pieces stay untouched. Rulings or decisions the user named in the
   interview are recorded by calling the skill tool with `codifying` — the
   starting version among them, cited in the changelog head per the
   changelog's format. Establishing or repairing that metadata produces no
   changelog entries.
5. **Report** what was created, what already existed, and anything left
   provisional for the user to confirm.

Done when every inventory piece exists, the gaps the run found are
repaired, and the report is delivered — a run that found nothing to do
reports just that.