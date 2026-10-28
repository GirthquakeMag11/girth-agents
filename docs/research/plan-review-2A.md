# Plan review 2A — `plans/plugin-transition.md`

**Reviewer A — round: the M1200-mandated restart (2026-10-28).**

**Sources used:** the raw chat log
`/tmp/opencode/girth-agents-chat-log.md` (M1–M1225, read in full in
targeted passes: all 75 user messages verbatim, all 132 question-tool
answer results, the probe runs and their log evidence), the OpenCode V2
docs (primary: https://opencode.ai/v2/docs/ plugins, build/plugins, and
CLI-plugin pages), and the repository state at review time. Every
citation below names a plan line and a chat message; where the plan's
citation does not resolve to user words, that itself is the finding.

**Method:** per the mandatory rules (chat M1200, M1220), each plan item
was checked against the exact cited message. Question-tool answers are
recorded in the log as tool results attached to assistant messages; a
citation to an assistant message is treated as resolving only when that
message contains the user's verbatim answer text affirming the item.
Items whose citation points at the agent's question, at an option, at a
clarifying question asked *back*, or at another topic are INVALID.

---

## Verdict summary

The large majority of the ~146 citations do resolve to genuine user
words (list in §5: ~105 entries verified cohering). The plan has also
dutifully removed the fabricated "helpers are skills, not agents"
ruling (per M1192) and incorporated the M1200 rules with correct
citations to M1200/M1220. But the plan is not whole: one entry asserts
a state of affairs that the log and the present reality flatly
contradict (its own review is claimed *closed*), one item carries no
user derivation at all, one Notes bullet asserts a technical falsehood,
and several entries cite messages that do not resolve to user words.
Under the rules as given — "Uncleared fog is failure. Lying is failure.
Being wrong is failure" (M1200) — the plan cannot transition to
specifying yet.

**VERDICT: FAIL** (see terminal findings §6; the fix set is listed
after each finding and is recorder-class for most, user-class for F1,
F2, and the F5 tail).

---

## 1. Design findings (substance)

### F1 — "The plan's own review — closed" contradicts the chat and reality — DESIGN, terminal
- **Plan line 793–796** ("Not yet specified → The plan's own review — closed … the second round was unanimous PASS").
- **Cited:** `(chat M969)`. **M969's answer** (the user's words) names
  the orchestrator and orders *"Have three subagents review the plan
  against the chat, using the loop previously described, proceeding to
  spec only on unanimous PASS."* It contains no statement that the
  review closed or that any round PASSed. The citation does not carry
  the claim.
- **Reality check:** the round-2 PASS the entry references exists
  (`docs/research/plan-review-A/B/C-round2.md` all say PASS), but the
  user invalidated that result decisively — M1197 (were the reviewers
  given the chatlog?), M1200: *"compromising the reviewers and making
  them provide passing grades for a failure of a plan … you are to
  restart the review-rectify loop and do it properly this time."* The
  restart is the review now in progress. An entry that calls the gate
  **closed** while the mandated re-review is running asserts the one
  thing M1200 forbids being asserted early — *"not to close the
  wayfinding phase until wayfinding is actually completed and
  properly."*
- **Fix:** rewrite the entry to the open state (review running under
  the M1200 rules; prior rounds invalidated by M1200), or drop it from
  the plan until a post-M1200 review verdict exists.

### F2 — "OpenCode V1 support: the catalog is V2-only and stays so" has no user derivation — DESIGN, terminal
- **Plan line 847** (Out of scope). **No citation.**
- **Chat check:** no user message anywhere in M1–M1225 mentions V1 or
  V2-only support. The item was added unilaterally: agent reasoning in
  the log states *"I'd rather note it than rule unilaterally … I'll put
  it in Out of scope with a note; the user can object."* The docs show
  a plugin *can* support V1 and V2 from one package ("Support V1"
  section of build/plugins) — so this is a genuine design choice, not
  forced by the platform.
- **Fix:** either find the user message that affirms it (none exists in
  the log) or route it through the scoping-clarification question; a
  plan item with no user derivation violates M1200's citation rule.

### F3 — Notes assert a false technical premise: "plugins register agents … via transforms" — wrong claim, recorder-critical (representation-class, but stated error)
- **Plan line 58–60** ("Facts the map leans on": *"plugins register
  agents, commands, skills, and tools via transforms"*).
- **Probe evidence (log):** the live probe's server log shows the
  plugin disabled by the agent transform:
  `"disabled plugin after transform failure" … cause="Cause([Die(Error:
  AgentEditor has no add)])"`; the probe run itself reported
  `"registered": {"skills": 21, "commands": 14, "agents": 0}`.
  Commands and skills register via transforms; **agent IDs cannot** —
  the plan's own later entry (line 823–831) records exactly this.
- **Contradiction inside the plan:** this Notes bullet says agents
  register; the "Keystones still unverified" bullet (line 74–79) lists
  *"adding brand-new agent IDs from a plugin (the editor has no
  `add`)"* as unverified; the platform-facts entry says verified
  impossible. Three positions, one fact. The user burned the wrong
  version once already — M1173: *"that same assumption is apparently
  invalidated concretely by opencode itself, which could have been
  checked against at any time."*
- **Fix (recorder):** correct the Notes bullet to the verified fact
  (skills/commands/tools register; agent IDs do not — plain Markdown
  ships, registration channels are a keystone); reconcile the three
  bullets to one consistent statement. No user question needed.

## 2. Invalid citations (do not resolve to user words)

### F4 — "Two layers: settled" cites a clarifying question, not an affirmation
- **Plan line 635–640. Cited:** `(chat M646)`.
- **M646's answer text (user):** *"Isn't the 'umbrella' spec \*our\*
  destination now? … asking me to reconcile … which doesn't make sense
  to me. Can you clarify or reframe?"* — a question back to the agent.
  It does not settle the entry's content.
- **Where the support is:** M663 (user) — *"you knew the difference
  between the two contexts and took it for granted … the former is a
  valid thing to ask me about, the latter is not."* — establishes the
  two-contexts split; the checkpoints half of the entry is M579's
  answer ("Automatic after PASS"; plan is the one human stop). The
  sentence *"the mapmaker works one way, the machine it maps works
  another"* is the agent's M647 reframe the user never verbatim
  affirmed (user's M668 was a conditional "continue where we left
  off").
- **Fix (recorder):** re-cite to M663 (+ M579), or shrink the entry to
  what those messages actually say.

### F5 — "The shelved era's terms: settled — they stay" builds a verdict on a rhetorical question
- **Plan line 285–291. Cited:** `(chat M1037)`.
- **M1037's answer text (user):** *"The glossary defines the domain
  model, are any of those terms incomprehensible as they are defined
  without the context of the old handoff skill?"* — a question, not a
  "they stay" ruling. The entry's *"Each definition stands alone"*,
  *"the chat's exhaustion, the ledger's rebuild, the inbox item's
  consumption"*, and *"a term retires only by warrant, through the
  caregiver, with the user's authority"* appear nowhere in the cited
  message. Inferring a settled verdict from a rhetorical question is
  precisely the pattern M1200 condemns.
- **Fix:** per the questioning notes (M621), re-confirm on resurfaces:
  either ask the user the direct question (do the four definitions
  stand alone, and do they stay), or relabel the entry as the agent's
  pending interpretation, not "settled."

### F6 — "Zeroshot's four clashing assumptions — borrowed from, never" is uncited to any user affirmation
- **Plan line 848–851. Cited:** `(chat M390)`.
- **M390 (user)** directs the research: *"I am taking heavy inspiration
  from the zeroshot project … a thorough investigation into how exactly
  we should take that inspiration in practice."* It names no
  assumptions. The four exclusions are the agent research's own
  conclusions; the user's only answer on the borrowing decisions was
  "Decide later" (M401). The three transfer items later settled
  (M466 "Typed essentials only", M457 "The tool enforces", M470
  "Fresh, fixer keeps its spot"), but the four exclusions were never
  user-affirmed in the log.
- **Fix (recorder):** cite the transfer rulings that functionally
  exclude the four, or present the exclusions as research conclusions
  with a pointer to `docs/research/zeroshot-open-engine.md`, not as a
  settled out-of-scope ruling citing M390.

## 3. Stale and uncontrolled claims

### F7 — Survey-inconsistencies bullets are stale against the repository at review time
- **Plan line 80–86:** claims (a) *"0003 lacks a superseded marker
  (still counts seven owners incl. teaching)"* — **false now:**
  `decisions/0003-one-skill-class.md` carries *"Status: accepted;
  superseded in part"* naming six owners; (b) *"the channel's
  supersession of the installer's clone-only transport ruling is not
  yet recorded in `decisions/`"* — **false now:** `decisions/0007`
  records exactly that. (The `teaching` references in
  `specs/handoff-pickup.md:279` and `tracker/tickets/08` and the
  un-applied `tdd`/`writing-for-agents` renames do check out, so the
  bullet is half-live.)
- **Adjacent note:** `decisions/0007` also asserts the map is *"done"*
  and passed its gate unanimously; the plan's own Status (line 3–5)
  and F1 above say otherwise. The record and the plan disagree about
  the phase; the recorder should reconcile.
- **Fix (recorder):** refresh the bullet to current repo state.

### F8 — Uncited elaborations presented inside "settled" rulings
Each is a phrase the plan states as part of a user ruling with no user
words behind it:
- Line 356–361, self-report consent — *"Identical repeated failures
  coalesce into one report — the flood control is spec detail"*: M948's
  answer is only "Ask at every report".
- Line 395–400, sidebar truth — *"updates atomically per state
  transition; the committed ledger remains the recovery truth, the live
  report the display truth"*: M926's answer is only *"The sidebar is
  meant to show what work is \*currently\* happening as reported by the
  engine."*
- Line 307–315, helpers' permissions — *"the forbidden list is the
  engine's floor"* and *"the orchestrator matches the job's
  requirements against the helper's set before dispatch"*: M993 says
  only "permissions tailored to the individual helper"; M998 demands
  helpers never spin up without needed permissions and that mismatches
  fail loudly — neither names the orchestrator nor a "floor."
- Line 184–193, inbox and tracker — *"sent through the inbox by
  reference, never copied"*: not in M535's words.
- Line 433–439, project kinds' shape — *"per-package physical placement
  only on warrant, recorded as a deviation like any other"*: not in
  M855's answer ("Root store, map, and scopes").
- Line 119–123, information-kind dispatch — quote marks around *"could
  not acquire"*: not the user's verbatim phrase (M489).
- Line 292–300, plan-gate completeness — *"one at a time"*: not in
  M1024's answer.
- Line 334–339, GitHub credentials — *"recorded as a ruling like any
  declination"*: not in M960's answer.
**Fix (recorder):** either drop the gloss, or move it to spec details
with a named source.

## 4. Representation defects (wording/mangling)

### F9 — Three entries are broken mid-sentence by the citation sweep
- **Line 741–743, "Inbox items":** ends *"informal, non-deterministic
  inbox items gleaned at M371"* — the sentence's end (*"are gone.
  `/inbox` initiates the re-active workflow with the user"*, present in
  the pre-sweep version in the log) was lost, and the citation dangles
  as body text.
- **Line 747–749, "Renames":** ends *"Knock-ons: CONTRIBUTING's craft
  pointer, the M361"* — truncated mid-list; source message M361's
  content is fine, the entry's presentation is not.
- **Line 788–789, "Markdown's place":** citation jammed into the
  parenthesis — *"QUESTIONS.md(chat M323) )"*.
**Fix (recorder):** restore the lost clauses and normalize the
citation format.

### F10 — Notes miscite "too disorganized to enumerate linearly"
- **Plan line 51–54. Cited:** `(chat M315, M418)`. The "too
  disorganized" words live in M323's round-1 answer (*"I have too many
  ideas that are too disorganized to enumerate here at once … changes
  to individual items meant to affect cross cutting concerns"*), not in
  M418. Recorder: re-cite to M323.

## 5. Verified-cohering items (for the rectification to keep)

The following citations were each read and confirmed to contain user
words affirming the entry (question-tool answers quoted verbatim in
the log): the mandatory-rules entry (M1200, M1220); channel (M421);
old install path (M428); `/slice` door (M431); `test-driving` re-scope
(M434); handoff shelf (M437); checker (M445); loop driver (M448);
criteria (M451, M624); reports' home (M454); discipline (M457);
hand-offs (M466); session scope (M470); engine awake + clearance
(M480); information dispatch (M484, M489); start switch (M492); inside
vs outside (M519); boundary's one door (M525); inbox/tracker two jobs
(M535); sidebar ongoing (M541); inbox answerer (M547); fact-finder
(M550); fixer re-affirmation (M557); builder (M562); testing system
(M568); plugin layout (M574); checkpoints (M579); inbox helpers
retire (M584); release notes + `/cut-release` (M588); `/retro` shelf
(M591); bootstrap synchronous (M600); chat boundary (M624); failure
routing (M627); the exception (M634); exception transport (M637); work
check (M669); `/spec` fate (M676); `/implement` fate (M679); grilling
(M682); convention crashes (M688); function-is-necessity + codifying
(M691); knowledge management (M694); questionnaire (M701);
context-is-role-shaped + five crafts (M704, M707); maintaining-docs
(M711); wizard shelved (M714); `/wayfind` (M720); ideation (M723);
`/questionnaire` (M726); GitHub integration (M747); primaries open then
settled (M758, M966); caregiver (M771); glossary proposals (M778);
proposals' home (M784); glossary in reviews (M788); glossary hygiene
(M793); recall layer (M796); prove-it + mutual checks (M818, M822);
stratification (M825); unverifiable claims (M828); lesson store (M831);
lesson capture (M834); project kinds' shape (M855); non-code
repositories (M858); commit unit (M861); concurrency declared (M864);
concurrency planks one/two (M897, M900); bootstrap re-run (M903);
branch placement (M906); file discipline (M910, M911); crash/push
contract (M914); machines (M917); startedness (M920); sidebar truth
(M926); inbox writes (M929); user sessions (M932); forbidden list
(M935); confirmation artifact (M938); direction changes (M941);
dogfooding (M945); self-report consent (M948); abandoned sessions
(M951); unassigned sums (M954); offline pushes (M957); GitHub
credentials (M960); pour complete (M963); orchestrator (M969);
off-switch (M990); helper permissions (M993, M998); repair chair
(M1001); push-conflict terminal (M1004); domain-modeling fate (M1007);
inbox name (M1010); plan-gate completeness (M1024). User-message
narrations M315, M334, M341, M346, M351, M356, M361, M366, M371, M377,
M385, M390, M406, M413, M418, M621, M655, M663, M723, M737, M747,
M804, M822, M870 all check out against their entries.

## 6. Technical verification (docs + probes)

Checked against https://opencode.ai/v2/docs/ and the probe evidence
quoted in the log:
- **"AgentEditor has no `add`"** — TRUE. Live server log: plugin
  *disabled after transform failure*, cause `AgentEditor has no add`;
  probe counts 21 skills / 14 commands / 0 agents.
- **`ctx.storage` survives service restarts** — TRUE (plan line 826
  and F3's keystone list conflict). Durability marker
  `2026-10-27T23:09:12.909Z` was read back intact after `opencode
  service restart`.
- **`codemode: true` tools surface in the code-mode namespace and
  execute** — TRUE. `tools.girth.keystones()` ran from code mode and
  returned its JSON.
- **Local-directory plugins load from `index.ts`/`server.ts` at the
  directory root; package channels use `package.json` `exports`** —
  TRUE. Docs: *"Configured local paths must be directories. OpenCode
  loads the directory's `server` or `index` module"*; `opencode plugin
  add github:…`, `opencode plugin update/check` for git specs confirmed
  in the plugins page.
- **TUI facts (line 62–67, uncited)** — TRUE against docs:
  `sidebar.content`/`sidebar.footer` slots; `./tui` export "for
  automatic loading"; `cli.json` for CLI-only plugins;
  `ui.router.register` routes; palette as the menu (chat-corrected:
  M518; survey finding that Escape is interrupt and Ctrl+P the palette).
  Still unverified, honestly listed: git-spec `./tui` auto-load,
  sidebar-slot live-reactivity, `session.idle` payload — the probe
  record agrees (`sessionIdleSeen: false`, TUI untested headlessly).
- **Tabled/相关 docs notes:** V1+V2 can coexist from one export (build/
  plugins "Support V1") — relevant to F2.

## 7. Terminal list (must be fixed before re-review)

1. **F1** — remove/rewrite the "plan's own review — closed" claim
   (user-class reality vs M1200; citation doesn't carry it).
2. **F2** — V1 out-of-scope: no user derivation; cite or clarify.
3. **F3** — Notes' "plugins register agents … via transforms" is
   false and self-contradicting; correct to the verified fact.
4. **F4, F5** — invalid/self-answering citations for "Two layers" and
   "shelved era's terms"; re-cite to M663/M579, and for F5 re-confirm
   or relabel.
5. **F6, F7, F9, F10** — recorder-class repairs (re-cite zeroshot,
   refresh stale survey bullets, un-mangle the three broken entries,
   re-cite the "disorganized" quote).
6. **F8** — strip or source the uncited glosses inside settled items.

VERDICT: FAIL