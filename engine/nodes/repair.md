---
id: repair
type: task
helper: builder
artifact: work/implementation.json
budgetMs: 600000
resume: implement
maxVisits: 3
objective: Repair the implementation per the reviewer's report and update the report artifact in place.
out:
  - to: review
  - to: bounce
    exhausted: true
---