---
name: Test Drive
description: Test-drive a release of the graph-engine project in an isolated throwaway container — install it cleanly, drive it like an end user, then tear it down leaving no process and no credential copy behind.
---

# graph-engine sandbox test-drive

This skill belongs to the **graph-engine** repository and exists to test-drive a
release of this project. It is not a general OpenCode skill. It relies on an
isolated rootless-podman container so a broken release cannot touch the
development machine.

The work is done by the checked-in scripts under `scripts/`; run them with
`bash`, from any working directory — they locate the project themselves and
refuse to run against the wrong tree. Do not reconstruct these commands from
memory or improvise the podman flow.

## Locating the project

OpenCode's working directory may be anything; `scripts/` resolve the repository
root from the skill's own directory and verify it is *this* project by marker
files. If the markers are absent, the script stops — nothing below may run.

## Environment contract

Every run re-checks the environment — these dependencies drift, and other
machines differ. Run `bash scripts/preflight.sh` first; it reports each
requirement by name and exits nonzero on a hard failure. `references/README.md`
carries the remediation for a substandard environment; anything needing `sudo`
or a reboot is reported to the user, never applied by the agent.

## Forced cleanup (idempotent, fire at any time)

Starting and finishing span multiple turns, so a run may be interrupted halfway
— during provisioning, or with a seat still open. When information gathering is
not the priority and leaks must be plugged, run `bash scripts/cleanup.sh`. It
removes every harness container and every credential-bearing image (the
provisioned image and any dangling credential layer), clears the workspace, and
verifies clean. The credential-free base image is retained so the next drive
does not re-download its packages. It is safe to run at any point, including
before, between, or after the normal phases, and any number of times.
Or invoke `/cancel-test-drive`, which runs the same cleanup and then verifies
the emptiness of every surface manually.

## Drift: report, do not edit

This skill and its scripts are a reviewed safety contract. If the project
changed, or this machine needs handling the scripts lack, report it in the
format in `references/README.md` and stop if it touches safety. Machine quirks
go to the gitignored `.opencode/testdrive/local-notes.md`; project or runbook
changes go to a human through git. Never rewrite the skill or scripts yourself.

## Hard rules

1. **No leaked processes.** The seat is a foreground `podman run -it --name`
   container with opencode as its main process — never `podman exec` into a
   long-lived container. Quitting the TUI stops the container and every opencode
   process dies with it.
2. **No leftover credentials.** Credentials are injected once, into the
   provisioned image. `teardown.sh` removes that image and verifies it is gone.
   Never publish or push the image anywhere.
3. **Faithful install.** Provision with `install.sh` and no `--config-dir`, into
   the container's global `/root/.config/opencode` — one engine per environment,
   exactly what an end user gets.
4. **Clean seats.** The provisioned image must contain zero session history;
   `provision.sh` verifies this before committing.
5. **Verify every destructive step.** `teardown.sh` asserts no container or
   credential-bearing image remains (the credential-free base image is retained
   across cycles) and exits nonzero otherwise — never report "clean" without it.

## Phase 1 — setup to the seat

1. `bash scripts/preflight.sh` — stop and report by name if anything fails.
2. `bash scripts/provision.sh` — archive, base image, clean credentialed image.
3. `bash scripts/launch.sh` — opens the seat; confirm a `seat-*` container is
   running on the provisioned image.
4. Hand the seat to the user to drive **the project, not the bare chat**: tell
   them to switch to the **Engineer** (or **Conductor**), ask the Engineer
   for the graph, have the Conductor dispatch `build-review`, and watch it
   reach the `done` terminal. A dispatch that reaches a terminal is the
   decidable proof the release drives end-to-end — the plugin loaded, the graph
   loaded, and graph-node sessions ran to completion. No shipped agent pins a
   model; agents inherit the session default, so the seat proves the release
   works, not a specific model's credentials. The user may end the drive without
   starting any session at all — seeing what the seat shows is often exactly
   what they came for. That is a completed drive, not a broken one.
5. `bash scripts/wait.sh` — blocks until the seat's opencode process ends.
   Give it the longest timeout your shell tool allows (ideally none); a drive
   takes minutes. Quitting the TUI ends the process and releases the wait.

The seat process ending is the trigger to continue. Do not wait for a user
message. If the wait is interrupted or times out, run `scripts/wait.sh` again —
it is idempotent and returns immediately against an already-ended seat.

## Phase 2 — wrapup after the seat process ends

`scripts/wait.sh` returning after `launch.sh` **is** the trigger: the seat's
opencode process has ended. User messages are corroboration only, never a
trigger, and none is waited on — proceed through wrapup and teardown without
further prompting. In doubt (an interrupted wait, an ambiguous state), run
wrapup then teardown anyway; never leave a seat or the credentialed image
standing.

1. `bash scripts/wrapup.sh` — seat state (must be `Exited`; `Running` is a red
   flag), log scan, forensics copy. Classify, do not speculate:
   - `ModelUnavailableError` → RED, reject: a model the engine needed was
     unavailable.
   - `models.dev` timeout → environment note (the host's own slow path to
     Cloudflare), not a sandbox failure.
   - No session created in the seat is **not** a sign anything went wrong with
     the process: it means the user got the information they needed before even
     starting a session. Report it as such — the release proof was simply not
     run this time — and never classify it as a failure.
   - The user started an Engineer/Conductor session and the `build-review`
     dispatch did not reach `done`, or the dispatch defected → reject.
2. `bash scripts/teardown.sh` — remove everything and verify empty. If it exits
   nonzero, report the surviving artifacts.
3. Report the verdict — accept, reject, or (when no session was created) a
   no-session note that the user got what they needed before starting one —
   each claim backed by its evidence line.