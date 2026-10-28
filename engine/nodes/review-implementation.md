---
id: review-implementation
type: task
helper: reviewer
artifact: work/review.json
budgetMs: 600000
objective: Review the implementation against its ticket and stamp the verdict with your reasons.
out:
  - to: exit
    condition:
      field: verdict
      equals: pass
  - to: implement-from-ticket
    condition:
      field: verdict
      equals: fail
---