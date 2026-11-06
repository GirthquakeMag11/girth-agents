---
description: Test-drive the current release in an isolated throwaway container
---

Load the `test-drive` skill (if not already loaded) and follow it. Run the setup phase to its end, hand
me the seat with the drive script, then block on `scripts/wait.sh` — set your
shell tool to the longest timeout it allows (ideally none). When the wait
returns, the seat's opencode process has ended: run the wrapup phase, then
teardown, and report the accept/reject verdict with the evidence that supports
it — a seat that ended with no session created is a completed no-session drive
(I got the information I needed before even starting a session), never a
failure — no further prompting. If you are ever unsure whether the wrapup ran, run
the wrapup and teardown scripts anyway: never finish a turn with a seat or
the credentialed image still standing.