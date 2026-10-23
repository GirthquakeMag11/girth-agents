# Launching a wizard in a new terminal

The wizard runs in a fresh terminal the agent opens for the user — never
in the chat session, where interactive input cannot be typed blindly and
secrets could show. Prefer the first command family whose launcher exists,
in this order, and keep a read-pause at the end so the closing summary
stays on screen:

- **Linux, GNOME:** `gnome-terminal -- bash -lc 'cd <dir> && ./<wizard>.sh; read -p "Press Enter to close"'`
- **Linux, KDE:** `konsole -e bash -lc 'cd <dir> && ./<wizard>.sh; read -p "Press Enter to close"'`
- **Linux, any desktop:** `x-terminal-emulator -e bash -lc 'cd <dir> && ./<wizard>.sh; read -p "Press Enter to close"'`
- **macOS:** `osascript -e 'tell app "Terminal" to do script "cd <dir> && ./<wizard>.sh"'`
- **Windows (Git Bash):** `start cmd /k "bash <dir>/<wizard>.sh"`
- **WSL:** `wt.exe bash -lc 'cd <dir> && ./<wizard>.sh'` (falls back to `cmd.exe /c start`)

If none of these can open a terminal — a remote or headless session — print
the exact one-line command for the user to run in their own terminal, and
stop there: the run is still yours to own, but the terminal is theirs.