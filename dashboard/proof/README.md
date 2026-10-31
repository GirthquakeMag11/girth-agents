# Dashboard proof artifacts

These are evidence artifacts, not runtime inputs for the plugin.

## Live engine proof

Command used from the repository root:

```sh
node dashboard/proof/live.mjs 2>&1 | tee dashboard/proof/live-proof.log
```

It uses the runnable boundary fixtures:

- `dashboard/fixtures/live-boundary.json` — non-strict A/B boundary with a node escape.
- `dashboard/fixtures/live-boundary-strict.json` — the same boundary with `A.strict: true`.

The proof creates separate scratch workspaces, starts the real engine and
handoff plugin, pauses the queue to exercise queued workflow mains and a
queued node dispatch without model calls, resumes for the active main →
connected → escape path, verifies the strict `workflow.escape` defect, and
reloads a changed graph through the dashboard data adapter.

Artifacts:

- `live-proof.log` — command output.
- `live-proof.json` — structured observed rows.

The product graph also has a short live run log at `product-live.log`; its
snapshot was retired when the panel gained structured History and the
split right column.

## Panel captures

The captures come from the actual native `DashboardView` in
`dashboard/src/view.tsx`, not a separate drawing script. The harness at
`dashboard/proof/panel.tsx` supplies fixed engine history and freezes
`Date.now` at each case's `fetchedAt`; `TZ=UTC` makes History and updated
timestamps deterministic.

The toolchain used was installed under `/tmp/opencode` for this run. The
build and capture commands were:

```sh
# Build the static panel harness with esbuild-plugin-solid.
node /tmp/opencode/build-proof.mjs

# Capture the four History/Details states.
/tmp/opencode/node-v26.13.0-linux-x64/bin/node /tmp/opencode/tui/panel-proof.mjs
```

The committed captures are:

- `history-active-160x50.txt` — split right column, populated History, live Details.
- `history-idle-160x50.txt` — split right column, populated History, empty Details.
- `history-active-120x40.txt` — split layout at the 120×40 size.
- `history-strip-80x24.txt` — one-line History strip above the unchanged Run console.

## Motion renderer proof

The motion harness uses the client Solid build so `onMount`/`createEffect`
run, then renders a new handoff and a self-handoff:

```sh
node /tmp/opencode/build-motion-proof.mjs
/tmp/opencode/node-v26.13.0-linux-x64/bin/node /tmp/opencode/tui/motion-proof.mjs
```

The script asserts a handoff produces a visible `◆` and a self-handoff
produces none. Captures:

- `motion-runner-160x50.txt`
- `motion-self-160x50.txt`

The older `product-*`, `live-boundary-*`, and `strict-*` captures and their
snapshots were removed because they showed the old single full-height
Details pane.
