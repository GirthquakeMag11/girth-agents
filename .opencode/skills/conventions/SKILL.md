---
name: Conventions
description: Record the user's rulings — guidelines, rules, procedures, preferences — in conventions/On_<Domain>.md. Use when the user says how something in the project is or should be done, or says something that might be such a ruling.
---

# Conventions

Conventions are user rulings about how something in the project is meant to
be, or should be, done: a guideline, a rule, a set of steps, a preference.
The `conventions/` directory is where they are recorded and organized.

## How conventions are organized

- One Markdown file per *domain*: an area of the project the rulings govern
  (testing, naming, docs, commits, and so on).
- Files are named `On_<Domain>.md`, words capitalized as in a title:
  testing rulings live in `On_Testing.md`, code-style rulings in
  `On_Code_Style.md`.
- A ruling goes into its domain's file. The first ruling for a domain
  creates the file; a new domain file opens only when no existing domain
  fits.

## Recording a ruling

When the user states how something in the project is done, and it is
settled as a ruling:

1. Determine the domain the ruling governs.
2. Create `conventions/On_<Domain>.md` if it is missing, starting the file
   with a `# On_<Domain>` heading.
3. Add the ruling, newest at the top:

   ```markdown
   - **<YYYY-MM-DD> — <one-line summary>** — <the ruling, in as much
     detail as the user gave>
   ```

Rulings are history as well as the current standard: a newer ruling on the
same subject supersedes an older one, which stays in the file and reads as
superseded.

When a ruling is mechanical — a fixed pattern that a linter rule, a
pre-commit hook, or a CI check could detect — also propose that automated
check to the user. The check enforces every time what the written ruling
only asks for. Record the ruling either way.

## Is it a ruling?

Rulings do not always call themselves rulings. If a user statement could be
read as one — a guideline, a preference, a "we always do it this way" — but
does not explicitly establish a convention or ask to be recorded, ask
before integrating it:

- **In conversation with the user:** ask directly whether the statement is a
  ruling to be formally integrated into the conventions.
- **Otherwise, or when interrupting is unsuitable:** call the skill tool
  with `tracking` and track a question — the suspected ruling, its context,
  and the provisional decision (treated as a ruling, or not) — so the answer
  can be applied to the work later.

A statement becomes a convention once it is a settled ruling. When two
established rulings conflict, the conflict is the user's to resolve: track
it as a question the same way.

## The conventions directory

If `conventions/` does not exist, call the skill tool with `bootstrapping`
and create it per that piece. Domain files are created by rulings, never by
bootstrap.

## Related skills

- tracking — the questions tracker holds suspected rulings and conflicts
  between rulings; defects are judged against the standards recorded here.
- domain-modeling — decision records explain why; a decision that implies a
  standing rule gets a convention here too.