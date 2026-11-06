# Test-drive command runbook

The workspace is `/tmp/opencode` (outside the repo). Commands are capability
checks, never version strings — dependencies drift.

## §0 Locate and verify the project

Set `SKILL_DIR` to the directory containing `SKILL.md` (the skill loader
reports it; this reference file lives in its `references/` subdirectory). Then,
from **any** working directory:

```sh
REPO=$(git -C "$SKILL_DIR" rev-parse --show-toplevel 2>/dev/null \
  || dirname "$(dirname "$(dirname "$SKILL_DIR")")")
test -f "$REPO/INVARIANTS.md" -a -f "$REPO/installer/build-archive.sh" \
     -a -f "$REPO/product.conf" -a -f "$REPO/graph/config.json" \
  || { echo "§0 FAIL: not the girth-agents repository at $REPO"; exit 1; }
echo "repo: $REPO"
```

If `git` is absent, the path fallback works; the marker check is the authority.
Stop if it fails — nothing below may run against an unidentified directory.

## §1 Preflight + bring to standard

```sh
WORK=/tmp/opencode

# base tools
for t in bash tar curl awk sed find git; do
  command -v "$t" >/dev/null 2>&1 || echo "MISSING $t"
done
command -v sha256sum >/dev/null 2>&1 || command -v shasum >/dev/null 2>&1 \
  || echo "MISSING checksum tool (sha256sum or shasum)"

# podman: functional, rootless-capable, cgroups v2, crun
command -v podman >/dev/null 2>&1 || echo "MISSING podman"
podman info >/dev/null 2>&1 || echo "podman not functional"
podman unshare true 2>/dev/null && echo "userns: ok" \
  || echo "WARN: podman unshare failed (rootless not set up)"
echo "cgroup fs: $(stat -fc %T /sys/fs/cgroup)"      # expect cgroup2fs
podman info 2>/dev/null | grep -q -- '- pids' \
  && echo "pids controller: present" || echo "WARN: pids controller not reported"
podman info 2>/dev/null | awk '/ociRuntime:/{f=1} f&&/name:/{print "runtime: "$2; exit}'

# opencode: location + required features
OC=$(command -v opencode || true)
[ -z "$OC" ] && [ -x "$HOME/.opencode/bin/opencode" ] && OC="$HOME/.opencode/bin/opencode"
[ -n "${OPENCODE_BIN:-}" ] && OC="$OPENCODE_BIN"
[ -x "${OC:-}" ] || { echo "MISSING opencode binary (install via the official installer)"; exit 1; }
export OC
"$OC" auth --help 2>/dev/null | grep -q 'export' || echo "MISSING opencode auth export"
"$OC" auth --help 2>/dev/null | grep -q 'import' || echo "MISSING opencode auth import"
"$OC" run --help 2>/dev/null | grep -q -- '--standalone' || echo "MISSING opencode --standalone"

# a graphical session and a terminal emulator
test -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" || echo "MISSING display"
TERM_CMD=""
for t in gnome-terminal x-terminal-emulator xfce4-terminal konsole kitty alacritty xterm; do
  command -v "$t" >/dev/null 2>&1 && { TERM_CMD="$t"; break; }
done
[ -n "$TERM_CMD" ] || echo "MISSING terminal emulator"
export TERM_CMD
```

**Remediation** (Debian-family; stop and hand to the user for anything needing
`sudo` or a reboot — the agent never applies these):

```sh
sudo apt-get install -y podman crun slirp4netns
# rootless needs a subordinate id range:
grep -q "^$(whoami):" /etc/subuid /etc/subgid || sudo usermod \
  --add-subuids 100000-165535 --add-subgids 100000-165535 "$(whoami)"   # then re-login
sudo apt-get install -y gnome-terminal    # or xterm / xfce4-terminal / konsole
sudo apt-get install -y bash git tar coreutils curl findutils
```

If `cgroup fs` is not `cgroup2fs`, that is a kernel/systemd configuration
change (unified cgroup hierarchy) and a reboot — report it; do not attempt it.
If `userns` fails, rootless podman is not provisioned (subuid/subgid above).

## §2 Build the archive

```sh
rm -rf "$WORK/dist"
DIST_DIR="$WORK/dist" sh "$REPO/installer/build-archive.sh"
```

The archive and its `.sha256` land in `$WORK/dist`.

## §3 Base image

```sh
mkdir -p "$WORK/base-image"
cp "$OC" "$WORK/base-image/opencode"
cat > "$WORK/base-image/Containerfile" <<'EOF'
FROM debian:stable-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates tar coreutils bash git curl procps grep sed findutils \
    && rm -rf /var/lib/apt/lists/*
COPY opencode /usr/local/bin/opencode
RUN chmod +x /usr/local/bin/opencode
ENV TERM=xterm-256color LANG=C.UTF-8 LC_ALL=C.UTF-8
EOF
podman build --network host -t localhost/graph-engine-sandbox:base "$WORK/base-image"
```

Skip the build if the image already exists:
`podman image exists localhost/graph-engine-sandbox:base`.

## §4 Provision the clean image

```sh
ARCH=$(ls "$WORK/dist"/graph-engine-*.tar.gz | head -n1)
podman rm -f provision-tmp 2>/dev/null || true
podman run -d --name provision-tmp -e HOME=/root --network podman \
  -v "$WORK/dist:/dist:ro" localhost/graph-engine-sandbox:base sleep infinity
podman exec -e HOME=/root provision-tmp mkdir -p /root/.config/opencode
podman exec -e HOME=/root provision-tmp /dist/install.sh \
  --archive "/dist/$(basename "$ARCH")" \
  --checksum "/dist/$(basename "$ARCH").sha256" --yes
"$OC" auth export 2>/dev/null \
  | podman exec -i -e HOME=/root provision-tmp opencode auth import
podman exec provision-tmp sh -c \
  'test -z "$(ls -A /root/.local/state/opencode/latest 2>/dev/null)" \
   && test ! -f /root/.local/state/opencode/prompt-history.jsonl \
   && opencode auth list | grep -q OpenRouter'
podman commit provision-tmp localhost/graph-engine-sandbox:provisioned
podman rm -f provision-tmp
podman image prune -f
```

The verification `podman exec ... test` must exit 0 (no session baked, OpenRouter
credential stored). If it fails, teardown and start §4 over; do not commit a
dirty image.

## §5 Launch the seat

```sh
cat > "$WORK/seat.sh" <<'EOF'
#!/bin/bash
NAME="seat-$(date +%s)"
echo "test-drive seat: $NAME (quit the TUI to end it; its processes die with the container)"
podman run -it --name "$NAME" -e HOME=/root -e TERM=xterm-256color \
  --network podman --pids-limit 256 --memory 4g \
  localhost/graph-engine-sandbox:provisioned opencode
echo "seat ended: $NAME"
EOF
chmod +x "$WORK/seat.sh"

launch_seat() {
  case "$TERM_CMD" in
    gnome-terminal)       gnome-terminal --title="graph-engine test-drive" -- bash "$WORK/seat.sh" ;;
    x-terminal-emulator)  x-terminal-emulator -e "bash $WORK/seat.sh" ;;
    xfce4-terminal|konsole|xterm) "$TERM_CMD" -e "bash $WORK/seat.sh" ;;
    kitty)                kitty bash "$WORK/seat.sh" ;;
    alacritty)            alacritty -e bash "$WORK/seat.sh" ;;
    *) echo "FAIL: unsupported terminal $TERM_CMD — add its launch form" ;;
  esac
}
launch_seat
```

Confirm it is up:

```sh
podman ps --filter ancestor=localhost/graph-engine-sandbox:provisioned \
  --format '{{.Names}} {{.Status}}'
```

No `--rm`: the container must stop (killing all its processes) when the TUI
exits, and remain for Phase 2 forensics.

## §6 Wrapup — inspect before teardown

```sh
SEAT=$(podman ps -a --filter ancestor=localhost/graph-engine-sandbox:provisioned \
        --format '{{.Names}}' | head -n1)
podman ps -a --filter ancestor=localhost/graph-engine-sandbox:provisioned \
  --format '{{.Names}} {{.State}}'      # must be Exited; Running = red flag
podman cp "$SEAT:/root/.local/share/opencode/log/opencode.log" "$WORK/seat-opencode.log"
grep 'level=ERROR' "$WORK/seat-opencode.log"
grep -c 'ModelUnavailableError' "$WORK/seat-opencode.log"
grep -c 'openrouter/~deepseek/deepseek-flash-latest' "$WORK/seat-opencode.log"
podman cp "$SEAT:/root/.local/share/opencode" "$WORK/seat-share"   # forensics
podman cp "$SEAT:/root/.local/state/opencode" "$WORK/seat-state"   # forensics
```

`podman cp` works on a stopped container.

## §7 Teardown + verify empty

```sh
podman rm -f $(podman ps -aq \
  --filter ancestor=localhost/graph-engine-sandbox:provisioned) 2>/dev/null || true
podman rmi -f localhost/graph-engine-sandbox:provisioned \
              localhost/graph-engine-sandbox:base 2>/dev/null || true
podman image prune -f
podman ps -a | grep graph-engine-sandbox && echo "FAIL: containers remain"
podman images | grep graph-engine-sandbox && echo "FAIL: images remain"
```

If either `FAIL` line prints, the teardown is incomplete — report the list, do
not call it clean. A clean run prints neither.