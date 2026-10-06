# Day 16a — Worker report: an entry must have a day

**Date:** 2026-10-07. Prompt: `docs/workers/day-16a-require-entry-day.md`.
Closes: `docs/learning/day-15/report-15b.md`, question 3.

---

## Objective

Make `entries.day_id` `NOT NULL` in the database. This is the "contract" step
of expand, backfill, contract. Day 13 did the first two steps.

API only. `apps/web` was not touched, git was not touched, no dependency was
added, and no migration was run against `apps/api/data/neuron.db`. The
checksum of that file is the same after this task as before it.

---

## Summary

The migration is written, tested and verified on a copy of the owner's
database.

- `RequireEntryDay` rebuilds `entries` with `day_id text NOT NULL`. It refuses
  to run if any entry has no day, and it changes nothing when it refuses.
- Every column, the foreign key to `users`, and `IDX_entries_day_id` are
  still there afterwards. `down()` puts the old schema back and keeps the
  rows.
- All three required mutations make tests fail. I ran four more of my own.

```
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
lint        clean
typecheck   clean
build       clean
unit        194 passed, 13 suites   (was 175, 12 suites)
e2e         232 passed, 19 suites   (was 232, 19 suites)
```

Five things need a decision from the Master Thread or the owner. The first
two are the important ones.

1. **There was no foreign key from `entries.day_id` to `days`, and I added
   one.** The prompt says to keep that key "if there is one". There was not.
   `AddDays` added the column with `ADD COLUMN` and never declared a key. I
   added `FK_entries_day`, for three reasons given under *Decisions made*.
   It is the one thing in this task that goes beyond what was asked.
2. **Fifteen existing tests had to change.** The prompt says that is a
   finding. All fifteen inserted an entry with no day, or relied on one. See
   *Findings*.
3. **`migration:generate` does not report "nothing to generate", and this
   task cannot make it.** It no longer mentions `entries` at all, which is
   the part this task owns. What remains is about `sessions`, `days` and
   `users`, was there before this task, and one part of it can never go
   away. See *What `migration:generate` says*.
4. **The new foreign key changes what `deleteIfEmpty` does in one corrupt
   situation.** It now throws where it used to delete. See *Findings*,
   item 3.
5. **`RequireEntryOwner` wrote its foreign key in a way TypeORM cannot read
   back.** The key works. TypeORM cannot see its name. See *Foreign keys
   during a migration*, the last paragraph.

---

## Files changed

**New**

| File | What it is |
|---|---|
| `apps/api/src/database/migrations/1791314102576-RequireEntryDay.ts` | The migration. Written by hand, with `down()`. |
| `apps/api/src/database/require-entry-day.spec.ts` | 19 tests for it. |
| `docs/learning/day-16/report-16a.md` | This report. |

**Changed, source**

| File | Change |
|---|---|
| `apps/api/src/database/migrations/index.ts` | Registers the migration, last in the list. |
| `apps/api/src/entries/entry.entity.ts` | Names the two foreign keys and the index, so that TypeORM's picture of `entries` matches the table. No behaviour changes. |

**Changed, tests** (each explained under *Findings*)

| File | Change |
|---|---|
| `apps/api/test/test-database.ts` | `seedEntries` gives each seeded entry a day. |
| `apps/api/src/entries/entry-ownership.spec.ts` | Five tests: four give their entry a day, one stops assuming there is only one foreign key. |
| `apps/api/src/days/days.repository.spec.ts` | One test now expects the database to refuse a delete. |
| `apps/api/test/entries-by-date.e2e-spec.ts` | The test the prompt named. It now claims the opposite thing. |

---

## How it works

### What `entries` had before, read from a migrated database

I ran all eight earlier migrations into an empty throwaway file and read the
result, instead of trusting the migration files.

```
columns        id          text  PRIMARY KEY NOT NULL
               content     text  NOT NULL
               created_at  text  NOT NULL
               user_id     text  NOT NULL
               day_id      text                 <- nullable
foreign keys   FK_entries_user:  user_id -> users(id), NO ACTION / NO ACTION
indexes        IDX_entries_day_id on (day_id)
               sqlite_autoindex_entries_1       <- made by SQLite for the primary key
```

The copy of the owner's database has the same schema.

### The migration, in order

1. Count entries where `day_id IS NULL`. If there are any, throw. Nothing
   has been written yet.
2. Count entries whose `day_id` matches no row in `days`. If there are any,
   throw. The next section explains why this second check is needed.
3. `CREATE TABLE "entries_with_day"` with all five columns, `day_id` now
   `NOT NULL`, and both foreign keys.
4. Copy every row across, naming all five columns.
5. `DROP TABLE "entries"`. This also removes `IDX_entries_day_id`, because an
   index belongs to its table.
6. Rename `entries_with_day` to `entries`.
7. `CREATE INDEX "IDX_entries_day_id"` again. It has to be last. Index names
   are shared across the whole database in SQLite, so the name is not free
   until step 5 has run.

`down()` does the same rebuild in the other direction: `day_id` nullable, no
foreign key to `days`, the index created again.

### Foreign keys during a migration

The prompt asked me to find out whether foreign keys are enforced on this
connection. The answer has two halves, and the second half surprised me.

**In normal use, yes.** TypeORM's `better-sqlite3` driver runs
`PRAGMA foreign_keys = ON` when it opens the connection. ADR-010 amendment 8
recorded this.

**While migrations run, no.** TypeORM switches them off before it starts the
migration transaction and switches them on again afterwards. This is in
`BetterSqlite3QueryRunner.beforeMigration` and `afterMigration`. I measured
it with a throwaway migration that reads the setting:

```
before the run        foreign_keys = 1
inside the migration  foreign_keys = 0     (and inside a transaction)
after the run         foreign_keys = 1
```

Three consequences:

- **`DROP TABLE "entries"` cannot fail on a foreign key.** With foreign keys
  on, SQLite deletes every row of a table before dropping it, and that would
  fail if another table had rows pointing at `entries`. With them off, no
  check happens. No table points at `entries` in any case: it only points
  outwards, at `users` and now at `days`.
- **The rename is safe in the order I used.** SQLite 3.53 rewrites
  references in *other* tables when a table is renamed. The dangerous order
  is to rename `entries` away first and build a new `entries` second: other
  tables' foreign keys would follow the old table to its new name.
  `migration:generate` uses that dangerous order in its `down()`. I build the
  new table under a temporary name, drop the old one, and rename the new one
  into place. Nothing points at `entries`, so today both orders would work.
  The safe order stays safe the day something does point at it.
- **The copy is not checked.** This is the one that matters. Step 4 would
  copy an entry whose `day_id` points at a deleted day into a table that
  declares a foreign key to `days`, and SQLite would accept it, because it is
  not checking. The row would then sit in the table, breaking a rule that was
  never tested against it. That is why step 2 exists. My mutation 4 removes
  step 2 and the migration then runs happily over such a row.

**One more finding, about how the key is written.** TypeORM learns a foreign
key's name by searching the stored `CREATE TABLE` text with a pattern. The
pattern allows one space between `FOREIGN KEY (...)` and `REFERENCES`. It
does not allow a line break. `RequireEntryOwner` wrote those on two lines. So
since Day 10 the key `FK_entries_user` has worked, and TypeORM has not been
able to see what it is called. I wrote both keys on one line, and the header
comment of the migration says why. `AddSessions` and `AddDays` have the same
two-line form for `FK_sessions_user` and `FK_days_user`. I did not touch
those tables.

### What `migration:generate` says

**Before this task**, against a fully migrated database, it produced 482
lines and proposed rebuilding `sessions`, `days` and `entries`. So the
prompt's test, "a non-empty result means the entity and the schema still
disagree", was already failing before I started, for reasons older than this
task.

What it got wrong, or would have destroyed if shipped:

- It dropped `UQ_users_email` and did not create it again. That index is on
  `lower("email")`. It is what makes two addresses that differ only in
  capital letters the same account. Its `down()` tries to put it back as
  `CREATE UNIQUE INDEX "UQ_users_email" ON "users" ("null")`, which is not
  valid.
- It recreated `IDX_days_user_date` without `DESC`.
- It renamed every foreign key to a generated name such as
  `FK_73b250bca5e5a24e1343da56168`.
- It rebuilt `entries` four times.
- It made `day_id` `NOT NULL` with no check at all. On a database with a
  day-less entry it would fail in the middle with SQLite's own message,
  which says nothing about what to do.
- Its `down()` renames the live table away first, the dangerous order above.

**After this task**, it produces 330 lines, and the word `entries` does not
appear in them. To get there I named three things on the entity so that they
match the table: `FK_entries_user`, `FK_entries_day` and
`IDX_entries_day_id`.

What remains:

| Table | What it proposes | Why |
|---|---|---|
| `sessions` | Rename the foreign key | The two-line form above, and no name on the entity. |
| `days` | Rename the foreign key, recreate two indexes | The same, and the entity declares no indexes. |
| `users` | Drop `UQ_users_email` | TypeORM cannot describe an index on an expression. |

The first two rows can be closed by naming things on `Day` and `Session` and
rebuilding those two tables once. The third cannot be closed while the index
is on `lower("email")`. **So "nothing to generate" is not reachable in this
project as it stands.** I recommend the Master Thread changes the check to
"the output does not mention the table this task changed", or decides the
`users` index should be expressed another way. I did not do either, because
both are outside one migration on `entries`.

---

## Decisions made

**1. I added a foreign key from `day_id` to `days`.** Three reasons:

- The entity has said `@ManyToOne(() => Day)` since Day 13, so TypeORM
  already believed the key existed. The prompt requires the entity and the
  schema to agree.
- The prompt's third mutation is "leave the foreign key to `days` out of the
  rebuilt table". That mutation only means something if the rebuilt table has
  one.
- `NOT NULL` alone says "this column holds some text". It does not say "this
  entry has a day". An entry pointing at a day that was deleted is found by
  no `?date=`, exactly like an entry with no day. That is the problem the
  owner pulled this task forward to close. Without the key it is half closed.

The cost is real and is in *Findings*, item 3. `down()` removes the key
again, so the decision can be reversed.

**2. The migration has two refusals, not one.** The second is explained
under *Foreign keys during a migration*.

**3. The entity's TypeScript type did not change.** It is still
`dayId?: string`. The prompt asks that the type "say what is true". Before
this task the true type was `string | null | undefined`, and the entity
claimed less than that. After it, a `day_id` is never `null`, so
`string | undefined` is now exactly right. The `undefined` has to stay: the
column is `select: false`, so an entry loaded in the normal way does not
carry it. `userId` on the same entity is written the same way for the same
reason.

**4. The new tests use a file in a temporary folder, not `:memory:`.** They
need the database as it was *before* the migration, with rows in it, and
then the migration run on top. That is two connections with two migration
lists, and an in-memory database is gone when its connection closes.

**5. The new tests read the "before" lists from the database.** The columns,
keys and indexes that must survive are read before the migration runs, not
typed into the test. A column added by a later migration is then covered
without anyone remembering to add it.

---

## Assumptions

- "Every foreign key that `entries` had before exists afterwards" is about
  `up()`. `down()` is held to a different standard: the schema as it was,
  which has no key to `days`.
- `ON DELETE NO ACTION` is right for the new key. It matches the key to
  `users`, and it means a day cannot be deleted while an entry points at it.
  The application already deletes the entry first and the empty day second.

---

## Limitations

- **A day and its entry can still belong to different users.** The schema
  says an entry has an owner and has a day. It does not say the day belongs
  to that owner. The application always uses the caller's own day, so this
  cannot happen through the API. It can be written by hand in SQL.
- **The rebuild rewrites the whole table.** ADR-010 amendment 7 already says
  so. With one entry it is instant.
- **I did not check the migration against PostgreSQL.** Day 24 moves there.
  On PostgreSQL this migration would be one `ALTER TABLE` and no rebuild.
  The SQL in it is SQLite's.

---

## Dependencies added

None.

---

## Testing performed

### Claims, and where each is tested

All in `require-entry-day.spec.ts` unless another file is named.

| Claim | Test |
|---|---|
| The database itself refuses an entry with no day | `has the database itself refuse an entry with no day`. Raw SQL, two forms: `day_id` given as `NULL`, and `day_id` left out. Also `marks day_id as required`. |
| The same, for an existing entry | `has the database refuse to take the day off an entry that has one`, and the changed test in `entries-by-date.e2e-spec.ts`. |
| The migration refuses when an entry has no day | `refuses to run when an entry has no day, and says how many` |
| It leaves the database unchanged when it refuses | `leaves the database exactly as it was when it refuses`. Compares the stored schema text, every row, and the list of applied migrations. |
| It preserves entries exactly | `preserves every entry exactly: id, content, created_at, owner and day` |
| Every index survives | `keeps every index that entries had` |
| Every foreign key survives | `keeps every foreign key that entries had, and adds the one to days` |
| `down()` restores the schema and keeps the data | `returns entries to the schema it had, with its rows`, `lets an entry have no day again`, `can be followed by up() again without losing anything` |
| The key to `days` is enforced, not only declared | `has the database refuse an entry whose day does not exist`, `has the database refuse to delete a day that an entry still points at` |
| The migration refuses a `day_id` that points at nothing | `refuses to run when an entry points at a day that does not exist` |

### Mutation table

For each row I made the change, ran the unit and end-to-end suites, recorded
the failures, and restored the file. Unit counts are out of 194, end-to-end
out of 232.

| # | Mutation | Unit failed | E2E failed | Where |
|---|---|---|---|---|
| 1 | Remove the refusal for a day-less entry | **2** | 0 | Both tests in `refusing` that have a day-less entry. |
| 2 | Leave `IDX_entries_day_id` out of the rebuilt table | **1** | 0 | `keeps every index that entries had` |
| 3 | Leave the foreign key to `days` out | **4** | 0 | The foreign key test, the two enforcement tests, and `DaysRepository › deleteIfEmpty › ignores another user's entry …` |
| 4 (mine) | Remove the refusal for a `day_id` that points at nothing | **1** | 0 | `refuses to run when an entry points at a day that does not exist` |
| 5 (mine) | `day_id` without `NOT NULL` in the new table | **6** | **1** | Six in the new spec. `entries-by-date` › `cannot have its day taken away …` |
| 6 (mine) | `down()` leaves the index out | **1** | 0 | `returns entries to the schema it had, with its rows` |
| 7 (mine) | The copy loses one row | **5** | 0 | `preserves every entry exactly …` and four that depend on the rows. |
| 8 (mine) | Leave the foreign key to `users` out | **3** | 0 | The foreign key test, and two in `entry-ownership.spec.ts`. |

Two things in this table are worth reading closely.

**Mutation 2 is caught by one test only.** Every other test passes with the
index missing, including all 232 end-to-end tests. Nothing about the
application's behaviour changes when an index disappears. The query still
answers; it reads the whole table to do so. This is the loss the prompt
warned about, and only a test that looks at the schema can see it.

**The end-to-end suite is almost blind to this task.** Seven of the eight
mutations leave it fully passing. That is expected: the application never
tries to write an entry without a day, so it never meets the rule. A
constraint is tested by trying to break it, and the application does not
try.

### Findings: existing tests that changed

The prompt says no existing test should change, and that one which must is a
finding. Fifteen failed when the migration was registered. Here is each
group, and what I did.

**1. `seedEntries` in `test/test-database.ts` — 9 tests in
`entries.service.spec.ts`.** The helper inserted entries with an owner and no
day. No test file changed for these nine. I changed the helper: it now gives
each seeded entry the day the application would have filed it under. It asks
`dayFor` for that date and does not work it out itself, so the 4am rule is
still written in one place.

**2. `entry-ownership.spec.ts` — 4 failed, 5 changed.** Three tests inserted
an entry with an owner and no day, and now give it a day. A fourth expected
`entries` to have exactly one foreign key, and now expects the one to
`users` to be among them.

The fifth is the interesting one. **`should refuse an entry with no owner`
did not fail, and I changed it anyway.** It inserts an entry with no owner
and no day, and expects `/NOT NULL constraint failed/`. After this task an
entry with no day produces that same message. So the test would have gone on
passing even if `user_id` were made nullable again. It had stopped being able
to fail for the reason it exists. It now expects
`NOT NULL constraint failed: entries.user_id`.

**3. `days.repository.spec.ts` — 1 test. This one needs a decision.** The
test `ignores another user's entry when deciding the day is empty` puts Bob's
entry on Alice's day, asks to delete Alice's day if it is empty, and expected
`true`. It was guarding the rule that the emptiness count is scoped by user.

Look at what `true` meant: the day was deleted and Bob's entry was left
pointing at a row that no longer existed. The old test approved of creating
exactly the broken row this task exists to prevent.

With the foreign key, the count still ignores Bob's entry, the delete is
still attempted, and the database refuses it. `deleteIfEmpty` now throws
`FOREIGN KEY constraint failed`. I changed the test to expect that, and
renamed it to say so. It still tells a scoped count from an unscoped one,
because an unscoped count would answer `false` and never reach the delete.

I did not change `deleteIfEmpty`. The situation cannot be reached through
the API, because an entry is always filed under the caller's own day. If it
ever were reached, the caller would get a 500. I think that is better than
silently orphaning an entry, and worse than a clean `false`. The Master
Thread should say which it wants.

**4. `entries-by-date.e2e-spec.ts` — the test the prompt named.**
`does not return an entry that has no day under any date` set an entry's
`day_id` to `NULL` and showed that no date found it. That `UPDATE` is now
refused.

I did not delete the test. I turned it round. It is now
`cannot have its day taken away, so it stays under its date`: the same
`UPDATE` is attempted, the database refuses it with
`NOT NULL constraint failed: entries.day_id`, and the entry is still listed
and counted under its date.

Why keep it: the old test described a hole, and the honest replacement is a
test that the hole is closed, in the same place a reader would look for it.
It is also the only end-to-end test that fails under mutation 5.

### On a copy of the owner's database

Copied `apps/api/data/neuron.db` to a temporary folder and ran
`migration:run` with `DATABASE_PATH` pointing at the copy.

```
                 before                         after
users            1                              1
entries          1                              1
days             1                              1
sessions         2                              2
day_id NOT NULL  no                             yes
foreign keys     user_id -> users               user_id -> users, day_id -> days
indexes          IDX_entries_day_id + pk        IDX_entries_day_id + pk
last migration   UserNameBecomesEmail           RequireEntryDay
```

The one entry has the same id, content length, `created_at`, owner and day
on both sides. `PRAGMA foreign_key_check` reports nothing.

```
insert with no day        refused: NOT NULL constraint failed: entries.day_id
insert with unknown day   refused: FOREIGN KEY constraint failed
entries afterwards        1
```

The real file's SHA-256 was the same before and after. The copy has been
deleted.

---

## The three questions

### 1. What exactly would have been lost if the table had been rebuilt from the column list alone?

Two things for certain, and neither would have produced an error.

- **`IDX_entries_day_id`.** An index is not part of `CREATE TABLE`. It is
  removed when its table is dropped. `GET /entries?date=` would still give
  the right answer and would read every entry in the table to find it.
  Mutation 2 shows how quiet this is: one test out of 426 notices.
- **`FK_entries_user`.** A foreign key is a constraint, not a column. A
  rebuild from column names keeps `user_id text NOT NULL` and drops the rule
  that the user has to exist. That is Day 10's work undone. It would also be
  undone silently, for the reason in *Foreign keys during a migration*:
  nothing is checked while the migration runs, so nothing complains.

If "the column list" means only the names, more goes: `PRIMARY KEY` on `id`,
and with it the rule that two entries cannot share an id, and `NOT NULL` on
`content`, `created_at` and `user_id`.

The general point is that in SQLite a table's definition is one piece of
text. Changing one word of it means writing all of it again, and whatever is
not written again is gone.

### 2. Is refusing the right behaviour, or should the migration have repaired day-less entries itself?

**Refusing is right. I agree with the prompt, and I would go a little
further than its reason.**

The prompt's reason is that computing a day would write the 4am rule a third
time. That is true. `AddDays` already wrote it a second time, in SQL, as
`date("created_at", '-4 hours')`, and it had to. A third copy would be frozen
in a migration, which nobody edits afterwards. The day a user gets a
timezone, the application's rule changes and the migration's copy does not.

My further reason: **the existence of a day-less entry is information.** No
path through the application creates one. If one exists, something wrote to
the database from outside the application, or there is a bug nobody knows
about. A migration that quietly gives it a day destroys the only evidence.
Refusing puts it in front of a person.

Deleting such entries is worse than either. Somebody wrote them.

Where I disagree slightly: the refusal tells the owner to "point each of them
at a row in days", and gives her no tool to do it. With one user and one
entry that is acceptable. If this ever refused on a database with many
day-less entries, the right answer would be a separate, deliberate repair
script that calls `dayFor`, run by a person who has looked at the rows. It
should still not be this migration.

### 3. What must the owner do to her own database, in which order, and what should she back up first?

Her database has 1 user, 1 entry, 1 day and 2 sessions. No entry is without
a day, and none points at a missing day. So the migration will run and will
not refuse.

1. **Stop the API** if it is running, so nothing writes while the file is
   copied.
2. **Back up one file:** `apps/api/data/neuron.db`. Copy it to somewhere
   outside the repository, with the date in its name. That file is the whole
   journal. If files named `neuron.db-wal` or `neuron.db-shm` are sitting
   beside it, copy those too. There are none today.
3. **From `apps/api`, run `pnpm migration:run`.** Expect two lines among the
   output: `1 migrations are new migrations must be executed` and
   `Migration RequireEntryDay1791314102576 has been executed successfully`.
4. **Start the API and open the Today screen.** The entry should be there.

The API does not run migrations by itself when it starts, so step 3 is
needed. The order between "pull the new code" and "run the migration" is not
dangerous. The new code runs correctly on the old schema; it only lacks the
guarantee.

If step 3 prints `Cannot require a day: …` instead, nothing was changed. The
message says how many entries are the problem.

To undo afterwards, either run `pnpm migration:revert` from `apps/api`, or
stop the API and put the backup file back. The second is simpler and is
certain.
