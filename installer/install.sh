#!/bin/sh
# Installs Graph Engine into OpenCode's global configuration.
#
# The archive is the product. This script verifies its checksum, extracts it,
# installs the plugin package, skills, and (once) a user-owned graph, writes
# the uninstaller and a checksum manifest, and touches nothing outside of the
# configuration directory.
#
# Usage: install.sh [--archive PATH] [--checksum PATH] [--config-dir PATH]
#                   [--yes] [--dry-run] [--help]

set -u

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

ARCHIVE_ARG=""
CHECKSUM_ARG=""
CONFIG_ARG=""
YES=0
DRY=0

usage() {
  echo "usage: install.sh [--archive PATH] [--checksum PATH] [--config-dir PATH] [--yes] [--dry-run] [--help]"
}

for arg in "$@"; do
  case "$arg" in
    --archive) ARCHIVE_ARG=1 ;;
    --checksum) CHECKSUM_ARG=1 ;;
    --config-dir) CONFIG_ARG=1 ;;
    --yes) YES=1 ;;
    --dry-run) DRY=1 ;;
    --help) usage; exit 0 ;;
    -*)
      echo "install: unknown option '$arg'" >&2
      usage >&2
      exit 2
      ;;
    *)
      if [ "$ARCHIVE_ARG" = 1 ]; then
        ARCHIVE="$arg"; ARCHIVE_ARG=""
      elif [ "$CHECKSUM_ARG" = 1 ]; then
        CHECKSUM="$arg"; CHECKSUM_ARG=""
      elif [ "$CONFIG_ARG" = 1 ]; then
        CONFIG_DIR="$arg"; CONFIG_ARG=""
      else
        echo "install: unexpected argument '$arg'" >&2
        usage >&2
        exit 2
      fi
      ;;
  esac
done

[ "$ARCHIVE_ARG" = 1 ] && { echo "install: --archive needs a path" >&2; exit 2; }
[ "$CHECKSUM_ARG" = 1 ] && { echo "install: --checksum needs a path" >&2; exit 2; }
[ "$CONFIG_ARG" = 1 ] && { echo "install: --config-dir needs a path" >&2; exit 2; }

checksum_tool() {
  if command -v sha256sum >/dev/null 2>&1; then
    echo "sha256sum"
  elif command -v shasum >/dev/null 2>&1; then
    echo "shasum"
  else
    echo ""
  fi
}

checksum_of() {
  if [ "$(checksum_tool)" = "shasum" ]; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    sha256sum "$1" | awk '{print $1}'
  fi
}

ask() {
  printf '%s' "$1 "
  IFS= read -r answer || answer=""
  [ -n "$answer" ]
}

confirm() {
  if [ "$YES" = 1 ]; then
    return 0
  fi
  printf '%s' "$1 [y/N] "
  IFS= read -r answer || answer=n
  case "$answer" in
    y|Y|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

# 1. Find the archive.
ARCHIVE=${ARCHIVE:-}
if [ -z "$ARCHIVE" ]; then
  found=$(ls "$SCRIPT_DIR"/graph-engine-*.tar.gz 2>/dev/null | head -n 1)
  if [ -n "$found" ]; then
    ARCHIVE=$found
  fi
fi
while [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE" ]; do
  if [ -n "$ARCHIVE" ]; then
    echo "install: archive not found: $ARCHIVE"
  fi
  if ! ask "Path to the graph-engine archive? (.tar.gz)"; then
    echo "install: no archive" >&2
    exit 1
  fi
  ARCHIVE=$answer
done
ARCHIVE=$(CDPATH= cd -- "$(dirname -- "$ARCHIVE")" && pwd)/$(basename "$ARCHIVE")

# 2. Find the checksum file.
CHECKSUM=${CHECKSUM:-}
if [ -z "$CHECKSUM" ]; then
  [ -f "$ARCHIVE.sha256" ] && CHECKSUM="$ARCHIVE.sha256"
fi
if [ -z "$CHECKSUM" ] || [ ! -f "$CHECKSUM" ]; then
  echo "install: no checksum file for $ARCHIVE" >&2
  exit 1
fi
CHECKSUM=$(CDPATH= cd -- "$(dirname -- "$CHECKSUM")" && pwd)/$(basename "$CHECKSUM")

# 3. Detect the config directory.
CONFIG_DIR=${CONFIG_DIR:-}
if [ -z "$CONFIG_DIR" ]; then
  if [ -n "${XDG_CONFIG_HOME:-}" ]; then
    CONFIG_DIR="$XDG_CONFIG_HOME/opencode"
  elif [ -n "${HOME:-}" ]; then
    CONFIG_DIR="$HOME/.config/opencode"
  fi
fi
if [ -z "$CONFIG_DIR" ]; then
  if ! ask "OpenCode config directory?"; then
    echo "install: no config directory" >&2
    exit 1
  fi
  CONFIG_DIR=$answer
fi
CONFIG_DIR=$(CDPATH= cd -- "$CONFIG_DIR" 2>/dev/null && pwd) || {
  echo "install: config directory does not exist: $CONFIG_DIR" >&2
  exit 1
}

# 4. Summary and confirmation.
echo "archive:    $ARCHIVE"
echo "checksum:   $CHECKSUM"
echo "config dir: $CONFIG_DIR"
confirm "Install Graph Engine into $CONFIG_DIR?" || { echo "install: cancelled"; exit 0; }

# 5. Prereq checks: tar and a checksum tool. No Node or OpenCode check.
command -v tar >/dev/null 2>&1 || { echo "install: tar is required" >&2; exit 1; }
[ -z "$(checksum_tool)" ] && { echo "install: sha256sum or shasum is required" >&2; exit 1; }

# 6. Verify the archive checksum.
expected=$(awk '{print $1}' "$CHECKSUM")
actual=$(checksum_of "$ARCHIVE")
if [ "$expected" != "$actual" ]; then
  echo "install: checksum mismatch for $ARCHIVE" >&2
  echo "  expected $expected" >&2
  echo "  actual   $actual" >&2
  exit 1
fi

# 7. Extract into a temp dir; clean up on every exit path.
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' 0
mkdir -p "$TMP/src"
tar -xzf "$ARCHIVE" -C "$TMP/src"

top_dirs=$(ls "$TMP/src")
top_count=$(printf '%s\n' "$top_dirs" | sed '/^$/d' | wc -l | tr -d ' ')
if [ "$top_count" != 1 ] || [ ! -d "$TMP/src/$top_dirs" ]; then
  echo "install: the archive must contain exactly one top-level directory" >&2
  exit 1
fi
TOP=$(CDPATH= cd -- "$TMP/src/$top_dirs" && pwd)

# 8. Validate the archive identity against its own metadata.
read_conf() {
  sed -n "s/^${1}=\"\(.*\)\"$/\1/p" "$TOP/product.conf"
}
SLUG=$(read_conf PRODUCT_SLUG)
VERSION=$(read_conf PROJECT_VERSION)
[ -n "$SLUG" ] && [ -n "$VERSION" ] || { echo "install: archive product.conf is incomplete" >&2; exit 1; }
[ "$(basename "$TOP")" = "$SLUG-$VERSION" ] || {
  echo "install: archive directory '$(basename "$TOP")' does not match $SLUG-$VERSION" >&2
  exit 1
}
[ -f "$TOP/VERSION" ] || { echo "install: archive has no VERSION" >&2; exit 1; }
[ "$(cat "$TOP/VERSION")" = "$VERSION" ] || { echo "install: archive VERSION does not match product.conf" >&2; exit 1; }

# 9. Preflight destinations. Abort on any clash except the user-owned graph.
fail=""
[ -e "$CONFIG_DIR/plugins/graph-engine" ] && fail="plugins/graph-engine already exists"
[ -e "$CONFIG_DIR/skills/graph-authoring" ] && fail="skills/graph-authoring already exists"
[ -e "$CONFIG_DIR/skills/dispatching" ] && fail="skills/dispatching already exists"
[ -e "$CONFIG_DIR/graph-engine/manifest" ] && fail="graph-engine/manifest already exists"
if [ -n "$fail" ]; then
  echo "install: refused: $fail" >&2
  exit 1
fi

echo "version:    ${VERSION}"
echo "install root: $CONFIG_DIR"

# 10. Build the manifest from what will be installed.
( cd "$TOP" && find plugin skills -type f | sort ) > "$TMP/files"
MANIFEST_LINES="# graph-engine manifest v1
version	$VERSION"
while IFS= read -r rel; do
  abs="$TOP/$rel"
  [ -f "$abs" ] || continue
  hash=$(checksum_of "$abs")
  config_rel=$(printf '%s' "$rel" | sed 's#^plugin/#plugins/graph-engine/#')
  MANIFEST_LINES="$MANIFEST_LINES
file	$hash	$config_rel"
done < "$TMP/files"

# 11. Publish everything (skipped by --dry-run).
STAGED_COUNT=$(wc -l < "$TMP/files" | tr -d ' ')
if [ "$DRY" = 1 ]; then
  echo "dry run: would install $STAGED_COUNT plugin/skill files; writing nothing"
  exit 0
fi

mkdir -p "$CONFIG_DIR/plugins"
cp -R "$TOP/plugin" "$CONFIG_DIR/plugins/graph-engine"

mkdir -p "$CONFIG_DIR/skills"
cp -R "$TOP/skills/graph-authoring" "$CONFIG_DIR/skills/graph-authoring"
cp -R "$TOP/skills/dispatching" "$CONFIG_DIR/skills/dispatching"

mkdir -p "$CONFIG_DIR/graph-engine"
if [ ! -e "$CONFIG_DIR/graph-engine/graph" ]; then
  cp -R "$TOP/graph" "$CONFIG_DIR/graph-engine/graph"
  seeded="yes"
else
  seeded="no (existing graph preserved)"
fi

cp "$TOP/uninstall.sh" "$CONFIG_DIR/graph-engine/uninstall.sh"
printf '%s\n' "$MANIFEST_LINES" > "$CONFIG_DIR/graph-engine/manifest"

# 12. Report.
echo "installed:  Graph Engine v$VERSION into $CONFIG_DIR"
echo "graph:      $CONFIG_DIR/graph-engine/graph ($seeded)"
echo "plugin:     OpenCode loads $CONFIG_DIR/plugins/graph-engine automatically"
echo "skills:     graph-authoring and dispatching installed globally"
echo "note:       run /reload in OpenCode if it was already running"
echo "note:       no project files are created"

exit 0