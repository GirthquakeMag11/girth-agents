#!/usr/bin/env bash
# girth-agents installer.
#
# One entry point, three verbs: install (the default), uninstall, update.
# install verifies the catalog and records what it places in girth.yaml;
# uninstall removes exactly what the record lists; update lands in the step
# that follows.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$DEFAULT_CONFIG}"
RECORD="girth.yaml"
MODE="symlink"
DRY_RUN=0
YES=0
VERB="install"

usage() {
  cat <<'EOF'
usage: install.sh [install | uninstall | update] [--copy] [--dry-run] [--help]

Publish the girth-agents catalog (agents, skills, commands) into your
OpenCode global config.

  install    verify the catalog, then link — or, with --copy, copy — it.
             The default verb.
  uninstall  remove exactly what an install put there (asks first).
  update     pull the checkout forward and reconcile the install.

  --copy     copy files instead of symlinking
  --dry-run  print what would happen, change nothing
  --yes      (uninstall) skip the confirmation
  --help     show this help

Installs into $OPENCODE_CONFIG_DIR when set, otherwise ~/.config/opencode
(via $XDG_CONFIG_HOME). Re-running install is safe: links are refreshed,
retired items pruned, and files this script did not install are left alone.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --help|-h) usage; exit 0 ;;
    --copy) MODE="copy" ;;
    --dry-run) DRY_RUN=1 ;;
    --yes|-y) YES=1 ;;
    install|uninstall|update) VERB="$arg" ;;
    *) printf 'install.sh: unknown argument: %s\n' "$arg" >&2; usage >&2; exit 2 ;;
  esac
done

# --- helpers ---------------------------------------------------------------

release_name() {
  git -C "$REPO_ROOT" describe --tags --always 2>/dev/null || printf 'unknown'
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

# uninstall — remove exactly what the record lists, nothing else.
uninstall() {
  local rec="$CONFIG_DIR/$RECORD"
  if [ ! -f "$rec" ]; then
    echo "nothing recorded at $rec — nothing to uninstall."
    exit 0
  fi

  local items changed=0 todo=0
  local todo_lines=""
  local how dest src fp
  items="$(awk '
    /^  - source:/      { s=$0; sub(/^  - source: /, "", s) }
    /^    dest:/        { d=$0; sub(/^    dest: /, "", d) }
    /^    how:/         { h=$0; sub(/^    how: /, "", h) }
    /^    fingerprint:/ { f=$0; sub(/^    fingerprint: /, "", f)
                          print h "\t" d "\t" s "\t" f }
  ' "$rec")"

  while IFS=$'\t' read -r how dest src fp; do
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

case "$VERB" in
  uninstall) uninstall ;;
  update)
    printf 'install.sh: update is not here yet — install and uninstall exist so far.\n' >&2
    exit 2
    ;;
esac

# --- install ---------------------------------------------------------------

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
  {
    printf 'version: 1\n'
    printf 'mode: %s\n' "$MODE"
    printf 'release: %s\n' "$(release_name)"
    printf 'items:\n'
  } > "$RECORD_TMP"
fi

record_item() { # $1 source  $2 dest  $3 how  $4 fingerprint
  {
    printf '  - source: %s\n' "$1"
    printf '    dest: %s\n' "$2"
    printf '    how: %s\n' "$3"
    printf '    fingerprint: %s\n' "$4"
  } >> "$RECORD_TMP"
}

# install_one <source> <destination>
install_one() {
  local src="$1" dst="$2"
  local action fp
  local was_link=0

  if [ -L "$dst" ]; then action="refresh"; was_link=1
  elif [ -e "$dst" ]; then action="skip"
  elif [ "$MODE" = "copy" ]; then action="copy"
  else action="link"; fi

  if [ "$action" = "skip" ]; then
    if [ "$DRY_RUN" -eq 1 ]; then
      say "skip $(basename "$dst")  (a real file already exists there)"
    else
      echo "skip  $(basename "$dst")  (a real file already exists there — not touching it)" >&2
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

for f in "$REPO_ROOT/.opencode/agents"/*.md; do
  install_one "$f" "$CONFIG_DIR/agents/$(basename "$f")"
done

for f in "$REPO_ROOT/.opencode/commands"/*.md; do
  install_one "$f" "$CONFIG_DIR/commands/$(basename "$f")"
done

while IFS= read -r f; do
  d="$(dirname "$f")"
  install_one "$d" "$CONFIG_DIR/skills/$(basename "$d")"
done < <(find "$REPO_ROOT/.opencode/skills" -type f -name SKILL.md)

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