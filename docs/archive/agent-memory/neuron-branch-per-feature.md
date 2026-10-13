---
name: neuron-branch-per-feature
description: "every Neuron feature gets its own git branch from main, closed by PR, merge, pull"
metadata:
  type: feedback
---

Make a new git branch for every unit of work on Neuron. Originally "a new branch for every day" (2026-10-07). Since work moved to features on 2026-10-10 ([[neuron-feature-plan]]), it is one branch per feature.

**Why:** not stated. Days 9 to 17b had been committed straight to `main`; this ended that practice.

**How to apply:** before any work, create `feature-<short-name>` from `main` (for example `feature-finish-writing`). Tell worker prompts to stay on that branch. At the close, with her yes to commit: push the branch, `gh pr create`, `gh pr merge --merge --delete-branch`, pull `main`, then create the next branch. Older `day-*` branches and four kept merged branches stay; do not delete them. The reconciliation itself used `final-reconciliation`. See [[neuron-worker-workflow]].
