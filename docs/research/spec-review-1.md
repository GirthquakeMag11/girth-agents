# Spec review 1 — `specs/plugin.md`

Fresh-context review of `/home/george/Documents/GitHub/girth-agents/specs/plugin.md`
against the format (`specs/plugin.md` → `.opencode/skills/specifying/references/spec-format.md`),
the settled statements (`plans/plugin-transition.md` "Decisions so far",
`tracker/QUESTIONS.md`, `decisions/0007-plugin-transition.md`), and the
project's own documents (`GLOSSARY.md`, `conventions/On_Chains.md`,
`conventions/On_Versioning.md`).

Classification of every finding:

- **Representation defect** — the spec's wording; the writer fixes it.
- **Design defect** — the spec re-opens something settled, or invents
  something the records do not support; this needs the user.
- **Completeness defect** — a settled decision that is missing (a
  missing settled decision counts against PASS); listed under
  Completeness with its own classification in brackets.

## Format

Verdict on format: **mostly compliant, with real violations.**

1. **[Representation defect]** Every required section is present and in
   order (Problem Statement, Solution, User Stories, Implementation
   Decisions, Testing Decisions, Out of Scope, Further Notes) — matches
   `spec-format.md` lines 28–54 exactly. Compliant.
2. **[Representation defect]** Implementation Decisions contains file
   paths and code-shaped tokens, which `spec-format.md` lines 41–44
   forbid in that section:
   - `validate.mjs` (`specs/plugin.md` line 61) — file path.
   - `tracker/TERMS.md` and `tracker/LESSONS.md` (line 104) — file
     paths.
   - `inbox.md` (line 111) — file name/path.
   - Borderline, flag for the writer's judgment: `opencode plugin
     update` (line 59), the `./tui` export name (lines 62–63), and
     `Inbox: {n}` (line 113) — each encodes a decision more precisely
     than prose, so each may qualify under the format's own
     inline-snippet exemption; the four above do not, because they are
     paths to files rather than the pinning of a name the spec was told
     to pin.

## Fidelity

Verdict on fidelity: **good on the big mechanics; three quiet additions
need the user.**

1. **[Design defect]** `specs/plugin.md` line 75: "Until verified, the
   spec's fallback is config-declared agent definitions the plugin
   loads." The records decide otherwise by omission-by-design: the
   agent-ID keystone is listed as "do not build on them until checked"
   (`plans/plugin-transition.md` lines 62–68) and "verified before
   building, not open decisions" (`plans/plugin-transition.md` lines
   821–826). No fallback mechanism is recorded anywhere (grep for
   `fallback` / `config-declared` returns nothing in the plan or
   QUESTIONS). The spec pre-decides the failure path of an unverified
   keystone. This needs the user.
2. **[Design defect]** `specs/plugin.md` line 97: the fix-round cap and
   per-step time limit are "overridable by a recorded project ruling."
   The settled discipline is that the tool enforces the caps in code and
   "the agent obeys and cannot bend them" (`plans/plugin-transition.md`
   lines 662–665; `tracker/QUESTIONS.md` lines 280–293). A cap that
   proves too low is settled as a symptom of the exception — a system
   failure to report (`plans/plugin-transition.md` lines 211–218) — not
   as something a ruling overrides. Grep for `overridable` / `override`
   finds nothing in the records. This needs the user.
3. **[Design defect, light]** `specs/plugin.md` lines 82 and 85 introduce
   "the per-machine activation registry" and phrase the crash contract as
   "no separate engine state store except the per-machine activation
   registry." The settled words are flat: "There is no separate engine
   state store" (`plans/plugin-transition.md` lines 246–251). The word
   "registry" appears nowhere in the plan or QUESTIONS. The registry is
   a defensible embodiment of settled local activation ("State travels
   through the records; activation is local," `plans/plugin-transition.md`
   lines 399–406), and its storage returning safely to un-started is
   consistent with that. But the "except" clause softens a settled
   absolute, and the spec's Further Notes (line 146) claims the plan
   ceded "the activation registry" — the plan's ceded list
   (`plans/plugin-transition.md` lines 342–346 and 827–838) does not
   contain it. The writer should either restate the distinction
   (work-state ledger vs. activation marker) without the "except" clause
   or take the addition to the user.
4. **[No defect]** The two layers are honored: everything in the spec
   reads as [The system] (the plugin's rules on the projects it runs),
   and Further Notes (line 145) records the [Ours] vs [The system] split
   in the settled form (`plans/plugin-transition.md` lines 632–637). No
   inversion found. The interpreter classification (cross-layer artifact
   = representation problem, never a reconciliation question) is stated
   at `specs/plugin.md` line 124 and matches the worked incident
   (`plans/plugin-transition.md` lines 20–34, lines 219–229).
5. **[No defect]** Spot-checks of every big mechanic land faithful: the
   one door / plan-only entry (line 90 vs. `plans/plugin-transition.md`
   lines 191–194, 547–549); the checklist source rules incl. the chat
   boundary (lines 96–97 vs. lines 651–661, 670–675); one-human-stop
   checkpoints (line 99 vs. lines 145–148); the forbidden list (line 79
   vs. lines 378–383); builder-owns-its-repair and always-fresh reviewer
   (lines 68–69, 98 vs. lines 159–167, 207–210); the six helpers with
   individualized permission rulesets and loud mismatch (lines 66–74 vs.
   lines 304–312); committed-units pushed as it goes, never merge
   (line 84 vs. lines 236–239, 277–281); the crash ledger and absorb-or-alarm
   (lines 82, 86 vs. lines 246–259); the seabird exception with
   consent-per-send self-report (line 100 vs. lines 353–357, 638–642);
   the glossary caregiver pipeline and form-only mechanical gate (lines
   107, 117 vs. lines 481–518); the recall layer (line 119 vs. lines
   437–480); the keystone list (line 144 vs. `plans/plugin-transition.md`
   lines 62–68, 821–826). Fidelity of the covered ground is high.

## Completeness

Verdict on completeness: **fails.** The destination names five areas —
skills, commands, agent types, tools, code (`plans/plugin-transition.md`
lines 8–11; `decisions/0007-plugin-transition.md` lines 54–56). The spec
covers agent types, tools, and code well; skills and commands only as a
blanket transport statement. Several settled decisions are missing.

1. **[Representation defect — the catalog sweep is missing]** The
   change-cloud's item-level fates are settled ("every skill and command
   now has a fate; the sweep complete," `plans/plugin-transition.md`
   lines 104–106; "The pour is complete," lines 327–330) and restated in
   the decision record's consequences (`decisions/0007-plugin-transition.md`
   lines 41–46). The spec carries almost none of them:
   - the renames: `tdd` → `test-driving`, `writing-for-agents` →
     `technical-writing` (`plans/plugin-transition.md` lines 742–748);
   - the deaths: `find-skills`, `/wait-what` (lines 742–744), `/implement`
     (lines 619–622), `/spec` (lines 623–627);
   - the survivals with shape changes: `slicing` as its own skill behind
     the thin `/slice` door (lines 693–694, 782–783); `codifying` as one
     skill with two arrival paths, folded in with the convention-crash
     pipeline (lines 557–561); `domain-modeling` re-fit, interactive side
     surviving (lines 273–276); `grilling` and `questionnaire` kept
     (lines 612–618); `maintaining-docs` zero-drift (lines 594–598);
   - the five crafts' functions survive, carriers assigned at
     helper-context design (lines 599–611) — the survival half of that
     is settled and should be stated as such.
   The blanket sentence "The catalog's skills, commands, and agents
   remain plain Markdown in the repo" (`specs/plugin.md` line 60) reads
   as if the catalog's *content* survives unchanged, contradicting the
   settled removals and renames until the sweep is stated. The spec as
   written cannot govern the catalog rebuild.
2. **[Representation defect — convention collisions are missing]** The
   settled convention-crash pipeline — the engine's in-flight agent
   collides with a convention, the collision spawns an authority-kind
   question to the inbox, and the user's answer may fold into the
   conventions as the resolution (`plans/plugin-transition.md` lines
   562–571) — has no home in the spec. The engine section never mentions
   conventions at all.
3. **[Representation defect — the bootstrap cluster is missing]** Settled
   but absent: bootstrap is synchronous, so residual asks happen in the
   session, not the inbox, because the engine is not yet alive
   (`plans/plugin-transition.md` lines 128–133); eager programmatic
   derivation, everything derivable derived (`lines 749–754`); the
   derivation-exhausted whitelist (`tracker/QUESTIONS.md` lines 455–461);
   and the optional gh setup with declination-as-ruling and its
   consequences — no pushes, no self-reports (`plans/plugin-transition.md`
   lines 331–336). Without the gh row the spec never says how the engine
   gains push or self-report credentials at all, though it demands both
   (lines 42, 79, 84, 100).
4. **[Representation defect — direction changes are missing]** The
   settled direction-change path — amend becomes a new plan revision
   through the same review; abort closes the workstream's records with
   the reason; re-answer reopens the resolved question, all ruled in a
   session as authority (`plans/plugin-transition.md` lines 365–370) —
   appears nowhere.
5. **[Representation defect — unsettled-and-harmless vs. missing in the
   minors]** Not verdict-shaping individually, but settled statements
   the spec does not carry: lost-session recovery (lines 207–210); a
   re-bootstrap being its own exclusive, synchronous step (lines
   265–268); identical failures coalescing into one self-report — ceded
   to the spec as "spec detail" (lines 353–357) — the spec leaves the
   flood control unpinned; several ceded shapes left unpinned despite
   the "unassigned sums" ruling naming them spec details
   (`plans/plugin-transition.md` lines 342–346) — the brief's shape and
   home (only the checklist's is pinned, `specs/plugin.md` line 97),
   the sidebar's exact derivation from pile and ticket states
   (`tracker/QUESTIONS.md` lines 375–382), the queue order for several
   cleared plans (`tracker/QUESTIONS.md` lines 476–481), and the recall
   layer's budget/eviction/retrieval-injection mechanics
   (`tracker/QUESTIONS.md` lines 99–100). Also: the scaffold-migration
   rules' details are a deferred open item (`plans/plugin-transition.md`
   lines 836–838) and are neither baked in — good — nor listed in Out
   of Scope as the other deferrals are.
6. **[Not missing — checked]** Open questions the spec correctly refuses
   to bake: scaffold-migration rules (the spec stops at the gate,
   `specs/plugin.md` line 81); the future concurrency stance (named, not
   designed, line 80; Out of Scope line 137); the keystones (listed as
   build-time, line 144). Good.

## Coherence

Verdict on coherence: **no internal contradictions found.**

- The ledger/registry claims agree with each other (`specs/plugin.md`
  lines 82, 85, 113): records are the recovery truth, registry loss is a
  safe default, activation never enters the repository — the only issue
  with the registry is the fidelity one listed above.
- The plan-gate completeness statement (line 99) agrees with the
  one-human-stop statement (line 99) and the grilling battery ruling
  (`plans/plugin-transition.md` lines 289–297).
- `Inbox: {n}` (line 113) and the inbox glossary term in `GLOSSARY.md`
  agree (screen + send/receive channel + seeded sessions + recorded
  replies).
- Release-tag mechanics (line 59) agree with `conventions/On_Versioning.md`
  and the GLOSSARY "Release" term.
- The doors the spec keeps (`/bootstrap`, `/park`, `/ideate`, `/wayfind`,
  `/inbox`) are consistent with `conventions/On_Chains.md` ("commands are
  the doors, skills the machinery"; recovery rails `/inbox` and
  `/bootstrap` preserved).
- User story 9 ("whoever made the work" repairs the FAIL) agrees with the
  builder-owns-its-repairs ruling, including the plan's interactive
  repair chair, since the plan's maker is the live session.

## Overall

The spec is faithful and coherent on everything it covers — which is the
machinery: the engine, the gate, the helpers, the inbox, the records,
the leadership of the review loop. It is not the umbrella its own
destination demanded: the settled fates of the catalog's skills and
commands, the bootstrap asking-and-credentials cluster, convention
collisions, and direction changes are absent, so the spec cannot govern
the catalog rebuild on its own; and three mechanisms appear that the
records never settled (the agent-ID fallback, the ruling-overridable
caps, and the activation registry's "except" clause). Those are design
questions for the user, not wording fixes. Format violations in
Implementation Decisions round out the picture but are the writer's to
repair.

VERDICT: FAIL