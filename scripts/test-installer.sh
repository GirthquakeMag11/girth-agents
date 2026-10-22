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
  cp "$REPO_ROOT/scripts/validate.mjs" "$d/scripts/validate.mjs"
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

add_broken_cmd() { # $1 fixture — a command whose empty body fails the linter
  : > "$1/.opencode/commands/empty.md"
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

run_install() { # $1 fixture  $2 config dir  [extra args...]
  local f="$1" c="$2"; shift 2
  set +e
  OPENCODE_CONFIG_DIR="$c" bash "$f/scripts/install.sh" "$@" >"$c.out" 2>&1
  RUN_STATUS=$?
  set -e
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

test_user_symlink_preserved() {
  local f="$TMP/linkmine-fixture" c="$TMP/linkmine-config"
  mk_fixture "$f"
  add_skill "$f" mine
  mkdir -p "$c/skills" "$c/myown"
  ln -s "$c/myown" "$c/skills/mine"
  run_install "$f" "$c"

  grep -q 'symlink you made' "$c.out" && ok || fail "$FUNCNAME: no skip reported"
  [ "$(readlink "$c/skills/mine")" = "$c/myown" ] && ok \
    || fail "$FUNCNAME: user symlink replaced or re-pointed"
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

test_broken_catalog_refused() {
  local f="$TMP/broken-fixture" c="$TMP/broken-config"
  mk_fixture "$f"
  add_broken_cmd "$f"
  run_install "$f" "$c"

  [ "$RUN_STATUS" -ne 0 ] && ok || fail "$FUNCNAME: expected a non-zero exit"
  grep -qi 'validation\|not installing' "$c.out" && ok || fail "$FUNCNAME: no refusal message"
  expect_absent "$c/girth.yaml" "$FUNCNAME"
  [ ! -e "$c/agents" ] && [ ! -e "$c/skills" ] && [ ! -e "$c/commands" ] \
    && ok || fail "$FUNCNAME: something was placed"
}

test_clean_install_records() {
  local f="$TMP/record-fixture" c="$TMP/record-config"
  mk_fixture "$f"
  add_agent "$f" alpha
  add_skill "$f" bravo
  add_cmd "$f" delta
  run_install "$f" "$c"

  [ "$RUN_STATUS" -eq 0 ] && ok || fail "$FUNCNAME: install failed"
  expect_file "$c/girth.yaml" "$FUNCNAME"
  grep -q '^mode: symlink$' "$c/girth.yaml" \
    && ok || fail "$FUNCNAME: mode not recorded"
  grep -q '^    how: link$' "$c/girth.yaml" \
    && ok || fail "$FUNCNAME: link method not recorded"
  local n; n="$(grep -c '^    fingerprint:' "$c/girth.yaml" 2>/dev/null || true)"
  [ "${n:-0}" -eq 3 ] && ok || fail "$FUNCNAME: recorded ${n:-0} items, wanted 3"
}

test_policy_flag_recorded() {
  local f="$TMP/pol-fixture" c="$TMP/pol-config"
  mk_fixture "$f"
  add_skill "$f" bravo
  run_install "$f" "$c" --policy notify

  [ "$RUN_STATUS" -eq 0 ] && ok || fail "$FUNCNAME: install failed"
  grep -q '^policy: notify$' "$c/girth.yaml" && ok || fail "$FUNCNAME: policy not recorded"
}

test_policy_carried_on_reinstall() {
  local f="$TMP/polcarry-fixture" c="$TMP/polcarry-config"
  mk_fixture "$f"
  add_skill "$f" bravo
  run_install "$f" "$c" --policy auto
  run_install "$f" "$c"

  grep -q '^policy: auto$' "$c/girth.yaml" && ok || fail "$FUNCNAME: recorded policy was lost"
}

test_policy_invalid_rejected() {
  local f="$TMP/polbad-fixture" c="$TMP/polbad-config"
  mk_fixture "$f"
  add_skill "$f" bravo
  run_install "$f" "$c" --policy sometimes

  [ "$RUN_STATUS" -eq 2 ] && ok || fail "$FUNCNAME: expected exit 2, got $RUN_STATUS"
  grep -q 'unknown policy' "$c.out" && ok || fail "$FUNCNAME: no unknown-policy message"
  expect_absent "$c/girth.yaml" "$FUNCNAME"
}

test_dry_run_changes_nothing() {
  local f="$TMP/dry-fixture" c="$TMP/dry-config"
  mk_fixture "$f"
  add_agent "$f" alpha
  add_skill "$f" bravo
  run_install "$f" "$c" --dry-run

  [ "$RUN_STATUS" -eq 0 ] && ok || fail "$FUNCNAME: --dry-run failed"
  grep -q 'would' "$c.out" && ok || fail "$FUNCNAME: no would-preview"
  expect_absent "$c/girth.yaml" "$FUNCNAME"
  [ ! -e "$c/agents" ] && [ ! -e "$c/skills" ] && [ ! -e "$c/commands" ] \
    && ok || fail "$FUNCNAME: dry run wrote something to disk"
}

test_help_mentions_verbs() {
  local f="$TMP/help-fixture" c="$TMP/help-config"
  mk_fixture "$f"
  run_install "$f" "$c" --help

  [ "$RUN_STATUS" -eq 0 ] && ok || fail "$FUNCNAME: --help failed"
  for v in install uninstall update; do
    grep -q "$v" "$c.out" && ok || fail "$FUNCNAME: --help omits $v"
  done
}

# uninstall_with <fixture> <config> <stdin> [extra args...] — runs the
# uninstall verb, feeding $3 as stdin, capturing output and UN_STATUS.
uninstall_with() {
  local f="$1" c="$2" input="$3"; shift 3
  set +e
  printf '%s\n' "$input" | OPENCODE_CONFIG_DIR="$c" bash "$f/scripts/install.sh" uninstall "$@" >"$c.un.out" 2>&1
  UN_STATUS=$?
  set -e
}

test_uninstall_links() {
  local f="$TMP/unlink-fixture" c="$TMP/unlink-config"
  mk_fixture "$f"
  add_agent "$f" alpha
  add_skill "$f" bravo
  add_cmd "$f" delta
  run_install "$f" "$c"
  expect_link "$c/skills/bravo" "$FUNCNAME"

  uninstall_with "$f" "$c" "" --yes
  [ "$UN_STATUS" -eq 0 ] && ok || fail "$FUNCNAME: uninstall failed"
  expect_absent "$c/girth.yaml" "$FUNCNAME"
  expect_absent "$c/agents/alpha.md" "$FUNCNAME"
  expect_absent "$c/skills/bravo" "$FUNCNAME"
  expect_absent "$c/commands/delta.md" "$FUNCNAME"
  [ -z "$(list_installed "$c")" ] && ok || fail "$FUNCNAME: items left behind"
}

test_uninstall_copies() {
  local f="$TMP/uncopy-fixture" c="$TMP/uncopy-config"
  mk_fixture "$f"
  add_skill "$f" bravo
  add_cmd "$f" delta
  run_install "$f" "$c" --copy
  expect_file "$c/skills/bravo/SKILL.md" "$FUNCNAME"

  uninstall_with "$f" "$c" "" --yes
  [ "$UN_STATUS" -eq 0 ] && ok || fail "$FUNCNAME: uninstall failed"
  expect_absent "$c/girth.yaml" "$FUNCNAME"
  expect_absent "$c/skills/bravo" "$FUNCNAME"
  expect_absent "$c/commands/delta.md" "$FUNCNAME"
}

test_uninstall_preserves_user_files() {
  local f="$TMP/unpreserve-fixture" c="$TMP/unpreserve-config"
  mk_fixture "$f"
  add_skill "$f" bravo
  run_install "$f" "$c"

  # user replaces the link with their own directory
  rm "$c/skills/bravo"
  mkdir "$c/skills/bravo"
  printf 'handmade\n' > "$c/skills/bravo/KEEP"
  # and a user skill of their own, never recorded
  mkdir "$c/skills/mine"

  uninstall_with "$f" "$c" "" --yes
  [ "$UN_STATUS" -eq 0 ] && ok || fail "$FUNCNAME: uninstall failed"
  expect_file "$c/skills/bravo/KEEP" "$FUNCNAME"
  [ -d "$c/skills/mine" ] && ok || fail "$FUNCNAME: user's own skill removed"
  grep -q 'left' "$c.un.out" && ok || fail "$FUNCNAME: replaced file not reported"
}

test_uninstall_confirmation() {
  local f="$TMP/confirm-fixture" c="$TMP/confirm-config"
  mk_fixture "$f"
  add_skill "$f" bravo
  run_install "$f" "$c"

  uninstall_with "$f" "$c" "n"
  expect_link "$c/skills/bravo" "$FUNCNAME"
  expect_file "$c/girth.yaml" "$FUNCNAME"
  grep -q 'not removing' "$c.un.out" && ok || fail "$FUNCNAME: no 'not removing'"

  uninstall_with "$f" "$c" "y"
  expect_absent "$c/skills/bravo" "$FUNCNAME"
  expect_absent "$c/girth.yaml" "$FUNCNAME"
}

test_uninstall_dry_run() {
  local f="$TMP/undry-fixture" c="$TMP/undry-config"
  mk_fixture "$f"
  add_skill "$f" bravo
  run_install "$f" "$c"

  uninstall_with "$f" "$c" "" --dry-run
  [ "$UN_STATUS" -eq 0 ] && ok || fail "$FUNCNAME: dry run failed"
  grep -q 'would' "$c.un.out" && ok || fail "$FUNCNAME: no would-preview"
  expect_link "$c/skills/bravo" "$FUNCNAME"
  expect_file "$c/girth.yaml" "$FUNCNAME"
}

# git_fixture <dir> — a git repository holding the installer; one base commit.
git_fixture() {
  mk_fixture "$1"
  git -C "$1" init -q -b main
  git -C "$1" config user.email "test@example.com"
  git -C "$1" config user.name "test"
  git -C "$1" add -A
  git -C "$1" commit -qm "base"
}

# run_update <fixture> <config> [extra args...] — runs the update verb.
run_update() {
  local f="$1" c="$2"; shift 2
  set +e
  OPENCODE_CONFIG_DIR="$c" bash "$f/scripts/install.sh" update "$@" </dev/null >"$c.up.out" 2>&1
  U_STATUS=$?
  set -e
}

test_update_refuses_dirty_checkout() {
  local f="$TMP/dirty-fixture" c="$TMP/dirty-config"
  git_fixture "$f"
  add_skill "$f" bravo
  git -C "$f" add -A
  git -C "$f" commit -qm "catalog"
  run_install "$f" "$c"

  echo "dirty" >> "$f/.opencode/skills/bravo/SKILL.md"
  run_update "$f" "$c"

  [ "$U_STATUS" -ne 0 ] && ok || fail "$FUNCNAME: expected a non-zero exit"
  grep -qi 'uncommitted' "$c.up.out" && ok || fail "$FUNCNAME: no dirty-checkout message"
  expect_link "$c/skills/bravo" "$FUNCNAME"
  expect_file "$c/girth.yaml" "$FUNCNAME"
}

test_update_pull_reconciles() {
  local origin="$TMP/origin.git" f="$TMP/pull-fixture" c="$TMP/pull-config" work="$TMP/pull-work"
  git init -q --bare "$origin"
  git -C "$origin" symbolic-ref HEAD refs/heads/main
  git_fixture "$f"
  add_skill "$f" bravo
  add_skill "$f" charlie
  git -C "$f" add -A
  git -C "$f" commit -qm "catalog"
  git -C "$f" remote add origin "$origin"
  git -C "$f" push -q -u origin main
  run_install "$f" "$c"
  expect_link "$c/skills/charlie" "$FUNCNAME"

  # author a new release in a separate clone: retire charlie, add echo
  git clone -q "$origin" "$work"
  git -C "$work" config user.email "test@example.com"
  git -C "$work" config user.name "test"
  rm -rf "$work/.opencode/skills/charlie"
  add_skill "$work" echo
  git -C "$work" add -A
  git -C "$work" commit -qm "retire charlie, add echo"
  git -C "$work" push -q origin main

  # the fixture sits a release behind; update pulls and reconciles
  run_update "$f" "$c"

  [ "$U_STATUS" -eq 0 ] && ok || fail "$FUNCNAME: update failed"
  grep -q '^updated .*->' "$c.up.out" && ok || fail "$FUNCNAME: no before/after reported"
  expect_absent "$c/skills/charlie" "$FUNCNAME"
  expect_link "$c/skills/echo" "$FUNCNAME"
  expect_link "$c/skills/bravo" "$FUNCNAME"
  grep -q 'retired' "$c.up.out" && ok || fail "$FUNCNAME: retirement not reported"
}

test_update_copy_only_changed() {
  local origin="$TMP/copy-origin.git" f="$TMP/copy-fixture" c="$TMP/copy-config" work="$TMP/copy-work"
  git init -q --bare "$origin"
  git -C "$origin" symbolic-ref HEAD refs/heads/main
  git_fixture "$f"
  add_skill "$f" bravo
  add_skill "$f" charlie
  git -C "$f" add -A
  git -C "$f" commit -qm "catalog"
  git -C "$f" remote add origin "$origin"
  git -C "$f" push -q -u origin main
  run_install "$f" "$c" --copy
  local t0; t0="$(stat -c %Y "$c/skills/bravo/SKILL.md")"

  git clone -q "$origin" "$work"
  git -C "$work" config user.email "test@example.com"
  git -C "$work" config user.name "test"
  printf -- '---\ndescription: fixture skill\n---\n# charlie changed\n' > "$work/.opencode/skills/charlie/SKILL.md"
  git -C "$work" add -A
  git -C "$work" commit -qm "change charlie"
  git -C "$work" push -q origin main

  # update without --copy: it must carry over copy mode from the record
  run_update "$f" "$c"

  [ "$U_STATUS" -eq 0 ] && ok || fail "$FUNCNAME: update failed"
  grep -q 'charlie changed' "$c/skills/charlie/SKILL.md" && ok || fail "$FUNCNAME: changed copy not re-copied"
  [ "$(stat -c %Y "$c/skills/bravo/SKILL.md")" = "$t0" ] && ok || fail "$FUNCNAME: unchanged copy was touched"
  grep -q 're-copied' "$c.up.out" && ok || fail "$FUNCNAME: re-copy not reported"
}

test_update_dry_run() {
  local f="$TMP/updry-fixture" c="$TMP/updry-config"
  git_fixture "$f"
  add_skill "$f" bravo
  git -C "$f" add -A
  git -C "$f" commit -qm "catalog"
  run_install "$f" "$c"
  local head; head="$(git -C "$f" rev-parse HEAD)"

  run_update "$f" "$c" --dry-run

  [ "$U_STATUS" -eq 0 ] && ok || fail "$FUNCNAME: dry run failed"
  grep -q 'would' "$c.up.out" && ok || fail "$FUNCNAME: no would-preview"
  [ "$(git -C "$f" rev-parse HEAD)" = "$head" ] && ok || fail "$FUNCNAME: dry run pulled"
  expect_link "$c/skills/bravo" "$FUNCNAME"
  expect_file "$c/girth.yaml" "$FUNCNAME"
}

test_symlink_install
test_copy_install
test_user_file_preserved
test_user_symlink_preserved
test_retired_item_pruned
test_broken_catalog_refused
test_clean_install_records
test_policy_flag_recorded
test_policy_carried_on_reinstall
test_policy_invalid_rejected
test_dry_run_changes_nothing
test_help_mentions_verbs
test_uninstall_links
test_uninstall_copies
test_uninstall_preserves_user_files
test_uninstall_confirmation
test_uninstall_dry_run
test_update_refuses_dirty_checkout
test_update_pull_reconciles
test_update_copy_only_changed
test_update_dry_run

echo
echo "installer harness: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]