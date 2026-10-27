# The case against per-package management state — one scaffold system per repository

**Position argued:** In a multi-context repository (monorepo with packages, or a
repo with multiple independently owned areas), the management scaffold — the
tracker, glossary, decisions, conventions, inbox, and report pile — should stay
ONE system per repository, at the root. Per-package/per-context copies of any
management piece are a design the evidence argues against, not for.

**Role of this note:** a hired-skeptic negative case. It argues one side as
strongly as the honest evidence allows, states the other side's best points,
and concedes what the one-root design genuinely cannot absorb.

**Date:** 2026-10-26. Commissioned by
`tracker/QUESTIONS.md` "Project kinds — monorepos and non-code repositories";
sibling notes `project-kinds-practice.md` (the ecosystem evidence) and
`knowledge-management-theory.md` / `knowledge-management-practice.md` (the
maintenance economics) supply most citations; this note adds the in-repo
junction history and one directly re-verified primary source (W3C QA Framework,
GP9/GP10, https://www.w3.org/TR/qaframe-spec/ — fetched and confirmed
2026-10-26).

---

## The negative case

### 1. One truth: a single store per repo is what keeps the three questions' answers unambiguous

The scaffold exists to answer exactly three questions — *what work is open,
what words mean, what blocks work* — and the design as shipped is built around
each answer having one address:

- The tracker is "the engine's internal record of what blocks work — questions
  tracked like bugs and tickets, so work does not grind to a halt while a
  resolution awaits", and the inbox is deliberately separated from it as a
  channel, "never copied" — by reference only
  (`plans/plugin-transition.md` L168–177, "Inbox and tracker, two jobs").
- The glossary format reference calls `GLOSSARY.md` "the project's shared
  language: one [file]" (`.opencode/skills/domain-modeling/references/glossary-format.md`
  L5, cited in `docs/research/project-kinds-practice.md` L297–299), and its
  rule for a disputed term is to *hold it in the tracker until settled*, not to
  open a second vocabulary (`glossary-format.md` L15–16, cited in
  `docs/research/knowledge-management-practice.md` L29–31).
- Every template in the catalog hardcodes "at the project root", and the
  routing rules all point at root pieces: "The answer lands in the project's
  records", codifying routes settled rulings to root `conventions/` and
  `decisions/`, exploration reads root `conventions/`
  (`docs/research/project-kinds-practice.md` L303–311, L336–342). None of the
  wiring has a notion of *which* project a record belongs to — the root is the
  answer.

The strongest argument for preserving this is not aesthetic; it is this
project's own recorded history. The junction history the map absorbed
(`plans/plugin-transition.md` L520–525; `plans/handoff-untangling.md`) is a
worked, user-confirmed example of what happens when two artifacts each claim to
answer "what work is open": the rolling `HANDOFF.md` "was observed carrying
open work alongside the tracker, **splitting 'what work is open right now'
into two answers, dividing each turn's attention**, and leaving a document
behind that implied continuity where none existed" (`decisions/0005-handoff-continuation-vs-deferral.md`
L3–10). The fix was one junction rule; the rejected option that most resembles
per-package stores — a standing second record, swept and extended continuously
— was rejected precisely because "it competes with the turn's work for
attention and signals continuity a new session never asked for" (`decisions/0005`
L26–28, "Considered options"). Per-context tracker/glossary/inbox copies
generalize that failure pattern from two artifacts to N artifacts: every
question about the repo ("is this done?", "what does this term mean here?",
"is anything waiting on me?") gains per-context answers that must be merged,
deconflicted, and kept in sync — the same class of split the project already
had to pay a decision to un-split.

The unilateral-vocabulary nature of the pieces makes fragmentation worse, not
neutral. A tracker that splits only *stores* parallelism; a glossary that
splits *breaks semantics*, because the split itself is the conflict: when
`packages/web` and `packages/api` each hold a definition of "session", the
system has not resolved the term fight, it has **distributed it into two files
that can no longer see each other to detect it**. ISO 704 makes the point that
domain-qualification is a property of *entries* (the standard's own worked
example: "water" defined differently in chemistry, physics, and biology is
cross-context homonymy handled with domain-qualified entries), and the
standards' repair procedure for two-meanings-one-term (ISO 704 §7.7.6
harmonization; ISO 1087 polysemy/homonymy, 3.4.28–29) presupposes one
terminology in which the ambiguity is *visible*
(`docs/research/knowledge-management-theory.md` L249–266). Pre-fragmenting
hides exactly the conflict the glossary exists to catch; see §"What one-root
can absorb" for the non-fragmenting way to carry the same information.

### 2. Attention economics: record-keeping costs scale with the number of stores, and generalist side-duty maintenance is the proven failure mode

The one piece of this design's history that is beyond dispute is that the
knowledge discipline **failed when distributed across busy generalist
agents**. The diagnosis is recorded on the map: the glossary's discipline "was
given to interactive agents whose attention was stretched too thin to follow
it interwoven with everything else they do" (`plans/plugin-transition.md`
L316–327, "Knowledge management: declared"; mirrored in
`docs/research/knowledge-management-practice.md` L69–82). The theory note
assembles the mechanism-level reasons this outcome was predictable, and every
one of them compounds with the number of stores:

- **The work/benefit disparity.** Grudin's groupware challenge: systems fail
  when "some people [must] do additional work to enter or process information"
  without being the beneficiaries; the discipline survives when "doing the
  additional work becomes someone's explicit job" (Grudin 1994, ch. in *CACM*
  37(1):92–105, quoted in `knowledge-management-theory.md` L414–425). Each
  per-package store multiplies both sides: N maintainers to staff (or N times
  the load on one), and N readers — every package reads its own records, but
  every cross-package question reads several. The cost rises linearly; the
  benefit does not, because one root store can already carry per-context
  *fields* (see the absorb section).
- **Attention is the binding constraint.** "A wealth of information creates a
  poverty of attention" — each additional record system is an additional
  information source competing for the same agent attention that the diagnosis
  already showed losing the contest (Simon 1971, quoted in
  `knowledge-management-theory.md` L398–411; principle 6, L693–698).
- **The commons degrades without accountable monitors.** Ostrom's design
  principles require clearly defined boundaries, monitors accountable to the
  users, and graduated sanctions; the standards profession has even codified
  the difference between a *terminologist* (whose main function is the work)
  and a *terminology worker* (for whom it is "an ancillary function of other
  professional activities") and calls the latter the weaker regime
  (Ostrom 1990, ch. 3; ISO 704:2022 3.6–3.7, in `knowledge-management-theory.md`
  L459–482). Every surviving real-world precedent assigns the knowledge
  discipline to ONE dedicated owner per system, never to per-area side duties:
  zeroshot's postmortem ("**Workers never write lessons.**",
  `knowledge-management-practice.md` L416–425), OpenAI's recurring
  doc-gardening agent (L432–442), Google's style arbiters and the GooWiki case —
  "Documents without owners become stale" (L248–277). The plugin's own map has
  already ruled the same shape: maintenance is "a new, small dedicated
  helper", and "a skill loaded into an agent implies that agent holds its
  responsibility … never excessive and diverse context"
  (`plans/plugin-transition.md` L287–297, L383–390). Per-context stores are the
  reciprocal of every one of these: the discipline, instead of resting on one
  named caregiver, becomes N ambient side duties spread across N contexts.
- **Infrastructure costs are invisible and standing, not one-off.** A glossary
  (and a tracker) are infrastructure: transparent in use, visible only on
  breakdown, "endlessly required" maintenance (Star & Ruhleder 1996; Bowker &
  Star 1999, in `knowledge-management-theory.md` L491–499). Fragmentation
  does not add capability; it adds the standing upkeep — re-rating, conflict
  hunts, orphan cleanup — N times over, each store against its own pace of
  use. Codified knowledge only pays when reuse is real (Cowan & Foray 1997;
  Markus 2001, in the same note L113–162): a per-package glossary holds entries
  that, by construction, only that package reads — the lowest-reuse, most
  expensive capture configuration.

The attention case is even stronger for the pieces the user touches directly:
the inbox is one TUI screen with one counter "for the current project",
sorted in a single received order, opening into a seeded session
(`plans/plugin-transition.md` L488–495, L512–515). Per-package inboxes either
burst that into N surfaces the user must visit, or collapse back into one
view that now must merge N stores — paying the fragmentation cost to recover
the single-surface behavior one store had for free.

### 3. Precedent and mechanics: no tool anywhere places management state per package, and OpenCode's own model is one project per location

Two research notes already ran this to ground, and the result is unusually
one-sided. First, the practice sweep: across AGENTS.md/CLAUDE.md/Codex
instructions, npm/pnpm/Turborepo/Nx workspaces, ADR tooling, Kubernetes KEPs
and OWNERS, and docs-only repos, the universal split is **two levels: root
holds cross-cutting state; the unit holds instructions and ownership — nothing
else** (`docs/research/project-kinds-practice.md` §5, L353–398). The findings
that matter here:

- The per-directory artifacts every tool ships are *instructions and
  ownership*: per-package CLAUDE.md/AGENTS.md, per-directory OWNERS files, Nx
  `tags` metadata. "No tool ships a per-directory glossary-equivalent", and
  "the shared vocabulary stays repo-wide" in every first-party source
  (`project-kinds-practice.md` L374–379). The options table closes with the
  finding that full per-package scaffolds (option c for monorepos) have "**no
  first-party precedent**; the closest analogs stop at per-package
  `package.json`/tool config" — Turborepo's own docs warn "There are limits to
  this idea" about packages as mini-projects (`project-kinds-practice.md`
  L406, L156–160).
- Even the tools that *centralize per-package state* put it in one root
  artifact: pnpm's `packageConfigs` is "a map of package names to config
  objects" inside the root `pnpm-workspace.yaml` — "the opposite shape … one
  root file with per-package sections" (`project-kinds-practice.md` L140–145).
  The note's closing judgment: "The shape to copy when N packages × M pieces
  gets ungovernable is: root file, per-package sections, one owner"
  (L386–391). That is context-tagged entries in one store — the exact
  absorption mechanism argued below — not per-package stores.
- Where record sets *do* subdivide (KEPs into SIG directories, MADR
  categories), the systems treat it as a costly early meta-decision, not a
  default: MADR warns that category splits break numbering ("numbers of ADRs
  are no longer unique throughout the repository, but locally within a
  category only" — literally the "one truth" loss, made concrete) and that
  categorization "comes down to a meta-decision to be made rather early on"
  (`project-kinds-practice.md` L205–219, L369–373). Kubernetes KEPs keep
  repo-wide process docs at root, place records per unit, **and duplicate the
  owner in the record's metadata** (`kep.yaml` `owning-sig`) — evidence that
  even the strongest per-unit precedent carries scope as a field, not as
  store identity (L221–240).
- Recall/memory engines are keyed to the repository, not the package: Claude
  Code auto memory — "all worktrees and subdirectories within the same repo
  share one auto memory directory" (`project-kinds-practice.md` L381–385).
  So the platform's own non-canonical memory is repo-scoped; a design adding
  per-package *canonical* stores fights the platform on both axes at once.

Second, the mechanics sweep of OpenCode V2 itself
(`docs/research/project-locations-mechanics.md`): a location is a directory
plus **exactly one** `project` object — "structurally, a location cannot
belong to several projects" (L39–51, L310–312); every session carries exactly
one directory and one projectID (L160–166); nested package configs are "merge
layers" of one config chain, never separate projects (L120–141); and
"monorepo"/"multi-root" appear **nowhere** in the V2 docs or schema
(L297–306). The decisive implication for the design question is recorded in
the note's own implications section: "If our engine wants per-package state
(tracker/inbox/glossary per package), OpenCode offers **no per-package
project object to hang it on** — we must key on directory (or repo-relative
subpath) ourselves, and handle the ambiguity that OpenCode does not define
where 'package' ends and 'project' begins" (L420–427); sessions started at
the repo root would not even associate with package-scoped state without the
undocumented `subpath` bridge (L424–427). Per-package state is not merely
unprecedented; it has no load-bearing surface in the platform, while
per-location (one-root) state inherits the platform's lifecycle for free
(idle timeout, reload; L432–435, L336–346).

Finally, this repo's own scaffold grammar already excludes the per-package
variant at the level of its formats: every piece is defined as a single
instance of "the project"; the Deviations mechanism "only relocates, never
multiplies" (a deviation names a *different* path for the piece, not a rule
like "each package has its own tracker/"); and the only scoping knob that
exists is one alternate root per run (`project-kinds-practice.md` L284–335).
Per-context stores would not be a configuration of the current system; they
would be a new language, plus a hierarchy/conflict model the note shows the
ecosystem itself does not agree on (L101–106) — invented from scratch, with
no precedent, to carry state the platform already scopes per-repo.

---

## What one-root can absorb

The advocate's case is not straw. Its two honest strong points, stated
squarely, are:

- **Semantic conflicts.** Terms genuinely mean different things in different
  contexts ("session" in web vs. API); one repo-wide glossary forces them to
  collide, and ISO 704 itself says "different domains or subjects view the
  same objects differently" (`knowledge-management-theory.md` L258–263).
  Evans' bounded contexts are the software-shaped version: each context owns
  its dialect, and the costs come from *translation* between models
  (L103–109). Per-context glossaries let each context keep its own honest
  definition with no translation at all.
- **Lifecycle independence.** Packages are developed, frozen, or abandoned on
  their own schedules; a shared tracker/glossary makes the dead package's
  records sit in the living one, and the living package's changes force
  re-touching records that other contexts rely on. Per-context stores bound
  each context's staleness to itself.

The one-root design can absorb both, without pre-fragmenting — the literatures
give the devices:

- **Context-qualified entries in the one store.** ISO's own answer to
  cross-context homonymy is domain qualification *within one terminology*,
  plus the standing repair procedures (disambiguate the concepts, re-designate,
  rate synonyms preferred/admitted/deprecated — ISO 704 §7.7; harmonization —
  §7.7.6; `knowledge-management-theory.md` L247–266). W3C GP10 carries the
  same rule for specifications, verified directly against the Recommendation
  this cycle: reuse an existing term "without changing its definition";
  conflicting definitions "lead to reduced interoperability"
  (https://www.w3.org/TR/qaframe-spec/ §2.3.1, GP9/GP10). Conflicting senses
  *become visible* at the collision and are repaired once; pre-fragmented
  glossaries would make the collision invisible forever. The scholar path is
  against the advocate here: independent vocabularies drift, and "keeping a
  *shared local* glossary is cheaper than perpetual alignment" (Euzenat &
  Shvaiko, *Ontology Matching*, 2nd ed., in `knowledge-management-theory.md`
  L526–532).
- **Scope as a field, not a store.** The ecosystem shows the cheap shape
  everywhere: Nx `tags: ["scope:myteam"]` on projects, KEP `owning-sig` in
  metadata, pnpm `packageConfigs` sections in the root manifest
  (`project-kinds-practice.md` L140–145, L182–185, L221–240). A tracker entry
  or glossary term carrying a `context:`/scope field (or a `_Contexts_` line
  in the glossary format) preserves one address for the question "what is
  open / what does this mean" while letting readers filter by context. The
  friction that remains is one schema addition; per-package stores are the
  same information bought at the price of N new schemas, N new maintainers,
  and a new conflict model.
- **Closure, not separation, is the lifecycle answer.** The tracker's own
  formats already model ends: hazards close with `Retired — <date>`
  (`knowledge-management-practice.md` L373–375), the glossary's rating scale
  is a graduated demotion scheme — preferred → admitted → deprecated →
  obsolete — designed so "a term never has to be deleted to be demoted"
  (`knowledge-management-theory.md` L222–228, principle 8). A package that
  dies closes its scoped entries in place; the one-root design needs the
  standing cleanup job, not a quarantine architecture. And when the boundary
  is genuinely stronger — honest independent ownership, separate release
  cadence, separate audience — the ecosystem's answer is a *separate
  repository with its own scaffold* (github/docs splits repos by audience;
  the scaffold's own alternate-root deviation relocates, never multiplies:
  `project-kinds-practice.md` L276–279, L327–331). Two real projects in one
  git remote is the rare, honest case; it is solved by two repos, not by
  N nested scaffolds inside one.
- **The user-facing pieces have no conflict case at all.** The inbox is a
  channel with one human on the far end and one counter on the screen
  (`plans/plugin-transition.md` L488–495, L512–515); reports are read in one
  place so "the engine and the sidebar read one place" (L445–447). There is
  no semantic or lifecycle argument for splitting them — the advocate's
  strong points touch only glossary and (weakly) tracker.

---

## Honest weaknesses of the one-root design

The skeptic's duty: where one root genuinely strains.

1. **Repo-wide glossary force collisions that then *must* be resolved.**
   Domain-qualified entries and harmonization are machinery that requires the
   caregiver and the user to actually run it (ISO 704 §7.7 assumes a
   terminologist). An unresolved term fight in a shared glossary leaves *every*
   reader with an ambiguous record; per-context stores would at least contain
   the damage per context. One-root buys detectability at the price of
   making the dispute everyone's problem until it is settled.
2. **Scale mechanics are unbuilt.** One tracker for a large monorepo means
   one file with an unbounded number of open questions; the current formats
   have no partitioning or pagination field, and the pnpm-style
   "per-package sections in the root file" shape is recorded as the escape
   hatch *to build* (`project-kinds-practice.md` L386–391), not something the
   scaffold has today. A serious N-package monorepo will hit this before
   N-scaffolds would.
3. **The boundary is ours to derive, and it can misfire.** OpenCode never
   defines "project root" or where a package ends and a project begins
   (`project-locations-mechanics.md` L392–408). One-root must be *found* by
   walking up from `ctx.location.directory`; a user who opens OpenCode inside
   `packages/web` of a repo they do not own as a project, or a monorepo that
   is honestly two teams, will get the wrong root or none. Per-context state
   would at least be located by the directory the user is in — the advocate's
   one real mechanical advantage, and it matters most in exactly the
   multi-context repository shapes this design question is about.
4. **The absence of precedent is evidence of absence of need, not proof of
   error.** Nobody ships per-package management state — but until very
   recently nobody shipped *repository management state maintained by
   autonomous agentic systems* either. The advocate can fairly claim new
   territory; the negative case rests on inference from adjacency (the
   two-level split's boundary, keyed memory, attention economics), and an
   honest record flags the possibility that a future empirical result turns
   the finding around.
5. **One-root concentrates staleness at the most conspicuous point.**
   A dead package's scoped entries sitting in the shared tracker/glossary
   make the whole system feel stale every time any agent reads it —
   classification systems drift "unless someone keeps them", and the keeper
   is exactly the role this project's history shows being neglected
   (Bowker & Star 1999, `knowledge-management-theory.md` L278–282; the
   stretched-thin-generalist diagnosis, `plans/plugin-transition.md`
   L316–327). Closure-in-place is the correct mechanism (weakness 1's mirror)
   but it is a recurring chore the one-root design inherits in full.
6. **One inbox, one user — but one mixed queue.** With a single inbox the
   user's attention surface is ideal; the queue's *content* is heterogeneous
   (package-A authority questions beside package-B term proposals). Without
   scope fields and filtering on inbox items, one-root buys cohesion for the
   system at the cost of a sorted-but-mixed queue for the human. Absorbable —
   but it must actually be absorbed; the extension is part of the price.

Net: the negative case stands on cohesion-with-history (decision 0005's
worked lesson), maintenance economics (every surviving precedent assigns one
owner per system), and a unanimous ecosystem-plus-platform precedent that
stops per-directory state at instructions and ownership. The one-root design
is not free — it must build scope fields, closure discipline, and root
derivation — but its costs are schema-and-discipline additions to one store;
the alternative's costs are N stores, N maintainers, and a conflict model no
tool has ever needed.