# Owner/activity schema for skills

Status: superseded by 0003

The catalog's skills split into **owners** — one per scaffold piece, each
defining that piece and calling no other skill — and **activities**, work
processes that own nothing. Decided when the flat one-skill-per-idea layout
stopped scaling: every added skill re-stated formats other skills had
already defined. Each meaning now lives in exactly one home.

## Considered options

- Flat skills, one per idea — rejected: formats drifted between the skills
  that write the same piece.
- mattpocock's engineering/productivity buckets — rejected: the set's real
  shape is memory pieces plus work processes, which the owner/activity axis
  names directly.

## Consequences

- Skills live under `.opencode/skills/{owners,activities}/`; the skill ID is
  the leaf directory name, so leaf names stay globally unique.
- A new scaffold piece needs an owner, template included, before any
  activity writes it.
