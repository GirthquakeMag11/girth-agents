# The gh setup wizard

Walk the user from "no gh" to a working, authenticated `gh` CLI, so the
release flow can open the GitHub Release. Offer it when the bootstrapping
check finds gh missing, or when `/cut-release` needs gh and cannot find
it. The user may decline at any point; a declination is a ruling — record
it in `conventions/` by calling the skill tool with `codifying`, and the
check skips silently from then on.

## The walk

1. **Confirm the user wants this now.** One question. Declined → record
   the declination and stop; do not assume a later yes.
2. **Install.** The platform's own channel, checking first whether it is
   already present under another name:
   - macOS: `brew install gh`, else the GitHub-provided installer.
   - Linux: the distribution package when one exists, else the GitHub
     release binary.
   - Windows: `winget install GitHub.cli`, else the installer from
     GitHub.
   Do not guess an environment; ask what the machine runs.
3. **Authenticate.** `gh auth login` — walk the user through the protocol
   choice (browser flow preferred), the account selection, and the scopes;
   release publication needs `repo` scope.
4. **Verify.** `gh --version` and `gh auth status` both succeed. If not,
   return to the failing step; do not declare gh ready on a partial
   result.

Done when `gh auth status` reports the account that owns the project and
the version prints — the user is left with the one line that confirms it
worked, and no further setup is owed.