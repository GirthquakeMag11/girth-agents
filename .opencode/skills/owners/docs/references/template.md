# Docs templates

Each document is created at the project root.

`AGENTS.md`

```markdown
# AGENTS.md

## Project overview
<!-- One to three sentences: what this project is and does. -->

## Commands
<!-- Build / test / lint, exactly as an agent should run them. -->

## Repository layout
<!-- Map of the directories an agent will actually touch. -->

## Before you work
- Check `tracker/HAZARDS.md` for hazards in the area you are working in, and
  follow their handling guidance.
- Follow the rulings in `conventions/` for the domains your work touches;
  the newest ruling on a subject governs.
- Read the records in `decisions/` that touch your area, and surface any
  work that would contradict one.
- Name domain concepts with the terms in `GLOSSARY.md`, in place of the
  words it lists under `_Avoid_`. A concept with no term is a gap to raise.
- A file that does not exist yet simply has nothing to read.

## Recording as you go
- Hazards, bugs, defects, features, and open questions: per the tracking
  skill.
- The user's rulings — what a term means, how something is done, why the
  project is shaped a certain way: per the codifying skill.
- User-visible changes and drifted documents: per the maintaining-docs
  skill.
```

`CONTRIBUTING.md`

```markdown
# Contributing

## Setup
<!-- Steps to get a working development environment. -->

## Development workflow
<!-- Build / test / lint commands, and expectations before committing. -->

## Protocols
<!-- Pointers to conventions/, the trackers, and changelog discipline. -->
```

`README.md`

```markdown
# <Project Name>

<One-line description>

## Quick start
<!-- Minimal usage: what the project does and how to run it. -->

## Status
<!-- The project's current state: stage, what works, what is in flight. -->

## Documentation
<!-- Where the real docs live. -->

## Contributing
See CONTRIBUTING.md.
```