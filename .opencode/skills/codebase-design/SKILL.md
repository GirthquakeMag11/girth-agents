---
name: Codebase Design
description: The shared vocabulary and principles for designing deep modules — module, interface, seam, depth, adapter, leverage, locality — and where a seam belongs. Use when designing or improving a module's interface, deciding where to test, or judging whether code is deep or shallow.
---

# Codebase Design

Design **deep modules**: a lot of behavior behind a small interface, placed
at a clean seam, testable through that interface. The aim is leverage for
callers, locality for maintainers, testability for everyone.

## Glossary

Use these terms exactly. Consistent language is the whole point.

**Module**: anything with an interface and an implementation. Deliberately
scale-agnostic: a function, class, package, or tier-spanning slice. _Avoid_:
unit, component, service.

**Interface**: everything a caller must know to use the module correctly —
the type signature, but also invariants, ordering constraints, error modes,
required configuration, performance characteristics. _Avoid_: API, signature
(too narrow).

**Implementation**: what's inside a module, its body of code. Distinct from
**adapter**: a thing can be a small adapter with a large implementation (a
database repo) or the reverse (an in-memory fake). Say "adapter" when the
seam is the topic.

**Depth**: leverage at the interface — behavior a caller can exercise per
unit of interface they must learn. A module is **deep** when much sits behind
a small interface, **shallow** when the interface is nearly as complex as
the implementation.

**Seam** _(Michael Feathers)_: a place where you can alter behavior without
editing in that place; the location at which a module's interface lives. Where
to put the seam is a design decision distinct from what sits behind it.
_Avoid_: boundary (overloaded with DDD's bounded context).

**Adapter**: a concrete thing that satisfies an interface at a seam. Describes
*role* (what slot it fills), not substance.

**Leverage**: what callers get from depth — more capability per unit of
interface learned. One implementation pays back across N call sites and M
tests.

**Locality**: what maintainers get from depth — change, bugs, knowledge, and
verification concentrate in one place. Fix once, fixed everywhere.

## Deep vs shallow

Ask, when designing an interface: can I reduce the number of methods? Can I
simplify the parameters? Can I hide more complexity inside? A deep module has
a small interface and a large implementation; a shallow one near-inverts them.

## Principles

- **Depth is a property of the interface, not the implementation.** A deep
  module may be internally composed of small, swappable parts that are not
  part of its interface. A module can have **internal seams** (private, used
  by its own tests) as well as the external seam at its interface.
- **The deletion test.** Imagine deleting the module. If complexity vanishes,
  it was a pass-through. If it reappears across N callers, it earned its
  keep.
- **The interface is the test surface.** Callers and tests cross the same
  seam. Wanting to test *past* the interface means the module is probably
  the wrong shape.
- **One adapter means a hypothetical seam; two make it real.** Don't
  introduce a seam unless something actually varies across it.

## Designing for testability

1. **Accept dependencies, don't create them** — pass the payment gateway in
   rather than constructing it inside.
2. **Return results, don't produce side effects** — `calculateDiscount(cart)`
   over `applyDiscount(cart)`.
3. **Small surface area** — fewer methods and params mean fewer and simpler
   tests.

## Going deeper

- Performing a deepening — merging shallow modules into one deep module,
  given what the cluster depends on: read `references/deepening.md`.
- Exploring alternative interfaces for one candidate, instead of anchoring
  on the first design: read `references/design-it-twice.md`.

## Rejected framings

- Depth as implementation-lines-to-interface-lines: rewards padding. Use
  depth-as-leverage.
- "Interface" as the `interface` keyword or a class's public methods: too
  narrow; interface includes every fact a caller must know.
- "Boundary": overloaded with DDD. Say seam or interface.