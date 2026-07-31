# ADR-004: Give Data Access Its Own Layer, Keeping Hand-Written SQL

**Status:** Accepted
**Date:** 2026-07-30 (Day 3)

---

## Decision

Move all SQL out of `EntriesService` and into a dedicated `EntriesRepository`.
Keep writing the SQL by hand. Do not adopt a query builder or an ORM.

---

## Problem

On Day 2 `EntriesService` contained two queries. Two is not sprawl, and any
argument for a separate data-access layer at that size would have been
theoretical. So Day 3 began by making the duplication real: three further
queries were written by hand — `findById`, `findByContent`, `countEntries`.

The four queries, side by side:

```
findAll        SELECT id, content, created_at FROM entries ORDER BY created_at DESC
findById       SELECT id, content, created_at FROM entries WHERE id = ?
findByContent  SELECT id, content, created_at FROM entries WHERE content LIKE ?
countEntries   SELECT COUNT(*) as count FROM entries
```

Repeated in every method: the column list, the table name, a direct call to
`this.db.prepare(...)`, a cast, and a call to `toJournalEntry`.

**This produced a real bug, not a hypothetical one.** `findByContent` was
written by copying the `SELECT` from `findAll`. The `ORDER BY created_at DESC`
did not come with it. The result:

```
GET /entries              →  newest first
GET /entries?word=work    →  oldest first
```

Two endpoints returning the same resource in different orders. `pnpm lint`,
`pnpm typecheck`, `pnpm build` and `pnpm test` all passed. Nothing in the
repository knew those two queries were supposed to agree, because the rule
"entries are returned newest first" was not written down anywhere as a rule —
it existed only as five words inside one string, copied by hand.

There is a second problem with the same root. Every query needs a cast, and
each was written differently:

```ts
.get(id)  as EntryRow | undefined
.all(...) as unknown as EntryRow[]
.get()    as { count: number }
```

A cast is an assertion the compiler cannot verify. Change a `SELECT` and the
type keeps describing the old shape. TypeScript will not warn, because the cast
told it to stop checking.

---

## Alternatives

**(a) Leave the SQL in `EntriesService`.** Accept the repetition.

**(b) Extract an `EntriesRepository` holding hand-written SQL.** The service
keeps application logic; the repository is the only code that knows a database
exists.

**(c) Adopt a query builder** (Knex, Kysely, Drizzle). SQL expressed as typed
JavaScript rather than strings.

**(d) Adopt an ORM** (Prisma, TypeORM, MikroORM). Describe the data as models
and let the library generate SQL.

---

## Pros

- **(a)** No new files, no new concepts, no work.
- **(b)** Puts the column list, table name, ordering rule and every cast in one
  file, written once. Costs zero dependencies. The service becomes testable
  without a database, and the repository can be swapped when Postgres arrives
  without the service noticing.
- **(c)** Removes the casts entirely — types are derived from a declared schema,
  so a renamed column becomes a compile error. Generated SQL stays close to what
  was written, so it remains predictable.
- **(d)** Everything (c) offers, plus migration tooling, relationship handling
  between tables, and far less code for common operations.

## Cons

- **(a)** The duplication is already producing bugs. Each new query multiplies
  the number of places a shared rule can silently diverge.
- **(b)** Does not fix the casts. They are centralised in one file rather than
  eliminated, so the type system is still being told to trust an unverified
  claim — just in one place instead of four.
- **(c)** A dependency and a new API to learn. Most of these libraries do not
  yet support `node:sqlite`, so adopting one would likely mean changing the
  database driver at the same time — two changes at once, for one problem.
- **(d)** The largest dependency and the largest mental model. Its main
  strengths — relationships between tables, lazy loading, change tracking,
  migrations — have nothing to act on yet: one table, no relationships, four
  queries. It would also hide the SQL at the precise moment the goal is to
  learn it.

---

## Tradeoffs

**The casts survive this decision, and that is accepted knowingly.** Option (b)
solves the repetition but not the type safety hole. That is the honest cost of
staying with raw SQL, and it is written down here so that it is a known debt
rather than a forgotten one. Concentrating all four casts in a single file at
least makes them reviewable in one place.

**Two problems were separated deliberately.** "SQL is repeated everywhere" and
"casts are unverified" arrived together, and a library would solve both at once.
But only the first has caused a bug. Solving a problem that has not yet cost
anything, using a dependency that would also force a driver change, is the
pattern Rule Zero exists to prevent.

---

## Reasoning

Option (a) is eliminated by evidence. The ordering bug is not a prediction; it
shipped, and four separate checks missed it.

Options (c) and (d) both solve today's problem and more. They were rejected on
timing rather than on merit. Three facts drive that:

1. **There is nothing yet for an ORM's strengths to work on.** One table, no
   relationships between tables, four queries, additive-only schema changes.
   The features that justify an ORM's complexity are all unexercised.
2. **`node:sqlite` is very new and poorly supported by these libraries.**
   Adopting one today would mean changing the storage driver as a side effect
   of a refactor about code organisation. Those are separate decisions and
   should be made separately.
3. **The learning cost is inverted this early.** SQL is decades old, works the
   same in every language, and transfers to every future job. A specific ORM's
   API is worth considerably less and may not outlive this project. Handing that
   away on Day 3 of learning backend development trades the durable skill for
   the disposable one.

Option (b) is the smallest change that fixes the problem that actually occurred.
It also establishes the boundary that any later library would live behind — if a
query builder is adopted on Day 24, it changes one file, and nothing outside
that file needs to know.

---

## Final Decision

`EntriesRepository` becomes the only class permitted to know that a database
exists.

- **It knows:** the SQLite connection, the `entries` table, its column names,
  and how a database row becomes a `JournalEntry`. `EntryRow` and
  `toJournalEntry` move into it.
- **It must not know:** anything about HTTP. No request objects, no status
  codes, no query parameters. It must be callable from a test, a background job,
  or a script with no web server present.
- **What crosses the boundary:** `JournalEntry` objects out, plain values in.
  Raw rows never escape. The moment a caller receives an `EntryRow`, it has
  learned about the database and the boundary is decorative.

`EntriesService` keeps application logic and calls the repository. SQL is still
written by hand.

### Where `id` and `createdAt` are generated

Both stay in `EntriesService`, not in the repository and not in the schema.

Three positions were considered:

1. **Service generates them in TypeScript** — the identity and time rules live
   with the application logic. *(chosen)*
2. **Database generates them** via `DEFAULT CURRENT_TIMESTAMP` and a UUID
   function — the rules live with the schema.
3. **Repository generates them in TypeScript** — the rules live in a class named
   for storage, without using storage to enforce them.

Position 3 was rejected as incoherent: neither `crypto.randomUUID()` nor
`new Date()` touches the database, so putting them behind the database boundary
weakens the boundary without buying anything.

Position 2 was argued for seriously and is common practice. Sequential integer
primary keys (`AUTOINCREMENT`, `SERIAL`) genuinely *must* be database-generated,
because only the database knows the last value used. Database-generated
timestamps also guarantee that no application can write a wrong time, which
matters when many writers exist.

It was rejected for three reasons specific to this application:

- **UUIDs remove the constraint that motivates it.** A v4 UUID is 122 random
  bits generated without coordination, so the id exists *before* the `INSERT`.
  That allows logging, event publishing, or building related records before
  touching the database. `AUTOINCREMENT` forces insert-then-read-back.
- **`createdAt` is product data, not bookkeeping.** It is the date on the
  timeline, the field the calendar groups by, the value weekly summaries filter
  on. A user may eventually want to backdate an entry. A column the application
  can never choose cannot support that.
- **The format would change and the contract would break.** SQLite's
  `CURRENT_TIMESTAMP` produces `2026-07-30 16:55:06` — space-separated, second
  resolution, no timezone marker. The API returns
  `2026-07-30T16:55:06.886Z`, and the newest-first ordering depends on those
  milliseconds.

A secondary claim raised during the discussion — that database-generated ids
suit ORMs better — is the reverse of the truth and is recorded here so it is not
repeated. ORMs generally prefer application-generated ids; Prisma's
`@default(uuid())` is evaluated by Prisma, not by the database, precisely so
that object graphs can be built in memory before any write.

### Accepted cost of that choice

Moving generation into application code means **the database no longer enforces
it.** Correctness now depends on every future write path remembering to generate
an id, and to format the timestamp identically. This objection was raised by the
repo owner and is accepted rather than dismissed.

It is tolerable today for one reason only: **there is exactly one write path.**
`EntriesService.create()` is the sole way an entry comes into existence, so
"remembering" is one function rather than a discipline spread across a codebase.
`NOT NULL` on both columns also means a *missing* value is still rejected by
SQLite; what is unenforced is a *wrongly formatted* one.

The standard remedy is to give the value its own type — a value object, or a
branded type in TypeScript — so that a correctly formatted timestamp is the only
kind that can be constructed. That is deliberately **not** being done today: one
write path and one format do not justify it.

**Revisit when a second write path appears** — a bulk import, a background job,
a seeding script, an admin tool, or a second service. At that point the cost
stops being theoretical and the value-object approach should be reconsidered.

---

## Future Revisit Conditions

- **Day 13 (mood)** — a second table, and the first relationship between tables.
  This is where ORMs earn their reputation. Revisit (c) and (d) here with real
  evidence rather than anticipation.
- **First non-additive schema change** — `CREATE TABLE IF NOT EXISTS` at boot
  stops being sufficient the moment a column must change type or be dropped.
  Migration tooling ships with most query builders and ORMs, which changes the
  arithmetic.
- **Day 24 (Postgres + deployment)** — the driver changes anyway. If a library
  is ever going to be adopted, doing it alongside a driver change that is
  already happening is cheaper than doing it twice.
- **Sooner, if** the casts cause a bug the way the copied `ORDER BY` did. That
  would convert the accepted tradeoff above into a proven problem, and this
  decision should be reopened immediately.
- **When a second write path for entries appears** — revisit whether `id` and
  `createdAt` generation should be protected by a value object rather than by
  convention. See *Accepted cost of that choice* above.
