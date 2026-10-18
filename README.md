# girth-agents

A catalog of [OpenCode V2](https://opencode.ai) agents, skills, and slash
commands — written in plain Markdown, developed *in* this repository, and
installed into `~/.config/opencode/` with one script.

## Install

```sh
git clone https://github.com/<your-github-user>/girth-agents.git
cd girth-agents
./scripts/install.sh
```

The script symlinks each item into your OpenCode global config:

| Artifact | Source | Installed to |
| --- | --- | --- |
| Agents | `.opencode/agents/*.md` | `~/.config/opencode/agents/` |
| Skills | `.opencode/skills/<id>/` | `~/.config/opencode/skills/<id>/` |
| Commands | `.opencode/commands/*.md` | `~/.config/opencode/commands/` |

Because the items are symlinks, `git pull` updates everything in place.
Start a new OpenCode session and the catalog is live.

<details>
<summary>Alternatives and uninstalling</summary>

- **No symlinks (Windows, unusual filesystems):** `./scripts/install.sh --copy`
  copies instead — re-run it after updates.
- **Skills only, via config:** skip the installer and point the `skills` array
  at this checkout in your global `opencode.json(c)`:

  ```jsonc
  "skills": ["/path/to/girth-agents/.opencode/skills"]
  ```

- **Uninstall:**

  ```sh
  find ~/.config/opencode -type l -lname '*girth-agents*' -delete
  ```

  (For copies, delete the files you copied.)
</details>

## Catalog

### Agents

| Agent | Use it when |
| --- | --- |
| 🚧 — first agents land here shortly | |

### Skills

| Skill | Use it when |
| --- | --- |
| `bootstrapping` | Setting up (or patching) a project's management scaffold — AGENTS.md, CONTRIBUTING.md, GLOSSARY.md, README.md, CHANGELOG.md, the tracker files, conventions/ — either a full bootstrap or a single missing piece |
| `tracking` | Recording items for later in `tracker/` — hazards, bugs, defects, features, questions — with the rules for when to act now instead, so a task stays on course and nothing is lost |
| `conventions` | Recording and organizing user rulings — guidelines, rules, procedures, preferences — as `On_<Domain>.md` files under `conventions/`; asking before integrating statements that only sound like rulings |
| `maintaining-docs` | Writing and keeping current the three standard documents: AGENTS.md (new agents orient immediately), CONTRIBUTING.md (new agents learn the protocols for changing project content), README.md (new humans get up to speed with the project and its current state) |
| `maintaining-glossary` | Building the project's shared language in `GLOSSARY.md` — challenging conflicting terms, sharpening vague ones, recording each term the moment the user settles it, with rejected synonyms |
| `maintaining-changelog` | Recording user-visible changes in `CHANGELOG.md` at change time, written for the reader (what changed, why it matters, what to do), and cutting releases when the user asks |

### Commands

| Command | What it does |
| --- | --- |
| 🚧 — first commands land here shortly | |

## Contributing

- `docs/CONTRIBUTING.md` — how to add agents, skills, and commands; the
  publishing rules; the tooling.
- `AGENTS.md` — the same rules, written for an OpenCode agent working on this
  repo.
- `scripts/validate.mjs` — the linter that enforces the rules
  (`node scripts/validate.mjs`).

## License

MIT — see [LICENSE](LICENSE).