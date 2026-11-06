---
description: Cancel an in-flight test-drive — force idempotent cleanup, then verify
---

Load the `test-drive` skill for context (if not already loaded), then run its
`scripts/cleanup.sh`
(the idempotent forced cleanup). Do not stop at its exit code: afterwards,
verify manually and independently, and report the literal output of each:

- `podman ps -a`
- `podman images`
- `podman images --filter "label=io.girth-agents.testdrive=1"`
- the workspace directory (default `/tmp/opencode/testdrive`, or `$TESTDRIVE_WORK` if set)

Check specifically for any container named `provision-tmp` or `seat-*`, any
image containing `graph-engine-sandbox`, anything carrying the ownership label,
any `<none>`/dangling layer, and the workspace still present. Host `opencode`
processes are this session's development environment — do not count them.

Report `CANCELLED CLEAN` only when every check shows nothing. If cleanup.sh's
own sweep missed anything, report exactly what remains and do not claim clean.