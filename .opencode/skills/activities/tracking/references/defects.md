# Handling a defect

## Fix now, or track

Defects follow the bug rules (`bugs.md`), with one difference: a defect
never stops work, so "blocking" becomes:

1. **The task's own work would create or extend the defect** — its
   deliverable would not meet the project's standard → fix now.
2. **The fix is obvious and cheaper than tracking** → attempt now.
3. **Otherwise → track it** and return to the task.

The attempt rule carries over in full: a "small cleanup" that proves deeper
than it looked may be backed out of and tracked, with everything tried,
learned, or half-refactored in the work log. The workaround doctrine for
bugs has nothing to govern here, since a defect never blocks a task.

## Closing

Close the entry when the defect is remediated. A remediation users could
notice also gets a changelog entry.