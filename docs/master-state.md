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

**Last updated:** 2026-08-01 (end of Day 4, after the evening debt-clearing
session and the merge)
**Current day:** Day 4 of 29 complete (public numbering — see roadmap)
**Current branch:** `main`, clean and in sync with `origin/main`. **Day 4 is
merged** as `5dd755e` (PR #4, squash). The `day-04-validation` branch has been
deleted. Nothing is outstanding from Day 4.

**Verified green on `main` after the merge:** `pnpm test` 29 ✅ ·
`pnpm test:e2e` 10 ✅.

---

## Next Session Starts Here

**Day 4 is fully closed.** Code merged, docs current, LinkedIn post drafted and
delivered. There is no leftover work. Start by branching `day-05-testing` from
`main`.

**Day 5 — the roadmap problem is:** *"I changed something and don't know what I
broke."* Afterwards she should be able to explain unit vs integration vs e2e and
judge what a test suite fails to cover.

⚠️ **Note:** the roadmap's own Day 5 row says she should have "**written** tests,
not just read them." **That is superseded** — see the direction from her husband
below. Do not open Day 5 by asking her to write a suite.

### Day 5 starts clear — six debts were closed on Day 4 evening

Day 5 was carrying eight owed items and was over capacity. **Six closed in one
evening session**, by direct question and experiment. Two had been owed since
Day 1; one since Day 2 and offered twice before.

Closed: prepared statements · which command catches a spec type error · unit vs
e2e · supertest · `EntriesRepository` wiring · empty-collection · `unknown` vs a
named DTO at a trust boundary.

**Day 5 therefore has room.** What remains for it:

- Reading and judging an existing suite — naming what it *fails* to cover.
- `docs/learning/day-02/testing-literacy.md` experiments 2–5, unrun since Day 2.
- The `PATCH`/`DELETE` work the day was scheduled for, which forces the
  unknown-fields decision.

### ⚠️ Direction set by her husband on Day 4 — do not relitigate this

**She is not required to write test suites by hand.** His position, stated
directly: AI writes tests in practice now, and what matters is that she
understands what tests are, how they work, and the difference between unit,
integration and e2e.

Day 5 should therefore run **read → predict → break → observe**, not "write a
suite from scratch." The two experiments below are the model for this, and both
worked well. The remaining gap is judgement: looking at an existing suite and
naming what it does *not* cover — which is the skill the Day 3 `ORDER BY` bug
actually needed.

### How Day 4 actually went — the single most useful thing to know

**The format changed the outcome, and this is the main lesson to carry forward.**

The design work was genuinely hers: the layering rule, the `undefined`/`[]`
asymmetry, the four validation rules, and the decision to hand-write validation
with a named revisit condition. The code was not hers; a worker wrote it.

**The day had two halves that looked completely different.**

*Afternoon — open-ended Socratic questioning.* Uneven. The empty-collection idea
took three rounds, she answered "5xx" for an empty search, and the conclusion
came from the Master Thread rather than from her. She asked to move on three
times. At the time this looked like fatigue or disengagement.

*Evening — direct questions, each with an experiment attached.* Seven
predictions, **all seven correct**, including the two hard ones where she
worked out that 29 unit tests would still pass on a completely broken
application, and gave the right reason both times. On prepared statements she
did not answer the question asked — she volunteered the full mechanism
unprompted. Six debts closed in one session, two of them owed since Day 1.

**The difference was not effort or energy. It was format.** A concrete question
with a runnable experiment beats open-ended Socratic questioning for her, by a
wide margin. When she says "I understand, move on," the productive response is
not to re-explain — it is to ask a sharp question and hand her a command to run.

Use that format. It is now the default for this project.

**One thing that reversed on the same day:** the empty-collection idea was
recorded as owed in the afternoon and closed in the evening, when she said in
her own words that an empty array *satisfies* the question. Worth knowing that
"she did not get it" can mean "the format was wrong," not "she cannot get it."

### The two experiments from Day 4 evening — reuse this format

Both produced results that contradict intuition, and both are re-runnable in
under a minute. They are the best teaching tools found so far.

**1. Rename the route.** `@Controller('entries')` → `@Controller('journal')`.
The application is completely broken — every existing client gets a 404 — and
**all 29 unit tests still pass.** 9 of 10 e2e tests fail with
`expected 201 "Created", got 404 "Not Found"`.

> Unit tests verify the pieces work. E2E verifies the pieces are *connected*.

**2. Delete a provider.** Remove `EntriesRepository` from `providers` in
`entries.module.ts`. `typecheck` ✅, `build` ✅, **server crashes at boot** with
`Nest can't resolve dependencies of the EntriesService (?)`, and **29 unit tests
still pass** — because every spec file declares its own `providers` list and
never reads `entries.module.ts`. Only the e2e suite does `imports: [AppModule]`,
so only e2e can catch broken production wiring.

Restore both afterwards and re-verify. (A backup copy before editing saves
time; `git checkout <file>` also works.)

### Also outstanding

Experiments 2 to 5 in `docs/learning/day-02/testing-literacy.md` remain unrun
since Day 2.

---

## Current State

**What runs today:**

```
GET  /entries              → 200, all entries, newest first
GET  /entries?word=<term>  → 200, matching entries newest first; 200 [] when
                             nothing matches
GET  /entries/count        → 200, { "count": n }
GET  /entries/:id          → 200, one entry; 404 when not found
POST /entries              → 201, { "content": "..." }, returns the created entry
                             400 when content is absent, not a string, or has no
                             non-whitespace character; 400 on a null body
```

Entries persist across restarts. **Every endpoint now returns a correct status
code** — the three known-wrong 500s are gone. No auth, no frontend, no CI, no
deployment.

**Verified working on Fedora KDE as of 2026-08-01, end of Day 4:**
`pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm build` ✅ · `pnpm test` ✅ (29 tests,
up from 18) · `pnpm test:e2e` ✅ (10 tests, up from 1)

All re-verified independently by the Master Thread against a fresh database on
port 3998, not taken from the worker's report. Every status code above was
confirmed over real HTTP, plus three checks the worker did not claim:

- whitespace survived storage unmodified (`"  padded  "` in, `"  padded  "` out)
- three rejected writes stored nothing (count unchanged)
- `content` is a string on every endpoint, so POST and GET cannot disagree

`apps/api/package.json` and `pnpm-lock.yaml` confirmed unmodified — **no
dependency was added.**

**Boundary check** (re-runnable, must return nothing):

```bash
grep -n "node:sqlite\|DatabaseSync\|DATABASE\|SELECT\|INSERT\|prepare(" \
  apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.controller.ts
```

**HTTP-boundary check, added Day 4** (must return nothing — the service and
repository may not know status codes exist). The `grep -v` strips comment
lines: both files legitimately *mention* `NotFoundException` in comments
explaining why they must never throw one, and a check that reports those is a
check nobody will trust.

```bash
grep -nE "HttpException|NotFoundException|BadRequestException" \
  apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.repository.ts \
  | grep -v "^\S*:[0-9]*: *[/*]"
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
│               ├── entries.controller.ts  HTTP only — routes, params, query,
│               │                          validation, and the ONLY place a
│               │                          status code appears. Owns
│               │                          parseCreateEntryDto
│               ├── entries.service.ts     application logic; generates id +
│               │                          createdAt, delegates storage
│               ├── entries.repository.ts  the ONLY class that knows a database
│               │                          exists. Owns EntryRow + toJournalEntry
│               ├── create-entry.dto.ts    what a client may SEND ({ content })
│               └── entry.interface.ts     what an entry IS ({ id, content,
│                                          createdAt }) — all strings
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
| [ADR-005](decisions/ADR-005-validation-and-error-semantics.md) | Status codes live in the controller and nowhere else — the service may not throw HTTP exceptions either. `findById` → `undefined`, `findByContent` → `[]`. Validation hand-written; `class-validator` and `zod` rejected on timing, not merit. `/entries/count` returns `{ count }` | Accepted, **revisit Day 5 (PATCH) / when a check is duplicated** |

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
  worker and audited. Merged as `488acc9` (PR #3, squash).
- **Day 4** — the three known-wrong 500s fixed, and validation added. She
  derived the layering rule herself: status codes are HTTP vocabulary, so the
  service may not throw `NotFoundException` either — the same boundary argument
  as ADR-004, applied one layer up. She got the 4xx/5xx re-test right, learned
  400 vs 404, and **watched type erasure happen** by reading the compiled
  JavaScript, which is the fact that makes runtime validation necessary at all.
  She chose hand-written validation over `class-validator`/`zod` on timing, and
  decided all four validation rules including rejecting `{"content": 42}`.
  ADR-005 written. Implementation by a worker and audited. The worker
  **deviated once and was right to**: it used `@Body() body: unknown` rather
  than the `CreateEntryDto` the prompt specified, because an unvalidated body is
  not a `CreateEntryDto` and naming it one repeats the exact falsehood the day
  removed. It also caught a `null`-body case the design missed
  (`typeof null === 'object'`). **In an evening session after the code was
  committed, six learning debts were closed** by direct question and experiment
  — two of them owed since Day 1, one since Day 2 and previously skipped twice.
  This cleared Day 5, which had been over capacity.

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
| `res.body` is untyped (`any`) in e2e | Can't make shape assertions without a cast. Not resolved on Day 4 — the new e2e tests assert on `res.body` through the same untyped path. Day 5 or Day 7 |
| Worker prompts + reports are gitignored | `docs/workers/` and `docs/learning/**/report.md` stay local only. They exist on disk but are not in version control |
| **`POST /entries` ignores unknown fields** | `{"content":"x","id":"mine"}` returns 201 and silently drops `id`. Safe today because the service reads only `content`, but "ignore" vs "reject" is an unmade decision. Day 5 (`PATCH` forces it) |
| **Validation is enforced by memory, not by mechanism** | Nothing makes a future endpoint validate its body. A forgotten check passes lint, typecheck, build and tests. This is ADR-005's accepted cost and its named revisit condition — the same failure class as the Day 3 `ORDER BY` bug |

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
| ~~`POST /entries` with `{}` fails as an uncaught 500~~ | ✅ **Resolved Day 4** — 400 |
| ~~`GET /entries/:id` returns 500 where 404 belongs~~ | ✅ **Resolved Day 4** — 404, and the pinned test moved to the controller spec where the behaviour now lives |
| ~~`GET /entries?word=<no matches>` returns 500 where `200 []` belongs~~ | ✅ **Resolved Day 4** — fixed by *deleting* the `throw`; no new code |
| ~~Storage-outcome → HTTP-status mapping has no home~~ | ✅ **Resolved Day 4** — ADR-005: the controller, and only the controller |
| ~~`GET /entries/count` returns a bare number~~ | ✅ **Resolved Day 4** — `{ "count": n }` |
| ~~One type serves as both domain model and HTTP wire shape~~ | ✅ **Resolved Day 4** — `CreateEntryDto` (send) vs `JournalEntry` (is) |
| `LIKE '%term%'` search is lexical and cannot match meaning | Day 15 / Day 16 (this is the Phase 3 premise) |
| No exception filter or CORS. **A `ValidationPipe` was deliberately declined**, not deferred by omission — see ADR-005 | Day 12 (CORS); pipe revisits per ADR-005 |
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

**Repaid on Day 4:**

- **Type erasure.** The best moment of the day. She ran `pnpm build`, read the
  compiled JavaScript, and saw `{ content: string }` become a bare `body`. She
  now owns the reason validation must be *runtime code*: TypeScript is not
  present when the request arrives. Learned by observation, not assertion.
- **4xx vs 5xx, re-tested.** All three questions right, and question 3 answered
  with the *rule* ("who can fix it, the client or the engineer?") rather than
  the two instances. That is the exact distinction that failed on Day 3.
- **400 vs 404.** Did not know it; was told once; then applied it correctly and
  unprompted to `POST {}`.

**Repaid on Day 4 (evening session — six items, two owed since Day 1):**

- **Prepared statements.** Owed since Day 2, offered and skipped twice. She
  explained the parse-then-bind mechanism unprompted: the database parses the
  instruction text first, so by the time values arrive the sentence structure is
  already fixed and data cannot become instruction. Not the slogan — the
  mechanism.
- **Why three of four commands miss a type error in a spec file.** All four
  answered correctly with the reason for each, including that `ts-jest`
  transpiles rather than compiles, so types are stripped without being checked.
- **Unit vs e2e, and supertest.** Predicted the route-rename result correctly
  and gave the right reason: unit tests never mention the route, e2e names the
  path in the request. Then watched 29 unit tests pass on a completely broken
  application.
- **`EntriesRepository` wiring.** Four-part prediction, all four correct —
  including the hard one, that unit tests would still pass because spec files
  declare their own providers.
- **Empty collection is an answer, not a failure.** Ran the experiment, then
  said it in her own words: *"even in that case the correct answer is no row
  contains the word and empty array can satisfy it."* This is the exact idea she
  could not reach earlier the same day.
- **Why `unknown` beats a named DTO at a trust boundary.** Explained that the
  compiler *believes* the label, so typecheck and build both pass and the
  failure only appears at runtime.

**Still owed:**

- **Reading and judging an existing suite.** 🟡 Partial. She can now predict
  what unit vs e2e catches. What remains is looking at a suite and naming what
  it *fails* to cover — the skill the Day 3 `ORDER BY` bug needed. Per her
  husband's direction, this is the goal rather than writing suites by hand.
- **Where validation belongs.** 🟡 Partial — she reasoned it out and chose the
  *service*, then accepted the counter-argument. The distinction between "is
  this well-formed?" (boundary) and "is this allowed?" (service) was given to
  her, not derived. → re-test Day 10 when ownership checks arrive
- **Prepared statements — 🟡 explained, not verified.** The mechanism was taught
  in full (parse-then-bind; the database parses before it has seen any value, so
  data cannot become instruction). She said she understood and declined the
  in-memory injection experiment, which was her call. She has not demonstrated
  it back. → Day 5
- **`EntriesRepository` wiring** — the worker did the extraction, so she has not
  registered a repository provider herself or seen that failure mode. → surfaces
  naturally on Day 13 when a second entity needs one

`docs/learning/day-02/testing-literacy.md` experiments 2–5 remain unrun. Day 5
picks these up. Note that authorship of tests is **no longer** part of Day 5 —
see the direction recorded in *Next Session Starts Here*.

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

### ⚠️ The format finding from Day 4 — the most useful thing in this file

Day 4 ran both teaching formats on the same person on the same day, and the
results were not close.

**Open-ended Socratic questioning produced poor results.** Three rounds on a
single idea, a wrong answer, the conclusion supplied by the Master Thread
rather than reached by her, and three requests to move on.

**Direct question plus a runnable experiment produced excellent results.** Seven
predictions, all seven correct, including two counter-intuitive ones. Six
learning debts closed in a single evening — two of which had been owed since
Day 1 and one offered and skipped twice.

The concrete shape that works:

> Here is the situation in three sentences. Here is what someone changes.
> **Predict** what happens to typecheck, to build, to the server, to the tests.
> Now run this command and let us compare.

The shape that does not work: asking her to reason her way to a principle she
has not met yet, and re-explaining when she does not arrive at it.

**When she says "I understand, move on," do not re-explain and do not push.**
Ask one sharp question with a command attached instead. On Day 4 an idea she had
"moved on" from in the afternoon was fully owned by evening, using exactly that.
Her asking to move on is a signal that the *format* is wrong, not that she is
disengaged or that the concept is beyond her.

Rules 1 to 6 above still hold. This is how to execute rule 3.

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
