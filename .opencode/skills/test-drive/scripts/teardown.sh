#!/usr/bin/env bash
# Meticulous-path teardown: after wrapup.sh has produced its verdict, remove
# every test-drive artifact — containers, the labeled images (including the
# credential-bearing provisioned image and any dangling layer), and the
# workspace that holds the forensic credential copies — and verify nothing
# survives. Exits nonzero if podman is nonfunctional or any artifact remains.
set -euo pipefail
. "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/lib.sh"

sweep teardown