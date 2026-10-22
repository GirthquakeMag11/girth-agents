# Installer experience and release-synced updates

**Status:** done

## Destination

An approved spec re-designing the installer's whole surface — install,
uninstall, update — as a polished, guided experience: GitHub releases cut
by `/cut-release`, an update policy per user (manual / notify / auto), and
a local install that stays meaningfully synced with the latest cut
release.

Reached 2026-10-21: the way is clear — `specs/installer-experience.md`
is approved and governs from here.

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
  checks out the latest release tag, then reconciles. A curl bootstrap is
  deferred to the feature tracker. (2026-10-21)
- Reach: the guided first run (mode, policy) plus humane polish of every
  verb's output, prompts, and errors. (2026-10-21)
- Interactive-first: running the script with no flags is the assumed
  state — it asks, and unanswered questions are mandatory. Flags exist
  only to answer those questions ahead of time, and a script run with no
  terminal but unanswered questions fails naming the flag that would
  answer each. No flag finer-grained than a question the interaction
  would ask; users who avoid the interaction are assumed able to configure
  the install themselves. (2026-10-21)
- Policy switching is an interaction with the program, never a flag.
  (2026-10-21)
- Notify consults the latest release on every verb run — cheap, and
  silently skipped when the network is unreachable. (2026-10-21)
- Release notes: update and status show the changelog sections between
  the installed and latest release; status offers them on demand.
  (2026-10-21)
- The one-liner's home: the README's Install section leads with it, and
  `/cut-release`'s GitHub Release body carries it. (2026-10-21)
- gh and the cut: the bootstrapping skill checks for gh and offers a
  setup wizard when it is missing; `/cut-release` points at that wizard;
  a declination, at bootstrapping or the cut, is recorded in the
  project's conventions and the check skips silently thereafter.
  (2026-10-21)

## Not yet specified

- The guided first run's exact prompts and the polished output shapes.
- When and how release notes are shown after a sync — now settled, see
  Decisions so far.
- The one-liner's canonical home — now settled, see Decisions so far.

## Out of scope

- Package-manager channels (npm, brew) — the clone-and-script channel
  stays the only one, per the transport decision.
- The GitHub Pages skill catalog — a planned addition that arrives
  without this map.