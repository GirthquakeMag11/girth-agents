---
name: Handoff
description: Carry a session's context across the gap between sessions — write and sweep HANDOFF.md when handing work off, consume it to nothing when picking it up, and leave it alone between the two. Use when the user hands work off or picks it up.
---

# Handoff

Carry a session's context across the gap between sessions through one
document: HANDOFF.md at the repository root, committed when it changes.
The document comes into being only when the hand-off door is opened, and
it lives until the pickup consumes all of it — then it is deleted. The
point of both acts is the same: no reader should inherit context that is
no longer true or no longer important.

The handoff is not the system for deferring work — the tracker is. It
carries the continuing session's own work across the gap: work already
tracked is referenced, never copied; the pickup works handoff cargo
through, never deposits it into the tracker; and an item that proves
during that continuation to be deferral takes the ordinary
decide-now-or-record call.

## Where the handoff lives

The project's `On_Handoffs.md` conventions document may express exactly
two things: where the document lives, and whether and how it is
committed. Read it first and obey it. Its absence means the default:
`HANDOFF.md` at the repository root, committed. Neither `/handoff` nor
`/pickup` takes a path — the location comes from the override or the
default alone.

## The document's format

Every line is one consumable unit — a claim or a task that can be edited
out on its own, so consumption never rewrites a paragraph to take one
sentence out of it.

```markdown
# Handoff: <slug>

**From:** <one line — what this session carried over>
**Skills for the pickup:** <the catalog skills the next agent should call>

## Context

- <one settled claim per line>

## Open work

- [ ] <one task per line>
```

## The staleness playbook

Context is stale when it is not or is no longer true and/or important.
The two axes are judged separately, one answer each:

- **No longer true** — modify the line toward something true, or excise it.
- **No longer important** — replace it with something important, or
  excise it.

Unimportant context is dangerous even when still true: it implies
emphasis where none belongs, a reader infers significance that was never
there, and that inference becomes further untrue context. Every read of
the document runs this playbook. Consumed units are excised outright,
never struck through and left in place: the repository's history is the
graveyard.

## Write-and-sweep protocol

The `/handoff` command starts here; this protocol is the machinery.

1. **Locate the document.** Read the project's `On_Handoffs.md` first and
   obey it. Otherwise: `HANDOFF.md` at the repository root.
2. **Sweep the existing document.** If one is already there, run the
   staleness playbook over every line before writing anything: still true
   and still important → keep; stale → modify or excise, now. A new
   session extends the document; it never starts a second one. This
   protocol runs because the door was opened; between the doors, the
   document is left alone.
3. **Redact.** Strip anything sensitive — secrets, passwords, access
   tokens, personally identifiable information — before it is written.
4. **Write.** Extend the document per the format: settled claims under
   Context, what remains to do under Open work, one unit per line.
   Reference — don't duplicate — material already captured in specs,
   plans, the tracker, decisions, commits, and diffs: point to it. Open
   work here is the session's own continuation, not the tracker's
   backlog; anything that is deferral belongs in the tracker, not
   carried here.
5. **Commit.** One commit for the sweep and the write:
   `docs(handoff): record <slug>`, the session's short name as the slug.
   Skip this step where the project's conventions say the handoff is not
   committed.

Done when a fresh agent reading only the handoff knows what was settled,
what is open, and which artifacts hold the detail.

## Pickup protocol

The `/pickup` command starts here; this protocol is the machinery.

1. **Locate the document** as in the write protocol: the project's
   `On_Handoffs.md` first, else `HANDOFF.md` at the repository root. No
   document anywhere → report that there is nothing to pick up, and stop.
2. **Read it.** The Context section says what is settled; the Open work
   section says what remains; the `Skills for the pickup:` line names the
   catalog skills to call. Call them.
3. **Work, consuming as you go.** You are the context consumer of
   whatever your actions render stale. The moment your work makes a claim
   or task no longer true or no longer important, excise that line — in
   the same commit as the work that consumed it, never struck through and
   left behind. Context made stale by anyone else's action, or no one's,
   is treated the same at the next read: modify or excise it anyway. The
   Open work tasks are the session's continuation, not backlog: work them
   through — do not deposit them into the tracker. An item is recorded
   there only when, during the work, it proves to be deferral — the
   ordinary decide-now-or-record call — and that recording is a decision
   made item by item, never the pickup's first act.
4. **Rewrite what is only partly consumed.** When work has consumed some
   parts of a unit while the rest stands untouched and fresh, rewrite the
   line in place to hold only what remains — never strike the whole line
   while any part of it still deserves attention.
5. **Delete at full consumption.** When nothing un-consumed remains,
   delete the document and commit the deletion; the handoff is finished.
   A settled claim still standing when the work finishes is excised with
   the deletion — a finished handoff does not linger, and the repository
   the document lived in keeps the record of it.

Between the two doors the document is left alone: staleness is handled
when the hand-off sweeps it and when the pickup works it, nowhere else.