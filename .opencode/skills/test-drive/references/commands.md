# Test-drive command runbook

Run from the repository root. The workspace is `/tmp/opencode` (outside the
repo). The OpenCode binary is `$HOME/.opencode/bin/opencode`.

## §1 Preflight

```sh
command -v podman || echo "MISSING podman"
command -v gnome-terminal || echo "MISSING gnome-terminal"
test -x "$HOME/.opencode/bin/opencode" || echo "MISSING opencode binary"
test -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" || echo "MISSING display"
podman info --format 'cgroup={{.Host.CgroupVersion}} runtime={{.Host.OCIRuntime.Name}}'
```

Expect `cgroup=v2` and `runtime=crun`.

## §2 Build the archive (from the repo root)

```sh
rm -rf /tmp/opencode/dist
DIST_DIR=/tmp/opencode/dist sh installer/build-archive.sh
```

The archive and its `.sha256` land in `/tmp/opencode/dist`.

## §3 Base image

```sh
mkdir -p /tmp/opencode/base-image
cp "$HOME/.opencode/bin/opencode" /tmp/opencode/base-image/opencode
cat > /tmp/opencode/base-image/Containerfile <<'EOF'
FROM debian:stable-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates tar coreutils bash git curl procps grep sed findutils \
    && rm -rf /var/lib/apt/lists/*
COPY opencode /usr/local/bin/opencode
RUN chmod +x /usr/local/bin/opencode
ENV TERM=xterm-256color LANG=C.UTF-8 LC_ALL=C.UTF-8
EOF
podman build --network host -t localhost/graph-engine-sandbox:base /tmp/opencode/base-image
```

Skip the build if the image already exists:
`podman image exists localhost/graph-engine-sandbox:base`.

## §4 Provision the clean image

```sh
ARCH=$(ls /tmp/opencode/dist/graph-engine-*.tar.gz | head -n1)
podman rm -f provision-tmp 2>/dev/null || true
podman run -d --name provision-tmp -e HOME=/root --network podman \
  -v /tmp/opencode/dist:/dist:ro localhost/graph-engine-sandbox:base sleep infinity
podman exec -e HOME=/root provision-tmp mkdir -p /root/.config/opencode
podman exec -e HOME=/root provision-tmp /dist/install.sh \
  --archive "/dist/$(basename "$ARCH")" \
  --checksum "/dist/$(basename "$ARCH").sha256" --yes
"$HOME/.opencode/bin/opencode" auth export 2>/dev/null \
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
cat > /tmp/opencode/seat.sh <<'EOF'
#!/bin/bash
NAME="seat-$(date +%s)"
echo "test-drive seat: $NAME (quit the TUI to end it; its processes die with the container)"
podman run -it --name "$NAME" -e HOME=/root -e TERM=xterm-256color \
  --network podman --pids-limit 256 --memory 4g \
  localhost/graph-engine-sandbox:provisioned opencode
echo "seat ended: $NAME"
EOF
chmod +x /tmp/opencode/seat.sh
gnome-terminal --title="graph-engine test-drive" -- bash /tmp/opencode/seat.sh
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
podman cp "$SEAT:/root/.local/share/opencode/log/opencode.log" /tmp/opencode/seat-opencode.log
grep 'level=ERROR' /tmp/opencode/seat-opencode.log
grep -c 'ModelUnavailableError' /tmp/opencode/seat-opencode.log
grep -c 'openrouter/~deepseek/deepseek-flash-latest' /tmp/opencode/seat-opencode.log
podman cp "$SEAT:/root/.local/share/opencode" /tmp/opencode/seat-share   # forensics
podman cp "$SEAT:/root/.local/state/opencode" /tmp/opencode/seat-state   # forensics
```

`podman cp` works on a stopped container.

## §7 Teardown + verify empty

```sh
podman rm -f $(podman ps -aq \
  --filter ancestor=localhost/graph-engine-sandbox:provisioned) 2>/dev/null || true
podman rmi -f localhost/graph-engine-sandbox:provisioned \
              localhost/graph-engine-sandbox:base 2>/dev/null || true
podman image prune -f
podman ps -a --format '{{.Names}} {{.Image}}' | grep graph-engine-sandbox && echo "FAIL: containers remain"
podman images --format '{{.Repository}}:{{.Tag}}' | grep graph-engine-sandbox && echo "FAIL: images remain"
```

If either `FAIL` line prints, the teardown is incomplete — report the list, do
not call it clean. A clean run prints neither.