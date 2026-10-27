# 14: The inbox's machinery — messages, seeded sessions, replies

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 04 (engine skeleton), 07 (six helpers defined), 11 (tracker kinds)

## What it delivers

The inbox exists as the system's asynchronous send-and-receive channel
to the user — never a view over the tracker. Its message record is one
file in the scaffold, one entry per sent request: its kind, its
referenced tracker entry, its status, and the reply once recorded —
referencing the entry, never copying it. A warranted item opens a
seeded conversation with the answerer, whose recorded reply lands on
the inbox message and closes the referenced tracker question. Replies
join the serial order; abandoned sessions are inert. An
information-kind question is worked by the fact-finder and reaches the
user only when the finding-out failed and that failure is not itself
the answer; an authority question reaches the user, period.

## Acceptance criteria

- [ ] Sending a request writes one message entry referencing its tracker entry.
- [ ] Opening an item seeds the answerer's session with the question; the recorded reply lands on the message and closes the question.
- [ ] Replies join the serial order — nothing writes at once.
- [ ] An abandoned opened item stays waiting; nothing expires or re-asks.
- [ ] Information kinds route to the fact-finder first; the failed-finding path reaches the user exactly as ruled.