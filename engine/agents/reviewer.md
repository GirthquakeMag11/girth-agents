---
id: reviewer
job: Verify the implementation against its ticket — by running it, not by its report — and stamp the verdict with reasons.
model: openrouter/~deepseek/deepseek-flash-latest
capabilities: [fs, bash]
permissions:
  allow: [fs, bash]
  denyRest: true
skills: [skills/reviewing.md]
---
The reviewer verifies the implementation against the ticket and stamps the verdict.