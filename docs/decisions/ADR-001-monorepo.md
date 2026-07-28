# ADR-001: Use a pnpm Workspace Monorepo

## Decision

Use a single pnpm workspace monorepo (this repository) to hold both the API
and, later, the web client, instead of splitting them into separate
repositories.

## Problem

Neuron will eventually have two consumers of the same contract: an API
(`apps/api`) and a web client (`apps/web`). The shape of a journal entry —
its fields, types, and eventually its validation rules — has to stay
identical on both sides. If the API and the web client live in independent
repositories, nothing enforces that. A field can be renamed on the API side
and the web client won't know until it breaks at runtime, because the two
codebases are never compiled or reviewed together.

## Alternatives

**(a) Two separate repositories** — `neuron-api` and `neuron-web`, each with
its own history, CI, and release process.

**(b) Single repository with no workspace tooling** — one repo, but
`apps/api` and `apps/web` are just two folders with their own
`package.json` and `node_modules`, never linked by a package manager.

**(c) Monorepo with hand-maintained shared types** — a `packages/types`
workspace package containing manually written interfaces
(`JournalEntry`, `CreateJournalEntryDto`, etc.) that both apps import.

**(d) Monorepo with a generated client from an OpenAPI spec** — the API
emits an OpenAPI spec (e.g. via `@nestjs/swagger`), and a code generator
(e.g. `openapi-typescript`) turns that spec into types and a typed fetch
client for the web app to consume. This derives types from the real,
running API behavior rather than from a second, parallel hand-written
description of it — which makes it a genuine competitor to (c), not a
variant of it.

## Pros

- **(a)** Full independence: either app can be deployed, versioned, and
  released on its own schedule.
- **(b)** Zero tooling overhead; still gets a shared git history and PR
  review surface without any workspace-linking complexity.
- **(c)** Compiler-enforced consistency: a changed field is a TypeScript
  error in the consuming app, not a runtime surprise.
- **(d)** Same compiler-enforced consistency as (c), but the types can
  never silently drift from the API's real behavior, because they're
  derived from it rather than copied by hand.

## Cons

- **(a)** Nothing keeps the contract in sync. Shared types would have to be
  published and versioned as an external package, which is real process
  overhead for a one-person project.
- **(b)** All the coordination cost of one repository (shared PR surface,
  shared git history, shared CI file) with none of the benefit — no
  compiler ever checks that the two apps agree on anything.
- **(c)** Someone has to remember to update the hand-written types when the
  API changes. It's better than nothing, but it's still a manual sync
  point that can silently go stale.
- **(d)** Requires the API to emit and maintain an accurate OpenAPI spec,
  and a generation step has to run and be kept up to date — more moving
  parts than a plain shared-types package, and not worth it before the API
  has a stable-enough surface to generate from.

## Tradeoffs

A monorepo is not free. Specific costs this decision accepts:

- **Coupled CI.** One CI pipeline now has to know about both apps; a broken
  test in one can block a PR that only touches the other.
- **Coupled versioning.** There's one git history and one set of tags
  covering both apps, even once they have very different release cadences.
- **Temptation to reach across boundaries.** Because `apps/api` and
  `apps/web` sit in the same repository, it becomes easy to import backend
  code directly into the frontend "just this once" instead of going through
  HTTP. Nothing stops this by default — it has to be held by convention,
  and that discipline is easiest to drop under time pressure.

## Reasoning

The core problem is contract drift between two apps that don't exist as
separate deployable units yet, on a project built by one person under a
hard deadline. Splitting into two repositories (a) solves nothing here — it
adds process (publishing, versioning) to solve a problem that a shared
workspace solves for free. A monorepo with no linking (b) is actively
worse than either extreme: it pays the coordination cost of a monorepo
without the compiler-enforced benefit that's the entire reason to choose
one.

That leaves (c) and (d) as the real contenders, and they are not mutually
exclusive over time — they're a sequence. Hand-written shared types (c) are
cheap to set up and don't require the API to have any particular shape yet,
which matters on Day 2 when there is no API surface to generate from. A
generated client (d) is the better tool once the API has a stable enough
contract to generate from, because it removes the manual sync step
entirely. Committing to (d) today would be premature — there's nothing to
generate from yet.

## Final Decision

Adopt the pnpm workspace monorepo shape now. `packages/` is **deliberately
not created yet** — the decision to eventually share types is made, but the
package itself is deferred until a type actually needs sharing between
`apps/api` and `apps/web`. Creating it today would be scaffolding a shared
contract that doesn't exist, since `apps/web` doesn't exist yet either.
When that day comes, start with hand-written types (c) as the fastest path
to unblock, with an explicit expectation of migrating to a generated
client (d) once the API's request/response shapes have stabilized.

## Future Revisit Conditions

- If a generated OpenAPI client removes the need for `packages/types`
  entirely, retire the hand-written package rather than let both approaches
  coexist.
- If `apps/api` and `apps/web` ever need independent release cadences (for
  example, a mobile client is added, or the API needs to be deployed and
  versioned separately from the web app), revisit whether a single
  repository still makes sense.
