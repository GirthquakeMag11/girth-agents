# AGENTS.md — orientation for a new agent

Write it so an agent arriving with zero context can orient itself
immediately. After reading AGENTS.md alone, the agent knows:

- What the project is and what it is for.
- How to build, run, and test it — the exact commands.
- Where things live — the layout it will actually navigate.
- What it must read before working: the hazards for its area, the
  conventions for its domains, the decisions that touch its area, and the
  glossary's terms.
- Where to record what it finds: the trackers, conventions, the domain
  model, the changelog.

Point rather than repeat: a line naming `tracker/HAZARDS.md` lets that file
speak for itself, and a copy of its contents would go stale. AGENTS.md is
loaded into every agent's context, so each line has to earn its place.