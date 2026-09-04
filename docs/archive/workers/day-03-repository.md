# Worker Task — Day 3 Repository Extraction

> **How to run this:** open a **fresh** Claude Code session in the repo root and
> paste this entire file as the first message. Do not run it in the Master
> Thread session.
>
> **Branch:** you will be run on `day-03-data-access`, already checked out. Do
> **not** create, switch, merge, or delete branches, and do not commit or push.
> All git operations belong to the human.

---

## Context

Neuron is a 30-day public build of an AI journaling platform, run as a learning
project. Its governing principle: **never introduce complexity before it solves
a real problem.** Read [docs/constitution.md](../constitution.md) before
starting.

`apps/api` is a NestJS app backed by SQLite through Node's built-in
`node:sqlite`, with hand-written SQL living directly inside `EntriesService`
(see [ADR-003](../decisions/ADR-003-sqlite.md)).

Today the repo owner hand-wrote three additional queries (`findById`,
`findByContent`, `countEntries`). That produced a real bug: `findByContent` was
written by copying the `SELECT` from `findAll`, and `ORDER BY created_at DESC`
did not come with it, so `/entries` and `/entries?word=…` returned the same
resource in different orders. `lint`, `typecheck`, `build` and `test` all
passed. She has since added the missing `ORDER BY` by hand.

The decision that followed is recorded in
[ADR-004](../decisions/ADR-004-repository-raw-sql.md) — **read it in full before
starting.** It was reached through discussion, and several of its rejected
alternatives are things a competent engineer would otherwise reach for.

The repo owner is learning backend development. She derived the repository
pattern herself from the duplication before it was named for her. Code comments
should explain **why**, not restate **what** — match the existing style in
`apps/api/src/entries/*.ts` and `apps/api/src/database/database.module.ts`.

---

## Objective

Move all SQL out of `EntriesService` into a new `EntriesRepository`, which
becomes the only class in the application that knows a database exists.

**Behaviour must not change.** Every endpoint returns exactly what it returns
today, including the two known-wrong error cases described below. This is a
refactor, and the tests are what prove it.

---

## Tasks

### 1. Create `apps/api/src/entries/entries.repository.ts`

An `@Injectable()` class, `EntriesRepository`, taking the database through
constructor injection using the existing `DATABASE` symbol token — same
mechanism and same reason as `EntriesService` uses today.

Move into this file, unchanged in behaviour:

- the `EntryRow` interface
- the `toJournalEntry` mapper function
- all four queries: `findAll`, `findById`, `findByContent`, `countEntries`
- the `INSERT` from `create`

Preserve the existing explanatory comments where they move with the code — in
particular the ones on `ORDER BY` and millisecond ties, on prepared statements
and bound parameters, and on the `snake_case`/`camelCase` mismatch. They were
written for the repo owner and should not be lost in the move.

Keep using **prepared statements with bound parameters**. Never string
concatenation or template literals for values.

### 2. The boundary rules

These come from ADR-004 and are the point of the task:

- **The repository may know:** the SQLite connection, the `entries` table, its
  column names, and how a row becomes a `JournalEntry`.
- **The repository must not know:** anything about HTTP. No request objects, no
  status codes, no query parameters, no Nest HTTP exceptions.
- **What crosses the boundary:** `JournalEntry` objects out, plain values in.
  `EntryRow` must not be exported and must never escape this file. If a caller
  can receive a raw row, the boundary is decorative.

Write a short comment at the top of the file stating these rules, so the next
person to add a method knows what the file is for.

### 3. Rewrite `EntriesService`

It keeps application logic and delegates storage to the repository.

- Constructor takes `EntriesRepository`. **No `@Inject` token** — it is a class,
  so the type is the token. Do not add one.
- `EntriesService` must no longer import `DatabaseSync`, `DATABASE`, or
  `node:sqlite`. If any of those imports remain, the extraction is incomplete.
- **`id` and `createdAt` generation stays in the service**, not in the
  repository and not in the schema. `crypto.randomUUID()` and
  `new Date().toISOString()` remain exactly where they are. This was decided
  deliberately — see ADR-004, *Where `id` and `createdAt` are generated*. Add a
  brief comment recording why, because it looks arbitrary otherwise.
- The repository's save method therefore takes a fully-formed entry and writes
  it. It does not generate anything.

### 4. Register the provider

`EntriesRepository` must be added to `EntriesModule`'s `providers`. Nest cannot
construct `EntriesService` otherwise, and the failure appears at boot rather
than at compile time.

Do not export it from the module. Nothing outside `EntriesModule` should reach
the repository.

### 5. Tests

`entries.service.spec.ts` currently builds a testing module with
`EntriesService` and a `:memory:` database under the `DATABASE` token. It will
now fail to compile the module, because `EntriesService` asks for a repository
that the testing module does not provide.

Fix it by adding `EntriesRepository` to the testing module's `providers`. Keep
the in-memory database and the `DATABASE` token exactly as they are — the
repository needs them now instead of the service.

**Preserve every existing test and every existing teaching comment**, including
the one at `entries.service.spec.ts:60-77` explaining why that test writes rows
by hand rather than calling `create()`. Do not rewrite tests to match new
internals; the whole point is that they still pass unchanged.

Then **add tests for the three new query methods**, which currently have none:

- `findById` returns a created entry, and throws when the id does not exist
- `findByContent` returns only matching entries, and returns them newest first
- `countEntries` returns the number of entries

The ordering assertion on `findByContent` matters more than the others — it is
the regression test for the bug that motivated this whole task. Write rows with
fixed timestamps rather than calling `create()` twice, for the reason the
existing comment already explains.

### 6. Verify behaviour is unchanged

`test/app.e2e-spec.ts` must pass without modification. If you find yourself
needing to change it, stop — that means behaviour changed, and it should not
have.

---

## Explicitly Out of Scope

- **Do not** add any npm dependency.
- **Do not** add an ORM, a query builder, or migration tooling. ADR-004 rejected
  all three with reasons; do not relitigate them in code.
- **Do not** fix the two known-wrong error cases. Both are Day 4 material and
  must be left exactly as they are:
  - `findById` throws a plain `Error` for a missing id, producing a 500 where a
    404 belongs.
  - `findByContent` throws when nothing matches, producing a 500 where an empty
    array and a 200 belong.
  Moving these `throw`s into the repository is required by the extraction.
  **Changing them is not.** Leave the behaviour identical.
- **Do not** add DTOs, `ValidationPipe`, class-validator, or exception filters
  (Day 4).
- **Do not** add `@nestjs/config` (Day 6).
- **Do not** add pagination, indexes, or `UPDATE`/`DELETE` endpoints.
- **Do not** introduce a base class, a generic `Repository<T>`, or an interface
  that `EntriesRepository` implements. There is one repository. A generic
  abstraction over one thing is exactly the complexity this project refuses.
- **Do not** rename `JournalEntry` or change the HTTP contract.
- **Do not** commit, push, or touch branches.

---

## Verification

All must pass. Paste **real output**, not summaries:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm test:e2e
```

Then prove behaviour is unchanged, against a **fresh** database:

```bash
rm -f apps/api/data/neuron.db
pnpm build && node apps/api/dist/main.js &

curl -s -X POST http://localhost:3000/entries \
  -H "Content-Type: application/json" -d '{"content":"felt overwhelmed at work today"}'
curl -s -X POST http://localhost:3000/entries \
  -H "Content-Type: application/json" -d '{"content":"quiet evening at home"}'
curl -s -X POST http://localhost:3000/entries \
  -H "Content-Type: application/json" -d '{"content":"back at work again"}'

curl -s -w '\nstatus %{http_code}\n' http://localhost:3000/entries
curl -s -w '\nstatus %{http_code}\n' "http://localhost:3000/entries?word=work"
curl -s -w '\nstatus %{http_code}\n' "http://localhost:3000/entries?word=zzz"
curl -s -w '\nstatus %{http_code}\n' http://localhost:3000/entries/count
curl -s -w '\nstatus %{http_code}\n' http://localhost:3000/entries/does-not-exist
```

Expected, and each one matters:

- `/entries` → 200, three entries, **newest first**
- `/entries?word=work` → 200, the two entries containing "work", **newest
  first** (this is the regression check)
- `/entries?word=zzz` → **500** (wrong, and deliberately preserved — Day 4)
- `/entries/count` → 200, `3`
- `/entries/does-not-exist` → **500** (wrong, and deliberately preserved — Day 4)

Finally, prove the boundary actually holds:

```bash
grep -n "node:sqlite\|DatabaseSync\|DATABASE\|SELECT\|INSERT\|prepare(" \
  apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.controller.ts
```

This must return **nothing**. If it matches anything, SQL or database knowledge
is still leaking out of the repository.

---

## Report

Write `docs/learning/day-03/worker-report-repository.md` containing:

- objective
- implementation summary
- files changed
- **decisions made** — especially: what shape you gave the repository's save
  method and why; how you handled the two `throw`s that had to move but not
  change; and anything about the module wiring that was not obvious
- assumptions
- limitations — **including the fact that the casts survive this refactor.**
  ADR-004 accepts that knowingly; say plainly what is still unverified and what
  would break silently
- dependencies changed (expected: none)
- testing performed, including the curl output above
- future improvements
- lessons learned

If you disagree with any instruction here, **implement it as specified and
record the disagreement in the report.** Do not silently substitute your own
approach.
