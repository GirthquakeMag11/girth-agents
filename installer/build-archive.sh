#!/bin/sh
# Development-only packaging script. Stages the product into a single archive
# directory, tars it, writes its SHA-256 file, and copies install.sh next to
# it. Nothing here runs at install time.
#
# Usage: installer/build-archive.sh

set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
DIST="${DIST_DIR:-$ROOT/dist}"

# Read product.conf without source/eval.
read_conf() {
  key="$1"
  value=$(sed -n "s/^${key}=\"\(.*\)\"$/\1/p" "$ROOT/product.conf")
  if [ -z "$value" ]; then
    echo "build-archive: product.conf is missing $key" >&2
    exit 1
  fi
  printf '%s' "$value"
}

SLUG=$(read_conf PRODUCT_SLUG)
VERSION=$(read_conf PROJECT_VERSION)

# The project version must match the engine's copy.
ENGINE_VERSION=$(sed -n 's/^export const PROJECT_VERSION = "\(.*\)";$/\1/p' "$ROOT/engine/version.mjs")
if [ "$ENGINE_VERSION" != "$VERSION" ]; then
  echo "build-archive: PROJECT_VERSION ($VERSION) does not match engine/version.mjs ($ENGINE_VERSION)" >&2
  exit 1
fi
FILE_VERSION=$(cat "$ROOT/VERSION")
if [ "$FILE_VERSION" != "$VERSION" ]; then
  echo "build-archive: PROJECT_VERSION ($VERSION) does not match VERSION ($FILE_VERSION)" >&2
  exit 1
fi

STAGE="$DIST/$SLUG-$VERSION"
ARCHIVE="$DIST/$SLUG-$VERSION.tar.gz"
CHECKSUM="$ARCHIVE.sha256"

rm -rf "$STAGE"
mkdir -p "$STAGE/plugin/engine" "$STAGE/plugin/dashboard/src" \
  "$STAGE/graph"

# Plugin server, TUI, and RPC parts plus the self-contained engine and
# dashboard sources.
cp "$ROOT/opencode/plugins/graph-engine/package.json" "$STAGE/plugin/"
cp "$ROOT/opencode/plugins/graph-engine/server.ts" "$STAGE/plugin/"
cp "$ROOT/opencode/plugins/graph-engine/tui.tsx" "$STAGE/plugin/"
cp "$ROOT/opencode/plugins/graph-engine/rpc.ts" "$STAGE/plugin/"
for file in "$ROOT"/engine/*.mjs; do
  case "$(basename "$file")" in
    live-proof.mjs) continue ;;
  esac
  cp "$file" "$STAGE/plugin/engine/"
done
cp "$ROOT"/dashboard/src/* "$STAGE/plugin/dashboard/src/"

# Graph template: agents (including the primary mounts), nodes, and skills.
mkdir -p "$STAGE/graph/agents" "$STAGE/graph/nodes" "$STAGE/graph/skills"
cp "$ROOT"/graph/config.json "$STAGE/graph/"
cp "$ROOT"/graph/agents/*.md "$STAGE/graph/agents/"
cp "$ROOT"/graph/nodes/*.md "$STAGE/graph/nodes/"
cp "$ROOT"/graph/skills/*.md "$STAGE/graph/skills/"

# Metadata the installer reads, plus the in-archive uninstaller.
cp "$ROOT/product.conf" "$STAGE/"
cp "$ROOT/VERSION" "$STAGE/"
cp "$ROOT/installer/uninstall.sh" "$STAGE/"

# Sanity: the stage must contain no development or forbidden path.
forbidden=$(find "$STAGE" -type f | sed "s#^$STAGE/##" | grep -E '(^|/)(test|proof|fixtures)(/|$)|\.opencode|node_modules|live-proof|^dist' || true)
if [ -n "$forbidden" ]; then
  echo "build-archive: forbidden path staged:" >&2
  echo "$forbidden" >&2
  exit 1
fi

rm -f "$ARCHIVE" "$CHECKSUM"
tar -czf "$ARCHIVE" -C "$DIST" "$SLUG-$VERSION"

if command -v sha256sum >/dev/null 2>&1; then
  (cd "$DIST" && sha256sum "$SLUG-$VERSION.tar.gz" > "$SLUG-$VERSION.tar.gz.sha256")
else
  (cd "$DIST" && shasum -a 256 "$SLUG-$VERSION.tar.gz" > "$SLUG-$VERSION.tar.gz.sha256")
fi

cp "$ROOT/installer/install.sh" "$DIST/install.sh"

# The archive may contain only the one expected top-level directory.
top=$(tar -tzf "$ARCHIVE" | sed 's#/.*##' | sort -u)
if [ "$(printf '%s\n' "$top" | wc -l | tr -d ' ')" != "1" ] || [ "$top" != "$SLUG-$VERSION" ]; then
  echo "build-archive: the archive must contain exactly one top-level directory named $SLUG-$VERSION" >&2
  tar -tzf "$ARCHIVE" >&2
  exit 1
fi

echo "$ARCHIVE"
echo "$CHECKSUM"
echo "$DIST/install.sh"