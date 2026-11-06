#!/usr/bin/env bash
# Wait for the launched seat to end. Blocks until the seat's opencode process
# exits; the return is the trigger for wrapup.sh, then teardown.sh, with no
# further user signal. Idempotent: against an already-ended seat it returns
# immediately. Observes only — it does not tear anything down.
set -euo pipefail
. "$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

SEAT=$(latest_seat)
[ -n "$SEAT" ] || { echo "FAIL: no seat container exists; run launch.sh first" >&2; exit 1; }

echo "wait: seat $SEAT — blocking until its opencode process ends (quitting the TUI ends it)"
podman wait "$SEAT" >/dev/null

state=$(podman inspect "$SEAT" --format '{{.State.Status}}' 2>/dev/null || echo unknown)
code=$(podman inspect "$SEAT" --format '{{.State.ExitCode}}' 2>/dev/null || echo unknown)
echo "seat ended: $SEAT ($state, exit $code)"
