# Agent instructions

Before doing anything else in this repository, read `INVARIANTS.md` in full.

It contains hard rules. Check every proposed tool, endpoint, state, or
abstraction against those rules before implementing or changing anything. If a
proposal conflicts with an invariant, stop and raise the conflict instead of
proceeding.

## Running the test gate

Node is provided by `fnm`, not on `PATH`, so prefix with `fnm exec --using=default --`.

- `fnm exec --using=default -- node --test 'engine/test/*.test.mjs' 'dashboard/test/*.test.mjs' 'installer/test/*.test.mjs'`
- `fnm exec --using=default -- node engine/live-proof.mjs` — in-process engine + plugin + RPC proof with a scripted model.
- `sh installer/test/install.test.sh` — the installer shell suite (build/install/uninstall/config-merge).
- `installer/live-e2e.sh` — build → install → real OpenCode server + real model: dispatch to terminal, then the Engineer's `graph_info`/`reload`.

## Live (real-model) verification — hard-won rules

1. Provider credentials live in OpenCode's **DATA-directory database**
   (`$XDG_DATA_HOME/opencode/opencode.db`, default `~/.local/share/opencode/opencode.db`)
   and are surfaced by `opencode auth list` — they are **not** in environment
   variables and **not** in the OS keyring. `env | grep API_KEY` proves nothing.
2. To test against the real model, isolate **only** `XDG_CONFIG_HOME` (point it
   at the installed archive's config) and pass `--standalone`. Do **not**
   override `HOME`, `XDG_DATA_HOME`, `XDG_CACHE_HOME`, `XDG_STATE_HOME`, or
   `OPENCODE_TEST_HOME`: that hands the server a fresh, credential-less database,
   and every pinned model then fails with `ModelUnavailableError` — while
   interactive sessions still "work" by silently falling back to the built-in
   credential-free default provider, which hides the real cause. This exact
   mistake already produced a false "model unavailable" verdict once; do not
   repeat it.
3. `opencode models` lists only the default provider's models. Inspect the full
   catalog with `opencode api get /api/model` before concluding a model is gone.
4. A graph agent that declares a `model` pins its node sessions to it and they
   do **not** fall back; an agent without one — which is every shipped agent
   today — inherits the session default. So `ModelUnavailableError` from a node
   is a credential/catalog problem, never a code path that stopped working.