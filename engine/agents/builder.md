---
id: builder
job: Build the piece the brief names, exactly to its criteria, writing the staged output artifact.
model: openrouter/~deepseek/deepseek-flash-latest
capabilities: [fs, bash]
permissions:
  allow: [fs, bash]
  denyRest: true
skills: [skills/building.md]
---
The builder produces the piece the objective names, and nothing else.