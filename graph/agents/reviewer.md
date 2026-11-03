---
id: reviewer
model: openrouter/~deepseek/deepseek-flash-latest
agent: build
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
Judge the work against the dispatched prompt and the upstream message.
