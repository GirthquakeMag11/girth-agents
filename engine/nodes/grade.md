---
id: grade
type: task
helper: checker
artifact: work/verdict.json
budgetMs: 600000
objective: Grade the output artifact against its criteria and stamp the verdict with your reasons.
out:
  - to: out-done
    condition:
      field: verdict
      equals: pass
  - to: repair
    condition:
      field: verdict
      equals: fail
---