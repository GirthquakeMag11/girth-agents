---
name: Prototyping
description: Build throwaway code that answers a design question — a shareable state-machine demo for "does this logic feel right," or switchable UI variations for "what should this look like". Use when a design question needs making concrete to answer it.
---

# Prototyping

A prototype is **throwaway code that answers a question**; the question
decides the shape. Identify which question is being asked, from the user's
prompt and the surrounding code, or by asking if the user is around:

- "Does this logic or state model feel right?" → read `references/logic.md`
  and build a single shareable HTML state-machine demo.
- "What should this look like?" → read `references/ui.md` and build several
  radically different, switchable UI variations.

The two branches produce very different artifacts: getting the branch wrong
wastes the whole prototype. If the question is genuinely ambiguous and the
user is unreachable, default to whichever branch matches the surrounding
code, and state the assumption at the top of the prototype.

## Rules both branches share

1. **Throwaway from day one, and marked as such.** Locate it close to where
   it would live, named so a casual reader sees it is a prototype.
2. **Trivial to run.** One command from the project's task runner, or a file
   that opens by double-click.
3. **No persistence by default.** State in memory, or a scratch store with a
   clear "PROTOTYPE — wipe me" name.
4. **Skip the polish.** No tests, no error handling beyond runnable, no
   abstractions. The point is to learn something fast.
5. **Surface the state.** After every action, show the full relevant state so
   the user sees what changed.
6. **Capture when done.** A decision the prototype validated is recorded by
   calling the skill tool with `codifying`, once the user settles it. The
   prototype itself is committed to a throwaway branch, out of main, as
   the evidence behind the verdict — and the *verdict* (the answer, and the question it
   settled) is captured with it.

## Related skills

- codifying — where a validated decision is recorded.
- wayfinding — a decision question the prototype makes concrete.