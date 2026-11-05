# Map: Engineer, graph-engineering expert

A wayfinder map (local-markdown tracker). Tickets are markdown documents under
`tickets/`; each is resolved one per session and recorded back into "Decisions
so far" here.

## Destination

The map ends at a written specification of the Engineer's job as the user's
graph-engineering expert:

1. **The behavior set** — designing, specifying, implementing, and testing each
   of nodes, agents, skills, and workflows; and designing, specifying,
   granting, and scoping **tools by name**.
2. **The transaction UX** — how the Engineer shows the user the graph's
   current state, every planned change (before/after per document, plus its
   consequence), and the post-change result, so the user understands and steers
   *before* anything is applied.
3. **The authoring disciplines** — what "correctly written" means per component
   kind, which the Engineer teaches and enforces.

The spec then states, per behavior, whether a **skill** (instruction over
existing tools) or a **new tool** is required — derived, never assumed. Building
the skills/tools is the immediate next effort, not this map's.

## Notes

- Work the map via **grilling**; the schema authority is `INVARIANTS.md` and
  the `graph-authoring` skill (`graph/skills/graph-authoring.md`).
- The Engineer is a primary mount (`graph/agents/engineer.md`). Its allowed
  edit boundary is `graph/config.json` and the graph agent/skill/node
  documents; never the engine's plugin, runtime, or source.
- **Pivot right reserved**: this is exploration; the exact boundaries of the
  engineering role may be redrawn mid-map (soft scope).
- **Criterion, not target**: the Engineer should become a better authoring
  agent for the other agents than `build` — this shapes the spec but does not
  ticket any reconstruction of `build`.
- `build` and all primary agents other than the Engineer are untouched by this
  map. Graph-authored tools are parked in `ROADMAP.md`, not fog here.

## Decisions so far

- **D1 — Destination**: as stated above. The map produces a spec; building the
  skills/tools is the follow-on effort.
- **D2 — Remit matrix**: `design / specify / implement / test` ×
  { nodes, agents, skills, workflows }; tools = `design / specify / grant /
  scope` by name, with tool *implementation* out of remit.
- **D3 — Tool model (a)**: grant-by-name, register-by-code. Tools live in the
  catalog, registered by plugins; the graph/Engineer relate by name only.
  Graph-authored tools → `ROADMAP.md` (parked, out of this map's scope).
- **D4 — Transaction nature**: the transaction is a **presentation contract the
  Engineer composes**, not new engine state or an endpoint. A new engine tool
  is justified only if a required behavior provably cannot be met by skills
  over existing tools.
- **D5 — Transaction model does not exist yet**: designing it is in-scope and
  precedes any interaction mechanics (e.g. confirm-before-apply), which hang
  off the model rather than predating it.
- **D6 — Tracker**: local markdown, in-repo (this directory).

## Not yet specified

- The concrete behavior list — what "design / specify / implement / test" means
  as reproducible Engineer actions for each kind.
- The authoring discipline per kind — what "correctly written" means for
  agents, nodes, skills, workflows, and tools-by-name. The map's research
  spine.
- The transaction's precise components and view order (current-state, change,
  consequence, verification). Depends on T-1/T-2.
- Whether any required behavior fails the D4 test and needs a new engine tool.
  Depends on most tickets.
- The shipped skill set (names, scope) and the `engineer.md` wiring. Depends on
  the derivation ticket.

## Out of scope

- A dedicated artifact viewer / UI surface in OpenCode (too large for now).
- Graph-authored tools — sees `ROADMAP.md`, returns only as a fresh effort.
- Reconstructing or re-authoring `build` (and any non-Engineer primary agent).
- Wiring primary agents other than the Engineer.