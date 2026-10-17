#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$DEFAULT_CONFIG}"
MODE="symlink"

usage() {
  cat <<'EOF'
usage: install.sh [--copy] [--help]

Publish the girth-agents catalog (.opencode/{agents,skills,commands}) into
your OpenCode global config so every project can use it.

  (default)  symlink each item — updates arrive with `git pull`
  --copy     copy files instead of symlinking
  --help     show this help

Installs into $OPENCODE_CONFIG_DIR when set, otherwise ~/.config/opencode
(via $XDG_CONFIG_HOME). Re-running is safe: existing links are refreshed and
real files that were not installed by this script are left alone.

Uninstall example:
  find ~/.config/opencode -type l -lname '*girth-agents*' -delete
EOF
}

for arg in "$@"; do
  case "$arg" in
    --help|-h) usage; exit 0 ;;
    --copy) MODE="copy" ;;
    *) echo "install.sh: unknown argument: $arg" >&2; usage >&2; exit 2 ;;
  esac
done

installed=0
skipped=0

# install_one <source> <destination>
install_one() {
  local src="$1" dst="$2"

  if [ -L "$dst" ]; then
    rm -f "$dst"
  elif [ -e "$dst" ]; then
    echo "skip  $(basename "$dst")  (a real file already exists there — not touching it)" >&2
    skipped=$((skipped + 1))
    return 0
  fi

  if [ "$MODE" = "copy" ]; then
    cp -R "$src" "$dst"
    echo "copy  $dst"
  elif ln -s "$src" "$dst" 2>/dev/null; then
    echo "link  $dst -> $src"
  else
    cp -R "$src" "$dst"
    echo "copy  $dst  (symlinks unavailable on this system)"
  fi
  installed=$((installed + 1))
}

mkdir -p "$CONFIG_DIR/agents" "$CONFIG_DIR/commands" "$CONFIG_DIR/skills"
echo "installing into $CONFIG_DIR (mode: $MODE)"

shopt -s nullglob

for f in "$REPO_ROOT/.opencode/agents"/*.md; do
  install_one "$f" "$CONFIG_DIR/agents/$(basename "$f")"
done

for f in "$REPO_ROOT/.opencode/commands"/*.md; do
  install_one "$f" "$CONFIG_DIR/commands/$(basename "$f")"
done

for d in "$REPO_ROOT/.opencode/skills"/*/; do
  install_one "$d" "$CONFIG_DIR/skills/$(basename "$d")"
done

echo
if [ "$installed" -eq 0 ] && [ "$skipped" -eq 0 ]; then
  echo "The catalog is empty — there is nothing to install yet."
else
  echo "done: $installed installed, $skipped skipped."
fi

if [ "$installed" -gt 0 ]; then
  echo
  echo "Start a new OpenCode session (or restart the service) to pick them up."
  echo "Skills can also be registered by path instead — add to your global opencode.json(c):"
  echo "    \"skills\": [\"$REPO_ROOT/.opencode/skills\"]"
fi