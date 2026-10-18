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
| Skills use the directory form `.opencode/skills/<id>/SKILL.md` | Supporting files (`references/`, `scripts/`) need a private home; paths inside a skill are relative to its directory. |
| All IDs are lowercase kebab-case (`[a-z0-9]+(-[a-z0-9]+)*`) | Skills especially: OpenCode derives the ID from the directory name and there is no namespacing once installed. |
| Every agent and skill has a frontmatter `description` | OpenCode only advertises skills with a description, and descriptions are what a parent agent sees when choosing subagents. |
| Skill descriptions stay under 300 characters (warning) | Every description is loaded into the model's context on every turn. |
| No OpenCode V1 agent fields (`temperature`, `top_p`, `prompt`, `permission`, `tools`, `disable`, `maxSteps`) | V2 rejects or ignores these; they only mislead. |
| Command bodies are the template; no `template` frontmatter; bodies never empty | The Markdown body *is* the prompt template ($ARGUMENTS, $1…). |
| Paths referenced from a skill (`references/…`, `scripts/…`) exist in that skill's directory | Dead paths break the skill at load time. |
| No `../` paths inside a skill | A skill reaches another skill by name, never by linking into its folder: installed skills are linked one by one and the folder layout is not guaranteed. |
| Every "Call the skill tool with `<id>`" names a skill in this catalog | Renames and removals otherwise leave dangling calls. |
| Every skill declares `metadata:` → `girth/role: owner` or `activity` | The schema below depends on it. |
| Owners are named with nouns, activities with a verb ending in *-ing* | A skill's name says which side of the schema it is on. |
| Owners keep a `references/template.md` and call no other skill | Owners define; activities act. |

## The schema

**Owner skills define a scaffold piece; activity skills do work with pieces,
and own none.**

| Owners: define what a piece is | Activities: what agents do |
| --- | --- |
| `glossary` — `GLOSSARY.md` | `bootstrapping` — create the scaffold, whole or one piece |
| `conventions` — `conventions/` | `tracking` — fix now or record, put down and pick up, ask or track |
| `decisions` — `decisions/` | `codifying` — turn what the user says into a term, convention, or decision |
| `tracker` — `tracker/` (five kinds plus `tickets/`) | `maintaining-docs` — keep documents true, changelog at change time, releases |
| `docs` — AGENTS, CONTRIBUTING, README | `specifying` — turn a settled conversation into a spec |
| `changelog` — `CHANGELOG.md` | `implementing` — slice an approved thing into tickets and work the frontier by each ticket's kind |
| `specs` — `specs/` | `wayfinding` — chart a big foggy effort and work its decisions until the way is clear |
| `plans` — `plans/` | `diagnosing-bugs` — the feedback-loop discipline for hard bugs |
| | `tdd` — test-first at pre-agreed seams |
| | `code-review` — two-axis review, Standards and Spec |
| | `codebase-design` — the deep-module vocabulary |
| | `research` — primary-source legwork in the background |
| | `retro` — review the agent's environment after a session |
| | `prototyping` — throwaway code that answers a design question |
| | `wizard` — a step-by-step script for human-only procedures |

Every owner's `SKILL.md` uses the same outline — **Purpose → What belongs →
Format → Changing it** — and keeps its piece's creation template in
`references/template.md`.

The rules:

1. **Where content goes.** True of the piece no matter who edits it → the
   owner. How an agent decides or proceeds → an activity.
2. **Who calls whom.** Activities call owners and other activities. Owners
   call nothing.
3. **Naming.** Owners are nouns, named for their piece. Activities are named
   for their work — a gerund where natural; an action-noun or initialism
   where the gerund would be stilted (`research`, `tdd`).
4. **Reference-only activities.** An activity may be pure consult-on-demand
   material with no ordered steps (`codebase-design`); it still owns nothing.
5. **Growth.** A new piece gets an owner. A new process gets an activity.
   Neither changes the others.

## Skill design

These rules come from comparing this catalog with mattpocock/skills; they
govern every new or changed skill.

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
- `scripts/install.sh` — symlinks (default) or copies (`--copy`) the catalog
  into `~/.config/opencode/`, and prunes links left behind by items removed
  from the catalog. Override the target with `OPENCODE_CONFIG_DIR`.

## Skill family maintenance

The scaffold's pieces are listed in the bootstrapping skill's inventory —
the contract for what counts as scaffolding.

When a scaffold piece is added, renamed, or retired:

1. Create, rename, or retire its owner, template included.
2. Update the bootstrapping inventory.
3. Update the activities that write through the owner.
4. Update the AGENTS.md template (in the docs owner's
   `references/template.md`) if agents should read or record the piece.
5. Check every skill whose text mentions the piece.

When a process is added, it becomes an activity that writes through the
existing owners.

## Release process

1. `node scripts/validate.mjs` is green.
2. README catalog tables are up to date.
3. Conventional commit, push, tag (`vX.Y.Z`).

A GitHub Pages catalog (skills served over HTTPS with an `index.json`) is a
planned addition and requires no layout changes to arrive.