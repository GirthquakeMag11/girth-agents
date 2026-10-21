# Tracker template

Create `tracker/` at the project root if needed, then the missing file or
files:

`tracker/HAZARDS.md`

```markdown
# HAZARDS

Expensive lessons are learned once: one entry per obstacle a future agent
will hit again. See the tracking skill for criteria and entry format.

<!-- entries below, newest first, one `##` section each -->
```

`tracker/BUGS.md`

```markdown
# BUGS

Bugs the project intends to fix. Entries carry full detail plus a log of
work already done; see the tracking skill for the entry format.

<!-- entries below, newest first, one `##` section each -->
```

`tracker/DEFECTS.md`

```markdown
# DEFECTS

Bad but not broken: code smells, convention violations, and design-principle
breaks. See the tracking skill for the boundary with bugs and the entry
format.

<!-- entries below, newest first, one `##` section each -->
```

`tracker/FEATURES.md`

```markdown
# FEATURES

What the project may become. Entries are created on request and close only
with the user's approval; see the tracking skill for the format.

<!-- entries below, newest first, one `##` section each -->
```

`tracker/QUESTIONS.md`

```markdown
# QUESTIONS

Questions that deserve a definitive answer but cannot get one yet. Entries
record the provisional decision made in the meantime, so the answer can be
applied to the work later. See the tracking skill.

<!-- entries below, newest first, one `##` section each -->
```

`tracker/tickets/`

Create the directory with the first ticket, one file per ticket at
`tracker/tickets/<NN>-<slug>.md`. The ticket format is in
`references/tickets.md`.