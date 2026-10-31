# 014 — Captures, documentation, and roadmap

**Status:** passed (independent review, 2026-10-30)  
**Sequence:** 5 of 5  
**Depends on:** 013  
**Spec:** `DASHBOARD-MOTION-HISTORY-SPEC.md` §10.3, §11, §12

## Context

The new split, History timeline, and motion need durable evidence and docs.
The Run archive must be recorded as a post-v1.3 roadmap item, distinct from
the session activity ring.

## Work

- Update the real `DashboardView` proof harness and fixtures to include fixed
  `runtime.history` entries with fixed `at`/`seq` and a non-empty epoch.
- Freeze `Date.now` at the snapshot `fetchedAt`; fix active `startedAt` and
  `fetchedAt`; set `TZ=UTC`; format History timestamps deterministically.
- Produce captures from the actual `DashboardView` with these exact names:
  - `dashboard/proof/captures/history-active-160x50.txt`
  - `dashboard/proof/captures/history-idle-160x50.txt`
  - `dashboard/proof/captures/history-active-120x40.txt`
  - `dashboard/proof/captures/history-strip-80x24.txt`
- Remove the stale `product-*`, `live-boundary-*`, and `strict-*` captures
  that show the old single full-height Details pane, and remove their stale
  README listings/snapshots if they no longer represent the current view.
- Update `dashboard/proof/README.md` with commands, new artifact names, and
  the fixed-clock/TZ rules.
- Update `ROADMAP.md`: retarget O1.2 “Dispatch history and tracing” to a
  post-v1.3 section as the run archive, distinguish it from the activity
  ring, record this motion/history slice as active dashboard work, and replace
  the stale “active pulse” wording at the v1.3 dashboard entry.
- Correct stale docs:
  - `SPEC.md` (remove the “no history” claim and document runtime history);
  - `THREADS.md` (replace “gently pulse” with the border-sweep/static-container
    contract; replace the “three panes Outline, Graph, Details” description
    with the four-surface layout including History; update the tickets
    005–009 statement to include 010–014);
  - `ROADMAP.md` (active-pulse wording, O1.2 placement/version, current focus);
  - `DASHBOARD-SPEC.md` and `DASHBOARD-MOTION-HISTORY-SPEC.md` references so
    no old pulse or single-right-pane contract remains.
- Run the full dashboard and engine suites, including anti-canvas and the
  replaced responsive/motion tests.
- Confirm no canvas renderer and no obsolete graph-view command/agent.

## Validation condition

The four exact captures exist and come from the real view with deterministic
clocks/timestamps; History is populated, idle Details is empty, 120×40 is
split, and 80×24 shows the one-line strip. Stale captures/README entries are
removed or replaced. SPEC.md, THREADS.md, ROADMAP.md, DASHBOARD-SPEC.md, and
the proof README match the spec. All suites pass.

## Out of scope

- Run archive implementation.
- Persisted history.
- Editing/dispatch controls.

## Review gate

The reviewer must inspect the captures, commands, docs, roadmap, and test
outputs, and answer:

- Do the four exact captures prove the split, History, idle Details, and
  one-line strip?
- Are clocks/timestamps deterministic, and are stale captures/listings gone?
- Does ROADMAP put O1.2 post-v1.3 as the run archive and keep the activity
  ring distinct?
- Do SPEC.md, THREADS.md, ROADMAP.md, DASHBOARD-SPEC.md, and the proof README
  match the new motion/history contracts?
- Are old motion/layout contracts and tests gone?
- Does the anti-canvas check pass, and is the Run console unchanged?
- Do all suites pass?
