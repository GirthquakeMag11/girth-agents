# PR body format

<!-- Adapted from the show-me skill by Dex Horthy, Humanlayer;
     see the repo's THIRD_PARTY_NOTICES.md. -->

Use this shape for the body of a pull request, in the glossary's terms, prose
kept brief.

```markdown
## Summary

<the smallest visual that makes the change clear: pseudocode, a call tree, a
component or file tree, Mermaid, or a diff — matched to what changes>

## Evidence

- **Before:** <screenshot, failing test run, console output>
- **After:** <screenshot, passing test run, console output>

## Merge Danger

**Door:** <one-way or two-way>

**Blast Radius:** <what this change could touch: layout shift, consumer
breakage, a shared schema>
```

## Summary

Pick the smallest view that makes the key point clear: logic as pseudocode,
runtime control flow as a call tree, UI as a component tree with the state
and module boundaries that matter, file responsibility as a shallow tree,
interaction or data flow as a Mermaid diagram, or a diff when the point is
what changes. Place each visual next to the short text it supports, and keep
only the pieces needed to answer the reader's question.

## Evidence

Concrete evidence that the change works, before and after. Screenshots where
visual; otherwise the exact test that failed before and passes now, or the
command output.

## Merge Danger

A **one-way door** is a merge that cannot cheaply be walked back — a
destructive action, a schema or protocol change, a hard-to-reverse decision.
A **two-way door** rolls back easily. Blast radius is the scope of what the
change could affect, considered generously. The reader's question is: if
this is wrong, what does it cost and who feels it?