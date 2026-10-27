# Scoping per-project state across repo kinds — the practice

**Question:** An agentic system keeps per-project state — a management scaffold
(tracker, glossary, conventions, decisions, specs, plans, review reports, an
inbox) — and currently assumes ONE project = ONE code repository. What are the
real-world patterns for (a) where per-package vs per-repo state lives in a
monorepo, and (b) how management state works for repositories that are not
code (docs repos, research repos, writing projects)?

**Date:** 2026-10-26. Research commissioned for the plugin-transition
"project kinds" question; sibling notes in `docs/research/` use the same
citation style (repo path @ SHA, or first-party doc URL + section name).

---

## 1. Agent memory conventions — hierarchy and monorepo scoping

**The AGENTS.md convention (agents.md site + spec repo).**

- AGENTS.md is "a README for agents": "a dedicated, predictable place to
  provide the context and instructions to help AI coding agents work on your
  project" (https://agents.md/ — "Why AGENTS.md?"; same wording in the spec
  repo README, https://github.com/agentsmd/agents.md/blob/main/README.md
  @ `d001185d792eb6402a58e4cbef1c228b309ec25d`).
- The convention **does define hierarchy**, but only on the website, not in
  the spec repo's README (which never mentions nested files): "Large
  monorepo? Use nested AGENTS.md files for subprojects. Place another
  AGENTS.md inside each package. Agents automatically read the nearest file
  in the directory tree, so the closest one takes precedence and every
  subproject can ship tailored instructions. For example, at time of writing
  the main OpenAI repo has 88 AGENTS.md files" (https://agents.md/ — "How to
  use AGENTS.md?" step 4).
- The conflict rule is nearest-wins plus user-override: "The closest
  AGENTS.md to the edited file wins; explicit user chat prompts override
  everything" (https://agents.md/ — FAQ "What if instructions conflict?").
- Default placement for the single-repo case is the repo root: "Create an
  AGENTS.md file at the root of the repository" (https://agents.md/ — "How to
  use AGENTS.md?" step 1).
- A concrete real-repo root file: apache/airflow keeps one `AGENTS.md` at the
  repo root with repo-wide naming and tooling rules
  (https://github.com/apache/airflow/blob/main/AGENTS.md
  @ `b19bc48f96f0ae81b5a1b424be5b6efc8dacf55a`).

**Claude Code — CLAUDE.md scopes and the monorepo guide (first-party docs).**

- Four scopes, one per level, in load order: managed policy → user
  (`~/.claude/CLAUDE.md`) → project (`./CLAUDE.md` or `./.claude/CLAUDE.md`,
  "Team-shared instructions for the project", shared "via source control") →
  local (`./CLAUDE.local.md`, gitignored) (https://code.claude.com/docs/en/memory.md
  — "Choose where to put CLAUDE.md files").
- Load semantics are **concatenation, not override**: "Claude Code loads
  `CLAUDE.md` and `CLAUDE.local.md` from your current working directory and
  every directory above it … All discovered files are concatenated into
  context rather than overriding each other." Subdirectory files "load on
  demand … once Claude reads, writes, or edits another file in that
  subdirectory" (same page — "How CLAUDE.md files load").
- The dedicated monorepo page states the standard split explicitly: "A common
  split is two levels: **Root `CLAUDE.md`**: instructions that apply
  everywhere … **Per-subdirectory `CLAUDE.md`**: conventions specific to that
  area's stack. In a monorepo that's one per package … Commit these files to
  the repository so teammates inherit them. Each directory's owner typically
  maintains its file" (https://code.claude.com/docs/en/large-codebases.md —
  "Layer CLAUDE.md files by directory").
- Two mechanisms are documented for scoping, with a decision table:
  per-directory `CLAUDE.md` ("inside the directory, alongside its code …
  Directory owners maintain their own conventions; instructions are versioned
  with the code") vs path-scoped rules in a central `.claude/rules/` at the
  repo root ("You want all conventions in one place, or the same rule applies
  to many scattered paths") (same page — "Choose between per-directory
  CLAUDE.md and path-scoped rules").
- Other teams' files can be excluded (`claudeMdExcludes`), skills can live
  per package (`.claude/skills/` inside a package), and the page has an
  explicit scaling escape hatch: "Centralize conventions when layering stops
  scaling — Per-directory CLAUDE.md files can become hard to govern … Move
  conventions … into mechanisms that load on demand: Skills, Plugins, MCP
  servers" (same page).
- **Auto memory is per git repository, not per package**: "Each project gets
  its own memory directory at `~/.claude/projects/<project>/memory/`. The
  `<project>` path is derived from the git repository, so all worktrees and
  subdirectories within the same repo share one auto memory directory"
  (https://code.claude.com/docs/en/memory.md — "Storage location"). Recall
  memory does not subdivide a monorepo.

**Codex — AGENTS.md discovery chain (first-party docs).**

- Codex concatenates a chain: global `~/.codex` file, then "Starting at the
  project root (typically the Git root), Codex walks down to your current
  working directory", one file per directory, "Codex concatenates files from
  the root down … Files closer to your current directory override earlier
  guidance because they appear later in the combined prompt", capped at
  `project_doc_max_bytes` (32 KiB default) (https://developers.openai.com/codex/agent-configuration/agents-md
  — "How Codex discovers guidance").
- Nested overrides are the documented monorepo pattern: "Add overrides in
  nested directories when specific teams need different rules. For example,
  inside `services/payments/` create `AGENTS.override.md`"; and for review
  rules: "add a `## Code Review Rules` section to the `AGENTS.md` closest to
  the code the rules govern. Put repository-wide checks at the root and
  service-specific checks in a nested file" (same page — "Layer project
  instructions", "Add code review rules").

**Conflict models differ across tools** — nearest-wins (AGENTS.md FAQ),
concatenate-with-later-override (Codex), concatenate-everything (Claude
Code, which then warns "If two files give different guidance for the same
behavior, Claude may pick one arbitrarily", https://code.claude.com/docs/en/memory.md
— "Troubleshoot memory issues"). Any scaffold hierarchy must pick one and say
so, because the ecosystem does not agree.

---

## 2. Monorepo state placement in real tooling (first-party docs)

**npm workspaces.**

- Workspaces = "managing multiple packages from your local file system from
  within a singular top-level, root package"; the root `package.json`'s
  `workspaces` field defines membership; per-package state (name, scripts,
  deps) stays in each package's `package.json`
  (https://docs.npmjs.com/cli/v10/using-npm/workspaces — "Description",
  "Defining workspaces", "Running commands in the context of workspaces").
- Context switching is directory-based: "if your current directory is in a
  workspace, the `workspace` configuration is implicitly set, and `prefix` is
  set to the root workspace" (same page).
- Scoped config is a four-tier cascade: per-project `.npmrc` → per-user →
  global → built-in, and `prefix` resolves to "the nearest parent folder
  containing either a package.json file or a node_modules folder"
  (https://docs.npmjs.com/cli/v10/using-npm/config — "npmrc Files",
  "prefix"). Repo-wide state at root, personal at user level, project-local
  overrides in the tree.

**pnpm workspaces.**

- "A workspace must have a `pnpm-workspace.yaml` file in its root. Its
  `packages` field lists the directories of the workspace's projects"
  (https://pnpm.io/workspaces — "Declaring a workspace"); "pnpm reads the
  workspace from `pnpm-workspace.yaml`, not from the `workspaces` field of
  the root `package.json`" (https://pnpm.io/settings — "packages").
- Repo-wide shared state lives in the root file: `sharedWorkspaceLockfile`
  (default true) puts "a single `pnpm-lock.yaml` file in the root of the
  workspace" (https://pnpm.io/workspaces — "sharedWorkspaceLockfile").
- Per-package config is **centralized in the root manifest**, not in
  per-package files: `packageConfigs` "Allows setting project-specific
  configuration for individual workspace packages … specified as a map of
  package names to config objects" or pattern rules
  (https://pnpm.io/settings — "packageConfigs"). This is the opposite shape
  from npm: one root file with per-package sections.

**Turborepo.**

- Root carries repo-wide state: root `package.json` (scripts like
  `"build": "turbo run build"`), a single lockfile, and root `turbo.json`
  ("used to configure the behavior of `turbo`"); each package carries its own
  `package.json` (name, scripts, exports) (https://turborepo.com/docs/crafting-your-repository/structuring-a-repository
  — "Minimum requirements", "Root `turbo.json`", "Anatomy of a package"; the
  page declares its canonical URL as
  https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository).
- The boundary model is stated plainly: "It's often best to start thinking
  about designing a package as its own unit within the Workspace … each
  package is almost like its own small 'project', with its own `package.json`,
  tooling configuration, and source code. There are limits to this idea—but
  its a good mental model to *start* from" (same page — "Anatomy of a
  package").
- Hard limit on nesting: "Turborepo does not support nested packages like
  `apps/**` or `packages/**`" — packages are one level deep, so per-package
  state cannot recurse (same page — "Specifying packages in a monorepo").

**Nx.**

- A project's configuration is constructed from three layers that each
  override the previous: plugin-inferred tasks, workspace `targetDefaults` in
  root `nx.json`, then per-project `package.json`/`project.json`
  (https://nx.dev/reference/project-configuration — intro).
- The workspace-vs-project scope table is the cleanest statement of the
  split in any tool's docs: Workspace = `/nx.json` + `/tsconfig.base.json`;
  Project = `/packages/myproject/package.json` +
  `/packages/myproject/tsconfig.json` (same page).
- The workspace boundary is read from package-manager state: "Any
  `package.json` file that is referenced by the `workspaces` property in the
  root `package.json` file will be included as a project in the graph … If
  you are using pnpm, projects defined in `pnpm-workspace.yml` will be
  included" (same page — "Including package.json files as projects in the
  graph").
- Projects carry scoping metadata used to enforce boundaries:
  `"tags": ["scope:myteam"]`, with lint rules that can "ensure that libraries
  belonging to `myteam` are not depended on by libraries belong[ing] to
  `theirteam`" (same page — "tags").

---

## 3. Docs-as-code and non-code repositories (first-party sources)

**ADR tooling — where decision records live.**

- adr-tools: "ADRs are stored in a subdirectory of your project as Markdown
  files. The default directory is `doc/adr`, but you can specify the
  directory when you initialise the ADR log"; the chosen directory is
  recorded in a root marker file `.adr-dir`
  (https://github.com/npryce/adr-tools/blob/master/README.md and
  `src/adr-init` @ `b3279baf9be2207d1a4f4bbd608fd0b591c72aee`). The tool's own
  decisions are stored in its own repo: "The decisions for this tool are
  recorded as architecture decision records in the project repository
  (`doc/adr/`)" (same README). One ADR log per project/repo; **no monorepo
  guidance exists in adr-tools**.
- MADR: the template is copied "into `docs/decisions`"
  (https://github.com/adr/madr/blob/develop/README.md
  @ `ba75bb1b20d42af5746b246ad348c202419ae681`; also "Create folder
  `docs/decisions` in your project" in `docs/index.md`, same SHA).
- MADR's own statement on large projects: "MADR does not enforce any
  repository or directory organization structure." Categories are optional
  subdirectories: "MADR logs may be categorized ADRs by defining
  subdirectories and put the ADRs into these folders. An exemplary folder
  structure might follow the architectural structure of the system under
  construction" (`decisions/backend/0001-use-quarkus.md`,
  `decisions/ui/0001-use-vuejs.md`). Consequence and the decision rule: "As a
  consequence, numbers of ADRs are no longer unique throughout the
  repository, but locally within a category only. Ideally, the ADR
  categorization [follows] the same organizing principles as other artifacts
  such as the code … This comes down to a meta-decision to be made rather
  early on" (https://github.com/adr/madr/blob/develop/docs/index.md — "Using
  MADR in large projects and product developments", @ same SHA).

**Kubernetes enhancements — proposals scoped to owning units.**

- The record-placement rule is explicit: "Do I put my KEP in the root KEP
  directory or a SIG subdirectory? — Almost all KEPs should go into SIG
  subdirectories. In very rare cases, such as KEPs about KEPs, we may choose
  to keep them in the root" (https://github.com/kubernetes/enhancements/blob/master/keps/README.md
  — FAQ, @ `ea3e81a0d41dd3df7dae584ea584c31de56cd3cb`).
- The directory layout follows the rule: `keps/` holds `NNNN-kep-template`,
  `OWNERS`, `prod-readiness`, and `sig-*` subdirectories
  (directory listing via https://api.github.com/repos/kubernetes/enhancements/contents/keps,
  same HEAD).
- Every record carries an owner in metadata: the template's `kep.yaml` has
  `owning-sig: sig-xyz` plus `participating-sigs`, `approvers`, `see-also`,
  and `replaces` fields; the template README's checklist says "Make a copy of
  this template directory. Copy this template into the owning SIG's directory
  and name it `NNNN-short-descriptive-title`"
  (https://github.com/kubernetes/enhancements/blob/master/keps/NNNN-kep-template/kep.yaml
  and `keps/NNNN-kep-template/README.md`, @ `ea3e81a0d41dd3df7dae584ea584c31de56cd3cb`).
  So: repo-wide process docs at root, records placed *inside* the owning
  unit's directory, ownership duplicated in metadata.

**Per-directory ownership as the general scoping mechanism (Kubernetes).**

- "Each directory that contains a unit of independent code **or content** may
  also contain an OWNERS file. This file applies to everything within the
  directory, including the OWNERS file itself, sibling files, and child
  directories"; aliases live in one repo-root `OWNERS_ALIASES` file; an
  `options: no_parent_owners` flag severs inheritance from parents
  (https://github.com/kubernetes/community/blob/main/contributors/guide/owners.md
  — "Overview", "OWNERS spec", "OWNERS_ALIASES",
  @ `6c7f904744192325668db7629e98c114cba15e0a`).
- The docs-only repo uses the same mechanism: kubernetes/website has a root
  `OWNERS` (approvers: `sig-docs-website-owners`, an alias defined in
  `OWNERS_ALIASES`) and a `content/en/OWNERS` scoping the English content
  with `language/en` label and `no_parent_owners: true` so "the localization
  team don't end up as approvers for English"
  (https://github.com/kubernetes/website/blob/main/OWNERS and
  `content/en/OWNERS`, @ `ed70e311737a341574ed5758b7af24e3bba232cb`).

**Non-code decision/writing repos.**

- rust-lang/rfcs is a writing/decision repo whose product *is* the record
  set: RFCs are numbered Markdown files at the flat repo root ("Copy
  `0000-template.md` to `text/0000-my-feature.md`"), while per-area
  *guidance* lives as sibling files scoped by sub-team rather than by
  directory ("Sub-team specific guidelines: language changes
  (`lang_changes.md`), library changes (`libs_changes.md`), compiler changes
  (`compiler_changes.md`)") (https://github.com/rust-lang/rfcs/blob/main/README.md
  — "What the process is", "Sub-team specific guidelines",
  @ `1dc48d761daaa2a0c80135d91f30d20ebdfb97b2`).
- github/docs (a docs-only repo) keeps management state at the repo level
  (`.github/CONTRIBUTING.md`, README pointing to it) while content is
  organized by product area ("content files (`.md` files in `/content` and
  select `/data` sections like reusables only)"), and splits repos by
  audience instead of by product: public `github/docs` vs private
  `github/docs-internal`, synced frequently (https://github.com/github/docs/blob/main/README.md
  — "Quick links by contributor type", "How we sync changes across Docs
  repositories", @ `9568e964d18d76267faf57050dc662c450a13214`).

---

## 4. This repo's scaffold — how the single-root assumption is written

**The inventory and its single root.**

- The bootstrapping inventory lists twelve pieces, all at fixed paths
  relative to one root: `AGENTS.md`, `CONTRIBUTING.md`, `README.md`,
  `CHANGELOG.md`, `GLOSSARY.md`, `conventions/`, `decisions/`, `specs/`,
  `plans/`, `tracker/` (5 files + `tickets/`)
  (`.opencode/skills/bootstrapping/SKILL.md` L42–54).
- The root is singular and per-run: "Paths are relative to the scaffold root:
  the project root, unless the user designates another location" (L39–40);
  "1. **Confirm the scaffold root.** Default: the project root" (L117). The
  command adds nothing: "Any text below is my direction for the run, such as
  a scaffold root other than the project root" (`.opencode/commands/bootstrap.md`
  L8).
- Every piece is one instance: `GLOSSARY.md` is "the project's shared
  language: one [file]" (`.opencode/skills/domain-modeling/references/glossary-format.md`
  L5); `specs/` holds "the project's design documents"
  (`.opencode/skills/specifying/references/spec-format.md` L5). There is no
  vocabulary for a *second* instance of any piece, nor for nesting scaffolds.

**Every creation template hardcodes "at the project root".**

- Templates: `spec-template.md` L3, `plan-template.md` L3,
  `glossary-template.md` L3, `doc-template.md` L3 ("Each document is created
  at the project root"), `changelog-template.md` L6, `tracking/references/template.md`
  L3, `codifying/references/conventions-template.md` L3 and
  `decisions-template.md` L3. Format references likewise: `spec-format.md`
  L5, `plan-format.md` L5, `glossary-format.md` L5, `doc-format.md` L5,
  `changelog.md` L5, `convention-format.md` L5, `decision-format.md` L5.
- `handoff` is pinned to the git repo regardless of any scaffold root:
  "HANDOFF.md at the repository root, committed when it changes"
  (`.opencode/skills/handoff/SKILL.md` L9; also L27, L73, L102).
- A grep across `.opencode/` finds **no monorepo, workspace, subproject, or
  per-package handling anywhere** — the only hits are unrelated (the Skills
  CLI's "package" manager in `find-skills/SKILL.md` L23–29, "package
  manifest" version detection in `bootstrapping/SKILL.md` L121 and
  `maintaining-docs/references/changelog.md` L20).

**What a per-package variant would break.**

- *Single-instance formats.* Each owning skill's format reference defines one
  piece for "the project"; nothing describes two glossaries, two trackers, or
  a tracker scoped to a subtree. `CONTRIBUTING.md`'s schema table (L33–40)
  and rule 1 "Where content goes" (L44–46) assume exactly this mapping.
- *The Deviations mechanism only relocates, never multiplies.* A piece "kept
  at another path" is a deviation to be settled by interview and recorded as
  a ruling (`bootstrapping/SKILL.md` L72–93) — but a deviation names a
  *different* path for the piece, not a rule like "each package has its own
  tracker/".
- *The only scoping knob is one alternate root per run* (`bootstrapping/SKILL.md`
  L39–40, L117). There is no hierarchy, no inheritance, no nearest-file
  resolution, and no per-directory discovery — none of the mechanisms every
  tool in §1 ships.
- *Cross-piece wiring assumes one root.* Routing rules point at root pieces:
  "The answer lands in the project's records" (`.opencode/skills/tracking/references/questions.md`
  L25–29, cited in `docs/research/knowledge-management-practice.md` L385–389);
  codifying routes settled rulings to `conventions/`/`decisions/` at the
  root; exploration reads `conventions/` before declaring deviations
  (`bootstrapping/SKILL.md` L80–82). None of these has a notion of *which*
  project the record belongs to — the root is the answer.
- *The ecosystem precedents this repo's own docs already absorbed* all say
  the same thing in their domains: one canonical glossary per project
  (`GLOSSARY.md`), one rules/instructions layer split by writer
  (`docs/research/knowledge-management-practice.md` L525–538, citing Codex's
  "Keep required team guidance in AGENTS.md or checked-in documentation").

---

## 5. Boundary patterns — what the sources, taken together, decide

- **Root holds cross-cutting; the unit holds local.** Every tool converges on
  a two-level split: root `CLAUDE.md` + one per package
  (https://code.claude.com/docs/en/large-codebases.md — "Layer CLAUDE.md
  files by directory"); root `nx.json`/`tsconfig.base.json` vs per-project
  config (https://nx.dev/reference/project-configuration); repo-root
  `OWNERS_ALIASES` + per-directory `OWNERS` (kubernetes/community owners.md,
  §3); root `turbo.json` + per-package `package.json`
  (https://turborepo.com/docs/crafting-your-repository/structuring-a-repository).
- **Ownership is directory-scoped, and the owner maintains their own
  conventions.** "Each directory's owner typically maintains its file"
  (large-codebases.md); OWNERS files exist per "unit of independent code or
  content" (owners.md); KEPs are copied "into the owning SIG's directory"
  with `owning-sig` in metadata (keps/NNNN-kep-template/README.md, kep.yaml).
  Ownership precedes format: the scaffold's question "does this package have
  its own owner?" is answerable by the same tests the ecosystem uses
  (per-directory OWNERS, per-package CLAUDE.md, Nx `tags: ["scope:myteam"]`).
- **Records split only when the code itself splits — and it is an early
  meta-decision.** MADR's only guidance on categories: mirror "the same
  organizing principles as other artifacts such as the code", and "This comes
  down to a meta-decision to be made rather early on" (adr/madr
  docs/index.md, §3). MADR defaults to one flat `docs/decisions/` log.
- **Shared vocabulary stays repo-wide; nothing in any first-party source
  gives a per-package glossary.** No tool ships a per-directory
  glossary-equivalent. The per-directory state in every tool is *instructions
  and ownership*, not terminology. Glossary precedent: one canonical
  glossary, one definition per term, repo-wide (this repo's
  `docs/research/knowledge-management-practice.md` §3, W3C GP10,
  https://www.w3.org/TR/qaframe-spec/).
- **Recall memory is keyed to the git repository, not the package.** Claude
  Code auto memory: "all worktrees and subdirectories within the same repo
  share one auto memory directory" (memory.md — "Storage location"). So an
  agentic scaffold can expect machine-local recall to be repo-scoped even
  when checked-in state is package-scoped.
- **Centralization is the fallback when per-directory layering fails.**
  Claude Code: "Centralize conventions when layering stops scaling" →
  plugins/MCP (large-codebases.md). pnpm centralizes per-package config in
  the root `pnpm-workspace.yaml` via `packageConfigs` (pnpm.io/settings).
  The shape to copy when N packages × M pieces gets ungovernable is: root
  file, per-package sections, one owner.
- **Docs and writing repos manage themselves like code repos, with content
  organized by area.** Docs-only repos keep repo-level management state
  (`CONTRIBUTING.md`, root `OWNERS`) and per-area scoping (`content/en/OWNERS`
  with `no_parent_owners: true`); decision/writing repos either put the
  records flat at root (rust-lang/rfcs `text/`) or in per-unit directories
  with owner metadata (KEPs). None requires code to host management state.

---

## Options table — scaffold placement by repository kind

| Repository kind | Placement options | Evidence |
| --- | --- | --- |
| **Single code repo** | (a) **Repo root, all pieces** — the current default and the ecosystem default. (b) One alternate root per run (user-designated), still a single scaffold. | Bootstrapping inventory + "Confirm the scaffold root. Default: the project root" (`bootstrapping/SKILL.md` L39–40, L42–54, L117); every template "at the project root" (§4); AGENTS.md "at the root of the repository" (https://agents.md/ — step 1); ADRs default `doc/adr` (adr-tools README) or `docs/decisions` (MADR). |
| **Monorepo with packages** | (a) **Root scaffold + per-package memory files** (root AGENTS.md/CLAUDE.md for repo-wide rules; per-package AGENTS.md/CLAUDE.md + per-package `.claude/skills/` for local conventions) — the only pattern with first-party precedent. (b) **Root scaffold + path-scoped rules in one central place** (`.claude/rules/` `paths:` frontmatter; Nx root `nx.json` `targetDefaults` + per-project overrides; pnpm `packageConfigs` in the root manifest). (c) **Full per-package scaffolds** — *no first-party precedent*; the closest analogs stop at per-package `package.json`/tool config (Turborepo "its own small 'project' … There are limits to this idea") and per-package CLAUDE.md, never a per-package tracker/glossary/decisions. (d) Recall memory stays repo-scoped regardless. | https://agents.md/ — step 4 + FAQ "closest wins"; https://code.claude.com/docs/en/large-codebases.md (two-level split, per-directory skills, `claudeMdExcludes`, centralize-when-scaling); https://code.claude.com/docs/en/memory.md ("How CLAUDE.md files load", "Storage location"); https://developers.openai.com/codex/agent-configuration/agents-md; https://docs.npmjs.com/cli/v10/using-npm/workspaces + /config; https://pnpm.io/workspaces + /settings; https://turborepo.com/docs/crafting-your-repository/structuring-a-repository; https://nx.dev/reference/project-configuration. |
| **Docs-only repo** | (a) **Root scaffold** (CONTRIBUTING, README, decisions log in `docs/decisions` or `doc/adr`) — standard. (b) **Per-area ownership + labels over per-area content** (OWNERS per content directory, root `OWNERS_ALIASES`; per-language `no_parent_owners`). Content organized by product/area; management state stays at repo level. | github/docs README (`/content` + `.github/CONTRIBUTING.md`, @ `9568e964…`); kubernetes/website `OWNERS` + `content/en/OWNERS` (@ `ed70e311…`); kubernetes/community owners.md (@ `6c7f9047…`); MADR "Create folder `docs/decisions`" (adr/madr @ `ba75bb1b…`). |
| **Research/writing repo** | (a) **Records flat at repo root** with per-area *guidance* files — the record set is the product (Rust RFCs: `text/NNNN-*.md` flat, `lang_changes.md` etc. per sub-team). (b) **Records in per-unit directories + owner metadata** (KEPs: `keps/sig-*/` with `owning-sig` in `kep.yaml`). (c) **Optional category subdirectories mirroring the work's own structure** (MADR categories), decided early. | rust-lang/rfcs README (@ `1dc48d76…`); kubernetes/enhancements `keps/README.md` FAQ + `keps/NNNN-kep-template/kep.yaml` (@ `ea3e81a0…`); adr/madr docs/index.md "Using MADR in large projects" (@ `ba75bb1b…`). |

**Reading the table for the design question:** the ecosystem's answer to
"where does per-project state live" is (1) root for anything shared or
cross-cutting — glossary, repo-wide conventions, the tracker if work spans
packages — and (2) per-directory only for *instructions and ownership*, with
a documented conflict model (nearest-wins vs concatenation) and a documented
centralization escape hatch. No first-party source places tracker-like or
glossary-like records per package; when records do subdivide (KEPs, MADR
categories), the split mirrors the code's own organization and the owner is
named in the record's metadata.
