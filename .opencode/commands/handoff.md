---
description: Hand this conversation off to a fresh agent
---

Write a handoff document summarising this conversation so a fresh agent can
continue the work. Save it to the operating system's temporary directory
(`$TMPDIR`, else `/tmp`; `%TEMP%` on Windows) — not the workspace. Any text
below this is my direction for the next session, such as what it should
focus on; tailor the document accordingly.

- Include a **suggested skills** section naming which catalog skills the
  next agent should call.
- **Reference, don't duplicate.** Material already captured in specs, plans,
  tracker entries, decisions, commits, and diffs is pointed to by path or
  URL, never re-written into the handoff.
- **Redact** anything sensitive: secrets, passwords, access tokens,
  personally identifiable information.

The test for done: a fresh agent reading only the handoff knows what was
settled, what is open, and which artifacts hold the detail.