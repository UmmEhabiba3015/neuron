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

**Last updated:** 2026-07-29 (end of Day 2)
**Current day:** Day 2 of 29 complete (public numbering — see roadmap)
**Current branch:** `main`, clean. Day 2 merged as `9c7365e` via PR #2 (squash).

---

## Next Session Starts Here

**Day 3 — the roadmap problem is:** *"SQL strings are scattered through my
controller."* Afterwards she should be able to explain raw SQL versus query
builder versus ORM, what a repository is, and why data access earns its own
layer.

**Do not start by explaining the repository pattern.** The Day 2 method worked
and should be repeated: she could not feel the data-loss problem until `POST`
existed, so she built `POST` first and watched an entry vanish. The same
applies here.

Right now `entries.service.ts` has exactly **two** queries. Two is not sprawl.
The duplicated `EntryRow` interface, the `toJournalEntry` mapper, and the
`as unknown as` cast look harmless at this size, and any argument for a
repository layer will sound theoretical.

So block one of Day 3 is to **make the duplication real** — add two or three
more queries (fetch one entry by id, filter or search by content, count
entries). She writes them by hand. By the third one she will be copying the
same three pieces every time, and the Day 3 question stops being abstract.

Only then compare raw SQL, a query builder, and an ORM, and write ADR-004.

**Before anything else:** `docs/master-state.md` and `docs/roadmap.md` have
uncommitted edits from the end of Day 2 (this file's own update, and the
learning-debt tables). Either commit them directly to `main` as a `docs:`
commit, or fold them into the Day 3 branch.

**Also outstanding:** experiments 2 to 5 in
`docs/learning/day-02/testing-literacy.md` were never run. They are scheduled
for Day 5, not Day 3.

---

## Current State

**What runs today:**

```
GET  /entries → 200, all entries from SQLite, newest first
POST /entries → 201, { "content": "..." }, returns the created entry
```

Entries persist across restarts. No auth, no frontend, no validation, no CI,
no deployment.

**Verified working on Fedora KDE as of 2026-07-29, end of Day 2:**
`pnpm install` ✅ · `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm build` ✅ ·
`pnpm test` ✅ (11 tests) · `pnpm test:e2e` ✅ (1 test) · restart-survival ✅

All re-verified independently by the Master Thread, not taken from the worker's
report. The restart proof was re-run from a deleted database: same entry id
returned across two different process IDs.

**Workflow decision:** one branch and one PR per day, squash-merged. Branch
naming `day-NN-topic`.

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
│       ├── data/              SQLite file lives here (gitignored)
│       └── src/
│           ├── main.ts            bootstrap, listens on PORT ?? 3000
│           ├── app.module.ts      root module, imports EntriesModule
│           ├── database/
│           │   └── database.module.ts  DATABASE symbol token, factory
│           │                           provider, CREATE TABLE at boot
│           └── entries/
│               ├── entries.module.ts      wires controller + service
│               ├── entries.controller.ts  GET + POST /entries
│               ├── entries.service.ts     raw SQL against injected DatabaseSync
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
| [ADR-003](decisions/ADR-003-sqlite.md) | SQLite via built-in `node:sqlite`, raw SQL, no ORM | Accepted, **expected to be replaced** (Day 16 / Day 24) |

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
- **Day 2** — environment restored after OS migration. Day 1 audited
  retroactively; ADR-001 merged from two conflicting drafts; roadmap renumbered
  and ratified as v1.0. Cleanup worker run and re-audited (`typecheck` gap
  found and closed). `POST /entries` written by hand to make the data-loss
  problem demonstrable, then SQLite persistence added via a worker and audited.
  ADR-003 written. Merged as `9c7365e` (PR #2, squash).

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
| `res.body` is untyped (`any`) in e2e | Can't make shape assertions without a cast. Day 4 (DTOs) |
| Worker prompts + reports are gitignored | `docs/workers/` and `docs/learning/**/report.md` stay local only. They exist on disk but are not in version control |

**Resolved during Day 2** (no longer debt):

- `findAll()` returning the private array by reference — dissolved exactly as
  predicted. The database now owns the data and returns fresh row objects.
- `toHaveLength(2)` in both unit and e2e tests — replaced by invariant checks
  and a POST/GET round trip respectively.
- `entries.service.spec.ts` asserting only `toBeDefined()` — now has real
  behavioural tests.

**Deferred by design — resolves on a known day:**

| Item | Resolves |
|---|---|
| SQL sits inline in the service; `EntryRow` + `toJournalEntry` + an unchecked cast must be repeated per query | Day 3 — this repetition **is** the Day 3 problem |
| `as unknown as EntryRow[]` is unchecked — change the SELECT and the type keeps lying | Day 3 |
| `entry.interface.ts` names the language construct, not the concept | Day 3 |
| `POST /entries` with `{}` fails as an uncaught 500 | Day 4 (validation) |
| One type serves as both domain model and HTTP wire shape | Day 4 (DTOs) |
| No validation pipe, exception filter, or CORS | Days 4 / 12 |
| `process.env.PORT` and `DATABASE_PATH` read raw and unvalidated | Day 6 (config) |
| `CREATE TABLE IF NOT EXISTS` at boot is not migration tooling | First non-additive schema change |
| No index on `created_at`, no pagination | Day 23 (measure first) |
| Millisecond ties in `created_at` ordering have no tiebreaker | Not worth solving; documented in the service |

---

## Learning Debt

Concepts introduced by worker agents that have **not yet been learned**. See
the roadmap's *Learning Debt* section for why this is tracked.

**Repaid on Day 2:**

- `Test.createTestingModule` / DI in tests — done by experiment. She deleted a
  provider, predicted a compile-time failure, and watched it fail at runtime
  instead. Followed through to the compiled output and `design:paramtypes`.
- **Nest resolves dependencies at runtime, not compile time** — she got this
  wrong twice (once for `providers`, once for `exports`), and the second time
  was proven live: `typecheck` and `build` both passed, the application failed
  on boot. Worth checking it has stuck.
- Symbol injection tokens and factory providers — explained in depth after the
  persistence worker introduced them.

**Still owed** (`docs/learning/day-02/testing-literacy.md`, experiments 2–5 were
not run — she chose to move on, which was her call):

- supertest, and what it does that a unit test cannot
- Unit vs e2e — the route-rename experiment that demonstrates the difference
- Why three of four commands miss a type error in a spec file
- Raw SQL and prepared statements — introduced by the worker, not yet taught

Scheduled: Day 5 (testing day) picks up the remaining experiments plus
authorship.

---

## Open Questions

- Rich text vs plain text for entries — deferred until the data model forces it.
- Which AI provider, and does that decision need to be reversible? (Phase 3)
- When does TypeScript 7 become viable? (blocked on ecosystem peer ranges)
- Day 0's LinkedIn post lists PostgreSQL in the stack; Day 2 chose SQLite.
  ADR-003 explains when Postgres arrives, so this is a documented evolution
  rather than a contradiction — but it will need saying out loud eventually.
- ~~Should `feature/project-setup` merge to `main`?~~ **Resolved** — merged as
  PR #1. `main` is the trunk; each day gets a `day-NN-topic` branch and a
  squash-merged PR.

---

## Workflow

- **Master Thread** (the architecture session) audits, teaches, writes ADRs and
  roadmap updates, and authors worker prompts. It does **not** write production
  code.
- **Worker agents** run in fresh Claude Code sessions, implement one isolated
  task from a prompt in `docs/workers/`, and produce a report.
- **Master Thread re-audits** every worker result before the day closes.

---

## How To Work With The Learner

This section exists because a new Master Thread needs it and cannot infer it.

### Who she is

A 2022 computer engineering graduate returning after a career break. She
completed boot.dev's TypeScript backend path, so TypeScript fundamentals are
solid. NestJS, databases, authentication and testing are all new. She has
roughly 7 focused hours a day.

Her husband is a senior software engineer. He set up the project structure and
this workflow, and occasionally speaks in the thread to configure something
before handing back to her. When someone gives terse, senior-level direction,
that is him.

### How to teach

1. Open a day with a **short brief** — what she will do and why, in a few
   lines. Do not preview every block.
2. Then take **one block at a time**. Do not dump the rest of the day.
3. Each block opens with **questions**, not answers. Ask her to predict,
   attempt, or research first, then wait for her reply.
4. Ask her to explain concepts back before moving on.
5. Treat a wrong prediction as the valuable outcome. It locates exactly where
   her mental model and the machine disagree.
6. Prefer running an experiment over asserting a fact. She learns from watching
   something break, not from being told it would.

If she says she wants to move on, move on. Record what was skipped in the
Learning Debt section rather than pushing.

### How to write

Use **simple, complete, descriptive English**. She asked for this directly.

- Full sentences. No fragments used for emphasis.
- One idea per sentence.
- Explain a technical term the first time it appears.
- Avoid compressed idiom and stacked em-dashes.
- Clear does not mean longer. It means she never re-reads a sentence to parse
  it.

### The Learning Debt rule

Worker agents produce correct code faster than she can learn the concepts
inside it. Every time that happens the repo gains code its owner cannot
explain. A concept is not done when it ships. It is done when she can explain
it without reading the code. Track it in the Learning Debt section above and in
`docs/roadmap.md`.
