---
name: Wizard
description: Use when a command needs a password, token, API key, or other secret from the user — such as a sudo or authentication prompt — or when a procedure is the user's alone to perform. Generates an interactive bash wizard and offers to run it in a new terminal, waiting for an explicit yes.
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

This skill fires the moment a command needs something from the user —
before asking for it inline, and before handing the user commands to run
themselves. The moments:

- A command you are about to run needs a password — a `sudo` install or
  prompt, a login, an SSH passphrase.
- A tool needs a token, API key, or other credential you do not have — an
  authentication prompt, a registry token, a CI secret.
- A procedure is the user's alone to perform — a dashboard setting, a
  browser-only step, a one-off migration.

When you catch yourself about to ask for a secret, or about to tell the
user to run something themselves because a password is needed, stop: this
skill fires instead. A secret is never typed into the conversation and
never prompted inline — the wizard collects it in its own terminal.

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
   for its value, `ask_secret` for anything secret, a probe per captured
   value — the cheapest meaningful one, a format check at the very least,
   a live check wherever one exists — run by `ask_checked` before the value
   is persisted, `write_env` every persisted value, `set_secret` only what
   CI needs, and `confirm` before anything irreversible; steps that can
   fail carry a `try` too.
4. **Verify statically.** `bash -n` the script, run `shellcheck` if
   present, `chmod +x`, and trace it statically instead of running it
   end-to-end — it opens browsers and blocks on human input. Every value
   captured lands where step 1 said, and every secret name matches a
   `secrets.*` reference in CI.
5. **Proofread for self-containment.** Walk the finished wizard as a user
   who has only the terminal: every instruction or clarification still
   living only in the chat is written into the wizard's own lines. The
   chat never holds a required step.
6. **Offer, then launch.** Offer in one line — what the wizard does, and
   asking to run it in a new terminal — and wait for an explicit yes,
   every time, with no standing permission. On the yes, open a fresh
   terminal with the wizard running per `references/launching.md` and stay
   with the user until the closing summary lands; if no terminal can be
   opened, print the exact one-line command for the user's own terminal
   and stop.

A wizard is ephemeral by default: built for one run, deleted when done.
Commit it only when the user wants a repeatable setup path.

## Related skills

- codifying — a repeatable wizard the project relies on may be ruled
  structurally integral to the project through its conventions.