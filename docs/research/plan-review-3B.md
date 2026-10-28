# Plan review 3B — technical verification and round-2 regression (round 3)

**Reviewer:** B (technical matters — claims about the platform, verified
against reality). **Target:** `plans/plugin-transition.md` (895 lines, as
read for this review). **Governing rules:** the user's M1200 rules,
reaffirmed M1220 (raw log at review time; every item cites the exact
user message; a citation landing on the agent's words or an option text
is INVALID; claims require verification and citation; no unverifiable
technical assertions; uncleared fog, lying, or being wrong = FAIL).

**Sources:** the round-3 raw chat log
`/tmp/opencode/girth-agents-chat-log-round3.md` (1306 messages, probe
evidence read directly); the primary OpenCode V2 docs, fetched live for
this review: `/build/plugins`, `/build/plugins/server`,
`/build/plugins/cli`, `/plugins`, `/cli/keybinds`; the round-2 reports
`plan-review-2A/B/C.md` regressed item by item.

---

## Part 1 — Every load-bearing technical fact: verified TRUE

Each claim was checked against the primary docs and against the probe
evidence recorded inside the round-3 log itself. All five load-bearing
platform facts hold.

| Plan claim (line) | Evidence | Holds |
|---|---|---|
| A plugin cannot register brand-new agent IDs — `AgentEditor` has no `add` (L76–80, L93–99, L866–868) | Docs `build/plugins/server`, Agent reference: `interface AgentEditor { list, get, default, update, remove }` — no `add`. Log: service line at 23:13:15 (`"disabled plugin after transform failure" … cause="Cause([Die(Error: AgentEditor has no add)])"`, log line 62675) plus probe counts `{"skills": 21, "commands": 14, "agents": 0}` (log line 62110). | ✓ |
| `ctx.storage` survives service restarts (L97–99, L866–868) | Docs server Storage: "Store, read, or remove durable JSON values"; TUI page: "Durable storage persists JSON across restarts". Log: marker `2026-10-27T23:09:12.909Z` written pre-restart (line 62227), `opencode service restart` (line 62261), then read back intact as `{"read":"2026-10-27T23:09:12.909Z"}` (line 62303); keystone record records the outcome VERIFIED (line 62354). | ✓ |
| `codemode: true` tools surface in the code-mode namespace and execute (L97–99, L868–870) | Docs server Tools: `editor.add({ … options: { namespace: "acme", codemode: true } })`. Log: `opencode run` step calling `return await tools.girth.keystones();` in a code-mode execute tool call, returning the probe JSON (line 62110). | ✓ |
| Local-directory plugins load from an `index.ts`/`server.ts` at the package root; package channels load through `exports` (L870–872) | Docs `/plugins`: "Configured local paths must be directories. OpenCode loads the directory's `server` or `index` module, such as `index.ts`." Docs `build/plugins` Load: a local directory with `package.json` `name`+`exports` loads parts through them; "Without them, it uses file names at its root: `server` (else `index`), `tui`, and `rpc`." Matches the claim (mild imprecision: "only" applies to the no-exports case — see note T1b). | ✓ |
| Package plugins publish to npm; `opencode plugin` installs/updates/checks, git specs supported (L78–79) | Docs `build/plugins`: "A published plugin is an npm package"; docs `/plugins` Manage: `add/list/check/update/remove`, "npm-compatible Git package specifications", `::path:` selectors. | ✓ |
| TUI: `sidebar.content`/`sidebar.footer` slots; `./tui` export beside the server export; TUI-only plugins in `cli.json`; routes register whole screens via `context.ui.router.register` + `navigate({type:"plugin"})` (L81–86) | Docs `build/plugins/cli`: slots list includes `sidebar.content`; "Export `./tui` beside a server part or GUI part for automatic loading"; "Configure a TUI-only package in `cli.json`"; router example verbatim. | ✓ |
| The menu is the command palette — Ctrl+P; Escape is interrupt, not a menu (L85–86) | Docs `cli/keybinds`: `command.palette.show` default `ctrl+p` ("List available commands"); `session.interrupt` default `escape`. | ✓ |
| "the right-hand panel is the sidebar" (L81–82, L773–775) | User's own words at chat M371; docs keybinds expose `session.sidebar.toggle` and `pane.focus.right`; nothing contradicts the layout claim. | ✓ |
| Still-unverified list: git-spec `./tui` auto-load, sidebar-slot live-reactivity, the full event catalog, `session.idle` payload (L93–96, L872–874) | Honestly labeled. Log keystone record agrees: `./tui` "NOT VERIFIED YET… needs a live TUI session"; sidebar "untested headlessly. NOT VERIFIED YET"; probe observed only `session.usage.updated` and `session.renamed`, `sessionIdleSeen: false` (lines 62110, 62321–62354). ✓ — accurate labeling, no overclaim. |
| The engine can spawn fresh sessions and pass information between them (L757–763) | Docs server Sessions: `ctx.session.create`, `ctx.session.prompt`, `ctx.session.context` all exist. Claim supported. | ✓ |

The M1262/M1269 process-notes citations (plan L17–33) were also spot-checked:
both are **user** messages in the round-3 log (log lines 67684, 67851),
so those notes' citations land on the user's own words. ✓

## Part 2 — Findings

### T1 — The identity bullet still asserts an impossible mechanism — the round-2 correction missed the sibling bullet — FAIL-grade technical error

- **Plan line 65–68:** *"skills, commands, and agents stay plain Markdown …
  and the plugin's `setup()` registers them through the skill/command/agent
  transforms."*
- The platform fact the plan itself records (L866–868) is that a plugin
  **cannot** register brand-new agent IDs — `AgentEditor` has no `add`
  (verified above). The skill and command transforms can add; the agent
  transform cannot create an ID. The sentence distributes all three
  catalog kinds across their transforms, so it is false for agents —
  the plan contradicts itself on its own central mechanism, in the
  catalog-identity note, the one entry that says what the plugin *is*.
- **Origin of the error:** the sentence was carried over verbatim from
  chat M323's answer round (round-3 log line 17359), where the *agent's
  option text* claimed "command/agent transforms exist the same way" and
  the user chose "Bundle + register at setup (Recommended)". The user's
  choice did not affirm the technical premise; the live probe (M1126
  code write, failure logged 23:13:15) then falsified that premise, and
  the bullet was never corrected. This is exactly the class the user
  burned at M1173/M1200 — an option text with a false technical premise,
  kept as a settled mechanism after reality verified the opposite.
- Round-2 fixed the neighboring "Facts the map leans on" bullet
  (2A F3 → current L76–80, now correct) but this bullet carried the same
  claim and was never touched. The fix must reconcile it with the
  recorded split: the catalog's skills/commands register via transforms;
  its agents don't enter the OpenCode registry at all (the helpers live
  embedded in the engine, per the user's M1165 answer recorded at
  L356–365; the orchestrator's realization is config-declared per the
  discarded spec's finding — though the plan itself does not state that
  mechanism). **Classification: representation** (a stale assertion
  superseded by the verified fact and the user's M1165 ruling — not a
  same-layer design tension: the design no longer depends on this
  mechanism, which is why the entry must simply be rewritten).

- **T1b (note, not a finding):** the platform-facts phrasing "loads
  *only* from an `index.ts` or `server.ts` at the package root" holds for
  the no-`exports` case; a local directory that *does* carry
  `package.json` `name`+`exports` loads through them per
  `build/plugins`². The claim as read is about the plain-directory case
  and remains true; worth one clarifying word so it cannot be read as
  contradicting `exports`-bearing local dirs.

### T2 — Technical bullets remain mis-cited to the user's order, the agent's probe-code message, or nothing — round-2 F11/F4(b) persist

- **Plan L866–874 (Platform facts) cites `(chat M1126)`.** M1126 (round-3
  log line 61346) is the assistant message where the probe *code* was
  written — the `src/index.ts` containing the agent-add attempt. The
  evidence lives later: the execute-tool probe runs and the service log
  line at 23:13:15 (log line 62675). 2C's F4(b) flagged exactly this;
  it is unchanged. The facts themselves are true (Part 1); the citation
  points at the wrong end of the probe chain.
- **Plan L76–80 (Facts the map leans on) cites `(chat M497)`.** M497 is
  the user's survey *instruction*, not an affirmation of the facts; 2B
  F11b persists. The fix named in round 2 — cite the research notes
  (`docs/research/opencode-engine-mechanics.md`,
  `opencode-tui-distribution.md`), which the adjacent ground-research
  bullet (L87–92) already names — has not been applied.
- **Plan L81–86 (TUI facts) carries no citation at all.** 2B F11a
  persists. Every claim in the bullet is true against the primary docs
  (Part 1), but the plan's own mandatory rule (M1200: claims require
  verification and citation) is unmet on the bullet itself.

All three are **representation** (recorder re-points the citations; no
user question, the facts are right).

### T3 — "The built-in `build` and `plan` primaries are replaced by it" — mechanism unstated, docs-sustainable, flagged for the spec

- **Plan L351–355 (Primary agents).** The docs show the replacement is
  mechanically reachable — `AgentEditor.update("build", …)`,
  `editor.remove(…)`, `editor.default(…)` — so the claim is not
  contradicted by the platform, but the plan neither states the
  mechanism nor records a live verification of it (it is absent from
  both the verified and the still-unverified lists at L93–99/L866–874).
  This is the one half of 2B F10 not fully closed by the new "Helpers'
  realization" entry (which resolves the six helpers via M1165 but is
  silent on the orchestrator's own realization). **Representation-leaning
  note for the spec**: the mechanism choice belongs to the spec, but the
  platform facts entry should either record "agent transforms can
  update/remove existing agents (docs), so replacement is feasible —
  not yet live-probed" or list it among the still-unverified.

### T4 — Round-2 regression: the R-class tail was not finished

For every FAIL finding in the round-2 reports, the current plan was
checked. The terminal design findings **were** fixed; a tail of
representation findings ordered repaired was not. Details:

**Fixed and verified:** 2A F1/2B F3/2C F1 (own review now "open",
L831–838); 2A F2 (V1 out-of-scope gone — grep finds no "V1" anywhere);
2A F3/2B F2/2C F3 (Facts bullet says "but NOT agents"; keystone bullet
L93–99 and platform facts L866–874 now agree — the open-vs-verified
contradiction round 2 failed on is resolved); 2A F4/2B F4 (Two layers
re-cited to M663); 2A F5/2B F7 (shelved-era terms → OPEN, awaits user);
2A F6/2B F11c (zeroshot → "the research's findings, not the user's
words", cites M401/M390); 2A F7/2C F2 (stale survey bullet replaced;
folded items acknowledged, L100–104); 2A F9/2B F1 (the three corrupted
entries restored: L777–780, L784–787, L826–827); 2B F5 (fabricated
inbox dialogue replaced by the user's M910 words; the walk labeled
OPEN); 2B F6 (sidebar atomicity/dual-truth glosses removed); 2B F10 for
the six helpers (the new "Helpers' realization" entry L356–365 quotes
the M1165 answer verbatim and records the platform negative — the
missing settled item round 2 demanded now exists); most of 2A F8 (the
coalescing parenthetical now labeled open-to-rule L399–400; sidebar and
helpers-permission glosses now labeled as the map's shaping, L330–341;
the inbox "by reference, never copied" clause moved to spec shapes,
L203–210; the "could not acquire" scare-quotes dropped).

**Not fixed — persists in the current text** (each found verbatim):

| Round-2 finding | Where it persists now | Check |
|---|---|---|
| 2A F8 · project kinds' shape — "per-package placement only on warrant" not in M855 | L469–475 and L848–851 | present |
| 2A F8 · GitHub credentials — "recorded as a ruling like any declination" not in M960 | L373–378 | present |
| 2A F8 / 2B F8 · plan-gate completeness — "one at a time" not in M1024's answer | L322 ("honestly new and one at a time") | M1024's user answer (round-3 log, tool result at line 54932) contains no count constraint — confirmed absent |
| 2A F10 · "too disorganized to enumerate linearly" miscited to M315/M418; the words are the user's at M323's answer | L69–72 cites `(chat M315, M418)` | the user's words sit in M323's answer round (log line 17359) — confirmed |
| 2B F9a · caregiver entry cites M771 only; the authority clauses trace to M775 | L547–556 cites `(chat M771)` | present |
| 2B F9c · scaffold migration composites M920 but cites M903 only | L445–451 cites `(chat M903)` | present |
| 2B F9e · testing-system piece list "(parser, review loop, session spawn, inbox record, TUI slot)" is from the discarded spec pass | L175–179 | present |
| 2B F9f · GitHub credentials elaborations | L373–378 | present (same item as 2A F8 row) |
| 2B F9g · concurrency "what runs at once / what waits / coexist" enumeration | L250–255 | present |
| 2B F11a/b · TUI-facts bullet uncited; Facts bullet cites M497 | L81–86, L76–80 | present (see T2) |
| 2B F12 · the mandatory-rules note still drops the four M1200 prohibitions | L34–47 | M1200 verbatim (log line 64769) contains "circumvent my authority", "reinterpret the design", "manipulate your reviewers", "close the wayfinding phase"; none appear in the note |
| 2B F13 · "(narrated)" labels understate user-sourced items | L784–827 passim | present |
| 2C F4(b) · platform facts cite the probe-code message, not the results | L874 | present (see T2) |
| 2C F5 · "(2026-10-27, user; named 2026-10-27, user)" and the mid-sentence "(chat M492)" | L355, L134 | present |

All **representation** — recorder repairs, no design questions — but
several sit on the round-2 reports' terminal lists, and their survival
means the rectification wave stopped mid-fix.

## Part 3 — Classification summary

- **Design (re-opens the user's frontier):** none. The technical facts
  are now settled in the right direction, the keystone-vs-platform-facts
  contradiction is healed, and the helpers' realization was the only
  round-2 design finding — it is now user-settled (M1165) and recorded.
- **Representation:** T1 (identity bullet's impossible agent
  registration — the one remaining technical falsehood), T1b (one
  clarifying word), T2 (three mis-aimed/absent technical citations),
  T3 (mechanism unstated for build/plan replacement), and the T4
  persistence table (14 items).
- **Technical truth ledger:** every statement of platform fact in the
  plan that this reviewer was able to test against the primary docs and
  the log's live probes is **true**, and the verified-vs-still-unverified
  boundary is honestly labeled. The plan's problem is no longer wrong
  platform facts — it is one stale mechanism sentence (T1) and an
  unfinished citation/repair pass (T2, T4).

## Verdict

The technical foundation is now sound and honestly labeled — the round-2
keystone contradiction, the fabricated rulings, the false "closed"
review, and the helpers-as-registered-agents fog are all genuinely
resolved. But the plan still asserts a mechanism its own verified
platform facts disprove (T1: agents "registered through the
skill/command/agent transforms" in the catalog-identity note), its
technical bullets still violate the plan's own mandatory citation rule
(T2), and a fourteen-item tail of round-2 FAIL findings ordered repaired
remains unfixed in the current text (T4). Under the governing rules —
being wrong is failure; every item derives from and cites its source;
the plan must be wholly complete and ready for specifying — this plan is
not ready to transition. The repairs are recorder-class and do not need
the user.

VERDICT: FAIL