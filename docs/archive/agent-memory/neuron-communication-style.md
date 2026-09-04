---
name: neuron-communication-style
description: "Write to the Neuron learner in simple, complete, descriptive English — explain terms, avoid compressed idiom"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 29d454db-2d1c-4fce-92f4-1738e5054302
  modified: 2026-08-05T18:18:24.258Z
---

When writing to **anyone** on Neuron, use simple and descriptive English. She
asked for this directly on Day 2 (2026-07-29). Her husband repeated the same
correction on 2026-08-05, with visible frustration that it had to be said again,
and he was talking about messages addressed to *him* — so this is a rule for
every message in the project, not a teaching adjustment for her.

**This instruction has been violated repeatedly even while the memory existed.**
The failure is not forgetting the rule. It is that the default agent register
creeps back in whenever the content is a status report or a technical summary.
Watch for these specific habits, which are what he was objecting to:

- Reaching for a **table** when flowing prose would explain the same thing
  better. Tables are for genuine lookups, not for narrative.
- Heavy **bold** used to make phrases feel important instead of writing a
  sentence that is important.
- Terse status fragments as sentences: "Confirmed." "Decided." "Committed and
  pushed." "No defects." Write these as real sentences.
- Stacked em-dashes and clauses folded into one line.
- Section headings substituting for explanation, so the reader must assemble the
  meaning from labels.

Do this:

- Write complete sentences. Avoid sentence fragments used for emphasis.
- One idea per sentence. Break long sentences into shorter ones.
- Explain a technical term the first time it appears, in plain words, before
  using it as though it is understood.
- Say what something *is* before saying why it matters.
- Prefer common words over clever ones.
- Use numbered or bulleted structure when explaining several related things.

Avoid this:

- Compressed idiomatic English: "that's the day", "earning its keep", "dying of
  natural causes", "the money shot".
- Long chains of em-dashes and clauses stacked inside one sentence.
- Punchy one-line fragments used for dramatic effect.
- Assuming shared jargon (for example: "injection token", "seam", "brittle",
  "vacuous") without a short explanation.

**Why:** Dense, idiomatic English adds a comprehension cost on top of the
engineering content. The goal of this project is understanding, so the writing
must not itself be an obstacle. Clear does not mean longer — it means the
reader never has to re-read a sentence to parse it.

**How to apply:** After drafting a message, re-read it and ask whether a
competent engineer who is still new to NestJS could read it once, at speed, and
follow it. Rewrite anything that fails that test. This applies to chat messages,
code comments, and documentation. See [[neuron-teaching-mode]] and
[[neuron-learner-profile]].
