# The graph that ships with the engine

The workflow the engine runs. Config content, not engine code — the
node tree, the helper fittings, the skills, and the stamp vocabulary
the workflow uses. When the graph changes, this document changes with
it: the two are the agreement.

## 1. The documents

One document per work unit, in the project itself:

- **Ticket** — the unit of implementation: a title line, a `**Kind:**`
  line, a stamp line, and a "What it delivers" section.
- **Spec** — the unit the tickets are sliced from (with the spec lane).

Every state transition is a stamped, dated line on the document.

## 2. The stamp vocabulary of this workflow

| Stamp | Written form | Meaning | Written by |
|---|---|---|---|
| ready | `**Ready:** <date>` | this ticket can be implemented; admission reads it | whoever makes the ticket |
| verdict | `**Verdict:** pass` or `fail` | the reviewer's judgement on the ticket itself | the reviewer |
| done | `**Done:** <date>` | the work passed; this ticket is finished | *open ruling 1* |

A document missing a declared stamp, or carrying a stamp no condition
mentions, is a loud defect — never routed, never adopted.

## 3. The shipped graph

```
implement-from-ticket ──▶ review-implementation ── verdict=pass ──▶ (run ends)
        ▲                         │
        └────── verdict=fail ─────┘
```

- `implement-from-ticket` — where the graph begins: a ticket is
  admitted by its ready stamp, and the builder dispatches to implement
  it. The ticket is the contract and is never edited by the builder.
- `review-implementation` — dispatches the reviewer, fresh every time.
  The reviewer verifies by running, then writes the verdict stamp onto
  the ticket document.
- `verdict = pass` ends the run — the work's state is the stamps on the
  ticket; nothing else is written.
- A `fail` verdict routes back to `implement-from-ticket`, resuming the
  builder's session with the reviewer's report. Retry cap 3; exhausting
  it is a loud retry-limit defect — no bounce composed yet.
- The review's stamp space is exactly `pass` and `fail`; anything else
  halts as a defect.

## 4. Helpers and skills

A **helper** (agent) is a worker: its own file carries the identity and
the substance — who it is, its standing craft, and its grants (model,
capabilities, permissions). The craft lives in the agent's own body,
not in a skill.

- **builder** — implements the claimed ticket test-first at its seams,
  works by the repo's own conventions, and fails openly rather than
  fabricate.
- **reviewer** — verifies against the ticket on both axes — does it
  follow the project's conventions, does it deliver what the ticket
  says — and stamps exactly pass or fail, with reasons.

A **skill** is a reusable technique a helper draws on — named, described,
attachable to any helper — never a persona. The shipped graph has two:

- `test-first` — build at the seam the ticket names: a failing test that
  pins the behavior, made green, refactored within the green.
- `verify-by-running` — judge work by running it and reading the diff,
  never by another's written claim.

Both helpers run on pre-granted allow-list permissions over the live
session contract (`SPEC.md` §6); models are config per helper.

## 5. The lanes to come

Built only after the above is proven live:

- **The spec lane**: `tickets-from-spec` — slices an approved-stamped
  spec into ticket documents → `review-tickets` — grades the document
  set. Pass ends the lane and stamps the spec; fail repairs the slicer,
  cap 3, loud on exhaustion.
- **The ticket trigger**: watches the tickets directory for
  ready-stamped tickets — one match per idle turn, alphabetical, each
  ticket its own run through the graph above. A passed ticket's done
  stamp is what stops it matching again.

## 6. Open rulings

1. **Who writes the done-stamp** at pass: the engine's terminal stroke,
   the reviewer's own pen, or a marks task.
2. **The spec's admission stamp** — its wording (a dated Approved line?).
3. **`review-tickets`' grading criteria** — what makes a sliced ticket
   set right.
4. **The exact written forms** of the verdict and done lines — the
   label family is settled; the words are candidates until ruled.