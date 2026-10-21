---
name: Find Skills
description: Discover and install agent skills from the open ecosystem — search skills.sh and the Skills CLI, verify quality, present options, and install. Use when a user asks "how do I do X" or "is there a skill for X", where X might be covered by an installable skill.
---

# Find Skills

Find the agent skills the user is missing and install them from the open
ecosystem — for needs that sound like ones a published skill already
covers. This skill searches and installs; it does not author. Creating a
skill is `writing-for-agents`' work.

## When to use this skill

- The user asks "how do I do X" where X is a common task.
- The user says "find a skill for X" or "is there a skill for X".
- The user asks "can you do X" where X is a specialized capability.
- The user wants to extend the agent's capabilities, or search for tools,
  templates, and workflows.

## The Skills CLI

The Skills CLI (`npx skills`) is the package manager for the open agent
skills ecosystem — modular packages carrying specialized knowledge,
workflows, and tools.

- `npx skills find [query] [--owner <owner>]` — search interactively or by
  keyword, optionally scoped to a GitHub owner.
- `npx skills add <package>` — install a skill from GitHub or elsewhere.
- `npx skills update` — update everything installed.

Browse the leaderboard at https://skills.sh/.

## Finding a skill

1. **Understand the need.** The domain (React, testing, design,
   deployment), the specific task (writing tests, reviewing PRs), and how
   common it is — common tasks likely have a skill.
2. **Check this catalog first.** A girth skill in this repo may already do
   the thing, with no install needed — README lists the catalog.
3. **Check the leaderboard.** https://skills.sh/ ranks skills by installs,
   surfacing the popular, battle-tested ones first — e.g. `anthropics/skills`
   for frontend design and document processing.
4. **Search.** `npx skills find <keywords>` — "how do I make my React app
   faster?" becomes `npx skills find react performance`. Prefer specific
   keywords ("react testing" over "testing"), and try alternative terms when
   the first misses.
5. **Verify quality before recommending.** Never recommend off search
   results alone: prefer 1K+ installs, official sources (`vercel-labs`,
   `anthropics`, `microsoft`), and source repos with more than ~100 stars.
6. **Present options.** The name, what it does, its installs and source, the
   install command, and a skills.sh link.

   ```
   The "skill-creator" skill creates and publishes new skills — from
   anthropics/skills, one of the official sources. To install:

       npx skills add anthropics/skills@skill-creator

   More: https://skills.sh/anthropics/skills/skill-creator
   ```

7. **Offer to install.** `npx skills add <owner/repo@skill> -g -y` — `-g`
   installs at user level, `-y` skips confirmation prompts. Let the user
   confirm the install.

## Categories that usually have skills

| Category        | Example queries                           |
| --------------- | ----------------------------------------- |
| Web development | react, nextjs, typescript, css, tailwind  |
| Testing         | testing, jest, playwright, e2e            |
| DevOps          | deploy, docker, kubernetes, ci-cd         |
| Documentation   | docs, readme, changelog, api-docs         |
| Code quality    | review, lint, refactor, best-practices    |
| Design          | ui, ux, design-system, accessibility      |
| Productivity    | workflow, automation, git                 |

## When nothing matches

Say no existing skill covers the need, offer to do the task directly with
general capabilities, and when the need recurs, suggest authoring one —
`npx skills init <name>` for the open ecosystem, or the `writing-for-agents`
skill for skills living in this catalog.

## Related skills

- writing-for-agents — authoring the skill the user needs, rather than
  finding one.