# Graph Engine

An OpenCode plugin that runs a graph of agent nodes. The user's interactive
agent dispatches work into the graph; each non-terminal node's graph agent does
its work and hands a message to exactly one next target, while a terminal node
ends after its session succeeds. One graph, one active dispatch at a time, a
FIFO queue behind it.

## Status

**ALPHA.** The current version is **0.5.0 ALPHA**.

The name, version, and stage are not hardcoded anywhere downstream; they come
from one place and are read at build time:

- `engine/version.mjs` — `PRODUCT_NAME`, `PROJECT_VERSION`, `PRODUCT_STAGE`
- `product.conf` — the archive's copy of the same values

`installer/build-archive.sh` cross-checks that the two agree before packaging.

## Install

```sh
installer/build-archive.sh                  # stages dist/graph-engine-<version>.tar.gz
sh dist/install.sh --archive dist/graph-engine-<version>.tar.gz \
                   --checksum dist/graph-engine-<version>.tar.gz.sha256
```

`install.sh` installs the plugin into OpenCode's global configuration and,
once, a user-owned graph. It writes an uninstaller and a checksum manifest.

## Graph

The one graph is a JSON config plus Markdown agent, node, and skill documents
discovered by directory (`graph/config.json`, `graph/agents/`, `graph/nodes/`,
`graph/skills/`). The interactive agent drives it with `dispatch`,
`dispatch_status`, `dispatch_cancel`, `graph_info`, `graph_map`, and `reload`.

The dashboard opens as a read-only full-screen view showing the configured
graph, workflow engagement, active and queued dispatches, Details, and a
bounded History. Open it with `Alt+G`, or from the command palette
(`Ctrl+P` → "Open graph dashboard"); `Esc` returns to the home view.

## Documentation

- `graph/skills/graph-authoring.md` — the authoritative schema and reload
  contract.
- `graph/skills/dispatching.md` — how to dispatch work into the graph.
- `INVARIANTS.md` — hard design rules. Check before adding a tool or endpoint.
- `ROADMAP.md` — open work only; shipped work lives in git history.
- `AGENTS.md` — the test gate and live-verification rules for working in this
  repository.