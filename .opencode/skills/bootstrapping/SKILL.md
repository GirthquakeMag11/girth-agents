---
name: Bootstrapping
description: Create a project's management scaffold — docs, changelog, glossary, conventions, decisions, specs, trackers — whole, or one missing piece. Use when setting up a project, or when work needs a scaffold piece that does not exist yet.
metadata:
  girth/role: activity
---

# Bootstrapping

Creates a project's management scaffold, whole or one piece at a time. Each
piece's owner skill holds its creation template; this skill decides what to
create and runs the creation.

## The inventory

The inventory is the contract for what counts as scaffolding. When work
suggests a piece that is not listed here, flag it to the user; it becomes
scaffolding only once the user agrees to add it.

Paths are relative to the scaffold root: the project root, unless the user
designates another location.

| Piece | Path | Owner | Asked on a full bootstrap |
| --- | --- | --- | --- |
| Agents guide | `AGENTS.md` | docs | Only what exploration cannot fill, plus what agents commonly get wrong here |
| Contributing guide | `CONTRIBUTING.md` | docs | Setup steps and process preferences exploration cannot find |
| Readme | `README.md` | docs | Name, description, and license where the project does not state them; current status |
| Changelog | `CHANGELOG.md` | changelog | Nothing |
| Glossary | `GLOSSARY.md` | glossary | Nothing; the domain line comes from the project overview |
| Conventions | `conventions/` | conventions | Whether rulings already exist worth capturing now |
| Decisions | `decisions/` | decisions | Whether decisions already exist worth recording now |
| Specs | `specs/` | specs | Whether any design effort needs its spec written now |
| Plans | `plans/` | plans | Nothing; created when an effort needs a map |
| Trackers | `tracker/HAZARDS.md`, `BUGS.md`, `DEFECTS.md`, `FEATURES.md`, `QUESTIONS.md` | tracker | Nothing |
| Tickets | `tracker/tickets/` | tracker | Nothing; created with the first ticket, never at bootstrap |

## Deviations

The inventory is the default, not the law: a project's own conventions
outrank this skill's prescriptions. When exploration finds the project
deviating from what a section above prescribes — a document kept at another
path, an existing structure that conflicts with a template — the deviation
is an interview item, never silently fixed and never silently kept:

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

Call the skill tool with the piece's owner and read its `template.md`
reference. Create the piece from the template, filling what is known. Leave
placeholders for the rest, never guessing the project's name, and leave a
note in the piece for anything the user should confirm later.

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
   build files, CI configuration), layout, any changelog tool. Finding facts
   is your job; the user is asked only for what the project cannot tell you.
3. **Interview once.** Present what you found, then call the skill tool with
   `grilling` to work through the inventory's questions for every missing
   piece in rounds until none remain. Wait for the answers.
4. **Create every missing piece.** Existing pieces stay untouched. Rulings
   or decisions the user named in the interview are recorded by calling the
   skill tool with `codifying`.
5. **Report** what was created, what already existed, and anything left
   provisional for the user to confirm.

Done when every inventory piece exists and the report is delivered.