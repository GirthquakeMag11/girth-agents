---
name: Bootstrapping
description: Create a project's management scaffold — docs, changelog, glossary, conventions, decisions, trackers — whole, or one missing piece. Use when setting up a project, or when work needs a scaffold piece that does not exist yet.
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
| Trackers | `tracker/HAZARDS.md`, `BUGS.md`, `DEFECTS.md`, `FEATURES.md`, `QUESTIONS.md` | tracker | Nothing |

## Creating a piece

Call the skill tool with the piece's owner and read its `template.md`
reference. Create the piece from the template, filling what is known. Leave
placeholders for the rest, never guessing the project's name, and leave a
note in the piece for anything the user should confirm later.

## One piece, mid-task

When work needs a piece that does not exist, create that piece as above,
skipping the interview, and return to the work that needed it.

Done when the piece exists and that work can continue.

## Full bootstrap

When the user asks to bootstrap a project (the `/bootstrap` command starts
this):

1. **Confirm the scaffold root.** Default: the project root.
2. **Explore.** Note which pieces exist. Gather every fact the project can
   tell you — name, purpose, license, build/test/lint commands (package
   manifests, build files, CI configuration), layout, any changelog tool.
   Finding facts is your job; the user is asked only for what the project
   cannot tell you.
3. **Interview once.** Present what you found, then ask the inventory's
   questions for every missing piece in a single round, each with your
   recommended answer, worded so "yes" accepts it. Wait for the answers.
4. **Create every missing piece.** Existing pieces stay untouched. Rulings
   or decisions the user named in the interview are recorded by calling the
   skill tool with `codifying`.
5. **Report** what was created, what already existed, and anything left
   provisional for the user to confirm.

Done when every inventory piece exists and the report is delivered.