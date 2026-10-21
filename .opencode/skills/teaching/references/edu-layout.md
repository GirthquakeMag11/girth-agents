# Education

## Purpose

`education/`, at the project root, is the state of one learner's continuous
education: a workspace where a real skill is taught across many sessions,
with memory between them. It answers *what is being learned, why, what is
already known, and what has been taught*. Its creation template is
`references/edu-template.md`.

One workspace, one mission. A second, unrelated topic is a second workspace,
not a second mission file.

## What belongs

- `MISSION.md` — the reason the learner is doing this: a concrete goal,
  what success looks like, constraints, and out of scope. The compass every
  teaching decision traces back to. See `references/edu-mission-format.md`.
- `RESOURCES.md` — the curated, annotated shelf of trusted sources, split
  into knowledge and wisdom; gaps written out, weak sources pruned. See
  `references/edu-resources-format.md`.
- `GLOSSARY.md` — the learner's own language for the topic: one canonical
  term per concept, added only once the learner genuinely understands it.
  See `references/edu-glossary-format.md`.
- `reference/` — compressed cheat-sheet documents; the things the learner
  returns to long after the lessons are done.
- `lessons/` — the primary output: one self-contained lesson per file,
  numbered `NNNN-<slug>.html`. See `references/edu-lesson-format.md`.
- `learning-records/` — small numbered records of what is now known:
  understanding demonstrated, prior knowledge disclosed, misconceptions
  corrected, mission shifts. See `references/edu-learning-record-format.md`.
- `assets/` — reusable lesson components: stylesheets, quiz widgets,
  simulators; existing components are reused before new ones are written.
- `NOTES.md` — the learner's preferences and working notes.

Everything is created lazily: the workspace starts near-empty and grows as
the sessions happen.

## Format

Each file follows its reference above. Learning records and lessons are
numbered in sequence from `0001`. The workspace's glossary governs the
language of every lesson, exercise, and record.

## Changing it

- The mission is the compass, not a contract: when the learner's goal
  moves, `MISSION.md` is revised, never left stale.
- Learning records are history: superseded, not deleted.
- Resources are pruned ruthlessly: five sharp sources beat thirty mediocre
  ones.
- Lessons are rarely revisited later; reference documents are — they carry
  the compressed essence.
