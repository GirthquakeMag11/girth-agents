#!/usr/bin/env bash
# Build the archive, build the base image (if absent or missing the ownership
# label), then provision a CLEAN image: faithful install + exactly the OpenRouter
# credential + verified zero session history. Leaves a labeled
# localhost/graph-engine-sandbox:provisioned for launch.sh. A trap removes the
# provisional container on ANY exit, so a failure cannot strand it (with or
# without credentials).
set -euo pipefail
. "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/lib.sh"

mark_workspace
trap 'podman rm -f provision-tmp >/dev/null 2>&1 || true' EXIT

IMG_BASE="localhost/graph-engine-sandbox:base"

echo "== build archive =="
rm -rf "$WORK/dist"
DIST_DIR="$WORK/dist" sh "$REPO/installer/build-archive.sh" >/dev/null

echo "== base image =="
if podman image exists "$IMG_BASE" 2>/dev/null \
   && [ "$(label_of "$LABEL_KEY" "$IMG_BASE")" = "$LABEL_VAL" ]; then
  echo "base image present and labeled; skipping build"
else
  mkdir -p "$WORK/base-image"
  cp "$OC" "$WORK/base-image/opencode"
  cat > "$WORK/base-image/Containerfile" <<EOF
FROM debian:stable-slim
RUN apt-get update && apt-get install -y --no-install-recommends \\
      ca-certificates tar coreutils bash git curl procps grep sed findutils \\
    && rm -rf /var/lib/apt/lists/*
COPY opencode /usr/local/bin/opencode
RUN chmod +x /usr/local/bin/opencode
LABEL $LABEL_KEY="$LABEL_VAL"
ENV TERM=xterm-256color LANG=C.UTF-8 LC_ALL=C.UTF-8
EOF
  podman build --network host -t "$IMG_BASE" "$WORK/base-image"
  [ "$(label_of "$LABEL_KEY" "$IMG_BASE")" = "$LABEL_VAL" ] \
    || { echo "FAIL: base image is missing the ownership label"; exit 1; }
fi

echo "== build artifact path =="
ARCH=""
for f in "$WORK"/dist/graph-engine-*.tar.gz; do
  [ -e "$f" ] && ARCH="$f"
done
[ -n "$ARCH" ] || { echo "FAIL: no archive built at $WORK/dist"; exit 1; }

echo "== provision clean image =="
podman rm -f provision-tmp 2>/dev/null || true
podman run -d --name provision-tmp -e HOME=/root \
  -v "$WORK/dist:/dist:ro" "$IMG_BASE" sleep infinity >/dev/null
podman exec -e HOME=/root provision-tmp mkdir -p /root/.config/opencode
podman exec -e HOME=/root provision-tmp /dist/install.sh \
  --archive "/dist/$(basename "$ARCH")" \
  --checksum "/dist/$(basename "$ARCH").sha256" --yes

echo "== inject the OpenRouter credential (and no other) =="
if ! "$OC" auth export OpenRouter 2>"$WORK/auth-export.err" \
  | podman exec -i -e HOME=/root provision-tmp opencode auth import; then
  echo "FAIL: 'opencode auth export OpenRouter' failed (exit ${PIPESTATUS[0]}):" >&2
  sed -e 's/^/    /' "$WORK/auth-export.err" >&2
  exit 1
fi
rm -f "$WORK/auth-export.err"

echo "== verify clean before commit =="
podman exec provision-tmp sh -c '
  test -z "$(ls -A /root/.local/state/opencode/latest 2>/dev/null)" \
    || { echo "state/latest not empty"; exit 1; }
  test ! -f /root/.local/state/opencode/prompt-history.jsonl \
    || { echo "prompt-history present"; exit 1; }
  find /root/.local/share/opencode -maxdepth 1 -name opencode.db -mmin -10 \
    | grep . >/dev/null || { echo "FAIL: opencode.db not freshly created at provision"; exit 1; }
  opencode auth list | grep OpenRouter >/dev/null \
    || { echo "FAIL: OpenRouter credential missing"; exit 1; }
'

echo "== commit =="
podman commit --change "LABEL $LABEL_KEY=$LABEL_VAL" provision-tmp \
  localhost/graph-engine-sandbox:provisioned >/dev/null
[ "$(label_of "$LABEL_KEY" localhost/graph-engine-sandbox:provisioned)" = "$LABEL_VAL" ] \
  || { echo "FAIL: provisioned image is missing the ownership label"; exit 1; }

echo "provisioned: localhost/graph-engine-sandbox:provisioned (OpenRouter only; run launch.sh)"
# provision-tmp is removed by the EXIT trap.