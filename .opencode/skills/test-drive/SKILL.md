---
name: Test Drive
description: Test-drive the current release of this project in an isolated throwaway container — install it cleanly, drive it like an end user, then tear it down leaving no process and no credential copy behind.
---

# Sandbox test-drive

Purpose: prove the current release works for an end user, inside a container that
cannot touch the development machine, then tear it down leaving nothing behind.

You have `shell`. Execute the exact commands in `references/commands.md`; do not
improvise the podman flow. Work in `/tmp/opencode` (outside the repository).

## Hard rules

1. **No leaked processes.** The seat must be a foreground
   `podman run -it --name <seat>` container with opencode as its main process —
   never `podman exec` into a long-lived container. When the user quits the TUI,
   the container stops and every opencode process dies with it. (A leaked
   opencode client ignoring SIGTERM is a recorded failure of the exec approach.)
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

1. Preflight, `references/commands.md` §1. If anything is missing, stop and
   report it by name.
2. Build the archive from the repository root, §2.
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