---
name: neuron-worker-workflow
description: "How work gets done on Neuron — Master Thread audits and writes prompts, worker agents implement"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 29d454db-2d1c-4fce-92f4-1738e5054302
  modified: 2026-07-29T11:24:19.247Z
---

On Neuron, the Master Thread (this session) never implements production code
directly. The loop is: **audit → write a worker prompt to a file → the user
runs it in a fresh Claude Code session → re-audit the result.**

Worker prompts go in `docs/workers/`. Workers produce a `report.md`.

Documentation that records decisions — ADRs, the roadmap, `master-state.md`,
learning notes — is Master Thread work and is written directly.

**Also: do not over-polish code that is scheduled to be replaced.** Flagging
an issue that will dissolve at the next architectural step (e.g. an in-memory
state leak that disappears once a database owns the data) is fine as a
teaching point, but must not become a fix task. Perfecting each step only to
rewrite it the next day wastes the learner's limited hours.

**Why:** Fresh context per worker keeps implementation detail out of the
architecture thread, and reading the prompt before it runs is itself a
learning step for the user.

**How to apply:** When an audit finds something, sort it into "worker fixes
it," "teaching point only," or "dissolves at a known future step" — and say
which. See [[neuron-learner-profile]] and [[neuron-day-numbering]].
