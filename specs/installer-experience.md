# The guided, release-synced installer

## Problem Statement

The installer works, but it is blind and undirected. A person installing
today runs one script that silently defaults every choice, gets a wall of
raw link lines, and is left to read the README's fine print to learn what
happened. Updating pulls whatever `main` is at the moment — the catalog
cuts tagged releases, but no release is ever published to GitHub and no
machine knows which one it is running or whether a newer one exists.
There is no way to say "tell me when something ships" or "keep me on the
latest cut"; nothing on a user's machine compares what it runs against
what has shipped. The result is exactly the scattered, unguided shape the
catalog means to exceed.

## Solution

The script's whole surface becomes a guided, release-synced experience.
Running it is interactive by default: it asks the few questions a newcomer
cannot know the answers to — how items land (links or copies), how updates
behave (manual, notify, or auto) — and never silently defaults one it did
not ask; flags exist only to answer those same questions ahead of time, so
scripts stay scriptable and no flag is finer-grained than a question the
interaction would ask. The answers are recorded with the install and
re-shaped any time, through the interaction, never by hand-editing. A
fourth verb, `status`, reports what is installed, the latest cut release,
the chosen policy, and the gap. `update` obeys the policy: manual pulls as
today, notify reports a newer release and how to take it, auto moves the
checkout onto the latest release tag. Notify quietly reports release lag
on any run; update and status show the changelog notes between the two
releases, under any policy. Releases reach GitHub at all because
`/cut-release` now publishes them, and the install story is one
copy-pastable line that the README and each release body carry.

## User Stories

1. As someone installing for the first time, I want the script to ask me
   only the choices that matter and to remember them, so I am not reading
   a wall of output to work out what happened.
2. As someone who runs the script in automation, I want flags that answer
   each interactive question, so the same install happens with no one at
   the keyboard.
3. As someone who passed no flags and has no terminal, I want a failure
   naming the flag that would answer each unanswered question, so I am not
   silently assigned a default I never chose.
4. As a cautious user, I want my updates to stay manual — pulling only
   when I run them — so nothing changes beneath me.
5. As a user who likes to know, I want to be told on any run when a newer
   release exists and how to take it, so I am never quietly out of date.
6. As a user who wants to follow the cuts, I want update to bring my
   install onto the latest release, so "update" means current.
7. As a user whose checkout is dirty, I want update to refuse rather than
   pull over my edits, whichever the policy.
8. As someone whose choice has changed, I want to re-shape it through the
   program's own prompts, not by editing a file or learning a flag.
9. As a user wondering where I stand, I want one command reporting my
   release, the latest cut, my policy, and the gap between them.
10. As a user catching up, I want to see what changed since my release,
    not just a version number.
11. As someone with no network, I want every verb to still work, quietly
    skipping what it cannot check.
12. As someone installing from a README, I want one line to copy and
    paste, and to find that same line in the release I am installing.
13. As this project's maintainer, I want each cut release to also land on
    GitHub with its notes, so a release exists somewhere a user's machine
    can point at.

## Implementation Decisions

### Interactive-first; flags answer questions, nothing more

Running the script without flags is the assumed state, and the
interaction is a small menu: the deeds — install, update, status,
uninstall — sit beside a Configuration submenu, where the questions with
recorded answers live: how items land — links or copies — and how updates
behave — manual, notify, or auto. A first install asks the questions it
needs; later interactive runs re-open Configuration to review and change
the recorded choices — that interaction is the only way a recorded choice
changes; there is no flag and no file to hand-edit for this. Flagless runs are the assumed state; flags only pre-answer the
interactive questions. The flag set is exactly the two answers — the copy
flag and the policy flag — plus the standard surface every verb shares:
help and dry-run, and yes for the uninstall confirmation. An unanswered
question is never defaulted silently: with no terminal and a question
unanswered, the run fails naming the flag that would answer it. A
recorded choice — mode or policy — changes only in Configuration; a flag
answers its question while it is pending and never silently re-records an
answer made before.

### The policy and its home

The update policy is one of three states — manual, notify, auto — and it
lives in the install's record, the same YAML file that already records
what was placed and how, written last and removed last as today. The
record already carries the installed release's name; it now carries the
policy beside it, and status and notify read both locally, so the record
remains the sole source of truth for what the installer owns.

### The three policies

Manual preserves today's update: pull the checkout forward and reconcile,
no release-awareness beyond the before-and-after report. Notify behaves as
manual but, on any verb run, reports when a newer cut release exists and
the one line that takes you to it; its update does not move the install
onto the release. Auto makes update bring the install onto the latest cut
release: fetch the tags, check the checkout out onto the latest release
tag, then reconcile links and copies as today. A dirty checkout refuses
under every policy, with the same explanation.

### Under Notify, the lag is reported on any run, quietly

The notify policy reports lag: any verb run consults the latest release
cheaply — a tag listing against the checkout's own remote, no new
dependency — and says where the installed release stands. Manual and auto
do not nag; the `status` verb and its notes work under any policy,
because there the user asked. An unreachable network is not a failure:
the run proceeds and simply says nothing about releases.

### `status`: the fourth verb

`status` reports the installed release, the latest cut release, the chosen
policy, and the gap between the two — reading the record and the remote,
no mutation. The same surface serves the notes: `status --notes` shows
the changelog sections between the two releases, and the interactive menu
offers the same view, so the notes are one menu choice away from anyone
at the terminal; a spell of update's output after a sync shows them too.
Notes are a view, not a stored choice, so the flag stands outside the
two-answers rule.

### Releases reach GitHub at the cut

`/cut-release` opens the GitHub Release for the tag it just cut, its body
carrying the changelog section as the notes and the one-line install.
Whether `gh` exists is not discovered at the moment of cutting: the
bootstrapping skill checks for it as a scaffold concern and, finding it
missing, offers a setup wizard — packaged with bootstrapping, walked with
the user — that installs and readies it. `/cut-release`, finding no `gh`
when it is used, points at that same wizard; declining it skips the
release body. A declination, at bootstrapping or at the cut, is recorded
in the project's conventions, and the check skips silently thereafter.
The checkout remains the only transport for installing and updating.

### The one-line install story

The README's Install section leads with one copy-pastable command —
clone, change in, run the script — and each GitHub Release's body carries
the same line. There is no download-only channel; the feature tracker
holds the curl bootstrap as a later thought.

### Uninstall and the record stay faithful

Uninstall changes only in that it, like everything, stands on the
interactive-first rule for its one destructive confirmation, which
`--yes` still answers. Removal is still exactly what the record lists,
and the record now also holds the policy and release, so nothing the user
owns is ever touched.

## Testing Decisions

The installer harness is the test seam, and it grows around the new
surface rather than beside it: the policy is parsed from the flag and
round-trips through the record; a scripted install answering every
question by flag yields the same record as the interactive prompts; a
bare no-terminal install with unanswered questions fails naming the
flags; notify reports lag and auto checks out the latest release tag on a
fixture git repository, each honoring the dirty-checkout refusal; status
prints the four facts without mutating; and the existing assertions that
drive the script non-interactively pass flags now, since a flagless
scripted run is a failure by design. The behavior the machine cannot see
— the prompts' wording and the release notes' shape — is checked by the
same scenario list the tickets carry and by a fresh-context reader
walking a scripted first install, a scripted policy change, and the gh
setup wizard.

Prior art is the repository's own harness — zero-framework, deterministic,
exit-code-true — and the new prompts extend it by piping canned answers
onto the script's stdin, which the harness already understands.

## Out of Scope

- The curl bootstrap and any download-only install channel: tracked as a
  feature, not built here.
- Package-manager distribution and the GitHub Pages skill catalog.
- A background daemon or OS-level auto-update: auto is a policy of the
  `update` verb, not a scheduler.
- Editing the user's config beyond what the record already owns; wiring
  skills by path stays a documented manual alternative.
- Windows-specific packaging; the copy flag remains the portability
  answer, and the script stays POSIX shell.

## Further Notes

- This spec re-scopes the three-verb installer the earlier spec described;
  where they overlap, this one governs.
- It also changes the bootstrapping skill and `/cut-release` — the gh
  presence check, the setup wizard packaged with bootstrapping, the
  recorded declination, and the publish step at the cut — because release
  publication cannot lean on a tool the scaffold does not check for.
- The breaking surface — a flagless scripted install now fails by design —
  is deliberate and lands as a Changed entry whose version is the user's
  at the cut, per the versioning ruling.
- The map at `plans/installer-experience.md` is marked done once this spec
  is approved; it holds the decision trail this spec pins.