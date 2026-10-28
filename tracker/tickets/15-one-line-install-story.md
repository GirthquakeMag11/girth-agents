# 15: The one-line install story and the surrounding docs

**Parent:** specs/installer-experience.md

**Kind:** refactor

**Blocked by:** 11, 13, 14 (documents the finished surface)

## What it delivers

Everything the finished surface touches, made true: the README's Install
section leads with the one copy-pastable line, the installer story in
CONTRIBUTING mentions the new verbs and policy, and the changelog's
Unreleased holds the entries for the whole feature.

## Acceptance criteria

- [ ] README's Install section leads with one clone-and-run line; the policy, status verb, and interactive story are explained plainly.
- [ ] CONTRIBUTING's tooling section reflects the fourth verb and the policy.
- [ ] CHANGELOG Unreleased gains the Added/Changed entries for the policy, status, interactive surface, and release publication.
- [ ] Validator green.

- **Done — 2026-10-21:** the README's Install section now leads with one
  copy-pastable line and explains the interactive menu, the two questions,
  the policy, and the four verbs; CONTRIBUTING's tooling line reflects the
  fourth verb and the policy; the commands table's `/cut-release` row names
  the publishing step; and CHANGELOG Unreleased carries the Added and
  Changed entries for the whole effort. Validator and the 117-assertion
  harness are green.
- **Done — 2026-10-27:** retired without work — the parent spec was retired by the plugin transition.
