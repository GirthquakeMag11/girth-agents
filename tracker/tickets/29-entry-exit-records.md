# 29: Entry and exit nodes commit the seam's records

**Parent:** specs/engine.md

**Kind:** feature

**Blocked by:** 26 (the watcher that hands claimed inputs in), 25 (the executor that routes them)

## What it delivers

The seam made real: an exit node commits its typed record — a question
or a defect, per kind — stamped awaiting-answer or awaiting-attention,
and the chain terminates there, notice included. An entry node is where
claimed input comes in: the entry node config, not the plugin, judges
whether the claimed file is a valid entry point, and a malformed or
invalid claim is rejected loudly as a defect. An answering record
arriving later re-enters through an entry node and resumes the chain
nothing else stalled. A defect report bound for the plugin's own
repository waits as an exit record until consent is given.

## Acceptance criteria

- [ ] A node's output condition routing outward produces exactly the typed record with the right awaiting stamp, the chain halts, and the exit-committed notice fires
- [ ] A claimed file valid per the entry node's config enters the graph; an invalid claim is a loud defect, never silently adopted
- [ ] An answer record re-enters through an entry node and resumes only the chain it belongs to
- [ ] A report that needs user consent exists as an exit record and sends only after consent, which is always declinable