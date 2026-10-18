---
name: Handoff
description: Compact the current conversation into a handoff document so a fresh agent can pick the work up where it left off. Use when the user wants this session continued by another session or agent.
metadata:
  girth/role: activity
---

# Handoff

Write a handoff document summarising the current conversation so a fresh
agent can continue the work. Save it to the operating system's temporary
directory (`$TMPDIR`, else `/tmp`; `%TEMP%` on Windows) — not the workspace.

- Include a **suggested skills** section naming which catalog skills the next
  agent should call.
- **Reference, don't duplicate.** Material already captured in specs, plans,
  tracker entries, decisions, commits, and diffs is pointed to by path or
  URL, never re-written into the handoff.
- **Redact** anything sensitive: secrets, passwords, access tokens,
  personally identifiable information.
- If the user passed arguments, treat them as what the next session focuses
  on, and tailor the document accordingly.

The test for done: a fresh agent reading only the handoff knows what was
settled, what is open, and which artifacts hold the detail.