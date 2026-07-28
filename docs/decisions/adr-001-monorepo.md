# ADR-001 — Does the monorepo earn its complexity?

**Status:** Accepted, with one immediate correction and one scheduled reversal.
**Date:** 2026-07-28 (Day 2)
**Context:** [roadmap.md](../roadmap.md), Day 2, open question.

---

## Current state (checked, not assumed)

Before answering anything: the repo is not actually a linked workspace yet.

```
apps/api/          # empty
apps/web/           # empty
packages/types/     # empty
packages/shared/    # empty
packages/config/    # empty
pnpm-workspace.yaml  # empty file — no `packages:` field
```

`pnpm-workspace.yaml` exists but declares nothing, so today `apps/api` and
`apps/web` are already, in effect, "just two directories" — the question in
the title isn't hypothetical, it's the literal current state. Whatever this
ADR decides, action item 1 is to make the file structure stop lying about
itself.

---

## Question 1 — What breaks if `apps/api` and `apps/web` are just two directories?

Two unlinked directories in one git repository is a specific, worse-than-either
combination: it inherits the coordination *cost* of a monorepo (shared PR
review surface, shared git history, shared CI file) without any of the
coordination *benefit* (compiler-enforced consistency between the two apps).
Concretely, with no workspace protocol resolving `packages/*` locally:

| Symptom | Why it happens |
|---|---|
| The API changes a response shape and the web app doesn't notice until it's running | Nothing statically ties web's copy of a type to api's copy — there is no shared, single-source type at all |
| `zod`, `typescript`, or `date-fns` drift to different versions in `apps/api` vs `apps/web` | Each has its own lockfile; nothing forces them to agree |
| CI needs two separate install steps and can't cache one dependency tree for both | No single `pnpm-lock.yaml` at the root |
| "Shared" code in `packages/types` requires a publish-and-reinstall cycle to actually reach either app | Without the workspace protocol (`workspace:*`), a local package is not resolvable in place — it has to be installed from *somewhere*, same as if it lived in a different repo |

The sharpest way to state this: **an unlinked monorepo is a multi-repo that
pretends not to be one.** You'd get strictly more value from either committing
to real workspace linking, or actually splitting into two repositories and
accepting that shared types get versioned and published like any external
dependency. The current empty state is the one option that's worse than both.

**Resolution:** wire `pnpm-workspace.yaml` now:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

This is a five-minute fix, not a design decision — but it's the one that
makes the rest of this document non-hypothetical.

---

## Question 2 — What actually belongs in `packages/types`, and could a generated client do it better?

The honest answer changes over the project's lifetime, and pretending it
doesn't is how `packages/types` turns into a junk drawer.

**What people usually put there, and which of it survives scrutiny:**

| Candidate content | Keep hand-written? |
|---|---|
| Request/response DTO shapes (`CreateJournalEntryDto`, `JournalEntryResponse`) | **No** — this is exactly what a generated client does better (see below) |
| Backend domain/ORM entities (`JournalEntry` as stored) | **No** — these are `apps/api` implementation detail; the frontend should never see the storage shape, only the wire shape |
| Small cross-cutting vocabulary (`Paginated<T>`, `Result<T, E>`, branded ID types) | **Yes** — these aren't the API contract, they're shared grammar with no natural generator |
| Validation logic the *client* needs before it ever hits the network (form-level checks) | **Yes, conditionally** — only if it's runtime logic, not just a type. A generated client gives you shapes; it doesn't give you "reject this before spending a request on it." |

**The generated-client case, stated plainly:** once `apps/api` uses
`@nestjs/swagger` to emit an OpenAPI specification, running that spec through
a generator (`openapi-typescript` or equivalent) produces request/response
types *and* typed fetch functions, derived from the real, running API surface
— not from a second, hand-maintained description of it that can silently
drift. Hand-writing DTO twins in `packages/types` is maintaining a copy of
something the framework can already tell you authoritatively. For the DTO
layer specifically, a generated client is the better tool, not a comparable
alternative.

**Where it doesn't reach:** anything that isn't the HTTP contract. If a
worker/queue package appears later (Phase 3, Day 19 — background jobs), the
job payload passed between a producer and a worker never crosses HTTP, so
there's nothing to generate from. That's genuine shared-package territory.

**What this means for `packages/types`, on this timeline:**

- **Days 2–8 (Phase 1):** hand-write DTOs here. There is no API surface stable
  enough to generate from yet, and bootstrapping is cheaper than tooling.
- **Around Day 8 (Phase 1 review day):** once the core request/response shapes
  exist and have survived contact with a real client, replace the hand-written
  DTOs with a generated client. Shrink `packages/types` down to the small
  vocabulary types that a generator will never produce.
- Treat a `packages/types` that is still holding hand-written DTOs past that
  point as a sign the migration was skipped, not as a neutral steady state.

---

## Question 3 — What does the monorepo actually cost?

Not the popular objection ("more complex to set up") — the real ones, specific
to this project:

**1. It removes the boundary that would otherwise force `apps/api` and
`apps/web` to only ever talk over HTTP.** Two apps that communicate through a
network request are supposed to be independently deployable, independently
failing units. Folder proximity in a monorepo is a standing invitation to
reach across that line at compile time — importing a backend module directly
into the frontend, "just this once" — which quietly recreates the same
undeclared-coupling problem that module boundaries exist to prevent inside a
single app. Nothing in a monorepo prevents this by default;
it has to be held by convention or lint rule, and a solo project under time
pressure is precisely where that discipline slips.

**2. Most of the classic monorepo payoff doesn't apply at this scale.** The
strongest real-world arguments for monorepos — atomic cross-team PRs,
coordinated releases across many owners, one CI system serving many teams —
assume multiple teams. This is one person. What's left, once the multi-team
arguments are subtracted, is smaller: a single lockfile, and compiler-checked
type sharing without publishing. Real, but modest — worth naming honestly
rather than importing the multi-team justification wholesale.

**3. It is itself a tooling cost charged against a 7-hour day.** `pnpm`
workspace resolution, path aliases or TypeScript project references across
packages, and (eventually) build caching are all things that can consume real
hours on debugging *the monorepo*, not the backend. The roadmap's own
principle — arrive at a tool because yesterday hurt — hasn't actually been
earned yet for the *tooling* layer, only for the *shape*: there's no felt pain
yet from duplicated types, because nothing has been built. That pain is
expected to arrive by Day 8, when both apps exist and DTOs need to agree. The
cost is being paid slightly ahead of the pain, as a bet that it arrives on
schedule.

**4. No isolated failure domain.** A single lockfile means a bad dependency
bump anywhere blocks `pnpm install` everywhere. At two apps and one
contributor this is a minor, findable cost — it stops being minor if this
repo ever gains contributors or a third app.

---

## Decision

Keep the monorepo shape. The alternative — two real, separate repositories —
would require versioning and publishing `packages/types` for every shared
change, which is strictly more process for a one-person project with a Day 30
deadline. But "keep the shape" is not free, and this ADR is the place that
says so explicitly, rather than letting the folders imply a justification
nobody wrote down.

**Conditions attached to this decision:**

1. `pnpm-workspace.yaml` gets a real `packages:` field today — the shape must
   stop being aspirational.
2. `packages/types` is treated as a temporary bootstrap for DTOs, with a named
   expiry (Day 8 review), not a permanent home for them.
3. The api ↔ web boundary is only ever crossed over HTTP. A monorepo import of
   `apps/api` code into `apps/web` (or the reverse) is treated as a bug, not a
   convenience, precisely because nothing else will stop it.

## Consequences

- Day 2 spends a small, bounded amount of time on workspace wiring instead of
  on the first feature — acceptable, logged here so it's a decision and not
  drift.
- Day 8's review must include the DTO-to-generated-client migration as a named
  task, not an implicit "clean up types" line item.
- If a third app or a second contributor ever joins, question 3's "modest at
  this scale" framing should be re-examined — this ADR's conclusion is
  scale-dependent, not permanent.
