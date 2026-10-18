---
name: Conventions
description: Record and organize the project's conventions — user rulings about how something in the project is meant to be, or should be, done: guidelines, rules, procedures, preferences — in conventions/On_<Domain>.md files, one per domain, created as needed. If a user statement could be a ruling but is not explicit, ask before integrating it: directly in conversation, or via the question tracker. Use when a ruling is made, found, or consulted.
---

# Conventions

Conventions are user rulings about how something in the project is meant to
be, or should be, done: a guideline, a rule, a set of steps, a preference.
The `conventions/` directory is where they are recorded and organized.

## How conventions are organized

- One Markdown file per *domain*: an area of the project the rulings govern
  (testing, naming, docs, commits, and so on).
- Files are named `On_<Domain>.md`, words capitalized as in a title. For
  example, testing rulings live in `On_Testing.md`; process rulings for
  code style would live in `On_Code_Style.md`.
- A ruling is added to its domain's file, creating the file when it is the
  first ruling for that domain, and opening a new domain file only when no
  existing domain fits.

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

Rulings are history as well as the current standard: newer rulings on the
same subject supersede older ones. Do not delete old entries; when two
entries conflict, the newest governs and the older is read as superseded.

## Is it a ruling?

Rulings do not always call themselves rulings. If a user statement could be
interpreted as one — a guideline, a preference, a "we always do it this
way" — but does not explicitly establish a convention or ask to be
recorded, ask before integrating it:

- **In conversation with the user:** ask directly whether the statement
  counts as a ruling to be formally integrated into the conventions.
- **Otherwise, or when interrupting is unsuitable:** track the question with
  the tracking skill — the suspected ruling, its context, and the
  provisional decision (treated as a ruling, or not) so the answer can be
  applied to the work later.

Integrate a statement as a convention only once it is a settled ruling.

## Consulting conventions

- Before deciding how something in the project ought to be done, check the
  domain file that covers it. The newest ruling on the subject governs.
- A genuine conflict between established conventions is not resolved
  unilaterally — see the tracking skill.

## The conventions directory

If `conventions/` does not exist, load the bootstrapping skill and create
the empty directory per its conventions section. Domain files are created
by rulings, not by bootstrap.

## Related skills

- bootstrapping — creates the `conventions/` directory.
- tracking — the questions tracker is the channel for suspected rulings and
  for conflicts between established conventions; defects are judged against
  the standards recorded here.