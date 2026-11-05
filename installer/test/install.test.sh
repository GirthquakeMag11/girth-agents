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
if grep -q 'plugin-utils/server\.ts$' "$WORK/archive.list"; then
  pass "the archive carries the utils plugin tree"
else
  fail "the archive carries the utils plugin tree"
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
assert_file "$CONFIG/plugins/graph-engine-utils/server.ts" "the utils plugin package is installed"
assert_file "$CONFIG/plugins/graph-engine-utils/package.json" "the utils plugin package.json is installed"
assert_file "$CONFIG/opencode.json" "install creates opencode.json with the disables"
assert_contains '"-opencode.agent"' "$(cat "$CONFIG/opencode.json")" "opencode.json disables opencode.agent"
assert_contains '"-opencode.plan"' "$(cat "$CONFIG/opencode.json")" "opencode.json disables opencode.plan"
assert_file "$CONFIG/graph-engine/graph/config.json" "a user-owned graph is seeded"
assert_file "$CONFIG/graph-engine/graph/agents/builder.md" "graph agents are seeded"
assert_file "$CONFIG/graph-engine/graph/agents/engineer.md" "the Engineer is seeded as a graph agent"
assert_file "$CONFIG/graph-engine/graph/agents/conductor.md" "the Conductor is seeded as a graph agent"
assert_file "$CONFIG/graph-engine/graph/skills/graph-authoring.md" "graph-authoring is seeded as a graph skill"
assert_file "$CONFIG/graph-engine/graph/nodes/implement.md" "graph nodes are seeded"
assert_file "$CONFIG/graph-engine/manifest" "a manifest is written"
assert_file "$CONFIG/graph-engine/uninstall.sh" "the uninstaller is installed"
assert_not_exists "$PROJECT/.opencode" "no project files are written"
assert_not_exists "$CONFIG/graph-engine/manifest.unexpected" "no stray files"

# The manifest lists plugin files with checksums, never graph/ or uninstall.sh.
if grep -qE 'graph-engine/graph|uninstall\.sh' "$CONFIG/graph-engine/manifest"; then
  fail "the manifest lists the user-owned graph or the uninstaller"
else
  pass "the manifest lists only plugin files"
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

# The Engineer's edit permission is scoped through the @GRAPH_DIR@ token, which
# the plugin expands at runtime — no install-time path specialization remains.
assert_contains '@GRAPH_DIR@' "$(cat "$CONFIG/graph-engine/graph/agents/engineer.md")" "engineer.md scopes edit through @GRAPH_DIR@"

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

# 6b. The config merge: existing file, idempotency, and JSONC preference.
MERGE1="$WORK/merge1"
mkdir -p "$MERGE1"
printf '{\n  "theme": "dark",\n  "plugins": ["foo"]\n}\n' > "$MERGE1/opencode.json"
sh "$DIST/install.sh" --archive "$ARCHIVE" --checksum "$CHECKSUM" --config-dir "$MERGE1" --yes > "$WORK/merge1.out" 2>&1
assert_contains '"theme": "dark"' "$(cat "$MERGE1/opencode.json")" "merge preserves unrelated keys"
assert_contains '"foo"' "$(cat "$MERGE1/opencode.json")" "merge preserves existing plugin entries"
assert_contains '"-opencode.agent"' "$(cat "$MERGE1/opencode.json")" "merge adds the agent disable"
assert_contains '"-opencode.plan"' "$(cat "$MERGE1/opencode.json")" "merge adds the plan disable"
assert_eq "1" "$(grep -c '"-opencode.agent"' "$MERGE1/opencode.json")" "merge does not duplicate the agent disable"

MERGE2="$WORK/merge2"
mkdir -p "$MERGE2"
printf '{\n  "plugins": ["-opencode.agent", "-opencode.plan", "foo"]\n}\n' > "$MERGE2/opencode.json"
cp "$MERGE2/opencode.json" "$WORK/merge2.before"
sh "$DIST/install.sh" --archive "$ARCHIVE" --checksum "$CHECKSUM" --config-dir "$MERGE2" --yes > "$WORK/merge2.out" 2>&1
assert_eq "$(cat "$WORK/merge2.before")" "$(cat "$MERGE2/opencode.json")" "an idempotent merge leaves the file byte-identical"

MERGE3="$WORK/merge3"
mkdir -p "$MERGE3"
printf '{\n  // keep this comment\n  "plugins": ["legacy-plugin"]\n}\n' > "$MERGE3/opencode.jsonc"
printf '{"plugins": ["from-json"]}\n' > "$MERGE3/opencode.json"
sh "$DIST/install.sh" --archive "$ARCHIVE" --checksum "$CHECKSUM" --config-dir "$MERGE3" --yes > "$WORK/merge3.out" 2>&1
assert_contains '// keep this comment' "$(cat "$MERGE3/opencode.jsonc")" "JSONC comments survive the merge"
assert_contains '"legacy-plugin"' "$(cat "$MERGE3/opencode.jsonc")" "JSONC entries are preserved"
assert_contains '"-opencode.agent"' "$(cat "$MERGE3/opencode.jsonc")" "the merge targets opencode.jsonc"
assert_contains '"from-json"' "$(cat "$MERGE3/opencode.json")" "opencode.json is untouched when jsonc exists"

# 6c. Regression: a nested "plugins" key must not hijack the merge. The disables
# land in the TOP-LEVEL array, not the nested one.
NEST="$WORK/nest"
mkdir -p "$NEST"
printf '{"settings":{"plugins":["nested-a"]},"plugins":["top-a"]}\n' > "$NEST/opencode.json"
sh "$DIST/install.sh" --archive "$ARCHIVE" --checksum "$CHECKSUM" --config-dir "$NEST" --yes > "$WORK/nest.out" 2>&1
assert_eq '{"settings":{"plugins":["nested-a"]},"plugins":["top-a", "-opencode.agent", "-opencode.plan"]}' \
  "$(cat "$NEST/opencode.json")" \
  "the disables merge into the top-level plugins array, not the nested one"

# 6d. Regression: a mention of the disable in a comment must not spoof presence.
SPOOF="$WORK/spoof"
mkdir -p "$SPOOF"
printf '{\n  // note: "-opencode.agent" appears only in this comment\n  "plugins": ["foo"]\n}\n' > "$SPOOF/opencode.jsonc"
sh "$DIST/install.sh" --archive "$ARCHIVE" --checksum "$CHECKSUM" --config-dir "$SPOOF" --yes > "$WORK/spoof.out" 2>&1
assert_eq '{
  // note: "-opencode.agent" appears only in this comment
  "plugins": ["foo", "-opencode.agent", "-opencode.plan"]
}' "$(cat "$SPOOF/opencode.jsonc")" "a comment-only mention does not suppress the agent disable"

# 6e. Regression: a trailing comma in the plugins array yields valid output with
# each entry exactly once.
TRAIL="$WORK/trail"
mkdir -p "$TRAIL"
printf '{"plugins":["legacy",]}\n' > "$TRAIL/opencode.json"
sh "$DIST/install.sh" --archive "$ARCHIVE" --checksum "$CHECKSUM" --config-dir "$TRAIL" --yes > "$WORK/trail.out" 2>&1
assert_eq '{"plugins":["legacy", "-opencode.agent", "-opencode.plan"]}' \
  "$(cat "$TRAIL/opencode.json")" \
  "a trailing comma is resolved into a clean separator"

# 6f. Regression: a single-line config with no top-level plugins key is refused
# untouched, the install still completes, and the note is truthful.
REFUSE="$WORK/refuse"
mkdir -p "$REFUSE"
printf '{"theme":"dark"}\n' > "$REFUSE/opencode.json"
cp "$REFUSE/opencode.json" "$WORK/refuse.before"
sh "$DIST/install.sh" --archive "$ARCHIVE" --checksum "$CHECKSUM" --config-dir "$REFUSE" --yes > "$WORK/refuse.out" 2>&1
assert_eq "$(cat "$WORK/refuse.before")" "$(cat "$REFUSE/opencode.json")" "a single-line config is left unchanged on refusal"
assert_contains "installed:" "$(cat "$WORK/refuse.out")" "the install completes after a merge refusal"
assert_contains "could not merge plugin disables" "$(cat "$WORK/refuse.out")" "the note truthfully reports the refused merge"

# 6g. Regression: a comment between a trailing comma and the closing bracket
# survives the merge (the splice lands after the comma, not through it), with
# both disables added exactly once and no doubled comma.
TRAILC="$WORK/trailc"
mkdir -p "$TRAILC"
printf '{"plugins":["legacy", /* keep me */]}\n' > "$TRAILC/opencode.json"
sh "$DIST/install.sh" --archive "$ARCHIVE" --checksum "$CHECKSUM" --config-dir "$TRAILC" --yes > "$WORK/trailc.out" 2>&1
trailc_out="$(cat "$TRAILC/opencode.json")"
assert_contains '/\* keep me \*/' "$trailc_out" "a comment after a trailing comma survives the merge"
assert_contains '"-opencode.agent"' "$trailc_out" "the agent disable is added when a trailing-comma comment is present"
assert_contains '"-opencode.plan"' "$trailc_out" "the plan disable is added when a trailing-comma comment is present"
assert_eq "1" "$(grep -c '"-opencode.agent"' "$TRAILC/opencode.json")" "no duplicate agent disable beside a trailing-comma comment"
if grep -q ',,' "$TRAILC/opencode.json"; then
  fail "no doubled comma is produced by a trailing-comma comment merge"
else
  pass "no doubled comma is produced by a trailing-comma comment merge"
fi

# 7. Uninstall removes only checksum-matching files and warns on modified ones.
printf '%s\n' "local change" >> "$CONFIG/plugins/graph-engine/server.ts"
before=$(find "$CONFIG" -type f | wc -l | tr -d ' ')
sh "$CONFIG/graph-engine/uninstall.sh" --yes > "$WORK/uninstall.out" 2>&1
assert_file "$CONFIG/graph-engine/graph/config.json" "uninstall preserves the graph by default"
assert_file "$CONFIG/graph-engine/graph/agents/engineer.md" "the Engineer is preserved as part of the graph"
assert_contains "modified" "$(cat "$WORK/uninstall.out")" "a modified file is reported"
assert_not_exists "$CONFIG/plugins/graph-engine/package.json" "unmodified plugin files are removed"
assert_file "$CONFIG/plugins/graph-engine/server.ts" "a modified file is preserved"
assert_not_exists "$CONFIG/plugins/graph-engine-utils/server.ts" "the utils plugin tree is removed"
assert_not_exists "$CONFIG/plugins/graph-engine-utils/package.json" "the utils plugin package.json is removed"

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