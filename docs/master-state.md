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

**Last updated:** 2026-07-30 (end of Day 3)
**Current day:** Day 3 of 29 complete (public numbering — see roadmap)
**Current branch:** `day-03-data-access`, clean and pushed. Day 3 committed as
`ee20124`. **PR #3 is open and not yet merged** —
https://github.com/UmmEhabiba3015/neuron/pull/3

---

## Next Session Starts Here

**First, close out Day 3.** The work is done, audited, committed and pushed.
The only step left is squash-merging PR #3 into `main`, then branching
`day-04-validation` from the updated `main`. If the PR was already merged before
this session started, just confirm `main` is current and branch from it.

**Day 4 — the roadmap problem is:** *"A client sent `{}` and the server returned
a 500."* Afterwards she should be able to explain validation at the boundary,
DTOs, HTTP status semantics, and why errors are a design surface.

**Day 4 has unusually good raw material already sitting in the code**, produced
live on Day 3 rather than invented for the lesson. Do not discard it and do not
fix it early:

1. `POST /entries` with `{}` → uncaught 500 (inherited from Day 2).
2. `GET /entries/does-not-exist` → **500 where 404 belongs.** She wrote this
   herself, watched it, and could not initially explain why her error message
   vanished from the response.
3. `GET /entries?word=zzz` → **500 where `200 []` belongs.** A search matching
   nothing is not an error.

Cases 2 and 3 are deliberately preserved and pinned by tests that assert
today's *wrong* behaviour, so Day 4 has to change them consciously.

**Groundwork already laid on Day 3, to build on rather than repeat:**

- She has the 4xx-vs-5xx test: *"could the client fix this by sending a
  different request?"* If yes → 400s. If no → 500s. She applied it correctly
  once and got the reasoning wrong once (she grouped "record missing" with
  "database file deleted"). Worth re-testing that it stuck.
- She knows Nest only understands `HttpException` and its subclasses, and that a
  plain `Error` becomes a 500 with the message stripped — security reason and
  correctness reason both explained.
- **Open design question deliberately left for Day 4:** the repository is not
  allowed to know what a status code is (ADR-004), so it *cannot* throw
  `NotFoundException`. Where does the storage-outcome → HTTP-status mapping
  belong? This is the natural Day 4 opening and she has the boundary rule
  already in hand.

**Also outstanding:** experiments 2 to 5 in
`docs/learning/day-02/testing-literacy.md` were never run. Still scheduled for
Day 5, along with the prepared-statement demonstration she skipped on Day 3.

---

## Current State

**What runs today:**

```
GET  /entries              → 200, all entries, newest first
GET  /entries?word=<term>  → 200, entries whose content matches, newest first
                             (500 when nothing matches — known wrong, Day 4)
GET  /entries/count        → 200, a bare number
GET  /entries/:id          → 200, one entry
                             (500 when not found — known wrong, Day 4)
POST /entries              → 201, { "content": "..." }, returns the created entry
                             (500 on {} — known wrong, Day 4)
```

Entries persist across restarts. No auth, no frontend, no validation, no CI,
no deployment.

**Verified working on Fedora KDE as of 2026-07-30, end of Day 3:**
`pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm build` ✅ · `pnpm test` ✅ (18 tests,
up from 11) · `pnpm test:e2e` ✅ (1 test, **file unmodified** — the real proof
the refactor changed no behaviour)

All re-verified independently by the Master Thread against a fresh database on
port 3999, not taken from the worker's report. All five endpoints returned
exactly the expected status and ordering, including the two preserved 500s.

**Boundary check** (re-runnable, must return nothing):

```bash
grep -n "node:sqlite\|DatabaseSync\|DATABASE\|SELECT\|INSERT\|prepare(" \
  apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.controller.ts
```

`EntryRow` was also confirmed to appear nowhere outside `entries.repository.ts`.

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
│               ├── entries.module.ts      wires controller + service + repository
│               ├── entries.controller.ts  HTTP only — routes, params, query
│               ├── entries.service.ts     application logic; generates id +
│               │                          createdAt, delegates storage
│               ├── entries.repository.ts  the ONLY class that knows a database
│               │                          exists. Owns EntryRow + toJournalEntry
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
| [ADR-004](decisions/ADR-004-repository-raw-sql.md) | Data access gets its own layer (`EntriesRepository`); SQL stays hand-written. Query builder and ORM rejected on timing, not merit. `id`/`createdAt` generated in the service | Accepted, **revisit Day 13 / Day 24** |

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
- **Day 3** — three further queries (`findById`, `findByContent`, `countEntries`)
  hand-written by her to make the duplication real. That produced a genuine bug
  (a copied `SELECT` that lost its `ORDER BY`, missed by all four checks) and a
  routing bug (`/entries/count` unreachable under `@Get(':id')`). She derived
  the repository pattern herself from the duplication, chose raw SQL over a
  query builder and an ORM with reasons, and argued the `id`/`createdAt`
  placement hard enough to change the ADR. ADR-004 written. Extraction done by a
  worker and audited. **Not yet committed or merged.**

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
| **Casts survive the repository extraction.** Rename `created_at`, miss one `SELECT`, and the API serves `"createdAt": null` with lint, typecheck and build all green. Same class of failure as the Day 3 `ORDER BY` bug — a rule the type system cannot see. Accepted knowingly in ADR-004 | Reopen if it causes a bug, or Day 13 / Day 24 |
| `id`/`createdAt` format is enforced by convention, not by the database or the type system. Tolerable only while `create()` is the single write path | When a second write path appears (ADR-004) |
| `entry.interface.ts` names the language construct, not the concept | Unscheduled — cosmetic |
| `POST /entries` with `{}` fails as an uncaught 500 | Day 4 (validation) |
| `GET /entries/:id` returns **500 where 404 belongs** — pinned by a test asserting the wrong behaviour | Day 4 |
| `GET /entries?word=<no matches>` returns **500 where `200 []` belongs** — also pinned | Day 4 |
| Storage-outcome → HTTP-status mapping has no home. The repository is barred from knowing status codes (ADR-004), so the translation must happen above it | Day 4 |
| `LIKE '%term%'` search is lexical and cannot match meaning | Day 15 / Day 16 (this is the Phase 3 premise) |
| `GET /entries/count` returns a bare number, not JSON | Day 4 (response shape) |
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

**Repaid on Day 3:**

- **Raw SQL** — she hand-wrote three queries (`findById`, `findByContent`,
  `countEntries`) including `LIKE`, `COUNT(*)` and `ORDER BY`. SQL itself is now
  owned rather than inherited from a worker.
- **Route matching is declaration order, first match wins.** She predicted
  "static before dynamic" and her own unreachable `/entries/count` disproved it.
  The distinction that landed: static-before-dynamic is the *discipline forced
  by* the rule, not the rule.
- **The repository pattern** — derived by her from the duplication before it was
  named. She proposed "a function where I dictate what I need," chose the
  application-language form over the SQL-language form, and located the SQL in a
  new file (she called it `schema.ts`; the naming correction taught the
  schema/operations distinction).
- **UUID vs sequential ids, and where generation belongs.** She argued for
  database-generated, which is defensible and common. She changed position on
  evidence, then raised the objection that application-side generation is
  unenforced — now recorded in ADR-004 as an accepted cost with a revisit
  condition.
- **4xx vs 5xx** — given the test *"could the client fix this by sending a
  different request?"* She applied it correctly once and wrongly once, grouping
  "record missing" with "database file deleted." **Worth re-testing on Day 4.**

**Still owed:**

- supertest, and what it does that a unit test cannot → Day 5
- Unit vs e2e — the route-rename experiment → Day 5
- Why three of four commands miss a type error in a spec file → Day 5
- **Prepared statements — 🟡 explained, not verified.** The mechanism was taught
  in full (parse-then-bind; the database parses before it has seen any value, so
  data cannot become instruction). She said she understood and declined the
  in-memory injection experiment, which was her call. She has not demonstrated
  it back. → Day 5
- **`EntriesRepository` wiring** — the worker did the extraction, so she has not
  registered a repository provider herself or seen that failure mode. → surfaces
  naturally on Day 13 when a second entity needs one

`docs/learning/day-02/testing-literacy.md` experiments 2–5 remain unrun.
Scheduled: Day 5 (testing day) picks up all of the above plus authorship.

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
