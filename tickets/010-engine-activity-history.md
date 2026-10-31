# 010 — Engine activity history and boot epoch

**Status:** passed (independent review, 2026-10-30)  
**Sequence:** 1 of 5  
**Depends on:** 009  
**Spec:** `DASHBOARD-MOTION-HISTORY-SPEC.md` §5–6, §10.1

## Context

The dashboard has only `runtime.lastEvent` and `runtime.lastDefect`; it
cannot show an activity timeline or reliably identify a new handoff. The
engine must expose a bounded, structured activity history without leaking
prompt, output, session, usage, message, or config data.

## Work

- Add an engine-process/workspace-scoped activity ring. All OpenCode panels connected to the same engine share it; it is not per-panel-session.
- Expose `graph-map.runtime.history` and `runtime.historyEpoch`.
- `historyEpoch` is a non-empty string unique to each engine boot.
- `history` is chronological oldest→newest, capped at 100, with monotonic
  `seq` starting at 1 and resetting on boot.
- Every entry is a new object with exactly these 15 keys:
  `seq`, `at`, `kind`, `dispatchId`, `workflow`, `node`, `phase`, `outcome`,
  `label`, `from`, `to`, `status`, `terminal`, `code`, `valid`.
- Allowed kinds: `queued`, `dispatched`, `step`, `handoff`, `completion`,
  `defect`, `reloaded`.
- Stamp `at` at capture when absent.
- Enrich `workflow` from the dispatch record where available; use `null`
  otherwise.
- Suppress the `completion` entry whose status is `defect` when a dispatch
  defect entry was recorded, so one termination is not shown twice. If no
  defect entry was recorded, project the orphan completion as a `defect`
  entry rather than dropping it.
- Include engine-level defects with no dispatch id.
- Exclude `heartbeat`, `ready`, `version`, `paused`, `resumed`, and every
  other non-activity event.
- Never copy prompts, outputs, file contents, session ids, upstream paths,
  session modes, usage/tokens, defect messages, reload faults, or config
  paths.
- Keep `lastEvent` and `lastDefect` compatibility.
- Add tests for the allowlist, projection, workflow enrichment and null
  fallback (engine-level defect, reload, missing dispatch record), timestamp
  capture, completed/cancelled rows, dispatch defect deduplication, orphan
  defect completion projection, kinds/statuses, cap/order/seq, two-boot
  epoch uniqueness and history/seq reset, shared-engine visibility,
  shutdown cancellation, exclusions, and secret-field rejection. Assert `graph-map` still exposes
  `lastEvent` and `lastDefect` alongside history.
- No dashboard UI in this ticket.

## Validation condition

Engine tests pass. A `graph-map` response includes `runtime.history` and
`runtime.historyEpoch`; every history entry has exactly the 15 keys; no
forbidden key appears; the ring cap/order/seq and reboot reset are tested;
two boots have non-empty, different epochs and reset history/seq; all
panels share the engine-scoped history; workflow null fallbacks are tested;
dispatch defect plus completion produces one termination row; `lastEvent`
and `lastDefect` remain.

## Out of scope

- History rendering, row grammar, responsive layout.
- Motion.
- Persisting history to disk.
- Run archive.

## Review gate

The reviewer must read the spec and implementation, run the engine suite, and
answer:

- Is the projection allowlisted and free of secrets?
- Are epoch, seq, cap, order, timestamps, workflow enrichment, and defect
  deduplication correct?
- Does `graph-map` expose both fields while preserving compatibility?
- Are the required tests present and meaningful?
