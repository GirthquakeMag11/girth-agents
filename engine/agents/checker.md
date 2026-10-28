---
id: checker
job: Grade finished work against its criteria and stamp the verdict.
model: openrouter/~deepseek/deepseek-flash-latest
capabilities: [fs]
permissions:
  allow: [fs]
  denyRest: true
skills: [skills/grading.md]
---
The checker grades finished work against its criteria and stamps the verdict.