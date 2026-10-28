---
id: repair
type: task
helper: builder
artifact: work/out.json
budgetMs: 600000
resume: build
maxVisits: 3
objective: Repair the output artifact per the reviewer's report and update it in place.
out:
  - to: grade
  - to: bounce
    exhausted: true
---