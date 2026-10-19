# Working on girth-agents

This repository is both a development workspace and the published source of
the girth-agents OpenCode catalog. Everything under `.opencode/` is loaded
live by OpenCode while you work in this repo: editing a file is testing it.

## Layout

| Path | Role |
| --- | --- |
| `.opencode/skills/{owners,activities}/<id>/SKILL.md` | One skill per directory, grouped by role; `references/` and `scripts/` live beside `SKILL.md` and are addressed relative to it |
| `.opencode/commands/*.md` | One slash command per file, flat: entry points only a human triggers |
| `.opencode/agents/*.md` | One distributable agent per file, flat |
| `scripts/` | Maintainer tooling: catalog linter and installer |
| `CONTRIBUTING.md` | The rules below, expanded, plus the skill design rules |

## Publishing rules (enforced by `node scripts/validate.mjs`)

1. Agents and commands are flat `.md` files — no nested directories.
2. Skills use the directory form at any depth: `.opencode/skills/<id>/SKILL.md`,
   grouped by role under `owners/` and `activities/`. The directory holding
   `SKILL.md` is the skill ID, and leaf names stay unique across both groups.
   No flat `<id>.md` skills.
3. Every ID (agent/command filename base, skill directory name) is lowercase
   kebab-case: `[a-z0-9]+(-[a-z0-9]+)*`.
4. Required frontmatter:
   - agents: `description` (shown to a parent agent choosing a subagent)
   - skills: `description` (skills without one are never advertised), kept
     under 300 characters — it is loaded every turn
5. Agents must not use OpenCode V1 fields: `temperature`, `top_p`, `prompt`,
   `permission`, `tools`, `disable`, `maxSteps`.
6. Command bodies are the prompt template; never put `template` in
   frontmatter, and never commit an empty command body.
7. Paths referenced from a skill (`references/…`, `scripts/…`) must exist
   relative to that skill's directory, and no skill links into another with
   `../`.
8. Every "Call the skill tool with `<id>`" names a skill in this catalog.
9. Every skill declares `metadata:` → `girth/role: owner` or `activity`.
   Owners are nouns, keep `references/template.md`, and call no skill;
   activities are named for what they do or produce — a gerund where it
   reads naturally, otherwise the action's own name.

## Designing skills

Skills follow the owner/activity schema: owner skills define a scaffold
piece; activity skills do work with pieces and own none. Read "The schema"
and "Skill design" in `CONTRIBUTING.md` before adding or changing a
skill. Skills carry only what an executing agent needs — process
bookkeeping belongs in the repo docs.

## Workflow for adding an item

1. Create the file(s) under `.opencode/`.
2. Run `node scripts/validate.mjs` and fix everything it reports.
3. Add a row to the Catalog section of `README.md` — it is the user-facing
   index.
4. Commit with a conventional message (`feat(skills): git-release`, …).

## Maintenance notes

- Adding, renaming, or retiring a scaffold piece touches several skills;
  follow "Skill family maintenance" in `CONTRIBUTING.md`.
- Maintainer agents (release, linting, catalog generation) intentionally live
  in the maintainer's global OpenCode config, not here — this repo publishes
  catalog content only; it keeps the versioned tooling they run.
- `scripts/install.sh` symlinks (or copies) the catalog into a user's global
  config; changes here reach users on their next `git pull`, and re-running
  the installer prunes links to retired items.
- The layout is ready for a future GitHub Pages skill catalog: a
  `scripts/gen-catalog.mjs` and a pages workflow can be added later without
  restructuring anything.