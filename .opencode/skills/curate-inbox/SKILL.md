---
name: Curate Inbox
description: Open the user's inbox: walk the repository for tracker items and stray calls for attention, present them one at a time, record each answer, route — never start — the work answers reveal. Use when the user opens their inbox or wants their open items processed.
---

# Curate Inbox

Walk the repository as the user's inbox: collect everything calling for
their attention, present the items one at a time, record each response
where it belongs, and route the work each answer reveals. The loop
curates, records, and routes — it never executes. Working on the revealed
material is not the inbox; that begins after the inbox closes.

## Before collecting

Read `conventions/` for any ruling that extends or modifies this process —
sources to add, ordering, closing rules. A convention overrides this
skill's defaults.

## Collecting

1. Walk the tracker, questions first: `QUESTIONS.md`, then `HAZARDS.md`,
   `BUGS.md`, `DEFECTS.md`, `FEATURES.md`. Call the skill tool with
   `tracking` as needed for the kinds and their entry shapes.
2. Then the detritus: anywhere in the repository that calls for the
   user's attention — notes and reminders in documents, code comments,
   TODOs addressed to them.
3. Formalize each stray before it is presented. Classify it by kind and
   record it in the tracker — call the skill tool with `tracking`, which
   covers the boundaries and extending an entry that already matches. The
   docket is a view of the tracker; no item lives only in the chat.
4. If `tracker/` is missing, say so and recommend bootstrapping it; on
   confirmation, call the skill tool with `bootstrapping` to create it —
   then formalize and present.

For this loop, `tracking`'s act-now branch is suspended: everything found
is routed and recorded; execution starts only after the close, or on the
user's word after the close-check.

## The docket

Present the collected items as one numbered list — source, kind, and what
it wants from the user. Questions first. This list is the map for the
session.

## Processing, one at a time

Take the next item and present it in full: where it lives, what it needs,
and for a question, the recorded provisional decision — which doubles as
the recommended answer: "We went with X; keep it?"

- Record the user's response on the item's entry, per its kind. An
  answered question closes the tracker's way: `Answered — <YYYY-MM-DD>:`
  and `Follow-up:`, per `tracking`'s questions reference.
- When an answer settles a term, a convention, or a decision, call the
  skill tool with `codifying` so it lands in the project's records, not
  just in the tracker.
- When an answer lands on a provisional decision, re-check the work built
  on it and record the follow-through, per `tracking`'s format.
- An item can open a longer give-and-take; `grilling` is the interview
  skill for working one properly.

## When an answer reveals work

An answer can unblock, trigger, or imply work. The curating agent does
**none** of it while the loop runs:

- **Route it** — classify the work via `tracking` by kind, and record it,
  so nothing is lost.
- **Propose it** — state the work and its path (this becomes a feature, so
  a spec comes first; this is a bug, so one ticket), and that it waits for
  the inbox.
- **Continue the loop** — the item settles; the next one comes.

## When the user closes the inbox

With `/close-inbox` or a plain instruction: finish recording the item in
flight, run the wrap summary — resolved, still open, and the work the
answers surfaced — confirm the remainder is recorded in the tracker, then
**offer** to begin execution — the project's systems first:
`implementing`'s route-by-kind, and any convention ruling that defines
the execution hand-off takes precedence. Nothing begins without the
user's word.

## The drift guard

The loop has one shape — curate, present, record, route. Working on
revealed work, or any steering away from the docket, is not the loop:
confirm "close the inbox?" before switching; otherwise bring the session
back to the flow. A look the answer itself invites — reading the affected
file to sharpen the record — is still curating; reading is not building.

## Related skills

- tracking — the item kinds, their entries, and classifying what the
  answers reveal.
- codifying — where settled terms, rulings, and decisions land.
- bootstrapping — creating the tracker when it is missing.
- implementing — the execution path for surfaced work, once the inbox
  closes.
- grilling — the interview when one item needs working through.