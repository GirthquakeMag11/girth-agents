# 12: Update obeys the three policies

**Parent:** specs/installer-experience.md

**Kind:** feature

**Blocked by:** 09 (the policy lives in the record)

## What it delivers

`update` reads the recorded policy and acts on it. Manual pulls the
checkout forward and reconciles, as today. Notify does the same pull
and, on top, reports a newer cut release and the one line that takes the
user to it; its update never moves the install onto the release. Auto
fetches the tags, checks the checkout out onto the latest release tag,
and reconciles. A dirty checkout refuses under every policy.

## Acceptance criteria

- [ ] Manual: identical to today's pull-and-reconcile, with the before-and-after report.
- [ ] Notify: the pull happens, and a newer release is reported with its adoption line; the install is not moved onto it.
- [ ] Auto: the checkout lands on the latest release tag, then reconcile; asserted against a fixture git repository with tags.
- [ ] Dirty checkout refuses under all three, with the same explanation.
- [ ] Harness stays green with new per-policy assertions.
- [ ] Validator green.

- **Done — 2026-10-21:** update reads the policy and acts on it — manual
  pulls and reconciles as today, notify pulls then reports a newer cut
  release against the install's before-release with the adoption line
  (and never checks out the tag), auto fetches tags and checks the
  checkout out onto the newest release tag before reconciling. The
  dirty-checkout refusal runs before any of the three. Harness: 109
  green (auto and notify driven against fixture remotes with tags).
  Validator green.
- **Done — 2026-10-27:** retired without work — the parent spec was retired by the plugin transition.
