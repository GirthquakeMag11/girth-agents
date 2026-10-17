---
name: Tracking Hazards
description: Record hazards in tracker/HAZARDS.md — bugs, problems or dangers outside the project's scope to fix, unexpected or undocumented dependency behavior, or disproven domain assumptions — with context, recreation detail, handling guidance, and a timestamp. Use whenever an obstacle you had to work around will trap a future agent just the same.
---

# Tracking Hazards

The hazard tracker exists so that expensive lessons are learned once. A
hazard entry is institutional memory: it lets the next agent walk around an
obstacle instead of earning it the hard way again.

## What counts as a hazard

A hazard is anything matching A, B, or C below. These are three overlapping
lenses, **not mutually exclusive categories** — an entry needs no letter
label, and a hazard may qualify under one, two, or all three:

- **(A) Out of scope to fix.** A bug, problem, or danger within the project's
  domain(s) that is not within the project's scope to fix.
- **(B) Surprise behavior upstream.** Unexpected, counterintuitive, or
  undocumented behavior in something the project uses or depends on.
- **(C) Disproven assumption.** An expectation or assumption in the project's
  domain(s) that was proven inaccurate or incorrect.

One test decides. When you hit an obstacle in flight that costs effort to
overcome, ask: **would a subsequent agent on a similar task run into this
same obstacle again?** If the obstacle can be removed for good — fixed once,
never recurs — fixing it beats recording it. Record a hazard when the
obstacle is left standing for whoever comes next.

Hazards are obstacles a project lives with: a design may legitimately be
shaped to work around a known hazard, and the entry's "How to handle" is
where that workaround lives. This is what separates hazards from bugs —
bugs are fixed, never designed around (see the tracking-bugs skill).

Not hazards:

- Problems the project can and should fix within its own scope — those are
  tracked in the bugs tracker (see the tracking-bugs skill), not here.
- Mistakes that are purely the current agent's in the current task, which a
  competent future agent would not reproduce.

## When to record

Record in flight — while error text, versions, and exact inputs are still
fresh — not at the end of the session. When in doubt, record; an entry is
cheap, and a lost lesson is expensive.

**When working with a user**, follow this rule:

- If all three hold — (1) you are in an ongoing back-and-forth with the user,
  (2) the user has not already given specific instructions for handling this
  hazard, and (3) the hazard is related to the topic of conversation — you
  **may** ask the user how to handle it, then record that guidance.
- Otherwise — no conversation in flight, the hazard is off-topic, or the user
  already told you what to do — record immediately per the standard
  protocol. Do not wait, and do not ask.

## The tracker file

The canonical file:

```markdown
# HAZARDS

Expensive lessons are learned once: one entry per obstacle a future agent
will hit again. See the tracking-hazards skill for criteria and entry format.

<!-- entries below, newest first, one `##` section each -->
```

It lives at `tracker/HAZARDS.md` in the project root. If it does not exist,
load the bootstrapping skill, follow its HAZARDS section to create the file,
then add the entry.

## Entry format

One `##` section per entry, newest first:

```markdown
## <One-line title> — <YYYY-MM-DD>

- **When it applies:** <context needed to interpret the entry: where and when this matters, what you were doing>
- **The hazard:** <explanation and enough detail to recreate: symptoms, exact errors, versions, inputs>
- **How to handle:** <specific guidance a future agent can act on: what to do, avoid, or check>
```

- The timestamp is required; use `YYYY-MM-DD`, adding a time only when it
  matters.
- Before writing, read the file. If an existing entry already covers the
  hazard, do not duplicate it — extend that entry with the new context and
  date instead.
- Entries are history; do not rewrite older ones. Add a new entry (or amend
  the most recent) when things change.

### Example

```markdown
## CI jobs on fork PRs never see repository secrets — 2026-10-02

- **When it applies:** any workflow triggered by `pull_request` on a fork
  that uses repository secrets (tokens, deploy keys).
- **The hazard:** GitHub Actions does not pass secrets to jobs from fork
  PRs. Symptom: a step fails with an empty variable, but only for fork PRs;
  same-branch PRs are fine.
- **How to handle:** do not debug the secret value; verify the event with
  `github.event_name`. Use a workflow on `pull_request_target` for the
  secret-using part, and keep untrusted input out of it.
```

## Writing a good entry

- Be concrete: exact error keys and messages, dependency names and versions,
  the commands and inputs involved. A future agent should recognize the
  hazard from the first symptom they see.
- Make the handling actionable: commands to run, paths to check, people to
  ask. "Be careful" is not guidance.
- Assume the reader knows nothing about the original task — the context
  line is what makes the rest interpretable.

## Related skills

- bootstrapping — creates `tracker/HAZARDS.md` when it is missing.
- tracking-bugs — sibling tracker; the boundary is stated in "Not hazards"
  above and on that skill's side.
- tracking-defects — sibling tracker.
- tracking-features — sibling tracker; wanted-but-absent lives there.
- tracking-questions — sibling tracker; open questions await answers
  there.