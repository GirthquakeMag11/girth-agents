# Shared resolution for the test-drive scripts. Sourced by each script; do not
# execute directly. Fails fast if the repository cannot be located and verified
# as the graph-engine project.
set -euo pipefail

# Workspace. Owned by the harness (a subtree under the shared scratch dir), so
# sweep() may remove it whole; a marker inside is the ownership token.
WORK="${TESTDRIVE_WORK:-/tmp/opencode/testdrive}"

# The ownership label every harness image carries, so sweep() can remove exactly
# the harness's images — tagged or dangling — without a machine-global prune.
LABEL_KEY="io.graph-engine.testdrive"
LABEL_VAL="1"

# The harness images. Both carry the ownership label. Only :provisioned ever
# holds a credential (the base image is Debian + the opencode binary), so a
# sweep removes the provisioned image and any dangling credential layer while
# retaining the credential-free base image to reuse across cycles — rebuilding
# it re-downloads the apt packages every time for no safety gain.
IMG_BASE="localhost/graph-engine-sandbox:base"
IMG_PROVISIONED="localhost/graph-engine-sandbox:provisioned"

# Repository root, located from this file's own location — never from the
# caller's working directory. The skill directory is one level above scripts/.
SELF_DIR=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
SKILL_DIR=$(dirname -- "$SELF_DIR")

REPO=""
if command -v git >/dev/null 2>&1; then
  REPO=$(git -C "$SKILL_DIR" rev-parse --show-toplevel 2>/dev/null || true)
fi
[ -z "$REPO" ] && REPO=$(dirname -- "$(dirname -- "$(dirname -- "$SKILL_DIR")")")

# The marker check is the authority: this skill is for this project only.
for m in INVARIANTS.md installer/build-archive.sh product.conf graph/config.json; do
  [ -f "$REPO/$m" ] || { echo "FAIL: not the graph-engine repository at $REPO (missing $m)" >&2; exit 1; }
done
# Content sentinel: filename presence alone is a weak identity; product.conf
# must declare this product.
grep -q '^PRODUCT_SLUG="graph-engine"$' "$REPO/product.conf" \
  || { echo "FAIL: $REPO/product.conf does not declare graph-engine" >&2; exit 1; }

# opencode binary: PATH, then the ~/.opencode install, then an explicit override.
OC=$(command -v opencode 2>/dev/null || true)
[ -z "$OC" ] && [ -x "$HOME/.opencode/bin/opencode" ] && OC="$HOME/.opencode/bin/opencode"
[ -n "${OPENCODE_BIN:-}" ] && OC="$OPENCODE_BIN"

# A supported terminal emulator, first match.
TERM_CMD=""
for t in gnome-terminal x-terminal-emulator xfce4-terminal konsole kitty alacritty xterm; do
  if command -v "$t" >/dev/null 2>&1; then TERM_CMD="$t"; break; fi
done

# Machine-local, gitignored notes the running agent reads and appends.
LOCAL_NOTES="$REPO/.opencode/testdrive/local-notes.md"

export WORK REPO OC TERM_CMD LOCAL_NOTES LABEL_KEY LABEL_VAL IMG_BASE IMG_PROVISIONED

# Read one image's ownership label; empty when absent.
label_of() { podman image inspect --format "{{index .Labels \"$1\"}}" "$2" 2>/dev/null; }

# The most recent seat container, running or already exited. Seat names are
# `seat-<epoch seconds>`, so a descending lexical sort is the latest launch.
# wait.sh and wrapup.sh both resolve through this so they can never disagree
# on which seat a run refers to.
latest_seat() {
  podman ps -a --format '{{.Names}}' 2>/dev/null | grep -E '^seat-' | sort -r | head -n1
}

# Create (if needed) and mark the harness workspace.
mark_workspace() {
  mkdir -p "$WORK"
  : > "$WORK/.testdrive-marker"
}

# Remove every harness container and every credential-bearing image (by
# name/image and by ownership label — catching dangling layers), clear the
# workspace that may hold forensic credential copies, and verify nothing
# survives except the credential-free base image, which is retained across
# cycles. Exits nonzero if podman is nonfunctional or any artifact remains.
# Idempotent: safe at any time, any number of times, from any interrupted state.
sweep() {
  local tag="${1:-cleanup}"
  if ! podman info >/dev/null 2>&1; then
    echo "FAIL: podman not functional; refusing to report clean" >&2
    return 1
  fi

  echo "[$tag] remove harness containers"
  local c
  for c in $(podman ps -a --format '{{.ID}}\t{{.Names}}\t{{.Image}}' 2>/dev/null \
      | awk -F'\t' '$2 ~ /^(provision-tmp|seat-)/ || $3 ~ /graph-engine-sandbox/ {print $1}'); do
    echo "  removing container $c"
    podman rm -f "$c" 2>/dev/null || true
  done

  local base_id
  base_id=$(podman images -q "$IMG_BASE" 2>/dev/null | head -n1)
  echo "[$tag] remove harness images (keeping the credential-free base)"
  local i
  for i in $(podman images --filter "label=${LABEL_KEY}=${LABEL_VAL}" -q 2>/dev/null); do
    if [ -n "$base_id" ] && [ "$i" = "$base_id" ]; then
      echo "  retaining credential-free base image $IMG_BASE"
      continue
    fi
    echo "  removing image $i"
    podman rmi -f "$i" 2>/dev/null || true
  done

  echo "[$tag] clear workspace (forensic credential copies)"
  if [ -f "$WORK/.testdrive-marker" ]; then
    rm -rf "$WORK" && echo "  workspace removed"
  else
    echo "  WARN: $WORK has no ownership marker; left in place"
  fi

  echo "[$tag] verify empty"
  local fail=0
  if ! podman ps -a >/dev/null 2>&1; then echo "FAIL: podman ps -a failed at verification"; fail=1; fi
  if podman ps -a --format '{{.Names}}' 2>/dev/null | grep -E '^(provision-tmp|seat-)' >/dev/null; then
    echo "FAIL: containers remain"
    podman ps -a --format '{{.Names}} {{.Image}}' | grep -E '^(provision-tmp|seat-)'
    fail=1
  fi
  if ! podman images >/dev/null 2>&1; then echo "FAIL: podman images failed at verification"; fail=1; fi
  local leftover=""
  for i in $(podman images --filter "label=${LABEL_KEY}=${LABEL_VAL}" -q 2>/dev/null); do
    if [ -n "$base_id" ] && [ "$i" = "$base_id" ]; then continue; fi
    leftover="$leftover $i"
  done
  if [ -n "$leftover" ]; then
    echo "FAIL: harness images remain"
    podman images --filter "label=${LABEL_KEY}=${LABEL_VAL}"
    fail=1
  fi
  if [ -f "$WORK/.testdrive-marker" ] && [ -e "$WORK" ]; then
    echo "FAIL: workspace remains"
    fail=1
  fi
  if [ "$fail" = 0 ]; then echo "SWEEP CLEAN"; return 0; else return 1; fi
}