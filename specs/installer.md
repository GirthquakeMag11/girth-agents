# Installer, Uninstaller, and Updater

## Problem Statement

The catalog is distributed as a `git clone` plus one script, and the
script only does half the story. Installing works (symlinks by default,
copies with `--copy`), but updating is "run `git pull` and hope" for
links, "re-run the installer and hope" for copies, and uninstalling is a
`find … -delete` one-liner pasted into the README that only understands
symlinks and silently leaves copies behind. There is no record of what was
installed, no way to remove exactly what an install put there, no
verification, and no single entry point for all three acts. The result is
an experience that feels bolted together rather than published.

## Solution

One entry point, three verbs — `install`, `uninstall`, `update` — with
polished, deterministic behavior. Installing records a manifest — a single
YAML file, `girth.yaml`, in the config directory — of exactly what it
placed and how, so uninstalling removes exactly that and updating knows the
before-state. Install verifies the catalog is lint-clean before
it touches the user's config, and every verb is safe against the user's
own files: nothing that was not installed by the manifest is ever removed
or overwritten. The README's Install section becomes a three-line story
instead of a script plus a pasted one-liner.

## User Stories

1. As someone trying the catalog for the first time, I want one command
   that installs everything, so that I do not read the README's fine
   print to figure out the steps.
2. As someone re-running the installer after adding my own custom agents,
   I want my own files left strictly alone, so that an upgrade never
   destroys my work.
3. As someone on a filesystem without symlinks, I want copy mode, so that
   the catalog installs everywhere OpenCode does.
4. As someone who installed with copies, I want uninstalling to remove
   those copies too, so that nothing lingers after I leave.
5. As someone uninstalling, I want only what the catalog installed to be
   removed, so that my own skills and commands survive a clean break.
6. As someone whose catalog retired an item, I want re-install to prune
   the stale link, so that my config does not carry ghosts.
7. As someone updating, I want a single command that brings the catalog up
   to date regardless of whether I installed by link or by copy, so that I
   never have to remember which mode I used.
8. As someone updating, I want to see what changed — at least the
   before-and-after of the checkout — so that I can judge whether to trust
   it.
9. As a cautious user, I want a preview of what an install, update, or
   uninstall would change before it happens, so that I can abort a
   surprise.
10. As a user with a dirty checkout, I want the updater to tell me rather
    than silently carry my local edits into the catalog, so that I am not
    half-updated.
11. As a user, I want the installer to fail loudly before publishing a
    broken catalog, so that a lint error never ships into my config.
12. As a user who registered skills by path in my own config, I want the
    uninstaller and updater to notice and point it out, so that I manage
    that entry myself rather than it being silently ignored.

## Implementation Decisions

### One entry point, three verbs

A single installed-script remains the seam; it takes the verb as its first
argument — `install` (the default when no verb is given, preserving today's
bare `./scripts/install.sh`), `uninstall`, and `update`. The existing
`--copy` flag stays as the install-mode switch, with `--help` and a
`--dry-run` preview accepted by every verb. Uninstall — the one
destructive verb — asks a single confirmation and honors `--yes` to skip
it; install and update never prompt. The verb is the only new
surface; there is no second script to discover.

### The manifest is the contract

Installation writes `girth.yaml` — one YAML file at the config root —
recording, per item it placed: what was placed, where, by what means (link
or copy), and a fingerprint of the checkout it came from, plus the mode and
the recorded release. It is the sole source of truth for the other two
verbs: uninstall removes only what it lists, and update reads it to learn
the previous mode and state. It is a state file the installer owns, not a
hand-edited config: the script emits and reads a constrained YAML subset
itself, so no external YAML tool becomes a dependency. The file is written
last and removed last, so an interrupted run leaves the world as before.
Manifest entries that point at files the user has since replaced are
reported and skipped, never force-removed.

### Update

Update pulls the checkout forward first, then re-walks the catalog. For
links the pull alone updates content and a re-walk prunes retired items and
links in anything new; for copies the re-walk re-copies every item whose
source no longer matches its fingerprint. A dirty checkout stops the update
with an explanation rather than pulling over the user's edits. Update
reports, at minimum, the before-and-after of the checkout's release tag —
the repository already tags every release, so this is read straight from
the checkout with nothing new to maintain — so the user can see what they
are taking on.

### Install verifies before it writes

Install runs the catalog linter first and refuses to proceed on any error,
so a broken catalog is caught at the installer, not after it has landed in
a user's config. Verification is local to the checkout and costs nothing to
the user.

### Safety invariants

Real files the installer did not create are never overwritten or removed:
install skips them with a note, uninstall and update skip and report them.
Installing is idempotent — re-running refreshes links and prunes dead ones.
The three verb behaviors compose: uninstall then install equals a clean
re-install, and update after install reaches the same state as a fresh
install of the new checkout.

## Testing Decisions

The thing worth testing is the script's discipline, not Markdown, so the
tests drive the single entry point against a scratch config directory (the
installer already honors a caller-provided config-directory location, which
is the seam tests hang off) with a small fixture catalog. Assertions cover:
the installed set exactly matches the fixture; user files at the target are
preserved across install, update, and uninstall; copy-mode installs are
fully removable by the uninstall verb; a retired fixture item is pruned on
re-install; dry-run changes nothing; a manifest round-trips through all
three verbs; and install refuses a fixture that fails the linter. The tests
run from the repository like the existing lint, cheap enough to run every
change. A standalone shell harness beside the script runs them — separate
from the catalog lint, which stays about Markdown content — and both the
script and the harness are shell-check-clean and exit-code-true.

Prior art is the repository's own catalog lint — zero-dependency, plain
shell and Node, runnable in CI — and the tests follow the same bar: no
framework, deterministic, exit code tells the truth.

## Out of Scope

- Package-manager distribution (npm, brew, apt): `git clone` plus the
  script remains the only channel.
- Editing the user's config to wire skills by path: that stays a manual,
  documented alternative; the script only notices and warns.
- Native Windows packaging: copy mode is the fallback, and the script stays
  POSIX shell rather than growing a parallel PowerShell surface.
- Any download other than `git`: no tarball fetches, no registry version
  pinning, no self-update beyond moving the checkout forward.
- Managing the user's own agents, skills, and commands beyond leaving them
  untouched and unadopted.

## Further Notes

- The README's Install section and the "Alternatives and uninstalling"
  details are rewritten to match the three verbs once this ships.
- No hazard or question entries exist yet in the trackers, so there is no
  prior lesson to honor here; the manifest design is the first of its kind
  in this project.
- The tracking skill governs where the resulting tickets live once the spec
  is approved and sliced.