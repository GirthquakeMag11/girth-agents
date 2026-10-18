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

The skills manage a **project scaffold**: a set of files in your project's
repository that act as its memory across sessions and agents.

| Piece | Path | Managed by |
| --- | --- | --- |
| Agent orientation, contributor protocols, readme, changelog | `AGENTS.md`, `CONTRIBUTING.md`, `README.md`, `CHANGELOG.md` | `maintaining-docs` |
| Shared language and significant decisions | `GLOSSARY.md`, `decisions/` | `domain-modeling` |
| Your rulings on how things are done | `conventions/On_<Domain>.md` | `conventions` |
| Hazards, bugs, defects, features, open questions | `tracker/*.md` | `tracking` |

The agent reaches for each skill on its own when the situation fits.

| Skill | Use it when |
| --- | --- |
| `bootstrapping` | Creating the scaffold, whole or one missing piece |
| `tracking` | Something comes up that cannot be dealt with now but must not be lost: an obstacle future agents will hit again, a bug, a code smell, a feature request, an open question; or picking up or closing a tracked item |
| `conventions` | You say how something in the project is or should be done — or say something that might be such a ruling, in which case the agent asks before recording it |
| `domain-modeling` | Project terminology is being settled, disputed, or changed, or a hard-to-reverse design decision is made |
| `maintaining-docs` | The project's structure, protocols, or state change; after any user-visible change; or when you ask to cut a release |

### Commands

| Command | What it does |
| --- | --- |
| `/bootstrap` | Runs a full bootstrap: explores the project, asks you one round of questions with recommended answers, and creates every missing scaffold piece. Text after the command is passed along, e.g. a scaffold location other than the project root |

## Contributing

- `docs/CONTRIBUTING.md` — how to add agents, skills, and commands; the
  publishing rules; the tooling.
- `AGENTS.md` — the same rules, written for an OpenCode agent working on this
  repo.
- `scripts/validate.mjs` — the linter that enforces the rules
  (`node scripts/validate.mjs`).

## License

MIT — see [LICENSE](LICENSE).