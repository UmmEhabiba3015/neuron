---
name: neuron-testing-approach
description: "On Neuron, she is not required to hand-write test suites — read/predict/break/observe instead"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f519f5ff-2d5d-4488-886c-9d38d10e75ea
  modified: 2026-07-31T21:38:09.960Z
---

On the Neuron project, she is **not** required to write test suites by hand.
Direction given by her husband (the senior engineer who set up the project) on
2026-08-01, Day 4: AI writes tests in practice now, so the durable skill is
understanding what tests are, how they work, and the difference between unit,
integration and e2e — not typing assertions.

**Why:** hand-writing suites spends hours on a skill that is being automated,
while the judgement skill (what does this suite fail to cover?) is what actually
prevents bugs. The Day 3 `ORDER BY` bug shipped past all four checks because no
test stated the rule — a gap in judgement, not in typing speed.

**How to apply:** run testing lessons as **read → predict → break → observe**.
Ask her to predict an outcome, then break something and run it. Two experiments
that worked extremely well on Day 4 evening, both producing counter-intuitive
results:

1. Rename `@Controller('entries')` to `'journal'` — the app is completely broken
   and all 29 unit tests still pass; 9 of 10 e2e fail.
2. Delete `EntriesRepository` from the module's `providers` array — typecheck
   and build pass, the server crashes at boot, and 29 unit tests still pass
   because spec files declare their own providers.

Do not relitigate this decision or push her to write suites from scratch. See
[[neuron-teaching-mode]] and [[neuron-worker-workflow]].
