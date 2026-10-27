# Prepared question rounds — the remaining wayfinding threads

Prepared 2026-10-26 from `docs/research/concurrency-blindspots.md`,
`docs/research/remaining-blindspots.md`, and the map's open items. Each
round is a set of separate questions — never folded into one false
either/or; the user's standing rules on escaping apply to every
question.

## Round C1 — the concurrency stance (present)

Grouped so the user can think in layers. The future stance is named but
not solved.

1. **One machine, one project.** Per-project serialization (one act at a
   time); may ready stages of different chains run at once; may helpers
   (checker, fact-finder, prove-it, caregiver, idle consolidation) run
   while a builder holds a live session; bootstrap exclusivity, and
   what a re-bootstrap of a live project is.
2. **Git discipline.** Do engine and user commits share branches; what
   keeps an engine commit from carrying or clobbering the user's live
   edits; push-retry and mid-push-death policy; exactly-once protection
   (per-unit recorded stamps so nothing double-processes).
3. **Identity across machines.** One engine per started project, per
   machine, per clone — or one across them; two checkouts of one repo;
   the startedness marker (none exists yet — storage durability is an
   unverified keystone); the crash-reconstruction contract (what a
   fresh engine rebuilds from records alone).
4. **Reads and channels.** Sidebar read-consistency (torn mid-write
   views?); who may write inbox messages while they are being answered;
   what happens when the user runs `/bootstrap`, `/wayfind` — or edits —
   in their own session while the engine runs.

## Round C2 — the general backlog (ordered by dependency)

1. The engine's **complete forbidden list** — git operations, secret
   files, other worktrees, network commands — beyond the leash's one
   "don't touch un-cleared files" rule.
2. The **confirmation artifact** — what recorded evidence proves a plan
   was *user*-confirmed rather than merely tool-cleared, and what
   happens when the confirmation survives but the tool run dies; does
   the tool's run carry an author check?
3. The user's **direction-change path** mid-chain — amending a plan,
   aborting a workstream, re-answering a resolved question — given
   `/spec` and `/implement` are dead and the plan is the one human
   stop.
4. **Dogfooding girth-agents itself** — is the plugin repo a started
   project, and what pin/branch discipline stops a branch-tracking
   install from executing engine patches to its own running loop.
5. **Self-report hygiene** — who closes foreign-install defects; what
   dedup/rate-limit stops a crash-looping engine flooding the public
   repo; do users consent to records leaving their machine at all
   (privacy is a question "typed records only" never answered).
6. The **unassigned sums** — the typed forms' exact shapes and homes;
   the reports' owning skill; the context-map format; the inbox message
   forms; the cap/budget numbers; criterion-compilation details.
7. **Interrupted-user flows** — `/wayfind` or an opened inbox item
   abandoned mid-session: what hangs, what times out.

## Round C3 — GitHub integration's remaining mechanics

Offline behavior (queued pushes?); auth (gh as the vehicle — confirm);
the monorepo changelog-tooling tension (deviations rule, case by
case); branch discipline rides C1 group 2.

## Before-build keystone verifications (already on the map)

Plugin-added brand-new agent IDs; git-spec `./tui` auto-load; sidebar
live-reactivity; `ctx.storage` durability and location; the event
catalog and `session.idle` payload; `codemode` semantics.