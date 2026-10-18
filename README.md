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

There are two kinds of skill. **Owners** each define one scaffold piece:
what belongs in it and its format. **Activities** are what the agent does
with the pieces; they own none. The agent reaches for each on its own when
the situation fits.

| Owner | Defines |
| --- | --- |
| `glossary` | `GLOSSARY.md` — the shared language: what things are |
| `conventions` | `conventions/On_<Domain>.md` — your rulings on how things are done |
| `decisions` | `decisions/NNNN-<slug>.md` — why the project is shaped the way it is |
| `tracker` | `tracker/` — hazards, bugs, defects, features, open questions, and `tickets/` |
| `docs` | `AGENTS.md`, `CONTRIBUTING.md`, `README.md` — each for its reader |
| `changelog` | `CHANGELOG.md` — what changed, for the project's users |
| `specs` | `specs/<slug>.md` — one design document per effort |
| `plans` | `plans/<slug>.md` — one live map per big, foggy effort |

| Activity | Use it when |
| --- | --- |
| `bootstrapping` | Creating the scaffold, whole or one missing piece |
| `tracking` | Something comes up that cannot be dealt with now but must not be lost: an obstacle, a bug, a smell, a feature request, an open question; or picking up or closing a tracked item |
| `codifying` | You say what something means, how something is done, or why the project takes a shape — or say something that might be one, in which case the agent asks before recording it |
| `maintaining-docs` | The project's structure, protocols, or state change; after any user-visible change; or when you ask for a release |
| `specifying` | A settled design needs writing down as a spec |
| `implementing` | You ask to build something planned — a spec, feature, bug, or defect — and the agent slices it into tickets and works them one at a time |
| `wayfinding` | An effort is too big or too foggy to spec — the agent charts a live map and resolves its decisions one at a time |
| `retro` | After a session, the agent reviews the environment and proposes improvements, each routed to its home |
| `prototyping` | A design question needs making concrete — the agent builds throwaway code that answers it and captures the verdict |
| `wizard` | A procedure only a human can do — the agent generates a step-by-step script that walks them through it |
| `grilling` | A decision or plan needs working through with you — the agent walks the design tree one round of questions at a time |
| `handoff` | A session needs continuing elsewhere — the agent writes a handoff document that references, never duplicates |
| `diagnosing-bugs` | Something is broken and the cause is not obvious |
| `tdd` | Work that should be built or locked down test-first |
| `code-review` | A branch, PR, or work-in-progress change needs reviewing |
| `codebase-design` | A module's interface, seam, or depth is being designed or judged |
| `research` | A question needs facts from primary sources |

### Commands

| Command | What it does |
| --- | --- |
| `/bootstrap` | Runs a full bootstrap: explores the project, asks you one round of questions with recommended answers, and creates every missing scaffold piece. Text after the command is passed along |
| `/spec` | Turns the current conversation into a spec for your approval |
| `/implement` | Implements something planned — a spec, feature, bug, or defect — slicing it into tickets if needed, with one checkpoint on the blocking edges before work begins |
| `/wayfind` | Charts a big, foggy effort as a live map and works its decisions until the way forward is clear |
| `/retro` | Reviews a session and proposes environment improvements, most severe first |
| `/handoff` | Writes a handoff document for a fresh agent to pick up the conversation |
| `/wait-what` | Re-pitches the last message that didn't land, in plain English using the glossary's terms |

## Contributing

- `docs/CONTRIBUTING.md` — how to add agents, skills, and commands; the
  publishing rules; the tooling.
- `AGENTS.md` — the same rules, written for an OpenCode agent working on this
  repo.
- `scripts/validate.mjs` — the linter that enforces the rules
  (`node scripts/validate.mjs`).

## License

MIT — see [LICENSE](LICENSE).