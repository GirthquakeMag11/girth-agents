# First-class multi-context support in the scaffold — the affirmative case

**Question answered:** should the management scaffold give a monorepo's
packages (or "contexts") first-class support — modeled context boundaries,
per-context tracker/glossary/decisions state, or at least properly scoped
records — instead of the current one-project-one-repo assumption?

**Role of this note:** an advocacy brief. It builds the strongest *honest*
case FOR first-class multi-context support, as commissioned. It is
one-sided by design: the rebuttals live in "Honest weaknesses", taken
seriously but not argued to equilibrium. Where the case rests on principle
rather than on shipped precedent, it says so — that line matters because
the sibling practice note found that no first-party tool places
tracker-like or glossary-like records per package, and this brief must not
pretend otherwise.

**Date:** 2026-10-26. Written against the four commissioned reads and two
additional first-party sources verified while writing this note (fetched
2026-10-26): changesets/changesets `@ b09779a3d503a581df98a81384d5849db969eb03`
(README: "A tool to manage versioning and changelogs with a focus on
monorepos") and googleapis/release-please `@ c589293ca38aee267b329f9bf9b26c9d6516a687`
(`docs/manifest-releaser.md`: per-package configuration, changelogs, and
versions in monorepos). Standards and papers are cited through the sibling
notes that verified them (`knowledge-management-theory.md`,
`project-kinds-practice.md`), except where marked "verified here."

---

## 1. The affirmative case

### 1.1 Cross-context meaning divergence is the standards' normal case — a flat glossary either falsifies it or cannot represent it

The terminology standard takes cross-context meaning divergence as a fact
of the discipline, not an edge failure. ISO 704:2022, §5.1: "Different
domains or subjects view the same objects differently," worked with
'water' defined differently in chemistry, physics, and biology
(`docs/research/knowledge-management-theory.md` §2). Correspondingly,
homonymy (one designation, unrelated concepts) and polysemy (one
designation, related-but-distinct senses) are *named* deviations from the
mononymy/monosemy ideal, and the standard's remedy is domain-qualified
entries plus harmonization as a standing activity — context-aware
machinery, not flat disambiguation (ISO 704:2022, §7.7.1, §7.7.6; ISO
1087:2019, 3.4.28–3.4.29, as cited there). Evans' bounded contexts are the
same principle in software: "one team, one language," where the team is
the unit that owns a vocabulary (Evans 2003, *Domain-Driven Design*, as
cited in `knowledge-management-theory.md` §1).

A monorepo is precisely where domains collide inside one artifact: the
same word — "job," "model," "event," "release" — legitimately denotes
different concepts in a data pipeline, a payments service, and a docs
site. The current scaffold cannot represent this. `GLOSSARY.md` is "the
project's shared language: one [file]" with one definition per term
(`.opencode/skills/domain-modeling/references/glossary-format.md` L5,
cited in `project-kinds-practice.md` §4), and the settled review loop
grades work that "uses a term in a drifted sense" as a failure
(`plans/plugin-transition.md` — "Glossary in reviews"). Forced onto a
multi-domain repo, the flat glossary must either *falsely unify* distinct
concepts into one definition (making at least one package's agents wrong
every run), or *falsely flag* legitimate cross-context uses as drift
(making the review loop the enemy of the repo's actual language).
Worse, LLM agents align on wording without aligning on meaning
(Pickering & Garrod 2004, as cited in `knowledge-management-theory.md`
§5) — an agent working in `packages/payments` will happily reuse the
repo-wide term with the other package's sense, and the system's own
glossary-consistency check will certify the collision as one vocabulary.

The standard's own answer to "two meanings fight for one term" is to
split the concepts, re-designate, and rate — and to qualify entries by
subject field (ISO 704:2022, §7.7; ISO 1087:2019, 3.4.2: a term designates
a concept "in a specific subject field"). That is a per-context
vocabulary, stated in standard-ese. The scaffold either models contexts
first-class or hands its glossary a defect sealed at design time.

### 1.2 The scaffold's own inventory already contains management records the ecosystem scopes per package

The strongest skeptic fact is that no tool ships per-package trackers,
glossaries, or decision logs. But that fact does not generalize to
"management records" — and the scaffold's own twelve-piece inventory
(`.opencode/skills/bootstrapping/SKILL.md` L42–54) includes one piece the
ecosystem standardly scopes per package: `CHANGELOG.md`.

Verified here, first-party:

- **changesets** describes itself as "a tool to manage versioning and
  changelogs with a focus on monorepos," solving "keeping packages that
  rely on each other up to date" and handling "updating package versions,
  changelogs" per package (README, `@ b09779a3…`). Its own monorepo
  demonstrates the output: per-package `CHANGELOG.md`, e.g.
  `packages/cli/CHANGELOG.md` (README banner link). And its *change
  records* carry scope in the record itself: a changeset entry's
  frontmatter lists which packages a change applies to, e.g.
  `.changeset/open-bottles-fry.md` declaring `"@changesets/cli": minor`
  (commit `b09779a3…` file list).
- **release-please**'s manifest mode exists explicitly for monorepos: "The
  motivation of the manifest-based releaser is support for monorepos"
  (`docs/manifest-releaser.md`). Its config is keyed by package path ("the
  key is the relative path from the repo root to the folder that contains
  all the files for that package"), and `changelog-path` is "Path +
  filename of the changelog relative to the *package* directory. defaults
  to 'CHANGELOG.md'" — per-package changelogs as the default. Per-package
  *version state* is centralized in a root `.release-please-manifest.json`
  (`{"path/to/pkg": "1.1.1"}`), tags carry per-package components
  (`<component-name>-v<release-version>`), releases can split per package
  (`separate-pull-requests`), and the special `"."` path models the repo
  root itself as one more releasable unit alongside the packages.
- Turborepo states the mental model the other tools implement: "each
  package is almost like its own small 'project', with its own
  `package.json`, tooling configuration, and source code. There are limits
  to this idea — but its a good mental model to *start* from"
  (`project-kinds-practice.md` §2, quoting
  https://turborepo.com/docs/crafting-your-repository/structuring-a-repository).

So the ecosystem's released answer to "where do records whose scope is one
package live" is: version and changelog records are per-package (in the
package dir or centralized with per-package keys), and the root is itself
a unit in the same system. The scaffold, by insisting all twelve pieces
live at one root, will *fight the user's release tooling* in exactly the
handful of its pieces where the user has tooling. Two shapes are already
blessed (per-package placement like changesets; centralized-with-scope
keys like release-please's manifest and pnpm's `packageConfigs`,
`project-kinds-practice.md` §2) — both are first-class multi-context
support for records, and both already exist in the wild.

*Honest boundary:* precedent holds for changelogs and versions. It does
not, yet, hold for trackers, glossaries, or decision logs — this is the
skeptic's real, remaining ground, addressed in §1.3–1.4 and conceded in
§3.2.

### 1.3 Ownership and lifecycle are directory-scoped everywhere the ecosystem has an answer — and record sets follow their owners

Every tool that answers "which people, which rules, which records belong
to this subtree?" answers *per directory*:

- Kubernetes OWNERS: "Each directory that contains a unit of independent
  code **or content** may also contain an OWNERS file" (`project-kinds-practice.md`
  §3, kubernetes/community `owners.md`). Kubernetes' own records follow
  the same rule: "Almost all KEPs should go into SIG subdirectories," "Copy
  this template into the owning SIG's directory," with `owning-sig` carried
  in each record's metadata — repo-wide process at root, records inside
  the owning unit (`project-kinds-practice.md` §3).
- Nx makes boundaries enforceable: `"tags": ["scope:myteam"]` with lint
  rules that "ensure that libraries belonging to `myteam` are not depended
  on by libraries belong[ing] to `theirteam`" (`project-kinds-practice.md`
  §2).
- Agent memory files are per-package with explicit precedence: nested
  AGENTS.md ("the closest one takes precedence," 88 files in OpenAI's
  repo), per-subdirectory CLAUDE.md one per package maintained by its
  owner ("Each directory's owner typically maintains its file"), Codex
  nested overrides (`AGENTS.override.md` in `services/payments/`)
  (`project-kinds-practice.md` §1).
- MADR, the only decision-log tool that addresses large projects, makes
  the scoping question a recorded early decision: categorize ADRs so the
  folders "follow the same organizing principles as other artifacts such
  as the code," accepting that numbers become "unique … locally within a
  category only," and that "This comes down to a meta-decision to be made
  rather early on" (`project-kinds-practice.md` §3).

The convergence is not accidental. A monorepo is one repo *because* shared
history and atomic cross-tree change pay; its packages have independent
owners, independent release lifecycles, and independent languages —
Turborepo's "small 'project'" model, KEPs' per-SIG records, OWNERS'
per-directory authority all exist to stop the repo's single URI from
erasing those boundaries. The scaffold currently cannot make MADR's
meta-decision at all: its deviations mechanism "only relocates, never
multiplies" — a deviation names a *different* path for a piece, not a rule
like "each package keeps its own tracker/", and there is "no vocabulary
for a *second* instance of any piece" (`project-kinds-practice.md` §4).
First-class context support is the vocabulary for the meta-decision the
ecosystem's own tools insist users make "rather early on" — and one made
at bootstrap, against signals, beats one improvised per-record later.

### 1.4 A single root throws away record provenance the engine's own flow depends on

The engine's operating loop is built on scopes its records cannot express.
Every OpenCode session is bound to exactly one directory and one
project ID; sessions are listed and filtered by directory; a session
started in `packages/payments` is, for every practical purpose, a
payments-context session (`docs/research/project-locations-mechanics.md`
§3). The scaffold's routing rules know none of this: "The answer lands in
the project's records" — *the* records, at the root, with no notion of
*which* project the record belongs to (`project-kinds-practice.md` §4,
quoting `tracking/references/questions.md`). A question spawned by work in
`packages/payments` (tracked as a question kind, answered through the
inbox, resolved onto the tracker — `plans/plugin-transition.md` "Inbox and
tracker, two jobs") lands in a tracker that cannot say it blocks payments;
the reviewer compiling criteria reads a decisions log that cannot say
which decision binds which package; the sidebar's single counter mixes
unrelated work fronts into one attention signal. Scoping information that
the session already *has* is destroyed at the record boundary. This is not
a hypothetical flaw: it is the current design's documented behavior, and
the mechanics note's own implication is to "key on directory (or
repo-relative subpath) ourselves" (`project-locations-mechanics.md`,
"Implications for scoping our engine 'per project'"). First-class context
support is simply that keying made durable and readable — the alternative
is the engine holding scope in memory that evaporates at the record
boundary.

### 1.5 "Role-shaped context" is settled law in this project — union records violate it

The design already commits to context-scoped delivery, generically:
"Context is role-shaped … the new system must give each engine agent
measured, precisely tailored context, never excessive and diverse
context" (`plans/plugin-transition.md`). The commitment has no
project-kind carve-out. In a five-package monorepo, the union of one
glossary, one conventions set, and one decisions log *is* the "excessive
and diverse" context that ruling forbids — handed to a builder whose whole
assignment sits under `packages/web`. The glossary caregiver is defined to
have "only context … the glossary" (`plans/plugin-transition.md` — "The
vocabulary caregiver"); in a monorepo that glossary spans N unrelated
domains, and §1.1's collision is guaranteed to arrive on the caregiver's
desk without the context dimension needed to resolve it. The same ruling
implies the reviewer should compile its glossary-consistency criteria from
the records *visible in the context being reviewed* — which requires the
records to carry a scope. Multi-context support does not amend the design;
it completes a ruling already on the books, in the one place — project
kinds — where the rulings were knowingly left silent (`plans/plugin-transition.md`
— "Project kinds: declared … must be investigated thoroughly").

### 1.6 Maintenance economics across team boundaries: Grudin's disparity turns structural, and its cure needs named scopes

The theory notes put the failure of distributed glossary maintenance on a
work/benefit disparity: "Most groupware requires some people to do
additional work … when the person who must do the extra work is not the
beneficiary, adoption fails," and the fix is that "doing the additional
work becomes someone's explicit job" (Grudin 1994, as cited in
`knowledge-management-theory.md` §4). The plugin adopts the fix for one
project — a designated caregiver. A monorepo re-opens the wound at the
team boundary: the producers of each package's vocabulary are the package
teams; the beneficiary-owner of the entries is a central caregiver who is
*not* in the work context where the meaning lives. The field studies all
warn what happens next: memory kept "divorced from the social context of
the work went stale and unused" (Ackerman & Halverson 2000, as cited
there); capture works only at the point of articulation, in a situated
context (Nonaka's externalization-in-*ba*; Davenport & Glaser's
just-in-time delivery; `knowledge-management-theory.md` §3); and common
ground is bought per joint activity (Klein et al. 2005, §1). A central
caregiver for five unrelated packages is five times divorced from five
"ba"s. The economics literature gives the scoping answer directly: codify
only what will be reused (Cowan & Foray 1997, §1), and Ostrom's design
principle 8 for a shared vocabulary is literally "nested enterprises" —
the commons literature's cure for scale is named inner scopes
(`knowledge-management-theory.md` §4). Contexts are where Grudin's
"explicit job" can actually be performed: each context's owner as the
local maintainer of its records, one central caregiver for the
cross-cutting layer — the exact two-level split every practicing tool
converged on (`project-kinds-practice.md` §5: "Root holds cross-cutting;
the unit holds local").

### 1.7 The platform's grain is directory-resolution; multi-context support follows it, single-root fights it

OpenCode V2 already resolves *everything per directory* except the
management records. Config merges from the current directory up the tree
with nearest-wins, the docs' own example being a package config overriding
the repo config (`project-locations-mechanics.md` §2); skills, agents, and
commands are discovered "from the current directory up to the project
root" with nearer sources winning (id. §4); references resolve from the
config file's own directory, so a reference defined at root and one
defined in a package config already mean different things (id. §4,
"Cross-cutting observation"); sessions are single-directory (§3). What
OpenCode never does is define the monorepo boundary — "multi-root" and
"monorepo" appear nowhere in its docs or schema, and whether a package is
a sub-project is explicitly undocumented (id. §5, "Boundary facts"). That
silence is an invitation, not a veto: the platform gives us directory
identity, nearest-wins machinery, and per-location lifecycle for free, and
leaves the boundary rule to us. Writing that rule into the records —
"a record may be scoped to a context; an agent at a context's paths reads
root records plus its context's" — is reading the platform's direction to
its conclusion. The single-root scaffold, by contrast, is the one design
that throws away the locality its own sessions and registries already
provide, and hands every record-reading agent the union blob the
platform's other layers go to such lengths to avoid.

---

## 2. The proposal — least machinery

The case above supports first-class *scoping*, not scaffold
multiplication. The minimal design that delivers it, in order of cost:

### 2.1 Principle: scoping first-class, scaffolds last-class

One scaffold per repo, always. What becomes first-class is the *scope* of
records: a named context can exist, be read, and be written without any
piece ever leaving the root. Per-context *placement* (files in a package's
directory) is a promotion, gated on warrant (§2.5), not a default. A repo
with no second context is byte-identical to today.

### 2.2 The delta: one record, one field, one resolution rule

- **One new scaffold piece — the context map.** A root-level record
  (e.g. `contexts.md` or a section of AGENTS.md) declaring, per context:
  name, path or glob(s), owner. The root itself is a context (modeled on
  release-please's `"."` unit, §1.2). This replaces the current single
  "one alternate root per run" knob (`project-kinds-practice.md` §4) with
  named, persistent, multiple scopes — a superset of today's behavior.
- **One optional field.** Every record format (glossary entries, decisions,
  tickets of any kind, specs, plans, reports) gains an optional
  `context:` field. Unset = root (shared). All records keep their root
  location, numbering, and inbox — nothing moves, nothing re-numbers
  (MADR's warning about per-category numbering stays safely irrelevant).
- **One resolution rule, written down.** The ecosystem disagrees on
  nearest-wins vs. concatenation (`project-kinds-practice.md` §1), so the
  scaffold must say: an agent working at a context's paths reads root
  records plus records tagged with that context — nearest-wins within the
  visible set, concatenation never. The rule is one sentence and completes
  the "role-shaped context" ruling (§1.5).

### 2.3 Discovery before declaration

Bootstrap derives what it can, and asks nothing derivable — per the
settled ruling "Bootstrap is synchronous … everything derivable is
derived, rather than asked" (`plans/plugin-transition.md`). Context
signals already exist in the tree, in descending strength: workspace
manifests (`package.json` `workspaces`, `pnpm-workspace.yaml` `packages` —
`project-kinds-practice.md` §2; Nx's own discovery reads exactly these to
enumerate projects); per-package `package.json` as unit markers
(Turborepo's "anatomy of a package"); per-directory OWNERS or CLAUDE.md as
owner-and-scope evidence (§1.3). Only boundaries with no detectable signal
(same-team shared-language splits, e.g. a docs subtree that shares no
package metadata) cost the user a bootstrap question. The discovery step
is a grep-shaped pass over well-known manifests — the cheapest machinery
in this entire proposal, and it produces the context map humans would
otherwise hand-write.

### 2.4 Tag before place: what scope buys with zero new directories

With only the delta of §2.2, every failure in §1.4 and §1.5 closes:

- A question spawned in `packages/payments` is stamped `context: payments`
  by the session's own directory on the way into the tracker; inbox
  replies return to the same record (the flow's "by reference, never
  copied" rule is unchanged — `plans/plugin-transition.md` "Inbox and
  tracker, two jobs").
- Glossary consistency in reviews compiles criteria from root records +
  the reviewed context's records (§1.5), killing the false drift flags.
- Cross-context homonymy becomes representable in the one-file glossary,
  exactly as the standards prescribe: two entries, one per context field,
  cross-linked, each with an intensional definition that must *differ*
  (the definition checks of ISO 704:2022, §6 are already mechanical,
  `knowledge-management-theory.md` §2) — "two meanings fight for one
  term" is no longer an error to suppress, it is two concepts with
  evidence one can machine-check. The ISO answer is context-qualified
  entries plus harmonization (§7.7.6) as a standing dance between the
  caregiver and the user, which the settled proposal pipeline already
  routes (`plans/plugin-transition.md` — "Glossary proposals").
- The sidebar's one inbox number can group by context with no new session
  mechanics.

None of this creates a per-package directory. It is the *minimum* honest
claim of this brief: if nothing else ships, the tag + map + rule remove
the misrepresentations single-root currently guarantees.

### 2.5 The promotion ladder: per-package placement only on warrant, in precedent order

A record kind promotes from "root file, tagged rows" to "file placed in
the context's directory" only when warranted, where warrant is the term
standard's three gates applied to a (piece, context) pair (ANSI/NISO
Z39.19-2005, §5, adapted; `knowledge-management-theory.md` §2): *literary
warrant* — the context's tagged records already diverge in substance from
root usage; *user warrant* — the context's owner asks; *organizational
warrant* — a decision must bind that context alone. Promotion order is
fixed by precedent strength, and stops where precedent stops:

1. **Instructions/conventions per package** — first-party precedent
   (per-package CLAUDE.md/AGENTS.md, §1.3). Note these files usually
   *already exist*; the scaffold merely stops ignoring them in favor of
   root-only context.
2. **`CHANGELOG.md` per package** — first-party precedent, the ecosystem
   default (changesets, release-please, §1.2). Where the user runs such
   tooling, the scaffold's one-changelog assumption is the outlier.
3. **`decisions/` per context** — precedent exists *as categories inside
   one log*: MADR instructs categories to mirror the code's organization,
   decided early (§1.3). Bootstrap therefore asks the MADR question once —
   "shall decisions be categorized by context?" — when contexts exist.
4. **Tracker and glossary per context** — no first-party precedent
   anywhere (`project-kinds-practice.md` §5). Allowed only through the
   existing deviations machinery: the bootstrap interview settles it as a
   recorded ruling (bootstrapping's deviations path → codifying),
   never a default, never silent.

Tracker *kinds* stay one kind set repo-wide; kinds are already the
tracker's extension mechanism (questions, hazards, tickets, term
proposals, lessons — `plans/plugin-transition.md`), and the `context`
field is the kind-level scoping dimension, not a new kind.

### 2.6 Engine wiring

One engine per started root (the "operates only where it has been started"
ruling is untouched); per-context state keyed on `ctx.location.directory`
or repo-relative path — the keying the mechanics note says is ours to
define (`project-locations-mechanics.md`, Implications). Sessions keep
their single directory; record routing stamps the `context:` field from
it (§1.4). Nothing in this proposal needs a multi-root session, a second
projectID, or any undocumented platform field.

### 2.7 Deliberate non-goals

No nested scaffolds. No per-context bootstrap runs. No scaffold-generated
per-package instruction files (the user's own files serve). No per-context
glossary files by default. No per-context renumbering. No change at all to
a single-context repo's files, asks, or behavior. These exclusions are the
price of the design being small; they are also §3's first line of defense.

---

## 3. Honest weaknesses

### 3.1 One-truth simplicity and conceptual integrity

Brooks: conceptual integrity comes from one mind, not a committee
(*The Mythical Man-Month*, ch. 4, as cited in
`knowledge-management-theory.md` §4). Multi-context scope splits the
arbiters: with tags (§2.4) there is still one file and one caregiver, but
promotions (§2.5 levels 3–4) would put the same record kind under multiple
maintainers, and near-duplicate entries across contexts — the thing
harmonization exists to fix — become a *standing* chore rather than an
incident (ISO 704:2022, §7.7.6; principle 8 of the theory note: drift and
rattings are lifecycle events). The case's counter is that conceptual
integrity must apply per bounded context: one mind can hold
`packages/payments`' language, and no single mind can hold five unrelated
ones — Evans' team-language scoped, not Brooks abandoned. The residual
risk is real: the promotion ladder's discipline (warrant gates) is a
process the scaffold must enforce on itself, and self-policing processes
are the first casualty of maintenance fatigue.

### 3.2 The precedent gap for tracker, glossary, and decisions

The case's weakest seam, stated plainly: no first-party tool ships
tracker-like, glossary-like, or decision-log-like records per package —
the practice note's capstone finding ("No first-party source places
tracker-like or glossary-like records per package,"
`project-kinds-practice.md` §6). What I add to the record is changelogs
and versions (§1.2) plus the ownership and category *principles* (§1.3),
which are adjacent, not identical. A skeptic is fully entitled to accept
§2.2–2.4 (tags) and refuse §2.5's levels 3–4 as precedent-free
architecture. My honest read: tags-and-keying are practice completion;
per-package decision logs rest on MADR-by-analogy; per-package trackers
and glossaries rest on principle alone — they should be harder to get than
this brief would need them to be, which is why the proposal walls them
behind explicit rulings.

### 3.3 Attention and over-modeling

Every context boundary is a resolution step on every record read, a
dimension in every bootstrap, and a possible question to the user —
against Simon's attention economics, the most frequently violated
constraint in this whole design space (`knowledge-management-theory.md`
§4). Ontology engineering names over-modeling as a known failure mode
(Noy & McGuinness 2001, §1), and the codification economics say capture
nothing without a reuse prospect (Cowan & Foray 1997, §1). For a monorepo
of five tightly coupled packages worked by one team, contexts *are*
over-modeling: Turborepo itself hedges its "small 'project'" model —
"There are limits to this idea" (§1.2). The design's answer is default-zero
(§2.1) and discovery-over-asks (§2.3); the residual risk is that a
"contexts" feature will be *used because it exists* — minting scopes for
ad-hoc folders that shoulder no ownership — and every vacant context is
pure rent. The correct posture (and this must be stated in the spec) is
that detecting *fewer* contexts than the directory count is not
incompleteness; it is the model refusing a boundary that does not exist.

### 3.4 OpenCode mechanics stop at the repository

The platform gives directory-resolution for config and registries, but
its identity primitives are repo-shaped: one `projectID` per location,
recall memory keyed per git repository, engine lifetime per location, and
one-directory sessions whose root-scope behavior toward package state is
undocumented (`project-locations-mechanics.md` §1, §5–6; Claude Code's
auto-memory precedent in `project-kinds-practice.md` §1 — worktrees and
subdirectories share one memory directory). Building context-aware state
on top therefore means running a *second, scaffold-owned* keying world
(directory → context map) that must stay consistent with the platform's
first one — sessions at the repo root do not auto-associate with any
package context, and the one bridge field (`Session.Info.subpath`) is
undocumented. Nor does the platform settle the deeper question this
proposal deliberately avoids: whether the engine is one instance across
started projects or per project, still open in the plan
(`plans/plugin-transition.md`, "Not yet specified"). Multi-context state
is thus a standing integration cost with the platform's quiet parts, and
the most likely piece to rot as OpenCode defines its own monorepo story
later — we may be building our boundary rule into a space OpenCode will
declare first.

### 3.5 Over-slicing: imposing boundaries the team does not have

Evans' bounded contexts presuppose a *team* per context; monorepos
frequently have one team and many packages. The §1.3 ownership evidence
(KEPs, OWNERS, Nx scopes) is drawn from multi-team organizations. Where a
monorepo is really one team's internal structure, per-context records
would not capture a real vocabulary divergence — they would *manufacture*
one, forcing the one glossary the team actually shares through the
harmonization dance it never needed, and moving upkeep off the designated
caregiver onto part-timers — Grudin's disparity in reverse
(`knowledge-management-theory.md` §4). The context map's discovery step
can read OWNERS and workspace manifests, but no signal in the tree can
distinguish "five teams" from "one team, five packages." This is the
strongest case-limiting fact for the *promotion* half of the proposal, and
it is why the base delta (§2.2–2.4) — where an unused context costs a
single null field and a single row in a map — should be the design's
center of gravity: tags tolerate error, placements amplify it.

---

## 4. The honest maximum

The case FOR first-class support is strongest where the alternative is
least defensible: the scaffold currently *falsifies* multi-domain
meaning (§1.1), *destroys* provenance its own sessions carry (§1.4), and
*violates its own settled ruling* on tailored context (§1.5); and at
least for the pieces the ecosystem actually manages per package, it
*contradicts released, dominant tooling* (§1.2). The least machinery that
fixes all four is a context map, one record field, a one-sentence
resolution rule, and manifest-driven discovery — no new record locations
required. Everything beyond that (per-package files) earns its way on
warrant in the precedent order, and the deepest promotions are the ones
precedent least supports and boundaries most likely falsify —
consequently the hardest to obtain. Against the skeptic's best cards —
one-truth simplicity, attention cost, the tracker/glossary precedent gap,
OpenCode's repo-shaped identity — the brief survives on the tag-and-key
floor but not an inch past the promotion ladder without the user's own
ruling. That is the case: first-class scoping as cheap, default-off,
discovery-fed infrastructure; scaffold multiplication never.