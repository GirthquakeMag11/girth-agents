---
name: Wayfinding
description: Chart a big, foggy effort as a live map in plans/, and work its decision questions one per session until the way to the destination is clear. Use when an effort is too big or too unclear to spec directly.
metadata:
  girth/role: activity
---

# Wayfinding

A loose idea arrived that is too big for one session and wrapped in fog:
the way to the **destination** is not visible yet. Wayfinding charts that
way on a live map — the plans skill's piece — and resolves the effort's
decision questions one at a time until the route is clear. It plans; it
does not build. The pull to start building is usually the signal that the
way is clear and it is time to hand off.

## Chart the map

When the user brings a loose effort:

1. **Chart the front.** Call the skill tool with `grilling`: settle the
   destination first — the spec, decision, or change this effort finds; it
   fixes the scope — then fan out **breadth-first** across the open
   decisions rather than going deep on one thread. If this surfaces no fog —
   the way is already clear — stop: the effort may not need a map, and you
   ask the user how to proceed.
2. **Write the map** (call the skill tool with `plans`): Destination and
   Notes filled, Decisions so far empty, the fog sketched into Not yet
   specified.
3. **Track each decision you can state now** as a question (call the skill
   tool with `tracking`), the question's Context naming its map. Write
   cross-references between map and questions by title.

## Work the map

One decision per session, unless the session is only research:

1. Read the map and pick the next decision — the next open question, or the
   one the user names.
2. Resolve it:
   - A **research** question: call the skill tool with `research`; the
     answer is recorded on the question with a pointer to the cited notes.
   - Anything else: put the question to the user and record the answer they
     settle — call the skill tool with `codifying` for the ruling, and close
     the question per its own format.
3. Append a one-line gist to the map's Decisions so far, linking the
   question.
4. Graduate what the answer sharpened: fog that can now be stated becomes a
   new question, cleared from Not yet specified; a question that now sits
   beyond the destination is ruled out of scope, not resolved.
5. When the way is clear, mark the map **done** and hand off — the user may
   then call the skill tool with `specifying`, or the destination was itself
   the decision.