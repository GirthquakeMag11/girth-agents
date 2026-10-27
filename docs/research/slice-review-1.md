# Slice review 1 — the plugin ticket graph

**Reviewed against:** `specs/plugin.md`
**Tickets:** the eighteen files in `tracker/tickets/` with `Parent:
specs/plugin.md`, numbered `01`–`18` (the directory also holds four other
graphs — installer, installer-experience, handoff-pickup,
wizard-redesign — which share numbers with this graph; see §5).
**Format source:** `.opencode/skills/tracking/references/tickets.md`

The graph, as listed:

| # | Ticket | Kind | Blocked by |
|---|--------|------|------------|
| 01 | plugin skeleton + channel | feature | — |
| 02 | catalog atomic sweep | refactor | — |
| 03 | engine skeleton | feature | 01 |
| 04 | bootstrap, activation, off-switch | feature | 01, 03 |
| 05 | leash, commits, absorb-or-alarm | feature | 03 |
| 06 | six helpers defined | feature | 01, 03 |
| 07 | dispatch permission match | feature | 06 |
| 08 | entry-point tool | feature | 03 |
| 09 | review-gate core | feature | 06, 08 |
| 10 | criteria + report shapes | feature | 09 |
| 11 | report pile, routing, exception | feature | 09, 10, **12** |
| 12 | tracker kinds + context map | feature | 02 |
| 13 | inbox machinery | feature | 03, 12 |
| 14 | knowledge pipeline | feature | 06, 12, 13 |
| 15 | inbox screen + sidebar | feature | 13 |
| 16 | recall layer | feature | 09, 11, 12 |
| 17 | real-case harness + merge gate | feature | 01, 09 |
| 18 | dogfooding two-checkout | feature | 03, 11 |

---

## 1. Coverage

Every settled Implementation Decision must be advanced by at least one
ticket. The graph covers the big spine — distribution skeleton (01), the
deadly-clean catalog sweep (02), the engine loop and ledger (03), startedness
(04), the leash (05), the helper roster (06, 07), the one door (08), the gate
(09, 10, 11), the records work (12), the inbox (13, 15), knowledge (14, 16),
testing (17), dogfooding (18) — but the following settled decisions have no
ticket:

**G1 — `/cut-release` and the release path are unticketed.** Spec lines 59
and 68: releases are tags with a GitHub Release page carrying the changelog
section, and `/cut-release` re-scopes to tag plus Release page. No ticket in
this graph advances either half. A same-named ticket exists in the
installer-experience graph (`14-cut-release-publishes`), but it declares that
spec as parent, so this graph does not advance the decision. *Representation.*

**G2 — the catalog re-fit is only partially swept.** Ticket 02 lands the
renames, retirements, births, and shelf moves, but four line-67/69 re-fits
have no touchpoint: `codifying` gaining the convention-crash arrival path;
`domain-modeling`'s re-fit (caregiver-side discipline / user-side guidance);
`maintaining-docs` zero-drift tolerance; and the tracking skill's reference
work extending for the new kinds. *Representation.*

**G3 — the direction-change path is unticketed.** Spec line 90: plan
amendment becomes a new reviewed revision; aborting closes the workstream's
records with the reason; re-answering reopens the resolved question. No
ticket carries any of the three. *Representation.*

**G4 — keystone verification is under-attached.** Spec line 156 lists seven
build-time keystones; ticket 01 verifies three (agent IDs, `./tui` auto-load,
`ctx.storage`). The other four belong to later tickets but none mentions them:
the event catalog / `session.idle` payload (03), the per-machine registry
storage (04), `codemode` semantics (13's seeded sessions), sidebar-slot
live-reactivity (15). The tickets that would consume them do not carry their
verification. *Representation.*

**G5 — the FIFO plan queue is stated nowhere.** Spec line 111: several
cleared plans queue in received order. 03 has the queue, 08 feeds it, but the
ordering rule is absent. *Representation, minor.*

**G6 — the work stage's ticket-by-ticket review is not spelled out.** Spec
line 107: work is reviewed ticket by ticket, code and test evidence as proof,
the stamp on the ticket. 09's criteria cover the plan gate; 11 stamps
artifacts generally. The per-ticket work review with evidence is not stated.
*Representation, minor.*

**G7 — authority-completeness has only its negative half.** Spec line 110:
the plan's PASS certifies that every user-answerable question visible in the
session was asked. The regression case in 17 covers the failure direction,
but no ticket states the positive criterion. *Representation, minor.*

**G8 — "releases tag only green main" and harness seeding are dropped.**
Spec line 134: 17 gates merges to main but omits the release-side rule and
the note that the existing harnesses seed the new one. Folds naturally into
G1 / 17. *Representation, minor.*

Two spec stances are tickets' business only as invariants, not features —
"user sessions live outside the engine and never compete for its queue"
(line 96) and "non-code repositories run the same system with criteria
fitting the substance's kind" (line 117). Neither is contradicted; neither is
asserted anywhere a reader would see it. Flagged as adjacent-to-G4: if the
graph is the implementation contract, these two deserve at least an acceptance
criterion (03 for the first, 09 or 10 for the second). *Representation,
advisory.*

No ticket defines anything that flatly contradicts the spec; the one wording
contradiction found is in §4 (F2).

## 2. Slicing discipline

**S1 — one numbering violation.** Ticket 11's `Blocked by:` lists **12**, so
a blocked ticket (11) is numbered before its blocker. The ticketing rules are
explicit: a blocked ticket is numbered after what blocks it. The dependency
itself is real — 11's system-defect record needs 12's provenance flag — so
the fix is to swap the numbers (or re-sequence the pair), not to drop the
edge. The frontier remains computable step by step apart from this wrinkle;
no cycles exist. *Representation.*

**S2 — ticket 04 is two tickets wearing one number.** Bootstrap (consent
statement, eager run, whitelist asks, gh-declination ruling) and `/park`
(its own thin door, resume-by-re-bootstrap, registry hygiene) are separately
demoable vertical paths, and the spec treats `/park` as its own door. Six
acceptance criteria and the whole of line 89-and-94 in one slice is the
thickest ticket in the graph. Borderline single-context-window size.
*Representation — split candidate.*

**S3 — ticket 12 is a grab bag.** New tracker kinds, the
authority/information retrofit, the provenance flag, the context map, the
`context:` field, scoped reads, and warranted placement deviations — three
demonstrable verticals in one ticket. Not fatal, but flag. *Representation —
split candidate.*

Everything else is a thin vertical with a user-shaped deliverable, no spec
nested inside a ticket, and no implementation-layer narration in **What it
delivers.**

## 3. Format

All eighteen tickets carry all five fields — Parent, Kind, Blocked by, What
it delivers, Acceptance criteria. Parent names the spec path per the rules.
Kind values are only `feature` (17) and `refactor` (1) — all within the
whitelist. Acceptance criteria are concrete and checkable throughout, with
one soft spot: 14's "A review FAILs a piece that uses a term in a drifted
sense" is checkable only through a demonstration; acceptable. **What it
delivers** avoids file paths (skill names like `code-review`'s references are
names, not paths) and is user-perspective throughout. Format: clean.

## 4. Fidelity

Where the tickets must carry the spec's exact numbers and wording, they
mostly do:

- **Caps** — 09 states three fix-rounds and a ten-minute step limit, the
  plugin's own configuration, tool-enforced, ungrantable to judgment.
  ✅ spec line 108.
- **The whitelist** — 04: name, purpose, license when undeclared; the
  starting version when nothing states one; the optional gh setup as an
  action, credentials through gh, never stored separately. ✅ spec line 89.
- **The forbidden list** — 05 reproduces all five clauses, including
  "history reset," "self-merging," and "no network commands beyond its own
  pushes and self-reports." ✅ spec line 86, and the non-fast-forward wall
  holds-and-raises rather than merges (line 93). ✅
- **The recall budget** — 16 states the one-hundred-entry cap with
  least-re-ratified retirement and the two read modes. ✅ spec line 130.
- **The harvested-scenario taxonomy** — 17 carries the exact three-way
  classification. ✅ spec line 135.
- **Typed shapes** — 10 reproduces the report's four fields and the brief's
  five fields exactly (line 92, 108); 13 reproduces the message record's
  fields exactly (line 122); 11 has the pile-once/stamp rule (line 116) and
  the sole-practitioner omission noted below.
- **Two-checkout dogfooding** — 18 matches line 97.
- **Per-info-question routing** — 13 matches line 87.

Four fidelity findings:

**F2 — ticket 06 contradicts the keystone stance.** Spec line 82: "The spec
does not presume a fallback; a failed verification is a genuinely new moment,
taken to the user when it arises." Ticket 06: "either way the helpers arrive
whole" — that presumes the fallback the spec refuses. Ticket 01's
"recorded honestly" is right as far as it goes but stops short of the
take-it-to-the-user consequence. *Representation — the wording should follow
the spec; the spec need not move.*

**F3 — ticket 06 grants a carve-out the spec doesn't.** "failing openly
rather than asserting **unless the job needs an assertion it can verify**"
adds an exception to the spec's plain "failing openly rather than asserting"
(line 74). *Representation, minor.*

**F4 — 11 drops "with a count."** Spec line 111: identical failures
"coalesce into one report **with a count**." 11 has the report and the
consent rule but not the count. 18 repeats the omission. *Representation,
minor.*

**F5 — 08 drops "dated."** Spec line 102: the confirmation marker in the
plan is dated. 08 says "confirmation marker," never dated. *Representation,
minor.*

Two adjacent minor omissions: 09 omits "a cap too low for the work is the
exception, not an override" (line 108); 11 omits that the reviewer is the
pile's sole practitioner (line 116).

## 5. Cross-graph observation

The tickets directory holds five numbered graphs sharing one flat space;
numbers collide (this graph's `01` is not the installer graph's `01`). None
of the reviewing rules here requires a change — the format rules assume one
spec per tickets directory — but the collisions are worth a note if the
directory is meant to survive. The release-publishing neighbor
(`14-cut-release-publishes`, parent `specs/installer-experience.md`) is the
natural home for G1's missing work, if the user means for one ticket to
serve both specs; as the graphs stand, neither declares that.

---

## Verdict

**FAIL** — the graph cannot be implemented as written. The gaps are G1
(`/cut-release` and the Release page are unticketed), G2 (four catalog
re-fits absent from the sweep), G3 (the direction-change path unticketed),
and G4 (four keystone verifications unattached to their tickets), plus the
dependency-number violation in S1 (ticket 11 blocked by 12) and the F2
wording contradiction of the spec's keystone stance. All findings are
representation-class — fixable by the slice writer against the spec's own
wording; none re-opens the spec.