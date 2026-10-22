---
name: Wizard
description: Generate an interactive bash wizard for a password or other secret a command needs, or a procedure only the human can do. Use whenever you must ask the user for a secret to pass to a command; run it in a new terminal for them, asking first if that isn't established.
---

# Wizard

A **wizard** is a bash script that walks a human, step by step, through a
manual procedure that is tedious to do by hand and tedious to re-explain:
it asks for the password, token, or other secret a command needs, or opens
each URL and says exactly what to click and copy, captures the values,
writes them where they belong, confirms at every stage, and shows how many
stages are left. It never does a step only the human can do; it makes the
human's part short and unmissable.

`references/template.sh` already provides the UX — stage progress,
confirmation gates, cross-platform URL opening, hidden secret entry,
idempotent `.env` upserts, secret writes, a closing summary. Author only the
stages; the library above the `STAGES` marker is identical in every wizard
and never hand-edited.

## Trigger

This skill fires whenever you need to ask the user for a password or secret
to pass through to whatever command you needed run — authentication, a token,
an API key, a credential read by `sudo`, a CI secret, a login, anything that
should not be echoed to the log or typed into the conversation. It also fires
for the wider class it always has: a procedure only the human can perform.
Either way, once you realize you need something from the user, you own
running the wizard.

You are responsible for running the wizard for the user in a new terminal —
do not paste the secret into the conversation, and do not prompt for it
inline. If it is not already established that you may open a terminal and
run it, ask the user's permission to do so before you do.

## Process

1. **Scope the procedure.** Work out every manual step and every value
   captured along the way. Read the repo first, don't ask cold: `.env` and
   `.env.example`, the readme, workflow files (each `secrets.*` reference is
   a value the wizard must produce), and, for a migration, the current and
   target states. Then show the user the ordered stages and the values each
   produces, and confirm.
2. **Map each stage's journey.** For each stage, the precise path a human
   follows — which URL, what to do there, where the value appears, which
   variable it fills. Where you do not actually know the current UI or the
   exact command, say so and check; invent a step only after verifying it exists.
3. **Author the wizard.** Copy `references/template.sh` to the target path,
   replace the example with one `stage` per step in dependency order, and
   set `TOTAL_STAGES`. Hold the template's bar: open the URL before asking
   for its value, `ask_secret` for anything secret, `write_env` every
   persisted value, `set_secret` only what CI needs, and `confirm` before
   anything irreversible.
4. **Verify and hand off.** `bash -n` the script, run `shellcheck` if
   present, `chmod +x`, and leave the end-to-end run to the human — it opens
   browsers and blocks on human input. Trace it statically instead: every
   value captured lands where step 1 said, and every secret name matches a
   `secrets.*` reference in CI. Tell the user how to run it; if it is a
   repeatable setup, commit it and link it from the readme so the next person
   runs the script instead of asking.

A wizard is ephemeral by default: built for one run, deleted when done.
Commit it only when the user wants a repeatable setup path.

## Related skills

- conventions — a repeatable wizard the project relies on is a candidate for
  a ruling on how setup is done.