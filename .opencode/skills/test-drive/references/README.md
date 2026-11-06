# Test-drive references

The runbook is executable, in `scripts/`. The SKILL drives them; it does not ask
the agent to reconstruct these commands from prose.

## Scripts (run with `bash`)

| Script | What it does | Destructive? |
| --- | --- | --- |
| `scripts/preflight.sh` | Locate + verify the project, check every dependency | No |
| `scripts/status.sh` | List seats, containers, images | No |
| `scripts/provision.sh` | Build archive + base image, provision the clean credentialed image | Builds/replaces images |
| `scripts/launch.sh` | Open the per-seat container in a terminal | No (starts a container) |
| `scripts/wait.sh` | Block until the launched seat's opencode process ends | No |
| `scripts/wrapup.sh` | Seat state + log scan + forensics copy | No |
| `scripts/teardown.sh` | Remove all test-drive containers and images, verify empty | Yes |
| `scripts/cleanup.sh` | Forced idempotent cleanup: containers, images, workspace; verify empty | Yes |

Run each from any working directory: `bash <skill-dir>/scripts/<name>.sh`.
`scripts/lib.sh` in the same directory holds the shared project/machine
resolution; it is sourced, not run.

## Bringing the environment up to standard

These assume a Debian-family host (Ubuntu/Mint). Anything with `sudo` or a
reboot is **reported to the user, never run by the agent**. For other OSes,
stop and ask.

```sh
sudo apt-get install -y podman crun slirp4netns
grep -q "^$(whoami):" /etc/subuid /etc/subgid || sudo usermod \
  --add-subuids 100000-165535 --add-subgids 100000-165535 "$(whoami)"   # then re-login
sudo apt-get install -y gnome-terminal   # or xterm / xfce4-terminal / konsole
sudo apt-get install -y bash git tar awk sed coreutils curl findutils
```

- `cgroup fs: cgroup2fs` failing means the kernel/systemd unified-hierarchy
  setting and a reboot — report it, do not attempt it.
- `userns` failing means rootless podman is not provisioned (subuid/subgid).
- `opencode missing auth export/import/--standalone` means the binary is too old
  or wrongly installed — upgrade via the official installer.

## Machine-local notes

Machine quirks belong to the machine, never the committed skill. Write them to
`.opencode/testdrive/local-notes.md` (gitignored). `preflight.sh` prints it when
present. Examples: a nonstandard terminal launch form, a slow registry, a
firewall hole for a specific host.

## Reporting drift (do not edit)

The skill and these scripts are a reviewed safety contract. If they diverge from
what the project or the machine actually requires, the agent reports and stops —
it does not rewrite them. Use this template verbatim:

```
DRIFT-REPORT
- kind: machine | project | runbook-bug
- where: <script or file, e.g. scripts/preflight.sh>
- observed: <what actually happened>
- action taken: <stopped | noted in local-notes.md>
```

`machine` drift goes to `local-notes.md`; a missing launch form is recorded
there too, and a human patches `scripts/launch.sh` through git. `project` and
`runbook-bug` drift is for a human to patch through git, like any code that
changes what is tested. The agent never edits the skill or its scripts.

## Forced cleanup

`cleanup.sh` is the idempotent escape hatch: when a run was interrupted partway
(start, a half-provisioning, a still-open seat) and gathering information is no
longer the priority, it removes every harness container and image — including
the credential-bearing provisioned image — clears the workspace that may hold
forensic copies of the seeded database, and verifies empty. It is safe to fire
at any time, repeatedly; running it against an already-clean machine reports
`CLEANUP CLEAN` and exits 0. It does not touch host processes or podman
artifacts of anything else.