---
name: Maintaining Docs
description: Keep AGENTS.md, CONTRIBUTING.md, README.md, and CHANGELOG.md true for their readers. Use when the project's structure, protocols, or state change, after any user-visible change, or when the user asks to cut a release.
---

# Maintaining Docs

Four standard documents, each written for one reader:

| Document | Reader | Its job | Reference |
| --- | --- | --- | --- |
| `AGENTS.md` | A new agent | Orient itself in the project immediately | `references/agents.md` |
| `CONTRIBUTING.md` | A new agent | Understand the protocols for adding to or modifying the project content | `references/contributing.md` |
| `README.md` | A new human | Get up to speed with the project and the state it is in | `references/readme.md` |
| `CHANGELOG.md` | The project's users | Learn what changed and what it means for them | `references/changelog.md` |

Read a document's reference before writing it.

## Keeping them true

Drift is the failure mode: a reader who trusts a stale document pays for
the lie later. Correct the matching document whenever its subject changes:

| When this changes | Update |
| --- | --- |
| Structure, commands, or what agents must read before working | `AGENTS.md` |
| A protocol: setup, verification, conventions, the tracker flow | `CONTRIBUTING.md` |
| The project's state: what works, what is in flight | `README.md` |
| Anything a user of the project could notice | `CHANGELOG.md`, in the same change |

After changing any scaffold piece, check that the documents still describe
it truly.

## The files

All four live at the project root. If one does not exist, call the skill
tool with `bootstrapping`, create it per that piece, then bring it up to its
reference.

## Related skills

- domain-modeling — owns `GLOSSARY.md`; the documents use its terms.
- tracking — fixed bugs and implemented features feed the changelog.
- conventions — the standards CONTRIBUTING.md points at.