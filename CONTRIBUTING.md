# Contributing to girth-agents

This repo is a dev workspace *and* a distributable OpenCode V2 catalog. Every
agent, skill, and command is a Markdown file under `.opencode/` — that
directory is the product.

## Ground rules

The linter (`node scripts/validate.mjs`) enforces all of these; run it before
committing.

| Rule                                                                                                                                   | Why                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agents and commands are flat `.md` files                                                                                               | A nested path changes the item's ID (`team/reviewer`), and collisions with a user's own items get confusing. Flat → the filename is the ID.              |
| Skills use the directory form `.opencode/skills/<id>/SKILL.md`; the leaf directory name is the ID                                      | Supporting files (`references/`, `scripts/`) need a private home; paths inside a skill are relative to its directory.                                    |
| All IDs are lowercase kebab-case (`[a-z0-9]+(-[a-z0-9]+)*`)                                                                            | Skills especially: OpenCode derives the ID from the directory name and there is no namespacing once installed.                                           |
| Every agent and skill has a frontmatter `description`                                                                                  | OpenCode only advertises skills with a description, and descriptions are what a parent agent sees when choosing subagents.                               |
| Skill descriptions stay under 300 characters (warning)                                                                                 | Every description is loaded into the model's context on every turn.                                                                                      |
| No OpenCode V1 agent fields (`temperature`, `top_p`, `prompt`, `permission`, `tools`, `disable`, `maxSteps`)                           | V2 rejects or ignores these; they only mislead.                                                                                                          |
| Command bodies are the template; no `template` frontmatter; bodies never empty                                                         | The Markdown body *is* the prompt template ($ARGUMENTS, $1…).                                                                                            |
| Paths referenced from a skill (`references/…`, `scripts/…`) exist in that skill's directory                                            | Dead paths break the skill at load time.                                                                                                                 |
| No `../` paths inside a skill                                                                                                          | A skill reaches another skill by name, never by linking into its folder: installed skills are linked one by one and the folder layout is not guaranteed. |
| Every "Call the skill tool with `<id>`" names a skill in this catalog                                                                  | Renames and removals otherwise leave dangling calls.                                                                                                     |
| Skills are named for what they do or produce — a gerund where it reads naturally                                                       | A skill's name is the first thing an agent reads.                                                                                                        |
| A skill that owns a scaffold piece keeps the piece's creation template and formats in `references/`                                    | One home per meaning; formats travel with the skill that owns them.                                                                                      |

## The schema

One class of skill: each is one thing the agent does, named for that thing.
Most own nothing beyond their instructions; six carry a scaffold piece,
whose formats and creation template travel in the skill's `references/`:

| Skill              | Owns                                                        |
| ------------------ | ----------------------------------------------------------- |
| `tracking`         | `tracker/` — the six open-item kinds plus `tickets/`        |
| `domain-modeling`  | `GLOSSARY.md` — the project's shared language               |
| `codifying`        | `conventions/` and `decisions/` — its two ruling formats    |
| `maintaining-docs` | `AGENTS.md`, `CONTRIBUTING.md`, `README.md`, `CHANGELOG.md` |
| `specifying`       | `specs/` — the spec format and template                     |
| `wayfinding`       | `plans/` — the live-map format and template                 |

The rules:

1. **Where content goes.** Everything about a piece — what belongs in it,
   its format, its creation template — lives in the owning skill's
   `references/`. How an agent decides or proceeds lives in the skill body.
2. **Who calls whom.** Any skill may call another by name; there is no
   direction restriction. A skill that writes a piece reads the owning
   skill's references for the format.
3. **Naming.** Named for what the skill does or produces — a gerund where
   it reads naturally, otherwise the action's own name (`research`, `tdd`,
   `wizard`). The name names the doing, not a role.
4. **Reference-only skills.** A skill may be pure consult-on-demand
   material with no ordered steps (`codebase-design`); it owns nothing, and
   that is fine.
5. **Growth.** A new piece attaches to an existing skill's references, or to
   a new owning skill; a new process is a new skill. Neither forces a second
   class.

## Skill design

These rules come from comparing this catalog with mattpocock/skills; they
govern every new or changed skill. The *craft* behind them — context
pointers, the information hierarchy, leading words, pruning — lives in the
`writing-for-agents` skill; this list is the operational rule set.

- **Invocation.** Skills are model-invoked: the agent can reach them on its
  own, so each carries a description. Entry points that only a human should
  trigger are **commands** (`.opencode/commands/`), and they start work by
  calling a skill.
- **Descriptions are triggers.** A description says what the skill is for
  and the distinct situations that should fire it, one trigger per
  situation. It does not summarize the skill's rules; the body carries
  those.
- **When to split.** A behavior becomes its own skill only when it has a
  distinct trigger of its own, or another skill must reach it. Otherwise it
  is a branch inside an existing skill.
- **Disclose by branch.** `SKILL.md` holds what every use of the skill
  needs. Material only some branches need — one tracker kind, one scaffold
  piece, one document — goes in `references/<branch>.md`, and `SKILL.md`
  tells the agent which file to read and when.
- **Cross-skill calls are explicit.** An operative instruction to use
  another skill is written as "Call the skill tool with `<id>`". Prose that
  only mentions a skill for context can name it plainly.
- **One home per meaning.** Each rule lives in one place; other places
  point to it. Shared mechanics belong in the owning skill's `SKILL.md`,
  not repeated across its references.
- **Positive instructions.** Say what to do. A prohibition earns its place
  only as a guardrail that cannot be phrased positively.
- **Skills carry only what an executing agent needs.** Process bookkeeping
  for this repo lives in these docs, never in a skill.

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

| Frontmatter field                      | Required | Notes                                        |
| -------------------------------------- | -------- | -------------------------------------------- |
| `description`                          | ✅        | Shown when a parent agent selects a subagent |
| `mode`                                 | —        | `primary`, `subagent`, or `all`              |
| `model`                                | —        | `provider/model#variant`                     |
| `permissions`                          | —        | Ordered allow/ask/deny rules                 |
| `steps`, `hidden`, `color`, `disabled` | —        | See the OpenCode agents guide                |

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
description: Prepare release notes, version bumps, and GitHub releases. Use when the user asks to cut a release.
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
description: Bootstrap this project's management scaffold
---

Call the skill tool with `bootstrapping` and run its full bootstrap.
```

Optional frontmatter: `description`, `agent`, `model`, `subagent`. Never
`template`. Then validate and add a row to the README catalog table.

## Tooling

- `scripts/validate.mjs` — catalog linter. Zero dependencies, Node 18+.
- `scripts/install.sh` — installs the catalog into `~/.config/opencode/`
  (interactive by default: links or copies, and an update policy — manual,
  notify, or auto), uninstalls it, updates it by policy, and reports
  `status`; prunes links left behind by items removed from the catalog.
  Override the target with `OPENCODE_CONFIG_DIR`.
- `scripts/test-installer.sh` — the installer's test harness, driven against
  a scratch config and a fixture catalog.
- `scripts/test-wizard.sh` — the wizard library's test harness: canned
  answers piped through fixture wizards built from the real template
  library, asserting the mask echo, the check helper, the re-ask loop,
  and the closing summary.

## Skill family maintenance

The scaffold's pieces are listed in the bootstrapping skill's inventory —
the contract for what counts as scaffolding.

When a scaffold piece is added, renamed, or retired:

1. Add, rename, or retire the piece's formats and creation template in its
   owning skill's `references/` — or attach the piece to a new owning skill
   when no existing skill fits.
2. Update the bootstrapping inventory's row for the piece.
3. Update the skills that write through the piece.
4. Update the AGENTS.md template in `maintaining-docs`'s
   `references/doc-template.md` if agents should read or record the piece.
5. Check every skill whose text mentions the piece.

When a process is added, it becomes a skill that writes through the
existing owning skills.

## Release process

1. `node scripts/validate.mjs` is green.
2. README catalog tables are up to date.
3. Conventional commit, push, tag (`vX.Y.Z`).

A GitHub Pages catalog (skills served over HTTPS with an `index.json`) is a
planned addition and requires no layout changes to arrive.