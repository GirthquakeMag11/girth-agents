# Slice review 2 — the plugin ticket graph, second pass

**Reviewed against:** `specs/plugin.md`
**Tickets:** the twenty files in `tracker/tickets/` with `Parent:
specs/plugin.md`, numbered `01`–`20` (the directory also holds four other
graphs — installer, installer-experience, handoff-pickup, wizard-redesign
— which share numbers with this graph; filtered by Parent).
**Format source:** `.opencode/skills/tracking/references/tickets.md`
**Prior pass:** `docs/research/slice-review-1.md`, whose six claimed
rectifications are verified in §0 before the full re-grade.

The graph, as renumbered:

| # | Ticket | Kind | Blocked by |
|---|--------|------|------------|
| 01 | plugin skeleton + channel | feature | — |
| 02 | catalog atomic sweep | refactor | — |
| 03 | release machinery — tag + Release page | feature | 01 |
| 04 | engine skeleton | feature | 01 |
| 05 | bootstrap, activation, off-switch | feature | 01, 04 |
| 06 | leash, commits, absorb-or-alarm | feature | 04 |
| 07 | six helpers defined | feature | 01, 04 |
| 08 | dispatch permission match | feature | 07 |
| 09 | entry-point tool | feature | 04 |
| 10 | review-gate core | feature | 07, 09 |
| 11 | criteria + report shapes | feature | 10 |
| 12 | tracker kinds + context map | feature | 02 |
| 13 | report pile, routing, exception | feature | 10, 11, 12 |
| 14 | inbox machinery | feature | 04, 12 |
| 15 | knowledge pipeline | feature | 07, 12, 14 |
| 16 | inbox screen + sidebar | feature | 14 |
| 17 | recall layer | feature | 10, 13, 12 |
| 18 | real-case harness + merge gate | feature | 01, 10 |
| 19 | dogfooding two-checkout | feature | 04, 13 |
| 20 | direction-change path | feature | 02, 10, 12 |

---

## 0. Verification of the claimed rectifications

Six fixes were claimed after pass 1. Five hold; one does not.

**V1 — release machinery (ticket 03). ✅ FIXED.** 03 exists and matches
spec line 59: a release is a tag, each tag gets a GitHub Release page
carrying the changelog section, the old install line is gone, and
`/cut-release` re-scopes to tag plus Release page and no further. Pass 1's
gap G1 is closed.

**V2 — the catalog sweep's four re-fits (ticket 02). ✅ FIXED.** All four
of pass 1's G2 items are named in 02's deliverable *and* in its acceptance
line 29: `codifying`'s convention-crash arrival path, `domain-modeling`'s
re-fit, `maintaining-docs` zero drift tolerance, and the tracking skill's
reference extension. The sweep stays one atomic change, so the linter
never fires mid-rename (spec line 69).

**V3 — direction-change path (ticket 20). ✅ FIXED.** 20 carries all three
paths from spec line 90 — amendment becomes a new reviewed revision;
aborting closes the workstream's records with the reason; re-answering
reopens the resolved question — plus "ruled in a session, carried by the
records" and "recorded like any ruling." Pass 1's G3 is closed.

**V4 — seven keystones in ticket 01. ✗ NOT FIXED.** 01's acceptance line
27 promises "Each of the **seven** keystones' verification outcomes is
recorded," but its deliverable (lines 17–20) names only **six**: agent
IDs, `./tui` auto-load, `ctx.storage`, the event catalog + `session.idle`,
`codemode`, and sidebar-slot live-reactivity. The seventh keystone from
spec line 156 — **the per-machine activation registry's storage** — is
named nowhere in the graph: not in 01, and not in 05, the ticket that
builds the registry (05's criteria cover "no activation state enters the
repository," which is the repository-hygiene rule, not the storage-
location keystone). This is pass 1's G4 only three-quarters repaired —
the count now matches seven in the criterion but the seventh item has no
home. *Representation.*

**V5 — the 11/12 order violation. ✅ FIXED.** The pair is swapped: 12 is
tracker kinds and context map, 13 is the report pile with routing and the
exception, and 13's blockers (10, 11, 12) all precede it. The provenance
dependency that drove the old violation now has a legal edge. Pass 1's S1
is closed.

**V6 — ticket 07's keystone stance. ✅ FIXED.** 07's deliverable now ends
"a failed verification is taken to the user — the spec presumes no
fallback," matching spec line 82 rather than presuming the helpers
"arrive whole." Pass 1's F2 is closed.

---

## 1. Coverage

The big spine is ticketed end to end: distribution skeleton (01), the
atomic catalog sweep (02), releases (03), the engine loop and ledger
(04), startedness and the off-switch (05), the leash (06), the helper
roster and dispatch matching (07, 08), the one door (09), the gate
(10, 11, 13), the records work (12), the inbox (14, 16), knowledge
(15, 17), testing (18), dogfooding (19), and direction changes (20).
No ticket flatly contradicts the spec. The remaining coverage findings
are carried over from pass 1 or newly exposed by the renumbering:

**G1 — the FIFO plan queue is still stated nowhere.** Spec line 111:
several cleared plans queue in received order, first in, first out. 04 has
the per-project queue and the serial step; 09 feeds it; no ticket carries
the ordering rule. Pass 1's G5, unfixed. *Representation, minor.*

**G2 — the work stage's ticket-by-ticket review is still not spelled
out.** Spec line 107: work is reviewed ticket by ticket — each ticket's
outcome against its ticket, code and test evidence as proof, the stamp on
the ticket. 11 compiles criteria "for every later stage," and 13 stamps
artifacts generally, but the per-ticket granularity and the
evidence-as-proof rule appear in no criterion. Pass 1's G6, unfixed.
*Representation, minor.*

**G3 — authority-completeness still has only its negative half.** Spec
line 110: the plan's PASS certifies that every user-answerable question
visible in the session was asked, and the inbox afterwards carries only
questions newly visible under a later stage's context. No ticket states
the positive criterion; meanwhile 18's acceptance line 26 builds the
regression case "the plan-gate completeness holds" — a test for a feature
nothing in the graph builds. The two halves are visibly out of joint.
Pass 1's G7, unfixed. *Representation, minor.*

**G4 — "releases tag only green main" and harness seeding are still
dropped.** Spec line 134: the harness gates merges to main *and* releases
tag only green main; the existing harnesses seed it. 18 covers the merge
gate and the regression scenarios; 03 has no green-gating clause and 18
never names the existing harnesses (`scripts/test-installer.sh`,
`scripts/test-wizard.sh`, `scripts/validate.mjs`) as seeds. Pass 1's G8,
unfixed. *Representation, minor.*

**G5 — keystone attachment (carry-over).** With V4's correction, six of
the seven spec-line-156 keystones are verified at 01 and honestly
reported either way; the seventh (registry storage) remains unattached to
any ticket that consumes it. Folded into V4 above; listed here for the
coverage scorecard.

Three spec stances remain tickets' business only as invariants, never
asserted where a worker would see them: "user sessions live outside the
engine and never compete for its queue" (line 96), "non-code repositories
run the same system with criteria fitting the substance's kind" (line
117), and "nothing converts to code unless a trigger needs code" (line
60). None is contradicted. *Representation, advisory* — an acceptance
criterion each on 04, 12, and 01 respectively would pin them.

## 2. Slicing discipline

Numbering is now consistent *on the declared edges*: every ticket's
blockers are fewer than its own number, the frontier is computable
(01/02 first; then 03, 04, 12; then 05, 06, 07, 09; then 08, 10; and so
on), and there are no cycles. The problems are three dependencies that
exist in the ticket text but not in the `Blocked by:` lists:

**S1 — ticket 08 needs what ticket 12 delivers, and the numbers face the
wrong way.** 08's deliverable records a dispatch mismatch "with a system
provenance flag" — the flag that 12 creates (spec line 115), which lands
four numbers later. As written, an implementer pulling 08 at its frontier
position cannot satisfy its own deliverable. This is pass 1's S1 in a new
body: the old ticket wore it on 11↔12; now the dispatch ticket carries
the same un-declared edge upward. The fix is writer-side — either 08
drops the flag clause and lets 12's retrofit's successor records carry
it, or 08 renumbers behind 12 — and it must be one of those; the graph
cannot ship with this edge both real and unnumbered. *Representation.*

**S2 — ticket 14 uses helpers that are not in its blockers.** 14's
deliverable and its acceptance criteria route information kinds to the
fact-finder and open seeded answerer sessions — both from 07 — yet its
`Blocked by:` lists only 04 and 12. The numbers allow the fix outright:
add 07. *Representation.*

**S3 — ticket 18 names seams that have not landed at its position.**
18's first criterion drives "each named seam" — the parser, the review
loop, session spawning, the inbox record, the TUI slot. Of those, the
inbox record arrives in 14 and the TUI slot in 16, neither in 18's
blockers (01, 10) nor in 10's transitive closure. At its frontier
position the ticket is unimplementable as written. Add 14 and 16 as
blockers. *Representation.*

**S4 — ticket 05 is still two tickets wearing one number (carried from
pass 1).** Bootstrap (consent statement, eager run, whitelist asks,
gh-declination ruling) and `/park` (its own thin door, resumability,
registry hygiene) are separately demoable verticals, and the spec treats
`/park` as its own door (line 94). Six acceptance criteria spanning lines
89 and 94 in one slice is the thickest ticket in the graph; borderline
for one fresh context window. *Representation — split candidate.*

**S5 — ticket 12 is still a grab bag (carried).** New tracker kinds, the
authority/information retrofit, the provenance flag, the context map, the
`context:` field, scoped reads, and warranted placement deviations — three
demonstrable verticals in one ticket. Not fatal; flag. *Representation —
split candidate.*

Everything else is a thin vertical with a user-shaped deliverable and no
implementation-layer narration in **What it delivers.** Ticket 02's width
is spec-mandated: line 69 requires the sweep to land as one atomic
change.

## 3. Format

All twenty tickets carry all five fields. Parent names the spec path per
the rules. Kind values are only `feature` (19) and `refactor` (1), all
within the whitelist. Acceptance criteria are concrete and checkable
throughout, with two carry-over soft spots: 15's "A review FAILs a piece
that uses a term in a drifted sense" is checkable only through a
demonstration (acceptable), and 17's blocker list reads "10, 13, 12" out
of numeric order (cosmetic). **What it delivers** avoids file paths
throughout. One proofreading nit: 20's third criterion reads "the rules
resumes from the new answer" — the word "work" or "the chain" is wanted.

## 4. Fidelity

Where tickets must carry the spec's exact numbers and wording, they
mostly do:

- **Caps** — 10: three fix-rounds, ten-minute step limit, the plugin's
  own configuration, enforced by the tool, ungrantable to the agent's
  judgment. ✅ spec line 108.
- **The whitelist** — 05: name, purpose, license when undeclared; the
  starting version when nothing states one; the optional gh setup as an
  action, credentials through gh, never stored separately. ✅ line 89.
- **The forbidden list** — 06 reproduces all five clauses, including
  "history reset," "self-merging," and "no network commands beyond its
  own pushes and self-reports," plus the non-fast-forward
  hold-and-raise wall (line 93). ✅ line 86.
- **The recall budget** — 17: one hundred entries, least-re-ratified
  retirement, two read modes. ✅ line 130.
- **The message record** — 14: kind, referenced entry, status, reply;
  referencing, never copying. ✅ line 122.
- **The report's and brief's typed fields** — 11 reproduces the verdict's
  four fields and the brief's six. ✅ lines 92, 108.
- **Two-checkout dogfooding** — 19 matches line 97.
- **Harvested-scenario taxonomy** — 18 carries the exact three-way
  classification, never the reconciliation question. ✅ line 135.

Four fidelity findings:

**F1 — the keystone count says seven, the list has six.** Covered under
V4/S1 analysis; logged here as the fidelity face of the same defect.
*Representation.*

**F2 — ticket 07 still grants a carve-out the spec doesn't.** "failing
openly rather than asserting **unless the job needs an assertion it can
verify**" adds an exception to the spec's plain "failing openly rather
than asserting" (line 74). The design trail does not support it: the
plan's settled rulings say only "fail openly rather than assert."
Pass 1's F3, unfixed. *Representation.*

**F3 — "with a count" is still dropped from the coalescing rule.** Spec
line 111: identical failures "coalesce into one report **with a count**."
13 has the report, the consent-at-every-send, and the new-consent rule
but no count; 19's "Repeated identical reports coalesce" repeats the
omission. Pass 1's F4, unfixed. *Representation, minor.*

**F4 — ticket 09 still drops "dated."** Spec line 102: the confirmation
marker in the plan is a *dated* marker. 09 says "recorded confirmation
marker." Pass 1's F5, unfixed. *Representation, minor.*

Two adjacent minor omissions, also carried unfixed: 10 omits "a cap too
low for the work is the exception, not an override" (line 108), and 13
omits that the reviewer is the pile's sole practitioner (line 116).

---

## Verdict

**FAIL** — the graph cannot be implemented as written. The blockers:
V4/F1 (ticket 01 promises seven keystone verifications and names six; the
activation-registry-storage keystone has no home anywhere in the
graph), S1 (ticket 08 delivers a provenance flag that ticket 12 creates,
with no declaring edge and the numbers facing the wrong way), S3
(ticket 18 requires the inbox record and TUI slot seams as driven
hardware before its listed blockers allow them to exist), S2 (ticket 14
routes to helpers it never declares), and the still-absent settled
decisions G1–G4 (FIFO plan queue; work-stage per-ticket review with code
and test evidence; the authority-completeness certification's positive
half, which 18 regression-tests into a vacuum; releases tagging only
green main) plus F2's wording contradiction the spec refuses. Every
finding is representation-class — fixable by the slice writer against the
spec's own wording; none re-opens the spec, and no design question needs
the user.