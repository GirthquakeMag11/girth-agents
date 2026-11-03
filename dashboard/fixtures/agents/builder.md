---
id: builder
model: openrouter/~deepseek/deepseek-flash-latest
mounts: [graph]
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
Execute the node objective, then call the generated handoff tool exactly once with a message.
