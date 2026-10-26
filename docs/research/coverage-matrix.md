# Decision-coverage matrix — catalog → OpenCode plugin

Does the transition map say what happens to every current catalog item — and
to every piece the new system introduces? This matrix checks the map decision
by decision.

**Sources.** `plans/plugin-transition.md` ("the map", cited as `map L<range>`
with 1-based line numbers); `tracker/QUESTIONS.md` (cited as `Q "…"` by
entry title); current inventory from `docs/research/repo-ground-survey.md`
(the survey). Written read-only; the sweep lists in the survey's §6 remain
unapplied until implementation, as the map says.

**Statuses.**

- **Decided** — the map (or an answered question it incorporates) records
  what happens to the item.
- **Partially decided** — the map decides parts of the item's world, but
  the item's own fate is not on record.
- **Untouched** — the map never names the item; nothing about its fate is
  recorded.
- **Placed / Homeless** (cross-cutting pieces only) — a decided home and
  carrier, versus a decided role with no decided home or owner.

---

## 1. Skills — 21 of 21

| Skill | Status | On record |
| --- | --- | --- |
| `bootstrapping` | Decided | Start-switch ruling (`map L58–63`) + "Bootstrap is synchronous" (`L76–81`) + "Bootstrapping: declared" (`L252–256`): stays, becomes eager and programmatic, runs synchronously in the starting session; the residual-ask whitelist is spec detail (`L326–331`). |
| `codebase-design` | Untouched | Currently: the deep-modules craft (`references/deepening.md`, `design-it-twice.md`) — how to shape interfaces and find seams. Raised: the engine's own parts (parser, review loop, report pile) are the first modules the plugin itself must design, and no decision says whether the craft carries them or stays a user-facing skill. |
| `code-review` | Untouched | Currently: interactive review of a branch/PR along Standards × Spec. Raised: the map settles a *reviewer agent type* that grades engine work (`L177–180`), with no decision separating or aligning the human review craft from the engine's grader — a name and role overlap left unresolved. |
| `codifying` | Untouched | Currently: owns the `conventions/` and `decisions/` formats. Raised: the map's destination is itself a new `decisions/` record and the report pile is a new scaffold piece, but no decision says codifying rules the plugin's ruling records or the new piece's conventions. |
| `curate-inbox` | Decided | "The old inbox helpers" (`map L89–92`; `Q "The old inbox helpers"` answered 2026-10-26): retires — every old job has a new home (the screen, the answering helper, the engine picking up answers). |
| `diagnosing-bugs` | Untouched | Currently: finds hard bugs through a tight, red-capable reproduction loop and locks the fix with a regression test. Raised: the engine's builder now repairs its own FAILs from the report (`L111–115`); no decision says whether the interactive diagnosing craft survives as the user-facing path to the same loop. |
| `domain-modeling` | Untouched | Currently: owns `GLOSSARY.md` and sharpens the domain model. Raised: the map imports a whole new vocabulary (engine, entry points, review loop, inbox messages) and records nobody who graduates those terms into the glossary. |
| `find-skills` | Decided | "`find-skills` and `/wait-what`: dead" (`map L245–247`): removed from the catalog; its README rows and off-the-spine line go with it. |
| `grilling` | Untouched | Currently: interviews the user round by round against a decision tree's frontier. Raised: questions now reach the user asynchronously through the inbox with the answering helper running each session (`L120–123`); no decision says whether the synchronous grilling craft survives beside that channel. |
| `handoff` | Decided | "Handoff's shelf" (`map L181–184`) + "Handoff and pickup: shelved" (`L239–244`): out of the plugin, kept privately in the repo; retirement lands later, once the engine proves the replacement. |
| `implementing` | Partially decided | Decided: the implementing *stage* sits in the gate chain — reviewed against the tickets (`L347–362`); its `tdd` and `/slice` references are re-pointed (`L249–251`, `L363–365`). Open: whether the skill itself survives as a user-invokable catalog item now that the builder helper performs the implementing stage inside the engine (`L107–110`). |
| `maintaining-docs` | Untouched | Currently: owns `AGENTS.md`, `CONTRIBUTING.md`, `README.md`, `CHANGELOG.md`. Raised: the map rewrites the release story — tags plus GitHub Release pages, the install-doc surface dies (`L85–88`, `L193–199`) — but never names this skill, leaving its release-notes and install-doc roles unrecorded. |
| `prototyping` | Untouched | Currently: throwaway state-machine and UI-variant demos. Raised: the inbox screen and sidebar breakdown are exactly the surfaces a prototype would de-risk before building, but no decision says the craft carries into the plugin or shapes the new TUI. |
| `questionnaire` | Untouched | Currently: turns a blocked decision into a questionnaire for a person outside the conversation. Raised: the re-active flow routes user-awaiting questions through the inbox, but decisions blocked on people *outside the project* have neither a new home nor a recorded fate. |
| `research` | Untouched | Currently: investigates a question against primary sources into one cited document. Raised: the map settles an engine-side fact-finder for information-kind questions (`L64–68`, `L116–119`) but never says whether the interactive research skill merges with, feeds, or stands beside that agent. |
| `specifying` | Partially decided | Decided: the specifying stage reviews against the plan (`L347–362`); its fresh-context review is the precedent the gate generalizes (`L359–360`); its Approve / Approve-and-Slice / Stop-and-Amend options fold into the gate (`L93–97`). Open: whether the skill itself, now stripped of its approval session, survives as a catalog item. |
| `tdd` | Decided | "`test-driving`: re-scoped" (`map L185–189`) + renames (`L249–251`): becomes `test-driving`, the broad practice of testing changes in real cases; the plugin's own testing system is part of what it teaches and drives. Mechanical knock-ons sweep at implementation (`L322–325`). |
| `tracking` | Decided | "Inbox and tracker, two jobs" (`map L129–138`) + "Tracked questions: two kinds" (`L222–225`): keeps the tracker as the engine's internal record of what blocks work; the questions reference gains an authority \| information kind field (`L306–311`); information kinds dispatch to the fact-finder, replies land on the question as its resolution. |
| `wayfinding` | Decided | "Wayfinding's ending" (`map L277–279`) + "The boundary's one door" (`L139–142`) + `Q "Pro-active flow …"` answered: stays as the interactive pro-active flow; on conclusion it runs the entry-point tool on the map; the cleared plan is the single outside entry; ungated entry, with plan approval the one human stop (`L93–97`). |
| `wizard` | Untouched | Currently: generates an interactive bash wizard for secrets and hands-on procedures (governed by the already-done `wizard-redesign` map). Raised: the plugin map never names it; only its harness `test-wizard.sh` is claimed as a testing seed (`L295–300`) — whether the skill itself ships in the plugin is unrecorded. |
| `writing-for-agents` | Decided | "Renames" (`map L249–251`, `L322–325`): plain rename to `technical-writing`; the craft pointer and README rows sweep at implementation. |

---

## 2. Commands — 14 of 14

| Command | Status | On record |
| --- | --- | --- |
| `/bootstrap` | Decided | Start-switch ruling (`map L58–63`): survives as the engine's on-switch — the only place the always-awake engine is started; the run is synchronous (`L76–81`). |
| `/close-inbox` | Decided | Retires with `curate-inbox` (`map L89–92`); its wrap-up role folds into the screen, the answering helper, and the engine. |
| `/cut-release` | Partially decided | Decided: the release is a repo tag plus a GitHub Release page carrying the changelog notes, and the end-user install transport retires (`map L85–88`, `L193–199`, `L369–372`; `Q "Installer and release machinery"` answered). Open: whether `/cut-release` itself survives as the catalog's release door or moves to maintainer tooling outside the plugin — the answered question never says. |
| `/handoff` | Decided | Shelved with the handoff/pickup pair (`map L181–184`); kept privately in the repo until the replacement proves out. |
| `/implement` | Untouched | Currently: the door to the implementing skill, feeding it direction. Raised: working the frontier is now the engine's business — the builder under the gate (`L107–110`, `L146–149`) — and no decision says whether a human `/implement` door still exists. |
| `/inbox` | Decided | "Inbox items: declared" (`map L235–238`) + "The inbox is its own TUI screen" (`L207–214`): stays as the door — opens the screen and initiates the re-active workflow; also reachable from the command palette. |
| `/pickup` | Decided | Shelved with the pair (`map L181–184`). |
| `/questionnaire` | Untouched | Currently: the door to the questionnaire skill. Raised: same open question as the skill — decisions blocked on people outside the project have no decided channel in the new system, and neither door nor skill is named. |
| `/retro` | Decided | "`/retro`: shelved" (`map L82–84`): joins handoff and pickup on the shelf, kept privately out of the plugin; fate re-judged when the engine exists. |
| `/slice` | Decided | "Slicing's door" (`map L190–192`): survives as the thin shortcut that starts the skill — the body shrinks to the starting instruction; the procedure moves into the slicing skill (`L285–287`); trigger description and reference re-pointing are implementation (`L363–365`). |
| `/spec` | Untouched | Currently: the door to the specifying skill. Raised: downstream documents are now produced by the engine's embedded agents (`L69–75`), so whether a human-initiated `/spec` session still exists is not on record. |
| `/wait-what` | Decided | Dead — removed from the catalog (`map L245–247`); its README rows go with it. |
| `/wayfind` | Untouched | Currently: the door to the wayfinding skill. Raised: the pro-active flow presumes interactive wayfinding sessions still happen (`L139–142`), so the door plausibly survives — but no decision records it. |
| `/wizard` | Untouched | Currently: the door to the wizard skill. Raised: unrecorded, as with the skill; only its harness is claimed as a testing seed (`L295–300`). |

---

## 3. Cross-cutting pieces the map introduces

| Piece | Placement | On record / what's open |
| --- | --- | --- |
| **Engine** | Placed | Lives in the plugin, in the repo-root package (`map L98–101`, `L377–378`); always awake on a strict leash, only where bootstrapped (`L146–149`, `L342–346`); spawns and drives sessions (`L215–221`); engine agents must never fabricate (`L143–145`). |
| **Entry-point tool** | Placed | A plugin tool; running it on a file is the clearance act (`map L150–154`); it accepts the plan alone — everything else stays inside or flows through its own channel (`L139–142`, `L69–75`). |
| **Review-loop tool** | Placed | A hard tool in the plugin's code (`map L174–176`); the criteria are engine-compiled from the upstream document (`L170–173`); cap and time limits enforced in code (`L162–165`); sessions fresh per stage (`L155–157`). |
| **Report pile** | Homeless | Role decided: graded reports in their own pile — a new scaffold piece per project — with the verdict also stamped on the work (`map L166–169`). Open: no owning skill, no format owner, no bootstrapping-inventory row (`Q "Review loop — where graded reports live"`: "the piece needs an owning skill and a bootstrapping-inventory row"). |
| **Inbox message record** | Homeless | Role decided: the inbox keeps its own record of the messages it sent and the replies received, referencing tracker questions, never copying (`map L129–138`). Open: where it physically lives, what form messages take, and who owns the format — "the item's home and form" stays open (`L333–341`); message and reply forms are spec detail (`L301–305`). |
| **Inbox screen** | Placed | Its own TUI screen, reached by command and palette, email-inbox visual, per-item seeded sessions (`map L207–214`); the answering helper and the recorded answer are settled (`L120–123`). |
| **Sidebar slots** | Placed | The `sidebar.content` slot carries `Inbox: {n}` (`map L231–234`) and the ongoing-work breakdown — pieces in motion, read from the records, never hand-written (`L124–128`); what counts and the exact derivation ruled 2026-10-26, derivation detail is spec. |
| **Four helper agents** | Placed | Reviewer (`map L177–180`), inbox answerer (`L120–123`), fact-finder (`L116–119`), one builder that repairs its own FAILs (`L107–115`); the roster is complete (`L373–376`); shipped as bundled Markdown agents registered at setup (`L290–291`). |
| **Test harness** | Homeless | Purpose and gate decided: a committed automated harness drives the real pieces (parser, review loop, session spawn, inbox record, TUI slot) with trust-mapping assertions; it gates merges to main with no manual step; releases tag from a green main (`map L102–106`, `L201–206`). Open: the harness's shape, where real-case tests run, the per-part testable seams, and where the gate sits before main ("Not yet specified", `L295–300`). |
| **Plugin package** | Placed | Package file and code at the repo root, beside the catalog and records; the install points at the repo with no path segment (`map L98–101`, `L377–378`); git channel, no package store (`L197–199`); Markdown bundled and registered at plugin setup (`L290–291`). The unverified keystones (`L42–47`) are verification work, not placement. |

---

## 4. Closing summary — items with no decision on record

**Untouched, skills (11):**

- `codebase-design` — Does the craft carry into the plugin unchanged, or do the plugin's own seams (parser, review loop, report pile) become its worked examples?
- `code-review` — Does the human review craft stay beside the engine's reviewer agent, and does the naming need disambiguation?
- `codifying` — Does it rule the plugin's decision record and the report pile's conventions, or is its role unchanged?
- `diagnosing-bugs` — Does the interactive reproduction-loop craft survive when the builder repairs its own FAILs inside the engine?
- `domain-modeling` — Who graduates the new vocabulary (engine, entry point, inbox message, report pile) into `GLOSSARY.md`?
- `grilling` — Does the synchronous interview survive beside the inbox's asynchronous question channel?
- `maintaining-docs` — Who owns the new release-notes step and the retirement of the install docs from `README.md`?
- `prototyping` — Does the craft carry into the plugin to de-risk the inbox screen and sidebar before they are built?
- `questionnaire` — Does it stay for decisions blocked on people outside the project — an audience the inbox does not reach?
- `research` — Does the interactive skill merge with, feed, or stand beside the engine's fact-finder agent?
- `wizard` — Does the skill (and its `/wizard` door) ship in the plugin at all?

**Untouched, commands (5):**

- `/implement` — Does a human door remain when the engine's builder works the frontier on its own?
- `/spec` — Does a human-initiated spec session exist when specs are engine-produced from reviewed plans?
- `/wayfind` — Is the door kept as the start of the interactive pro-active flow, and is that recorded?
- `/questionnaire` — Does the door survive even if decisions blocked outside the project route elsewhere?
- `/wizard` — Does the door ship with the skill, or do wizard needs shrink to the engine's residual asks?

**Partially decided (3):**

- `implementing` (skill) — Does it survive as a user-invokable skill beside the builder helper, or is it subsumed?
- `specifying` (skill) — Does its body shed the approval session (folded into the gate) and stay a catalog item, or leave the chain to the engine?
- `/cut-release` — Who cuts the plugin's releases when they run: a reshaped catalog door or maintainer tooling outside the plugin?

**Homeless/unplaced (3):**

- Report pile — Which skill owns its format, and does it enter bootstrapping's inventory?
- Inbox message record — Where does it live and whose format is it?
- Test harness — Where does it live and what are its testable seams, so the umbrella spec can pin it?