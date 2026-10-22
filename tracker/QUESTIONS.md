# QUESTIONS

Questions that deserve a definitive answer but cannot get one yet. Entries
record the provisional decision made in the meantime, so the answer can be
applied to the work later. See the tracker skill.

<!-- entries below, newest first, one `##` section each -->

## Notify's network machinery — 2026-10-21

- **The question:** Notify reports a release lag on every verb run. Which
  runs actually consult GitHub, and what happens when the check fails
  (offline, rate-limited)?
- **Context:** map `Installer experience and release-synced updates`;
  policies are Manual / Notify / Auto, Notify settled as "reported on any
  verb run" plus the `status` verb.
- **Decided (provisional):** the check is a cheap `git ls-remote` of tags
  at the repo URL, read out of the client's local config; runs that
  cannot reach the network print nothing about releases and proceed.
  Embodied in the map's Decisions so far; will be pinned in the spec.
- **Answered — 2026-10-21:** every verb run consults the latest release,
  quietly skipped when offline (user).
- **Follow-up:** map updated; the spec pins the wording.

## Non-interactive installs — 2026-10-21

- **The question:** The guided first run makes policy selection mandatory.
  What does install do when there is no terminal to ask — CI, scripts —
  and no policy flag was passed?
- **Context:** map `Installer experience and release-synced updates`;
  policy is recorded at install, selection mandatory.
- **Decided (provisional):** fail with a message telling the user to pass
  the policy flag; the mandatory-selection rule survives scripted runs.
  Embodied in the map's Decisions so far; will be pinned in the spec.
- **Answered — 2026-10-21:** no terminal and unanswered questions → fail
  naming the flag that would answer each (user).
- **Follow-up:** map updated; the spec pins the wording.

## Switching policy after install — 2026-10-21

- **The question:** How does a user change their recorded policy — manual,
  notify, or auto — once the install exists? A new verb, a flag on later
  runs, or re-entering the guided prompts?
- **Context:** map `Installer experience and release-synced updates`;
  the policy lives in the record written at install.
- **Decided (provisional):** the policy flag re-records it on any later
  install or update run — cheapest surface, no new verb. Embodied in the
  map's Decisions so far; will be pinned in the spec.
- **Answered — 2026-10-21:** switching the policy is an interaction with
  the program, never a flag; flags only pre-answer the questions the
  interaction would ask (user).
- **Follow-up:** map updated — the provisional is superseded; the spec
  pins the wording.

## Snapshot bootstrap for one-command install — 2026-10-21

- **The question:** Is the copy-paste install story the plain
  `git clone … && cd girth-agents && ./scripts/install.sh` one-liner, or
  a curl-piped bootstrap that fetches the release tarball — which would
  also let people install without keeping a clone?
- **Context:** map `Installer experience and release-synced updates`; the
  user asked for a copy-pasteable install command from the GitHub repo and
  deferred the transport decision to the maintainer under "simplest
  machinery necessary".
- **Decided (provisional):** clone-only transport; the copy-paste story is
  the plain git one-liner; Auto pins the checkout to the latest release
  tag. Embodied in the map's Decisions so far; will be pinned in the spec.
- **Answered — 2026-10-21:** clone one-liner is the documented story; the
  curl bootstrap goes to the feature tracker to consider later (user).
- **Follow-up:** map updated; the bootstrap is now FEATURES.md's "Curl
  bootstrap for one-command install".