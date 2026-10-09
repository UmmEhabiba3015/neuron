---
name: neuron-branch-per-day
description: "every Neuron day gets its own git branch, created before the day's work starts"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 68858e1d-0d14-4cd8-a094-f8651af4c8b1
  modified: 2026-10-08T09:10:23.912Z
---

Make a new git branch for every day of Neuron. Said on 2026-10-07 at the opening of Day 17c, as "make a new branch for every day".

**Why:** not stated. Days 9 to 17b had been committed straight to `main`; this ends that practice.

**How to apply:** at the opening of a day, before any work, create a branch named like the older ones: `day-<number>-<short-topic>`, for example `day-17c-past-days`. Tell worker prompts to stay on that branch. At the day's close, with her yes to commit, the branch returns to `main` through a GitHub pull request: push `main` if it is ahead, push the branch, `gh pr create`, `gh pr merge --merge --delete-branch`, pull `main`, then create the next day's branch from `main`. She asked for this on 2026-10-08 ("create pr and merge push whatever"); Day 17c was PR #9. Older branches like `day-08-identity` were deliberately left; do not delete them. A named day uses its name as the branch (`screens-day`, PR #10); the 2026-10-10 hand-off used `handoff-docs`. See [[neuron-worker-workflow]].
