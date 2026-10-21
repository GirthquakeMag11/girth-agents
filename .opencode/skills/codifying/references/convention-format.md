# Conventions

## Purpose

`conventions/`, at the project root, holds the user's rulings on how
something in the project is meant to be done. It answers *how
things are done*. Its creation template is `references/conventions-template.md`.

## What belongs

- **Settled rulings from the user:** a guideline, a rule, a set of steps, a
  preference. A statement becomes a convention only once the user has
  settled it as a ruling.
- **Rulings on how things are done, and nothing else.** What a word means
  belongs in `GLOSSARY.md`; why the project took one shape over another
  belongs in `decisions/`. When a decision implies a standing rule, the rule
  is recorded here too, linked to its decision record.

## Format

One Markdown file per *domain*, an area of the project the rulings govern
(testing, naming, docs, commits, and so on):

- Named `conventions/On_<Domain>.md`, words capitalized as in a title:
  testing rulings live in `On_Testing.md`, code-style rulings in
  `On_Code_Style.md`.
- Opening with a `# On_<Domain>` heading.
- A ruling goes into its domain's file. A new domain file opens only when no
  existing domain fits.

Each ruling is one bullet, newest at the top:

```markdown
- **<YYYY-MM-DD> — <one-line summary>** — <the ruling, in as much detail as
  the user gave> (see `decisions/<NNNN>-<slug>.md`)
```

The closing link is present when a decision record explains the ruling.

## Changing it

Rulings are history as well as the current standard. A newer ruling on the
same subject supersedes an older one: the newest governs, and the older one
stays in the file and reads as superseded.
