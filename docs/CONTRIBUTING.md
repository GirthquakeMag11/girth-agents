# Contributing to girth-agents

This repo is a dev workspace *and* a distributable OpenCode V2 catalog. Every
agent, skill, and command is a Markdown file under `.opencode/` — that
directory is the product.

## Ground rules

The linter (`node scripts/validate.mjs`) enforces all of these; run it before
committing.

| Rule | Why |
| --- | --- |
| Agents and commands are flat `.md` files | A nested path changes the item's ID (`team/reviewer`), and collisions with a user's own items get confusing. Flat → the filename is the ID. |
| Skills use the directory form `.opencode/skills/<id>/SKILL.md` | Supporting files (`references/`, `scripts/`) need a private home; paths inside `SKILL.md` are relative to its directory. |
| All IDs are lowercase kebab-case (`[a-z0-9]+(-[a-z0-9]+)*`) | Skills especially: OpenCode derives the ID from the directory name and there is no namespacing once installed. |
| Every agent and skill has a frontmatter `description` | OpenCode only advertises skills with a description, and descriptions are what a parent agent sees when choosing subagents. |
| No OpenCode V1 agent fields (`temperature`, `top_p`, `prompt`, `permission`, `tools`, `disable`, `maxSteps`) | V2 rejects or ignores these; they only mislead. |
| Command bodies are the template; no `template` frontmatter; bodies never empty | The Markdown body *is* the prompt template ($ARGUMENTS, $1…). |
| Paths referenced from `SKILL.md` exist next to it | Dead `references/` or `scripts/` paths break the skill at load time. |

## Adding an agent

Create `.opencode/agents/<id>.md`:

```md
---
description: Reviews database migrations for safety
mode: subagent
model: anthropic/claude-sonnet-4-5#high
---

Review the migration. List findings in severity order with file and line refs.
```

| Frontmatter field | Required | Notes |
| --- | --- | --- |
| `description` | ✅ | Shown when a parent agent selects a subagent |
| `mode` | — | `primary`, `subagent`, or `all` |
| `model` | — | `provider/model#variant` |
| `permissions` | — | Ordered allow/ask/deny rules |
| `steps`, `hidden`, `color`, `disabled` | — | See the OpenCode agents guide |

Then validate and add a row to the README catalog table.

## Adding a skill

```text
.opencode/skills/
└── git-release/
    ├── SKILL.md
    ├── references/
    │   └── release-policy.md
    └── scripts/
        └── changelog.ts
```

`SKILL.md`:

```md
---
name: Git Release
description: Prepare release notes, version bumps, and GitHub releases
---

1. Read `references/release-policy.md`.
2. Summarize merged changes since the previous tag.
...
```

- The **directory name is the skill ID** — pick it carefully, kebab-case.
- `description` is required: without it the model never sees the skill.
- Everything the skill needs travels with it, addressed relative to its own
  directory.

Then validate and add a row to the README catalog table.

## Adding a command

Create `.opencode/commands/<name>.md`; the body is the template:

```md
---
description: Review a file for bugs and missing tests
agent: plan
---

Review $ARGUMENTS for bugs and missing tests.
```

Optional frontmatter: `description`, `agent`, `model`, `subagent`. Never
`template`. Then validate and add a row to the README catalog table.

## Tooling

- `scripts/validate.mjs` — catalog linter. Zero dependencies, Node 18+.
- `scripts/install.sh` — symlinks (default) or copies (`--copy`) the catalog
  into `~/.config/opencode/`. Override the target with `OPENCODE_CONFIG_DIR`.

## Skill family maintenance

The skills form a family: `bootstrapping` creates each scaffold piece per a
minimal default, and each piece's own skill later supersedes that default.
The process is retroactive — a piece is defined by its own skill, and
`bootstrapping` follows. When a new piece-skill is written:

1. Update that piece's section in the bootstrapping skill: canonical
   skeleton, remove provisional language, mark it "defined by".
2. Check every sibling skill whose boundary text references that piece.
3. Update the checklist below.

Skillset state: `tracking-hazards` ✅ · `tracking-bugs` ✅ ·
`tracking-defects` ✅ · `tracking-features` ✅ · `tracking-questions` ✅ ·
`conventions` ✅ · `agents-documentation` ⬜ · `contributing` ⬜ ·
`glossary` ⬜ · `readme` ⬜ · `changelog` ⬜

## Release process

1. `node scripts/validate.mjs` is green.
2. README catalog tables are up to date.
3. Conventional commit, push, tag (`vX.Y.Z`).

A GitHub Pages catalog (skills served over HTTPS with an `index.json`) is a
planned addition and requires no layout changes to arrive.