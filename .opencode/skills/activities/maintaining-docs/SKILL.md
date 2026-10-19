---
name: Maintaining Docs
description: Keep AGENTS.md, CONTRIBUTING.md, README.md, and CHANGELOG.md true as the project changes, and cut releases. Use when the project's structure, protocols, or state change, after any user-visible change, or when the user asks for a release.
metadata:
  girth/role: activity
---

# Maintaining Docs

Drift is the failure mode: a reader who trusts a stale document pays for the
lie later. This skill keeps the documents true; the docs and changelog
skills define what each document contains.

## After a change

Match what changed to the document it affects:

| When this changes                                              | Update                             | Owner     |
| -------------------------------------------------------------- | ---------------------------------- | --------- |
| Structure, commands, or what agents must read before working   | `AGENTS.md`                        | docs      |
| A protocol: setup, verification, conventions, the tracker flow | `CONTRIBUTING.md`                  | docs      |
| The project's state: what works, what is in flight             | `README.md`                        | docs      |
| Anything a user of the project could notice                    | `CHANGELOG.md`, in the same change | changelog |

Write each update to its owner's format:

- `AGENTS.md`, `CONTRIBUTING.md`, `README.md`: call the skill tool with
  `docs`.
- `CHANGELOG.md`: call the skill tool with `changelog`.

If the document does not exist, call the skill tool with `bootstrapping` and
create it first.

The trackers feed the changelog: a fixed bug goes under Fixed, a feature
whose closure the user approved under Added or Changed, and a remediated
defect under Changed only when a user could notice the difference.

After changing any scaffold piece, check that the documents still describe
it truly.

Done when every affected document describes the project as it now is.

## Cutting a release

A release is the user's call; changelog entries stay under Unreleased until
the user asks for one. When asked:

1. Call the skill tool with `changelog`.
2. Propose the version from what Unreleased holds, per its versioning rules.
   The user confirms or overrides.
3. Apply the release to the file per the changelog's format. If a tool owns
   the changelog, run the tool's release workflow instead.

Done when the release section exists under the confirmed version.

## Formatting for plain text

These documents are read as raw Markdown at least as often as they are
rendered. Every table must read as a table in plain text: pad each column
to its widest cell so the divider dashes and the cell text line up. A table
whose columns sit ragged against the pipes — everything collapsed into left
justification, waiting for a renderer to tidy it — is unfinished, because
nothing else is coming to format it. Write tables the way the source should
look when finished.

## Related skills

- docs, changelog — the owners of the four documents.
- tracking — fixed bugs and implemented features feed the changelog.