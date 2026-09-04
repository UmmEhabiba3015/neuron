# Worker Task — Day 2 Persistence

> **How to run this:** open a **fresh** Claude Code session in the repo root and
> paste this entire file as the first message. Do not run it in the Master
> Thread session.
>
> **Branch:** you will be run on `day-02-persistence`, already checked out. Do
> **not** create, switch, merge, or delete branches, and do not commit or push.
> All git operations belong to the human.

---

## Context

Neuron is a 30-day public build of an AI journaling platform, run as a learning
project. Its governing principle: **never introduce complexity before it solves
a real problem.** Read [docs/constitution.md](../constitution.md) before
starting.

`apps/api` is a NestJS app with `GET /entries` and `POST /entries`. Entries
currently live in a hardcoded in-memory array in `EntriesService`, so every
restart discards anything created. That data loss was demonstrated live, and
the storage decision is recorded in
[ADR-003](../decisions/ADR-003-sqlite.md) — **read it before starting.**

The repo owner is learning backend development and has just learned how Nest's
dependency injection resolves constructor parameters at runtime. Code comments
should explain **why**, not restate **what** — match the existing style in
`apps/api/src/entries/*.ts`.

---

## Objective

Replace the in-memory array with SQLite persistence via Node's built-in
`node:sqlite`, using hand-written SQL. Entries must survive a process restart.

---

## Tasks

### 1. Database provider

`node:sqlite` ships with Node 24 — **add no dependencies.**

```ts
import { DatabaseSync } from 'node:sqlite';
```

Register the database as a **Nest provider** so `EntriesService` receives it
through constructor injection, rather than constructing or importing it
directly.

This is not ceremony, and the reason matters more than the pattern: a service
that builds its own database connection cannot be tested against a different
one. Injecting it is what lets tests pass an in-memory database (task 5).

Use an injection token (e.g. a `const DATABASE = Symbol('DATABASE')` or a
string token) with a factory provider. Put it wherever you judge best —
`apps/api/src/database/` is a reasonable home. Explain the token in a comment;
the repo owner has not seen custom providers or injection tokens before.

The database file path should come from `process.env.DATABASE_PATH`, defaulting
to something sensible inside `apps/api` (e.g. `./data/neuron.db`). Create the
containing directory if it doesn't exist. **Do not** add `@nestjs/config` —
that is Day 6.

### 2. Schema

Create the table if it doesn't exist, at startup:

```sql
CREATE TABLE IF NOT EXISTS entries (
  id         TEXT PRIMARY KEY,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL
)
```

`CREATE TABLE IF NOT EXISTS` at boot is deliberately primitive — real migration
tooling is a later decision. Add a brief comment saying so, so it reads as a
choice rather than an oversight.

Note the column naming: SQL convention is `snake_case`, the TypeScript
interface uses `camelCase` (`createdAt`). Map between them explicitly in the
service and comment on why the mismatch exists rather than renaming either side
to match the other.

### 3. Rewrite `EntriesService` to use SQL

Remove the hardcoded array entirely. **No seed data.** A fresh database starts
empty.

- `findAll(): JournalEntry[]` — `SELECT` all entries, newest first.
- `create(content: string): JournalEntry` — **note the signature.** It takes a
  plain string, *not* an HTTP body object. The service is the data layer; it
  must know nothing about HTTP request shapes, so it can also be called from a
  job, a CLI, or a test. Generate the `id` with `crypto.randomUUID()` and
  `createdAt` with `new Date().toISOString()`, `INSERT`, and **return the
  created entry.**

Use **prepared statements with bound parameters** (`db.prepare(...)` with `?`
placeholders) — never string concatenation or template literals for values.
Add a short comment explaining why: this is how SQL injection is prevented, and
it is worth stating plainly even though there is no untrusted input yet.

Keep the SQL inline in the service. **Do not** introduce a repository class, a
data-access layer, or an abstraction over the database — Day 3 exists to
discover why those are needed, and pre-solving it removes the lesson.

### 4. Controller returns the created entry

`POST /entries` currently returns an empty body. The server generates the `id`
and `createdAt`, and the client currently has no way to learn either.

Return the created entry from the `create` handler, and give the method an
explicit `JournalEntry` return type.

Leave the `@Body()` parameter typed inline as `{ content: string }` — DTOs and
validation are Day 4. The controller unwraps `body.content` and passes the
string to the service.

**Add no validation.** If a client posts `{}`, let it fail. That failure is
Day 4's raw material.

### 5. Tests

Tests must **not** touch the real database file.

Provide an in-memory database (`new DatabaseSync(':memory:')`) to the testing
module via the same injection token, so each test gets a clean, isolated
database. This is the payoff for task 1 — call that out in a comment.

Update the existing tests, which currently assume two seeded entries:

- `entries.service.spec.ts` — currently only asserts `toBeDefined()`. Now that
  there is real behavior, give it real tests: creating an entry returns it with
  a generated id and timestamp; a created entry is subsequently returned by
  `findAll()`; a fresh database is empty.
- `entries.controller.spec.ts` — update for the new signature. **Preserve its
  existing teaching comments and its shape/invariant assertion style** — do not
  reintroduce exact-count assertions coupled to seed data.
- `test/app.e2e-spec.ts` — currently asserts `toHaveLength(2)`, which is now
  wrong: a fresh database is empty. Replace it with a round trip — `POST` an
  entry, then `GET` and assert the response contains it. Preserve its teaching
  comments.

### 6. Gitignore the database

Add the database file/directory to `.gitignore` (e.g. `data/` and `*.db`). A
database file must never be committed.

Note: a pattern without a leading slash matches at any depth — do not add
redundant path-prefixed duplicates.

### 7. README

Add a short "Data" section: where the database file lives, that
`DATABASE_PATH` overrides it, and that deleting the file resets everything.

---

## Explicitly Out of Scope

- **Do not** add any npm dependency. `node:sqlite` is built in.
- **Do not** add an ORM, query builder, or repository/data-access abstraction
  (Day 3).
- **Do not** add DTOs, `ValidationPipe`, class-validator, or exception filters
  (Day 4).
- **Do not** add migration tooling (later decision).
- **Do not** add `@nestjs/config` (Day 6).
- **Do not** add Postgres, Docker, auth, or `apps/web`.
- **Do not** add `UPDATE` or `DELETE` endpoints — only `GET` and `POST` are
  needed.
- **Do not** add seed data.
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

Then prove the actual objective — that data survives a restart:

```bash
rm -f apps/api/data/neuron.db          # start clean
pnpm build && node apps/api/dist/main.js &
curl -s -X POST http://localhost:3000/entries \
  -H "Content-Type: application/json" -d '{"content":"survives a restart"}'
curl -s http://localhost:3000/entries   # should contain it
# kill the process, start it again
curl -s http://localhost:3000/entries   # MUST still contain it
```

Paste the before-and-after of that restart. **That output is the entire point
of the task** — if the entry is not there after the restart, nothing else
matters.

Also confirm the database file is not tracked:

```bash
git status --short
git check-ignore -v apps/api/data/neuron.db
```

---

## Report

Write `docs/learning/day-02/worker-report-persistence.md` containing:

- objective
- implementation summary
- files changed
- **decisions made** — especially: how you registered the database provider and
  why you chose that token style; how you handled the `snake_case`/`camelCase`
  mapping; and anything about `node:sqlite` that differs from what a
  `better-sqlite3` tutorial would show
- assumptions
- limitations — **including what SQLite genuinely cannot do**, since a later
  day will have to migrate away from it
- dependencies changed (expected: none)
- testing performed, including the restart proof
- future improvements
- lessons learned

If you disagree with any instruction here, **implement it as specified and
record the disagreement in the report.** Do not silently substitute your own
approach.
