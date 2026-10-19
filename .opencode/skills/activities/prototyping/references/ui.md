# UI prototype

Several **radically different** UI variations on one route, switchable from a
floating bottom bar, so the user flips between them and picks one (or steals
bits from each). Use it for "what should this look like" questions; for
logic, use `references/logic.md`.

## Where they live

Prefer hosting the variants on an **existing page** — real header, sidebar,
data, and density expose design problems an empty route hides. Gate the
render on a `?variant=` search param, keeping the page's data fetching above
the switcher. If a new section would naturally live inside an existing page,
mount the variants there. Only when the thing genuinely has no home do you
create a throwaway route, named so it is obviously a prototype.

## The variants

Default to **3**, cap at 5. Each must be **structurally different** — layout,
information hierarchy, primary affordance — not just colours. Two similar
drafts means redoing one. Read-only: point any mutation at a stub.

## The switcher

A fixed bottom-centre bar: left/right arrows cycling the variant (wrapping),
a label showing the current key, and keyboard `←`/`→` (not while an input is
focused). Arrows update the URL param so the variant is shareable and
reload-stable. The bar is visually distinct and gated out of production
builds. One shared component for both hosting shapes.

## Capture and clean up

Once a variant wins, capture the verdict (which, and why). Fold the winner
into the real code — rewritten properly, not promoted as-is — and take the
losing variants plus the switcher onto the throwaway branch, not main, since
they are the primary source and rot fast in main.

## Anti-patterns

Variants that differ only in colour or copy; sharing too much layout between
variants; wiring variants to real mutations; promoting prototype code
directly to production.