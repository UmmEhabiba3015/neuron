---
name: neuron-day-numbering
description: "Neuron's public LinkedIn day numbering starts at Day 0 and is the canonical numbering"
metadata: 
  node_type: memory
  type: project
  originSessionId: 29d454db-2d1c-4fce-92f4-1738e5054302
  modified: 2026-07-29T11:24:24.980Z
---

Neuron is a public build challenge on LinkedIn. Posts are numbered from **Day
0**.

**The plan was extended to 40 days on 2026-09-04** (roadmap v2.0), so the
numbering now runs Day 0 → Day 39. It was originally 30 days, Day 0 → Day 29.
The extension added a whole phase for the frontend and made room for the work
Days 0–8 delivered beyond the original plan.

Anchor dates:
- Day 0 = 2026-07-27 (repo init)
- Day 1 = 2026-07-28 (pnpm workspace + NestJS scaffold + `GET /entries`)
- Day 2 = 2026-07-29 (persistence)
- Day 39 = final day (was Day 29 before the 2026-09-04 extension)

Days inserted between numbered days take a letter (17a, 17b, 17c) or a
name (Screens Day, inserted 2026-10-08 before Day 18), so later numbers
never shift. She confuses lettered days: name the day at the top of every
block.

The original `docs/roadmap.md` draft was written one-indexed (its "Day 2" was
the scaffold day), making it off by one from the public posts. The roadmap was
renumbered to match the public numbering, which is now canonical.

**Why:** The LinkedIn posts are already published and cannot be renumbered, so
the internal roadmap had to move instead.

**How to apply:** Always use public numbering when discussing days. If an old
document says "Day N," check whether it predates the renumber — it may mean
N-1. See [[neuron-worker-workflow]].
