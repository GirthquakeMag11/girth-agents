# The teaching lane retires

The `teaching` skill — a stateful, many-session tutor owning the
`education/` workspace — is judged not a fit for this skillset. The
catalog works a project: scaffolding, tracking, design, implementation,
releases. Teaching a person a skill over time is a different undertaking,
and the skill carried its own workspace, formats, and command for it.
It is removed, and the `/teach` command and the `education/` scaffold
piece retire with it.

Status: accepted

## Considered options

- Keep the skill — rejected: it is the only skill outside the
  project-work spine, and an off-spine skill is one described and loaded
  every turn for a lane that does not serve the catalog's purpose.
- Remove the skill but keep the `education/` scaffold piece — rejected:
  a piece bootstrapping creates must have an owning skill; with no owner
  it would be inert scaffolding the inventory offers for nothing.

## Consequences

- `.opencode/skills/teaching/` and the `/teach` command are gone.
- `education/` leaves the bootstrapping inventory; the number of skills
  owning a scaffold piece drops to six. `decisions/0003`, which counted
  seven and named `teaching` (education) among them, stands as the record
  of the time it described.
- Documents that carried the learning lane — the README's skills,
  commands, and working-loop tables, CONTRIBUTING's schema — drop its
  rows; the retired piece's formats travel in no skill.