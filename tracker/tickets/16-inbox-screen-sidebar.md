# 16: The inbox screen and the sidebar

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 14 (inbox machinery)

## What it delivers

The inbox is a TUI screen — an email-inbox-shaped list, sorted by
receipt, scrollable and selectable — reached through a command and the
command palette; opening an item enters the seeded answerer session.
The sidebar shows `Inbox: {n}` and the engine's live report of pieces
in motion — built, under review, sent for repair — reported by the
engine, derived from its own state transitions, updated per transition,
never a parse of half-written files. The committed ledger remains the
recovery truth; the live report is the display truth.

## Acceptance criteria

- [ ] The inbox screen is reachable by command and palette, and lists items in receipt order.
- [ ] Selecting an item enters the seeded session.
- [ ] The sidebar renders `Inbox: {n}` for the current project.
- [ ] The in-motion breakdown reads the engine's live report and updates on transitions.
- [ ] The sidebar never parses half-written records for its display.