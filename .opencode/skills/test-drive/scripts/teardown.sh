#!/usr/bin/env bash
# Remove every test-drive container and image — the provisioned image holds the
# injected credential copy — then verify nothing remains. Exits nonzero if any
# artifact survives, so a broken teardown is detectable, never silent.
set -euo pipefail
. "$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

echo "== remove containers =="
for c in $(podman ps -aq --filter ancestor=localhost/graph-engine-sandbox:provisioned 2>/dev/null); do
  podman rm -f "$c" || true
done
podman rm -f provision-tmp 2>/dev/null || true

echo "== remove images (provisioned = credential copy) =="
podman rmi -f localhost/graph-engine-sandbox:provisioned \
              localhost/graph-engine-sandbox:base 2>/dev/null || true
podman image prune -f >/dev/null 2>&1 || true

echo "== verify empty =="
fail=0
if podman ps -a | grep -q graph-engine-sandbox; then
  echo "FAIL: containers remain"; podman ps -a | grep graph-engine-sandbox; fail=1
fi
if podman images | grep -q graph-engine-sandbox; then
  echo "FAIL: images remain"; podman images | grep graph-engine-sandbox; fail=1
fi
if [ "$fail" = 0 ]; then
  echo "TEARDOWN CLEAN"
else
  exit 1
fi