# Features

## Definition

A feature is something the user wants that does not exist yet. Its lifecycle
is user-gated:

- An entry exists because the user asked for it to be tracked.
- An entry closes only with the user's approval, one of two ways:
  implemented, or cancelled. Implementation alone does not close it.
- A cancellation records a durable reason: why the project will not do this,
  in terms that will still hold later — scope, a constraint, a decision.
  "Not now" is a deferral, and the entry stays open.

Features relate to each other: prerequisites, components, mutual exclusions,
and shapes beyond these. A relationship is recorded only once the user has
confirmed it.

## Entry

```markdown
## <One-line title> — <YYYY-MM-DD>

- **The feature:** <what is wanted and why>
- **References:** <paths to plans, specifications, or other documents —
  free-form, any number>
- **Related:** <entries this one depends on, composes, or excludes; only
  relationships the user has confirmed>
```

## Closing

```markdown
- **Closed — <YYYY-MM-DD>:** implemented
- **Closed — <YYYY-MM-DD>:** cancelled — <the durable reason>
```