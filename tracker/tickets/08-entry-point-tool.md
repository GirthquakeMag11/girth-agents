# 08: The entry-point tool — the plan's one door

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 04 (engine skeleton)

## What it delivers

The entry-point tool is the clearance act, and it accepts exactly one
thing: the plan. It parses the file pointed at it, validates the user's
recorded, dated confirmation marker inside the plan — no marker, loud
rejection — and, on success, tells the engine the file is now
touchable and queued. A tool run that dies loses nothing: the marker
survives and the tool re-runs. Everything downstream of the plan stays
inside the engine and never crosses this tool. A tool run that dies loses nothing: the marker
survives and the tool re-runs. Everything downstream of the plan stays
inside the engine and never crosses this tool.

## Acceptance criteria

- [ ] A plan with its dated confirmation marker is accepted and queued.
- [ ] A file without the marker — or anything that is not a plan — is rejected loudly.
- [ ] A failed run leaves the plan untouched and re-runnable.
- [ ] The engine treats only tool-accepted files as cleared inputs.