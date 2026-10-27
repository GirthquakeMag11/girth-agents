# 10: Criteria compilation and the typed report shapes

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 09 (review gate core)

## What it delivers

The checklist is compiled mechanically for every later stage: the
compiler reads the reviewed upstream artifact and extracts its
decision-bearing lines, each criterion carrying its source pointer —
for the plan, the reviewer reads the session's recorded rulings plus
the project records. The checklist rides the review and is stored with
its report. The report's typed shape is fixed: the verdict, its
checklist reference, the per-criterion findings, and the repair
pointer. The brief is compiled at dispatch from the records — never
stored separately — carrying the project, the stage, the source
artifact, the scoped context, the task, and the boundary.

## Acceptance criteria

- [ ] A spec-stage review receives a checklist whose every criterion cites its source in the upstream artifact.
- [ ] A plan-stage review receives a checklist built from the session's recorded rulings and the project records.
- [ ] Every report carries the four typed fields, and its checklist is stored with it.
- [ ] Every dispatch carries a compiled brief; no brief is ever stored as a separate record.