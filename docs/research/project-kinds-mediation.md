# Mediation: project kinds — three positions, one convergence

Question and date: how should the system account for multiple contexts
(monorepo packages, distinct domains) — 2026-10-26.

Inputs: `project-kinds-case-single.md` (skeptic), `project-kinds-case-multiple.md`
(advocate), `mattpocock-skills-domain-modeling.md` (neutral ground truth),
plus `project-kinds-practice.md` and `project-locations-mechanics.md`.

## Where they agree

1. Every position requires exactly one repository-level record OF the
   contexts: mattpocock's `GLOSSARY-MAP.md` (root index of contexts and
   their inter-context relationships, unchanged since the skill's first
   commit), the skeptic's context-tagged absorption, the advocate's
   "one context-map record". Nobody argues for N disconnected stores
   with no root accounting.
2. The platform reality is conceded by all: one location = one project;
   nothing in OpenCode supports per-package project state. Per-package
   *placement* is therefore warrant-gated at best (the advocate says so
   outright: default-zero-cost).
3. The cross-context meaning problem is real and is made worse by our
   own settled rulings: the review gate certifies glossary use, so a
   flat one-definition-per-term file would actively certify collisions
   in a monorepo (ISO 704 treats same-object/different-concept as the
   normal case; domain-qualified entries are its remedy).
4. The union-blob concern is also real and self-inflicted: our
   role-shaped-context ruling forbids giving agents "excessive and
   diverse context", which is exactly what an un-scoped single store
   does to every reader.

## The synthesis those agreements force

- One root store — the tracker, glossary, inbox, reports live once per
  repository, at the root (platform lifecycle, one truth, one
  maintainer).
- A context-map record at the root declares the repository's contexts
  and their inter-context relationships — mattpocock's map, kept.
- Entries carry an optional `context:` field — domain-qualified senses
  per ISO 704 — so one store can hold genuinely distinct cross-context
  meanings without falsely unifying them and without fragmenting.
- Scoped reads: agents see the store filtered to their context, never
  the union blob — satisfying the role-shaped-context ruling.
- Physical per-package placement remains available on warrant only
  (a deviation, like every other deviation, recorded and approved).
- The advocate's one unabsorbed fact: monorepo release tooling
  (changesets, release-please manifest mode) scopes per-package
  CHANGELOGs by default — a tension with the scaffold's root changelog
  that the deviations rule handles case by case.

## The decision this leaves to the user

The store's shape: one root store with a context-map record, a
`context:` field, and scoped reads — versus mattpocock's literal shape
(N per-context glossaries under a root map) — versus a plain flat
root store with no context support.