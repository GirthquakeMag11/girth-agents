#!/usr/bin/env bash
# Read-only status: what seats, containers, and images currently exist for the
# test-drive. Safe to run at any time.
set -euo pipefail
. "$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

echo "== seats (provisioned image, any state) =="
podman ps -a --filter ancestor=localhost/graph-engine-sandbox:provisioned \
  --format '{{.Names}} {{.State}} {{.CreatedAt}}' 2>/dev/null || echo "(none)"

echo "== all running containers =="
podman ps --format '{{.Names}} {{.Image}} {{.Status}}' 2>/dev/null || echo "(none)"

echo "== test-drive images =="
podman images 2>/dev/null | grep graph-engine-sandbox || echo "(none)"