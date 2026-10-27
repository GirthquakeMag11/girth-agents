# Glossary

The project's domain is OpenCode extension catalogs: this repository
publishes the girth-agents catalog of skills, agents, and commands that
create and maintain a project's management scaffold.

The project's shared language: one canonical term per concept. See the
glossary skill for the entry format.

## Terms

**Inbox**: the user-facing screen and the system's asynchronous
send/receive channel to the user — requests the engine writes, answered
in seeded sessions whose recorded replies the engine picks up. In this
project "inbox" means this, unless OpenCode's own inbox — a session's
pending-prompt queue — is expressly named.

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
