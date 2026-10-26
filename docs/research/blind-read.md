# Blind read: the plugin-transition record as a spec-writer sees it

Written against exactly two files, nothing else:

- `plans/plugin-transition.md` (the map)
- `tracker/QUESTIONS.md`

Everything below is either what those records state, or — in the
"I had to guess" section — what this reader had to invent to fill the
gaps. The point of this document is to catch every gap before a spec is
written on top of it.

---

## The reconstruction

This is the complete system the two records describe, assembled as one
plain-language account. It is my best interpretation; where it is more
interpretation than record, it is marked in the next section.

**The package.** The girth-agents catalog — skills, commands, and agents,
all plain Markdown — becomes an OpenCode plugin. The Markdown is bundled
into the plugin, and the plugin's `setup()` registers exactly those files
through OpenCode's skill/command/agent transforms. Nothing is converted to
code unless something actually needs to trigger on it programmatically.
The plugin's package file and code live at the repo root, beside the
catalog and the project records; installs point at the repo with no extra
path segment.

**Distribution.** No package store. Users point OpenCode straight at the
GitHub repo to load the plugin, and OpenCode's own plugin-update keeps
installs current. A release is a tag on the repo; each tag also gets a
GitHub Release page carrying that release's changelog section (minus the
old one-line install line, whose audience is gone). The repo is both the
workshop and the thing people install. The old end-user install script and
its channel retire; the builder-side machinery — the catalog checker and
the test harnesses — stays, as candidates to become plugin tools later.
OpenCode V1 is out of scope.

**Bootstrapping.** The engine only ever operates in a project where it has
been *started*, and starting happens through the `/bootstrap` command —
the on-switch, necessary so the always-awake engine doesn't scatter files
wherever the working directory happens to be. The bootstrap run is
command-initiated and synchronous: it creates the project's management
scaffold eagerly and programmatically, deriving everything the project can
state. The few residual asks — name, purpose, license when undeclared, a
starting version when nothing states one, and the gh install as an action —
are asked right there in the same session, because at that moment the user
is present, the engine is not yet alive, and there is no inbox to send
anything to.

**The engine.** The engine lives in the plugin and is always awake,
watching on its own and advancing ready work even between user messages,
on a strict leash: it touches only work it made itself and files an agent
has cleared. Its working loop continuously seeks inputs prepared to become
outputs. Mechanically it can spawn fresh OpenCode sessions and pass
information between them — the substrate of the production chain — with
heavy inspiration from zeroshot's the-open-engine (shelling out to
`opencode run` with JSONL events), while rejecting zeroshot's four
clashing assumptions. Between stage sessions only typed essentials travel:
the brief compiled from the records, the checklist, and the verdict with
its report — raw chat never carries over. Session scope: every stage runs
fresh; the builder keeps its session across fix-rounds (with
lost-session detection and recovery); the checker is always fresh. The
loop's discipline is enforced in code, not by the model: a cap on
fix-rounds and a time limit per step.

**The boundary.** The entry-point tool is the system's one door. It is as
generic a parser as possible: pointed at a file, it decides whether the
file is a valid entry point and incorporates its contents into the chain
its kind calls for; anything invalid, or malformed in a way the parser can
catch, is rejected loudly. Running the tool on a file is the clearance act
itself — a file the tool has never been pointed at stays out of the
engine's hands. The plan from an interactive wayfinding session is the
only outside document the tool accepts. Everything the engine's embedded
agents produce downstream — reviewed plans, specs, tickets, work, and
their reports — stays inside the boundary and never crosses the tool.
Wayfinding ends by the agent running the entry-point tool on the map/plan
file at the user-confirmed conclusion; the plan approval there is the
user's one approval stop in the whole chain.

**The chain and the review gate.** Downstream stages cascade: specifying
against the plan, slicing against the spec, implementing against the
tickets. Every stage's output passes a PASS/FAIL review before the next
stage consumes it; wayfinding is the ungated entry. One builder — a single
named helper agent — does every stage's building, pointed at each brief in
turn; the stage differences live in the briefs and skills, not in separate
agents. There is no separate fixer: the builder repairs its own FAILed
piece from the report, keeping its session across fix-rounds. The checker
is a named reviewer agent type with its own job description: the engine
points it at finished work, it grades against the checklist and writes the
PASS/FAIL report. The engine compiles that checklist straight from the
earlier approved document (plan for the spec, spec for the tickets,
tickets for the work); the ungated entry's criteria come from the session
content and project context. The cycle itself — send in the reviewer, read
the verdict, return the work for fixes on FAIL, repeat until PASS — is a
hard tool in the plugin's code. Graded reports live in their own pile in
each project (a new scaffold piece), and the verdict is also stamped on the
checked work, so the engine and the sidebar read one place. After a stage
PASSes, work proceeds on its own: the old per-stage approvals fold into
the gate.

**The helpers.** The engine's agent roster has four named types: the
checker (reviewer), the inbox answerer, the fact-finder, and the one
builder (which also repairs). The fact-finder acquires answers for
information-kind tracked questions and, like every engine-dispatched agent,
is built never to fabricate — it fails openly, reporting "could not
acquire" rather than inventing an answer; when the failure is not itself
the answer, the question reaches the user. Authority-kind questions reach
the user, period.

**The tracker.** The tracker is the engine's internal record of what blocks
work: questions get tracked like bugs and tickets so work doesn't grind to
a halt awaiting a resolution. Each tracked question declares its kind —
authority (answerable only by the user) or information (answerable by the
user or by an agent that acquires it). A question that needs the user is
sent through the inbox by reference, never copied; the reply returns
through the inbox and lands on the tracker question as its resolution.

**The inbox.** The inbox is the system's asynchronous send/receive channel
with the user — not a view over the tracker. It is its own TUI screen (no
longer a pseudo-mode toggled by a command): reached by a command and by
the command palette (Ctrl+P), visually an email inbox, items sorted in
received order, scrollable and selectable. Items are formal records the
engine writes and recognizes; informal, non-deterministic gleaning of
items from chat is gone. Opening an item enters a new chat session seeded
with the message, run by the inbox answerer helper, which poses the
question, discusses, and records the user's response; the recorded reply
lands on the inbox message, the engine picks it up, writes the resolution
onto the tracker question, and drives the work forward. The inbox keeps
its own message log — the requests it sent and the replies received —
because that's communication, not tracking. The old helpers retire:
`curate-inbox` and `/close-inbox`; every old job has a new home and the
answering helper's know-how lives in its own definition.

**The sidebar.** The TUI's right-hand panel is the sidebar, addressed
through the CLI plugin's `sidebar.content` slot (a package ships a `./tui`
export beside its server export — one package, two entries; CLI-only
plugins configure separately in `cli.json`; plugin routes register whole
screens through the TUI router; the menu is the command palette, Ctrl+P —
Escape is interrupt, not a menu). The sidebar displays `Inbox: {n}`, the
number of items waiting in the user's inbox for the current project, plus
a breakdown of the engine's pieces in motion — being built, under review,
sent back for repair — read from the records, never hand-written; idle or
queued-but-unpicked pieces stay off the list. It is analogous in form to
OpenCode's experimental todo lists, except ours is the system's
engine-driven work rather than one agent's private per-session tasks.

**The two flows.** The user interfaces with the system through two
formally accounted workflows. The pro-active flow: the user provokes the
system into re-action — concretely, a session that wayfinds to a plan and
clears it through the entry-point tool; when more than one plan is
cleared, they queue in received order. The re-active flow: the system
provokes the user into re-action — when the system needs information or
action, the request reaches the user through the inbox.

**Testing.** A committed automated harness drives the real pieces — the
parser, the review loop, session spawning, the inbox record, the TUI slot —
each exposed at a testable seam, with assertions that map to trust, not
green theater. It gates merges to main with no manual step, and releases
are tagged only from a green main. It is seeded from the existing
harnesses (`scripts/validate.mjs`, `scripts/test-installer.sh`,
`scripts/test-wizard.sh`). The catalog's `test-driving` skill is re-scoped
into the broad practice of testing changes in real cases, and it teaches
and drives the plugin's own testing system.

**Item-level changes folded in.** `writing-for-agents` becomes
`technical-writing` (a plain rename); `tdd` becomes `test-driving` (rename
plus broad re-scope) — the renames must land as one atomic change because
the linter fires mid-rename. `find-skills` and `/wait-what` are removed
along with their README surfaces. `/slice` survives as the thin door that
starts the slicing skill; the procedure moves into the skill's body.
Handoff, pickup, and `/retro` are shelved: kept privately in the repo, out
of the plugin's shipped surface, their retirement re-judged once the
engine has proved out the replacement.

**The destination.** One umbrella spec covering all five areas, written as
one coherent set and approved once; the `decisions/` record is written
first and the spec references it. Building and slicing are the next
effort and begin only after approval.

---

## I had to guess

Numbered, each entry: the guessed reading, the record locations that
forced the guess, and the single clarifying sentence that would have
resolved it.

1. **The entry-point tool's surface and name.** I guessed it is a plugin
   tool — invocable by the engine and by agents, not something the user
   types as a slash command — but the records never name it or say how it
   is invoked. Locations: map "The entry-point tool: declared"
   (~L269–276), "Wayfinding's ending" (~L277–279), "Entry points are the
   clearance" (~L150–154), "The boundary's one door" (~L139–142);
   QUESTIONS "Entry points — how outputs and cleared products are marked"
   (L309–326). Clarifying ask: "What is the entry-point tool's exact
   surface in the plugin — its name, who invokes it, and does the user
   ever run it directly?"

2. **"The session's content and project context"** (the wayfinding gate's
   criteria). *Assumed-knowledge phrase from the task brief.* I guessed
   the checklist for reviewing the cleared plan is compiled from (a) what
   the wayfinding session decided — as recorded in its records, not raw
   chat, since raw chat never crosses stages — plus (b) the project's
   existing records (decisions, tracker), and that someone compiles it
   around the moment the plan is cleared. Locations: map "Not yet
   specified — The review gate" ("criteria from session content and
   project context", ~L350–351); map "Hand-offs" ("raw chat never carries
   over", ~L157–161); map "Criteria" (~L170–173). Clarifying ask: "What
   concretely supplies the plan-review checklist, who compiles it from
   the wayfinding session, and where is it stored?"

3. **Whether the plan itself is gated.** Two readings are possible:
   wayfinding is the ungated entry, but the parenthetical grants the entry
   criteria — so does the plan pass through its own PASS/FAIL gate after
   the tool accepts it, or flow straight to specifying? I guessed it does
   get its own first review (checker, checklist as in #2), because the
   entry is granted criteria and the gate is said to apply to "every
   stage's output". Locations: map "Review gate" (~L280–284), "Not yet
   specified — The review gate" (~L347–362), "Checkpoints" (~L93–97).
   Clarifying ask: "Does the wayfinding-cleared plan pass through its own
   checker gate before specifying consumes it, and is its FAIL path the
   same builder-repair loop?"

4. **"Typed essentials" and their shapes.** *Assumed-knowledge phrase from
   the task brief.* I know only the three names — the brief compiled from
   the records, the checklist, the verdict with its report — and nothing
   of their forms or homes. I guessed: the brief is a structured-or-Markdown
   record the engine/builder compiles pointing at the input records; the
   checklist is a list of checkable criteria; the verdict is a stamped
   PASS/FAIL marker plus a report in the pile (#5). Locations: map
   "Hand-offs" (~L157–161); QUESTIONS "Session hand-off payload" (L98–114:
   "the typed shapes themselves are pinned in the spec"). Clarifying ask:
   "Are the brief and checklist free-form documents or structured
   records, and where exactly does each live in the scaffold?"

5. **"The report pile."** *Assumed-knowledge phrase from the task brief.*
   No name, no path, no entry format. I guessed a top-level per-project
   directory added to bootstrapping's inventory, one entry per reviewed
   artifact keyed to the artifact, holding at least the verdict and the
   report. Locations: map "Reports' home" (~L166–169); QUESTIONS "Review
   loop — where graded reports live" (L354–372: "the piece needs an owning
   skill and a bootstrapping-inventory row — done with the spec").
   Clarifying ask: "What is the report pile called, where does it live,
   and what does one graded entry contain?"

6. **"Started projects" and the bootstrap scaffold inventory.**
   *Assumed-knowledge phrase from the task brief.* The records say the
   engine runs only in started projects and that bootstrap creates "the
   scaffold", but never enumerate the scaffold pieces. From scattered
   mentions (plans/, specs/, tracker/, decisions/, plus the new reports
   pile) I guessed bootstrap lays down the management scaffold:
   decisions/, plans/, specs/, tracker/, reports/ — with conventions
   derived from project signals. Locations: map "The start switch"
   (~L58–63), "Bootstrapping: declared" (~L252–256); QUESTIONS "Eager
   bootstrapping" (L240–264). Clarifying ask: "What is the complete
   scaffold inventory `/bootstrap` lays down per project, and which
   pieces are optional or derived?"

7. **The engine's mechanics and scope.** The records settle that the
   engine is awake, leashed, and spawned-session-capable, but the
   question record explicitly leaves "the engine's scope" open while the
   map says started-projects-only. I guessed one engine working set per
   started project, bounded to the working directory where `/bootstrap`
   ran (multiple projects = one started project at a time), implemented
   as the plugin's runtime reacting to session events and shelling out to
   `opencode run` — with the event catalog and `session.idle` payload
   explicitly unverified. Locations: QUESTIONS "The engine and the
   entry-point tool — mechanics" (L328–352); map "The engine is awake"
   (~L146–149), keystones list (~L42–47); QUESTIONS "Zeroshot
   inspiration" (L116–144). Clarifying ask: "Is the engine's working set
   exactly the one started project in the current working directory, and
   which OpenCode events does it react to?"

8. **How "being built" vs "queued-but-unpicked" is recorded.** The sidebar
   shows only pieces in motion, derived from records, never hand-written —
   but no record described in these files marks a piece as "being built".
   I guessed stage artifacts carry lifecycle status markers stamped by
   the engine or agents (like the tracker's closing lines and the stamped
   verdicts), and the sidebar derives being-built / under-review /
   sent-back-for-repair from those markers, the report pile, and ticket
   states. Locations: map "Sidebar's ongoing work" (~L124–128); QUESTIONS
   "Sidebar ongoing-work breakdown" (L167–185: "the exact derivation from
   the report pile and ticket states is spec detail"). Clarifying ask:
   "Which exact records or stamped markers distinguish being-built,
   under-review, and sent-back-for-repair from queued, and who writes
   them?"

9. **"The gh install as an action"** (bootstrap whitelist). I guessed this
   means: during the synchronous bootstrap, creating the GitHub remote
   repository (via the `gh` CLI) is offered as one of the residual action
   asks — an action the user confirms rather than a question answered
   with data. Locations: map "Not yet specified — Eager bootstrapping"
   (~L326–331): "the gh install as an action". Clarifying ask: "What
   exactly is 'the gh install as an action' in the bootstrap whitelist?"

10. **The cleared-plans queue and its home.** Multiple cleared plans
    "queue in received order", but nothing says where the queue lives or
    what consumes it. I guessed an engine-internal per-project state
    record (possibly in `ctx.storage` — itself an unverified keystone),
    consumed one entry at a time through the chain. Locations: QUESTIONS
    "Pro-active flow" (L266–284); map "The boundary's one door"
    (~L139–142); keystones list (`ctx.storage` durability, ~L44).
    Clarifying ask: "Where does the queue of cleared plans live, how
    durable is it across restarts, and what consumes it?"

11. **"Criteria compiled from the upstream document" — by whom, into
    what.** *Assumed-knowledge phrase from the task brief.* "The engine
    compiles" the checklist, but a natural-language plan doesn't compile
    itself. I guessed an extraction step — either an agent (part of the
    brief-compiling work) or a transform — that turns the approved
    document's requirements into the checklist the checker receives, done
    at gate entry for each stage. Locations: map "Criteria" (~L170–173);
    QUESTIONS "Review loop — the mechanism" (L374–402). Clarifying ask:
    "Who or what extracts the checklist from the approved upstream
    document — the checker, the builder's brief, or engine code — and is
    the checklist a file the checker reads?"

12. **How the engine notices an inbox item has been answered.** The reply
    "lands on the inbox message" and the engine "picks it up"; the wake-up
    trigger is undescribed. I guessed the answerer writes the reply into
    the inbox record, and the engine — on its next scan or by event —
    stamps the resolution onto the referenced tracker question and
    unblocks the waiting work. Locations: map "The inbox answerer"
    (~L120–123); QUESTIONS "The inbox answering session" (L48–65),
    "The inbox item's home and form" (L187–220). Clarifying ask: "What
    event or marker tells the engine an inbox item has been answered so
    it can resolve the tracker question?"

13. **The inbox screen's command and menu path.** I guessed the opening
    command is `/inbox` and the palette path is Ctrl+P — but one sentence
    in QUESTIONS says the screen is "opened via command or Escape menu",
    which contradicts the map's TUI facts ("Escape is interrupt, not a
    menu"). I trusted the map. Locations: QUESTIONS L202–203 ("command or
    Escape menu") vs map "TUI facts" (~L30–35); map "Inbox items"
    (~L235–238: "`/inbox` initiates the re-active workflow"). Clarifying
    ask: "Is `/inbox` the screen's command, and is Ctrl+P the only menu
    path — with Escape definitively not a menu?"

14. **Fact-finder dispatch boundaries.** "The engine sends its own help"
    (the fact-finder, per the QUESTIONS note equating the two) for
    information-kind questions — but "when it can", and what "failure not
    itself the answer" means, are open. I guessed: dispatch for every
    information-kind question when work is otherwise unblocked; a
    definitive negative finding (the information doesn't exist or isn't
    anywhere) counts as the answer, while "could not acquire" (tool
    limits, no source reachable) escalates to the user's inbox. Locations:
    map "Information-kind dispatch" (~L64–67); QUESTIONS "Information-kind
    questions" (L146–165). Clarifying ask: "When exactly may the engine
    dispatch the fact-finder, and which acquisition failures count as
    answers versus escalations to the inbox?"

15. **The release machinery's hands.** Releases are tags plus GitHub
    Release pages, but nothing in these records says who performs the
    tagging or generates the notes — `/cut-release` re-scoping is
    discussed but never settled as a space. I guessed a maintainer-side
    command (in the maintainer's global config, not published in the
    plugin) tags from green main, pulls the changelog section, and
    publishes the GitHub Release page. Locations: map "Release notes"
    (~L85–88); QUESTIONS "Installer and release machinery" (L466–489).
    Clarifying ask: "Which command or agent produces the tag and the
    GitHub Release page, and does it live in the plugin or
    maintainer-side?"

16. **The plugin's total tool/code inventory.** The records settle four
    agent types and a few hard tools (the review-cycle driver, the
    entry-point tool, the TUI slot) but say "anything else hangs off the
    change cloud" — and the change cloud is chat history, not these
    records. So the full plugin surface is uncountable from here. I
    guessed it is at least: entry-point tool, review-cycle tool, sidebar
    slot, `./tui` entry, and possibly the catalog checker and harnesses
    as plugin tools. Locations: map "Not yet specified — Agent types"
    (~L373–376), "The installer/release machinery" (~L369–372);
    QUESTIONS "The change cloud" (L424–443). Clarifying ask: "What is the
    full inventory of plugin tools and code beyond the four agent types
    and the entry-point tool?"

17. **"The engine sends its own help."** I guessed this means: the engine
    dispatches the fact-finder agent type — equating "help" with the
    fact-finder, on the strength of the later QUESTIONS note that "that
    help is now a named fact-finder agent type — the third named
    helper". Locations: map "Information-kind dispatch" (~L64–67);
    QUESTIONS L164–165. Clarifying ask: "Is 'its own help' exactly the
    fact-finder agent, and if so can the map be worded to name it?"

18. **How the shelved trio stays out of the plugin while the repo is the
    plugin.** Handoff/pickup/`/retro` are "kept privately in the repo" —
    but the repo is the thing people install, and the plugin's setup
    registers skills from it. I guessed the shelved skills remain as repo
    files (usable in the dev workspace) but are excluded from the
    plugin's bundle/registration list. Locations: map "Handoff's shelf"
    (~L181–184), "`/retro`: shelved" (~L82–84), "Handoff and pickup:
    shelved" (~L239–244); QUESTIONS L222–238. Clarifying ask:
    "Mechanically, how are the shelved skills excluded from the plugin's
    shipped surface while the files stay in the repo?"

19. **What `opencode plugin update` tracks.** The records say updates
    come "from the repo" and releases are tags, but not whether updates
    track the latest release tag or main's HEAD, or whether users can
    pin. I guessed update follows the repo (tags being the release
    points), with the exact tracking left to OpenCode's own plugin
    update behavior. Locations: map "The channel" (~L197–200); QUESTIONS
    "The channel" (L444–464). Clarifying ask: "Does plugin update track
    the latest release tag or main HEAD, and can users pin a version?"

20. **Which project signals bootstrap derives from.** "Everything
    derivable from the project" — I guessed identifier fields (name,
    purpose, version, license) come from existing declarations (package
    or equivalent metadata, README, LICENSE file, git remote) and that an
    empty project yields all of them as residual asks. Locations: map
    "Bootstrap is synchronous" (~L76–81), "Eager bootstrapping — settled
    in shape" (~L326–331). Clarifying ask: "Which project files or
    signals does bootstrap read to derive the identifier fields, and what
    does it do in a completely empty project?"

---

## Internal inconsistencies (a pure reader's view)

1. **Two menus.** QUESTIONS says the inbox screen is "opened via command
   or Escape menu" (L202–203); the map's TUI facts say the menu is the
   command palette (Ctrl+P) and "Escape is interrupt, not a menu"
   (~L30–35). A reader taking both seriously cannot say how the screen is
   reached.

2. **"Not yet specified" is stale against "Decisions so far."** Several
   items the map still lists as open have a settled decision on the same
   page, and vice versa — a spec-writer can't tell what's left to decide:
   - Testing system: listed open/tracked (~L295–300) but settled
     2026-10-26 (~L102–106) and answered in QUESTIONS (L27–46).
   - Sidebar ongoing-work: listed open ("what counts and what it reads",
     ~L312–317) but settled (~L124–128) and answered (L167–185).
   - Information-kind dispatch: listed as an open lead (~L305–311) but
     settled (~L64–67) and answered (L146–165).
   - The two flows' mechanics: listed open — what counts as pro-active,
     how requests land, the inbox item's home and form (~L332–341) — but
     all three are settled (~L129–142) and answered in QUESTIONS
     (L266–307).

3. **"The engine sends its own help" vs "the fact-finder."** The map's
   settled decision (~L64–67) never names the helper doing the
   information-kind answering; only a QUESTIONS footnote (L164–165)
   equates "that help" with the fact-finder. A reader of the map alone
   either misses the fact-finder's role or invents a fifth agent. (See
   guess #17.)

4. **The channel facts read against the channel decision.** The map's
   "Facts the map leans on" says "package plugins publish to npm and
   install/update/check through `opencode plugin`" (~L26–28) right beside
   a settled decision of no package store with git-spec install
   (~L197–200). Not a contradiction — the facts describe available
   machinery, the decision picks the git path — but the facts sentence is
   written as if it describes this plugin, and a hasty reader would read
   the npm machinery as live.

5. **"The fixing agent" wording.** The 2026-10-25 session-scope decision
   says "every stage runs fresh; the fixing agent keeps its session"
   (~L155–157), phrasing that implies a distinct fixer; the later ruling
   is explicit that there is no separate fixer — the builder repairs
   (~L111–115). Reconcileable, but the earlier bullet's wording is stale
   against the settled roster.

---

## Assumed knowledge (phrases that don't define themselves)

Each of these reads as if the reader already knows the referent; my
guessed meaning is in the guess list under the matching number.

- **"the session's content and project context"** (map ~L350–351) — the
  plan-review criteria's source. Guess #2.
- **"typed essentials"** (map ~L157–161; QUESTIONS L98–114) — the
  brief / checklist / verdict-with-report hand-off payloads. Guess #4.
- **"the report pile"** (map ~L166–169) — the new per-project scaffold
  piece for graded reports. Guess #5.
- **"started projects"** (map ~L58–63, L342–346) — projects where
  `/bootstrap` has run and the engine is authorized. Guess #6.
- **"criteria compiled from the upstream document"** (map ~L170–173) —
  the engine's checklist derivation at each gate. Guess #11.

Additionally, the map leans on three cited research notes in
`docs/research/` (engine mechanics; TUI + distribution; repo grounds) that
are not among the two records given — e.g., the wiring of transforms,
routes, sidebar slots, and the sweep lists. Every "fact the map leans on"
is, from a spec-writer's chair with only these two files, unverifiable
borrowed knowledge.