---
name: Test Drive
description: Test-drive a release of the girth-agents project in an isolated throwaway container — install it cleanly, drive it like an end user, then tear it down leaving no process and no credential copy behind.
---

# girth-agents sandbox test-drive

This skill belongs to the **girth-agents** repository and exists to test-drive a
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
removes every harness container and image (including the credential copy),
clears the workspace, and verifies empty. It is safe to run at any point,
including before, between, or after the normal phases, and any number of times.
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
   image remains and exits nonzero otherwise — never report "clean" without it.

## Phase 1 — setup to the seat

1. `bash scripts/preflight.sh` — stop and report by name if anything fails.
2. `bash scripts/provision.sh` — archive, base image, clean credentialed image.
3. `bash scripts/launch.sh` — opens the seat; confirm a `seat-*` container is
   running on the provisioned image.
4. Hand the seat to the user to drive **the project, not the bare chat**: in
   the seat, switch to the **Engineer** (or **Conductor**) — the graph's
   primary agents pin `openrouter/~deepseek/deepseek-flash-latest`. Ask the
   Engineer for the graph, have the Conductor dispatch `build-review`, and watch
   it reach the `done` terminal. A dispatch that reaches a terminal is the
   decidable proof the pinned model served — graph-node sessions pin the model
   and never fall back (a failure would defect with the model named instead).
   The seat's bare default session runs a free fallback model; do not judge the
   pinned model by messages typed there.

Stop here. Tear nothing down until the user reports they have closed the TUI.

## Phase 2 — wrapup after the user closes the TUI

Any clear signal that the drive is over — "closed it", "done", "that broke" —
counts as the trigger. In doubt, run wrapup then teardown anyway; never leave a
seat or the credentialed image standing.

1. `bash scripts/wrapup.sh` — seat state (must be `Exited`; `Running` is a red
   flag), log scan, forensics copy. Classify, do not speculate:
   - `ModelUnavailableError` → RED, reject: credentials/model failed.
   - `models.dev` timeout → environment note (the host's own slow path to
     Cloudflare), not a sandbox failure.
   - The user drove the Engineer/Conductor and no answered session or completed
     dispatch shows the pinned model, or the dispatch defected → fallback,
     reject. The `deepseek mentions` count is corroboration only — a mention
     does not prove a served answer.
2. `bash scripts/teardown.sh` — remove everything and verify empty. If it exits
   nonzero, report the surviving artifacts.
3. Report the verdict — accept or reject — each claim backed by its evidence
   line.