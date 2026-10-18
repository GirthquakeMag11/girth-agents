---
name: Bootstrapping
description: Create a project's management scaffold — docs, glossary, decisions, conventions, trackers — whole, or one missing piece. Use when setting up a project, or when work needs a scaffold piece that does not exist yet.
---

# Bootstrapping

Creates a project's management scaffold, whole or one piece at a time, and
nothing else: each piece's use belongs to the skill named in the inventory.

## The inventory

The inventory is the contract for what counts as scaffolding. When work
suggests a piece that is not listed here, flag it to the user; it becomes
scaffolding only once the user agrees to add it.

Paths are relative to the scaffold root: the project root, unless the user
designates another location.

| Piece | Path | Reference | Used through |
| --- | --- | --- | --- |
| Agents guide | `AGENTS.md` | `references/agents.md` | maintaining-docs |
| Contributing guide | `CONTRIBUTING.md` | `references/contributing.md` | maintaining-docs |
| Readme | `README.md` | `references/readme.md` | maintaining-docs |
| Changelog | `CHANGELOG.md` | `references/changelog.md` | maintaining-docs |
| Glossary | `GLOSSARY.md` | `references/glossary.md` | domain-modeling |
| Decision records | `decisions/` | `references/decisions.md` | domain-modeling |
| Conventions | `conventions/` | `references/conventions.md` | conventions |
| Hazards tracker | `tracker/HAZARDS.md` | `references/hazards.md` | tracking |
| Bugs tracker | `tracker/BUGS.md` | `references/bugs.md` | tracking |
| Defects tracker | `tracker/DEFECTS.md` | `references/defects.md` | tracking |
| Features tracker | `tracker/FEATURES.md` | `references/features.md` | tracking |
| Questions tracker | `tracker/QUESTIONS.md` | `references/questions.md` | tracking |

Each reference holds the piece's template, what a full bootstrap asks, and
its mid-task default.

## One piece, mid-task

When work needs a piece that does not exist:

1. Read that piece's reference.
2. Create the piece with its mid-task default. Skip the interview; leave a
   note in the piece for anything the user should confirm later.
3. Return to the work that needed it.

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
3. **Read the reference of every missing piece** and collect its questions.
4. **Interview once.** Present what you found, then ask every collected
   question in a single round, each with your recommended answer, worded so
   "yes" accepts it. Wait for the answers.
5. **Create every missing piece** from its reference. Existing pieces stay
   untouched.
6. **Report** what was created, what already existed, and anything left
   provisional for the user to confirm.

Done when every inventory piece exists and the report is delivered.