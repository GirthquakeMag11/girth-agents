#!/bin/sh
# Removes the graph-engine install, but only the files the manifest records,
# and only when their checksums still match. The user-owned graph, the
# manifest, and this script are preserved unless --purge is given.
#
# Usage: $CONFIG/graph-engine/uninstall.sh [--purge] [--yes] [--dry-run] [--help]

set -u

SELF=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CONFIG=$(CDPATH= cd -- "$SELF/.." && pwd)
MANIFEST="$CONFIG/graph-engine/manifest"

PURGE=0
YES=0
DRY=0

usage() {
  echo "usage: uninstall.sh [--purge] [--yes] [--dry-run] [--help]"
}

for arg in "$@"; do
  case "$arg" in
    --purge) PURGE=1 ;;
    --yes) YES=1 ;;
    --dry-run) DRY=1 ;;
    --help) usage; exit 0 ;;
    *) echo "uninstall: unknown option '$arg'" >&2; usage >&2; exit 2 ;;
  esac
done

if [ ! -f "$MANIFEST" ]; then
  echo "uninstall: no graph-engine manifest at $MANIFEST; refusing to guess" >&2
  exit 1
fi

if ! command -v sha256sum >/dev/null 2>&1 && ! command -v shasum >/dev/null 2>&1; then
  echo "uninstall: sha256sum or shasum is required" >&2
  exit 1
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' 0
ENTRIES="$TMP/entries"
: > "$ENTRIES"

checksum_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
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

# Walk the manifest and collect entries, refusing any unsafe path.
manifest_version=""
while IFS='	' read -r kind sha path; do
  case "$kind" in
    \#*|"") continue ;;
    version) manifest_version="$sha"; continue ;;
    file) ;;
    *) echo "uninstall: unknown manifest line '$kind'" >&2; exit 1 ;;
  esac
  case "$path" in
    /*|*..*) echo "uninstall: unsafe manifest path '$path'" >&2; exit 1 ;;
  esac
  printf '%s\t%s\n' "$sha" "$path" >> "$ENTRIES"
done < "$MANIFEST"

files_count=$(wc -l < "$ENTRIES" | tr -d ' ')
echo "graph-engine v${manifest_version:-unknown} at $CONFIG"
echo "managed files: $files_count"
if [ "$PURGE" = 1 ]; then
  echo "graph/: will be removed"
else
  echo "graph/: preserved"
fi

if [ "$DRY" = 0 ]; then
  confirm "Remove ${files_count} managed files?" || { echo "uninstall: cancelled"; exit 0; }
  if [ "$PURGE" = 1 ]; then
    confirm "Also remove the user-owned graph/, manifest, and this script?" || { echo "uninstall: purge cancelled"; exit 0; }
  fi
fi

removed=0
kept=0
while IFS='	' read -r sha path; do
  [ -z "$path" ] && continue
  abs="$CONFIG/$path"
  if [ ! -f "$abs" ]; then
    continue
  fi
  actual=$(checksum_of "$abs")
  if [ "$actual" = "$sha" ]; then
    if [ "$DRY" = 0 ]; then
      rm -f "$abs"
      echo "removed $path"
    else
      echo "would remove $path"
    fi
    removed=$((removed + 1))
  else
    echo "kept   $path (modified; checksum differs)"
    kept=$((kept + 1))
  fi
done < "$ENTRIES"

# Remove the empty installer-owned directories, derived from the manifest and
# deepest first. rmdir refuses when a directory is non-empty, so unrelated
# files are never touched.
if [ "$DRY" = 0 ]; then
  dirs=""
  while IFS='	' read -r sha path; do
    [ -z "$path" ] && continue
    case "$path" in /*|*..*) continue ;; esac
    dir=$(dirname "$path")
    while [ -n "$dir" ] && [ "$dir" != "." ]; do
      dirs="$dirs
$dir"
      dir=$(dirname "$dir")
    done
  done < "$ENTRIES"
  for rel in $(printf '%s' "$dirs" | sort -u | awk -F/ '{ printf "%04d %s\n", NF, $0 }' | sort -rn | cut -d' ' -f2-); do
    rmdir "$CONFIG/$rel" >/dev/null 2>&1 || true
  done
fi

if [ "$PURGE" = 1 ] && [ "$DRY" = 0 ]; then
  rm -rf "$CONFIG/graph-engine/graph"
  rm -f "$MANIFEST"
  rm -f "$SELF/uninstall.sh"
  rmdir "$SELF" >/dev/null 2>&1 || true
  echo "purged graph/, manifest, and uninstaller"
fi

if [ "$DRY" = 1 ]; then
  echo "dry run: no files changed"
else
  echo "removed $removed, kept $kept modified"
  if [ "$removed" = 0 ] && [ "$PURGE" = 0 ]; then
    echo "nothing to remove"
  fi
  echo "Run /reload in OpenCode to drop the plugin if it was already running."
fi
exit 0