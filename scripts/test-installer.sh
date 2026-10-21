#!/usr/bin/env bash
# Test harness for scripts/install.sh.
#
# Exercises the installer against a scratch config directory and a small
# fixture catalog, and asserts today's behavior holds — the contract every
# later change to the script must preserve. One command, exit-code truth,
# no framework beyond shell.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALLER="$REPO_ROOT/scripts/install.sh"

PASS=0
FAIL=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

ok()   { PASS=$((PASS + 1)); }
fail() { printf 'FAIL: %s\n' "$*" >&2; FAIL=$((FAIL + 1)); }

# --- fixture builders -------------------------------------------------------
# A fixture is a mini-repo holding a copy of the real installer alongside a
# catalog. The installer resolves its source from its own location, so a
# copied installer installs the fixture's catalog. No change to the installer.

mk_fixture() { # $1 fixture dir
  local d="$1"
  mkdir -p "$d/scripts" "$d/.opencode/agents" "$d/.opencode/skills" "$d/.opencode/commands"
  cp "$INSTALLER" "$d/scripts/install.sh"
}

add_agent() { # $1 fixture  $2 id
  printf -- '---\ndescription: fixture agent\n---\n# %s\n' "$2" > "$1/.opencode/agents/$2.md"
}

add_skill() { # $1 fixture  $2 id
  mkdir -p "$1/.opencode/skills/$2"
  printf -- '---\ndescription: fixture skill\n---\n# %s\n' "$2" > "$1/.opencode/skills/$2/SKILL.md"
}

add_cmd() { # $1 fixture  $2 id
  printf -- '# %s\nfixture body\n' "$2" > "$1/.opencode/commands/$2.md"
}

# --- assertions -------------------------------------------------------------

expect_link() {  # $1 path  $2 context
  if [ -L "$1" ]; then ok; else fail "$2: expected a symlink at $1"; fi
}

expect_file() {  # $1 path  $2 context
  if [ -f "$1" ] && [ ! -L "$1" ]; then ok; else fail "$2: expected a regular file at $1"; fi
}

expect_absent() { # $1 path  $2 context
  if [ ! -e "$1" ] && [ ! -L "$1" ]; then ok; else fail "$2: expected nothing at $1"; fi
}

# list_installed <config dir> — relative paths under the three subdirs, sorted
list_installed() {
  local c="$1"
  ( cd "$c" && find agents commands skills -mindepth 1 2>/dev/null | sort )
}

# expect_installed <config dir> <fixture root> <one expected path per line>
expect_installed() {
  local c="$1" f="$2" want="$3"
  local got
  got="$(list_installed "$c")"
  if [ "$got" = "$want" ]; then ok; else
    fail "installed set mismatch (want / got):"
    diff <(printf '%s\n' "$want") <(printf '%s\n' "$got") >&2 || true
  fi
}

run_install() { # $1 fixture  $2 config dir  [--copy]
  local f="$1" c="$2"; shift 2
  OPENCODE_CONFIG_DIR="$c" bash "$f/scripts/install.sh" "$@" >"$c.out" 2>&1
}

# --- tests ------------------------------------------------------------------

test_symlink_install() {
  local f="$TMP/symlink-fixture" c="$TMP/symlink-config"
  mk_fixture "$f"
  add_agent "$f" alpha
  add_skill "$f" bravo
  add_skill "$f" charlie
  add_cmd "$f" delta
  run_install "$f" "$c"

  expect_link "$c/agents/alpha.md"    "$FUNCNAME"
  expect_link "$c/skills/bravo"       "$FUNCNAME"
  expect_link "$c/skills/charlie"     "$FUNCNAME"
  expect_link "$c/commands/delta.md"  "$FUNCNAME"
  expect_installed "$c" "$f" "agents/alpha.md
commands/delta.md
skills/bravo
skills/charlie"
}

test_copy_install() {
  local f="$TMP/copy-fixture" c="$TMP/copy-config"
  mk_fixture "$f"
  add_agent "$f" alpha
  add_skill "$f" bravo
  add_cmd "$f" delta
  run_install "$f" "$c" --copy

  expect_file "$c/agents/alpha.md"    "$FUNCNAME"
  expect_file "$c/skills/bravo/SKILL.md" "$FUNCNAME"
  expect_file "$c/commands/delta.md"  "$FUNCNAME"
}

test_user_file_preserved() {
  local f="$TMP/mine-fixture" c="$TMP/mine-config"
  mk_fixture "$f"
  add_skill "$f" mine
  mkdir -p "$c/skills/mine"
  printf 'handmade\n' > "$c/skills/mine/KEEP"
  run_install "$f" "$c"

  if grep -q 'skip' "$c.out"; then ok; else fail "$FUNCNAME: no skip reported"; fi
  expect_file "$c/skills/mine/KEEP" "$FUNCNAME"
  if [ -L "$c/skills/mine" ]; then fail "$FUNCNAME: user directory overwritten by a link"; else ok; fi
}

test_retired_item_pruned() {
  local f="$TMP/prune-fixture" c="$TMP/prune-config"
  mk_fixture "$f"
  add_skill "$f" bravo
  add_skill "$f" charlie
  run_install "$f" "$c"
  expect_link "$c/skills/charlie" "$FUNCNAME"

  rm -rf "$f/.opencode/skills/charlie"
  run_install "$f" "$c"

  expect_absent "$c/skills/charlie" "$FUNCNAME"
  expect_link "$c/skills/bravo" "$FUNCNAME"
  if grep -q 'prune' "$c.out"; then ok; else fail "$FUNCNAME: no prune reported"; fi
}

test_symlink_install
test_copy_install
test_user_file_preserved
test_retired_item_pruned

echo
echo "installer harness: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]