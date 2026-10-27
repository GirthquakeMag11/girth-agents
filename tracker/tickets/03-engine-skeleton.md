# 03: The engine's skeleton — watching, never sleeping, one step at a time

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 01 (plugin skeleton and channel)

## What it delivers

The always-awake engine exists as a real loop inside the plugin: it
watches its started projects continuously, holds a per-project queue,
and runs one serial step at a time — writers wait, passive watching
never sleeps. At this ticket's close the engine can see, queue, and
execute a no-op demonstration step end to end, and its state
transitions are recorded in the records, never in a separate store.

## Acceptance criteria

- [ ] The engine runs inside the plugin's lifetime, surviving across sessions, observing its watched projects.
- [ ] One step runs at a time per project; a second queued step waits and then runs.
- [ ] Step state transitions are recorded in the records themselves — the ledger, not a side store.
- [ ] A demonstration step can be queued by a harness and observed completing.