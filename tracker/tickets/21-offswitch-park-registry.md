# 21: The off-switch — park and the activation registry

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 04 (engine skeleton), 05 (bootstrap activation)

## What it delivers

`/park` stops the engine on a project — records untouched — resumable
by re-running bootstrap. The per-machine activation registry records
which directories are started: machine-local, never project state,
never written into the repository; the registry's storage is one of the
build-time keystones, and its loss is the safe default — the machine's
projects simply appear un-started until bootstrap re-runs.

## Acceptance criteria

- [ ] `/park` stops watching the project; re-running bootstrap resumes it.
- [ ] Parked records are untouched, and re-activation rebuilds from them.
- [ ] No activation state enters the repository.
- [ ] The registry's storage keystone is verified and its outcome recorded.