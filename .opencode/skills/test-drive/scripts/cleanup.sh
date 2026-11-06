#!/usr/bin/env bash
# Idempotent forced cleanup — the escape hatch after any interrupted run.
# Same sweep as teardown.sh, fireable at any time: removes every test-drive
# container and image (by name/image and by ownership label, catching dangling
# layers), clears the workspace that may hold forensic credential copies, and
# verifies empty. Never touches host processes or non-harness podman artifacts.
set -euo pipefail
. "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/lib.sh"

sweep cleanup