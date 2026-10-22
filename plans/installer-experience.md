# Installer experience and release-synced updates

**Status:** charting

## Destination

An approved spec re-designing the installer's whole surface — install,
uninstall, update — as a polished, guided experience: GitHub releases cut
by `/cut-release`, an update policy per user (manual / notify / auto), and
a local install that stays meaningfully synced with the latest cut
release.

## Notes

- The ground already plowed: the three-verb script with its `girth.yaml`
  record, the lint gate, the 79-assertion harness, and `/cut-release`'s
  tagging — sunk costs this map reuses, never re-argues.
- No GitHub Releases exist yet; publication rides `/cut-release` via the
  gh CLI, one user-confirmed act.
- The deliberate aim: a more impressive, more intuitive experience than
  people have come to expect from the agentic landscape. One decision per
  session from here.

## Decisions so far

- Publication: `/cut-release` also creates the GitHub Release — gh CLI,
  notes from the changelog section. (2026-10-21)
- Policies: Manual (pull-when-run, today's update), Notify (report the lag
  on any verb run), Auto (bring the install onto the latest release when
  update runs). (2026-10-21)
- Policy home: recorded with the install in `girth.yaml`; a flag sets it;
  the guided first run asks — selection mandatory, no silent default.
  (2026-10-21)
- `status`: a fourth verb — installed release, latest cut release, chosen
  policy, the lag between them. (2026-10-21)
- Transport: the clone stays the only transport (user deferred to the
  maintainer) — the copy-paste story is one `git clone … && cd
  girth-agents && ./scripts/install.sh` line; Auto git-fetches and
  checks out the latest release tag, then reconciles. Provisional — see
  question "Snapshot bootstrap for one-command install". (2026-10-21)
- Reach: the guided first run (mode, policy) plus humane polish of every
  verb's output, prompts, and errors. (2026-10-21)

## Not yet specified

- The guided first run's exact prompts and the polished output shapes.
- When and how release notes are shown after a sync.
- The one-liner's canonical home (README Install section, release bodies,
  both).

## Out of scope

- Package-manager channels (npm, brew) — the clone-and-script channel
  stays the only one, per the transport decision.
- The GitHub Pages skill catalog — a planned addition that arrives
  without this map.