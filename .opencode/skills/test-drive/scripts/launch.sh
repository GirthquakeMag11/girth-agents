#!/usr/bin/env bash
# Open the per-seat container in a terminal and hand it to the user. The TUI is
# the container's main process: quitting it stops the container, killing every
# opencode process with it. No --rm — the stopped container persists for
# wrapup.sh forensics.
set -euo pipefail
. "$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

mark_workspace
cat > "$WORK/seat.sh" <<'EOF'
#!/bin/bash
NAME="seat-$(date +%s)"
echo "test-drive seat: $NAME (quit the TUI to end it; its processes die with the container)"
podman run -it --name "$NAME" -e HOME=/root -e TERM=xterm-256color \
  --pids-limit 256 --memory 4g \
  localhost/graph-engine-sandbox:provisioned opencode
echo "seat ended: $NAME"
EOF
chmod +x "$WORK/seat.sh"

case "$TERM_CMD" in
  gnome-terminal)      gnome-terminal --title="graph-engine test-drive" -- bash "$WORK/seat.sh" ;;
  x-terminal-emulator) x-terminal-emulator -e "bash $WORK/seat.sh" ;;
  xfce4-terminal|konsole|xterm) "$TERM_CMD" -e "bash $WORK/seat.sh" ;;
  kitty)               kitty bash "$WORK/seat.sh" ;;
  alacritty)           alacritty -e bash "$WORK/seat.sh" ;;
  *) echo "FAIL: unsupported terminal '$TERM_CMD' — record its launch form in $LOCAL_NOTES"; exit 1 ;;
esac

sleep 3
podman ps --filter ancestor=localhost/graph-engine-sandbox:provisioned \
  --format '{{.Names}} {{.Status}}'