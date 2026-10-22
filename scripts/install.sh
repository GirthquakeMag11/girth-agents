#!/usr/bin/env bash
# girth-agents installer.
#
# One entry point, three verbs: install (the default), uninstall, update.
# install verifies the catalog and records what it places in girth.yaml;
# uninstall removes exactly what the record lists; update pulls the checkout
# forward and reconciles the install against the new catalog.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$DEFAULT_CONFIG}"
RECORD="girth.yaml"
MODE="symlink"
POLICY=""
COPY_FLAG=0
DRY_RUN=0
YES=0
VERB=""

usage() {
  cat <<'EOF'
usage: install.sh [install | uninstall | update] [--copy] [--policy POLICY] [--dry-run] [--help]

Publish the girth-agents catalog (agents, skills, commands) into your
OpenCode global config.

  install    verify the catalog, then link — or, with --copy, copy — it.
             The default verb.
  uninstall  remove exactly what an install put there (asks first).
  update     pull the checkout forward and reconcile the install.

  --copy     copy files instead of symlinking
  --policy   how updates behave: manual, notify, or auto
  --dry-run  print what would happen, change nothing
  --yes      (uninstall) skip the confirmation
  --help     show this help

Installs into $OPENCODE_CONFIG_DIR when set, otherwise ~/.config/opencode
(via $XDG_CONFIG_HOME). Re-running install is safe: links are refreshed,
retired items pruned, and files this script did not install are left alone.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --copy) MODE="copy"; COPY_FLAG=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --yes|-y) YES=1 ;;
    --policy)
      shift
      [ "$#" -gt 0 ] || { printf 'install.sh: --policy needs a value\n' >&2; usage >&2; exit 2; }
      POLICY="$1"
      case "$POLICY" in
        manual|notify|auto) ;;
        *) printf 'install.sh: unknown policy: %s (manual, notify, or auto)\n' "$POLICY" >&2; exit 2 ;;
      esac
      ;;
    install|uninstall|update) VERB="$1" ;;
    *) printf 'install.sh: unknown argument: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

# --- helpers ---------------------------------------------------------------

interactive() { [ -t 0 ] && [ -t 1 ]; }

record_mode() { sed -n 's/^mode: //p' "$CONFIG_DIR/$RECORD" 2>/dev/null | head -1; }

ask_mode() {
  printf 'how should items land — links (recommended) or copies? [links/copies] '
  read -r ans || return 1
  case "$ans" in
    copies|copy|c) MODE="copy" ;;
    *) MODE="symlink" ;;
  esac
}

ask_policy() {
  while :; do
    printf 'how should updates behave — manual, notify, or auto? [manual/notify/auto] '
    read -r ans || return 1
    case "$ans" in
      manual|notify|auto) POLICY="$ans"; return 0 ;;
      *) echo "choose manual, notify, or auto" ;;
    esac
  done
}

configure() {
  local m p ans
  echo
  echo "Configuration — your recorded choices:"
  m="$(record_mode)"; [ "${m:-symlink}" = "copy" ] && m="copies" || m="links"
  p="$(policy_value)"
  echo "  how items land:     $m"
  echo "  how updates behave: ${p:-not chosen yet}"
  printf 'change mode, policy, or go back? [mode/policy/back] '
  read -r ans || return 1
  case "$ans" in
    mode) ask_mode ;;
    policy) ask_policy ;;
    *) return 0 ;;
  esac
  # Re-record the changed choices now, so the change outlives this run.
  [ -f "$CONFIG_DIR/$RECORD" ] && reconcile
  return 0
}

menu_run() {
  local ans
  while :; do
    echo
    echo "girth-agents installer"
    echo "  i. install        — bring the catalog into your config"
    echo "  u. update         — bring it current per your policy"
    echo "  x. uninstall      — remove exactly what an install put there"
    echo "  c. Configuration  — review and change your recorded choices"
    printf 'choose [i/u/x/c] '
    read -r ans || { echo; exit 1; }
    case "$ans" in
      i|install) VERB="install"; return 0 ;;
      u|update)  VERB="update";  return 0 ;;
      x|un|uninstall) VERB="uninstall"; return 0 ;;
      c|C|config|config ) configure ;;
      q|quit) exit 0 ;;
      *) echo "please choose i, u, x, or c" ;;
    esac
  done
}

release_name() {
  git -C "$REPO_ROOT" describe --tags --always 2>/dev/null || printf 'unknown'
}

# The effective policy: the flag wins; else the recorded one; else empty.
policy_value() {
  if [ -n "$POLICY" ]; then printf '%s\n' "$POLICY"; return; fi
  if [ -f "$CONFIG_DIR/$RECORD" ]; then
    sed -n 's/^policy: //p' "$CONFIG_DIR/$RECORD" | head -1
  fi
}

# record_header — the record's fixed top, written to the open record.
record_header() {
  printf 'version: 1\n'
  printf 'mode: %s\n' "$MODE"
  printf 'policy: %s\n' "$(policy_value)"
  printf 'release: %s\n' "$(release_name)"
  printf 'items:\n'
}

# latest_release_tag — the newest cut release among the checkout's tags.
latest_release_tag() {
  git -C "$REPO_ROOT" tag --sort=-v:refname 2>/dev/null \
    | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1
}

# report_lag — under notify, one line when a newer cut release exists than
# the release named in $1; quiet when unreachable or when there is nothing
# to say.
report_lag() {
  git -C "$REPO_ROOT" fetch --quiet --tags 2>/dev/null || return 0
  local latest inst
  latest="$(latest_release_tag)"
  [ -n "$latest" ] || return 0
  inst="$1"
  [ -n "$inst" ] || return 0
  [ "$latest" != "$inst" ] || return 0
  echo "note: release $latest is newer than your installed $inst — ./scripts/install.sh update --policy auto takes you to it."
}

hash_input() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then shasum -a 256 | awk '{print $1}'
  else cksum | awk '{print $1}'
  fi
}

fingerprint() { # $1 file or directory -> one hash line
  if [ -d "$1" ]; then
    ( cd "$1" && find . -type f | LC_ALL=C sort | xargs cat ) | hash_input
  else
    hash_input < "$1"
  fi
}

# Verify the catalog lints clean before touching the user's config.
verify_catalog() {
  local out
  if out="$(node "$REPO_ROOT/scripts/validate.mjs" --root "$REPO_ROOT" 2>&1)"; then
    return 0
  fi
  printf 'install.sh: the catalog fails its own validation — not installing:\n' >&2
  printf '%s\n' "$out" >&2
  exit 1
}

say() { if [ "$DRY_RUN" -eq 1 ]; then printf 'would %s\n' "$*"; else printf '%s\n' "$*"; fi; }

# still_ours <how> <dest> <source> <fingerprint> — is the destination still
# exactly what the record says we installed there?
still_ours() {
  case "$1" in
    link) [ -L "$2" ] && [ "$(readlink "$2")" = "$3" ] ;;
    copy) [ -e "$2" ] && [ "$(fingerprint "$2")" = "$4" ] ;;
    *) return 1 ;;
  esac
}

record_item() { # $1 source  $2 dest  $3 how  $4 fingerprint
  {
    printf '  - source: %s\n' "$1"
    printf '    dest: %s\n' "$2"
    printf '    how: %s\n' "$3"
    printf '    fingerprint: %s\n' "$4"
  } >> "$RECORD_TMP"
}

# catalog_pairs — one "src<TAB>dst" line per item, current catalog order.
catalog_pairs() {
  shopt -s nullglob
  local f d
  for f in "$REPO_ROOT"/.opencode/agents/*.md; do
    printf '%s\t%s\n' "$f" "$CONFIG_DIR/agents/$(basename "$f")"
  done
  for f in "$REPO_ROOT"/.opencode/commands/*.md; do
    printf '%s\t%s\n' "$f" "$CONFIG_DIR/commands/$(basename "$f")"
  done
  while IFS= read -r f; do
    d="$(dirname "$f")"
    printf '%s\t%s\n' "$d" "$CONFIG_DIR/skills/$(basename "$d")"
  done < <(find "$REPO_ROOT/.opencode/skills" -type f -name SKILL.md)
}

# record_items — the record's items as dest<TAB>source<TAB>how<TAB>fingerprint.
record_items() { # $1 record file, or stdin record when omitted — no, file arg
  awk '
    /^  - source:/      { s=$0; sub(/^  - source: /, "", s) }
    /^    dest:/        { d=$0; sub(/^    dest: /, "", d) }
    /^    how:/         { h=$0; sub(/^    how: /, "", h) }
    /^    fingerprint:/ { f=$0; sub(/^    fingerprint: /, "", f)
                          print d "\t" s "\t" h "\t" f }
  ' "$1"
}

OLD_ITEMS=""
old_entry() { # $1 dest -> "source\thow\tfingerprint" or nothing
  local d="$1" line src how fp
  while IFS=$'\t' read -r line src how fp; do
    [ "$line" = "$d" ] || continue
    printf '%s\t%s\t%s' "$src" "$how" "$fp"
    return 0
  done <<< "$OLD_ITEMS"
  return 1
}

# --- uninstall -------------------------------------------------------------

uninstall() {
  local rec="$CONFIG_DIR/$RECORD"
  if [ ! -f "$rec" ]; then
    echo "nothing recorded at $rec — nothing to uninstall."
    exit 0
  fi

  local items changed=0 todo=0
  local todo_lines=""
  local how dest src fp
  items="$(record_items "$rec")"

  while IFS=$'\t' read -r dest src how fp; do
    [ -n "$how" ] || continue
    if ! still_ours "$how" "$dest" "$src" "$fp"; then
      echo "left  $dest  (changed since install — not touching it)" >&2
      changed=$((changed + 1))
      continue
    fi
    todo_lines="$todo_lines$dest"$'\n'
    todo=$((todo + 1))
  done <<< "$items"

  if [ "$todo" -eq 0 ]; then
    echo "nothing to remove ($((changed)) recorded item(s) left in place)."
    [ "$DRY_RUN" -eq 0 ] || echo "dry run — nothing changed."
    exit 0
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "uninstalling $todo item(s) (dry run):"
    while IFS= read -r dest; do
      [ -n "$dest" ] && say "remove $dest"
    done <<< "$todo_lines"
    say "remove $rec"
    echo "dry run — nothing changed."
    exit 0
  fi

  if [ "$YES" -ne 1 ]; then
    printf 'remove %s item(s)? [y/N] ' "$todo"
    local ans
    read -r ans
    case "$ans" in
      y|Y|yes|YES) ;;
      *) echo "not removing anything."; exit 0 ;;
    esac
  fi

  echo "removing:"
  while IFS= read -r dest; do
    [ -n "$dest" ] || continue
    rm -rf "$dest"
    echo "removed  $dest"
  done <<< "$todo_lines"
  rm -f "$rec"
  echo "removed  $rec"
  rmdir "$CONFIG_DIR/agents" "$CONFIG_DIR/commands" "$CONFIG_DIR/skills" 2>/dev/null || true
  echo
  echo "done: $todo removed, $changed left in place."
  exit 0
}

# --- update ----------------------------------------------------------------

# reconcile — make the install match the (already-pulled) catalog.
reconcile() {
  local rec="$CONFIG_DIR/$RECORD"
  if [ "$COPY_FLAG" -eq 0 ] && [ -f "$rec" ]; then
    local m; m="$(sed -n 's/^mode: //p' "$rec" | head -1)"
    [ "$m" = "copy" ] && MODE="copy"
  fi
  OLD_ITEMS="$([ -f "$rec" ] && record_items "$rec" || true)"

  if [ "$DRY_RUN" -eq 1 ]; then
    RECORD_TMP=""
  else
    mkdir -p "$CONFIG_DIR/agents" "$CONFIG_DIR/commands" "$CONFIG_DIR/skills"
    RECORD_TMP="$(mktemp)"
    trap 'rm -f "$RECORD_TMP"' EXIT
    record_header > "$RECORD_TMP"
  fi

  local seen="" kept=0 added=0 changed=0 removed=0 skipped=0
  local src dst fp o_src o_how ofp
  while IFS=$'\t' read -r src dst; do
    [ -n "$src" ] || continue
    seen="$seen$dst"$'\n'
    fp="$(fingerprint "$src")"

    local oe; oe="$(old_entry "$dst" || true)"
    if [ -n "$oe" ]; then
      o_src="${oe%%$'\t'*}"; o_how="${oe#*$'\t'}"; o_how="${o_how%%$'\t'*}"; ofp="${oe##*$'\t'}"
      if still_ours "$o_how" "$dst" "$o_src" "$ofp"; then
        if [ "$MODE" = "copy" ] && [ "$o_how" = "copy" ] && [ "$ofp" != "$fp" ]; then
          if [ "$DRY_RUN" -eq 1 ]; then say "re-copy $dst <- $src"
          else rm -rf "$dst"; cp -R "$src" "$dst"; echo "copy  $dst  (changed)"; record_item "$src" "$dst" copy "$fp"; fi
          changed=$((changed + 1))
        else
          [ "$DRY_RUN" -eq 0 ] && record_item "$src" "$dst" "$o_how" "$fp"
          kept=$((kept + 1))
        fi
        continue
      fi
    fi

    if [ -e "$dst" ] || [ -L "$dst" ]; then
      if [ "$DRY_RUN" -eq 1 ]; then say "skip $(basename "$dst")  (a real file already exists there)"
      else echo "skip  $(basename "$dst")  (a real file already exists there — not touching it)" >&2; fi
      skipped=$((skipped + 1))
    elif [ "$DRY_RUN" -eq 1 ]; then
      say "$MODE $dst <- $src"
      added=$((added + 1))
    elif [ "$MODE" = "copy" ]; then
      cp -R "$src" "$dst"; echo "copy  $dst"; record_item "$src" "$dst" copy "$fp"
      added=$((added + 1))
    elif ln -s "$src" "$dst" 2>/dev/null; then
      echo "link  $dst -> $src"; record_item "$src" "$dst" link "$fp"; added=$((added + 1))
    else
      cp -R "$src" "$dst"; echo "copy  $dst  (symlinks unavailable)"; record_item "$src" "$dst" copy "$fp"; added=$((added + 1))
    fi
  done < <(catalog_pairs)

  # recorded items no longer in the catalog are retired
  local d2 s2 h2 f2
  while IFS=$'\t' read -r d2 s2 h2 f2; do
    [ -n "$d2" ] || continue
    printf '%s\n' "$seen" | grep -Fxq "$d2" && continue
    if still_ours "$h2" "$d2" "$s2" "$f2"; then
      if [ "$DRY_RUN" -eq 1 ]; then say "remove $d2  (retired)"
      else rm -rf "$d2"; echo "removed  $d2  (retired)"; fi
      removed=$((removed + 1))
    else
      echo "left  $d2  (changed since install — not touching it)" >&2
    fi
  done <<< "$OLD_ITEMS"

  if [ "$DRY_RUN" -eq 1 ]; then
    echo
    echo "reconcile (dry run): $added to add, $changed to re-copy, $removed retired, $skipped skipped, $kept unchanged."
    return 0
  fi

  mv "$RECORD_TMP" "$rec"
  trap - EXIT
  echo "recorded $rec"
  echo "done: $added added, $changed re-copied, $removed retired, $skipped skipped, $kept unchanged."
}

update() {
  local rec="$CONFIG_DIR/$RECORD"
  if [ ! -d "$REPO_ROOT/.git" ]; then
    printf 'install.sh: update needs a git checkout; %s is not one.\n' "$REPO_ROOT" >&2
    exit 1
  fi
  if [ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]; then
    printf 'install.sh: the checkout has uncommitted changes — not pulling over them.\n' >&2
    exit 1
  fi

  local before; before="$(release_name)"
  local policy; policy="$(policy_value)"

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "update: would reconcile (dry run):"
    reconcile
    echo "dry run — nothing changed."
    exit 0
  fi

  case "$policy" in
    auto)
      git -C "$REPO_ROOT" fetch --quiet --tags
      local tag; tag="$(latest_release_tag)"
      if [ -z "$tag" ]; then
        printf 'install.sh: no tagged release in the checkout to follow.\n' >&2
        exit 1
      fi
      git -C "$REPO_ROOT" checkout --quiet "$tag"
      ;;
    *)
      if ! git -C "$REPO_ROOT" pull --ff-only >&2; then
        printf 'install.sh: git pull failed — nothing changed.\n' >&2
        exit 1
      fi
      ;;
  esac

  local after; after="$(release_name)"
  echo "updated $before -> $after"
  reconcile
  [ "$policy" = "notify" ] && report_lag "$before"
  exit 0
}

# --- install ---------------------------------------------------------------

# Entry: the verb, the terminal, the unanswered questions. Placed here so the
# helpers and record readers above are defined by the time it runs.

# A bare run in a terminal opens the menu; a bare scripted run cannot guess.
if [ -z "$VERB" ]; then
  if interactive; then
    menu_run
  else
    printf 'install.sh: give a verb (install|update|uninstall) and the flags that answer its questions (--copy, --policy manual|notify|auto); a bare run in a terminal presents a menu.\n' >&2
    exit 2
  fi
fi

# A deed whose question stands unanswered is never defaulted silently.
case "$VERB" in
  install|update)
    if [ -z "$(policy_value)" ]; then
      if interactive; then
        if [ "$VERB" = "install" ] && [ "$COPY_FLAG" -eq 0 ] && [ ! -f "$CONFIG_DIR/$RECORD" ]; then
          ask_mode
        fi
        ask_policy
      else
        printf 'install.sh: the update policy is unanswered — pass --policy manual|notify|auto, or run in a terminal and choose.\n' >&2
        exit 2
      fi
    fi
    ;;
esac

case "$VERB" in
  uninstall) uninstall ;;
  update) update ;;
esac

verify_catalog

installed=0
skipped=0
pruned=0

if [ "$DRY_RUN" -eq 1 ]; then
  echo "installing into $CONFIG_DIR (mode: $MODE, dry run)"
  RECORD_TMP=""
else
  mkdir -p "$CONFIG_DIR/agents" "$CONFIG_DIR/commands" "$CONFIG_DIR/skills"
  echo "installing into $CONFIG_DIR (mode: $MODE)"
  RECORD_TMP="$(mktemp)"
  trap 'rm -f "$RECORD_TMP"' EXIT
  record_header > "$RECORD_TMP"
fi

# install_one <source> <destination>
install_one() {
  local src="$1" dst="$2"
  local action fp skip_reason=""
  local was_link=0

  if [ -L "$dst" ]; then
    case "$(readlink "$dst")" in
      "$REPO_ROOT"/*) action="refresh"; was_link=1 ;;
      *) action="skip"; skip_reason="a symlink you made already exists there" ;;
    esac
  elif [ -e "$dst" ]; then
    action="skip"; skip_reason="a real file already exists there"
  elif [ "$MODE" = "copy" ]; then action="copy"
  else action="link"; fi

  if [ "$action" = "skip" ]; then
    if [ "$DRY_RUN" -eq 1 ]; then
      say "skip $(basename "$dst")  ($skip_reason)"
    else
      echo "skip  $(basename "$dst")  ($skip_reason — not touching it)" >&2
    fi
    skipped=$((skipped + 1))
    return 0
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    say "$action $dst <- $src"
    return 0
  fi

  fp="$(fingerprint "$src")"
  [ "$was_link" -eq 1 ] && rm -f "$dst"

  if [ "$action" = "copy" ]; then
    cp -R "$src" "$dst"
    echo "copy  $dst"
    record_item "$src" "$dst" copy "$fp"
  elif ln -s "$src" "$dst" 2>/dev/null; then
    echo "link  $dst -> $src"
    record_item "$src" "$dst" link "$fp"
  else
    cp -R "$src" "$dst"
    echo "copy  $dst  (symlinks unavailable on this system)"
    record_item "$src" "$dst" copy "$fp"
  fi
  installed=$((installed + 1))
}

shopt -s nullglob

# Links into this repo whose target is gone belong to items retired from the catalog.
for link in "$CONFIG_DIR"/agents/* "$CONFIG_DIR"/commands/* "$CONFIG_DIR"/skills/*; do
  [ -L "$link" ] || continue
  case "$(readlink "$link")" in
    "$REPO_ROOT"/*)
      if [ ! -e "$link" ]; then
        if [ "$DRY_RUN" -eq 1 ]; then
          say "prune $link  (no longer in the catalog)"
        else
          rm -f "$link"
          echo "prune $link  (no longer in the catalog)"
        fi
        pruned=$((pruned + 1))
      fi
      ;;
  esac
done

while IFS=$'\t' read -r src dst; do
  [ -n "$src" ] || continue
  install_one "$src" "$dst"
done < <(catalog_pairs)

if [ "$DRY_RUN" -eq 1 ]; then
  echo
  echo "dry run — nothing changed."
  exit 0
fi

mv "$RECORD_TMP" "$CONFIG_DIR/$RECORD"
trap - EXIT
echo "recorded $CONFIG_DIR/$RECORD"

echo
if [ "$installed" -eq 0 ] && [ "$skipped" -eq 0 ]; then
  echo "The catalog is empty — there is nothing to install yet."
else
  echo "done: $installed installed, $skipped skipped, $pruned pruned."
fi

if [ "$installed" -gt 0 ]; then
  echo
  echo "Start a new OpenCode session (or restart the service) to pick them up."
  echo "Skills can also be registered by path instead — add to your global opencode.json(c):"
  echo "    \"skills\": [\"$REPO_ROOT/.opencode/skills\"]"
fi