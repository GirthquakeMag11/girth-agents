# Handoff and Pickup

*Superseded in part by `decisions/0005-handoff-continuation-vs-deferral.md`:*
*the document is written only when the user runs `/handoff` and stays until*
*`/pickup` consumes it; open work is session continuation, deferral remains*
*the tracker's; the freshness-check trigger is gone.*

## Problem Statement

When a session ends, `/handoff` writes a document so a fresh agent can
continue. But nothing governs that document after it is written. The next
agent re-reads context that has gone stale, with no protocol for consuming
what its own work has obsoleted; running `/handoff` again over an existing
document neither reaps what died nor repairs what outlived its facts. The
document also has no fixed home it travels with: it lands in the operating
system's temporary directory, cut off from the project whose state it
carries.

Context in a handoff goes bad in exactly two ways: it stops being true, or
it stops being important. The first outright misleads. The second is
subtler: a claim that no longer matters keeps its emphasis, and a reader
infers significance that was never there — which then breeds untrue
context in what that reader writes next. The project has a glossary, but
no shared word for any of these states, so no protocol can be written
cleanly against them.

## Solution

Handoff becomes a first-class, two-door lifecycle. A `handoff` skill owns
the machinery both doors share: a document format that separates
informational context from instructional tasks, each item a unit that can
be consumed on its own, and a consumption protocol that removes context
the moment it goes stale — until the document is fully consumed and
deleted. `/handoff` writes: it sweeps an existing un-consumed handoff
first, correcting or removing stale context, then adds the new session's
content. `/pickup` resumes: it locates the document, reads it, and works
it, consuming each unit as the work makes it stale. The document lives in
the project's repository by default — written in and committed — so it
travels with the code it describes; a project's conventions document can
say otherwise. The glossary gains the vocabulary: the two staleness axes,
consumed, and partially consumed.

## User Stories

1. As a person ending a session, I want the handoff written into my
   project's repository and committed, so the carry-over state lives beside
   the work it describes.
2. As a person whose project prefers different handling, I want an
   `On_Handoffs.md` conventions document to express where the handoff lives
   and whether it is committed, so the default never overrides a project's
   deliberate choice.
3. As a person starting a new session, I want one command that finds the
   handoff wherever the project's conventions put it and resumes the work,
   so I never re-explain state or paste paths.
4. As an agent picking up, I want each claim and task to stand alone as a
   consumable unit, so I can strike exactly the context my work obsoletes
   and nothing else.
5. As an agent picking up, I want context removed the moment it becomes
   stale, so no reader — including me, later — acts on something that is no
   longer true.
6. As an agent picking up, I want partially consumed context rewritten in
   place holding only its untouched, still-fresh parts, so the work that
   still matters survives while its consumed parts leave.
7. As an agent picking up, I want the document deleted once everything in
   it is consumed, so a finished handoff does not linger and mislead.
8. As a person running `/handoff` over an existing un-consumed handoff, I
   want the old document swept first — dead context removed or corrected —
   before new content is added, so one document remains the single source
   of carry-over truth.
9. As an agent sweeping or consuming, I want a fixed playbook for each
   staleness kind — untrue context corrected or removed, unimportant
   context replaced or removed — so these judgment calls do not drift from
   session to session.
10. As a fresh reader, I want informational context and instructional
    tasks kept apart in the document, so I know what to know versus what to
    do.
11. As an agent whose pickup cannot finish in one session, I want the
    document to remain holding only un-consumed context, so the next pickup
    starts clean.
12. As a project member browsing the repository history, I want the
    handoff committed by the acts that change it, so the history pairs
    each context removal with the work that made it stale.
13. As this project's maintainer, I want the glossary to name the
    staleness axes, consumed, and partially consumed, so every agent and
    document shares one vocabulary for context hygiene.

## Implementation Decisions

### The handoff skill is the machinery; the commands are the doors

The retired `handoff` skill returns — decision 0002's handoff half is
superseded — because the act now has machinery of its own: a document
format and a consumption protocol shared by two doors and reachable by
agents outside them. `/handoff` thins to calling the handoff skill's
write-and-sweep protocol; a new `/pickup` command calls the same skill's
pickup protocol. `retro` stays command-only, as today. The border ruling
from 0002 still stands in its substance — commands are the human's doors,
skills the machinery other things can reach — what changed is that handoff
now meets 0002's own test for a skill: distinct triggers of its own — a
write, a sweep, a pickup — and other things must reach it. When this spec
is approved, a decision record is written that
supersedes 0002's handoff half and points here.

The three surfaces carry fixed wording: the skill describes itself as
*"Carry a session's context across agents — write and sweep HANDOFF.md,
resume and consume it at pickup, keep it free of stale context. Use when
handing work off, picking it up, or checking a handoff for freshness."*
`/handoff` rewords to *"Write this conversation into the project's handoff
and commit it"*, its body exactly the call to the skill's write-and-sweep
protocol; `/pickup` reads *"Resume this project's handoff"*, its body the
call to the pickup protocol. The old redaction duty — strip secrets and
personal data before anything is written — carries over into the write
protocol.

### The handoff lives in the project's repository by default

The document is written into the project's repository and committed after
writing, unless the project's `On_Handoffs.md` conventions document says
otherwise. That document is the project's override: it can relocate the
handoff (for example back to the operating system's temporary directory,
today's behavior) and change whether and how it is committed. It expresses
no more than those two things: the format and the playbook are the
skill's, fixed for every project. The handoff skill reads it first and
obeys it; its absence means the default. Pickup locates the document the
same way — conventions first, default second — so both doors agree on
where the handoff is. Neither door accepts a path: the location comes
from the override or the default alone, never from the person. The
default itself is written into the skill only once: the repository root,
the filename `HANDOFF.md`.

### The document separates information from instruction; every item is a consumable unit

The format prescribes a state line, a context section of settled claims
one per line, and an open-work section of tasks one per line, each with an
open/done marker; the document also names the catalog skills the pickup
agent should call. Every claim and every task stands alone as a unit that
can be consumed on its own — the consumption protocol never has to
rewrite a paragraph to take one sentence out of it. The skeleton the skill
carries:

```markdown
# Handoff: <slug>

**From:** <one line — what this session carried over>
**Skills for the pickup:** <the catalog skills the next agent should call>

## Context

- <one settled claim per line>

## Open work

- [ ] <one task per line>
```

### Two staleness axes, one playbook

Context is stale when it is not or is no longer true and/or important —
meaning it requires modification or excision, per the glossary — and the
two axes are judged separately. What is no longer true is modified toward
something true or excised. What is no longer important is replaced with
something important or excised. Unimportant context is dangerous even when
still true: it implies emphasis where none belongs, a reader infers
significance that was never there, and that inference becomes further
untrue context. Every read of the document runs this playbook: the pickup
as it works, the sweep before a new write, and a bare freshness check —
the sweep with nothing to add, which is the third trigger the skill
names.

### Consumption is immediate and surgical

The pickup agent is the context consumer of whatever its actions render
stale, and it edits those units out at once — each excision rides in the
same commit as the work that made it stale — so the repository's history
pairs each context removal with the act that consumed it. Context made
stale by anyone else's action, or no one's, is treated the same way at the
next read: the pickup and the sweep both modify or excise what is stale,
whatever the cause. Consumed units are excised outright, never struck
through and left in place: the repository's history is the graveyard, and
a struck line left in the document is exactly the emphasis without
meaning this spec exists to remove. The protocol edits the document
during the work, never in a cleanup phase at the end, so a document
mid-pickup is already honest.

### Partially consumed context is rewritten in place, never struck whole

When work has consumed some parts of a unit while the rest stands
untouched and fresh — a task partly done, or one whose grounding moved on
some but not all of its claims — the consumed parts come out as they
happen, and the unit is rewritten in place to hold only what remains
untouched and fresh. A unit is struck whole only when no part of it still
deserves attention; while any part matters, the unit keeps its seat with
that part intact.

### Lifecycle end: deletion at full consumption

When the document holds nothing un-consumed, the pickup deletes it and
commits the deletion; the handoff is finished. Until then the document
persists: `/handoff` sweeps it, corrects and reaps it, and extends it in
place.

### The commit protocol

`/handoff` commits the document after writing — sweep and write land in one
commit — under `docs(handoff): record <slug>`, the session's short name as
the slug. A pickup's consumption edits ride in the commits of the work
that made them stale; an excision with no work of its own — staleness
from the passage of time or someone else's action — rides the excising
agent's next commit, and the deletion rides the pickup's final commit. A
project that commits nothing — the override case — simply leaves that step
out of play.

### The glossary gains the vocabulary

The glossary records five terms, settled here in wording; each says what
the thing is — the playbook of what an agent does about each state lives
in the skill. These are project-wide concepts, not handoff-only: the
founding example stands as given — someone reads a bug report and fixes
the bug; the report is consumed context, the fixer its consumer. No
entry names the handoff itself: its meaning follows the functionality it
carries, and a moving target defeats the glossary's stable-domain
purpose.

- **Fresh Context** — information and/or instruction that deserves
  attention because it is still true and important.
- **Stale Context** — information and/or instruction that requires
  modification or excision because it is not or is no longer true and/or
  important.
- **Consumed Context** — context that was previously fresh but was made
  stale as a consequence of the actions taken since it was fresh.
- **Context Consumer** — the entity that can be credited or blamed for a
  given piece of context being consumed.
- **Partially Consumed Context** — context that has separate parts, some
  consumed while others remain untouched and fresh.

## Testing Decisions

The catalog linter is the machine-check — a new skill and command must
pass it like everything else — but the protocol has no runtime, so its
tests are scenarios written as done-tests into the implementation
tickets: the staleness lattice (each combination of the two axes and its
prescribed edit), a pickup consuming a unit mid-work in the commit of the
work that obsoleted it, a partially-consumed unit rewritten to hold only
its untouched, still-fresh parts, the
deletion at full consumption, the sweep over an existing document, the
project override honored, and the default in-repo home written and
committed. A fresh-context reviewer then replays a scripted lifecycle
against the skill's text — write, sweep, consume, delete — before the
result is presented. The installer harness is unaffected: nothing in this
spec grows a shell surface.

Prior art is a new kind for this catalog: the installer spec tests a
shell script; this one tests a protocol embedded in Markdown, so the same
bar — deterministic, replayable, exit-code-true where a machine can run
— is met by the lint plus explicit scenarios rather than by a new
harness.

## Out of Scope

- Reviving `retro` as a skill; it stays in its command.
- Any automatic pickup: resuming stays human-triggered through `/pickup`.
- Multi-machine or cross-project routing; one handoff per project,
  discovered in the way the skill prescribes.
- Automated staleness detection: truth and importance are agent judgments
  under the playbook, never machine-measured.
- Changing where the questionnaire skill writes its own document; its line
  about `/handoff`'s home is rewritten to stay true, but questionnaires
  keep their own home.
- What girth-agents itself does with its own handoffs: that is a question
  of this project's conventions — settled there, not by this spec.

## Further Notes

- Decision 0002's handoff half is superseded here; the record is written
  at approval time and points to this spec.
- Touch points when implemented: the README's skill and command tables and
  the chains map (which gains a session-boundary pair), the questionnaire
  skill's line about the handoff's home, and the CHANGELOG through the
  normal release flow. (The `teaching` skill's `/handoff` pointer died
  with the skill itself — `decisions/0006`.)
- Under the standing versioning rules this lands as Added and Changed —
  minor-natured; the release and its number are the user's, at the usual
  time.