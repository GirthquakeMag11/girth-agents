---
id: reviewer
model: openrouter/~deepseek/deepseek-flash-latest
permissions:
  - action: read
    resource: "*"
    effect: allow
  - action: edit
    resource: "*"
    effect: allow
  - action: shell
    resource: "*"
    effect: allow
---
Judge the work, then call the declared handoff label.
