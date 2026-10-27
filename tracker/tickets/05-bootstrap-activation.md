# 05: Bootstrap — activation, consent, and the schema gate

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 01 (plugin skeleton and channel), 04 (engine skeleton)

## What it delivers

`/bootstrap` becomes the engine's local activation on a machine, in a
directory: it states plainly what always-awake processing means before
it starts — the consent — and, once accepted, activates a now-eager,
programmatic, synchronous run that derives what it can and asks only
the whitelist (name, purpose, license when undeclared; the starting
version when nothing states one; the optional gh setup as an action,
credentials through gh, never stored separately). A declination is
recorded as a ruling — no pushes, no self-reports. A re-bootstrap of a
live project is a step of its own: waits, runs exclusively with the
user, and the engine resumes. The schema version checks on activation,
refusing an old-schema repo until its bootstrap runs.

## Acceptance criteria

- [ ] Bootstrap states the always-awake processing before activation, and only proceeds on acceptance.
- [ ] The eager run derives everything derivable; the whitelist alone reaches the user, synchronously.
- [ ] The optional gh setup takes credentials through gh; a declination records the ruling and disables pushes and self-reports.
- [ ] A re-bootstrap of a live project waits for the step in flight, runs exclusively, and the engine resumes.
- [ ] An old-schema repo is refused until its bootstrap migration runs.