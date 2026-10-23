# The wizard, redesigned: a trigger that fires, a launch it offers, input it shows, runs that verify themselves

## Problem Statement

The wizard skill exists to take the human's part in a procedure and make
it short and unmissable, but in every real test it misses. At the moment
a command needs a secret — a sudo password for an install, an auth
prompt — the agent does not fire the skill: it hands back instructions to
run things myself, which is exactly what the wizard should have made.
When the skill does fire, the launch is wrong at both extremes: usually
nothing is offered and more instructions come back; sometimes the wizard
is run without asking. The wizard itself misleads and loops: secret input
is invisible, so mid-entry there is no way to know whether a paste
arrived whole or a key registered; needed instructions live in the chat
instead of in the wizard, so a run only makes sense flicking back and
forth; and when something fails there is no way to learn it without
editing and relaunching the script repeatedly. The skill fails its one
job: catching these moments, and carrying them to a clean end.

## Solution

The wizard skill is redesigned around the moment it must catch and the
run it must carry. The trigger is rebuilt the way the failure evidence
demands: the description leads with the situation itself — the command
that needs a password, token, API key, or other secret — in the words of
that situation, so firing happens when the secret is needed rather than
after the agent has already decided to defer; a concrete scenario list in
the skill's Trigger section rehearses the moments. After authoring, the
agent offers to launch the wizard in a new terminal and waits for an
explicit yes — every time, neither dumping instructions nor launching
unasked. Secret input is censored, not invisible: every keystroke and
every pasted character shows as a mask character, and backspace erases
one, so a wrong key or a truncated paste is caught the moment it happens.
The wizard carries every instruction and clarification; the chat holds
summaries, never a required step. Every captured value — and every step
that can fail — carries a check the wizard runs itself, the cheapest
meaningful probe, before the value is persisted; a failed check re-asks
in the same stage with the error shown, looping until the value passes or
is explicitly skipped, and the closing summary lists everything skipped
or still failing with its exact error. A run knows itself — what failed,
why, and what to do — without edit-and-relaunch cycles.

## User Stories

1. As a user mid-setup, I want the agent to recognize the moment a command
   needs a password or token from me and build a wizard for it right then,
   so I am never handed "run these commands yourself."
2. As a user, I want the agent to offer to launch the wizard in a new
   terminal and wait for my yes, so nothing runs without my say-so and
   nothing is dumped back on me as instructions.
3. As a user typing a secret, I want a mask character for every key I
   press — and for every character I paste — so I know mid-entry whether
   the keys registered and the paste arrived whole.
4. As a user correcting a typo, I want backspace to erase the last masked
   character, so the mask stays truthful while I edit.
5. As a user re-running the wizard, I want my saved values offered as
   defaults without their characters reappearing, so a faster re-run costs
   no secrecy.
6. As a user following the wizard, I want every instruction and
   clarification I need written into the wizard itself, so I never flip
   back to the chat to make sense of a step.
7. As a user, I want each captured value verified before the wizard
   persists it — the cheapest meaningful probe, a format check at least —
   so a wrong or truncated value is never saved quietly.
8. As a user whose paste or keying failed, I want the wizard to re-ask in
   the same stage with the error shown, so I fix the mistake where it
   happened instead of relaunching the whole script.
9. As a user who cannot satisfy a check right now, I want to skip it
   explicitly, so the wizard moves on without pretending the value passed.
10. As a user finishing a run, I want a closing summary that lists
    everything skipped or still failing with the exact error, so nothing
    wrong hides behind a long screen of green.
11. As a user of a hands-on procedure — a dashboard, a one-off migration —
    I want the same wizard treatment, steps and checks where they fit, so
    the skill's original reach survives the redesign.
12. As a user who wants the wizard on purpose, I want the /wizard command
    to build it and then take the same offer-to-launch path, so manual use
    matches triggered use.
13. As a user whose terminal the agent cannot open, I want the exact
    one-line command printed, so the wizard still runs where the terminal
    is mine.
14. As this catalog's maintainer, I want the trigger validated through the
    real scenario tests across fresh sessions, so "fixed" is never claimed
    until the scenarios pass.

## Implementation Decisions

### The trigger: the description leads with the situation, not the tool

The skill's description is its only lever — OpenCode lists skills to the
model every step by ID, name, and description, alphabetically and
untrimmed, and whether one fires is the model's judgment matching the
situation to that description; there is no guaranteed-fire mechanism. The
current description fails because it matches only after the agent has
already decided to ask, and because it lacks the moment's own words. The
rebuilt description leads with the situation, carries its anchor words
(sudo, password, token, API key), keeps the procedure reach the user
settled earlier, and demotes the generate-a-wizard framing to the end:

> Use when a command needs a password, token, API key, or other secret
> from the user — such as a sudo or authentication prompt — or when a
> procedure is the user's alone to perform. Generates an interactive bash
> wizard and offers to run it in a new terminal, waiting for an explicit
> yes.

It stays within the catalog's 300-character ceiling. The skill body's
Trigger section gains a concrete scenario list drawn from the user's real
tests — the sudo install, the auth prompt, the registry token, the CI
secret, the dashboard procedure — phrased as moments: when you are about
to run a command that needs a credential you do not have, or you would
hand the user commands to run because a password is needed, this skill
fires instead. Because firing is probabilistic by nature, the trigger is
only ever validated, never assumed: the scenario tests are the gate, and
the spec is not done until they pass.

### The launch protocol: offer, then wait

After authoring and statically checking the wizard, the agent offers to
launch it in a new terminal and waits for an explicit yes — every time,
with no standing permission and no silent launch; the offer is one line
saying what the wizard does and asking to run it. On the yes, the agent
opens the terminal with the wizard running and stays with the user
through the run; its part ends when the wizard's closing summary lands.
The launch mechanics live in a reference of the wizard skill: the
per-platform commands that open a fresh terminal on something already
there, from the same family the wizard's library uses to open URLs, and a
single degradation sentence — if no terminal can be opened, the agent
prints the exact one-line command for the user's own terminal. There is
no designed headless branch beyond that sentence.

### Censored input: every keystroke shows, the secret never does

The wizard's secret prompt stops hiding keystrokes: each keypress and
each character of a paste echoes as a mask character, backspace erases
one, and Enter submits, so the user always knows mid-entry whether the
keys registered and the paste arrived whole — a truncated paste shows as
a short mask. On re-runs the existing saved value remains the default as
today, but its characters never reappear: the prompt offers the default
showing nothing more than the value's length as filled mask characters.

### The wizard carries every instruction

The authoring step gains a self-containment proofread: the agent walks
the finished wizard as a user who has only the terminal, and any
instruction or clarification still living only in the chat is written
into the wizard's own lines. The launch offer stays a summary; it never
duplicates a step the wizard shows. A user who never looks back at the
chat loses nothing.

### Verification: a check per value, a loop per failure

The wizard's library gains a check helper: a labelled probe command. A
passing check prints the label green; a failing check prints the label
red followed by the probe's own error output, verbatim, and records the
failure. Every captured value carries its cheapest meaningful probe — a
format check at the very least, a live probe (the credential exercised
against its service) wherever one exists — run before the value is
persisted; steps that can fail carry checks too, so outcomes are known
rather than assumed. A failed check re-asks the value in the same stage
and re-checks, looping until the value passes or the user explicitly
skips it; a skip is recorded with its reason, never mistaken for a pass.
The closing summary lists everything skipped or still failing with the
exact error shown at the failure, so a run ends by saying what is wrong
and what remains, with nothing to edit-and-relaunch to learn. How a stage
declares its labelled probe, and how the library captures the probe's own
error text, is the implementation's to shape — the design rule here is the
floor: a check per value and per fail-able step, run before persisting,
with re-asking on failure.

### The skill's process grows, the doors and records follow

The skill's process becomes: scope the procedure from the repository's
own evidence, map each stage's journey, author the wizard from the
template with one stage per step, run the static checks, perform the
self-containment proofread, then offer to launch. The /wizard command's
text is refreshed to point at the same process, and the README's skill
and command rows are rewritten to say what the reworked trigger and
protocol do. The catalog's own bookkeeping follows at implementation:
the linter keeps gating the description's length and shape, and the
changelog's Unreleased queue records the rework as user-visible changes
beside the /wizard entry already there.

## Testing Decisions

The wizard's library is the machine-test seam, exercised the way the
installer harness exercises its script: a zero-framework harness pipes
canned answers through fixture wizards and asserts on what it can see —
the mask echo (one mask character per keystroke and per pasted
character, erasure on backspace), the check-helper's pass and fail paths
with the probe's error text, the in-stage re-ask loop until pass or
explicit skip, and the closing summary's skipped-and-failing list —
plus the run's exit code, which stays true to whether anything failed.
`bash -n` and shellcheck, where present, keep standing on the template
and on every generated wizard. The behavior a harness cannot see — the
model firing at the secret-needed moment, and offering before launching —
is validated by the scenario list the user runs across fresh sessions and
models; the scenario gate is part of this spec, and the redesign is not
done until it passes. Prior art is the repository's own harness:
zero-framework, deterministic, exit-code-true, driven by canned stdin.

## Out of Scope

- A designed headless/remote branch: the launch reference's degradation
  sentence is the whole of it.
- Wizard shapes beyond the bash script the template already builds.
- Changing any other skill's trigger, or the installer, or the catalog's
  linter beyond what the description rules already enforce.
- Automated simulation of the model's firing behavior: the scenario gate
  is manual by nature.
- Windows-specific launch variants beyond the launch reference's common
  entries.

## Further Notes

- This spec pins the decisions charted on the map at
  `plans/wizard-redesign.md`; that map is marked done once this spec is
  approved, and the implementation is sliced from this spec.
- The sustained failure evidence — zero triggers across repeated scenario
  tests, no offer to launch, or launching unasked — and the trigger
  mechanics research it motivated are the floor under the trigger
  decisions; a reader who forgets why the description leads with the
  situation can re-derive it from the map's Notes.
- The description string above is the decision, quoted in full because
  the wording is the trigger; any edit revisits the scenario gate.
- User-visible changelog entries land at implementation as Changed lines
  for the wizard and the /wizard command, the Add for which is already
  queued.