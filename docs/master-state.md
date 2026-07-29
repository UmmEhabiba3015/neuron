# Master State

**Purpose:** This file exists so that losing the Master Thread costs minutes,
not hours. It happened once — an OS reinstall took the thread with it — and
the recovery cost most of a working session.

**To re-establish a Master Thread from scratch, provide, in this order:**

1. [docs/master-prompt.md](master-prompt.md) — the role definition
2. [docs/constitution.md](constitution.md) — how decisions get made
3. [docs/roadmap.md](roadmap.md) — what happens when
4. **This file** — where we actually are

**Update cadence:** end of every day, before the LinkedIn post. Treat a stale
`master-state.md` the same as a failing test.

---

**Last updated:** 2026-07-29 (Day 2, mid-day)
**Current day:** Day 2 of 29 (public numbering — see roadmap)
**Current branch:** `feature/project-setup` (unmerged to `main`)

---

## Current State

**What runs today:**

```
GET /entries → 200, hardcoded array of 2 JournalEntry objects
```

Nothing else. No database, no auth, no frontend, no validation, no CI, no
deployment.

**Verified working on Fedora KDE as of 2026-07-29, after the Day 2 cleanup:**
`pnpm install` ✅ · `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm build` ✅ ·
`pnpm test` ✅ (3 tests) · `pnpm test:e2e` ✅ · boot + live curl ✅

All five re-verified independently by the Master Thread, not taken from the
worker's report.

**Environment:** Node v24.18.0 · pnpm 11.17.0 via Corepack · Docker 29.6.2 ·
no local Postgres client installed. **VS Code ships its own TypeScript (6.0.3)
which is not the workspace's (5.9.3)** — this gap caused a real "the editor is
red but the terminal is green" incident on Day 2. See
`docs/learning/day-01/report.md` addendum.

---

## Current Architecture

```
neuron/                    pnpm workspace root
├── apps/
│   └── api/               NestJS 11 — the only app with code
│       └── src/
│           ├── main.ts            bootstrap, listens on PORT ?? 3000
│           ├── app.module.ts      root module, imports EntriesModule
│           └── entries/
│               ├── entries.module.ts      wires controller + service
│               ├── entries.controller.ts  GET /entries
│               ├── entries.service.ts     owns a hardcoded array
│               └── entry.interface.ts     { id, content, createdAt } all strings
└── docs/
    ├── constitution.md    engineering principles
    ├── roadmap.md         30-day plan (Day 0–29)
    ├── master-state.md    this file
    └── decisions/         ADRs
```

`apps/web/` does **not** exist yet (Day 12). `packages/` does **not** exist yet
and that is deliberate — see ADR-001.

---

## Decisions Made

| ADR | Decision | Status |
|---|---|---|
| [ADR-001](decisions/ADR-001-monorepo.md) | pnpm workspace monorepo; `packages/` deferred until `apps/web` exists | Accepted |
| [ADR-002](decisions/ADR-002-nestjs.md) | NestJS over raw `http` / Express / Fastify | Accepted |

**Decided outside an ADR:**

- Public day numbering (Day 0–29) is canonical; roadmap renumbered to match.
- **Branching: one branch + one PR per day**, named `day-NN-topic` (e.g.
  `day-02-persistence`). Worker agents never touch git; branching, committing,
  and merging are human actions.
- **Lint enforcement lands at CI on Day 25, not before.** A root `lint` script
  makes it *reachable*; nothing yet makes it *mandatory*. Pre-commit hooks
  (husky/lint-staged) were considered and deliberately declined — the friction
  of remembering is what earns the Day 25 lesson.
- **Docker is permitted for local development infrastructure** from Day 2.
  Docker-for-local-dev and Docker-for-deployment are separate decisions; the
  latter is still Day 24 and is not pre-empted by the former.
- **`pnpm typecheck` is a first-class check**, added Day 2. `build` excludes
  spec files and ts-jest runs transpile-only, so without it nothing in the repo
  typechecked test code — only the editor did, using a *different compiler
  version*.
- **`@types` global inclusion is explicit** (`types: ["jest", "node"]`) rather
  than implicit. TypeScript 6 stopped auto-including `@types/jest` under this
  config.
- Lint warnings are promoted to errors — this project has no warnings, only
  errors. A warning nobody actions is noise that trains you to ignore output.
- TypeScript stays on 5.x. TS 7 is released but `ts-jest` (`<7`) and
  `typescript-eslint` (`<6.1.0`) peer ranges both exclude it, and both are
  already at their latest versions.
- `@types/node` tracks the Node **runtime** major (24.x), not npm's latest.

---

## Completed

- **Day 0** — repo init, public build announced.
- **Day 1** — pnpm workspace, NestJS scaffold, `GET /entries`, ADR-001, ADR-002.
  Shipped **unaudited**; LinkedIn post went out ahead of review.
- **Day 2 (in progress)** — environment restored after OS migration; Day 1
  audited retroactively; ADR-001 merged from two conflicting drafts; roadmap
  renumbered and ratified as v1.0; cleanup worker run and re-audited (all
  checks green, `typecheck` gap found and closed). **Next: testing literacy,
  then persistence.**

---

## Known Debt

**Resolved by the Day 2 cleanup worker** (audited and verified):

| Item | Resolution |
|---|---|
| `pnpm lint` failed | ✅ Exits 0. Assertions rewritten to shape/invariant checks over every entry |
| Floating promise | ✅ `no-floating-promises` → `error`; `main.ts` catches, logs, exits 1 |
| No root `lint` script | ✅ Root now has `lint`, `typecheck`, `test:e2e` |
| README inaccurate | ✅ Corrected |
| `report.md` at repo root | ✅ Moved to `docs/learning/day-01/report.md` |
| `eslint` 9 → 10 | ✅ Bumped; zero new violations, no config changes needed |
| **Nothing typechecked test files** | ✅ `pnpm typecheck` added — `build` excludes specs, ts-jest is transpile-only via `isolatedModules`, and lint doesn't report compiler errors, so *no* reachable command checked them |
| TS 6 broke jest globals | ✅ `types: ["jest","node"]` added, deprecated `baseUrl` removed from `tsconfig.json` |

**Open:**

| Item | Detail |
|---|---|
| `apps/api` `lint` script has `--fix` | `pnpm lint` silently **rewrites** files rather than reporting. Fine locally, wrong for a CI gate. Split into `lint` / `lint:fix` by Day 25 |
| e2e still count-coupled | `expect(res.body).toHaveLength(2)` — deliberately left brittle so the contrast with the rewritten unit test is visible. Decide on Day 5 |
| `res.body` is untyped (`any`) in e2e | Can't make shape assertions without a cast. Day 4 (DTOs) |
| Worker prompts + reports are gitignored | `docs/workers/` and `docs/learning/**/report.md` stay local only. They exist on disk but are not in version control |

**Deferred by design — resolves on a known day:**

| Item | Resolves |
|---|---|
| `findAll()` returns the service's private array by reference (mutable, proven) | Day 2 — dissolves once a DB owns the data |
| `entry.interface.ts` names the language construct, not the concept | Day 2/3 |
| One type serves as both domain model and HTTP wire shape | Day 4 (DTOs) |
| `process.env.PORT` read raw and unvalidated | Day 6 (config) |
| Tests assert `toHaveLength(2)` — brittle, coupled to seed data | Day 5 |
| `entries.service.spec.ts` asserts only `toBeDefined()` — tests Nest's DI, not our code | Day 5 |
| No validation pipe, exception filter, or CORS | Days 4 / 12 |

---

## Learning Debt

Concepts introduced by worker agents that have **not yet been learned**. See
the roadmap's *Learning Debt* section for why this is tracked.

- Jest (runners, matchers, `describe`/`it`) — owed since Day 1
- `@nestjs/testing` (`Test.createTestingModule`, DI in tests) — owed since Day 1
- supertest (HTTP assertions against a booted app) — owed since Day 1
- Unit vs e2e — what each catches and what each cannot — owed since Day 1

Scheduled: comprehension Day 2, authorship Day 5.

---

## Open Questions

- Rich text vs plain text for entries — deferred until the data model forces it.
- Which AI provider, and does that decision need to be reversible? (Phase 3)
- When does TypeScript 7 become viable? (blocked on ecosystem peer ranges)
- Should `feature/project-setup` merge to `main`, or should `main` become the
  working branch? Currently unresolved; the branch has never been merged.

---

## Workflow

- **Master Thread** (the architecture session) audits, teaches, writes ADRs and
  roadmap updates, and authors worker prompts. It does **not** write production
  code.
- **Worker agents** run in fresh Claude Code sessions, implement one isolated
  task from a prompt in `docs/workers/`, and produce a report.
- **Master Thread re-audits** every worker result before the day closes.
