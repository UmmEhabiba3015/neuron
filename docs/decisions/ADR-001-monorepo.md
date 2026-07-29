# ADR-001: Use a pnpm Workspace Monorepo

**Status:** Accepted
**Date:** 2026-07-28 (Day 1), merged and corrected 2026-07-29 (Day 2)
**Supersedes:** two earlier conflicting drafts (`ADR-001-monorepo.md` and
`adr-001-monorepo.md`), which coexisted because a case-insensitive filesystem
hid the collision until the project moved to Linux.

---

## Decision

Use a single pnpm workspace monorepo to hold the API and, later, the web
client, instead of splitting them into separate repositories.

---

## Problem

Neuron will eventually have two consumers of the same contract: an API
(`apps/api`) and a web client (`apps/web`). The shape of a journal entry — its
fields, types, and eventually its validation rules — has to stay identical on
both sides. If the two live in independent repositories, nothing enforces
that. A field can be renamed on the API side and the web client won't know
until it breaks at runtime, because the two codebases are never compiled or
reviewed together.

---

## Alternatives

**(a) Two separate repositories** — `neuron-api` and `neuron-web`, each with
its own history, CI, and release process.

**(b) One repository, no workspace tooling** — `apps/api` and `apps/web` as
two folders with their own `package.json` and `node_modules`, never linked by
a package manager.

**(c) Monorepo with hand-maintained shared types** — a `packages/types`
workspace package containing manually written interfaces that both apps
import.

**(d) Monorepo with a client generated from an OpenAPI spec** — the API emits
a spec (e.g. via `@nestjs/swagger`), and a generator (e.g.
`openapi-typescript`) turns it into types and a typed fetch client. Types are
derived from real API behavior rather than from a second hand-written
description of it.

---

## Pros

- **(a)** Full independence: either app can be deployed, versioned, and
  released on its own schedule. Genuine isolated failure domains.
- **(b)** Zero tooling overhead; shared git history and PR review surface
  without any workspace-linking complexity.
- **(c)** Compiler-enforced consistency: a changed field is a TypeScript
  error in the consuming app, not a runtime surprise. Cheap to set up, and
  requires no particular API shape to exist yet.
- **(d)** Same compiler-enforced consistency as (c), but types can never
  silently drift from the API's real behavior, because they are derived from
  it rather than copied by hand.

---

## Cons

- **(a)** Nothing keeps the contract in sync. Shared types would have to be
  published and versioned as an external package — real process overhead for
  a one-person project.
- **(b)** **An unlinked monorepo is a multi-repo that pretends not to be one.**
  It inherits the coordination *cost* of a monorepo with none of the
  coordination *benefit*. Concretely: dependency versions drift between apps
  with no lockfile forcing agreement; CI needs two install steps and cannot
  cache one dependency tree; and "shared" code requires a publish-and-reinstall
  cycle to reach either app, because without the `workspace:*` protocol a
  local package is not resolvable in place.
- **(c)** Someone has to remember to update hand-written types when the API
  changes. Better than nothing, but still a manual sync point that can go
  stale silently.
- **(d)** Requires the API to emit and maintain an accurate OpenAPI spec, and
  a generation step that has to run and stay current. Not worth it before the
  API has a stable enough surface to generate from.

---

## Tradeoffs

A monorepo is not free. Four specific costs this decision accepts:

**1. It removes the boundary that would force `apps/api` and `apps/web` to
talk only over HTTP.** Two apps communicating through a network request are
supposed to be independently deployable, independently failing units. Folder
proximity is a standing invitation to reach across that line at compile time —
importing backend code directly into the frontend "just this once" — which
quietly recreates the undeclared coupling that module boundaries exist to
prevent. Nothing prevents this by default; it must be held by convention or
lint rule, and a solo project under deadline is exactly where that slips.

**2. Most of the classic monorepo payoff does not apply at this scale.** The
strongest real-world arguments — atomic cross-team PRs, coordinated releases
across many owners, one CI system serving many teams — all assume multiple
teams. This is one person. Subtracting the multi-team arguments leaves a
single lockfile and compiler-checked type sharing without publishing. Real,
but modest, and worth naming honestly rather than importing the multi-team
justification wholesale.

**3. It is a tooling cost charged against a 7-hour day.** Workspace
resolution, path aliases or TypeScript project references, and eventually
build caching can each consume real hours debugging *the monorepo* rather than
the backend.

**4. No isolated failure domain.** A single lockfile means a bad dependency
bump anywhere blocks `pnpm install` everywhere. Minor and findable at two apps
and one contributor; not minor if this repo gains contributors or a third app.

---

## Reasoning

Splitting into two repositories (a) solves nothing here — it adds publishing
and versioning process to solve a problem a workspace solves for free. An
unlinked monorepo (b) is actively worse than either extreme: it pays the
coordination cost without the compiler-enforced benefit that is the entire
reason to choose one.

That leaves (c) and (d), and they are not competitors — they are a **sequence**.
Hand-written shared types are cheap and require no stable API surface, which
matters when there is barely an API. A generated client is the better tool
once the contract stabilizes, because it removes the manual sync step
entirely. Committing to (d) today would be premature: there is nothing to
generate from yet.

Note honestly what has *not* been earned: there is no felt pain from
duplicated types, because `apps/web` does not exist. The monorepo **shape** is
justified by the contract-drift argument above; the monorepo **tooling** is
being paid for slightly ahead of the pain, as a bet that the pain arrives on
schedule when the web client lands (Day 12).

### What actually belongs in `packages/types`, when it exists

Being explicit here prevents it becoming a junk drawer:

| Candidate content | Hand-write it? |
|---|---|
| Request/response DTO shapes | **No** — exactly what a generated client does better |
| Backend domain/ORM entities | **No** — `apps/api` implementation detail; the frontend should see the wire shape, never the storage shape |
| Cross-cutting vocabulary (`Paginated<T>`, branded ID types) | **Yes** — not the API contract, it is shared grammar with no natural generator |
| Client-side validation the browser needs pre-network | **Yes, conditionally** — only if it is runtime logic. A generated client gives shapes, not "reject this before spending a request" |
| Job payloads passed producer → worker (Day 18) | **Yes** — never crosses HTTP, so there is nothing to generate from |

---

## Final Decision

Adopt the pnpm workspace monorepo shape. **`packages/` is deliberately not
created yet**, and `pnpm-workspace.yaml` therefore declares only `apps/*`. The
decision to eventually share types is made; the package itself is deferred
until a type actually needs sharing — which cannot happen before `apps/web`
exists.

> **Correction to an earlier draft.** One superseded draft of this ADR listed
> "add `packages/*` to `pnpm-workspace.yaml` today" as a binding action item.
> That instruction was **not** followed, and correctly so: declaring a glob for
> a directory that does not exist is scaffolding a contract with no
> participants. This ADR supersedes that instruction. The workspace file
> declaring only `apps/*` is the intended state, not an oversight.

Conditions attached:

1. When `packages/types` is created, it is a **temporary bootstrap** for DTOs
   with a named expiry — not their permanent home.
2. At the Phase 1 review (Day 7), if hand-written DTOs exist, migrating them
   to a generated client is a **named task**, not an implicit "clean up types"
   line item. Hand-written DTOs surviving past that point signal a skipped
   migration, not a neutral steady state.
3. The api ↔ web boundary is crossed **only** over HTTP. A monorepo import of
   `apps/api` code into `apps/web` (or the reverse) is a bug, not a
   convenience — precisely because nothing else will stop it.

---

## Future Revisit Conditions

- If a generated OpenAPI client removes the need for `packages/types`
  entirely, retire the hand-written package rather than let both coexist.
- If `apps/api` and `apps/web` ever need independent release cadences (a
  mobile client is added; the API must be versioned separately), revisit
  whether one repository still makes sense.
- If a second contributor or a third app joins, re-examine the "modest at this
  scale" framing in Tradeoff 2 — **this ADR's conclusion is scale-dependent,
  not permanent.**
