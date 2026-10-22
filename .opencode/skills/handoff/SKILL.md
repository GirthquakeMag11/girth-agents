---
name: Handoff
description: Carry a session's context across agents — write and sweep HANDOFF.md, resume and consume it at pickup, keep it free of stale context. Use when handing work off, picking it up, or checking a handoff for freshness.
---

# Handoff

Carry a session's context from one agent to the next through one
document: HANDOFF.md at the repository root, committed after every
change. When a session hands its work over, extend the document with what
the next agent needs. When one picks the work up, work the document and
consume it as it goes stale. The point of both is the same: no reader
should inherit context that is no longer true or no longer important.

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
   session extends the document; it never starts a second one.
3. **Redact.** Strip anything sensitive — secrets, passwords, access
   tokens, personally identifiable information — before it is written.
4. **Write.** Extend the document per the format: settled claims under
   Context, what remains to do under Open work, one unit per line.
   Reference — don't duplicate — material already captured in specs,
   plans, the tracker, decisions, commits, and diffs: point to it.
5. **Commit.** One commit for the sweep and the write:
   `docs(handoff): record <slug>`, the session's short name as the slug.
   Skip this step where the project's conventions say the handoff is not
   committed.

Done when a fresh agent reading only the handoff knows what was settled,
what is open, and which artifacts hold the detail.