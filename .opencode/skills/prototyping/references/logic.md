# Logic prototype

A single, self-contained HTML file that lets anyone drive a state model by
clicking buttons. Use it when the question is about business logic, state
transitions, or data shape. One file, nothing to install, so a non-developer
can feel the model themselves — every label in **domain language**, not code.

## State the question

Write down the state model and the question, in one visible paragraph at the
top of the demo. A logic prototype answering the wrong question is pure
waste.

## Isolate the logic

Put the logic — the bit answering the question — in a small, pure module
that could lift straight into the real codebase later. Pick the shape that
fits the question, not the page: a pure reducer, an explicit state machine, a
set of pure functions over a plain type, or a class with a clear method
surface. Keep it pure: no DOM, no button handlers reaching inside. The page
calls it; nothing flows the other way.

## Build the shareable HTML

Plain HTML/CSS/JS, everything inline, opens by double-click. Top to bottom:

1. **Title and one-line explanation** — the question.
2. **Current state** — a readable labelled panel, re-rendered after every
   click, calling out what just changed.
3. **Free-play buttons** — one per action, always available, any order.
4. **Guided walkthroughs** — scenarios, one per tab: a plain-language
   description then the ordered buttons to press, each a real button that
   advances the scenario from a known initial state. Pick the awkward cases.

Restrained and beautiful: clean typography, generous spacing, one accent.
No animations.

## Hand it over, then capture

They click through; the interesting feedback is "that shouldn't be possible"
and "I assumed X" — those are bugs in the *idea*. Once answered: the
validated logic lifts into the real module, and the HTML shell rides along to
the throwaway branch that keeps the prototype as the evidence behind the verdict.

## Anti-patterns

No tests; no real database; no generalisation; never blur the logic and the
page together; no framework, bundler, or server; never ship the HTML shell
to production.