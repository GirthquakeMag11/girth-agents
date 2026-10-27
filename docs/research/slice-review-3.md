# Slice review 3 — the plugin ticket graph, third pass

**Reviewed against:** `specs/plugin.md`
**Tickets:** the twenty-two files in `tracker/tickets/` with `Parent:
specs/plugin.md`, numbered `01`–`22` (the directory also holds other
graphs sharing numbers; filtered by Parent).
**Format source:** `.opencode/skills/tracking/references/tickets.md`
**Prior passes:** `slice-review-1.md` and `slice-review-2.md`; their
findings are verified in §0 before the full re-grade.

The graph, as numbered:

| # | Ticket | Kind | Blocked by |
|---|--------|------|------------|
| 01 | plugin skeleton + channel | feature | — |
| 02 | catalog atomic sweep | refactor | — |
| 03 | release machinery — tag + Release page | feature | 01 |
| 04 | engine skeleton | feature | 01 |
| 05 | bootstrap, activation, schema gate | feature | 01, 04 |
| 06 | leash, commits, absorb-or-alarm | feature | 04 |
| 07 | six helpers defined | feature | 01, 04 |
| 08 | entry-point tool | feature | 04 |
| 09 | review-gate core | feature | 07, 08 |
| 10 | criteria + report shapes | feature | 09 |
| 11 | tracker kinds | feature | 02 |
| 12 | report pile, routing, exception | feature | 09, 10, 11 |
| 13 | dispatch permission match | feature | 07, 11 |
| 14 | inbox machinery | feature | 04, 07, 11 |
| 15 | knowledge management pipeline | feature | 07, 11, 14 |
| 16 | inbox screen + sidebar | feature | 14 |
| 17 | recall layer | feature | 09, 11, 12 |
| 18 | real-case harness + merge gate | feature | 01, 09, 14, 16 |
| 19 | dogfooding two-checkouts | feature | 04, 12 |
| 20 | direction-change path | feature | 02, 09, 11 |
| 21 | off-switch — park + registry | feature | 04, 05 |
| 22 | context map + scoped reads | feature | 11, 02 |

---

## 0. Verification of the prior passes' rectifications

Every blocker named in the first two verdicts is resolved:

- **Release machinery.** Ticket 03 delivers tag + GitHub Release page
  carrying the changelog section, no install line, `/cut-release`
  re-scoped to tag plus Release page and nothing broader. (Pass 1 G1.)
- **The catalog sweep's four re-fits.** Ticket 02 names `codifying`'s
  convention-crash arrival path, `domain-modeling`'s re-fit,
  `maintaining-docs` zero drift tolerance, and the tracking skill's
  reference extension — in the deliverable and in its criterion 2. The
  sweep stays one atomic change. (Pass 1 G2.)
- **Direction-change path.** Ticket 20 carries all three ruled paths —
  amendment as new reviewed revision, abort closing records with the
  reason, re-answering reopening the resolved question. (Pass 1 G3.)
- **Seven keystones, seven homes.** Ticket 01's deliverable now names
  all seven spec-line-156 keystones — agent IDs, `./tui` auto-load,
  `ctx.storage`, **the activation registry's storage**, the event
  catalog and `session.idle`, `codemode`, and sidebar-slot
  live-reactivity — and criterion 4 records each outcome with no silent
  assumption. Ticket 21's criterion 4 re-records the registry-storage
  keystone next to the registry that consumes it. (Pass 2 V4/F1.)
- **The provenance-flag edge.** Ticket 13 (dispatch permission match)
  now declares blockers 07 and 11 — and 11 delivers the system
  provenance flag — so the edge that faced backward is declared and the
  numbers face the right way. (Pass 2 S1 / pass 1 S1.)
- **The harness ticket's seams.** Ticket 18 now blocks on 14 (inbox
  record) and 16 (TUI slot) in addition to 01 and 09, so every seam its
  first criterion drives has landed at its frontier position.
  (Pass 2 S3.)
- **Inbox machinery's helpers.** Ticket 14 declares 07 among its
  blockers; the fact-finder and answerer it dispatches now exist before
  it. (Pass 2 S2.)
- **The FIFO plan queue.** Ticket 09 states "several cleared plans queue
  in received order, first in first out" in the deliverable and in
  criterion 4. (Passes 1–2 G5/G1.)
- **Work-stage per-ticket review.** Ticket 09 carries "reviewed ticket
  by ticket — each ticket's outcome against its ticket, code and test
  evidence as proof, the stamp on the ticket." (Passes 1–2 G6/G2.)
- **Authority-completeness, positive half.** Ticket 09: "the plan's
  review certifies authority-completeness: every user-answerable
  question visible in the session was asked" — matching what 18 now
  regression-tests. (Passes 1–2 G7/G3.)
- **Green-main releases.** Ticket 03 criterion 2: "Releases tag only
  from a green main." (Passes 1–2 G8/G4; the seeding half remains an
  advisory, §1.)
- **No carve-out, no fallback.** Ticket 07 states plain "failing openly
  rather than asserting" (pass 2 F2's carve-out is gone) and ends "a
  failed verification is taken to the user — the spec presumes no
  fallback" (pass 1 F2). Ticket 13's criterion 3 rules out
  mid-operation permission prompts.
- **"With a count" and "dated."** Ticket 12 and ticket 19 both carry
  "coalesce into one report with a count"; ticket 08 validates the
  "recorded, dated confirmation marker." (Passes 1–2 F4/F5, F3.)
- **The two split candidates.** Bootstrap (05) and `/park` plus the
  activation registry (21) now wear different numbers (pass 2 S4);
  tracker kinds (11) and the context map with scoped reads (22) are
  separate verticals (pass 2 S5).

---

## 1. Coverage

Every settled Implementation Decision is advanced by at least one
ticket. The distribution skeleton (01), the atomic catalog sweep (02),
releases tagging only green main (03), the engine loop and the
records-as-ledger stance (04), startedness and the schema gate (05),
the leash in all five forbidden clauses plus commit and push discipline
(06), the helper roster (07), the one door with its dated marker (08),
the gate with its cap of three and limit of ten (09), mechanical
criteria compilation and the typed report and brief (10), the new
tracker kinds with authority/information retrofit and the provenance
flag (11), the report pile, need-the-user's-answer routing, and the
consent-gated counted exception (12), dispatch-time permission matching
with no mid-operation prompts (13), the inbox's message record and
seeded answerer sessions with serial replies (14), the caregiver's
proposal-to-admission pipeline with the form-only mechanical gate (15),
the email-shaped screen and the engine-reported sidebar (16), the
recall layer with recursion-based stratification, the hundred-entry cap,
and the two read modes (17), the real-component harness gating merges
with the harvested regression cases (18), two-checkout dogfooding and
the self-report's receiving end (19), the direction-change paths (20),
park and the machine-local registry with its safe-default loss (21),
and the root context map with scoped reads and warranted deviations
(22). No ticket contradicts the spec, including the out-of-scope
stances — no ticket builds future concurrency, agent-private memory, a
package registry, or the shelved pair.

Advisories, carried and none blocking — invariants the spec settles but
that no ticket asserts where a worker would see them:

- A1 — "the existing harnesses seed it" (line 134): 18 never names the
  seeds.
- A2 — "a cap too low for the work is the exception, not an override"
  (line 108): absent from 09.
- A3 — the reviewer is the report pile's **sole practitioner** (line
  116): 12 has "owned by the review craft" and the role assignment; the
  phrase itself is not asserted.
- A4 — "user sessions live outside the engine and never compete for its
  queue" (line 96): a natural criterion on 04.
- A5 — "non-code repositories run the same system with criteria fitting
  the substance's kind" (line 117): a natural criterion on 22 (or 10).
- A6 — "nothing converts to code unless a trigger needs code" (line
  60): a natural criterion on 01.
- A7 — the anti-deferral half of the completion certification (line
  110: "newness, never deferral"): 09 carries the positive
  certification; the routing rule in 12 implies it but does not state
  it.

All representation-class; an acceptance criterion each would pin them.

---

## 2. Numbering and the frontier

Machine-verified: every ticket's blockers are fewer than its own
number; there are no cycles and no face-backward edges. The frontier is
computable step by step — `[01, 02]`, then `[03, 04, 11]`, `[05, 06,
07, 08, 22]`, `[09, 13, 14, 21]`, `[10, 15, 16, 20]`, `[12, 18]`,
`[17, 19]` — and every ticket is reachable. All prior violations are
resolved by the renumbering (see §0).

---

## 3. Format

All twenty-two tickets carry all five fields: Parent names
`specs/plugin.md`; Kind draws only on the whitelist (feature ×21,
refactor ×1 — the atomic sweep, correctly a refactor); Blocked by is
declared everywhere; What it delivers is end-to-end behavior with no
file paths or layer narration; Acceptance criteria are `- [ ]`
checkable items (three to six per ticket). Format: clean.

---

## 4. Fidelity

Settled numbers and wordings match the spec where a ticket must carry
them exactly: the cap of three fix-rounds and the ten-minute step limit
as the plugin's own tool-enforced configuration (09); the seven
keystones including the activation registry's storage (01, 21); the
dated confirmation marker (08); the whitelist and the gh-declination
ruling (05); the forbidden list's five clauses and the
non-fast-forward hold-and-raise wall (06); the report's four typed
fields and the brief's six (10); the message record's fields,
referencing never copying (14); the recall budget (17); the exact
three-way harvested-scenario classification (18); the count-coalescing
rule (12, 19); and the no-fallback keystone stance (01, 07) with no
permission carve-outs anywhere (07, 13). Nothing in any ticket presumes
a fallback or grants an exception the spec refuses.

Residual representation nits, all writer-side:

- N1 — ticket 08's What it delivers contains a doubled sentence block:
  "A tool run that dies loses nothing … never crosses this tool" appears
  twice in a row (lines 15–19). Delete the duplicate.
- N2 — ticket 20's third criterion reads "the rules resumes from the
  new answer"; the word "engine" (or "work") is wanted. Carry-over from
  pass 2.
- N3 — ticket 09's first criterion says "Cleaning a plan into the
  engine"; the spec's word is "clearing."
- N4 — ticket 05's filename slug (`05-bootstrap-activation-offswitch`)
  still says "offswitch," though `/park` moved to 21. Cosmetic.
- N5 — ticket 22 lists blockers as "11, 02," out of numeric order.
  Cosmetic.

---

## Classification

Every finding is representation — fixable by the slice writer against
the spec's own wording. None re-opens the spec, and no design question
needs the user.

---

## Verdict

**PASS** — every blocker from both prior FAILs is resolved, the graph
is implementable as written, and the residual findings (N1–N5, A1–A7)
are writer-side representation fixes and advisories that can land
alongside implementation rather than gating it.