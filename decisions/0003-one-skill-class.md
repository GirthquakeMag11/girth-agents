# One class of skill

The owner/activity split is retired. Nine owner skills — each a shallow
module whose whole interface was a scaffold piece's format, reached by
call — fold into the activities that work those pieces, so every surviving
skill stands alone as one thing the agent does. The catalog drops from 30
skills to 21.

Status: accepted

## Considered options

- Keep the owner/activity split — rejected: owners never fired on their own
  trigger; they existed only to be called, while their descriptions were
  loaded into context every turn. Interface cost without leverage.
- Flatten with the formats duplicated across every writer — rejected: one
  home per meaning still holds; a piece's format lives in one skill's
  `references/`, and writers point to that skill.

## Consequences

- Skills live at `.opencode/skills/<id>/SKILL.md` — no group directories, no
  `metadata:` role field.
- Seven skills own scaffold pieces: `tracking` (tracker), `domain-modeling`
  (glossary), `codifying` (conventions and decisions), `maintaining-docs`
  (the four standard documents: AGENTS, CONTRIBUTING, README, and the
  changelog), `specifying` (specs),
  `wayfinding` (plans), `teaching` (education).
- `validate.mjs`, AGENTS.md, and CONTRIBUTING.md describe one class; a skill
  that owns a piece carries its creation template and formats in
  `references/`.
