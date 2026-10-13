---
name: neuron-feature-plan
description: "Since 2026-10-10 Neuron is planned by feature, not by day; scope is locked in docs/features.md"
metadata:
  type: project
---

On 2026-10-10 her husband ran a final reconciliation between the roadmap and the designer's v3 screens, locked every feature, and **replaced day-by-day planning with feature-by-feature work**.

- Scope: `docs/features.md` (Refs 1 to 42, each kept or dropped). It wins over the designs and replaced `requirements.md`, `feature-reconciliation.md`, `ui-handover.md` and `HANDOFF.md`, which were deleted.
- Order: `docs/roadmap.md` v4.0, 16 features, confirmed by him on 2026-10-13 with Drafts fourth (after Account and devices) because the composer needs small UI changes first. Search, Ask, Reflections and Looking back wait for the designer's new UI; if one comes up before its UI, move to the next ready feature.
- Designer: `docs/ui-handover-v4.md`. He said he will discuss the UX-open flows with the designer himself.

**Why:** UI asks had mixed into the plan and scope crept. A feature, broken into blocks at build time, contains decisions that would otherwise spread across days.

**How to apply:** a feature's scope is only what `features.md` says. Anything new that comes up mid-feature (a screen change, a new rule) is recorded and decided on its own, never silently added. Drafts waits for small composer changes from the designer. "Out of memory" means never sent to an AI model; both searches still find the entry. See [[neuron-branch-per-feature]], [[neuron-feature-overview-first]], [[neuron-day-numbering]].
