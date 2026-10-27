# Shared vocabularies in real agentic/software systems — the practice

**Question:** How do real agentic systems and engineering organizations keep a
shared vocabulary (glossary/terminology) written, true, and owned — and what
does that mean for rebuilding the missing `learned term → new glossary entry`
pipeline in the plugin, which today has no designated point in the workflow?

**Date:** 2026-10-26. Research commissioned by
`tracker/QUESTIONS.md` "Knowledge management — the domain-modeling deep dive"
(entry dated 2026-10-26, `tracker/QUESTIONS.md` L9–28).

---

## 1. This repo's ground truth — how glossary maintenance works today, and where the failure shows

**What the glossary is and its format rules.**

- `GLOSSARY.md` exists at the repo root with 6 entries: `Release` plus a
  "Context freshness" cluster of 5 terms (`Fresh Context`, `Stale Context`,
  `Consumed Context`, `Context Consumer`, `Partially Consumed Context`), each
  a bold term, one-to-two-sentence definition, and an `_Avoid_` list
  (`GLOSSARY.md` L1–34).
- The format is owned by the `domain-modeling` skill: "This skill also owns
  `GLOSSARY.md` — its terms and their format live in
  `references/glossary-format.md`" (`.opencode/skills/domain-modeling/SKILL.md`
  L14–16).
- Format rules that exist today (all in
  `.opencode/skills/domain-modeling/references/glossary-format.md`): terms
  must be "specific to the project's domain" (L12–13); "Every entry is
  canonical. A term still in dispute waits in the questions tracker until the
  user settles it" (L15–16); entries hold "Definitions, and nothing else" — a
  glossary that absorbs implementation detail "turns into a running spec,
  which is its most common failure" (L17–21); definitions are self-referencing
  ("Definitions use the glossary's own terms", L38); updates are in place, a
  retired term's word moves to the replacing term's `_Avoid_` list, and the
  resolution is recorded under `## Flagged ambiguities` as the history (L53–57).
- `GLOSSARY.md` is a bootstrapping inventory piece owned by `domain-modeling`,
  asked "Nothing" at bootstrap — "the domain line comes from the project
  overview" (`.opencode/skills/bootstrapping/SKILL.md` L48).

**How a term gets in today — the actual pipeline.**

- `codifying` is the routing point: three ruling kinds, `Term` → `GLOSSARY.md`
  via domain-modeling (`.opencode/skills/codifying/SKILL.md` L11–15). The
  trigger is a **user statement**: "The user settles … What a word means"
  (L11–13), and "Rulings belong to the user. Codifying proposes and records;
  it never settles anything on the user's behalf" (L17–18).
- Codifying's step 5: "**Record it** the moment it is settled,
  mid-conversation: A term: call the skill tool with `domain-modeling` and
  write it per the glossary's format" (`.opencode/skills/codifying/SKILL.md`
  L44–46).
- `domain-modeling`'s session instructions make capture an **in-session habit
  of the interactive agent**, interleaved with everything else: "**Challenge
  against the glossary** … call it out immediately" (L20–22), "**Sharpen fuzzy
  language**" (L24–25), "**Record the moment it settles.** … Do not batch
  these up; capture them as they happen" (L32–35).
- The tracking skill also routes answered questions into the glossary: "When
  the answer lands … when it settles what a term means … call the skill tool
  with `codifying` and record it. The answer lands in the project's records,
  not just in the tracker" (`.opencode/skills/tracking/references/questions.md`
  L24–29).
- `domain-modeling` itself draws the line between reading and writing: "Merely
  *reading* `GLOSSARY.md` for vocabulary is not this skill — that is a
  one-line habit; this skill is for when the model is being changed"
  (`.opencode/skills/domain-modeling/SKILL.md` L10–12).

**Where the diagnosis's failure shows in the files.**

- The diagnosis is recorded on the map: "domain-modeling and the glossary …
  thoroughly undercooked: their function … is essential, but the discipline
  was given to interactive agents whose attention was stretched too thin to
  follow it interwoven with everything else they do. And the tracker models
  `ask question → new conventions` and `encounter problem → new hazards` as
  first-class pipelines, while `learned term → new glossary entry` was
  treated as its own separate thing with no point in the workflow designated
  for it" (`plans/plugin-transition.md` L216–227, "Knowledge management:
  declared", 2026-10-26, user).
- The "Not yet specified" section repeats it and names the open pieces: "who
  owns the discipline now that the stretched-thin interactive agent does not;
  the glossary's relationship with the tracker; and the `learned term → new
  glossary entry` pipeline's designated point in the workflow"
  (`plans/plugin-transition.md` L476–481).
- Structural evidence of the failure: the term-writing path is
  **prompt-response, not a pipeline**. Every write instruction above fires
  only when the user says something or answers a question (`codifying/SKILL.md`
  L11–18, L44–46). Unlike tracker kinds, there is no "decide now or record"
  protocol and no in-flight capture rule for terms — compare
  `.opencode/skills/tracking/SKILL.md` L44–58 ("Record in flight, while error
  text, versions, and exact inputs are still fresh") with the glossary, which
  has no analogous rule anywhere in `domain-modeling/` or `codifying/`.
- Live rot evidence in this repo's own research: the plugin map "imports a
  whole new vocabulary (engine, entry points, review loop, inbox messages)
  and records nobody who graduates those terms into the glossary"
  (`docs/research/coverage-matrix.md` L36; closing question L100: "Who
  graduates the new vocabulary … into `GLOSSARY.md`?"). The fog audit found
  "Conventions and glossary are untouched by a change that breaks them" — the
  "inbox" naming collision "needs a glossary decision", and no record
  confronts it (`docs/research/fog-audit.md` L414–419; top-ten fog #10,
  L455–457).
- The one glossary-bearing spec shows the glossary being used as the landing
  zone for vocabulary settled *in a spec*, with the term wording settled
  there rather than by a dedicated capture moment: "The glossary gains the
  vocabulary: the two staleness axes…" and "The glossary records five terms,
  settled here in wording" (`specs/handoff-pickup.md` L40, L213–221).

---

## 2. How real agentic tools handle shared memory/language

**AGENTS.md — the cross-tool convention.**

- AGENTS.md is "a simple, open format for guiding coding agents", "a README
  for agents", a "dedicated, predictable place" for agent context and
  instructions, distinct from README.md which is for humans
  (https://agents.md/ — "Why AGENTS.md?").
- It is explicitly a living document: "Can I update it later? Absolutely.
  Treat AGENTS.md as living documentation" (https://agents.md/ — FAQ). No
  required fields; plain Markdown; nested files for monorepos where "the
  closest AGENTS.md to the edited file wins; explicit user chat prompts
  override everything" (https://agents.md/ — FAQ).
- Writing/update practice is human-authored, occasionally agent-scaffolded:
  "Most coding agents can even scaffold one for you if you ask nicely"
  (https://agents.md/ — "How to use AGENTS.md?"). The site is stewarded by
  the Agentic AI Foundation under the Linux Foundation and lists ~20 tools
  that read it, including OpenCode (https://agents.md/ — "One AGENTS.md works
  across many agents").

**Claude Code: CLAUDE.md + auto memory (first-party docs).**

- Claude Code has **two complementary memory systems** loaded at session
  start: `CLAUDE.md` files ("instructions you write") and **auto memory**
  ("notes Claude writes itself based on your corrections and preferences")
  (https://docs.anthropic.com/en/docs/claude-code/memory — "CLAUDE.md vs auto
  memory").
- The two split by writer and content: CLAUDE.md is written by the human and
  holds "instructions and rules"; auto memory is written by Claude and holds
  "learnings and patterns" — "Use CLAUDE.md files when you want to guide
  Claude's behavior. Auto memory lets Claude learn from your corrections
  without manual effort" (same page, comparison table).
- The documented trigger for adding to CLAUDE.md is **repetition**, not
  initiative: add it "when Claude makes the same mistake a second time … You
  type the same correction or clarification into chat that you typed last
  session … A new teammate would need the same context" (same page, "When to
  add to CLAUDE.md").
- Auto memory is written **by Claude, asynchronously, outside the interactive
  task flow**: four note kinds (`user`, `feedback`, `project`, `reference`);
  "Claude skips anything it can derive from the codebase … It also skips
  anything your CLAUDE.md files already say. Claude doesn't save something
  every session. It decides what's worth remembering based on whether the
  information would be useful in a future conversation" (same page, "Auto
  memory").
- Storage is a per-repository machine-local directory with a `MEMORY.md`
  index ("one line per memory, loaded into every session") plus one topic
  file per memory; the index has a hard read budget (first 200 lines or 25KB)
  and Claude Code reminds Claude to "merge or drop stale entries" when near
  the limit (same page, "Storage location" and "How it works").
- Anti-rot machinery exists: `/doctor prompt-audit` checks instruction files
  "for outdated or conflicting content … references to files or commands that
  don't exist, and files that contradict each other" (same page, "Audit your
  instruction files").
- Subagents can "maintain their own auto memory" (same page, "CLAUDE.md vs
  auto memory", pointing at the subagent-configuration doc).

**OpenCode's own instructions/rules/references (opencode.ai docs).**

- The Rules page is OpenCode's instructions mechanism: "You can provide
  custom instructions to opencode by creating an `AGENTS.md` file … similar
  to Cursor's rules. It contains instructions that will be included in the
  LLM's context" (https://opencode.ai/docs/rules/ — "Rules").
- `/init` creates or improves the file: it "scans the important files in your
  repo, may ask a couple of targeted questions when the codebase cannot
  answer them, and then creates or updates `AGENTS.md` with concise
  project-specific guidance" (https://opencode.ai/docs/rules/ — "Initialize").
  So the *first* write is a dedicated command, not ambient habit.
- Additional instruction files are wired mechanically through
  `opencode.json`'s `instructions` field ("All instruction files are combined
  with your `AGENTS.md` files"), including remote URLs fetched with a 5s
  timeout (https://opencode.ai/docs/rules/ — "Custom Instructions").
- The References page is a separate, differently-purposed mechanism —
  attachable read-only context directories/repos with a `description` telling
  the agent *when* to use them: "Descriptions should be short and specific
  enough to distinguish references … References without descriptions remain
  available through autocomplete and direct use, but are not advertised to
  agents" (https://opencode.ai/docs/references/ — "Describe usage").
- Agents are configured roles with scoped permissions and per-role prompts;
  `hidden: true` subagents exist specifically so a role "should only be
  invoked programmatically by other agents via the Task tool"
  (https://opencode.ai/docs/agents/ — "Hidden"; also "Subagents" and
  permission-per-agent tables).

**OpenAI Codex: AGENTS.md + background memories.**

- Codex builds an instruction chain per run: global `~/.codex/AGENTS.md`,
  then per-directory `AGENTS.md`/`AGENTS.override.md` walking from the git
  root down, concatenated, closer files overriding earlier ones, with a
  `project_doc_max_bytes` cap (32 KiB default) after which "Codex skips empty
  files and stops adding files"
  (https://developers.openai.com/codex/agent-configuration/agents-md — "How
  Codex discovers guidance").
- Codex **Memories** are generated **in the background, not at chat end**:
  "Codex can turn useful context from eligible prior chats into local memory
  files. Codex skips active or short-lived sessions, redacts secrets from
  generated memory fields, and updates memories in the background instead of
  immediately at the end of every chat … Codex waits until a chat has been
  idle long enough to avoid summarizing work that's still in progress"
  (https://developers.openai.com/codex/customization/memories — "How local
  Codex memories work").
- The canonical separation is stated outright: "**Keep required team guidance
  in `AGENTS.md` or checked-in documentation. Treat memories as a helpful
  recall layer, not as the only source for rules that must always apply.**"
  And the memory files themselves are "generated state … don't rely on
  editing them by hand as your primary control surface" (same page, intro and
  "Local memory storage").

**Gemini CLI: GEMINI.md hierarchy + a memory-writing tool.**

- Gemini CLI loads a hierarchy of `GEMINI.md` files (cwd up to project root
  and `~/.gemini/GEMINI.md`) concatenated into every prompt
  (https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html —
  "Provide Context with GEMINI.md Files").
- The `save_memory` tool is a **designated write mechanism with routing
  rules**: "The agent routes memories to the appropriate Markdown file:
  shared project instructions go in repository `GEMINI.md` files, private
  project notes go in the per-project private memory folder, and
  cross-project personal preferences go in the global `~/.gemini/GEMINI.md`
  file" (https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/memory.md
  — "Technical reference"). Agent-written facts land "under a `## Gemini
  Added Memories` section" of the global file
  (https://google-gemini.github.io/gemini-cli/docs/tools/memory.html).

**Cline: Memory Bank as an explicit workflow-point protocol.**

- Cline's Memory Bank is a set of structured Markdown files
  (`projectbrief.md`, `productContext.md`, `activeContext.md`,
  `systemPatterns.md`, `techContext.md`, `progress.md`) with an explicit
  update protocol: "`activeContext.md` changes most frequently; update it
  after each session"; the documented workflow points are "update memory
  bank" before a context window fills and "follow your custom instructions"
  on resume (https://docs.cline.bot/best-practices/memory-bank — "Memory
  Bank"). Files build on each other "in a clear hierarchy"
  (https://github.com/cline/clinerules/blob/main/.clinerules/memory-bank.md —
  "Memory Bank Structure").

---

## 3. Glossary/term practices in real engineering organizations (first-party)

**Software Engineering at Google — ownership is what makes canonical docs survive.**

- The rule stated plainly: "Like code, documents should also have owners.
  Documents without owners become stale and difficult to maintain" — and when
  documents conflict, "designate *canonical* documentation: determine the
  primary source and consolidate other associated documents into that primary
  source" (Software Engineering at Google, ch. 10 "Documentation", by Tom
  Manshreck, "Documentation Is Like Code" section,
  https://abseil.io/resources/swe-book/html/ch10.html).
- The GooWiki case study is the worked example of glossary-style rot: "Because
  there were no true owners for documents, many became obsolete … duplicate
  documents and document sets began appearing" — and the fix: move docs into
  source control with "their own owners, canonical locations within the source
  tree, and processes for identifying bugs and fixing them"; "errors in the
  documents could be reported within our bug tracking software. Changes …
  handled using the existing code review process" (same source, "Case Study:
  The Google Wiki").
- The C++ style guide succeeded because a *named group* owned it: it "was
  owned by a select group of senior engineers (style arbiters) who managed it.
  The document was kept in good shape because certain people cared about it …
  The document was also canonical: there was only one C++ style guide" (same
  source, "Case Study: The Developer Guide Library"). Developer guides were
  later "managed" by technical writers, and "Engineers began logging bugs
  because they knew someone was maintaining these documents" (same source).
- Anti-rot is a recurring low-cost check with a named owner: "we often attach
  'freshness dates' to documentation … metadata in the documentation set will
  send email reminders when the document hasn't been touched in, for example,
  three months … `freshness: { owner: 'username' reviewed: '2019-02-27' }` …
  including the owner of a document in this freshness date within the document
  itself … led to increased adoption" (same source, "Deprecating Documents").

**OpenAI's fully agent-built product team — the knowledge base as system of record, mechanically enforced.**

- The one-big-file approach "failed in predictable ways", with the glossary
  relevant failure modes stated first-party: "**It rots instantly.** A
  monolithic manual turns into a graveyard of stale rules. Agents can't tell
  what's still true, humans stop maintaining it, and the file quietly becomes
  an attractive nuisance" and "**It's hard to verify.** A single blob doesn't
  lend itself to mechanical checks (coverage, freshness, ownership,
  cross-links), so drift is inevitable" (OpenAI Engineering, "Harness
  engineering: leveraging Codex in an agent-first world", 2026-02-11,
  https://openai.com/index/harness-engineering — "We made repository knowledge
  the system of record").
- Their fix: a short `AGENTS.md` as table of contents, a structured `docs/`
  directory as the system of record, and **mechanical enforcement plus a
  dedicated recurring agent**: "Dedicated linters and CI jobs validate that
  the knowledge base is up to date, cross-linked, and structured correctly. A
  recurring 'doc-gardening' agent scans for stale or obsolete documentation
  that does not reflect the real code behavior and opens fix-up pull
  requests" (same source, same section).
- The escalation rule: "When documentation falls short, we promote the rule
  into code" (same source, "Enforcing architecture and taste").

**Google developer documentation style guide — term-level governance rules.**

- Terminology is treated as decided, not assumed: "Terminology decisions,
  including how and when to define or contextualize terms, often require
  judgments based on factors like your product area, your audience, and
  prevailing convention" (Google developer documentation style guide, "Word
  list", https://developers.google.com/style/word-list).
- The guide's word list carries the equivalent of this repo's `_Avoid_` list,
  distinguishing "terms to never use and terms to avoid when possible", with
  documented redirects when a preferred term replaces another ("Added the
  term *rehost*. Redirected the definition for *lift and shift* to *rehost*")
  (https://developers.google.com/style/whats-new, entries dated 2026-10-16 and
  2024-03-21 — first-party change log of a maintained term list).
- Jargon must be defined at its point of use: "If jargon is necessary (e.g.,
  for SEO), define it clearly on first use or link to a trusted source" and
  "vaguely defined or overloaded terms like *solution*, *support*, or
  *workload*" are called out for avoidance or per-context definition
  (https://developers.google.com/style/jargon).
- One term per concept is a hard rule for a global audience: "Use consistent
  terminology. If you use a particular term for a concept in one place, then
  use that exact same term" and "Don't use the same word to mean different
  things"
  (https://developers.google.cn/style/translation — "Write for a global
  audience"; the developers.google.com equivalent page carries the same
  guidance).

**Standards bodies — how formal glossaries are structured and why.**

- The W3C's QA Framework (a W3C Recommendation) requires spec editors to
  "Define the terms used in the normative parts of the specification" because
  "English (like any other natural language) is ambiguous … defining the terms
  used in the normative parts promotes a common understanding that contributes
  to accurate implementation" (W3C QA Framework: Specification Guidelines,
  Requirement 5, §2.3.1, https://www.w3.org/TR/qaframe-spec/).
- It prescribes the paired practice — define at first use *and* consolidate:
  "Put the definition of any new term along with its first occurrence in the
  text, but make sure that all the definitions are also available from a
  central glossary section" (same source, Good Practice 9, §2.3.1).
- And it forbids redefinition drift: "When a definition for a term already
  exists … reuse the term and its definition without changing it …
  conflicting definitions for the same term lead to reduced interoperability"
  (same source, Good Practice 10, §2.3.1).
- The terminology profession's own standard: ISO 704:2022 "Terminology work —
  Principles and methods" "establishes the basic principles and methods for
  preparing and compiling terminologies … the links between objects,
  concepts, definitions and designations. It also establishes general
  principles for the formation of terms and proper names and the writing of
  definitions" — i.e., definitions are written by principle from concepts,
  not collected ad hoc (ISO catalog page for ISO 704:2022, Abstract,
  https://www.iso.org/standard/79077.html).

---

## 4. The pipeline pattern to mirror — this repo's tracker

**The two first-class pipelines the diagnosis compares against.**

- The tracker is one file per kind of open item, each kind with a definition,
  entry format, and closing rules owned by the `tracking` skill
  (`.opencode/skills/tracking/SKILL.md` L8–12, L14–23): `ask question → new
  conventions` runs through the Question kind, `encounter problem → new
  hazards` through the Hazard kind.
- The generic protocol is **classify, then decide: act now or record**:
  "1. **Classify it** against the kinds above and their close calls. 2.
  **Decide: act now, or record.** … 3. **Record it**, if that is the
  decision: Record in flight, while error text, versions, and exact inputs
  are still fresh … 4. **Return to the task.**" (`.opencode/skills/tracking/SKILL.md`
  L46–58). The item "is handled when it has either been dealt with or
  recorded in full, and the task has resumed" (L60–61) — recording never
  detains the working task.
- Hazard capture is explicitly in-flight and cheap-by-default: "Record it in
  flight. When in doubt, record: an entry is cheap, and a lost lesson is
  expensive" (`.opencode/skills/tracking/references/hazards.md` L5–7), with
  an entry form of When-it-applies / The-hazard / How-to-handle (L58–67) and
  a `Retired — <date>` closing line (L71–75).
- Question capture is *provisional-decide-then-track*: "If a defensible
  decision lets the task continue, make it, record it, and track the
  question"; "**Decided (provisional)** is load-bearing. When the answer
  lands, it is the only way to find the work built on the decision, and so to
  confirm or change it" (`.opencode/skills/tracking/references/questions.md`
  L8–13, L58–60).
- The **resolution route** is where the missing pipeline should dock: "When
  the answer lands … Fold it into the project where it belongs: when it
  settles what a term means, how something is done, or why the project is
  shaped a certain way, call the skill tool with `codifying` and record it.
  The answer lands in the project's records, not just in the tracker"
  (`.opencode/skills/tracking/references/questions.md` L25–29). `codifying`
  then routes a settled *meaning* to the glossary (`.opencode/skills/codifying/SKILL.md`
  L44–46).

**The newer engine-side precedent: collisions become tracked questions.**

- The convention-crash ruling (2026-10-26) is the closest in-repo model for
  what the term pipeline lacks: "Conventions must be shapeable over time …
  The in-flight agent that collides with them is the first-hand witness that
  the conventions as written are blocking the engine's operation in that
  context; the collision spawns an authority-kind question that reaches the
  user through the inbox, and the user's answer may be folded into the
  conventions as the resolution going forward" (`plans/plugin-transition.md`
  L241–249).
- The counterpart ruling for codifying's shape: "one skill, two arrival paths
  — discretionary rulings in interactive sessions, and resolving inbox
  questions spawned by convention crashes, folding the answers into
  conventions as the resolutions" (`plans/plugin-transition.md` L236–240).
- Inbox and tracker are "two jobs": the tracker is "the engine's internal
  record of what blocks work — questions tracked like bugs and tickets, so
  work does not grind to a halt while a resolution awaits"; the inbox is the
  send/receive channel, and "The reply returns through the inbox and lands on
  the tracker question as its resolution" (`plans/plugin-transition.md`
  L169–177).

---

## 5. Agent-role precedents for a dedicated knowledge/terminology discipline

**Zeroshot (the-open-engine): memory maintained by a dedicated postmortem — "workers never write lessons".**

- Zeroshot's Active Memory is a cross-run lessons store kept by a *separate
  postmortem step*, not by the working agents: "after the main graph settles,
  a postmortem maintains a lessons store (`lessons.sqlite3` …); matching is
  deterministic by file/folder/identifier/keywords with scores … at most
  `budgetBytes` (default 2048) of cards are injected per provider session …
  **Workers never write lessons.**" (`docs/guides/active-memory.md` @
  `main@eb899ad`, quoted in `docs/research/zeroshot-open-engine.md` L69; repo
  https://github.com/the-open-engine/zeroshot, commit
  `eb899ad4302e7929b60859b074fbc931a27a6a41`).
- Its admission is conservative and mechanism-driven, not initiative-driven:
  "two rejected rounds or two crashes qualify; no findings-quota" — worth
  copying (`docs/research/zeroshot-open-engine.md` L110, summarizing the same
  source).

**OpenAI's harness engineering: a recurring dedicated doc-gardening agent.**

- Knowledge maintenance is a *recurring named background job with its own
  output channel*: "A recurring 'doc-gardening' agent scans for stale or
  obsolete documentation that does not reflect the real code behavior and
  opens fix-up pull requests", alongside mechanical linters/CI for coverage,
  freshness, ownership, and cross-links (https://openai.com/index/harness-engineering
  — "We made repository knowledge the system of record"). The same post
  describes background Codex tasks on "a regular cadence" that "scan for
  deviations, update quality grades, and open targeted refactoring pull
  requests" ("Entropy and garbage collection").

**Claude Code and Codex: dedicated, non-interactive extraction passes.**

- Claude Code auto memory is a first-party shipped instance of a
  non-interactive memory writer: notes "Claude writes itself based on your
  corrections and preferences", stored per-repo, with an index budget and a
  stale-merge instruction — and it is not the interactive agent's incidental
  habit but a separately documented mechanism (https://docs.anthropic.com/en/docs/claude-code/memory
  — "CLAUDE.md vs auto memory", "Auto memory"). Subagents can each maintain
  their own auto memory (same page).
- Codex memory generation likewise runs as a background pass gated on chat
  idleness, not during the work: "updates memories in the background instead
  of immediately at the end of every chat … waits until a chat has been idle
  long enough" (https://developers.openai.com/codex/customization/memories —
  "How local Codex memories work"). A distinct model can even be assigned to
  the job (`memories.extract_model` / `memories.consolidation_model`, same
  page, "Configure local memories").

**This repo's own settled plan already provides the role machinery.**

- "Context is role-shaped: settled — a skill loaded into an agent implies
  that agent holds its responsibility. The new system must give each engine
  agent measured, precisely tailored context, never excessive and diverse
  context" (`plans/plugin-transition.md` L283–290). Under this ruling, the
  glossary discipline cannot be ambient; it must sit on a named role.
- The map already has named helper types with their own job descriptions —
  reviewer, inbox answerer, fact-finder, builder (`plans/plugin-transition.md`
  L146–162) — and OpenCode's agent machinery supports programmatically
  invoked, hidden subagents with per-role permissions (https://opencode.ai/docs/agents/
  — "Hidden", "Permissions"). A glossary-custodian helper is the same shape,
  not a new kind of thing.

---

## Design implications (priority order)

1. **Make `learned term → glossary entry` a first-class tracked pipeline, not
   a habit.** Give terms a tracker-kind-style home (entry definition, format
   reference, closing line, in-flight capture rule), exactly as hazards and
   questions have — the diagnosis's own contrast says the tracker's pipelines
   are "first-class" while the glossary path "was treated as its own separate
   thing with no point in the workflow designated for it" (`plans/plugin-transition.md`
   L222–226); the tracker's decide-now-or-record protocol (`.opencode/skills/tracking/SKILL.md`
   L46–61) and hazards' "record in flight; when in doubt, record"
   (`.opencode/skills/tracking/references/hazards.md` L5–7) are the shape to
   copy. Evidence that absence has a cost: the new vocabulary has "nobody who
   graduates those terms into the glossary" (`docs/research/coverage-matrix.md`
   L36) and the inbox collision "needs a glossary decision" that no record
   confronts (`docs/research/fog-audit.md` L414–419).

2. **Anchor the capture trigger on collisions and repeats, not on the
   user saying something.** The evidence for a designated *moment*: the
   convention-crash ruling makes "the in-flight agent that collides with
   them … the first-hand witness", converting the collision into a tracked
   question and then a resolution in the records (`plans/plugin-transition.md`
   L241–249; codifying's two arrival paths, L236–240). Claude Code's
   documented trigger for durable context is likewise repetition — "the same
   mistake a second time" (https://docs.anthropic.com/en/docs/claude-code/memory
   — "When to add to CLAUDE.md") — and W3C requires defining a term at its
   first normative use (https://www.w3.org/TR/qaframe-spec/ — Requirement 5,
   GP9). The term candidate is a *learned term event*: an engine agent or
   interactive session hits an undefined, overloaded, or glossary-conflicting
   term mid-work, files the candidate, and returns to the task — the tracker
   protocol, applied to vocabulary.

3. **Ownership must be a named role, not shared ambient responsibility.**
   This repo already ruled it: context is role-shaped, so a loaded
   discipline "implies that agent holds its responsibility" (`plans/plugin-transition.md`
   L283–290). Every surviving external precedent gives the knowledge
   discipline a dedicated non-generalist owner: zeroshot's postmortem —
   "workers never write lessons" (`docs/research/zeroshot-open-engine.md`
   L69); OpenAI's recurring doc-gardening agent (https://openai.com/index/harness-engineering);
   Google's style arbiters and tech-writer-owned guides — documents "without
   owners become stale" (https://abseil.io/resources/swe-book/html/ch10.html);
   Claude/Codex's background memory passes (docs cited in §5). The glossary
   needs a dedicated helper — a recorder/terminologist agent in the chain (or
   a dedicated engine job) whose only job includes sweeping term candidates
   into entries — not a reminder carried by the builder and the interactive
   agent.

4. **Separate the canonical glossary from recall memory, and make the
   glossary rules-only.** Codex states the layering rule exactly: "Keep
   required team guidance in AGENTS.md or checked-in documentation. Treat
   memories as a helpful recall layer, not as the only source for rules that
   must always apply" (https://developers.openai.com/codex/customization/memories);
   Claude Code splits "instructions and rules" (human, canonical) from
   "learnings and patterns" (Claude, machine-local) (https://docs.anthropic.com/en/docs/claude-code/memory);
   this repo's own `codifying` says rulings "belong to the user" and a term
   waits "in the questions tracker until the user settles it"
   (`.opencode/skills/codifying/SKILL.md` L17–18;
   `.opencode/skills/domain-modeling/references/glossary-format.md` L15–16).
   So `GLOSSARY.md` must only ever change through the settled-term pipeline
   (user ruling or answered authority question), never through ambient
   agent memory writes; a candidate that cannot be settled goes to the
   tracker with a provisional reading, per the question kind
   (`.opencode/skills/tracking/references/questions.md` L8–13).

5. **Enforce it mechanically; the monolith's rot is a verification failure.**
   OpenAI's first-party failure list for a single instruction blob: "It rots
   instantly … Agents can't tell what's still true, humans stop maintaining
   it" and "It's hard to verify. A single blob doesn't lend itself to
   mechanical checks (coverage, freshness, ownership, cross-links), so drift
   is inevitable" — fixed with "dedicated linters and CI jobs" plus the
   doc-gardening agent (https://openai.com/index/harness-engineering). Google
   keeps docs alive with per-document `freshness: { owner, reviewed }`
   metadata (https://abseil.io/resources/swe-book/html/ch10.html); Claude Code
   ships an audit command for exactly this (https://docs.anthropic.com/en/docs/claude-code/memory
   — "Audit your instruction files"); this repo already runs `node
   scripts/validate.mjs` as a mechanical gate (`AGENTS.md` publishing rule 1;
   `CONTRIBUTING.md` L9). Practical shape: the glossary entry format gains
   owner/date fields, and the linter (or a plugin check) flags terms with no
   inbound reference, undefined vocabulary used in shipped docs, and stale
   `_Avoid_` redirects — the glossary's equivalent of the tracker's closing
   lines.

6. **Keep the entry-level anti-rot format the standards prescribe, and wire
   the workflow point into the review/gate boundary.** The existing format
   machinery — in-place refinement, retired term → `_Avoid_`, `## Flagged
   ambiguities` as history, self-referencing definitions
   (`.opencode/skills/domain-modeling/references/glossary-format.md` L34–57)
   — matches W3C GP10 (reuse terms without changing definitions) and ISO
   704's principles-based definition writing (https://www.iso.org/standard/79077.html).
   The candidate sweep belongs at the typed boundaries where work already
   pauses: the reviewer's verdict report and the stage hand-offs, which carry
   "only typed essentials" and never raw chat (`plans/plugin-transition.md`
   L335–340) — the same places Cline's Memory Bank protocol places its update
   points (https://docs.cline.bot/best-practices/memory-bank) and zeroshot
   places its postmortem (after the graph settles,
   `docs/research/zeroshot-open-engine.md` L69).
