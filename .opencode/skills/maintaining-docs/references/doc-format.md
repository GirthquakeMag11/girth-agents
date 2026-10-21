# Docs

## Purpose

Three standard documents at the project root, each written for one reader.
Their creation templates are in `references/doc-template.md`.

## What belongs

| Document          | Reader      | Its job                                                                 | Contents                         |
| ----------------- | ----------- | ----------------------------------------------------------------------- | -------------------------------- |
| `AGENTS.md`       | A new agent | Orient itself in the project immediately                                | `references/doc-agents.md`       |
| `CONTRIBUTING.md` | A new agent | Understand the protocols for adding to or modifying the project content | `references/doc-contributing.md` |
| `README.md`       | A new human | Get up to speed with the project and the state it is in                 | `references/doc-readme.md`       |

The changelog is a document too, with its own format; see the changelog reference, `references/changelog.md`.

## Format

Each document follows its template's sections, filled as its contents
reference describes. Across all three: point rather than repeat. A line
naming `tracker/HAZARDS.md` lets that file speak for itself; a copy of its
contents would go stale.

Tables in any of the three documents are padded for plain text: each column
is as wide as its widest cell, so the divider dashes line up with the cell
text. A table whose columns sit ragged against the pipes is unfinished —
nothing else is coming to format it.

## Changing it

Each document describes the project as it is now. When its subject changes,
the document changes with it; a reader who trusts a stale document pays for
the lie later.
