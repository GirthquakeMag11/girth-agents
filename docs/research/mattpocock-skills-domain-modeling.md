# Research: mattpocock/skills — the `domain-modeling` skill

**Question:** What does the `domain-modeling` skill in `mattpocock/skills` actually prescribe about domains, terms, contexts, and multi-context repositories? (Ground truth for a redesign around "one project = one repository vs multiple contexts".)

**Date:** Mon Oct 26 2026

**Source:** Primary — `https://github.com/mattpocock/skills`, cloned in full. HEAD at time of research: `5beb35b040e3de97e54fa9e386d7e42d15c295c2` (2026-10-19), 546 commits.

Every verbatim passage below is cited as `path @ commit`. The current file layout (after the 2026-09-17 rename) and the history that produced it are both documented, because the skill's content has moved around and been renamed several times.

---

## 1. What the skill is, and its trigger (verbatim)

### Current description (frontmatter, `skills/engineering/domain-modeling/SKILL.md` @ `5beb35b`)

> `description: Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a GLOSSARY.md, or recording or editing an ADR.`

### Current body — purpose vs. passive reading (`SKILL.md` lines 6–8 @ `5beb35b`)

> "Actively build and sharpen the project's domain model as you design. This is the *active* discipline: challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely *reading* `GLOSSARY.md` for vocabulary is not this skill: that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)"

The companion repo doc `docs/engineering/domain-modeling.md` (@ `5beb35b`, line 3) frames the same idea in DDD vocabulary:

> "`domain-modeling` builds and sharpens a project's **ubiquitous language** while you are designing."

### Trigger history (it has been rewritten twice)

- **First version** (`domain-model/SKILL.md` @ `ab45d5e`, 2026-04-17) was not the modern skill — it was a *user-invoked grilling* skill whose description ended with: "Use when user wants to stress-test a plan against their project's language and documented decisions."
- **Modern skill born** in the 2026-06-12 restructure (`skills/engineering/domain-modeling/SKILL.md` @ `221ffca`), description: "Actively build and sharpen a project's domain model while you design … Use when the user wants to refine domain terminology, build a ubiquitous language, pin down what a term really means, record a hard-won architectural decision, or when another skill needs to actively maintain the domain model."
- **2026-08-13 reword** (`e12e7ec`, then `54bc6b6`): "pin down domain terminology or a ubiquitous language" → "discussing codebase terminology"; "or when another skill needs to maintain the domain model" caveat *dropped*. Produced the current description above. (Per `CHANGELOG.md` PR #848.)

---

## 2. How a "domain" / "context" is defined

The skill never gives a definition of "domain". It defines the **artifacts** instead: a glossary and ADRs, and *where they live*. "Context" is the term it uses for a unit of the model, and it is defined purely extensionally, by file layout.

### File structure (`SKILL.md` lines 10–40 @ `5beb35b`), verbatim

> Most repos have a single context:
>
> ```
> /
> ├── GLOSSARY.md
> ├── docs/
> │   └── adr/
> │       ├── 0001-event-sourced-orders.md
> │       └── 0002-postgres-for-write-model.md
> └── src/
> ```
>
> If a `GLOSSARY-MAP.md` exists at the root, the repo has multiple contexts. The map points to where each one lives:
>
> ```
> /
> ├── GLOSSARY-MAP.md
> ├── docs/
> │   └── adr/                          ← system-wide decisions
> ├── src/
> │   ├── ordering/
> │   │   ├── GLOSSARY.md
> │   │   └── docs/adr/                 ← context-specific decisions
> │   └── billing/
> │       ├── GLOSSARY.md
> │       └── docs/adr/
> ```
>
> Create files lazily: only when you have something to write. If no `GLOSSARY.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.

So: a **context** = one directory holding a `GLOSSARY.md` (and optionally its own `docs/adr/`). The whole repository is the address space; multi-context is detected by the *presence of a `GLOSSARY-MAP.md` file at the root* — there is no other signal and no flag elsewhere.

---

## 3. The full method (verbatim)

The active-discipline method is five moves plus one gate, from `SKILL.md` lines 42–74 @ `5beb35b`:

> ### Challenge against the glossary
>
> When the user uses a term that conflicts with the existing language in `GLOSSARY.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y. Which is it?"
>
> ### Sharpen fuzzy language
>
> When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account': do you mean the Customer or the User? Those are different things."
>
> ### Discuss concrete scenarios
>
> When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.
>
> ### Cross-reference with code
>
> When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible. Which is right?"
>
> ### Update GLOSSARY.md inline
>
> When a term is resolved, update `GLOSSARY.md` right there. Don't batch these up: capture them as they happen. Use the format in [GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md).
>
> `GLOSSARY.md` should be totally devoid of implementation details. Do not treat `GLOSSARY.md` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.
>
> ### Offer ADRs sparingly
>
> Only offer to create an ADR when all three are true:
>
> 1. **Hard to reverse**: the cost of changing your mind later is meaningful
> 2. **Surprising without context**: a future reader will wonder "why did they do it this way?"
> 3. **The result of a real trade-off**: there were genuine alternatives and you picked one for specific reasons
>
> If any of the three is missing, skip the ADR.

Note how "term capture" works: inline, during the session, at the moment of resolution — never batched at the end. The repo doc (`docs/engineering/domain-modeling.md` @ `5beb35b`, lines 5 and 78) makes this explicit: "A glossary written at the end is a summary of a session; the inline version is the session's output." and "`GLOSSARY.md` changes **during** the conversation, not in a burst at the end."

---

## 4. The glossary format it prescribes (verbatim)

`skills/engineering/domain-modeling/GLOSSARY-FORMAT.md` @ `5beb35b`.

### Structure template (lines 5–23)

> ```md
> # {Context Name}
>
> {One or two sentence description of what this context is and why it exists.}
>
> ## Language
>
> **Order**:
> {A one or two sentence description of the term}
> _Avoid_: Purchase, transaction
>
> **Invoice**:
> A request for payment sent to a customer after delivery.
> _Avoid_: Bill, payment request
>
> **Customer**:
> A person or organization that places orders.
> _Avoid_: Client, buyer, account
> ```

Note the header is literally `# {Context Name}` — one glossary file is named and described as a "context" (even a single-context repo's root glossary carries a context name).

### Rules (lines 25–30)

> - **Be opinionated.** When multiple words exist for the same concept, pick the best one and list the others under `_Avoid_`.
> - **Keep definitions tight.** One or two sentences max. Define what it IS, not what it does.
> - **Only include terms specific to this project's context.** General programming concepts (timeouts, error types, utility patterns) don't belong even if the project uses them extensively. Before adding a term, ask: is this a concept unique to this context, or a general programming concept? Only the former belongs.
> - **Group terms under subheadings** when natural clusters emerge. If all terms belong to a single cohesive area, a flat list is fine.

### Single vs. multi-context repos (lines 32–60) — the entire multi-context mechanism

> **Single context (most repos):** One `GLOSSARY.md` at the repo root.
>
> **Multiple contexts:** A `GLOSSARY-MAP.md` at the repo root lists the contexts, where they live, and how they relate to each other:
>
> ```md
> # Glossary Map
>
> ## Contexts
>
> - [Ordering](./src/ordering/GLOSSARY.md): receives and tracks customer orders
> - [Billing](./src/billing/GLOSSARY.md): generates invoices and processes payments
> - [Fulfillment](./src/fulfillment/GLOSSARY.md): manages warehouse picking and shipping
>
> ## Relationships
>
> - **Ordering → Fulfillment**: Ordering emits `OrderPlaced` events; Fulfillment consumes them to start picking
> - **Fulfillment → Billing**: Fulfillment emits `ShipmentDispatched` events; Billing consumes them to generate invoices
> - **Ordering ↔ Billing**: Shared types for `CustomerId` and `Money`
> ```
>
> The skill infers which structure applies:
>
> - If `GLOSSARY-MAP.md` exists, read it to find contexts
> - If only a root `GLOSSARY.md` exists, single context
> - If neither exists, create a root `GLOSSARY.md` lazily when the first term is resolved
>
> When multiple contexts exist, infer which one the current topic relates to. If unclear, ask.

This is the *entire* statement of how a term relates to a context. There is no per-term context annotation, no shared/owned/borrowed-term vocabulary, no rule about a term appearing in more than one glossary. The only relationship the map records **between contexts** is integration (events emitted/consumed, shared types) — not which terms belong to which context. "Which context does this term belong to?" is answered only by *inference from the current topic*, with "ask" as the fallback.

---

## 5. The ADR format (`ADR-FORMAT.md` @ `5beb35b`)

- Lives in `docs/adr/`, sequential `0001-slug.md` numbering; created lazily (lines 1–5).
- Template is a bare title plus "1-3 sentences: what's the context, what did we decide, and why" (lines 9–15).
- Optional: `Status` frontmatter, `Considered Options`, `Consequences` (lines 17–23).
- The three-part bar is repeated verbatim (lines 29–37).
- "What qualifies" (lines 39–47) explicitly includes context-related decisions:

> - **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
> - **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no-s are as valuable as the yes-s.

In a multi-context repo, ADRs split: root `docs/adr/` for "system-wide decisions", `src/<context>/docs/adr/` for "context-specific decisions" (per the `SKILL.md` diagram above, and `skills/engineering/setup-matt-pocock-skills/domain.md` line 9 @ `5beb35b`).

---

## 6. History: the multi-context concept predates everything else

The `GLOSSARY-MAP.md` / multi-context design was present in the **very first commit** that introduced this skill family (`domain-model/CONTEXT-FORMAT.md` @ `ab45d5e`, 2026-04-17), then called `CONTEXT-MAP.md`. The "Single vs multi-context repos" section in its April 2026 form is word-for-word the same mechanism that survives today (only the file names changed).

Timeline of the skill:

| Commit (date) | What happened |
| --- | --- |
| `ab45d5e` (2026-04-17) | First appearance: `domain-model/` = a user-invoked grilling skill that *also* maintained `CONTEXT.md` and `CONTEXT-MAP.md` (multi-context from day one). |
| `221ffca` (2026-06-12) | Restructure: the interview half is split off (becomes `grilling`); `domain-modeling` becomes the standalone "active discipline" skill with `CONTEXT-FORMAT.md` + `ADR-FORMAT.md` in its own directory. Current description inherited from here. |
| `e12e7ec` / `54bc6b6` (2026-08-13) | Trigger reworded to "discussing codebase terminology"; "another skill needs to maintain" caveat dropped. |
| `d80fa0f` (2026-09-17) | Repo-wide rename `CONTEXT.md`/`CONTEXT-MAP.md` → `GLOSSARY.md`/`GLOSSARY-MAP.md` (PR #1120). Content unchanged. |

So the asking repo's inspiration, whichever version it copied, carried the multi-context `…-MAP.md` concept from its origin on 2026-04-17. The rename is cosmetic (see §8 for the naming debate).

---

## 7. How the rest of the repo treats projects, contexts, domains

- **Selection of single vs. multi happens in a *different* skill.** `setup-matt-pocock-skills/SKILL.md` (@ `5beb35b`) is the "run once per repo" configurator. For domain docs it **defaults to single-context without asking**:
  > Section C: Domain docs. Default to **single-context** (one `GLOSSARY.md` + `docs/adr/` at the repo root). This fits almost every repo; write it without asking.
  > Offer **multi-context** (a root `GLOSSARY-MAP.md` pointing to per-context `GLOSSARY.md` files) only when exploration found monorepo signals.

  "Monorepo signals" are enumerated at line 30: `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/` — "a genuinely large multi-package repo". (Note: multi-package *build* signals, not *domain* signals, are what trigger offering multi-context.)
- **Reading the glossary** (in `setup-matt-pocock-skills/domain.md`, written into user repos as `docs/agents/domain.md`): read root `GLOSSARY.md`, or the `GLOSSARY-MAP.md` and "each one relevant to the topic"; in multi-context repos also check `src/<context>/docs/adr/` (lines 7–9). Then "use the glossary's vocabulary… Don't drift to synonyms the glossary explicitly avoids" (line 43), and flag ADR conflicts explicitly (lines 47–51).
- **`wait-what`** (`skills/productivity/wait-what/SKILL.md` @ `5beb35b`, line 7): "use the ubiquitous language from `GLOSSARY.md` (follow `GLOSSARY-MAP.md` to the right one if the repo has more than one)."
- **`grill-with-docs`** (`SKILL.md` @ `5beb35b`) is a one-line delegation: "Call the Skill tool twice, for 'grilling' and 'domain-modeling'." It drives the glossary through the grilling interview.
- **`wayfinder`, `triage`, `improve-codebase-architecture`, `ask-matt`, `codebase-design`, `wait-what`** all reference `domain-modeling` or `GLOSSARY-MAP.md`; `docs/engineering/domain-modeling.md` line 86 calls it "the vocabulary layer under everything else."
- **The repo's own root glossary** (`/GLOSSARY.md` @ `5beb35b`) is a single-context example (header `# Matt Pocock Skills`, a `## Language` section with `_Avoid_` lists, `## Relationships`, `## Flagged ambiguities`) — matching an *earlier* version of the prescribed template, before the template dropped "Relationships" and "Flagged ambiguities" sections (dropped in commits `e7df78b` / `e3b90b5`, May 2026).

There is no other notion of "project" than "the repository you are in". Every path in the skill is relative to the repo root. One repo = one model unless a `GLOSSARY-MAP.md` splits it into contexts.

---

## 8. Neutral summary of the model

The skill's model has four moving parts:

1. **Repository is the root unit.** Everything is anchored at the repo root; there is no model of anything larger (workspaces, orgs) or smaller (files).
2. **"Context" = a bounded area of the model, and mechanically = a directory owning a `GLOSSARY.md`** (with optional context-local `docs/adr/`). Multi-context is a binary, signaled *only* by the existence of a root `GLOSSARY-MAP.md`.
3. **The map's only two jobs** are (a) an index of contexts with a one-line description of each, and (b) **relationships between contexts**, expressed as integration (`X emits EventY; Z consumes`, "Shared types for …"). There is no per-term scoping: a glossary simply *is* the vocabulary of its context, and the skill **infers** which context "the current topic" belongs to, falling back to *ask*.
4. **Two artifacts, two bars** (from `docs/engineering/domain-modeling.md` §"Two artifacts, two bars"): `GLOSSARY.md` holds *what a thing is* in one–two sentences with `_Avoid_` synonyms, written inline whenever a term crystallises; ADRs hold a single *decision* (context–choice–reason), gated by the three-part bar (hard to reverse + surprising + real trade-off). The glossary "is a glossary and nothing else" — implementation details are the single most-reported failure mode.

---

## 9. What it does — and does NOT — provide for multiple-context repositories

**It DOES provide:**
- A file-layout convention for multi-context repos: root `GLOSSARY-MAP.md` → per-context `GLOSSARY.md` (+ optional per-context `docs/adr/`), with root `docs/adr/` for system-wide decisions.
- A map schema limited to: context index (name → path, one-line purpose), and inter-context relationship notes (events, shared types).
- A rule for *choosing where to write*: "infer which one the current topic relates to. If unclear, ask."
- A rule for *when* to go multi-context at all: only offer it on hard monorepo/build signals; default single-context (in the setup skill, not in `domain-modeling` itself).
- A distinct ADR category for cross-context facts: "Integration patterns between contexts" and "Boundary and scope decisions" (ownership + reference-by-ID).

**It does NOT provide:**
- Any concept of a term *applying to* a specific context, or being *shared between* contexts, beyond the loose "Shared types" note in the map example. There is no owned/shared/borrowed vocabulary, no per-term context tag, no namespace syntax inside a `GLOSSARY.md`.
- Any rule for detecting or resolving term *collisions across contexts* (the same word meaning different things in two contexts). The only mechanism that would surface that is the general "challenge against the glossary" move, which assumes a single glossary.
- Any notion of a project larger or smaller than one repository, or of a project spanning multiple repositories.
- Any explicit guidance on when a term belongs in the system-wide layer vs. a context layer (there is no "system-wide GLOSSARY.md" in the multi-context layout — only system-wide ADRs).
- In practice, strong guardrails *at all* for multi-context: `docs/engineering/domain-modeling.md` itself flags that the skill's guidance "is not yet strong enough to prevent the growth [of bloated glossaries] in the first place, and the issue tracking that is still open," and recommends splitting into `GLOSSARY-MAP.md` only when a *lean* glossary "still covers two domains that a reader would not want to hold at once."
- A settled answer on naming: `docs/engineering/domain-modeling.md` records an unresolved debate over `GLOSSARY.md` vs. `CONTEXT.md` (the DDD word "context" is the standing argument for the latter; the map pairing is the argument for the former), and notes "every other skill in the set looks for `GLOSSARY.md`, so a rename means patching all of them."

---

## Uncertainty / caveats

- The research is complete for the `mattpocock/skills` repo at HEAD `5beb35b` (2026-10-19). The repo is actively edited; the *naming* of the convention (`CONTEXT` → `GLOSSARY`, done 2026-09-17) is recent and could change again.
- Two open-issue workarounds are noted in `docs/engineering/domain-modeling.md` but their issue threads were not read: #717 (cross-reference the issue tracker, not just code + glossary) and #557 (split glossary-half from ADR-half for teams with their own ADR conventions).
- The distinction between "context" as *model unit* and "context" as *surrounding information* (the word is used in both senses, e.g. in the ADR bar's "surprising without context" and in "this project's context") is lexical in the source; this research reports the file-layout definition, which is the only operational one.