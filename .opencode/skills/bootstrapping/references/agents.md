# AGENTS.md — `AGENTS.md`

## Template

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
- Hazards, bugs, defects, features, and open questions: `tracker/`, per the
  tracking skill.
- The user's rulings on how things are done: `conventions/`, per the
  conventions skill.
- Settled terms and significant decisions: per the domain-modeling skill.
- User-visible changes: `CHANGELOG.md`, per the maintaining-docs skill.
```

## Full bootstrap

Fill the overview, commands, and layout from exploration. Ask only what the
project cannot tell you, plus anything agents commonly get wrong here.

## Mid-task default

Create the file, filling what is known; leave the `<!-- ... -->`
placeholders for the rest.

Used through the maintaining-docs skill, which owns what makes AGENTS.md
good and how it is kept current.