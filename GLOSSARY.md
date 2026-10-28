# Glossary

The project's domain is OpenCode extension catalogs: this repository
publishes the girth-agents catalog of skills, agents, and commands that
create and maintain a project's management scaffold.

The project's shared language: one canonical term per concept. See the
glossary skill for the entry format.

## Terms

**The engine**: a specific component of the design — a separate process
from OpenCode and an agent harness in its own right. It is a server that
maintains its own working loop, spawning headless sessions that direct
agents in tasks with structured inputs and outputs. It feeds its own
output back in as further input, routing the output of one task into the
input of another. The user interacts with it through the plugin — a
separate entity.

**Inbox**: the user-facing screen and the system's asynchronous
send/receive channel to the user — requests the engine writes, answered
in seeded sessions whose recorded replies the engine picks up. In this
project "inbox" means this, unless OpenCode's own inbox — a session's
pending-prompt queue — is expressly named.

**The plugin**: the interaction entity of the design. It is what OpenCode
is pointed at — the system's installable half — and what adds the
catalog to a project: the skills, commands, and tools, registered
through its transforms at setup, and the agents, whose definitions ship
with it as the plain Markdown files OpenCode discovers. It carries the
user's surfaces — the sidebar, the inbox screen, the palette — through
which the user provokes the system and answers it. The engine, which
does the work, is a separate entity.

**Entry node**: a representation of where something is routed as input
from outside the system — the graph's inward seam, the reverse of an
exit node. The answering record that resumes a halted chain enters
through an entry node.

**Exit node**: a representation of where the conditions of a node's
output are routed to something outside the system — the graph's
outward seam.

**Helper agent**: a named, role-shaped worker agent the engine holds and
dispatches — each defined by one job, carrying the configuration,
toolset, permissions, and precisely-tailored context that job takes,
never more. Helpers are agents embedded in the engine's harness,
employed in headless sessions for accomplishing its tasks.

**Release**: the act of cutting CHANGELOG.md's `## [Unreleased]` queue into
its dated section under a Semantic Versioning number — and tagging it — per
the versioning ruling in `conventions/On_Versioning.md`. A release always
carries a version number; changes before a release have none.
_Avoid_: version bump, deploy.

### Context freshness

**Fresh Context**: information and/or instruction that deserves attention
because it is still true and important.

**Stale Context**: information and/or instruction that requires
modification or excision because it is not or is no longer true and/or
important.

**Consumed Context**: context that was previously fresh but was made stale
as a consequence of the actions taken since it was fresh.

**Context Consumer**: the entity that can be credited or blamed for a given
piece of context being consumed.

**Partially Consumed Context**: context that has separate parts, some
consumed while others remain untouched and fresh.
