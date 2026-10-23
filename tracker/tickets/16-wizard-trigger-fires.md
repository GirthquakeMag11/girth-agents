# 16: The wizard trigger fires at the secret-needed moment

**Parent:** specs/wizard-redesign.md

**Kind:** feature

**Blocked by:** None (can start immediately)

## What it delivers

The wizard skill's description leads with the situation, not the tool: a
command that needs a password, token, API key, or other secret — such as a
sudo or authentication prompt — carries the moment's anchor words, and the
generate-a-wizard framing comes last. The exact pinned string from the
spec lands word-for-word, within the catalog's 300-character ceiling. The
skill's Trigger section gains the concrete scenario list phrased as
moments — about to run a command needing a credential the agent does not
have, or about to hand the user commands to run because a password is
needed. The wording is the trigger; the scenario gate validates it.

## Acceptance criteria

- [ ] The description is exactly the spec's pinned string, no wording drift.
- [ ] The Trigger section lists the scenarios — sudo install, auth prompt,
      registry token, CI secret, dashboard procedure — as moments, not
      mechanics.
- [ ] The skill's purpose and template pointer survive the rewrite.
- [ ] Validator green.
