---
name: neuron-learning-debt-blocks-days
description: "On Neuron, open learning debt blocks the next day — her asking to skip it is not enough to skip it"
metadata:
  type: feedback
---

Direction from the project owner (her husband) on 2026-09-04: **open learning
debt from a day must be repaid before the next day begins, and a request from
her to move on is not sufficient to skip it.**

This deliberately overrides the standing rule in [[neuron-teaching-mode]] that
if she says she wants to move on, you move on and record what was skipped. That
rule still applies inside a day, to an individual teaching block. It does not
apply to a day's debt at the day boundary.

First application: Day 8's TypeORM debt blocks Day 9. The study prompt is at
`docs/learning/day-08/study-typeorm.md`.

**Why:** worker agents write correct code faster than she can learn it, so the
repository accumulates code she owns and cannot explain — which is the exact
failure this project exists to prevent. Debt that is carried rather than paid
compounds, because the next day builds on the thing she did not learn. Day 10
enforces ownership by reading a `select: false` column, so Day 8's TypeORM
concepts stop being optional on that day.

**How to apply:** say plainly that it is the owner's direction rather than your
own judgement, give her the real reason it matters for the coming day, and then
run the study session. Mark debt closed only when she can explain the concept
without reading the code — see [[neuron-worker-workflow]] and
[[neuron-testing-approach]] for the predict-run-compare shape that closes it
fastest.
