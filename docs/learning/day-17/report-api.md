# Day 17 — Worker report, API: soft delete, and the shapes the web app sends

**Date:** 2026-10-07. Prompt: `docs/workers/day-17-api-soft-delete.md`.
Binding decision: `docs/decisions/ADR-020-soft-delete-for-entries.md`.

---

## Objective

Three things, all in the API and the contracts package.

1. Describe in `packages/contracts` the request bodies the web app sends
   today, and have the API's DTO classes declare that they follow them.
2. Add a `deleted_at` column to `entries`.
3. Make `DELETE /entries/:id` a soft delete. A soft delete keeps the row in
   the table and marks it as deleted. Every route then behaves as if the
   entry had never existed.

`apps/web` was not touched. Git was not touched. No dependency was added. No
migration was run against `apps/api/data/neuron.db`. The checksum of that
file is the same after this task as before it
(`f8a95550…bfbc26a`).

---

## Summary

All three parts are done, tested, and verified on a copy of the owner's
database.

```
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
lint        clean
typecheck   clean
build       clean
contracts   6 passed
unit        211 passed, 15 suites   (was 194, 13 suites)
e2e         279 passed, 21 suites   (was 236, 20 suites)

pnpm lint:web && pnpm typecheck:web && pnpm build:web && pnpm test:web
lint        clean
typecheck   clean
build       clean
web tests   15 passed
```

All five required mutations make tests fail. The table is under *Testing
performed*.

Six things need the Master Thread's or the owner's attention. The first one
changes what the owner must do, so it comes first.

1. **The new code does not run on the old schema.** On Day 16 the order
   between "take the new code" and "run the migration" did not matter. This
   time it does. Without the `deleted_at` column, every entries route answers
   500. See question 4.
2. **TypeORM's own soft-delete method writes the wrong value, so I did not
   use it.** It writes the database's clock, in the database's format. The
   prompt predicted this might be so. See *What TypeORM writes into the
   column*.
3. **ADR-020 names two holes in the automatic filter. I found a third, and
   one place where the filter does more than the ADR says.** See question 1.
4. **Declaring the column makes every insert of an entry cost a second
   query.** TypeORM reads the row back after writing it. See question 1.
5. **One existing test outside the expected list had to change, and three
   lines of test setup.** See *Findings*.
6. **The rule "a mood alone does not list a date" leaves moods stored that
   no screen will ever show.** See question 3.

---

## Files changed

**New**

| File | What it is |
|---|---|
| `apps/api/src/database/migrations/1791363323870-AddEntryDeletedAt.ts` | The migration. Written by hand, with `down()`. |
| `apps/api/src/database/add-entry-deleted-at.spec.ts` | 10 tests for the migration. |
| `apps/api/test/soft-delete.e2e-spec.ts` | 29 tests for the behaviour of a deleted entry. |
| `apps/api/src/entries/no-deleted-rows-asked-for.spec.ts` | 6 tests that read the source and refuse `withDeleted` and its relatives. |
| `docs/learning/day-17/report-api.md` | This report. |

**Changed, source**

| File | Change |
|---|---|
| `packages/contracts/src/index.ts` | Three new interfaces: `WireNewEntry`, `WireLogin`, `WireRegistration`. |
| `apps/api/src/entries/create-entry.dto.ts` | `implements WireNewEntry`. |
| `apps/api/src/auth/login.dto.ts` | `implements WireLogin`. |
| `apps/api/src/auth/register.dto.ts` | `implements WireRegistration`. |
| `apps/api/src/entries/entry.entity.ts` | The `deletedAt` column, declared with `@DeleteDateColumn`. |
| `apps/api/src/database/migrations/index.ts` | Registers the migration, last in the list. |
| `apps/api/src/entries/entries.repository.ts` | `update` carries its own condition. `delete` is replaced by `markDeleted`. `findWithDay` is removed. |
| `apps/api/src/entries/entries.service.ts` | `delete` no longer looks at the day. It answers `true` or `false`. |
| `apps/api/src/entries/entries.controller.ts` | `DELETE` answers 204 and returns nothing. |
| `apps/api/src/days/days.repository.ts` | `findInRange` lists a date only if it has a live entry. `deleteIfEmpty` is removed, and with it the `DataSource` the repository asked for. |
| `apps/api/src/days/days.service.ts` | `discardIfEmpty` is removed. |

**Changed, tests.** Each one is explained under *Findings*.

`entries.controller.spec.ts`, `entries.service.spec.ts`,
`days.repository.spec.ts`, `entry-ownership.spec.ts`,
`require-entry-day.spec.ts`, `test/app.e2e-spec.ts`,
`test/ownership.e2e-spec.ts`, `test/days.e2e-spec.ts`,
`test/days-range.e2e-spec.ts`, `test/count-agrees-with-list.e2e-spec.ts`,
`test/test-database.ts`.

---

## How it works

### Part 1 — the shapes the web app sends

The package gained three interfaces. An interface is a description of the
fields an object has. It exists only while the code is being compiled, and
it contains no behaviour.

```ts
export interface WireNewEntry    { content: string }
export interface WireLogin       { email: string; password: string }
export interface WireRegistration { email: string; password: string }
```

Each DTO class in the API now says `implements` followed by the matching
interface. The decorators that validate the values stayed in the API, as the
owner ruled. There is no shape for `PATCH`, because the web app does not send
one yet.

**Renaming a field makes the API fail to compile.** I renamed `content` to
`text` in `WireNewEntry`, ran `pnpm typecheck`, and restored the file. I did
the same with `email` in `WireLogin`.

```
src/entries/create-entry.dto.ts(5,14): error TS2420:
  Class 'CreateEntryDto' incorrectly implements interface 'WireNewEntry'.

src/auth/login.dto.ts(11,14): error TS2420:
  Class 'LoginDto' incorrectly implements interface 'WireLogin'.
```

One limit of this check is under *Limitations*.

### Part 2 — the column

The migration is one statement in each direction.

```sql
-- up
ALTER TABLE "entries" ADD COLUMN "deleted_at" text
-- down
ALTER TABLE "entries" DROP COLUMN "deleted_at"
```

**SQLite does this without rebuilding the table, and I measured that.**
SQLite keeps each table and each index at a numbered place inside the file.
A rebuild creates a new table, so the table gets a new place. A change made
in place leaves the numbers alone. On the copy of the owner's database:

```
                 before                      after up()                  after down()
entries          place 18                    place 18                    place 18
primary key      place 19                    place 19                    place 19
IDX_entries_day  place 9                     place 9                     place 9
```

The migration test asserts the same thing, and it also compares each row's
internal row number before and after.

**Everything `entries` had is still there.** The test reads the columns, the
foreign keys and the indexes before the migration runs, and compares them
afterwards. The five columns are unchanged and `deleted_at` is the only
addition. Both foreign keys are present, and the database still refuses an
entry whose user or day does not exist. `IDX_entries_day_id` is present.
There is no index on the new column.

I also checked the finding from Day 16 about foreign-key names. TypeORM reads
a key's name out of the stored text of the table. SQLite put the new column
after `day_id` and before the two constraints, and did not disturb the
constraint lines. TypeORM still reads both names, `FK_entries_user` and
`FK_entries_day`, and a test says so.

**`down()` works.** After `up()`, one entry is marked deleted, and then
`down()` runs. The stored schema text of the whole database is then
identical, character for character, to what it was before `up()`. The rows
are identical. Running `up()` again afterwards gives the same schema as the
first time.

**`migration:generate` does not mention `entries`.** Against a fully migrated
copy it produces 73 lines about `sessions`, `days` and `users`, which is the
state Day 16 left and explained. The word `entries` does not appear.

### What TypeORM writes into the column

The prompt asked me to find this out and not to assume it. I ran each kind of
query against a throwaway database with query logging on.

TypeORM's method for a soft delete is `softDelete`. This is what it sent:

```sql
UPDATE "entries" SET "deleted_at" = CURRENT_TIMESTAMP
WHERE ("id" = ? AND "user_id" = ?) AND "deleted_at" IS NULL
```

and this is what was stored:

```
2026-10-07 08:56:07
```

That value is wrong for this project in three ways.

- **It comes from the database's clock, not the application's.** The tests
  control the application's clock. They cannot control this one, so no test
  could say what the value should be.
- **The format is different.** Every other time in the project looks like
  `2026-10-07T08:56:07.123Z`. This one has a space where the `T` should be,
  no milliseconds and no `Z`. Two formats in text columns do not sort or
  compare correctly against each other.
- **Nothing says it is UTC.** It is, but only the reader's knowledge of
  SQLite says so.

So the application sets the column itself, as the prompt instructed for this
case:

```ts
this.entries.update({ id, userId, deletedAt: IsNull() }, { deletedAt });
```

`deletedAt` is `new Date().toISOString()`, taken in the service, exactly as
`createdAt` is. The decorator stays on the entity for what it does to reads.

A test in `no-deleted-rows-asked-for.spec.ts` now refuses the word
`softDelete` anywhere in `src`, so nobody reaches for the method later
without meeting this reason.

### Part 3 — behaviour

**The repository.** `update` and `markDeleted` are both an `UPDATE` whose
`WHERE` clause says `deleted_at IS NULL`, written by hand. For `update` that
condition is what stops an edit reaching a deleted entry. For `markDeleted`
it is what makes a second delete match nothing, so the first time stays in
the column and the route answers 404.

Both follow ADR-013's rule for writes: there is no read first and no check
afterwards. The conditions of the write are the guard.

**The controller.** `DELETE` is marked `@HttpCode(204)` and returns nothing.
If the repository reports that no row was changed, the controller throws the
same 404 as before.

**The day.** `EntriesService.delete` no longer reads the entry's day, and
`DaysService.discardIfEmpty`, `DaysRepository.deleteIfEmpty` and
`EntriesRepository.findWithDay` are removed. `findWithDay` existed only to
find the day to delete. `DaysRepository` asked Nest for a `DataSource` only
to run the raw count inside `deleteIfEmpty`, so that went too.

**The range listing.** `GET /days?from=&to=` now asks for days in the range
for which a live entry exists:

```sql
SELECT … FROM "days" "day"
WHERE "day"."user_id" = ? AND "day"."date" BETWEEN ? AND ?
  AND EXISTS (
    SELECT 1 FROM "entries" "entry"
    WHERE ( "entry"."day_id" = "day"."id" AND "entry"."user_id" = ? )
      AND ( "entry"."deleted_at" IS NULL )        -- added by the decorator
  )
ORDER BY "day"."date" DESC
```

The last condition is not in the source. TypeORM adds it because the inner
query selects from the `JournalEntry` entity.

`GET /days/:date`, `GET /days/today` and `PUT /days/:date/mood` are
unchanged. Writing a new entry uses `findOrCreate`, which finds the existing
day row, so the mood of an emptied day comes back with it.

### Every query that reads or writes `entries`

This is the list the prompt asked for. It covers every repository in `src`.
`UsersRepository` and `SessionsRepository` do not touch `entries`.

| # | Where | What it does | How deleted rows are kept out |
|---|---|---|---|
| 1 | `EntriesRepository.find` | The listing, with `word`, `date`, `limit`, `offset` | **Decorator.** TypeORM adds `deleted_at IS NULL`. |
| 2 | `EntriesRepository.count` | The count, with `word`, `date` | **Decorator.** |
| 3 | `EntriesRepository.findById` | `GET /entries/:id`. Also the read after a create and after an update. | **Decorator.** |
| 4 | The join inside 1 and 2 when `date` is given | Joins `days` to compare the date | **Decorator**, on `entries`. `days` has no such column and needs none. |
| 5 | `EntriesRepository.update` | `PATCH /entries/:id` | **By hand.** `deletedAt: IsNull()` in the criteria. |
| 6 | `EntriesRepository.markDeleted` | `DELETE /entries/:id` | **By hand.** The same condition. |
| 7 | `EntriesService.create`, `manager.insert` | Writes a new entry | Not applicable. It writes `deleted_at` as `NULL`. |
| 8 | TypeORM's read-back after 7 | Reads the new row's `deleted_at` | **Decorator.** I did not write this query. See question 1. |
| 9 | `DaysRepository.findInRange`, the inner query | "Does this day have an entry?" | **Decorator.** |
| 10 | `EntriesRepository.save` | An insert. Nothing calls it. | Not applicable. It was unused before this task and I left it. |

Removed by this task: `findWithDay` (decorator would have covered it), and
the raw `SELECT COUNT(*) FROM entries` in `deleteIfEmpty`. That raw count
was the one query in the API that the decorator could not have reached. It
would have counted deleted entries as present. It is gone because its
purpose is gone, not because I fixed it.

**There is now no raw SQL in `src` outside the migrations.** I searched for
every `.query(` call. The only query builders are the one in row 9 and one
in `UsersRepository`.

---

## Decisions made

**1. `deleted_at` is `select: false`.** This means TypeORM leaves the column
out of every `SELECT` it writes, so an entry loaded from the database does
not carry the property at all. The filter still works, because the filter is
in the `WHERE` clause and `select: false` only governs which columns come
back. This is the same protection `user_id` and `day_id` have. It is the
main reason no response can contain the field. A test checks the responses
all the same, because the prompt is right that the compiler does not.

**2. The range listing uses `EXISTS` and relies on the decorator.** I could
have written `deleted_at IS NULL` into the inner query by hand as well.
I did not, because ADR-020's first decision is that the filter is automatic
and not remembered. The cost is that the condition is invisible in the
source, so the comment above the query says where it comes from. Mutation 4
replaces the inner query with the same thing in raw SQL, and three tests
fail.

**3. Login and registration have two interfaces, not one.** They have the
same two fields today. They are bodies of two different requests, and the
prompt lists them separately. Registration is the one more likely to gain a
field. One shared interface would have to be split on that day.

**4. `markDeleted` takes the time as a parameter.** The service reads the
clock and the repository stores what it is given. `create` already works
this way.

**5. The repository method is named `markDeleted`, not `delete`.** The row
is not deleted, and a method named `delete` on a repository reads as if it
were. The service method is still `delete`, because from the service
upwards the entry is gone.

**6. The new migration tests do not claim "this is the last migration".**
See *Findings*, item 1, for why.

---

## Assumptions

- "No response body may contain a deleted entry's content" is about the
  entries routes and the days routes. I tested the entries routes. The days
  routes build their answer from two named fields and cannot carry an entry.
- The 404 for a deleted entry should be the same body as the 404 for an id
  that never existed, apart from the id inside the message. A test compares
  the two.
- `GET /days?from=&to=` should still carry the mood of each date it lists.
  It does.

---

## Limitations

- **`implements` catches a renamed or removed field. It does not catch an
  extra one.** If the DTO gains a field that the interface does not have,
  the API still compiles. So the contract can fall behind the API without a
  signal. It cannot get ahead of it.
- **Nothing checks that the web app uses these three interfaces.** That is
  the web worker's task. Until it does, the interfaces describe the API
  only.
- **The table only grows.** ADR-020 accepts this.
- **The source-reading test is a word search.** It looks for `withDeleted`,
  `softDelete`, `softRemove`, `restore` and `recover` in `src`, with
  comments removed. It would be fooled by someone building the word from
  pieces, and it would complain about an unrelated function named
  `restore`. I think both are acceptable for what it guards.
- **I did not check any of this against PostgreSQL.**

---

## Dependencies added

None.

---

## Testing performed

### Claims, and where each is tested

In `test/soft-delete.e2e-spec.ts` unless another file is named. Alice writes
three entries one minute apart and deletes the middle one. The middle one is
chosen on purpose: a listing that forgot about it would show it between the
other two.

| Claim | Test |
|---|---|
| `GET /entries` does not list it | Eight cases: no filter, `word` (two), `date`, `date` and `word`, `limit`, `offset`, `limit` and `offset`. Also `does not leave a gap in the pages where it was`. |
| `GET /entries/count` does not count it | Five cases: no filter, `word` (two), `date`, `date` and `word`. Each pins the number. |
| `GET /entries/:id` answers 404 | `answers 404`, and `answers exactly as it does for an id that never existed`. |
| `PATCH` answers 404 and the row is unchanged | `answers 404 and leaves the row as it was`. Reads the row from the database. |
| A second `DELETE` answers 404 and keeps the first time | The clock is moved four minutes on before the second delete. |
| `DELETE` on a live entry answers 204 with no body | `answers 204 with no body`. Checks the text, the body and that there is no content type. |
| `DELETE` on another user's entry is 404 and changes nothing | `answers 404 and changes nothing`. |
| The row stays, with `deleted_at` set to the controlled clock's instant | `leaves the row in the table…`. Expects exactly `2026-08-09T12:05:00.000Z`. |
| The count agrees with the listing when some are deleted | `count-agrees-with-list.e2e-spec.ts`, `when some entries are deleted`. Eight queries, walked a page at a time, then pinned numbers, then the number of rows still in the table. |
| A deleted entry is invisible to its owner and to another user | `is invisible to another user as well, on every route`, and the tests above for the owner. |
| The day row survives, with its mood | `keeps its row and its mood when its last entry is deleted`. Also `days.e2e-spec.ts`. |
| `GET /days/:date` and `/days/today` still answer with the mood | `still answers with its mood…`. |
| A new entry uses the existing day row | `is the day a new entry is filed under, mood included`. |
| The range listing follows the rule | `days-range.e2e-spec.ts`, `which dates are listed`, five tests. `days.repository.spec.ts`, `findInRange`, five tests. |
| No response contains `deleted_at` | `never contains deleted_at, before a delete or after one`. Twelve requests, made twice. |
| No response contains a deleted entry's content | `never contains a deleted entry's content`. |
| Nothing in `src` asks for deleted rows | `no-deleted-rows-asked-for.spec.ts`. |
| The migration: column, keys, indexes, no rebuild, rows, `down()` | `add-entry-deleted-at.spec.ts`. |

### Mutation table

For each row I made the change, ran typecheck, the unit suite and the
end-to-end suite, recorded the failures, and restored the file. Typecheck
passed for all five, so none of these mistakes would be caught by the
compiler. Unit counts are out of 211, end-to-end out of 279.

| # | Mutation | Unit failed | E2E failed | Where |
|---|---|---|---|---|
| 1 | Remove `@DeleteDateColumn`, leaving an ordinary column | **4** | **31** | Every "not listed" and "not counted" case, `GET /entries/:id`, the count invariant, the range rule, both response checks. |
| 2 | Remove the hand-written condition from the update | 0 | **1** | `PATCH /entries/:id › answers 404 and leaves the row as it was` |
| 3 | Make the second `DELETE` succeed again | **1** | **2** | `DELETE … a second time › answers 404 and keeps the first deleted_at`, the status list in the response check, and `EntriesController › should not report success twice`. |
| 4 | Make the range listing include a date whose entries are all deleted | **1** | **2** | `does not list a date whose entries are all deleted`, in both the repository spec and the end-to-end spec, and `lists the date again…`. |
| 5 | Make `DELETE` hard-delete the row | 0 | **5** | The row assertion, the `PATCH` test, the second-delete test, the other-user test, and the row count in the count invariant. |

Two rows are worth reading closely.

**Mutation 2 is caught by one assertion in one test.** With the condition
removed, `PATCH` on a deleted entry still answers 404. This is because the
repository writes the row and then reads it back, the read is filtered by
the decorator, the read finds nothing, and the controller reports "not
found". So the route says "nothing happened" while the deleted entry's
content has been overwritten. Only reading the row from the database shows
it. This is the hole ADR-020 named, and it is quieter than the ADR suggests.

**Mutation 5 passes every unit test.** From the service upwards, a hard
delete and a soft delete look the same: the entry is gone. The difference is
only in the table, and only tests that look at the table see it.

### Findings: existing tests that changed

The prompt expected three kinds of change: `DELETE` answering 200 with a
body, a day disappearing with its last entry, and a mood-only day being
listed. Those are listed first. The two items after them are the findings.

**Expected.**

- `entries.controller.spec.ts`, one test. `delete` returned the entry. It
  now returns nothing.
- `entries.service.spec.ts`, two tests. `delete` returned the entry or
  `undefined`. It now returns `true` or `false`.
- `test/app.e2e-spec.ts`, one test. 200 with a body became 204 with none.
- `test/ownership.e2e-spec.ts`, one test. It expected 200 from the owner's
  delete.
- `test/days.e2e-spec.ts`, three tests. One claimed the opposite of the new
  rule and was turned round: `keeps the day when its last entry is deleted`.
  The other two expected 200. The last of them also checked that only the
  caller's day was removed. It now checks that no day is removed at all.
- `days.repository.spec.ts`. The four `deleteIfEmpty` tests went with the
  method. Five `findInRange` tests replace them.
- `test/days-range.e2e-spec.ts`. The setup made five days by setting five
  moods and nothing else. Under the new rule none of them would be listed,
  so every test in the file would have been about an empty answer. Each of
  the five dates now also has one entry. No existing test's expectation in
  that file changed.

**Finding 1. `require-entry-day.spec.ts` had a test that could only pass
until the next migration was written.** It was named `is the last migration,
so "before" in these tests means what it says`, and it asserted that
`RequireEntryDay` was the final item in the list. It failed the moment I
registered a tenth migration. Nothing was wrong with the migration or with
the other eighteen tests in the file.

I changed what it claims. The real danger it was guarding against is that
`indexOf` answers `-1` for a migration that is not in the list, and then
`slice(0, -1)` quietly means "all but the last". So the test now asserts
that the migration is in the list. I wrote my own migration spec the same
way, so that the next migration does not break it.

**Finding 2. Three lines of test setup construct `DaysRepository`
directly.** They are in `test/test-database.ts` and twice in
`entry-ownership.spec.ts`. Each passed a `DataSource` as a second argument.
The repository no longer takes one, so each lost that argument. No test's
claim changed.

### On a copy of the owner's database

There is no `sqlite3` command on this machine, so I read the copy with a
short Node script that uses the project's own `better-sqlite3`. I copied
`apps/api/data/neuron.db` to a temporary folder and ran `migration:run` with
`DATABASE_PATH` pointing at the copy.

```
                 before                      after
users            1                           1
entries          1                           1
days             1                           1
sessions         2                           2
entries columns  5                           6, the sixth is deleted_at TEXT, nullable
foreign keys     day_id -> days,             day_id -> days,
                 user_id -> users            user_id -> users
indexes          IDX_entries_day_id + pk     IDX_entries_day_id + pk
alive entries    (no such column)            1 of 1
last migration   RequireEntryDay             AddEntryDeletedAt
```

The one entry has the same id, content length, `created_at`, owner and day
on both sides. `PRAGMA foreign_key_check` reports nothing and
`PRAGMA integrity_check` reports `ok`.

I then ran `migration:revert` on the same copy. The counts, columns, keys
and indexes returned to the "before" column. The copy has been deleted.

---

## The four questions

### 1. What does `@DeleteDateColumn` actually do to each kind of query, and where did it surprise me?

I logged the SQL for each kind.

| Kind of query | What TypeORM does |
|---|---|
| `find`, `findOne`, `findOneBy`, `count` | Adds `AND deleted_at IS NULL`. |
| A query builder that selects from the entity | Adds it. |
| A join to the entity | Adds it, inside the join's `ON`. |
| A subquery that selects from the entity | Adds it. |
| `update` by criteria | **Adds nothing.** A deleted row is changed. |
| A query builder `update` | **Adds nothing.** |
| `delete` by criteria | **Adds nothing.** A deleted row is removed for good. |
| `insert` | Writes `NULL` into the column, and then runs a second query. |
| `softDelete` | Writes `CURRENT_TIMESTAMP`, and adds `deleted_at IS NULL` by itself. |
| Raw SQL | Nothing. TypeORM never sees it. |

Three things surprised me.

**The filter reaches further than ADR-020 says.** The ADR says "every `find`
and `count`". It also covers query builders, joins and subqueries. That is
why the range listing needs no condition written by hand. I had expected to
have to write one.

**There is a third hole, and the ADR names two.** `delete` by criteria is
not filtered. Today nothing in `src` hard-deletes an entry, so nothing is
wrong. It will matter on the day account deletion is built. That code will
want to remove deleted rows too, so the missing filter is what it needs.
But a hard delete written for any other purpose would also reach deleted
rows, and nobody would have asked it to. I would add it to the ADR's list so
that the list is complete.

**An insert now costs two queries.** After the `INSERT`, TypeORM runs:

```sql
SELECT "id", "deleted_at" FROM "entries" WHERE "id" = ? AND "deleted_at" IS NULL
```

It does this to read back the value of a column it believes the database
generates. It then writes `deletedAt: null` onto the object that was passed
to `insert`. `select: false` does not prevent either. Nothing in the
application returns that object, so no response is affected. `create` reads
the entry again through `findById`, and that read does not carry the field.
The cost is one extra read per new entry. I think that is acceptable. I am
reporting it because it is invisible in the source.

One thing did not surprise me and is worth saying plainly. **The decorator
protects reads through the entity and nothing else.** That is the same shape
ADR-013 recorded for `select: false`: a protection whose reach is narrower
than its name suggests. Mutation 2 shows what that looks like in practice.

### 2. Is there any way left, through the API, to tell that a deleted entry once existed?

**No, not that I could find.** I looked for it in these places.

- **The status and body of the 404.** A deleted entry and an id that never
  existed give the same status and the same body, apart from the id in the
  message. A test compares them. This holds for `GET`, `PATCH` and `DELETE`,
  and for the owner as well as for another user.
- **The listing and its pages.** The deleted entry holds no place in the
  order. A test asks for pages of one and finds no gap.
- **The count.** It counts what is listed. The invariant test covers this
  with three entries deleted.
- **The ids.** They are random, so a missing one cannot be noticed.
- **The day.** This is the one I thought might leak. The day row stays, and
  `GET /days/:date` still answers with its mood. But that answer is the same
  as for a day where a mood was set and nothing was ever written, which the
  API has allowed since Day 13. And for a day with no mood, the answer is
  `{ date, mood: null }` whether the row exists or not. So the answer does
  not say that an entry was there.
- **Writing again on the same day.** The new entry is filed under the old
  day row. Nothing in any response shows whether the row was old or new.

Two things are true and are not leaks through the API.

- The person who deleted the entry saw a 204 and knows what they did.
- The row is in the database file and in every backup of it. ADR-020 accepts
  this and asks that the product say so truthfully.

### 3. The owner chose that a mood alone does not list a date. Did implementing it reveal a case where that rule gives a strange answer?

**Yes, two, and I think the first is worth the owner's attention.**

**A mood can be stored where no screen will ever show it.**
`PUT /days/:date/mood` accepts any valid date, past or future, and creates
the day row. Before today, that date then appeared in the range listing.
Now it does not. And an entry can only be written on today's date, because
the server decides the date. So a mood set on any day other than today, on a
day without entries, can never become visible on the calendar. It is stored,
`GET /days/:date` will return it to anyone who asks for that exact date, and
the calendar will never point to it.

The same is true of a past day the person emptied. Its mood stays in the
table for good, and deleting the entries did not remove it. The ADR's
accepted cost says "deleted writing is still stored". The mood of an
emptied day is in the same position and the ADR does not mention it. If the
product is going to say truthfully what a delete keeps, the mood belongs in
that sentence.

**On today's date, a mood comes back.** A person sets today's mood to
"Hard", writes, deletes everything, and writes again later the same day.
The mood "Hard" is there again without being asked for. The prompt requires
this, and a test asserts it. I think it is the right behaviour, because the
day is the same day and the person did not clear the mood. It is still worth
knowing that "I emptied the day" and "the day forgot its mood" are not the
same thing.

A smaller consequence for the web worker: before the first entry of the
day, `GET /days/today` can answer with a mood while the range listing leaves
today out. The two endpoints are both correct. A screen that reads both
must not treat the disagreement as an error.

I do not disagree with the rule. The alternative, listing mood-only dates,
would put every emptied day back on the calendar, which is the opposite of
what the owner asked for.

### 4. What must the owner do to her own database, in which order?

Her database has 1 user, 1 entry, 1 day and 2 sessions. The migration ran
cleanly on a copy of it.

**The order matters this time.** On Day 16 the new code ran correctly on the
old schema. Today it does not. I ran the new entity against a database
without the column, and every read failed:

```
find failed:  no such column: JournalEntry.deleted_at
count failed: no such column: JournalEntry.deleted_at
```

Through the API that is a 500 on every entries route and on the calendar.
Creating an entry fails too, because the `INSERT` names the column. So the
migration has to run before the new API starts. The other order is safe:
the old code on the new schema simply ignores a column it does not know.

1. **Stop the API** if it is running, so nothing writes while the file is
   copied.
2. **Back up one file:** `apps/api/data/neuron.db`. Copy it to somewhere
   outside the repository, with the date in its name. If files named
   `neuron.db-wal` or `neuron.db-shm` are beside it, copy those too. There
   are none today.
3. **From `apps/api`, run `pnpm migration:run`.** Expect these two lines in
   the output: `1 migrations are new migrations must be executed` and
   `Migration AddEntryDeletedAt1791363323870 has been executed successfully`.
4. **Start the API and open the Today screen.** The entry should be there.

This migration cannot refuse. It has no check that could fail, because
adding a nullable column is valid for any data.

To undo afterwards, either run `pnpm migration:revert` from `apps/api`, or
stop the API and put the backup file back. Reverting drops the column, and
with it the record of which entries were deleted. Every entry that had been
deleted would be visible again. If anything has been deleted since the
migration ran, putting the backup back loses the entries written since, and
reverting brings deleted entries back. Neither is harmless, so undo only for
a real reason.

One thing for the web worker, not for the database: nothing in `apps/web`
calls `DELETE /entries/:id` yet. I searched for it. So the change from 200
to 204 breaks nothing that exists. The first code to call it must not try to
read a body from the answer.
