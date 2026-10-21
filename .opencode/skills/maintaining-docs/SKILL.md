---
name: Maintaining Docs
description: Keep AGENTS.md, CONTRIBUTING.md, README.md, and CHANGELOG.md true as the project changes, and keep the changelog release-ready. Use when the project's structure, protocols, or state change, after any user-visible change, or when the user asks for a release.
---

# Maintaining Docs

Drift is the failure mode. This skill owns the four documents and keeps
them true; its `references/` define what each contains.

## After a change

Match what changed to the document it affects:

| When this changes                                              | Update                             | Defined by |
| -------------------------------------------------------------- | ---------------------------------- | ---------- |
| Structure, commands, or what agents must read before working   | `AGENTS.md`                        | docs       |
| A protocol: setup, verification, conventions, the tracker flow | `CONTRIBUTING.md`                  | docs       |
| The project's state: what works, what is in flight             | `README.md`                        | docs       |
| Anything a user of the project could notice                    | `CHANGELOG.md`, in the same change | changelog  |

Write each update to the document's reference:

- `AGENTS.md`, `CONTRIBUTING.md`, `README.md`: read
  `references/doc-format.md` and the reference for that document under
  `references/`.
- `CHANGELOG.md`: read `references/changelog.md`.

If the document does not exist, call the skill tool with `bootstrapping` and
create it first.

The trackers feed the changelog: a fixed bug goes under Fixed, a feature
whose closure the user approved under Added or Changed, and a remediated
defect under Changed only when a user could notice the difference.

After changing any scaffold piece, check that the documents still describe
it truly.

Done when every affected document describes the project as it now is.

## Releasing

A release is the user's call. An entry lands under `## [Unreleased]` the
moment the change happens; releasing that queue is a deliberate act the
user runs, and `/cut-release` carries the full protocol — the versioning
rules, the confirmation, the tag. Cut nothing mid-maintenance: when the
user asks for a release, hand them `/cut-release`, and keep the changelog
release-ready in the meantime.

## Formatting for plain text

These documents are read as raw Markdown at least as often as they are
rendered. Write tables per `references/doc-format.md`'s Format: padded so each
column is as wide as its widest cell.

## Related skills

- tracking — fixed bugs and implemented features feed the changelog.