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
| `tracking-hazards` | Recording hazards in `tracker/HAZARDS.md` — obstacles outside the project's scope to fix, surprising dependency behavior, or disproven domain assumptions that would trap a future agent again |
| `tracking-bugs` | Triaging and tracking bugs in `tracker/BUGS.md` — fix blocking or trivially obvious bugs in flight, track the rest with full detail and a log of work already done so any agent can pick them back up |
| `tracking-defects` | Tracking defects in `tracker/DEFECTS.md` — bad but not broken: code smells and convention/design-principle violations; same mechanics as bugs |
| `tracking-features` | Tracking features in `tracker/FEATURES.md` — user-requested entries, user-approved closure, relationship reconciliation on every create and close |
| `tracking-questions` | Tracking questions in `tracker/QUESTIONS.md` — ask blocking questions immediately; track the rest with a recorded provisional decision, then apply the ruling to the affected work when it lands |
| `conventions` | Recording and organizing user rulings — guidelines, rules, procedures, preferences — as `On_<Domain>.md` files under `conventions/`; asking before integrating statements that only sound like rulings |

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