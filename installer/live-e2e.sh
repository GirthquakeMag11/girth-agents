#!/bin/sh
# Live end-to-end verification against a real OpenCode server and a real model.
# This is the "real dispatch to terminal" release-gate check: build the
# archive, install it into an isolated config directory, then drive the real
# opencode binary through your own authenticated model provider.
#
# CRITICAL — the isolation rule (a trap this repository already hit once):
#
#   OpenCode stores provider credentials in its DATA-directory database
#   ($XDG_DATA_HOME/opencode/opencode.db, default ~/.local/share/opencode/opencode.db),
#   surfaced via `opencode auth` — NOT in environment variables and NOT in the
#   OS keyring. If this script (or any live test) also overrides HOME,
#   XDG_DATA_HOME, XDG_CACHE_HOME, XDG_STATE_HOME, or OPENCODE_TEST_HOME, the
#   isolated server gets a fresh, credential-less database and every pinned
#   model fails with `ModelUnavailableError`. Interactive sessions then still
#   appear to work (OpenCode falls back to its built-in credential-free
#   default provider), which masks the real cause.
#
#   So: isolate ONLY XDG_CONFIG_HOME (point it at the installed archive's
#   config), keep HOME and the data directory real, and use `--standalone` so
#   the run neither clashes with the running managed service nor is decided by
#   its stale config. Run from a scratch project directory so any proof files
#   the graph writes land there, not in the repository.
#
# This makes real, paid model calls. Keep the prompts tiny.
#
# Usage:
#   OPENCODE_BIN=$HOME/.opencode/bin/opencode installer/live-e2e.sh
#   KEEP=1 OPENCODE_BIN=... installer/live-e2e.sh   # retain the scratch dir

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
OC=${OPENCODE_BIN:-$HOME/.opencode/bin/opencode}
TOKEN="live-e2e-ok"

W=$(mktemp -d "${TMPDIR:-/tmp}/live-e2e-XXXXXX")
cleanup() {
  if [ "${KEEP:-0}" = "0" ]; then
    rm -rf "$W"
  else
    echo "kept scratch dir: $W" >&2
  fi
}
trap cleanup 0

command -v "$OC" >/dev/null 2>&1 || { echo "live-e2e: opencode binary not found: $OC (set OPENCODE_BIN)" >&2; exit 2; }

echo "== build =="
DIST_DIR="$W/dist" sh "$ROOT/installer/build-archive.sh" >/dev/null
ARCH="$W/dist/graph-engine-0.5.0.tar.gz"

mkdir -p "$W/xdg/opencode" "$W/proj"
echo "== install (config only - credentials stay in the real data dir) =="
sh "$W/dist/install.sh" --archive "$ARCH" --checksum "$ARCH.sha256" --config-dir "$W/xdg/opencode" --yes >/dev/null

# The one and only override: XDG_CONFIG_HOME. Everything else stays real so the
# OpenRouter/NanoGPT credentials in the data directory resolve.
run_oc() {
  env XDG_CONFIG_HOME="$W/xdg" NO_COLOR=1 "$OC" "$@"
}

echo "== dispatch: conductor -> build-review -> terminal =="
cd "$W/proj"
run_oc run --standalone --agent conductor \
  "Dispatch the build-review workflow to create a file named proof.txt in the current directory containing exactly the token: $TOKEN" \
  > "$W/conductor.out" 2>&1

if grep -qF "$TOKEN" "$W/proj/proof.txt" 2>/dev/null && [ "$(tr -d '\n' < "$W/proj/proof.txt")" = "$TOKEN" ]; then
  echo "PASS  workflow reached a terminal and wrote proof.txt = $TOKEN"
else
  echo "FAIL  proof.txt missing or wrong content" >&2
  cat "$W/conductor.out" | grep -vE "level=(INFO|DEBUG)" >&2 || true
  echo "        proof.txt: [$(cat "$W/proj/proof.txt" 2>/dev/null)]" >&2
  exit 1
fi

echo "== engineer tools: graph_info + reload =="
run_oc run --standalone --agent engineer \
  "Call graph_info, then call reload. Then report the workflow id and whether reload said the graph is valid. Keep it to three lines." \
  > "$W/engineer.out" 2>&1

if grep -qF "build-review" "$W/engineer.out"; then
  echo "PASS  engineer ran graph_info and reload against the live graph"
else
  echo "FAIL  engineer did not report the graph" >&2
  grep -vE "level=(INFO|DEBUG)" "$W/engineer.out" >&2 || true
  exit 1
fi

echo ""
echo "LIVE E2E PASS"