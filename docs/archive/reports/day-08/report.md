# Day 8a Worker Report — Move to TypeORM, Change Nothing Else

## Objective

Replace `node:sqlite` and the hand-written SQL in `EntriesRepository` with
TypeORM, driven by `better-sqlite3`, wired through `@nestjs/typeorm` and
configured from `ConfigService`. Schema creation stops happening at boot and
becomes a migration. `synchronize` is `false`.

The correctness criterion was that **nothing observable changes** and that all
96 unit and 32 end-to-end tests still pass. Both hold: **96 and 32, unchanged,
green.**

Implemented as designed in ADR-010. No design decision was re-opened. Five
things not named in the prompt were found and are reported below, of which four
are objections to the record I was handed:

1. Every method in the repository, service and controller had to become `async`.
   TypeORM has no synchronous API. ADR-010's "Accepted costs" does not mention
   this and it is the single largest cost of the day.
2. `@nestjs/typeorm@12.0.1` ships as **ESM only**, which the Jest suite could
   not load at all until the test scripts gained `--experimental-vm-modules`.
3. One of the prompt's boundary greps can never be silent, for a reason that has
   nothing to do with TypeORM.
4. `entry.interface.ts` now contains a class. The filename is now wrong and I
   did not rename it, because the prompt named the file.
5. A defect I introduced and fixed: the config-wiring spec broke on a duplicated
   `ModuleRef` class, caught by the suite rather than by me.

---

## Implementation summary

### What the day actually was

Not "swap a driver". The driver is one line. The change that propagated was
that **TypeORM is asynchronous and `node:sqlite` was not**, so `Promise` and
`await` travelled from `EntriesRepository` up through `EntriesService` and into
`EntriesController`, and every test that calls those classes directly had to
`await` where it used to read a value.

Nothing observable moved with it. Nest awaits whatever a handler returns before
serializing it, so every status code, message and response body is byte for byte
what it was — verified against the running application, pasted below. What
changed is the TypeScript signature, which is why 32 end-to-end tests needed no
change to a single claim while the two unit specs needed `await` on roughly
forty expressions.

### Where each thing went

| Was | Is |
| --- | --- |
| `export const DATABASE = Symbol('DATABASE')` | gone; `TypeOrmModule.forRootAsync` provides a `DataSource` |
| `new DatabaseSync(path)` in a factory provider | `buildDatabaseOptions()` handed to `TypeOrmModule.forRootAsync` |
| `CREATE TABLE IF NOT EXISTS` at boot | `1788262448946-InitialSchema` migration, run by hand |
| `interface JournalEntry` | `@Entity({ name: 'entries' })` class, same three fields |
| `interface EntryRow` + `toJournalEntry` mapper | `@Column({ name: 'created_at' })` on the entity |
| `db.prepare(...).all()` etc. | `Repository<JournalEntry>` inside `EntriesRepository` |
| `escapeLikePattern` + `ESCAPE '\'` in a prepared statement | `escapeLikePattern` + `ESCAPE '\'` inside `Raw()` — **unchanged logic** |
| `.overrideProvider(DATABASE).useValue(db)` | `.overrideProvider(getDataSourceToken()).useValue(dataSource)` |

The `created_at` ↔ `createdAt` translation did not disappear, it moved. It used
to be a hand-written mapper at the bottom of the repository; it is now `name:
'created_at'` on the entity's `@Column`. It is still stated once, explicitly,
which was the whole point of writing it by hand in the first place.

### The table is byte-for-byte the same

The migration was **generated**, not hand-copied, so the SQL below is TypeORM's
own reading of the entity rather than my transcription of the old statement.
That it matches is the evidence that no schema changed:

```
old (node:sqlite, boot-time)          new (migration, generated)
─────────────────────────────         ──────────────────────────────────────
CREATE TABLE entries (                CREATE TABLE "entries" (
  id         TEXT PRIMARY KEY,          "id" text PRIMARY KEY NOT NULL,
  content    TEXT NOT NULL,             "content" text NOT NULL,
  created_at TEXT NOT NULL              "created_at" text NOT NULL
)                                     )
```

`created_at` is TEXT holding an ISO-8601 string, not a date type. TypeORM was
not allowed to "improve" it, and the existing development database opens and
writes — proved below.

### Files changed

| File | Change |
| --- | --- |
| `apps/api/src/entries/entry.interface.ts` | Interface → `@Entity` class. 5 → 10 code lines. |
| `apps/api/src/entries/entries.repository.ts` | `DatabaseSync` → `Repository<JournalEntry>`; all methods async. 80 → 59 code lines. |
| `apps/api/src/entries/entries.service.ts` | Every method returns a Promise. 37 → 37 code lines. |
| `apps/api/src/entries/entries.controller.ts` | Every handler returns a Promise. 59 → 62 code lines. |
| `apps/api/src/entries/entries.module.ts` | Adds `TypeOrmModule.forFeature([JournalEntry])`. |
| `apps/api/src/database/database.module.ts` | `DATABASE` symbol → `TypeOrmModule.forRootAsync`; `resolveDatabasePath` and `DEFAULT_DATABASE_PATH` unchanged. 57 → 60 code lines. |
| `apps/api/src/config/env.validation.ts` | Adds `loadEnvironment()`, the one reader of `process.env` the migration CLI uses. |
| `apps/api/src/app.module.ts` | One stale comment about the DATABASE token. |
| `apps/api/src/database/data-source.ts` | **New.** 6 code lines. The `DataSource` the TypeORM CLI loads. |
| `apps/api/src/database/migrations/index.ts` | **New.** 4 code lines. The hand-maintained migration list. |
| `apps/api/src/database/migrations/1788262448946-InitialSchema.ts` | **New.** Generated. The schema as it stood on Day 7. |
| `apps/api/test/test-database.ts` | **New.** 26 code lines. `createTestDataSource`, `closeTestDataSource`, `seedEntries`. |
| `apps/api/test/app.e2e-spec.ts` | Setup only: the override token. No claim changed. |
| `apps/api/test/config-wiring.e2e-spec.ts` | Setup only: `DATABASE` teardown removed, `Test` required from the reset registry. No claim changed. |
| `apps/api/src/entries/entries.service.spec.ts` | Setup + `await`. No claim changed. |
| `apps/api/src/entries/entries.controller.spec.ts` | Setup + `await` + `toThrow` → `rejects.toThrow`. No claim changed. |
| `apps/api/package.json` | Three dependencies; `migration:{generate,run,revert}`; `--experimental-vm-modules` on the test scripts. |
| `package.json` (root) | Three migration passthroughs. |
| `pnpm-workspace.yaml` | `allowBuilds: better-sqlite3: true` — pnpm 11 wrote the placeholder itself on install and refuses to run until it is answered. |

---

## Decisions

**1. `Raw()`, not `Like()`, for the search.** `Like('%100\%%')` emits
`content LIKE ?` and nothing else. SQLite then has no escape character defined
for that pattern, so the backslashes `escapeLikePattern` adds are matched as
*literal backslashes* and searching for `100%` finds nothing. `Raw` is what lets
the `ESCAPE '\'` clause be written. Proved by Mutation B below.

**2. `insert()`, not `save()`, in the repository's `save`.** TypeORM's `save()`
reads the row first and turns an existing id into an UPDATE — an upsert wearing
the same name as the method on this class. `insert()` issues the INSERT and
nothing else, which is what the hand-written statement did, so a duplicate id
still fails loudly instead of quietly overwriting an entry.

**3. `retryAttempts: 0`.** `@nestjs/typeorm` retries a failed connection ten
times, three seconds apart. That is right for a database across a network and
wrong for a local file: a SQLite file that will not open at the first attempt
will not open at the tenth, and the default converts an immediate, readable boot
failure into thirty seconds of silence followed by the same message.
`new DatabaseSync(path)` failed at once. This keeps it that way. Flagged for
revisit on Day 24, when the database really is on a network.

**4. Migrations listed by hand, not by glob.** TypeORM's documented
`migrations: ['dist/**/*.js']` resolves differently under ts-node and under
`dist/`, and picks up the `.d.ts` files `declaration: true` emits. A list that
is wrong fails at import; a glob that is wrong finds nothing and reports "0
migrations" — the quiet failure this whole day exists to remove.

**5. The migration CLI reads the environment through `validate`.** The TypeORM
commands run in a shell with no injector, and something has to tell them which
database to open. `loadEnvironment()` lives in `src/config/env.validation.ts`
and is `validate(process.env)` — so a `DATABASE_PATH` that stops the server also
stops a migration, with the same sentence, and the "no `process.env` outside
`src/config`" grep stays silent honestly rather than by relocation.

**6. `--experimental-vm-modules` on the Jest scripts.** Forced, not chosen. See
the objection below.

**7. The e2e override is the DataSource token.** `TypeOrmModule.forFeature`
builds its repository provider by injecting `getDataSourceToken()`, so
overriding that one token reaches the repository too — one line, the same shape
the `DATABASE` symbol had.

---

## Objections to the record I was handed

### Objection 1 — ADR-010's "Accepted costs" omits the largest cost

The ADR lists three dependencies, a decorated entity, a rebuilt end-to-end
setup, invisible SQL, and two days of work. It does not say that **the entire
call chain becomes asynchronous**, which is the change that actually touched
every layer and every direct-call test in the repository. `better-sqlite3` is
synchronous underneath; TypeORM's API is not, and there is no synchronous
escape hatch.

This is not a small omission. It is the reason `entries.controller.spec.ts` and
`entries.service.spec.ts` have roughly forty edited lines between them, and it
is a permanent change to what every future caller of `EntriesService` looks
like. **Recommend adding it to ADR-010's accepted costs.**

### Objection 2 — `@nestjs/typeorm@12` is ESM only, and this was not costed

ADR-010 verified the package's provenance and its version. It did not check its
module format:

```
$ node -p "require('@nestjs/typeorm/package.json').type"
module
$ node -p "JSON.stringify(require('@nestjs/typeorm/package.json').exports['.'])"
{"types":"./dist/index.d.ts","import":"./dist/index.js","default":"./dist/index.js"}
```

There is no CommonJS build. This codebase is CommonJS. Node 24 can `require()`
an ESM module natively, so the built application is unaffected — but **Jest
cannot**, and the first full test run after the swap failed like this:

```
SyntaxError: Unexpected token 'export'
  at .../@nestjs/typeorm/dist/index.js:1
```

Three ways out were tried:

- **Transpile it to CommonJS** via `transformIgnorePatterns` and a dedicated
  ts-jest transform. Got further and then failed on
  `SyntaxError: Identifier 'require' has already been declared`, because
  `dist/common/typeorm-compat.js` contains
  `const require = createRequire(import.meta.url)`. That file cannot be
  mechanically converted to CommonJS; the package is ESM by construction.
- **Downgrade `@nestjs/typeorm`.** Rejected: ADR-010 names 12.0.1.
- **Run Jest under `--experimental-vm-modules`.** Works. Adopted.

So the test scripts became
`node --experimental-vm-modules node_modules/jest/bin/jest.js`, chosen over
`NODE_OPTIONS=... jest` because a `node --flag path` form is what every other
script in this package already uses and it does not depend on the shell.

The honest cost: **this project's test runner now depends on an experimental
Node flag**, and it prints an `ExperimentalWarning` on every run. That is a real
cost of adopting TypeORM through this package today, and it belongs in ADR-010
next to the three dependencies.

### Objection 3 — one boundary grep cannot be silent, and never could

```bash
grep -n "Repository\|typeorm" apps/api/src/entries/entries.service.ts \
                              apps/api/src/entries/entries.controller.ts
```

This returns eleven lines and would have returned eleven lines on Day 7 as well.
The reason is `EntriesRepository`: the service's constructor names it, because
ADR-004 requires the service to depend on the repository. The string
`Repository` is *the boundary*, not a violation of it.

The check that expresses the intended rule is:

```bash
grep -nE "from 'typeorm'|from '@nestjs/typeorm'|Repository<|DataSource" \
  apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.controller.ts
```

which is silent. Both are run below. **Recommend replacing the grep in future
prompts**, because a check that always fires teaches the reader to ignore it.

### Objection 4 — `entry.interface.ts` no longer contains an interface

The file holds `export class JournalEntry` with three decorators. The name is
now false, and this repository's stated standard is explicitness over
convenience.

I did not rename it, and the reason is deliberate: the prompt names
`entry.interface.ts` in the section headed "The entity", and a rename touches
six importing files in a task whose one rule is that nothing changes. **Recommend
renaming to `entry.entity.ts` as the first commit of Day 8b**, where `users`
arrives and a second entity file will make the inconsistency visible anyway.

### Objection 5 — a defect I introduced, and what caught it

`config-wiring.e2e-spec.ts` calls `jest.resetModules()` and then `require`s
`AppModule`, so that `validate` runs against the environment each test sets.
After the swap, its third test failed:

```
Nest can't resolve dependencies of the TypeOrmCoreModule (TypeOrmModuleOptions, ?).
Please make sure that the argument ModuleRef at index [1] is available.
```

The reset gives the freshly-required `AppModule` a fresh copy of
`@nestjs/core`, while the `Test` imported at the top of the file still holds the
old one. Two `ModuleRef` classes, and Nest cannot match the one
`TypeOrmCoreModule` asks for against the one in the container. Nothing had
noticed in six days because **no provider in this application had ever injected
`ModuleRef`**; TypeORM's does.

Fixed by requiring `Test` from the same reset. Worth recording because it is
the third time in this repository that a wiring fault was invisible to
typecheck, build and every unit test, and was caught only by the one spec that
builds the real `AppModule` — which is precisely the argument ADR-007 makes for
that spec existing.

---

## Assumptions

- `pnpm-workspace.yaml` needed an `allowBuilds` answer for `better-sqlite3`;
  pnpm 11 writes the placeholder itself and every later `pnpm install` fails
  until it is set. Set to `true`. In practice the bundled `prebuilds/` directory
  already carries a Node-API binary for this platform, so nothing compiles.
- The generated migration's timestamp (`1788262448946`) is TypeORM's own, taken
  from the clock at generation time. Left alone.
- `pnpm migration:generate` needs a name argument, so it is used as
  `pnpm migration:generate src/database/migrations/SomeName`. The other two take
  none.

## Limitations

**1. An existing database cannot run the initial migration.** Verified, on a
copy:

```
$ DATABASE_PATH=<copy of neuron.db> pnpm migration:run
Error during migration run:
SqliteError: table "entries" already exists
```

The transaction rolls back, so no data is lost — the five rows survived and the
copy was left with an empty `migrations` table. But a database created before
today has no record of the initial migration, so TypeORM tries to apply it. The
repair is one INSERT that marks it as already applied:

```sql
INSERT INTO migrations (timestamp, name)
VALUES (1788262448946, 'InitialSchema1788262448946');
```

**This has to be dealt with on Day 8b**, before the `user_id` migration can run
against any database that predates today. It is exactly the kind of two-machine
divergence ADR-010 was written about, and it should be a documented step rather
than something discovered during a deploy.

**2. Migrations do not run at boot.** `migrationsRun` is deliberately off, so a
fresh clone has a database file with no `entries` table until somebody runs
`pnpm migration:run`. That is the intended trade — schema changes are a thing a
person does on purpose — but it is a new step in the getting-started path and
the README does not mention it yet.

**3. The test runner depends on an experimental Node flag.** See Objection 2.

**4. The millisecond tie in `ORDER BY created_at DESC` is unchanged.** Two
entries written in the same millisecond may come back in either order. Carried
forward from Day 3 deliberately.

---

## Dependencies — the full transitive cost

Three added, as specified: `typeorm`, `@nestjs/typeorm`, `better-sqlite3`. No
`@types/better-sqlite3` was needed; TypeORM's driver types do not reference it.

```
lockfile entries      787 → 805   (+18 lines, of which 2 are peer-suffixed
                                   duplicates → 16 new package@version)
node_modules/.pnpm    651 → 667   (+16 directories)
node_modules on disk  214M → 273M (+59M)
```

The sixteen, by who asked for them:

| Package | Why it is here | Size |
| --- | --- | --- |
| `typeorm@1.1.0` | direct | 30M |
| `better-sqlite3@13.0.3` | direct | 27M (17M of which is `prebuilds/` — eight platform binaries) |
| `@nestjs/typeorm@12.0.1` | direct | 196K |
| `@sqltools/formatter@1.2.5` | typeorm — SQL logging | |
| `sql-highlight@6.1.0` | typeorm — SQL logging | |
| `ansis@4.3.1` | typeorm — coloured CLI output | |
| `dayjs@1.11.23` | typeorm — date handling | |
| `node-addon-api@8.9.2` | better-sqlite3 — Node-API bindings | |
| `yargs@18.1.0`, `yargs-parser@22.0.0`, `cliui@9.0.1`, `wrap-ansi@9.0.2`, `string-width@7.2.0`, `string-width@8.2.2`, `emoji-regex@10.6.0`, `get-east-asian-width@1.6.0` | typeorm's CLI argument parsing, and its own dependency tree | |

Read honestly: **nine of the sixteen exist to draw a command line.** They arrive
because `typeorm` ships its CLI in the same package as its runtime, so the
migration tooling this day was adopted *for* is also most of what it costs. Two
copies of `string-width` are in the tree for the same reason.

`better-sqlite3`'s 27M is dominated by prebuilt binaries for eight platforms
that this machine will never load. `node:sqlite` cost zero bytes, and ADR-003
chose it for exactly that. That trade is now spent.

---

## Testing

### The pipeline

```
$ pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e

$ eslint "{src,apps,libs,test}/**/*.ts" --fix
$ tsc --noEmit -p tsconfig.json
$ nest build

Test Suites: 7 passed, 7 total
Tests:       96 passed, 96 total

Test Suites: 3 passed, 3 total
Tests:       32 passed, 32 total
```

**96 and 32. No deviation.** No test was added, removed, skipped or weakened.

### Against the running application

Built output, a throwaway database created by `pnpm migration:run`, port 34517.

```
$ curl -i -X POST /entries -d '{"content":"ok"}'
HTTP/1.1 201 Created
{"id":"119d8d9e-c356-4bcc-8e26-f40427bbfd6d","content":"ok","createdAt":"2026-09-01T11:44:23.728Z"}

$ curl -X POST /entries -d '{}'
{"message":["content must be a string"],"error":"Bad Request","statusCode":400}
HTTP 400

$ curl -X POST /entries -d '{"content":"   "}'
{"message":["content must contain at least one character that is not whitespace"],"error":"Bad Request","statusCode":400}
HTTP 400

$ curl -X POST /entries -d '{"content":"x","id":"mine"}'
{"message":["property id should not exist"],"error":"Bad Request","statusCode":400}
HTTP 400

$ curl -X PATCH /entries/b71882c3-… -d '{}'
{"message":["the request body must contain at least one field to update"],"error":"Bad Request","statusCode":400}
HTTP 400

$ curl -X PATCH /entries/b71882c3-… -d '{"content":null}'
{"message":["content must be a string"],"error":"Bad Request","statusCode":400}
HTTP 400                                        <- 400, not 500

$ curl '/entries?word=a&word=b'
{"message":["word must be a string"],"error":"Bad Request","statusCode":400}
HTTP 400

$ curl '/entries?werd=x'
{"message":["property werd should not exist"],"error":"Bad Request","statusCode":400}
HTTP 400

$ curl '/entries?word='
[]
HTTP 200

$ curl '/entries'
HTTP 200
2026-09-01T11:44:39.288Z 'named the file snake_case'
2026-09-01T11:44:39.274Z 'an ordinary quiet evening'
2026-09-01T11:44:39.258Z '100% exhausted today'
2026-09-01T11:44:31.785Z 'patch target'
2026-09-01T11:44:23.728Z 'ok'
2026-09-01T11:44:23.706Z 'ok'
newest first: True

$ curl '/entries?word=100%25'
[{"id":"b78dcdc2-…","content":"100% exhausted today","createdAt":"2026-09-01T11:44:39.258Z"}]
HTTP 200                                        <- one entry, not six

$ curl '/entries?word=%25'
[{"id":"b78dcdc2-…","content":"100% exhausted today","createdAt":"2026-09-01T11:44:39.258Z"}]
HTTP 200                                        <- one entry, not six. ADR-006 holds.

$ curl '/entries?word=_'
[{"id":"7ca6acf4-…","content":"named the file snake_case","createdAt":"2026-09-01T11:44:39.288Z"}]
HTTP 200                                        <- the underscore is text too

$ curl -X DELETE /entries/33e9255c-…
{"id":"33e9255c-…","content":"delete me twice","createdAt":"2026-09-01T11:44:52.671Z"}
HTTP 200

$ curl -X DELETE /entries/33e9255c-…
{"message":"Entry with ID 33e9255c-… not found","error":"Not Found","statusCode":404}
HTTP 404
```

### An existing database still opens

`apps/api/data/neuron.db` — five entries, written by `node:sqlite`, schema
created by the old `CREATE TABLE IF NOT EXISTS` — copied to a temporary
location and opened by the TypeORM build on port 34519.

```
$ curl /entries/count
{"count":5}                                     <- yesterday's rows, read by TypeORM

$ curl /entries
[
  {"id":"af71b90a-…","content":"Hello marvel world","createdAt":"2026-09-01T10:23:25.115Z"},
  {"id":"b1c17764-…","content":" ",                 "createdAt":"2026-07-31T19:08:33.316Z"},
  {"id":"81e87932-…","content":"",                  "createdAt":"2026-07-31T19:08:28.172Z"},
  {"id":"b3763e2d-…","content":"23.0",              "createdAt":"2026-07-31T19:08:05.208Z"},
  {"id":"0163ea23-…","content":"yellow mello world","createdAt":"2026-07-31T18:10:24.648Z"}
]

$ curl -X POST /entries -d '{"content":"written by TypeORM into yesterday'\''s file"}'
{"id":"e938a56c-…","content":"written by TypeORM into yesterday's file","createdAt":"2026-09-01T11:45:15.570Z"}
HTTP 201

$ curl /entries/count
{"count":6}
```

Note the two rows with `""` and `" "` as content. They predate the validation
work and are still readable, which is the point: the driver reads what is there,
it does not re-judge it.

### The ADR-007 warning still fires

```
$ DATABASE_PATH=/tmp/…/nueron.db node dist/main.js
WARN [DatabaseModule] DATABASE_PATH is set to "/tmp/…/nueron.db" but no database
exists at /tmp/…/nueron.db. A new, empty one is being created. If you expected to
find your existing entries, check that path for a typo.
```

And it stays quiet when `DATABASE_PATH` was never set — the four tests in
`database.module.spec.ts` state that rule and were not touched.

### Migration infrastructure

```
$ pnpm migration:run
1 migrations are new migrations must be executed.
Migration InitialSchema1788262448946 has been executed successfully.

$ pnpm migration:revert
InitialSchema1788262448946 is the last executed migration.
Now reverting it...
Migration InitialSchema1788262448946 has been reverted successfully.
```

Both directions work. The generated schema is quoted above. `migration:generate`
produced it in the first place.

### Boundary checks

As written in the prompt:

| Check | Result |
| --- | --- |
| `process.env` outside `src/config` | silent (one comment line, no code) |
| `node:sqlite` / `DatabaseSync` in `src` or `test` | silent (three comment lines, no code) |
| `synchronize` not followed by `false` | silent (one comment line, no code) |
| TypeORM types in service or controller | **eleven lines — see Objection 3.** Every one is `EntriesRepository`. The corrected grep is silent. |
| HTTP exceptions in service or repository | silent, exit 1, nothing printed |

With comments stripped (`grep -vE ":[0-9]+: *(//|\*|/\*)"`), the first three
produce no output at all, and so does the corrected fourth.

`grep -rn "node:sqlite" apps/api/dist` — nothing. The compiled application does
not reference it either.

---

## The acceptance criterion — mutation testing

### Mutation A — remove the escaping

`{ pattern: \`%${escapeLikePattern(word)}%\` }` → `{ pattern: \`%${word}%\` }`.

```
Test Suites: 1 failed, 6 passed, 7 total
Tests:       3 failed, 93 passed, 96 total

● EntriesService › findByContent with characters the search engine treats
  specially › should return only entries containing a literal percent sign
● … › should return only entries containing a literal underscore
● … › should return only entries containing a literal backslash
```

```
    expect(received).toEqual(expected)

      Array [
    +   "has-none",
    +   "has-backslash",
    +   "has-underscore",
        "has-percent",
      ]
```

The whole journal, for a search for one character. And over HTTP, against the
mutated build:

```
$ curl '/entries?word=%25'    (MUTATED)
returned 6 entries:
 - named the file snake_case
 - an ordinary quiet evening
 - 100% exhausted today
 - patch target
 - ok
 - ok

$ curl '/entries'             (the whole journal, for comparison)
total 6 entries
```

**Identical.** `?word=%25` returns the journal, exactly as the criterion
predicts, and three tests go red saying so.

The end-to-end suite stays green under Mutation A, and that is worth knowing
rather than hiding: its one search test uses `?word=100%25`, and `%100%%` as a
live pattern still matches `100% exhausted today`. The claim that catches the
bare `%` lives in the unit suite. That is where it belongs — it is a claim about
`findByContent`, not about HTTP — but it means the end-to-end suite alone would
not have caught this.

### Mutation B — remove the `ESCAPE` clause, keep the escaping

This is the mistake TypeORM makes easy, because it is exactly what `Like()`
would have produced: the pattern is escaped, and nothing tells SQLite what the
escape character is.

```
Test Suites: 1 failed, 6 passed, 7 total
Tests:       4 failed, 92 passed, 96 total

● … › should return only entries containing a literal percent sign
● … › should return only entries containing a literal underscore
● … › should return only entries containing a literal backslash
● … › should find an entry by a word that contains a percent sign

Test Suites: 1 failed, 2 passed, 3 total
Tests:       1 failed, 31 passed, 32 total

● EntriesController (e2e) › status codes › GET /entries?word=100%25 finds the
  entry containing 100%
```

Five tests, across both suites, including the end-to-end one. The two mutations
fail differently and both are caught, which is what the existing tests were
written for on Day 5 and what makes them worth having survived a rewrite of the
mechanism underneath them.

Both mutations were reverted; the file was restored from a byte-identical copy
and the full pipeline re-run green.

### Cleanup

No server left running (`pgrep -af dist/main.js` — nothing). Every throwaway
database deleted. `apps/api/data/neuron.db` untouched: still five rows, still
one table, same modification time as before the day started. No git command was
run beyond `git status --short`.

---

## The four questions

### 1. How did you escape `%` and `_`, and how do you know it works?

`escapeLikePattern` survives **unchanged** — backslash first, then `%`, then
`_`, in that order, for the reason its comment has explained since Day 5. What
changed is only how the finished pattern reaches SQL:

```ts
content: Raw(
  (alias) => `${alias} LIKE :pattern ESCAPE '${LIKE_ESCAPE_CHARACTER}'`,
  { pattern: `%${escapeLikePattern(word)}%` },
),
```

`Like()` was rejected because it emits `content LIKE ?` with no `ESCAPE` clause,
and SQLite has no default escape character for `LIKE`. TypeORM does not escape
patterns for you and cannot: it has no way to know whether a `%` in a value was
meant as a wildcard. **An ORM removes the SQL you write, not the SQL that runs.**

The tests that fail without it, named:

- `EntriesService › findByContent with characters the search engine treats specially › should return only entries containing a literal percent sign`
- `… › should return only entries containing a literal underscore`
- `… › should return only entries containing a literal backslash`
- and, for the missing `ESCAPE` clause specifically, `… › should find an entry by a word that contains a percent sign` and the end-to-end `GET /entries?word=100%25 finds the entry containing 100%`

I know it works because I broke it twice and watched them go red, and because
`?word=%25` returns one entry on the real server and six on the mutated one.
Not because they pass.

### 2. What did the end-to-end setup become, and can the suite still touch the real database?

`overrideProvider(DATABASE).useValue(db)` became:

```ts
dataSource = await createTestDataSource();          // test/test-database.ts

Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(getDataSourceToken())
  .useValue(dataSource)
  .compile();
```

`getDataSourceToken()` is the token `TypeOrmModule.forRootAsync` registers for
the connection — for the default connection it is the `DataSource` class itself.
It is one line, in the same place, doing the same job, and it reaches the
repository as well because `TypeOrmModule.forFeature` builds its provider by
injecting that same token.

`createTestDataSource()` is better than what it replaced in one way worth
naming. The old setup pasted a copy of `CREATE TABLE entries (…)` into every
spec — six copies of a schema, agreeing with production only by hand. The new
one calls `dataSource.runMigrations()`, so a test runs against the table a fresh
production database would get, and a wrong migration turns tests red instead of
leaving them agreeing with a schema nothing else has. `synchronize` is `false`
there too, deliberately: a test database built by schema-on-boot would pass
while production, which has it off, had no table at all.

**Can the suite touch `apps/api/data/neuron.db`?** No, and the guarantee has
three parts:

1. `createTestDataSource` opens `:memory:`, which never touches the filesystem.
2. Nothing else in `src/` or `test/` constructs a `DataSource`, so there is no
   second path to a file. (`grep -rn "new DataSource" apps/api/src apps/api/test`
   returns `test/test-database.ts` and `src/database/data-source.ts`, and the
   second is the CLI's, never imported by the application or a test.)
3. `config-wiring.e2e-spec.ts` is the one spec that builds the real graph with
   no override, and it points `DATABASE_PATH` at a file in `mkdtempSync`.

Confirmed by observation rather than by argument: the development database still
holds five rows and carries the same modification time it had before any of this
ran.

### 3. Did anything observable change that you had to adjust a test for?

**No.** Every status code, every message, every response body is what it was —
checked line by line against the running application above, including the two
that a driver swap is most likely to break quietly (`?word=%25` and newest-first
ordering).

Two categories of test change happened, and both are honest:

**Setup, forced by the token change.** `.overrideProvider(DATABASE)` and
`{ provide: DATABASE, useValue: db }` name a symbol that no longer exists, and
the seed helpers used `db.prepare('INSERT INTO entries …')`. Three specs, setup
only, no claim touched. This is the category the prompt anticipated.

**`await`, forced by TypeORM having no synchronous API.** This is not a category
the prompt anticipated and I want it on the record rather than buried:

```
- expect(service.findAll()).toEqual([]);
+ expect(await service.findAll()).toEqual([]);

- expect(() => controller.findById('no-such-id')).toThrow(NotFoundException);
+ await expect(controller.findById('no-such-id')).rejects.toThrow(NotFoundException);
```

Roughly forty expressions across the two unit specs. I argue these are not
defects, on three grounds. The claim in each is word for word the same sentence
about the same value. Nothing observable moved — the end-to-end suite, which
only ever speaks HTTP, needed no change to a single assertion, which is itself
the evidence. And the change was unavoidable: there is no synchronous TypeORM.

But it is a genuine cost and the ADR should say so, which is Objection 1.

One decision was taken specifically to *prevent* an observable change:
`retryAttempts: 0`. Left at its default of ten, a database that cannot be opened
would have turned an immediate boot failure into thirty seconds of retries.

### 4. What did TypeORM cost, honestly?

**Lines.** Roughly a wash, which surprised me:

```
entries.repository.ts   80 → 59 code lines   (-21)
entries.service.ts      37 → 37
entries.controller.ts   59 → 62              (+3)
entry.interface.ts       5 → 10              (+5)
database.module.ts      57 → 60              (+3)
                                             ──────
                                             -10
new: data-source.ts 6, migrations/index.ts 4,
     InitialSchema 18, test/test-database.ts 26   +54
                                             ──────
                                     net      +44 code lines, +4 files
```

The repository lost a quarter of its code and the codebase gained lines anyway,
because migration infrastructure is four files that did not exist. That is the
honest shape of the trade: **TypeORM did not make this application smaller. It
made the schema a thing that exists in version control.**

**Weight.** +59M on disk, +16 packages, nine of which draw a command line.
`node:sqlite` cost nothing, and ADR-003 chose it for that.

**A dependency on an experimental Node flag** in the test runner, because
`@nestjs/typeorm@12` is ESM only. Not costed anywhere before today.

**The synchronous API**, permanently.

**Did the repository boundary survive?** Yes, intact, and it is the part of the
day that went best. `Repository<JournalEntry>` appears in exactly one file. The
service and controller import nothing from `typeorm` or `@nestjs/typeorm`; the
controller keeps `import type` on `JournalEntry` so the entity cannot even be
constructed there. The methods the service calls have the same names, the same
arguments and the same vocabulary — `undefined` for absence, never `null`, never
an exception — as they did when they wrapped `db.prepare`.

`findById` is where that boundary is visibly doing work: TypeORM says "nothing
found" with `null`, this application has said it with `undefined` since Day 3,
and the `?? undefined` in the repository is the whole of the translation. One
operator, in the one file whose job is to speak both languages. That is what a
boundary being real rather than decorative looks like.

**What TypeORM gave back**, to be fair to it: the schema is now a file somebody
reviews; the `created_at` mapper and the `EntryRow` interface are gone without
the mapping becoming implicit; `application.close()` closes the database, which
deleted eight lines of hand-written teardown from `config-wiring.e2e-spec.ts`;
and the test database is now built by the same migration production uses instead
of by six copies of a `CREATE TABLE` statement.

---

## Future improvements

1. **Mark the initial migration as applied on existing databases** — required
   before Day 8b's `user_id` migration can run anywhere but a fresh clone. The
   INSERT is in Limitations above.
2. **Rename `entry.interface.ts` to `entry.entity.ts`** as the first commit of
   Day 8b.
3. **Add the async conversion and the ESM/`--experimental-vm-modules` cost to
   ADR-010's accepted costs.**
4. **Replace the `Repository\|typeorm` grep** in future prompts with the form
   that can actually be silent.
5. **Document `pnpm migration:run` in the README's getting-started path.** A
   fresh clone now has no `entries` table until somebody runs it.
6. **Revisit `retryAttempts` on Day 24**, when the database is on a network.
7. **An end-to-end test for `?word=%25`.** The unit suite covers the bare `%`
   and the end-to-end suite does not; Mutation A showed the end-to-end suite
   alone staying green while the search returned the whole journal.

## Lessons

**An ORM removes the SQL you write, not the SQL that runs.** The escaping was
the one piece of this day I expected TypeORM to take over, and it is the one
piece that was entirely my responsibility. `Like()` looks like the answer and is
the bug. The claim survived the rewrite because it was written as *"searching
for a character finds entries containing that character"* and mentions no SQL —
which is the argument ADR-006 made for fixing it, now demonstrated rather than
asserted.

**The cost of a library is rarely the thing you counted.** Three dependencies
was the number in the ADR. The number that mattered was one: no synchronous API.
That single fact rewrote three source files, two specs and roughly forty test
expressions, and it is not on anybody's dependency list.

**A checked test setup is a schema, and copies of it drift.** Six pasted copies
of `CREATE TABLE entries` agreed with production only because nobody had changed
it yet. Building the test database from the migration is the first time this
repository's tests and its production schema have had a single source.

**The wiring spec earned its place a third time.** Every unit test passed, the
build passed, typecheck passed, and the application would not have started,
because two copies of `ModuleRef` existed and nothing but the one spec that
builds the real `AppModule` could see it.

---

## Part B: users and ownership

### Objective

Give the data model somewhere to record who an entry belongs to, and change
nothing else. ADR-009 found that no column in `entries` could hold the answer to
"whose entry is this?", so even a server that knew perfectly well who was asking
would have had nowhere to look. This task adds that column, the table it points
at, and the migration that puts both onto a database which already has rows in
it — while every status code, message and response body stays exactly as it was.

It also closes the audit finding Part A left open: `synchronize: true` was
undetectable.

### Verification

```
$ pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e

lint       ✅
typecheck  ✅
build      ✅

Test Suites: 8 passed, 8 total
Tests:       108 passed, 108 total       (96 before + 12 new)

Test Suites: 4 passed, 4 total
Tests:       35 passed, 35 total         (32 before + 3 new)
```

**No existing test was changed.** The 96 unit and 32 end-to-end tests that
existed this morning pass with their assertions untouched — the only edit to an
existing spec file is one `it` block added to `test/app.e2e-spec.ts`, explained
under finding 2 below. That is the evidence that nothing observable moved: the
32 end-to-end tests are the ones that make real HTTP requests and read real
response bodies, and not one of them noticed a schema change.

#### Files

```
new   src/users/user.entity.ts                                    50
new   src/database/migrations/1788341821514-AddUsersAndEntryOwnership.ts  181
new   src/entries/entry-ownership.spec.ts                        256   9 tests
new   test/synchronize.e2e-spec.ts                               165   2 tests
mod   src/entries/entry.interface.ts                    42  ->  100
mod   src/database/database.module.spec.ts             121  ->  200   3 tests
mod   src/database/migrations/index.ts                  20  ->   29
mod   src/database/database.module.ts                  139  ->  146
mod   test/test-database.ts                             56  ->   57
mod   test/app.e2e-spec.ts                             562  ->  600   1 test
```

Both `entities: [JournalEntry]` arrays became `entities: [JournalEntry, User]` —
`database.module.ts` for the application and `test-database.ts` for the tests.
Missing either one turns `@ManyToOne(() => User)` into "Entity metadata for
JournalEntry#user was not found" at boot rather than at compile time.

### Part 1 — the audit finding is closed

The rule is ADR-010's most important one and it lived in a comment. Setting
`synchronize: true` during the Part A audit produced `lint ✅ typecheck ✅ build
✅ 96 unit ✅ 32 e2e ✅`. It now fails in two places, and the two say different
things on purpose.

**`src/database/database.module.spec.ts` — the piece.** Three tests against the
return value of `buildDatabaseOptions`, which is the function that decides the
options rather than a copy of them written out in the test: `synchronize` is
`false`, `migrationsRun` is not `true`, and `migrations` is the same array the
CLI uses so a migration and a boot cannot disagree about the schema.

**`test/synchronize.e2e-spec.ts` — the wiring.** This one is needed because the
unit test can only see as far as that one function. The factory in
`@Module` spreads its result and adds `retryAttempts`, and anything added after
the spread wins, so `{ ...buildDatabaseOptions(...), synchronize: true }` would
leave the unit test green and the application rewriting schemas. It builds the
real `AppModule` against a temporary database, with **no `overrideProvider`** —
a replaced connection is not the connection whose options are in question — and
asks the assembled application what it actually ended up holding.

Its second test is the one worth keeping. It asserts on the *effect* rather than
the option name: the database handed to the application is an empty file with no
tables, and booting must leave it that way.

This is the same division as `env.validation.spec.ts` and
`config-wiring.e2e-spec.ts`, which is not a coincidence — it is the third time
this project has needed it.

#### Acceptance criterion — Mutation A

`synchronize: false` -> `synchronize: true` in `database.module.ts`. Nothing else
touched.

```
lint       PASS
typecheck  PASS
build      PASS
```

Still silent, exactly as the audit found. Then:

```
● buildDatabaseOptions › should never let TypeORM change the schema at boot

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

    > 171 |     expect(options.synchronize).toBe(false);

Test Suites: 1 failed, 7 passed, 8 total
Tests:       1 failed, 107 passed, 108 total
```

```
● schema changes at boot (e2e) › should hold a connection with synchronize switched off

    Expected: false
    Received: true

    > 125 |       expect(dataSource.options.synchronize).toBe(false);


● schema changes at boot (e2e) › should leave an empty database empty after booting

    expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 4

    - Array []
    + Array [
    +   "users",
    +   "entries",
    + ]

    > 160 |       expect(tables.map((table) => table.name)).toEqual([]);

Test Suites: 1 failed, 3 passed, 4 total
Tests:       2 failed, 33 passed, 35 total
```

The second failure is the finding stated as evidence rather than as a warning.
An empty database file was handed to the application, the application was
started, and **it created two tables before serving a single request.** That is
what `synchronize: true` means, printed by a test rather than described in a
document.

Restored, and green: 108 unit, 35 end-to-end.

#### Acceptance criterion — Mutation B

The `@Column({ name: 'user_id', ... })` deleted from `JournalEntry`, the relation
left in place.

```
$ pnpm typecheck
src/entries/entry-ownership.spec.ts(152,11): error TS2353: Object literal may only specify
  known properties, and 'userId' does not exist in type '_QueryDeepPartialEntity<JournalEntry>…'
src/entries/entry-ownership.spec.ts(176,9):  error TS2353: … 'userId' does not exist …
src/entries/entry-ownership.spec.ts(183,63): error TS2561: Object literal may only specify
  known properties, but 'userId' does not exist in type 'FindOptionsSelect<JournalEntry>'.
  Did you mean to write 'user'?
src/entries/entry-ownership.spec.ts(230,9):  error TS2353: … 'userId' does not exist …
```

```
● entry ownership › the user_id column on entries › should actually be enforced, not merely declared

    expect(received).rejects.toThrow()

    Received promise resolved instead of rejected
    Resolved to value: {"generatedMaps": [{}], "identifiers": [{"id": "entry-1"}], "raw": 1}

    > 147 |       await expect(


● entry ownership › writing and reading an owner › should round-trip an owner through the entity

    EntityPropertyNotFoundError: Property "userId" was not found in "JournalEntry".
    Make sure your query is correct.

    > 183 |       const stored = await entries.find({ select: { id: true, userId: true } });

Test Suites: 1 failed, 7 passed, 8 total
Tests:       2 failed, 106 passed, 108 total
```

The first failure is the more interesting one and it is exactly the shape this
task was warned about. With no `user_id` on the entity, TypeORM quietly drops
the field from the INSERT, the row is written with `user_id` NULL, the foreign
key never fires, and an insert that *should* have been refused **succeeds**. The
column still exists in the database. Nothing in the application can reach it.
That is "the column exists in the database and in no test", demonstrated.

Restored, and green.

### Proving the migration on a database that already has rows

`apps/api/data/neuron.db` — five entries, written by the `node:sqlite` driver,
schema created by the old `CREATE TABLE IF NOT EXISTS`. Copied first; the
original is never named by any command below.

```
$ sha256sum apps/api/data/neuron.db
44a99f8d0304b6d7a999725c9e819e2777270c7174e5fa5776977017f53edd01
$ stat -c 'size=%s mtime=%y atime=%x inode=%i' apps/api/data/neuron.db
size=12288  mtime=2026-09-01 15:25:07  atime=2026-09-01 15:25:07  inode=1814129

$ cp apps/api/data/neuron.db "$TMP/neuron.db"
```

The copy, before anything runs:

```sql
CREATE TABLE entries (
  id         TEXT PRIMARY KEY,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL
);
-- 5 rows
```

#### It fails first, exactly as Part A predicted

```
$ DATABASE_PATH=$TMP/neuron.db pnpm migration:run

0 migrations are already loaded in the database.
2 migrations were found in the source code.
2 migrations are new migrations must be executed.
query: BEGIN TRANSACTION
query:
            CREATE TABLE "entries" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" text NOT NULL
            )
Migration "InitialSchema1788262448946" failed, error: table "entries" already exists
query: ROLLBACK
Error during migration run:
SqliteError: table "entries" already exists
```

Part A's Limitation 1, arriving on schedule. A database created before Day 8 has
no record of the initial migration, so TypeORM tries to apply it. The
transaction rolled back and all five rows survived. The repair is the INSERT
Part A wrote down, and it has to be run **once per pre-Day-8 database**:

```sql
INSERT INTO migrations (timestamp, name)
VALUES (1788262448946, 'InitialSchema1788262448946');
```

That is a real operational step and it is recorded under Findings below, because
it is not in the README and there is nothing in the code that would tell anyone
about it.

#### Then it works

```
$ DATABASE_PATH=$TMP/neuron.db pnpm migration:run

query: CREATE TABLE "users" (…)
query: CREATE TABLE "temporary_entries" (…)
query: INSERT INTO "temporary_entries"("id","content","created_at") SELECT … FROM "entries"
query: DROP TABLE "entries"
query: ALTER TABLE "temporary_entries" RENAME TO "entries"
query: CREATE TABLE "temporary_entries" (… CONSTRAINT "FK_73b250bca5e5a24e1343da56168" …)
query: INSERT INTO "temporary_entries"("id","content","created_at","user_id") SELECT … FROM "entries"
query: DROP TABLE "entries"
query: ALTER TABLE "temporary_entries" RENAME TO "entries"
query: INSERT INTO "migrations"("timestamp","name") VALUES (1788341821514, ?)
Migration AddUsersAndEntryOwnership1788341821514 has been executed successfully.
query: COMMIT
```

The resulting schema:

```sql
CREATE TABLE "entries" (
    "id" text PRIMARY KEY NOT NULL,
    "content" text NOT NULL,
    "created_at" text NOT NULL,
    "user_id" text,
    CONSTRAINT "FK_73b250bca5e5a24e1343da56168"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE "users" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "created_at" text NOT NULL
);
```

```
$ PRAGMA foreign_key_list(entries)
[{ id: 0, seq: 0, table: 'users', from: 'user_id', to: 'id',
   on_update: 'NO ACTION', on_delete: 'NO ACTION', match: 'NONE' }]
```

All five entries, still there and still readable, `user_id` NULL for each:

```
{"id":"af71b90a-…","content":"Hello marvel world", "created_at":"2026-09-01T10:23:25.115Z","user_id":null}
{"id":"b1c17764-…","content":" ",                  "created_at":"2026-07-31T19:08:33.316Z","user_id":null}
{"id":"81e87932-…","content":"",                   "created_at":"2026-07-31T19:08:28.172Z","user_id":null}
{"id":"b3763e2d-…","content":"23.0",               "created_at":"2026-07-31T19:08:05.208Z","user_id":null}
{"id":"0163ea23-…","content":"yellow mello world", "created_at":"2026-07-31T18:10:24.648Z","user_id":null}

count: 5        rows where user_id IS NULL: 5        users: 0
```

The two rows holding `""` and `" "` predate the validation work and are still
there. A migration does not re-judge existing data, and this one did not.

#### And it reverses

```
$ DATABASE_PATH=$TMP/neuron.db pnpm migration:revert

AddUsersAndEntryOwnership1788341821514 is the last executed migration.
Now reverting it...
Migration AddUsersAndEntryOwnership1788341821514 has been reverted successfully.
```

```sql
CREATE TABLE "entries" (
    "id" text PRIMARY KEY NOT NULL,
    "content" text NOT NULL,
    "created_at" text NOT NULL
);
```

```
foreign keys on entries : []
columns                 : id, content, created_at
users table             : gone
migrations recorded     : [{"timestamp":1788262448946,"name":"InitialSchema1788262448946"}]
entries still there     : 5      (all five, unchanged)
```

The schema returns to exactly what it was, the five entries survive the round
trip in both directions, and the `migrations` table correctly forgets the
migration it reverted.

#### The real database was never opened

```
$ sha256sum apps/api/data/neuron.db
44a99f8d0304b6d7a999725c9e819e2777270c7174e5fa5776977017f53edd01     <- identical
$ stat -c 'size=%s mtime=%y atime=%x inode=%i' apps/api/data/neuron.db
size=12288  mtime=2026-09-01 15:25:07  atime=2026-09-01 15:25:07  inode=1814129

$ ls -la apps/api/data/
-rw-r--r--. 1 ummehabiba ummehabiba 12288 Sep  1 15:25 neuron.db
```

Byte-identical, same inode, and the **access** time is still yesterday's —
opening a SQLite file reads it, so an unchanged `atime` is stronger evidence
than an unchanged `mtime`. No `-wal`, `-shm` or `-journal` file was ever created
beside it; `PRAGMA journal_mode` is `delete`, not WAL, so one would have
appeared and been noticed.

### The running application, against the migrated copy

```
$ PORT=34871 DATABASE_PATH=$TMP/neuron-migrated.db node dist/main.js
```

```
$ curl /entries
[
  {"id":"af71b90a-059c-4db6-9aab-dbc16ad13abd","content":"Hello marvel world","createdAt":"2026-09-01T10:23:25.115Z"},
  {"id":"b1c17764-0740-4c68-82a4-a105b16b8e81","content":" ","createdAt":"2026-07-31T19:08:33.316Z"},
  {"id":"81e87932-730d-4a76-b306-d9de8da68403","content":"","createdAt":"2026-07-31T19:08:28.172Z"},
  {"id":"b3763e2d-2452-4631-890c-1ddab4f9bb3e","content":"23.0","createdAt":"2026-07-31T19:08:05.208Z"},
  {"id":"0163ea23-cd31-4bc0-8263-9c18a136db86","content":"yellow mello world","createdAt":"2026-07-31T18:10:24.648Z"}
]

$ curl /entries/count
{"count":5}

$ curl -X POST /entries -d '{"content":"written by the app after the ownership migration"}'
HTTP/1.1 201 Created
{"id":"313bbc8c-ab65-4eea-a1dc-7503c0be2db2","content":"written by the app after the ownership migration","createdAt":"2026-09-02T09:47:45.152Z"}
```

**Three keys.** Not four. The column exists in the table this response was read
out of.

#### Search still works

`GET /entries?word=100%25` returned `[]` on the journal as it stood, which
proves nothing — no entry contained `100%`. So one was written:

```
$ curl -X POST /entries -d '{"content":"100% exhausted today"}'
{"id":"7e8ea3cd-…","content":"100% exhausted today","createdAt":"2026-09-02T09:47:58.604Z"}

$ curl '/entries?word=100%25'          # the literal text "100%"
[{"id":"7e8ea3cd-…","content":"100% exhausted today","createdAt":"2026-09-02T09:47:58.604Z"}]

$ curl '/entries?word=%25'             # a bare percent sign
[{"id":"7e8ea3cd-…","content":"100% exhausted today","createdAt":"2026-09-02T09:47:58.604Z"}]

$ curl '/entries?word=marvel'
[{"id":"af71b90a-…","content":"Hello marvel world","createdAt":"2026-09-01T10:23:25.115Z"}]

$ curl /entries/count
{"count":7}
```

The bare `%` is the one that matters. Seven entries exist and it returned one —
the only one containing a percent sign. ADR-006's claim, *"searching for a
character finds entries containing that character"*, survives a table that was
dropped and rebuilt twice underneath it.

Every row in the database afterwards, including the two the application itself
just wrote:

```
{"id":"7e8ea3cd-…","content":"100% exhausted today",                          "user_id":null}
{"id":"313bbc8c-…","content":"written by the app after the ownership migration","user_id":null}
{"id":"af71b90a-…","content":"Hello marvel world",                            "user_id":null}
{"id":"b1c17764-…","content":" ",                                             "user_id":null}
{"id":"81e87932-…","content":"",                                              "user_id":null}
{"id":"b3763e2d-…","content":"23.0",                                          "user_id":null}
{"id":"0163ea23-…","content":"yellow mello world",                            "user_id":null}
```

`user_id` is NULL on rows the application wrote *after* the migration, not only
on the old ones. That is the task working as specified: nothing writes an owner,
because nothing knows who is asking.

Server stopped; no listener on 34871; throwaway databases deleted.

---

### The four questions

#### 1. Is `PRAGMA foreign_keys` on for this connection?

**Yes — it is ON, and the foreign key is genuinely enforced.** This was worth
asking, because SQLite's default is OFF and a foreign key nobody enforces is a
comment with extra steps.

Asked of the connection the application itself builds, through
`src/database/data-source.ts`, which uses the same `buildDatabaseOptions` the
server does:

```
foreign_keys on the application connection : [{"foreign_keys":1}]
journal_mode                               : [{"journal_mode":"delete"}]

-- try to write an entry owned by a user that does not exist --
   REJECTED -> SqliteError: FOREIGN KEY constraint failed
```

It is on because TypeORM turns it on, not because SQLite did. `better-sqlite3`
leaves it off; `BetterSqlite3Driver.createDatabaseConnection` issues
`databaseConnection.pragma("foreign_keys = ON")` on every connection it opens:

```js
// node_modules/typeorm/driver/better-sqlite3/BetterSqlite3Driver.js:108
// we need to enable foreign keys in sqlite to make sure all foreign key related
// features working properly. this also makes onDelete to work with sqlite.
databaseConnection.pragma("foreign_keys = ON");
```

**With one deliberate exception, which matters for reading the migration.**
`BetterSqlite3QueryRunner.beforeMigration` turns it **OFF** and
`afterMigration` turns it back **ON**. That is not a bug — it is what makes the
table-rebuild dance in question 2 legal, because `DROP TABLE "entries"` in the
middle of it would otherwise be checked against a constraint pointing at a table
that is about to reappear under the same name.

So the honest answer is: **off during a migration, on for everything else.**

Two facts follow from it being on, and both are pinned by tests in
`src/entries/entry-ownership.spec.ts` rather than described here:

- An entry cannot be written pointing at a user id that does not exist —
  `FOREIGN KEY constraint failed`.
- A user who still owns entries cannot be deleted, because the constraint is
  `ON DELETE NO ACTION`. That is SQLite's default and the generator wrote it
  explicitly; whether deleting an account should delete its journal is a product
  question for Day 9 or Day 10, and this task did not answer it.

The test asserts on the *behaviour* — that the insert is rejected — rather than
on the pragma value, so it stays true if TypeORM ever changes how it switches
the pragma on.

#### 2. What SQL did the migration turn out to be?

**A full table rebuild, twice.** Not an `ALTER TABLE`.

The reason is that SQLite's `ALTER TABLE` can add a column but cannot add a
`FOREIGN KEY` constraint to an existing table at all. A constraint is part of
the stored `CREATE TABLE` text, and the only way to change that text is to write
a new table, copy every row across, drop the original, and rename. TypeORM knows
this, so every SQLite migration that touches a constraint looks like this.

What was not expected is that it does it **twice** — once to add the column,
then again to add the foreign key onto the column it just added. One rebuild
would have done. It is left exactly as generated: it is correct, the whole thing
is inside one transaction, and hand-editing generated SQL to save one pass over
a five-row table would trade a real risk for nothing.

`up()`, in full:

```sql
CREATE TABLE "users" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "created_at" text NOT NULL
);

-- rebuild one: add the column
CREATE TABLE "temporary_entries" (
    "id" text PRIMARY KEY NOT NULL,
    "content" text NOT NULL,
    "created_at" text NOT NULL,
    "user_id" text
);
INSERT INTO "temporary_entries"("id", "content", "created_at")
     SELECT "id", "content", "created_at" FROM "entries";
DROP TABLE "entries";
ALTER TABLE "temporary_entries" RENAME TO "entries";

-- rebuild two: add the constraint
CREATE TABLE "temporary_entries" (
    "id" text PRIMARY KEY NOT NULL,
    "content" text NOT NULL,
    "created_at" text NOT NULL,
    "user_id" text,
    CONSTRAINT "FK_73b250bca5e5a24e1343da56168"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "temporary_entries"("id", "content", "created_at", "user_id")
     SELECT "id", "content", "created_at", "user_id" FROM "entries";
DROP TABLE "entries";
ALTER TABLE "temporary_entries" RENAME TO "entries";
```

`down()` is the same two rebuilds in reverse, then `DROP TABLE "users"`.

**The three-column `INSERT … SELECT` in rebuild one is the whole backfill.** The
new table has four columns and the copy names three, so `user_id` takes its
default — NULL — for every row that already existed. There is no `UPDATE`
statement anywhere in this migration and there does not need to be.

Reading it was worth doing for one reason that is not obvious from the
description: `DROP TABLE "entries"` appears twice in a migration whose purpose
is to preserve every row in `entries`. It is safe because each drop is preceded
by a copy and the whole thing is one transaction — the failed first run above
proves the transaction works, since it rolled back and left all five rows in
place. But "the migration that adds a column drops the table twice" is not a
sentence anyone should learn during a deploy.

#### 3. Did the entry JSON shape change?

**No.** It is exactly `id`, `content`, `createdAt`, in that order, and I know it
three separate ways.

**It very nearly did, and that is the part worth recording.** The natural way to
write the entity is:

```ts
@Column({ name: 'user_id', type: 'text', nullable: true })
userId: string | null;
```

and that changes the API. TypeORM puts the column in every SELECT it writes, so
every entity it loads carries `userId: null`, and `JSON.stringify` keeps a
`null`:

```
{"id":"…","content":"…","createdAt":"…","userId":null}
```

The fix is `select: false` on the column, which is a real restriction rather
than a cosmetic one: `find`, `findOneBy` and everything built on them return
objects with no `userId` at all, and a query that wants the owner has to ask for
it by name. Day 10 will have to ask. A column nothing selects cannot leak into a
response body by accident, which is the property worth having while the API
still has no idea who is asking.

How I know:

**One — a test asserts on the exact key list, over real HTTP.**
`test/app.e2e-spec.ts` now contains `/entries (POST) returns exactly id, content
and createdAt`, which checks `Object.keys` on both the POST response body and an
element of the GET list.

**Two — a test asserts it at the storage layer.**
`src/entries/entry-ownership.spec.ts` serializes a loaded entity and checks its
keys. It has to serialize first, and that turned out to be the interesting part:
TypeORM returns a real `JournalEntry` instance, so the object *owns* all five
declared properties and `Object.keys` on the instance is `['id', 'content',
'createdAt', 'userId', 'user']`, with the last two sitting there as `undefined`.
`JSON.stringify` omits an `undefined` property and keeps a `null` one, and that
single rule is the entire difference between a response body that changed today
and one that did not. My first draft of this test asserted on the instance and
failed, correctly, and the failure is what taught me where the guarantee
actually lives.

**Three — the real application, against a real migrated database**, pasted
above: three keys in the POST response, three in every element of GET /entries,
on a table that has a `user_id` column in it.

**And the existing suite would have told me too** — I checked rather than
assuming, and the checking is finding 2.

#### 4. What did I have to leave undone because users cannot exist yet?

**`users.name` is not unique.** Two users called "habiba" can be inserted right
now, and a test says so on purpose. Uniqueness is what makes a name identify one
person to authenticate *as*, and that only becomes a real constraint once there
is a login — Day 9. That day also gets to decide whether the identifier is a
name at all rather than an email. Declaring it today would freeze the answer a
day early and need another migration if Day 9 disagreed.

**There is no credential column.** ADR-009 named `password` "for completeness"
and said in the same paragraph that it will not survive Day 9, whose whole
problem is that storing a password is a liability. What replaces it — a hash, an
algorithm marker, a salt, more than one column — has not been decided, and a
column whose contents are undecided reads as answered to the next person who
opens the schema. A test asserts the column is absent so that its absence is a
recorded decision rather than an oversight.

**`user_id` is nullable, and cannot be anything else yet.** `NOT NULL` today
would require either inventing a placeholder owner or deleting the five real
entries. Expand, backfill, contract is the staged shape; this is the expand
step, and Day 10 performs the contract once ownership is enforced and every row
actually has an owner.

**`EntriesRepository` gained no ownership method.** There is no
`findAllForUser`, no `userId` parameter on `save`, nothing. Adding one would
mean writing a method with no caller and no way to test it against a real
request, and guessing today what Day 10's signature should be. The repository is
still the only class that knows storage exists; it simply has not been asked
about owners yet.

**`User` has no repository provider and no module.** `TypeOrmModule.forFeature`
does not mention it, because nothing injects it. It is in the `entities` array
so the relation resolves, and that is all it needs today. Day 9's registration
is what makes a `UsersModule` a real thing rather than an empty folder.

**Consequently, the ownership tests talk to the DataSource directly.** They have
to: there is no service method to call, because the decision was that there
should not be one yet. They are schema-and-entity tests, and they are built on
the schema the *migration* produces rather than on what the decorators claim —
which is the distinction `synchronize: false` exists to keep.

---

### Findings

#### 1. A pre-Day-8 database needs a manual INSERT before any migration runs

Part A predicted this and it happened exactly as written. It is now demonstrated
rather than anticipated, and it is still not written down anywhere a person
would find it:

```sql
INSERT INTO migrations (timestamp, name)
VALUES (1788262448946, 'InitialSchema1788262448946');
```

Without it, `pnpm migration:run` fails with `table "entries" already exists` on
any database created before Day 8 — which is every database that has real
entries in it. The transaction rolls back and no data is lost, so the failure is
safe, but the error message says nothing about what to do.

This is a `README` change and possibly a small script. It was not done here
because it is documentation work that was not in this task, and inventing a
`migration:baseline` command is a design decision this task was not asked to
make.

#### 2. The existing tests do catch a changed response body — for a reason that could stop being true

The task statement said *"an entry's JSON shape must not change, and the
end-to-end tests will tell you if it does."* I doubted that, because every body
assertion in `test/app.e2e-spec.ts` compares one response against another —

```ts
expect(res.body).toContainEqual(created.body);   // POST vs GET
expect(res.body).toEqual([created]);             // POST vs search
expect(deleted).toEqual(created);                // DELETE vs POST
```

— and a field appearing on *both* sides would leave all of them green.

**I was wrong, and I only know because I ran it.** With `select: false` removed
and nothing else changed, three of the original 32 end-to-end tests fail:

```
● EntriesController (e2e) › /entries (POST then GET)

    expect(received).toContainEqual(expected) // deep equality

    Expected value: {"content": "written over HTTP", "createdAt": "…", "id": "0cec0191-…"}
    Received array: [{"content": "written over HTTP", "createdAt": "…", "id": "0cec0191-…", "userId": null}]

       > 99 |         expect(res.body).toContainEqual(created.body);

● EntriesController (e2e) › status codes › GET /entries?word= finds nothing while GET /entries finds everything
● EntriesController (e2e) › status codes › DELETE /entries/:id returns 200 with the deleted entry, which is then gone

Tests: 4 failed, 31 passed, 35 total      (3 of the original 32, plus my new one)
```

and eight of the original 96 unit tests fail with it:

```
● EntriesService › findById › should return the entry that was created

    - Object {                                    + JournalEntry {
        "content": "findable by its id",              "content": "findable by its id",
        "createdAt": "…",                             "createdAt": "…",
        "id": "d919054a-…",                           "id": "d919054a-…",
      }                                           +   "user": undefined,
                                                  +   "userId": null,
                                                    }

       > 152 |       expect(await service.findById(created.id)).toEqual(created);
```

**Why the comparisons work is worth knowing, because it is an accident.** They
compare a POST response against a GET response, and those two are built
differently: `EntriesService.create` returns the object it constructed, while
`findAll`/`findById` return what the database handed back. So the POST body has
three keys and the GET body has four, and the comparison notices. If
`EntriesRepository.save` ever read the row back the way `update` already does —
which is a change ADR-005 would arguably favour, since it is the fix for a POST
response that once claimed `"content": 42` — both sides would carry `userId:
null`, the comparisons would agree with each other again, and every one of these
eleven tests would go green on a changed API.

So the suite is protected by an asymmetry nobody chose, in a method that has a
recorded argument for removing it.

That is the case for the one `it` added to `test/app.e2e-spec.ts`. It asserts
`Object.keys` on the POST body and on a GET element, so it states what the
contract *is* rather than that two responses happen to agree. It adds a claim
and changes none, and it is the only edit to an existing spec file in this task.

The general lesson survives my being wrong about this instance: a test that asks
whether two outputs of one system agree is weaker than one that says what either
output contains, and here the difference between the two was doing real work
without anybody having decided that it should.

#### 3. `eslint --fix` silently deleted type assertions

`DataSource.query` is declared `query<T = any>(…): Promise<T>`, so
`(await ds.query(sql)) as Row[]` is an assertion on an `any`, and
`@typescript-eslint/no-unnecessary-type-assertion` **removed it automatically**
— leaving every caller unpacking `any` and 23 new lint errors pointing at the
callers rather than at the cause. `pnpm lint` runs with `--fix`, so this
happened during a normal verification run and the file on disk was quietly
different afterwards.

Fixed by naming the type argument, `ds.query<Row[]>(sql)`, which is the same
claim in a place nothing rewrites. Recorded because a `--fix` in the standard
lint command can change source in ways the person running it did not ask for,
and this is the first time it has mattered here.

#### 4. `retryAttempts: 0` is still unenforced, and so is `migrationsRun`

While writing the `synchronize` tests it became clear the same audit applies to
its neighbours in `buildDatabaseOptions`. `migrationsRun` is now covered —
it is one line in the same test file and it is the other half of the same
sentence in the same comment ("schema changes happen through migrations and
nowhere else; not at boot either"). `retryAttempts: 0` is not covered, and
deleting it would turn an immediate boot failure into thirty seconds of silence
followed by the same message. Left alone rather than swept in, because it is a
different rule from a different day.

### Limitations

**1. The baseline INSERT is undocumented.** Finding 1. Carried into Day 9.

**2. `down()` is lossy once ownership is real.** Reverting this migration
discards every `user_id`, because the schema it returns to has nowhere to keep
one. Nothing can hit that today — every `user_id` in the world is NULL — but
Day 10's contract step will need its own thinking rather than a mirror of this
one's.

**3. The migration rebuilds the table twice.** Correct, transactional, and one
pass more than necessary. Left as generated; would matter on a table with
millions of rows and does not on this one.

**4. `select: false` protects the response body, and is one word from not
doing so.** It is pinned by two tests now, which is the repair — but the
mechanism keeping ownership out of the API is an option on a decorator rather
than something structural, and it will be deliberately removed one day. When it
is, the two tests are what make that a decision rather than an accident.

**5. Migrations still do not run at boot.** Unchanged from Part A. A fresh
clone needs `pnpm migration:run`, and now needs it to get two migrations rather
than one.

**6. `entry.interface.ts` still does not contain an interface.** Part A's
recommendation was to rename it to `entry.entity.ts` as Day 8b's first commit.
Not done: this task's brief is the schema change, and a rename touching every
import would bury it in the diff. `user.entity.ts` is named correctly, so the
two files are now inconsistent with each other, which is the strongest argument
yet for doing the rename. Carried forward.

### Lessons

**Adding a column changes the API unless you stop it.** This is the thing I did
not expect. The task said "make ownership expressible, change nothing
observable" and I read those as two independent halves. They are not: the
default behaviour of an ORM is to select every column it knows about, so the
schema and the response body are joined by default and separating them is work.
`select: false` is one word and it is the only reason today's brief was
achievable at all.

**I was wrong about the tests, and running them was the only way to find out.**
I read four end-to-end assertions that compare one response against another,
concluded they could not notice a field added to every response, and was about
to write that down as a finding. Eleven tests fail when the field is added. What
I had missed is that a POST body and a GET body are not built the same way here,
so "every response" was never true. The reasoning was sound and the premise was
not, which is exactly the failure mode that "verify by doing" exists for — and I
nearly filed a confident, wrong finding against a task statement that was right.

**A test that compares two outputs of one system is still weaker than one that
says what the output is** — but the reason is narrower than I first thought. It
is not that the comparisons are blind; it is that what makes them see is an
asymmetry nobody decided on, in a method with a written argument for removing
it. A guarantee resting on that is a guarantee with an expiry date nobody has
been told about.

**"Verify by doing, not by reasoning" caught something reasoning would have
missed.** I expected the migration to be `ALTER TABLE entries ADD COLUMN
user_id`. It drops and rebuilds the table twice. Both facts are invisible from
the entity, from the ADR, and from the passing test suite, and the only way to
know is to read the generated file — which is exactly why the task said to.

**The pragma question was the right question to ask.** A foreign key in SQLite
is enforced only if something turned enforcement on, and nothing in this
codebase does. TypeORM does, in a driver file nobody here has read, and it turns
it off again while migrations run. That is three facts about a constraint that
looks self-explanatory in the schema.
