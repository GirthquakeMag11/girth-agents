# Ticket 01 review — The plugin skeleton and the channel

**Ticket:** `tracker/tickets/01-plugin-skeleton-channel.md`
**Spec:** `specs/plugin.md`
**Tree reviewed:** the work in this commit's tree (package.json, src/index.ts, src/tui.ts, root shims, README.md, docs/research/keystone-verification.md), 2026-10-27.

Graded criterion by criterion. Classifications: **representation** (the worker fixes) vs **design** (contradicts spec or ticket — the user decides).

## Criterion 1 — "The plugin loads from a git-spec install of this repo, server side and TUI side." — NOT MET

- Server side: attested. The keystone record (docs/research/keystone-verification.md, "git-spec `./tui` auto-load") records a load registering **21 skills and 14 commands** — which matches the on-disk catalog (21 skill dirs, 14 command files). The skill/command registration paths in src/index.ts correspond.
- TUI side: **not demonstrably met.** The record itself says the TUI export under a git-spec install "has not been exercised" and stamps it NOT VERIFIED YET, deferred to ticket 16. An acceptance criterion that demands both sides loading cannot pass on an honest not-verified.
- A self-contradiction undercuts what little TUI evidence exists: the sidebar section reads "The sidebar slot renders in a live TUI — untested headlessly. NOT VERIFIED YET." Either a live render happened (in which case its context should be recorded, and the sentence contradicts the deferred verdict) or it did not (in which case "renders in a live TUI" is an unsupported assertion). **Representation** — the worker fixes the sentence or completes the verification. If a live TUI session is genuinely out of reach right now, the criterion itself needs the user's word — **design** — but as written the ticket demands it, so the work stands short.

## Criterion 2 — "The Markdown catalog registers through the transforms — skills, commands, agents." — PARTLY MET, agents undemonstrated

- Skills and commands demonstrably register (21 and 14 respectively, per the load proof).
- Agents: the transform is wired in src/index.ts and honestly records failure/no-agents outcomes, but the catalog has no agent files (`.opencode/agents/` holds only `.gitkeep`), so nothing demonstrates an agent registering. The keystone itself — "plugin-added brand-new agent IDs" — is stamped NOT VERIFIED YET, deferred to ticket 07 (which is indeed the helpers ticket that owns this). Honest, but the criterion names all three channels; the agent channel is not demonstrably met. **Representation** — the worker either proves the add path (at least one probe agent registration, which ticket 01's own keystone mandate asked for) or the criterion is re-scoped by the user as **design**.

## Criterion 3 — "The install script's end-user verbs retire; the checker and harnesses remain builder-side." — NOT MET

- `scripts/install.sh` is untouched (mtime 2026-10-22, predates this work) and remains a complete end-user installer: interactive menu, `install | update | status | uninstall` verbs, the `girth.yaml` record in the user's config, `--copy`/`--policy`, and end-user advice printed after install ("Start a new OpenCode session… Skills can also be registered by path instead"). Nothing retires.
- The README now says "the builder script in scripts/install.sh … that path is maintainer tooling, not the user's channel" — a documentation claim over unchanged end-user machinery. It is contradicted by the README's own intro, which still reads "installed into `~/.config/opencode/` with one script" (README.md lines 3–5), and by `CONTRIBUTING.md`, which still describes the script as installing into user config with an update policy.
- The genuine tension: the spec-mandated survivor `scripts/test-installer.sh` (a harness that "stays as builder-side tooling") drives `install.sh`'s verbs directly, including its interactive-menu flows. So retiring the end-user surface means re-shaping script *and* harness together (e.g., strip the menu/record transport, re-point the harness at what remains). That shape is a real decision; as delivered, no shape at all was attempted. **Representation** for the untouched files; the end state of script+harness may warrant the user's word — **design** flag.

## Criterion 4 — "Each of the seven keystones' outcomes is recorded where it can be re-read, with no silent assumption." — MET, with nits

- Six of seven have labeled sections with explicit verdicts; the seventh (the per-machine activation registry's storage) rides inside the `ctx.storage` section as "will live here and inherits this outcome". That reading matches the spec (lines 91, 94: the registry lives in plugin durable storage), so it is neither silent nor contradictory — but it should carry its own labeled verdict line. **Representation.**
- Honesty throughout: nothing unverified is asserted. Agent-add is recorded as NOT VERIFIED / deferred; `session.idle` is "NOT CONFIRMED, re-verified at ticket 09"; storage durability is backed by a fixed-marker write/read across an `opencode service restart` (the `durability` tool in src/index.ts implements exactly that); `codemode` is "VERIFIED IN PRACTICE". TUI auto-load and sidebar reactivity are explicitly NOT VERIFIED. All deferral targets resolve to real owning tickets in the new ticket series (07, 09, 16, 21), though the tracker's duplicate numbering (legacy `01-test-harness.md` beside new `01-plugin-skeleton-channel.md` etc.) makes the bare-number references ambiguous — a hygiene nit. **Representation.**

## Code quality at a glance

- src/index.ts skills loop reads each SKILL.md twice (`frontmatter(readFileSync(...))` and then `readFileSync(...)` again) and ignores the destructured body — dead work. **Representation.**
- The comment on swallowed skill/command transform failures says failures "surface in the keystone probe below"; they do not surface there directly — only as short counts in the tool output. A misstatement, not a trap. **Representation.**
- No misleading claims in the registration paths: agent transforms record real outcomes, the `keystones` tool states outcomes are transcribed by the maintainer, and package.json honestly carries both exports with root shims serving local-dir loading. No dead code traps otherwise.

## Summary

Criterion 4 passes (with wording nits). Criteria 1, 2, and 3 do not demonstrably hold — each fails on an honestly-recorded gap, not a lie: the TUI git-spec load (1), the agent transform (2), and the install script's retirement (3, entirely unattempted). The honesty is the work's strongest suit; its honesty does not turn failed verification into met criteria.

**Classification:** all findings are representation-level except two embedded design questions that may need the user's word — whether TUI-side and agent-add verification must complete in ticket 01 or may ride their deferred tickets, and what shape the install-script retirement takes given the surviving harness. The work contradicts neither the spec nor the ticket; it under-delivers on the ticket.

**VERDICT: FAIL** — criteria 1, 2, and 3 are not demonstrably met; criterion 4 passes with representation nits.