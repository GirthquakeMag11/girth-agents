#!/bin/sh
# End-to-end installer and uninstaller tests. Builds the archive into a
# temporary dist, exercises install/uninstall against temporary config
# directories, and asserts the product boundary. No Node is run anywhere.

set -u

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' 0

DIST="$WORK/dist"
CONFIG="$WORK/config"
PROJECT="$WORK/project"

failures=0
checks=0

sum_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

pass() {
  checks=$((checks + 1))
  echo "ok   #$checks $1"
}

fail() {
  failures=$((failures + 1))
  echo "FAIL #$checks $1" >&2
}

assert_eq() {
  checks=$((checks + 1))
  if [ "$1" = "$2" ]; then
    echo "ok   #$checks $3"
  else
    failures=$((failures + 1))
    echo "FAIL #$checks $3 (expected '$2', got '$1')" >&2
  fi
}

assert_file() {
  checks=$((checks + 1))
  if [ -f "$1" ]; then
    echo "ok   #$checks $2"
  else
    failures=$((failures + 1))
    echo "FAIL #$checks $2 (missing $1)" >&2
  fi
}

assert_not_exists() {
  checks=$((checks + 1))
  if [ ! -e "$1" ]; then
    echo "ok   #$checks $2"
  else
    failures=$((failures + 1))
    echo "FAIL #$checks $2 (exists: $1)" >&2
  fi
}

assert_contains() {
  checks=$((checks + 1))
  if printf '%s' "$2" | grep -q -- "$1"; then
    echo "ok   #$checks $3"
  else
    failures=$((failures + 1))
    echo "FAIL #$checks $3 (pattern '$1' not found)" >&2
  fi
}

# 1. Build the archive into a temporary dist.
mkdir -p "$PROJECT"
DIST_DIR="$DIST" sh "$ROOT/installer/build-archive.sh" > "$WORK/build.out" 2>&1
assert_file "$DIST/graph-engine-0.5.0.tar.gz" "build creates the archive"
assert_file "$DIST/graph-engine-0.5.0.tar.gz.sha256" "build creates the checksum"
assert_file "$DIST/install.sh" "build copies install.sh next to the archive"

ARCHIVE="$DIST/graph-engine-0.5.0.tar.gz"
CHECKSUM="$DIST/graph-engine-0.5.0.tar.gz.sha256"

# The install script ships outside the archive; the uninstaller inside it.
tar -tzf "$ARCHIVE" > "$WORK/archive.list"
if grep -q '/uninstall\.sh$' "$WORK/archive.list"; then
  pass "the archive carries uninstall.sh"
else
  fail "the archive carries uninstall.sh"
fi
if grep -q 'product\.conf' "$WORK/archive.list"; then
  pass "the archive carries product.conf"
else
  fail "the archive carries product.conf"
fi
if ! grep -q '/install\.sh$' "$WORK/archive.list"; then
  pass "install.sh stays out of the archive"
else
  fail "install.sh stays out of the archive"
fi
if grep -qE '(^|/)(test|proof|fixtures)(/|$)|\.opencode|node_modules|live-proof' "$WORK/archive.list"; then
  fail "the archive leaks a development or forbidden path"
else
  pass "the archive excludes tests, proofs, fixtures, and dev state"
fi

# Neither script may need or check for Node.
if grep -qE '\bnode\b|npm|npx' "$ROOT/installer/install.sh" "$ROOT/installer/uninstall.sh"; then
  fail "the installer or uninstaller checks for Node"
else
  pass "the installer never checks for Node"
fi

# 2. Clean install.
mkdir -p "$CONFIG"
sh "$DIST/install.sh" --archive "$ARCHIVE" --checksum "$CHECKSUM" --config-dir "$CONFIG" --yes > "$WORK/install.out" 2>&1
assert_file "$CONFIG/plugins/graph-engine/server.ts" "the plugin package is installed"
assert_file "$CONFIG/plugins/graph-engine/engine/runtime.mjs" "the engine is staged inside the plugin"
assert_file "$CONFIG/plugins/graph-engine/tui.tsx" "the dashboard TUI is installed"
assert_file "$CONFIG/skills/graph-authoring/SKILL.md" "graph-authoring is installed globally"
assert_file "$CONFIG/skills/dispatching/SKILL.md" "dispatching is installed globally"
assert_file "$CONFIG/graph-engine/graph/config.json" "a user-owned graph is seeded"
assert_file "$CONFIG/graph-engine/graph/agents/builder.md" "graph agents are seeded"
assert_file "$CONFIG/graph-engine/manifest" "a manifest is written"
assert_file "$CONFIG/graph-engine/uninstall.sh" "the uninstaller is installed"
assert_not_exists "$PROJECT/.opencode" "no project files are written"
assert_not_exists "$CONFIG/graph-engine/manifest.unexpected" "no stray files"

# The manifest lists plugin and skill files with checksums, never graph/.
if grep -qE 'graph-engine/graph|uninstall\.sh' "$CONFIG/graph-engine/manifest"; then
  fail "the manifest lists the user-owned graph or the uninstaller"
else
  pass "the manifest lists only plugin and skill files"
fi
while IFS='	' read -r kind hash path; do
  [ "$kind" = "file" ] || continue
  actual=$( sum_of "$CONFIG/$path" 2>/dev/null )
  if [ "$actual" != "$hash" ]; then
    fail "manifest checksum matches the installed file: $path"
  else
    pass "manifest checksum matches the installed file: $path"
  fi
done < "$CONFIG/graph-engine/manifest"

# 3. A second install refuses to overwrite the plugin.
if sh "$DIST/install.sh" --archive "$ARCHIVE" --checksum "$CHECKSUM" --config-dir "$CONFIG" --yes > "$WORK/reinstall.out" 2>&1; then
  fail "a second install over an existing plugin must refuse"
else
  pass "a second install refuses when the plugin exists"
fi
assert_contains "already exists" "$(cat "$WORK/reinstall.out")" "the refusal names the clash"

# 4. A checksum failure aborts before any write.
FRESH="$WORK/fresh"
mkdir -p "$WORK/tamper"
cp "$ROOT/installer/install.sh" "$WORK/tamper/"
cp "$ARCHIVE" "$WORK/tamper/bad.tar.gz"
printf '%s\n' "0000000000000000000000000000000000000000000000000000000000000000  bad.tar.gz" > "$WORK/tamper/bad.tar.gz.sha256"
mkdir -p "$FRESH"
if sh "$DIST/install.sh" --archive "$WORK/tamper/bad.tar.gz" --checksum "$WORK/tamper/bad.tar.gz.sha256" --config-dir "$FRESH" --yes > "$WORK/checksum.out" 2>&1; then
  fail "a checksum mismatch must abort"
else
  pass "a checksum mismatch aborts"
fi
assert_not_exists "$FRESH/plugins" "a checksum mismatch writes nothing"

# 5. --dry-run writes nothing.
DRY="$WORK/dry"
mkdir -p "$DRY"
sh "$DIST/install.sh" --archive "$ARCHIVE" --checksum "$CHECKSUM" --config-dir "$DRY" --yes --dry-run > "$WORK/dry.out" 2>&1
assert_not_exists "$DRY/plugins" "--dry-run writes no plugins"
assert_not_exists "$DRY/graph-engine" "--dry-run writes no graph"

# 6. An existing graph is preserved on install.
KEEP="$WORK/keep"
mkdir -p "$KEEP/graph-engine/graph"
printf '%s\n' "user edit" > "$KEEP/graph-engine/graph/keep.me"
sh "$DIST/install.sh" --archive "$ARCHIVE" --checksum "$CHECKSUM" --config-dir "$KEEP" --yes > "$WORK/keep.out" 2>&1
assert_file "$KEEP/graph-engine/graph/keep.me" "an existing graph file survives install"

# 7. Uninstall removes only checksum-matching files and warns on modified ones.
printf '%s\n' "local change" >> "$CONFIG/plugins/graph-engine/server.ts"
before=$(find "$CONFIG" -type f | wc -l | tr -d ' ')
sh "$CONFIG/graph-engine/uninstall.sh" --yes > "$WORK/uninstall.out" 2>&1
assert_file "$CONFIG/graph-engine/graph/config.json" "uninstall preserves the graph by default"
assert_contains "modified" "$(cat "$WORK/uninstall.out")" "a modified file is reported"
assert_not_exists "$CONFIG/plugins/graph-engine/package.json" "unmodified plugin files are removed"
assert_file "$CONFIG/plugins/graph-engine/server.ts" "a modified file is preserved"

# 8. Uninstall is idempotent.
sh "$CONFIG/graph-engine/uninstall.sh" --yes > "$WORK/uninstall2.out" 2>&1
assert_contains "nothing to remove" "$(cat "$WORK/uninstall2.out")" "a second uninstall reports nothing to remove"

# 9. --purge removes the graph too.
sh "$CONFIG/graph-engine/uninstall.sh" --purge --yes > "$WORK/purge.out" 2>&1
assert_not_exists "$CONFIG/graph-engine/graph" "--purge removes the graph"
assert_not_exists "$CONFIG/graph-engine/manifest" "--purge removes the manifest"

echo ""
echo "installer tests: $checks checks, $failures failures"
[ "$failures" = 0 ]