# Handling a hazard

## When to record

A hazard is recorded, not fixed: it is an obstacle that stays standing for
whoever comes next. Record it in flight. When in doubt, record: an entry is
cheap, and a lost lesson is expensive.

## Asking the user

- If all three hold — you are in an ongoing back-and-forth with the user,
  the user has not already given instructions for handling this hazard, and
  the hazard relates to the topic of conversation — you **may** ask the user
  how to handle it, then record that guidance.
- Otherwise — no conversation in flight, the hazard is off-topic, or the
  user already said what to do — record it immediately with your own best
  guidance, without waiting and without asking.

## Retiring

When you find that a recorded hazard no longer applies, append its retired
line.

## The entry

Expensive lessons are learned once. A hazard entry is institutional memory:
it lets the next agent walk around an obstacle instead of earning it the
hard way again.

## Definition

A hazard matches any of three lenses. They overlap; they are **not mutually
exclusive categories**, an entry carries no label, and one hazard may fit
one, two, or all three:

- **Out of scope to fix.** A bug, problem, or danger within the project's
  domain(s) that is not within the project's scope to fix.
- **Surprise behavior upstream.** Unexpected, counterintuitive, or
  undocumented behavior in something the project uses or depends on.
- **Disproven assumption.** An expectation or assumption in the project's
  domain(s) that was proven inaccurate or incorrect.

The test: an obstacle cost effort to overcome, and a later agent on a
similar task would run into it again. An obstacle that can be removed for
good is removed, not recorded.

Hazards are what a project lives with. A design may legitimately be shaped
around a known hazard, and the entry's "How to handle" is where that
workaround lives. Workarounds belong to hazards alone; a bug is fixed, never
designed around.

Problems the project can fix within its own scope are bugs. A slip that was
purely one agent's own, which a competent agent would not repeat, is not a
hazard.

## Entry

```markdown
## <One-line title> — <YYYY-MM-DD>

- **When it applies:** <the context needed to interpret the entry: where and
  when this matters, what was being done>
- **The hazard:** <explanation with enough detail to recreate it: symptoms,
  exact errors, versions, inputs>
- **How to handle:** <specific guidance a future agent can act on: what to
  do, avoid, or check>
```

The handling is actionable: commands to run, paths to check, people to ask.

## Closing line

When a hazard stops applying — the dependency fixed it, the assumption was
restored — append `- **Retired — <YYYY-MM-DD>:** <what changed>`. A stale
hazard steers agents into workarounds they no longer need.

## Example

```markdown
## CI jobs on fork PRs never see repository secrets — 2026-10-02

- **When it applies:** any workflow triggered by `pull_request` on a fork
  that uses repository secrets (tokens, deploy keys).
- **The hazard:** GitHub Actions does not pass secrets to jobs from fork
  PRs. Symptom: a step fails with an empty variable, but only for fork PRs;
  same-branch PRs are fine.
- **How to handle:** check the event with `github.event_name` before
  debugging the secret value. Run the secret-using part on
  `pull_request_target`, and keep untrusted input out of it.
```