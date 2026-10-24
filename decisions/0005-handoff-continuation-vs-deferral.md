# The handoff continues a session; the tracker defers work

The handoff's rolling maintenance — sweep on every read, extend in place,
freshness checked opportunistically — was observed carrying open work
alongside the tracker, splitting "what work is open right now" into two
answers, dividing each turn's attention, and leaving a document behind
that implied continuity where none existed. The corrected orientation:
the handoff is a free-form catch-all carrying a session's own continuation
across a gap; the tracker stays the system for deferred work; the two meet
by kind, never by automatic deposit; and the document comes into being
only when the user runs `/handoff`, staying until the pickup consumes it.
The staleness playbook runs inside the two doors, not as a third trigger.

Status: accepted

## Considered options

- A second governing spec re-orienting `specs/handoff-pickup.md`, sliced
  and implemented like the wizard redesign — rejected in favor of this
  record plus direct edits: the corrections are a few rulings, not a new
  design.
- Pickup deposits handoff cargo into the tracker ("transit and vault") —
  rejected: it moves work designated for a session into the "do
  eventually" pile and strips the handoff of its point; the tracker is
  for deferral, the handoff for continuation.
- A standing document, swept and extended continuously — rejected: it
  competes with the turn's work for attention and signals continuity a
  new session never asked for.
- A third, opportunistic freshness-check trigger — rejected: staleness
  handling belongs inside `/handoff`'s sweep-and-extend over an existing
  document and `/pickup`'s consumption, nowhere else.

## Consequences

- `specs/handoff-pickup.md` is superseded where it conflicts with this
  record — the standing-document framing, the extend-in-place chore, and
  the named freshness-check trigger; 0004's pointer to it is narrowed
  accordingly.
- The `handoff` skill's text states the corrected orientation — the two
  doors are its only triggers, and outside them a handoff is left alone —
  and the `tracking` skill gains the mirror line.
- The junction in one line: work already tracked is referenced, never
  copied; handoff cargo is worked through at pickup, never deposited;
  and an item that proves during continuation to be deferral takes the
  ordinary decide-now-or-record call.