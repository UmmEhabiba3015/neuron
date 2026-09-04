---
name: neuron-learner-profile
description: "Who the Neuron project is for — the learner's background, skill level, and known knowledge gaps"
metadata: 
  node_type: memory
  type: user
  originSessionId: 29d454db-2d1c-4fce-92f4-1738e5054302
  modified: 2026-07-29T11:24:11.683Z
---

The primary user of this repo is a 2022 computer engineering graduate returning
to development after a long gap. She completed boot.dev's TypeScript backend
path, so TypeScript fundamentals are solid, but NestJS, databases, auth, and
testing are all new. Available time: ~7 focused hours/day.

Her husband (a senior software engineer) set up the project scaffolding, the
master-thread workflow, and the constitution. He occasionally speaks in the
thread to configure things, then hands back to her. When someone identifies as
him, expect senior-level framing and terser direction.

**Known knowledge gaps to actively teach, not assume:**
- Unit tests and e2e tests — the Day 1 worker agent wrote all existing specs;
  she has not learned how Jest, supertest, or `@nestjs/testing` work, or why
  unit and e2e tests differ. Teach comprehension before authorship.

**Why:** Worker agents can produce correct code faster than she can learn it,
which silently creates code she owns but cannot explain. The project's whole
purpose is understanding, so any worker-generated concept needs a matching
teaching block.

**How to apply:** Before a worker introduces an unfamiliar tool or pattern,
plan how she'll learn it. After a worker delivers, check whether she can
explain the result — not just whether it runs. See [[neuron-worker-workflow]].
