#!/usr/bin/env bash
# Preflight: verify the project and every dependency the test-drive relies on.
# Never installs or modifies anything. Exits nonzero on a hard failure; prints
# WARN lines for soft observations. See references/README.md for remediation.
set -euo pipefail
. "$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

fails=0
ok()   { echo "ok   $*"; }
note() { echo "FAIL $*"; fails=$((fails + 1)); }

echo "== project =="
ok "repo $REPO"
for t in bash tar curl awk sed find git; do
  command -v "$t" >/dev/null 2>&1 || note "missing tool: $t"
done
command -v sha256sum >/dev/null 2>&1 || command -v shasum >/dev/null 2>&1 \
  || note "missing checksum tool (sha256sum or shasum)"

echo "== podman =="
command -v podman >/dev/null 2>&1 || note "missing podman"
podman info >/dev/null 2>&1 || note "podman not functional"
if podman unshare true 2>/dev/null; then
  ok "rootless userns"
else
  note "rootless userns (podman unshare failed) — subuid/subgid not set up"
fi
if [ "$(stat -fc %T /sys/fs/cgroup 2>/dev/null)" = "cgroup2fs" ]; then
  ok "cgroups v2"
else
  note "cgroups not v2 — pids/memory limits will not enforce"
fi
podman info 2>/dev/null | grep -q -- '- pids' \
  && ok "pids controller" || echo "WARN pids controller not reported"
if podman info 2>/dev/null | awk '/ociRuntime:/{f=1} f&&/name:/{print $2; exit}' | grep -q crun; then
  ok "crun runtime"
else
  note "container runtime is not crun"
fi

echo "== opencode =="
if [ -x "${OC:-}" ]; then
  ok "opencode at $OC"
  "$OC" auth --help 2>/dev/null | grep -q 'export' || note "opencode missing 'auth export'"
  "$OC" auth --help 2>/dev/null | grep -q 'import' || note "opencode missing 'auth import'"
  "$OC" run --help 2>/dev/null | grep -q -- '--standalone' || note "opencode missing --standalone"
else
  note "opencode binary not found (PATH, ~/.opencode/bin, or OPENCODE_BIN)"
fi

echo "== seat =="
[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ] && ok "display" || note "no graphical display (X11/Wayland)"
[ -n "$TERM_CMD" ] && ok "terminal: $TERM_CMD" || note "no supported terminal emulator"

if [ -f "$LOCAL_NOTES" ]; then
  echo "== local notes (this machine) =="
  cat "$LOCAL_NOTES"
fi

echo
if [ "$fails" = 0 ]; then
  echo "PREFLIGHT PASS"
else
  echo "PREFLIGHT FAIL ($fails)"
  exit 1
fi