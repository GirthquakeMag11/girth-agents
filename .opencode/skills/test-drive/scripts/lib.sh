# Shared resolution for the test-drive scripts. Sourced by each script; do not
# execute directly. Fails fast if the repository cannot be located and verified
# as the girth-agents project.
set -euo pipefail

# Workspace (outside the repo); override with TESTDRIVE_WORK.
WORK="${TESTDRIVE_WORK:-/tmp/opencode}"

# Repository root, located from this file's own location — never from the
# caller's working directory. The skill directory is one level above scripts/.
SELF_DIR=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
SKILL_DIR=$(dirname -- "$SELF_DIR")

REPO=""
if command -v git >/dev/null 2>&1; then
  REPO=$(git -C "$SKILL_DIR" rev-parse --show-toplevel 2>/dev/null || true)
fi
[ -z "$REPO" ] && REPO=$(dirname -- "$(dirname -- "$(dirname -- "$SKILL_DIR")")")

# The marker check is the authority: this skill is for this project only.
for m in INVARIANTS.md installer/build-archive.sh product.conf graph/config.json; do
  [ -f "$REPO/$m" ] || { echo "FAIL: not the girth-agents repository at $REPO (missing $m)" >&2; exit 1; }
done

# opencode binary: PATH, then the ~/.opencode install, then an explicit override.
OC=$(command -v opencode 2>/dev/null || true)
[ -z "$OC" ] && [ -x "$HOME/.opencode/bin/opencode" ] && OC="$HOME/.opencode/bin/opencode"
[ -n "${OPENCODE_BIN:-}" ] && OC="$OPENCODE_BIN"

# A supported terminal emulator, first match.
TERM_CMD=""
for t in gnome-terminal x-terminal-emulator xfce4-terminal konsole kitty alacritty xterm; do
  if command -v "$t" >/dev/null 2>&1; then TERM_CMD="$t"; break; fi
done

# Machine-local, gitignored notes the running agent reads and appends.
LOCAL_NOTES="$REPO/.opencode/testdrive/local-notes.md"

export WORK REPO OC TERM_CMD LOCAL_NOTES