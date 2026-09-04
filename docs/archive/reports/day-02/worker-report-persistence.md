# Worker Report — Day 2: Persistence

## Objective

Replace the in-memory array in `EntriesService` with SQLite persistence via
Node's built-in `node:sqlite` and hand-written SQL, so that entries survive a
process restart. No new dependencies, no ORM, no repository layer, no
validation.

---

## Implementation Summary

- Added `DatabaseModule`, which owns a single `DatabaseSync` connection and
  publishes it under a `Symbol` injection token, `DATABASE`. The module creates
  the containing directory, opens the file, and runs
  `CREATE TABLE IF NOT EXISTS entries (...)` at boot.
- `EntriesService` now receives that connection via
  `constructor(@Inject(DATABASE) private readonly db: DatabaseSync)` and
  implements `findAll()` / `create(content: string)` in raw SQL using prepared
  statements with `?` placeholders. The hardcoded array and its seed data are
  gone.
- `EntriesController.create` now returns the created `JournalEntry` instead of
  an empty body, and unwraps `body.content` before calling the service.
- All three test files provide their own `new DatabaseSync(':memory:')` under
  the `DATABASE` token, so no test touches the real file. The e2e suite uses
  `.overrideProvider(DATABASE).useValue(db)` so importing `AppModule` never runs
  the real factory.
- `.gitignore` and the README were updated; `engines.node` was raised to `>=24`.

---

## Files Changed

| File | Change |
| --- | --- |
| `apps/api/src/database/database.module.ts` | **new** — `DATABASE` token, factory provider, schema-on-boot |
| `apps/api/src/entries/entries.service.ts` | rewritten to SQL; `create(content: string)` |
| `apps/api/src/entries/entries.controller.ts` | `POST` returns `JournalEntry`; `import type` for the interface |
| `apps/api/src/entries/entries.module.ts` | imports `DatabaseModule` |
| `apps/api/src/entries/entries.service.spec.ts` | real behavioral tests against an in-memory DB |
| `apps/api/src/entries/entries.controller.spec.ts` | updated for the new signature; teaching comments and invariant style preserved |
| `apps/api/test/app.e2e-spec.ts` | `toHaveLength(2)` → POST/GET round trip |
| `.gitignore` | `data/`, `*.db`, and SQLite sidecar files |
| `README.md` | new "Data" section; Node prerequisite raised to 24 |
| `package.json` | `engines.node`: `>=22` → `>=24` |

No files were deleted. No branches, commits, or pushes were made.

---

## Decisions Made

### Provider registration and token style

The database is registered as a **factory provider on a dedicated
`DatabaseModule`**, exported from that module and imported by `EntriesModule`.

The token is `export const DATABASE = Symbol('DATABASE')`. A `Symbol` was chosen
over a string token (`'DATABASE'`) because a symbol is unique by construction —
two different modules can both define a token *named* `DATABASE` and they can
never collide, whereas two string tokens with the same text are the same token,
and the resulting bug (one module silently receiving another's provider) is
invisible at the call site. The cost is that a symbol must be imported to be
used, which is a feature here: it makes the dependency traceable.

`DatabaseModule` is **not** marked `@Global()`. A global module would remove the
`imports: [DatabaseModule]` line from `EntriesModule`, but at the price of
making the dependency invisible. Explicitness over magic — and with exactly one
consumer, the convenience buys nothing.

### `snake_case` / `camelCase` mapping

The SQL columns are `id`, `content`, `created_at`; the `JournalEntry` interface
is `id`, `content`, `createdAt`. Neither side was bent to match the other,
because each is idiomatic in its own language, and a schema written in
`camelCase` will look wrong to anyone who later opens it in a SQL client (and
would need quoting in Postgres, which folds unquoted identifiers to lowercase).

The mapping is a private `EntryRow` interface plus a `toJournalEntry(row)`
function at the bottom of the service — roughly ten lines, all of it explicit.
This is deliberately *not* a mapper class or a generic key-converting utility;
one table with three columns does not earn either.

The important observation for Day 3: this mapping, the `EntryRow` type, and the
unchecked cast below all have to be repeated for every new query. That
repetition is the pressure a repository layer or an ORM is supposed to relieve —
so it is worth noticing now and acting on later, not now.

### What `node:sqlite` does differently from `better-sqlite3`

Most SQLite-on-Node tutorials use `better-sqlite3`. The differences that
actually mattered:

1. **Import and constructor.** `import { DatabaseSync } from 'node:sqlite'` —
   a *named* export, and the class is `DatabaseSync`, not a default-exported
   `Database`. `new Database('file.db')` from a tutorial simply won't work.
2. **No `.get()`-style typing.** `better-sqlite3` lets you write
   `stmt.all() as Entry[]` directly. `node:sqlite` types `.all()` as
   `Record<string, SQLOutputValue>[]`, which does not structurally overlap with
   a concrete row interface, so TypeScript rejects the single cast and requires
   `as unknown as EntryRow[]`. That double cast is not a workaround for a
   toolchain problem — it is the type system correctly pointing out that no one
   verified the shape. It is commented as such in the service.
3. **No native build step.** `better-sqlite3` compiles C++ at install time and
   is a frequent source of CI breakage across Node versions. `node:sqlite`
   ships with the runtime — zero install cost, zero rebuild-on-upgrade.
4. **Version floor.** `node:sqlite` requires `--experimental-sqlite` on Node 22
   and is only usable flag-free from Node 24. See "Assumptions" below.
5. **`.exec()` vs `.prepare()`.** `.exec()` runs raw SQL with no parameter
   binding and is used only for DDL; every statement carrying a value goes
   through `.prepare()`.

### Ordering, and a test that failed first

`findAll()` orders by `created_at DESC`. The first version of the ordering test
called `create()` twice and asserted the ids came back reversed. **It failed** —
both entries were written within the same millisecond, so they had identical
`created_at` values, SQLite had no tiebreaker, and it returned them in insertion
order.

Rather than paper over it, the test now inserts rows with explicitly distinct
timestamps, so it tests the ordering claim and not the clock. The service is
left as-is, with a comment recording the tie: the available fixes are a SQLite-
only `rowid` tiebreaker (which does not survive the move to Postgres) or a
dedicated sequence column (complexity for a case no human can produce — nobody
writes two journal entries in a millisecond). Worth knowing, not worth solving
today.

### Database file location

The default path is resolved from `__dirname`, not `process.cwd()`. With `cwd`,
`pnpm dev` (cwd = `apps/api`) and `node apps/api/dist/main.js` (cwd = repo root)
would create *two different databases* in two different places, which is a
confusing failure — you POST an entry, restart differently, and it's "gone"
even though persistence works fine. An explicitly-set `DATABASE_PATH` still
resolves from the cwd, because that is what someone typing a relative path
expects.

---

## Assumptions

- **Node 24 is required, and `engines.node` was raised from `>=22` to `>=24`.**
  This is a change the brief did not ask for, but the brief's own premise
  (`node:sqlite` "ships with Node 24") is incompatible with the declared floor:
  on Node 22 the module requires `--experimental-sqlite` and the app will not
  boot. Leaving `>=22` would have declared support for a version that cannot
  run the code. Verified against the local runtime, v24.18.0.
- The e2e suite uses `overrideProvider`, which assumes `AppModule`'s database
  provider is reachable by the `DATABASE` token from the test — it is, since the
  token is exported from `database.module.ts`.
- `crypto.randomUUID()` is used as a global (no `node:crypto` import), matching
  what was already in the working tree and available on all supported versions.

---

## Limitations — including what SQLite genuinely cannot do

Behavior shipped today:

- **No validation.** `POST /entries` with `{}` returns **500**, confirmed by
  direct test. It does not store `undefined` — it fails at the driver with
  `ERR_INVALID_ARG_TYPE`, because `node:sqlite` refuses to bind `undefined` to a
  parameter. Deliberate; this is Day 4's raw material.

- **Type affinity is already producing a live bug, not a theoretical one.**
  Found while auditing, not while implementing:

  ```
  $ curl -X POST /entries -d '{"content":123}'
  {"id":"387f1bd3-...","content":123,"createdAt":"..."}      ← 201, number
  $ curl /entries
  [{"id":"387f1bd3-...","content":"123.0","createdAt":"..."}] ← string "123.0"
  ```

  The POST response says `123`, the GET says `"123.0"`. The write is accepted,
  and the value silently changes type and representation between writing and
  reading it back. Two separate causes stack: nothing validates that `content`
  is a string (Day 4), and SQLite's `TEXT` *affinity* accepts the number anyway
  and coerces it via its float representation. The `JournalEntry` interface
  promises `content: string`; at runtime, that promise is already false.

  Not fixed here — validation is explicitly Day 4's scope, and this is the
  sharpest possible argument for it. Worth re-running the two curls on Day 4 as
  the before/after.
- **No pagination.** `findAll()` returns every row. Fine at ten entries,
  not at ten thousand.
- **No index on `created_at`.** Every `findAll()` is a full scan plus a sort.
  Correct, and irrelevant at this size.
- **No transactions.** Nothing yet performs a multi-statement write.
- **Millisecond ordering ties**, as described above.
- **The `as unknown as EntryRow[]` cast is unchecked.** Change the `SELECT`
  column list and the type keeps claiming the old shape until a test catches it.

What **SQLite itself** cannot do, which is what forces the eventual migration:

1. **One writer at a time.** SQLite locks the whole database for a write. A
   second concurrent writer gets `SQLITE_BUSY`, not a queue. The moment
   background jobs (Day 18) write while an HTTP request writes, this produces
   real contention — and it cannot be configured away, only mitigated (WAL mode
   helps readers, not writers).
2. **It is a file, not a service.** There is no network protocol. Two API
   processes cannot share one SQLite database over a network — which means no
   horizontal scaling and no multi-instance deploy.
3. **Ephemeral container storage.** Most deploy targets give a container a
   filesystem that vanishes on restart. A file database on ephemeral storage is
   not persistence at all — it reintroduces exactly the bug this day fixed,
   just on a longer timescale. This is the Day 24 blocker.
4. **No `pgvector`.** Vector similarity search is a Postgres extension. SQLite
   has no equivalent in core. This is the Day 16 blocker.
5. **Weak typing.** SQLite columns have type *affinity*, not types — a `TEXT`
   column will accept and store a number. Declaring `created_at TEXT NOT NULL`
   does not guarantee the value is a valid timestamp, only that it isn't null.
   Demonstrated above: this is not a caveat for later, it is reachable through
   the public API today. Postgres would have rejected the same write outright,
   which is one concrete thing the eventual migration buys.
6. **Very limited `ALTER TABLE`.** No dropping a column with constraints, no
   changing a column's type. The standard workaround is to create a new table,
   copy the data, and swap — which is precisely why "just add real migration
   tooling later" is more expensive here than it sounds.

What transfers to Postgres almost unchanged: the schema, both SQL statements,
the prepared-statement discipline, and the injection seam. What doesn't: the
connection setup, pooling, and the `node:sqlite` API surface itself.

---

## Dependencies Changed

**None.** `pnpm install` reported "Already up to date". No package was added,
removed, or upgraded. The only `package.json` edit was `engines.node`.

---

## Testing Performed

### Full verification suite

```
$ pnpm install
Scope: all 2 workspace projects
Already up to date
Done in 761ms using pnpm v11.17.0

$ pnpm lint
$ eslint "{src,apps,libs,test}/**/*.ts" --fix

$ pnpm typecheck
$ tsc --noEmit -p tsconfig.json

$ pnpm build
$ nest build

$ pnpm test
Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        1.347 s

$ pnpm test:e2e
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.741 s
```

(`lint`, `typecheck`, and `build` produce no output on success.)

### The restart proof

```
$ rm -rf apps/api/data && pnpm build
$ node apps/api/dist/main.js &

--- POST ---
{"id":"3b0bf0d3-f34c-4309-b962-9897f7e479f0","content":"survives a restart","createdAt":"2026-07-29T15:52:38.281Z"}

--- GET (before restart) ---
[{"id":"3b0bf0d3-f34c-4309-b962-9897f7e479f0","content":"survives a restart","createdAt":"2026-07-29T15:52:38.281Z"}]

--- killing pid 114752 ---

=== SECOND BOOT (new process) ===
--- GET (after restart) ---
[{"id":"3b0bf0d3-f34c-4309-b962-9897f7e479f0","content":"survives a restart","createdAt":"2026-07-29T15:52:38.281Z"}]

=== db file ===
-rw-r--r--. 1 ummehabiba ummehabiba 12288 Jul 29 20:52 neuron.db
```

Same id, same timestamp, different process. The data survived.

### The database file is not tracked

```
$ git status --short
 M .gitignore
 M README.md
 M apps/api/src/entries/entries.controller.spec.ts
 M apps/api/src/entries/entries.controller.ts
 M apps/api/src/entries/entries.module.ts
 M apps/api/src/entries/entries.service.spec.ts
 M apps/api/src/entries/entries.service.ts
 M apps/api/test/app.e2e-spec.ts
 M package.json
?? apps/api/src/database/
?? docs/decisions/ADR-003-sqlite.md

$ git check-ignore -v apps/api/data/neuron.db
.gitignore:18:data/	apps/api/data/neuron.db
```

`apps/api/data/` does not appear in `git status` despite existing on disk.

### Additional checks

- **`DATABASE_PATH` override** — started with
  `DATABASE_PATH=./tmp-check/custom.db`, POSTed an entry, confirmed
  `tmp-check/custom.db` was created (directory included) and no entry landed in
  the default file. Cleaned up afterwards.
- **Tests leave nothing on disk** — ran the full suite from a clean tree and
  confirmed via `find . -name '*.db'` that no database file was created.

---

## Future Improvements

- **An index on `created_at`**, once the entry count makes the full scan
  measurable — and measuring it first is the point.
- **A data-access seam** (Day 3), once a second and third query exist and the
  `EntryRow` mapping and the unchecked cast are being copy-pasted.
- **Real migration tooling**, before the first schema change that isn't a pure
  addition. `CREATE TABLE IF NOT EXISTS` handles exactly one case: a table that
  has never changed.
- **A checked row parser** instead of `as unknown as`, if row shapes multiply.
- **Graceful shutdown** — `db.close()` on Nest's `onApplicationShutdown`. Not
  added because SQLite's durability does not depend on it (each statement
  commits), so it would be ceremony today.
- **Postgres**, at Day 16 or Day 24, whichever arrives first.

---

## Lessons Learned

1. **Dependency injection paid for itself within the same task.** Injecting the
   connection looked like ceremony while writing `DatabaseModule`. Two files
   later it was the only reason three test suites could run against a clean
   in-memory database without a single mock, a temp-file fixture, or a cleanup
   hook. The abstraction earned itself immediately, which is the standard the
   constitution actually sets — not "never abstract", but "abstract when it
   buys something now".

2. **A failing test taught more than a passing one.** The ordering test failed
   because two entries shared a millisecond. That is a real property of the
   design that would otherwise have gone unnoticed until it produced a confusing
   bug — and the response (document the tie, fix the test's determinism, don't
   fix the code) is a judgment the failure made available.

3. **A token is a name, and names collide.** Nest can use a class as an
   injection key because a class *is* a unique runtime value. The moment the
   thing being injected isn't a class, that uniqueness has to come from
   somewhere — and `Symbol()` provides it for free, where a string only pretends
   to.

4. **Prepared statements are two channels, not escaping.** The mental model that
   "bound parameters escape quotes" is wrong and leads to thinking a clever
   enough input could get through. The statement and the data travel separately;
   a value is never in a position to be parsed as SQL. The test that stores
   `'); DROP TABLE entries; --` and reads it back verbatim demonstrates this.

5. **Naming conventions are a boundary, and boundaries deserve a visible
   translation.** The `snake_case`/`camelCase` mismatch looked like an
   annoyance. Writing the mapping by hand made it obvious that this is the same
   translation an ORM performs automatically — which is a much more concrete
   answer to "what does an ORM actually do for me" than any tutorial provides.

6. **Writing a limitation down is not the same as knowing it bites.** "SQLite
   has type affinity, not types" was listed as an abstract caveat while the
   implementation was fresh. Only auditing the work afterwards — poking the
   running API with a deliberately wrong body — turned it into an observed
   round-trip bug with a reproduction. The claims in a report that were never
   executed are the ones worth going back and executing.

7. **`cwd`-relative defaults are a trap.** The same command run from two
   directories creating two different databases is the kind of bug that reads as
   "persistence is broken" when persistence is fine.

---

## Disagreements With the Brief

One, and it is minor: the brief specified `process.env.DATABASE_PATH` defaulting
to `./data/neuron.db`, which read as cwd-relative. Implemented as specified for
the *override*, but the **default** is anchored to the app directory instead —
for the reason above. The observable outcome matches the brief's verification
script (`apps/api/data/neuron.db`), which a literal cwd-relative default would
have failed when run from the repo root.

Everything else was implemented as written, including the parts I would
otherwise have been tempted to "improve": no repository layer, no validation, no
`db.close()` lifecycle hook, no index. Each of those is a later day's lesson,
and pre-solving them would remove it.
