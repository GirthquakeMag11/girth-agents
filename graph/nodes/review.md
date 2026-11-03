---
agent: reviewer
objective: Review the implementation against the dispatched prompt.
maxVisits: 20
handoff:
  mode: conditional
  labels:
    - label: pass
      to: done
      description: The work meets the objective; finish.
    - label: fail
      to: implement
      description: Name exactly what must change.
      resume: true
---

Judge the implementation against the dispatched prompt and the upstream
handoff message.