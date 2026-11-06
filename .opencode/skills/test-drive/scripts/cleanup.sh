#!/usr/bin/env bash
# Idempotent forced cleanup. Alternative to the meticulous wrapup+teardown path,
# for when information gathering is not the priority: a run was interrupted
# partway and leaks must be plugged. Removes every test-drive container and
# image (the provisioned image holds the injected credential copy), clears the
# workspace (which may hold forensic copies of the seeded database), and
# verifies nothing survives. Safe to run at any time, any number of times; never
# touches host processes or unrelated podman artifacts.
set -euo pipefail
. "$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

echo "== remove harness containers (any image, any state) =="
mapfile -t CIDS < <(podman ps -a --format '{{.ID}}\t{{.Image}}' 2>/dev/null \
  | awk -F'\t' '$2 ~ /graph-engine-sandbox/ {print $1}')
for c in "${CIDS[@]:-}"; do
  [ -z "$c" ] && continue
  echo "removing container $c"
  podman rm -f "$c" 2>/dev/null || true
done
# Name fallbacks for any interruption state this harness has ever produced.
podman rm -f provision-tmp sandbox-seat 2>/dev/null || true

echo "== remove harness images (provisioned = credential copy) =="
podman rmi -f localhost/graph-engine-sandbox:provisioned \
              localhost/graph-engine-sandbox:base 2>/dev/null || true
podman image prune -f >/dev/null 2>&1 || true

echo "== clear workspace (archive, seat launcher, forensics copies) =="
rm -rf "${WORK:-/tmp/opencode}"

echo "== verify empty =="
fail=0
if podman ps -a | grep -q graph-engine-sandbox; then
  echo "FAIL: containers remain"; podman ps -a | grep graph-engine-sandbox; fail=1
fi
if podman images | grep -q graph-engine-sandbox; then
  echo "FAIL: images remain"; podman images | grep graph-engine-sandbox; fail=1
fi
if [ "$fail" = 0 ]; then
  echo "CLEANUP CLEAN"
else
  exit 1
fi