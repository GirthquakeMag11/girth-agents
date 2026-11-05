#!/bin/sh
# Installs Graph Engine into OpenCode's global configuration.
#
# The archive is the product. This script verifies its checksum, extracts it,
# installs the plugin package and (once) a user-owned graph, writes the
# uninstaller and a checksum manifest, and touches nothing outside of the
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

# merge_disables TARGET
#
# Idempotently merges the "-opencode.agent" and "-opencode.plan" plugin-removal
# directives into TARGET's "plugins" array, using awk only (no jq; the installer
# must not require Node). JSON(C)-aware: comments and string contents are blanked
# for structural scanning, so the key and the array boundary are found without
# ever matching inside a string or comment; everything else is preserved
# byte-for-byte. Returns 0 regardless: a refusal is a note, never a failure.
merge_disables() {
  target="$1"
  missing=""
  grep -qF '"-opencode.agent"' "$target" 2>/dev/null || missing="${missing}agent "
  grep -qF '"-opencode.plan"' "$target" 2>/dev/null || missing="${missing}plan "
  if [ -z "$missing" ]; then
    return 0
  fi

  awk_src="$TMP/merge-plugins.awk"
  cat > "$awk_src" <<'AWK'
BEGIN {
  n = split(missing, M, " ")
  add = ""
  for (m = 1; m <= n; m++) {
    if (M[m] == "") continue
    add = add (add == "" ? "" : ", ") ("\"" "-opencode." M[m] "\"")
  }
  inBlockComment = 0
}
{
  raw[NR] = $0
  line = $0
  len = length(line)
  c = ""
  d = ""
  inStr = 0
  inLineComment = 0
  for (i = 1; i <= len; i++) {
    ch = substr(line, i, 1)
    if (inBlockComment) {
      if (ch == "*" && i < len && substr(line, i + 1, 1) == "/") { c = c "  "; d = d "  "; i++; inBlockComment = 0 }
      else { c = c " "; d = d " " }
      continue
    }
    if (inStr) {
      if (ch == "\\") {
        nxt = (i < len) ? substr(line, i + 1, 1) : ""
        c = c "\\" nxt
        d = d "  "
        i++
      } else if (ch == "\"") {
        c = c "\""
        d = d " "
        inStr = 0
      } else {
        c = c ch
        d = d " "
      }
      continue
    }
    if (inLineComment) { c = c " "; d = d " "; continue }
    if (ch == "\"") { c = c "\""; d = d "\""; inStr = 1; continue }
    if (ch == "/" && i < len && substr(line, i + 1, 1) == "/") { c = c "  "; d = d "  "; i++; inLineComment = 1; continue }
    if (ch == "/" && i < len && substr(line, i + 1, 1) == "*") { c = c "  "; d = d "  "; i++; inBlockComment = 1; continue }
    c = c ch
    d = d ch
  }
  C[NR] = c
  D[NR] = d
  N = NR
}
END {
  SC = ""
  SD = ""
  for (j = 1; j <= N; j++) { SC = SC C[j] "\n"; SD = SD D[j] "\n" }
  L = length(SC)
  kp = index(SC, "\"plugins\"")
  keyPos = 0
  while (kp > 0) {
    ns = substr(SC, kp + 9)
    if (ns ~ /^[ \t\n]*:/) { keyPos = kp; break }
    nx = index(substr(SC, kp + 1), "\"plugins\"")
    if (nx == 0) break
    kp += nx
  }
  if (keyPos > 0) {
    i = keyPos + 9
    while (i <= L && (substr(SD, i, 1) == " " || substr(SD, i, 1) == "\t" || substr(SD, i, 1) == "\n")) i++
    if (i > L || substr(SD, i, 1) != ":") { print "#noarray"; exit 2 }
    i++
    while (i <= L && (substr(SD, i, 1) == " " || substr(SD, i, 1) == "\t" || substr(SD, i, 1) == "\n")) i++
    if (i > L || substr(SD, i, 1) != "[") { print "#noarray"; exit 2 }
    openPos = i
    depth = 1
    i++
    while (i <= L && depth > 0) {
      ch = substr(SD, i, 1)
      if (ch == "[") depth++
      else if (ch == "]") depth--
      i++
    }
    if (depth > 0) { print "#unclosed"; exit 2 }
    closePos = i - 1
    inner = substr(SD, openPos + 1, closePos - openPos - 1)
    empty = (inner ~ /^[ \t\n]*$/)
    insert = empty ? add : ", " add
  } else {
    bp = index(SD, "{")
    if (bp == 0) { print "#noobj"; exit 2 }
    after = substr(SD, bp + 1)
    if (after !~ /^[ \t]*\n/) { print "#inline"; exit 2 }
    insert = "\n  \"plugins\": [" add "],"
    closePos = bp + 1
  }
  R = ""
  for (j = 1; j <= N; j++) R = R raw[j] "\n"
  printf "%s%s%s", substr(R, 1, closePos - 1), insert, substr(R, closePos)
}
AWK

  outp="$TMP/merged-config"
  if LC_ALL=C awk -v missing="$missing" -f "$awk_src" "$target" > "$outp" 2>/dev/null; then
    cat "$outp" > "$target"
  else
    echo "install: note: could not safely merge into $target; add \"-opencode.agent\" and \"-opencode.plan\" to its plugins list manually" >&2
  fi
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
config_guess=$CONFIG_DIR
CONFIG_DIR=$(CDPATH= cd -- "$config_guess" 2>/dev/null && pwd) || {
  echo "install: config directory does not exist: $config_guess" >&2
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
tar -xzf "$ARCHIVE" -C "$TMP/src" || { echo "install: cannot extract $ARCHIVE" >&2; exit 1; }

if [ "$(find "$TMP/src" -type l | wc -l | tr -d ' ')" != "0" ]; then
  echo "install: the archive contains a symbolic link; refusing" >&2
  exit 1
fi
top_dirs=$(find "$TMP/src" -mindepth 1 -maxdepth 1 | sed "s#^$TMP/src/##")
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
# The Engineer/Conductor and their skills now live inside the seeded graph, so
# there are no global agents or skills to clash on.
fail=""
[ -e "$CONFIG_DIR/plugins/graph-engine" ] && fail="plugins/graph-engine already exists"
[ -e "$CONFIG_DIR/plugins/graph-engine-utils" ] && fail="plugins/graph-engine-utils already exists"
[ -e "$CONFIG_DIR/graph-engine/manifest" ] && fail="graph-engine/manifest already exists"
if [ -n "$fail" ]; then
  echo "install: refused: $fail" >&2
  exit 1
fi

echo "version:    ${VERSION}"
echo "install root: $CONFIG_DIR"

# 10. Build the manifest from the installed plugin package (the graph is
# user-owned and not manifest-tracked).
( cd "$TOP" && find plugin plugin-utils -type f | sort ) > "$TMP/files"
MANIFEST_LINES="# graph-engine manifest v1
version	$VERSION"
while IFS= read -r rel; do
  abs="$TOP/$rel"
  [ -f "$abs" ] || continue
  hash=$(checksum_of "$abs")
  case "$rel" in
    plugin/*) config_rel=$(printf '%s' "$rel" | sed 's#^plugin/#plugins/graph-engine/#') ;;
    plugin-utils/*) config_rel=$(printf '%s' "$rel" | sed 's#^plugin-utils/#plugins/graph-engine-utils/#') ;;
    *) echo "install: unexpected staged path '$rel'" >&2; exit 1 ;;
  esac
  MANIFEST_LINES="$MANIFEST_LINES
file	$hash	$config_rel"
done < "$TMP/files"

# 11. Publish everything (skipped by --dry-run).
STAGED_COUNT=$(wc -l < "$TMP/files" | tr -d ' ')
if [ "$DRY" = 1 ]; then
  echo "dry run: would install $STAGED_COUNT plugin/skill files; writing nothing"
  exit 0
fi

fail() {
  echo "install: $1" >&2
  exit 1
}

mkdir -p "$CONFIG_DIR/plugins" || fail "cannot create $CONFIG_DIR/plugins"
cp -R "$TOP/plugin" "$CONFIG_DIR/plugins/graph-engine" || fail "cannot install the plugin package"
cp -R "$TOP/plugin-utils" "$CONFIG_DIR/plugins/graph-engine-utils" || fail "cannot install the utils plugin package"

mkdir -p "$CONFIG_DIR/graph-engine" || fail "cannot create $CONFIG_DIR/graph-engine"
if [ ! -e "$CONFIG_DIR/graph-engine/graph" ]; then
  cp -R "$TOP/graph" "$CONFIG_DIR/graph-engine/graph" || fail "cannot seed the graph"
  seeded="yes"
else
  seeded="no (existing graph preserved)"
fi

cp "$TOP/uninstall.sh" "$CONFIG_DIR/graph-engine/uninstall.sh" || fail "cannot install the uninstaller"
printf '%s\n' "$MANIFEST_LINES" > "$CONFIG_DIR/graph-engine/manifest" || fail "cannot write the manifest"

# Disable the two core plugins this package replaces (opencode.agent and
# opencode.plan), by merging removal directives into the global config's
# `plugins` array. opencode.jsonc is preferred over opencode.json; if neither
# exists, create opencode.json. Idempotent; uninstall does not revert this edit.
config_target=""
if [ -f "$CONFIG_DIR/opencode.jsonc" ]; then config_target="$CONFIG_DIR/opencode.jsonc"
elif [ -f "$CONFIG_DIR/opencode.json" ]; then config_target="$CONFIG_DIR/opencode.json"
fi
config_note=""
if [ -z "$config_target" ]; then
  printf '{\n  "plugins": [\n    "-opencode.agent",\n    "-opencode.plan"\n  ]\n}\n' > "$CONFIG_DIR/opencode.json"
  config_note="wrote $CONFIG_DIR/opencode.json (disabling opencode.agent + opencode.plan)"
else
  merge_disables "$config_target"
  config_note="merged plugin disables into $config_target"
fi

# 12. Report.
echo "installed:  Graph Engine v$VERSION into $CONFIG_DIR"
echo "graph:      $CONFIG_DIR/graph-engine/graph ($seeded)"
echo "plugin:     OpenCode loads $CONFIG_DIR/plugins/graph-engine automatically"
echo "plugin:     OpenCode loads $CONFIG_DIR/plugins/graph-engine-utils automatically"
echo "config:     $config_note"
if [ "$seeded" = "no (existing graph preserved)" ]; then
  echo "note:       an existing graph was preserved — the Engineer and Conductor"
  echo "            are now graph-mounted, so they stay absent until that graph"
  echo "            includes them"
fi
echo "note:       run /reload in OpenCode if it was already running"
echo "note:       no project files are created"

exit 0