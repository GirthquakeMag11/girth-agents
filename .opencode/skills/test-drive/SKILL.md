---
name: Test Drive
description: Test-drive a release of the girth-agents project in an isolated throwaway container — install it cleanly, drive it like an end user, then tear it down leaving no process and no credential copy behind.
---

# girth-agents sandbox test-drive

This skill belongs to the **girth-agents** repository and exists to test-drive a
release of this project. It is not a general OpenCode skill. It relies on an
isolated rootless-podman container so a broken release cannot touch the
development machine.

You have `shell`. Execute the exact commands in `references/commands.md`; do not
improvise the podman flow. The workspace is `/tmp/opencode` (outside the repo).

## Locating the project

OpenCode's working directory may be anything — **do not assume it is the
repository**. The repository root is derived from this skill's own directory
(the skill loader reports its base directory). `references/commands.md` §0
resolves the root and verifies it is *this* project by marker files. If the
markers are absent, stop — you are not pointed at the project, and nothing
below may run.

## Environment contract

Every row is re-checked at the start of every run. Checks are capability-based,
not version numbers, because these dependencies update over time and other
machines will differ.

| Need | Where the check lives | How its absence is handled |
| --- | --- | --- |
| Repository present, and it is *this* project | §0 | Stop, name the markers that failed |
| Rootless podman with crun and cgroups v2 | §1 | Remediation in §1; needs `sudo` — stop and ask before applying |
| A terminal emulator + graphical session (X11 or Wayland) | §1 | Remediation in §1 |
| `opencode` binary exposing `auth export`, `auth import`, `--standalone` | §1 | Install/upgrade via the official installer; the check is on subcommands, not version |
| Base tools: `bash`, `tar`, `curl`, `awk`, `sed`, `find`, a checksum tool (`sha256sum` or `shasum`) | §1 | `apt-get install` |

Remediation commands are in `references/commands.md` §1. They assume a
Debian-family Linux (Ubuntu/Mint). On another OS, stop and tell the user rather
than guess. Anything requiring `sudo` or a reboot is **never** applied by the
agent — report it and let the user decide.

## Dependencies change over time

- Gate on capability, never version. The runbook never matches a podman or
  opencode version string; it tests that rootless operation, cgroups v2, crun,
  and the required opencode subcommands actually hold **right now**.
- Re-run preflight every invocation; do not trust a previous pass.
- If a capability check fails, do not work around it in a way that weakens
  isolation. Stop and report.

## Hard rules

1. **No leaked processes.** The seat must be a foreground
   `podman run -it --name <seat>` container with opencode as its main process —
   never `podman exec` into a long-lived container. When the user quits the TUI,
   the container stops and every opencode process dies with it.
2. **No leftover credentials.** Credentials are injected once, into the
   provisioned image. Teardown removes that image and verifies it is gone.
   Never publish or push the image anywhere.
3. **Faithful install.** Provision with `install.sh` and no `--config-dir`, into
   the container's global `/root/.config/opencode` — one engine per environment,
   exactly what an end user gets.
4. **Clean seats.** The provisioned image must contain zero session history.
   Verify before committing, or a new seat replays an old conversation.
5. **Verify every destructive step.** After teardown, assert `podman ps -a` and
   `podman images` list no `graph-engine-sandbox` artifact. Never report
   "clean" without running the check.

## Phase 1 — setup to the seat

1. Locate and verify the project, §0; then preflight, §1. If anything is
   missing, stop and report it by name — with the remediation if it needs your
   user's `sudo`.
2. Build the archive, §2.
3. Build the base image, §3. Use `--network host` — `apt` over the container
   network stalls.
4. Provision the clean image, §4: install, inject credentials via
   `auth export | auth import`, then verify `latest` is empty and no
   `prompt-history.jsonl` exists **before** committing. If that check fails,
   stop — the image is not clean.
5. Launch the seat, §5, and confirm a `seat-*` container is running on the
   provisioned image.
6. Hand the seat to the user and tell them to drive it (talk to the Engineer,
   dispatch `build-review`, watch the dashboard). Note which model served the
   first answer: it must be the pinned
   `openrouter/~deepseek/deepseek-flash-latest`, not the free default.

Stop here. Do not tear anything down until the user reports they have closed
the TUI.

## Phase 2 — wrapup after the user closes the TUI

When the user says they have closed it:

1. Confirm the seat container's state (§6): it should be `Exited`. A seat still
   `Running` after the user closed it is itself a red flag — report it.
2. Copy the seat's log out and scan it, §6. Classify, do not speculate:
   - `ModelUnavailableError` → RED: credentials/model failed; reject.
   - `Failed to fetch models.dev` (timeout) → environment note; the host's own
     slow path to Cloudflare, not a sandbox failure.
   - No `openrouter/~deepseek/deepseek-flash-latest` in the log while the user
     did drive → the pinned model never served; a fallback happened; reject.
3. Collect forensics for anything the user observed breaking, §6.
4. Tear down and verify empty, §7. If any `graph-engine-sandbox` container or
   image remains, report FAIL with the list.
5. Report the verdict — accept or reject — with each claim backed by the
   evidence line that supports it.