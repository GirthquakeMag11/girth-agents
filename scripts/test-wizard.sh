#!/usr/bin/env bash
# Test harness for the wizard skill's template library.
#
# Exercises the library the wizard skill ships — masked secret entry, the
# check helper, the re-ask loop, and the closing summary — by appending a
# canned driver stage to the real library code and piping answers in, and
# asserts the behavior the redesign spec's Testing Decisions promise. One
# command, exit-code truth, no framework beyond shell.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TPL="$REPO_ROOT/.opencode/skills/wizard/references/template.sh"

PASS=0
FAIL=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

ok()   { PASS=$((PASS + 1)); }
fail() { printf 'FAIL: %s\n' "$*" >&2; FAIL=$((FAIL + 1)); }

# --- fixture builder --------------------------------------------------------
# A fixture wizard is the template's real library — everything above the
# "# STAGES:" marker — with a canned driver appended in place of the stages,
# so the harness asserts against the library as shipped, not a copy.

mk_wizard() { # $1 outfile; the driver is appended from stdin
  local out="$1"
  awk '/^# STAGES:/{exit} {print}' "$TPL" > "$out"
  cat >> "$out"
}

# --- assertion helpers ------------------------------------------------------

contains() { grep -qF -- "$2" "$1"; }
count_of() { grep -oF -- "$2" "$1" | wc -l; }

run() { # $1 wizard  $2 stdin -> fills $OUT and $RC
  OUT="$TMP/out"
  RC=0
  printf '%s' "$2" | bash "$1" > "$OUT" 2>&1 || RC=$?
}

# --- 0. the template parses -------------------------------------------------

bash -n "$TPL" && ok || fail "template.sh fails bash -n"

# --- 1. typing echoes one mask character per keystroke ----------------------

W="$TMP/t1.sh"
mk_wizard "$W" <<'DRIVER'
ENV_FILE=$(mktemp)
trap 'rm -f "$ENV_FILE"' EXIT
ask_secret TOKEN "token:"
printf 'CAPTURED=[%s]\n' "$TOKEN"
DRIVER
run "$W" 'abc
'
contains "$OUT" '•••'      && ok || fail "typed secret echoes no mask"
contains "$OUT" '[abc]'    && ok || fail "typed secret not captured"
[ "$RC" -eq 0 ]            && ok || fail "typed secret run exits $RC"

# --- 2. a pasted value shows one mask per pasted character ------------------

W="$TMP/t2.sh"
mk_wizard "$W" <<'DRIVER'
ENV_FILE=$(mktemp)
trap 'rm -f "$ENV_FILE"' EXIT
ask_secret TOKEN "token:"
printf 'CAPTURED=[%s]\n' "$TOKEN"
DRIVER
run "$W" 'abcdefghijk
'
[ "$(count_of "$OUT" '•')" -eq 11 ] && ok || fail "paste of 11 chars does not show 11 masks"
contains "$OUT" '[abcdefghijk]'        && ok || fail "paste not captured whole"
[ "$RC" -eq 0 ]                        && ok || fail "paste run exits $RC"

# --- 3. backspace erases the last masked character --------------------------

W="$TMP/t3.sh"
mk_wizard "$W" <<'DRIVER'
ENV_FILE=$(mktemp)
trap 'rm -f "$ENV_FILE"' EXIT
ask_secret TOKEN "token:"
printf 'CAPTURED=[%s]\n' "$TOKEN"
DRIVER
run "$W" $'ab\x7fc\n'
contains "$OUT" '[ac]' && ok || fail "backspace did not erase the last character"
[ "$RC" -eq 0 ]        && ok || fail "backspace run exits $RC"

# --- 4. a re-run offers the saved default as a length-only mask -------------

W="$TMP/t4.sh"
mk_wizard "$W" <<'DRIVER'
ENV_FILE=$(mktemp)
trap 'rm -f "$ENV_FILE"' EXIT
printf "TOKEN='xyz'\n" > "$ENV_FILE"
ask_secret TOKEN "token:"
printf 'CAPTURED=[%s]\n' "$TOKEN"
DRIVER
run "$W" '
'
contains "$OUT" '[xyz]'                          && ok || fail "Enter did not keep the saved default"
[ "$(count_of "$OUT" '•')" -eq 3 ]               && ok || fail "saved default's length not shown as three masks"
sed '/CAPTURED/,$d' "$OUT" | grep -q 'xyz'       && fail "saved secret's characters leaked to the prompt" || ok
[ "$RC" -eq 0 ]                                  && ok || fail "re-run exits $RC"

# --- 5. a passing check prints green and the run passes ---------------------

W="$TMP/t5.sh"
mk_wizard "$W" <<'DRIVER'
ENV_FILE=$(mktemp)
trap 'rm -f "$ENV_FILE"' EXIT
probe_good() { [[ "$TOKEN" == "secret123" ]] || { echo "token must be secret123"; return 1; }; }
ask_checked secret TOKEN "token:" "token matches" probe_good
printf 'CAPTURED=[%s]\n' "$TOKEN"
finish
DRIVER
run "$W" 'secret123
'
contains "$OUT" '✓ token matches' && ok || fail "passing check not printed green"
contains "$OUT" '[secret123]'     && ok || fail "passing value not captured"
[ "$RC" -eq 0 ]                  && ok || fail "passing run exits $RC"

# --- 6. a failed check re-asks in place until the value passes --------------

W="$TMP/t6.sh"
mk_wizard "$W" <<'DRIVER'
ENV_FILE=$(mktemp)
trap 'rm -f "$ENV_FILE"' EXIT
probe_good() { [[ "$TOKEN" == "secret123" ]] || { echo "token must be secret123"; return 1; }; }
ask_checked secret TOKEN "token:" "token matches" probe_good
printf 'CAPTURED=[%s]\n' "$TOKEN"
finish
DRIVER
run "$W" 'wrong
n
secret123
'
contains "$OUT" 'token must be secret123' && ok || fail "probe's error not shown verbatim"
contains "$OUT" '[secret123]'             && ok || fail "corrected value not captured"
contains "$OUT" 'checks that failed'      && fail "corrected failure still reported" || ok
[ "$RC" -eq 0 ]                           && ok || fail "corrected run exits $RC"

# --- 7. an explicit skip is recorded, never mistaken for a pass -------------

W="$TMP/t7.sh"
mk_wizard "$W" <<'DRIVER'
ENV_FILE=$(mktemp)
trap 'rm -f "$ENV_FILE"' EXIT
probe_good() { [[ "$TOKEN" == "secret123" ]] || { echo "token must be secret123"; return 1; }; }
ask_checked secret TOKEN "token:" "token matches" probe_good
printf 'CAPTURED=[%s]\n' "$TOKEN"
finish
DRIVER
run "$W" 'wrong
y
'
contains "$OUT" 'still to do by hand'   && ok || fail "skip not listed in the closing summary"
contains "$OUT" 'skipped by you'        && ok || fail "skip not recorded as a skip"
contains "$OUT" 'checks that failed'    && fail "skip still reported as a failure" || ok
[ "$RC" -eq 0 ]                         && ok || fail "skipped run exits $RC"

# --- 8. a step that fails is reported and the exit code tells the truth -----

W="$TMP/t8.sh"
mk_wizard "$W" <<'DRIVER'
ENV_FILE=$(mktemp)
trap 'rm -f "$ENV_FILE"' EXIT
probe_fail() { echo "service refused connection"; return 1; }
try "service reachable" probe_fail
finish
DRIVER
run "$W" ''
contains "$OUT" 'service refused connection' && ok || fail "failing step's error not shown"
contains "$OUT" 'checks that failed'         && ok || fail "failing step not in the closing summary"
[ "$RC" -eq 1 ]                              && ok || fail "failing run exits $RC, not 1"

# --- 9. the plain mode carries the same floor with a format probe -----------

W="$TMP/t9.sh"
mk_wizard "$W" <<'DRIVER'
ENV_FILE=$(mktemp)
trap 'rm -f "$ENV_FILE"' EXIT
probe_pub() { [[ "$KEY" == pk_test_* ]] || { echo "expected a key starting with pk_test_"; return 1; }; }
ask_checked plain KEY "publishable key:" "publishable key looks right" probe_pub
printf 'CAPTURED=[%s]\n' "$KEY"
finish
DRIVER
run "$W" 'nope
n
pk_test_abc
'
contains "$OUT" 'expected a key starting with pk_test_' && ok || fail "format probe's error not shown"
contains "$OUT" '[pk_test_abc]'                         && ok || fail "plain mode did not capture the corrected value"
[ "$RC" -eq 0 ]                                         && ok || fail "plain-mode run exits $RC"

echo
echo "wizard library harness: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
