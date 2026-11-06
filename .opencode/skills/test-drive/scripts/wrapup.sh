#!/usr/bin/env bash
# After the user closes the TUI: report the seat's state, scan its log, and
# pull forensics. Does NOT tear down — run teardown.sh after reading this.
set -euo pipefail
. "$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

SEAT=$(podman ps -a --filter ancestor=localhost/graph-engine-sandbox:provisioned \
  --format '{{.Names}}' 2>/dev/null | sed -n 1p)
[ -n "$SEAT" ] || { echo "FAIL: no provisioned seat container exists; nothing to wrap up"; exit 1; }
echo "seat: $SEAT"

echo "== state (must be Exited; Running = red flag) =="
podman ps -a --filter ancestor=localhost/graph-engine-sandbox:provisioned \
  --format '{{.Names}} {{.State}}'

echo "== log scan =="
if podman cp "$SEAT:/root/.local/share/opencode/log/opencode.log" "$WORK/seat-opencode.log" 2>/dev/null; then
  echo "-- ERROR lines --"
  grep 'level=ERROR' "$WORK/seat-opencode.log" || echo "(none)"
  echo "-- counts --"
  echo "ModelUnavailableError            : $(grep -c 'ModelUnavailableError' "$WORK/seat-opencode.log" || true)"
  echo "pinned deepseek served           : $(grep -c 'openrouter/~deepseek/deepseek-flash-latest' "$WORK/seat-opencode.log" || true)"
  echo "models.dev fetches mentioned     : $(grep -c 'models.dev' "$WORK/seat-opencode.log" || true)"
else
  echo "WARN: no opencode.log existed in the seat"
fi

echo "== forensics =="
podman cp "$SEAT:/root/.local/share/opencode" "$WORK/seat-share"
podman cp "$SEAT:/root/.local/state/opencode" "$WORK/seat-state"
echo "forensics: $WORK/seat-share, $WORK/seat-state"