#!/usr/bin/env bash
# Build the archive, build the base image (if absent), then provision a CLEAN
# image: faithful install + injected credentials + verified zero session
# history. Leaves localhost/graph-engine-sandbox:provisioned for launch.sh.
set -euo pipefail
. "$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

mkdir -p "$WORK"

echo "== build archive =="
rm -rf "$WORK/dist"
DIST_DIR="$WORK/dist" sh "$REPO/installer/build-archive.sh" >/dev/null

echo "== base image =="
if podman image exists localhost/graph-engine-sandbox:base 2>/dev/null; then
  echo "base image present; skipping build"
else
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
fi

echo "== provision clean image =="
ARCH=$(ls "$WORK/dist"/graph-engine-*.tar.gz 2>/dev/null | head -n1)
[ -n "$ARCH" ] || { echo "FAIL: no archive built at $WORK/dist"; exit 1; }

podman rm -f provision-tmp 2>/dev/null || true
podman run -d --name provision-tmp -e HOME=/root --network podman \
  -v "$WORK/dist:/dist:ro" localhost/graph-engine-sandbox:base sleep infinity >/dev/null
podman exec -e HOME=/root provision-tmp mkdir -p /root/.config/opencode
podman exec -e HOME=/root provision-tmp /dist/install.sh \
  --archive "/dist/$(basename "$ARCH")" \
  --checksum "/dist/$(basename "$ARCH").sha256" --yes
"$OC" auth export 2>/dev/null \
  | podman exec -i -e HOME=/root provision-tmp opencode auth import

echo "== verify clean before commit =="
podman exec provision-tmp sh -c \
  'test -z "$(ls -A /root/.local/state/opencode/latest 2>/dev/null)" \
   && test ! -f /root/.local/state/opencode/prompt-history.jsonl \
   && opencode auth list | grep -q OpenRouter'

podman commit provision-tmp localhost/graph-engine-sandbox:provisioned >/dev/null
podman rm -f provision-tmp >/dev/null
podman image prune -f >/dev/null
echo "provisioned: localhost/graph-engine-sandbox:provisioned (credentials injected; run launch.sh)"