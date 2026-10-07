# Day 17b — Worker report, API: a name and a timezone on the account, and a day that ends at midnight

**Date:** 2026-10-07. Prompt: `docs/workers/day-17b-api-name-and-timezone.md`.
Changes two points of `docs/decisions/ADR-015-the-day-is-the-aggregate.md`,
by the owner's decision.

---

## Objective

Four things, all in the API and the contracts package.

1. The contract says a registration carries a `name` and a `timezone`, and
   a user that is sent back carries a `name`.
2. A migration gives `users` two new required columns, `name` and
   `timezone`.
3. Registration checks both values, stores the trimmed name and the resolved
   timezone, and never sends the timezone back.
4. A day ends at midnight in the user's own timezone. The 4am rule is gone.

`apps/web` was not touched. Git was not changed. No dependency was added. No
existing migration was edited. No migration was run against
`apps/api/data/neuron.db`. The checksum of that file is the same after this
task as before it (`71c277fc…6c8f41de`).

---

## Summary

All four parts are done, tested, and verified on a copy of the owner's
database.

```
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
lint        clean
typecheck   clean
build       clean
contracts   7 passed                (was 6)
unit        242 passed, 16 suites   (was 211, 15 suites)
e2e         318 passed, 23 suites   (was 279, 21 suites)

pnpm lint:web && pnpm typecheck:web && pnpm build:web && pnpm test:web
all four    clean, 55 web tests passed
```

Six things need the Master Thread or the owner. The first three matter most.

1. **The second line passes completely, and the prompt expected it to
   fail.** `pnpm typecheck:web` does not fail in `lib/session.ts`. The web
   app builds its registration body as a plain object, `{ email, password }`,
   and never says it is a `WireRegistration`. So the compiler has nothing to
   compare. **Registration from the web app is broken right now and no check
   says so**: the API answers 400 because the name and the timezone are
   missing. This is the silent failure ADR-019 was written to prevent, and
   the web worker should type that body, not only add two fields to it. See
   question 5.
2. **The owner's own account will be in `UTC` after the migration, and no
   route can change it.** That is what the owner decided for existing
   accounts, and it is correct for the days already written. But she is in
   Karachi, so her day will end at 05:00 on her clock, not at midnight,
   until the stored value is changed. Her name will be `boo`, the part of
   her address before the `@`. See *Limitations*.
3. **TypeORM does not switch foreign keys off when it reverts a migration.**
   It does when it runs one forwards. The Day 16 report measured only the
   forward direction. This changed how `down()` had to be written. See
   *Foreign keys, forwards and backwards*.
4. **Twenty-one existing tests changed for a reason the prompt did not list.**
   Most are one cause: `EntriesService.create` now takes the author and not
   only the author's id. See *Findings*.
5. **The migration refuses to run if an account's email has nothing before
   the `@`.** The prompt left this choice to me. See *Decisions made*.
6. **A failed migration run leaves foreign keys switched off on that
   connection.** It does not matter for the command line, where the process
   ends. It is a TypeORM behaviour worth knowing. See the same section as
   item 3.

---

## Files changed

**New**

| File | What it is |
|---|---|
| `apps/api/src/database/migrations/1791383154639-AddUserNameAndTimezone.ts` | The migration. Written by hand, with `down()`. |
| `apps/api/src/database/add-user-name-and-timezone.spec.ts` | 25 tests for it. |
| `apps/api/src/validation/is-iana-time-zone.decorator.ts` | `resolveTimeZone`, and the `IsIanaTimeZone` check built on it. |
| `apps/api/test/registration-profile.e2e-spec.ts` | 28 tests: the name, the timezone, and what is sent back. |
| `apps/api/test/timezone-days.e2e-spec.ts` | 11 tests: a day in the user's timezone, over HTTP. |
| `docs/learning/day-17b/report-api.md` | This report. |

**Moved**

| From | To |
|---|---|
| `apps/api/src/entries/contains-non-whitespace.decorator.ts` | `apps/api/src/validation/contains-non-whitespace.decorator.ts` |

The file is unchanged. It is now used by the entries module and by
registration, so it no longer belongs to one of them. I moved it with `mv`
and not `git mv`, so git shows a deletion and a new file.

**Changed, source**

| File | Change |
|---|---|
| `packages/contracts/src/index.ts` | `NAME_MAX_LENGTH = 60`. `WireRegistration` gains `name` and `timezone`. `WireUser` gains `name`. |
| `packages/contracts/test/contract.test.mjs` | One more test: the 60 is not written as a number in either application. |
| `apps/api/src/users/user.entity.ts` | `name` and `timezone` columns. `timezone` is marked `@Exclude()`. |
| `apps/api/src/users/users.service.ts` | `register` takes one `WireRegistration` object. |
| `apps/api/src/auth/register.dto.ts` | The two new fields, with their rules. |
| `apps/api/src/auth/auth.controller.ts` | Passes the whole DTO to `register`. |
| `apps/api/src/days/day-boundary.ts` | `dayFor(instant, timeZone)`. `DAY_BOUNDARY_HOURS` is removed. Adds the `DayOwner` type. |
| `apps/api/src/days/days.service.ts` | `resolveFor` and `findToday` take a `DayOwner`. |
| `apps/api/src/days/days.controller.ts` | Passes `request.user` to `findToday`. |
| `apps/api/src/entries/entries.service.ts` | `create` takes the author as a `DayOwner`. |
| `apps/api/src/entries/entries.controller.ts` | Passes `request.user` to `create`. |
| `apps/api/src/entries/entries.repository.ts` | One comment: it no longer says 4am. |
| `apps/api/src/entries/create-entry.dto.ts`, `update-entry.dto.ts` | The import path of the moved decorator. |
| `apps/api/src/database/migrations/index.ts` | Registers the migration, last in the list. |

**Changed, tests.** Fifteen files in `apps/api`. Each is listed under
*Findings*.

---

## How it works

### Part 1 — the contract

Three additions, exactly as the prompt lists them. `WireUser` has `name` and
does not have `timezone`.

I added one test to the contract's own test file. It fails if the number 60
appears on a line of either application that is about a name or a
`MaxLength`. The same kind of test already guards the password minimum and
the page sizes.

### Part 2 — the migration

**What `users` had before**, read from a migrated database and not from the
migration files:

```
columns   id             text  PRIMARY KEY NOT NULL
          email          text  NOT NULL
          created_at     text  NOT NULL
          password_hash  text                      <- nullable, and stays so
indexes   UQ_users_email on (lower("email")), unique
          sqlite_autoindex_users_1                 <- made by SQLite for the primary key
pointed at by   sessions.user_id, days.user_id, entries.user_id
```

**`up()`, in order:**

1. Work out, for every account, the name it would be given. If any name
   would be empty, throw. Nothing has been written yet.
2. `CREATE TABLE "users_with_name"` with the four old columns and the two
   new ones. Both new columns are `text NOT NULL`. Neither has a default.
3. Copy every row across. The name is worked out from the email. The
   timezone is the text `UTC`.
4. `DROP TABLE "users"`. This also removes `UQ_users_email`, because an
   index belongs to its table.
5. Rename `users_with_name` to `users`.
6. Create `UQ_users_email` again, on `lower("email")`.
7. Ask SQLite to check every foreign key in the database
   (`PRAGMA foreign_key_check`). If it reports anything, throw, and the
   whole migration is rolled back.

**Why the three foreign keys survive.** `sessions`, `days` and `entries`
each say `REFERENCES "users"`. That is a name written in their own stored
definition. It is not a link to one particular table. So when the old
`users` is dropped and a new table is given the name `users`, the three
keys find a table of that name again, and nothing in the three tables is
rewritten. A test compares the stored definition of every other table and
index before and after, and they are identical.

The order matters. If the old table were renamed away first, SQLite would
rewrite the three keys to follow it to its new name. Building the new table
under another name, dropping the old one, and renaming the new one into
place avoids that. Day 16 explained the same point for `entries`. There it
was a precaution, because nothing points at `entries`. Here three tables
point at `users`, so it is necessary.

**The name given to an existing account** is the part of the email before
the `@`, with white space removed from both ends, cut to 60 characters.

| Email | Name written |
|---|---|
| `alice@example.com` | `alice` |
| `Bob.Builder@Example.com` | `Bob.Builder` |
| `umer` (no `@` at all) | `umer` |
| 70 letters, then `@example.com` | the first 60 letters |
| ` padded @example.com` | `padded` |
| `@example.com`, or an empty email | none: the migration refuses |

The row with no `@` is possible. `UserNameBecomesEmail` renamed the old
`name` column to `email` and did not check what was in it. For such a row
the whole value is "the part before the `@`", so that is what I use.

**`down()`** is two statements: `ALTER TABLE "users" DROP COLUMN` for each
of the two columns. It does not rebuild the table. The next section says
why it cannot.

### Foreign keys, forwards and backwards

The Day 16 report found that TypeORM switches foreign keys off while
migrations run. That is true for `up()`. I found that it is **not** true for
`down()`, and the reason is the order of two lines inside TypeORM.

| | What TypeORM does | Result |
|---|---|---|
| Running forwards | Switches foreign keys off, **then** opens the transaction | Off during `up()` |
| Reverting | Opens the transaction, **then** switches foreign keys off | Still on during `down()` |

SQLite ignores `PRAGMA foreign_keys` when it is sent inside a transaction.
So the second order does nothing.

I met this as a failing test. My first `down()` rebuilt the table the same
way `up()` does, and `DROP TABLE "users"` was refused with
`FOREIGN KEY constraint failed`. With foreign keys on, dropping a table
first deletes its rows, and a user cannot be deleted while a session, a day
or an entry points at them.

Three consequences:

- **`down()` drops the two columns in place.** SQLite can remove a column
  without a rebuild when the column is in no index and no key. These two are
  in neither. This is simpler than a rebuild as well as being the only way
  that works.
- **`RequireEntryDay` from Day 16 is not affected.** Its `down()` drops and
  rebuilds `entries`, and nothing points at `entries`.
- **Any future `down()` that drops a table other tables point at will fail
  the same way.** This is worth one line in ADR-010.

One more finding of the same kind. When a migration throws, TypeORM rolls
the transaction back and does **not** switch foreign keys on again. The
connection that ran it is left with them off. For `pnpm migration:run` this
does not matter, because the process ends. It would matter for code that
runs migrations and then keeps using the same connection.

### Part 3 — registration

**The name.** `RegisterDto` has four things on `name`, in this order of
effect:

1. `@Transform`: if the value is text, trim it at both ends. Anything else
   is passed on untouched.
2. `@IsString()`.
3. `@ContainsNonWhitespace()`, the decorator moved from the entries module.
   It fits without any change.
4. `@MaxLength(NAME_MAX_LENGTH)`.

**Where the trimming happens, and why there.** In the DTO. The global pipe
is created with `transform: true`, which means it first turns the JSON body
into a `RegisterDto` and only then validates it. `@Transform` runs during
the first step. So the rules measure the trimmed name, which is the value
that will be stored. Sixty letters with a space on each side is accepted,
because after trimming it is sixty letters. If the trimming were in the
service, the length rule would measure the untrimmed text and refuse it.

The pipe has no implicit conversion. That means it does not turn a value
into the type the class declares: the number `42` stays a number. So the
transform must not assume it was given text. It passes a non-string on
unchanged, and `@IsString()` refuses it.

**The timezone.** `resolveTimeZone(value)` answers the name to store, or
`undefined`:

1. Not text: `undefined`.
2. Ask `Intl.DateTimeFormat` to use it as a timezone. If `Intl` throws:
   `undefined`.
3. Read back the name `Intl` resolved it to. If that name begins with `+`
   or `-`, it is an offset: `undefined`.
4. Otherwise the resolved name.

The DTO uses it twice: a `@Transform` that replaces a valid value with its
resolved form, and `@IsIanaTimeZone()` that refuses whatever is not valid.
So what reaches the service is already the value to store.

**What `class-validator`'s own `IsTimeZone` does**, measured on this
machine with Node 24.18:

| Sent | `Intl` resolves it to | `IsTimeZone` | This API |
|---|---|---|---|
| `Asia/Karachi` | `Asia/Karachi` | accepts | 201, stores `Asia/Karachi` |
| `asia/karachi` | `Asia/Karachi` | accepts | 201, stores `Asia/Karachi` |
| `EST` | `America/Panama` | accepts | 201, stores `America/Panama` |
| `+05:00` | `+05:00` | **accepts** | 400 |
| `Mars/Olympus` | throws | refuses | 400 |
| empty text | throws | refuses | 400 |
| not sent | — | refuses | 400 |

Its source is six lines. It asks `Intl` whether the value is accepted and
stops there. It therefore lets an offset through, and it has no way to tell
me the resolved name. I did not use it.

Three more values I tried, because they sit near the rule:

| Sent | Result | Note |
|---|---|---|
| `-0500` | 400 | `Intl` resolves it to `-05:00`. Testing the resolved name catches every spelling of an offset. |
| `UTC` | 201 | It must be accepted: the migration writes it. |
| `Etc/GMT+5` | 201 | A real IANA name that is a fixed offset in everything but spelling. The rule as the owner wrote it lets it through. No browser reports it for a real place. |

**No response carries `timezone`.** The one thing that keeps it out is
`@Exclude()` on the entity's `timezone` property. The application already
runs `ClassSerializerInterceptor` on every response, and `passwordHash` is
kept out the same way.

The messages the API now sends for these fields, for the web worker:

```
name must contain at least one character that is not whitespace
name must be shorter than or equal to 60 characters
name must be a string
timezone must be an IANA time zone name such as Asia/Karachi
```

### Part 4 — the day

`dayFor(instant, timeZone)` asks `Intl.DateTimeFormat` for the year, month
and day of that instant in that zone, and joins them as `YYYY-MM-DD`. There
is no arithmetic on hours. The distance between a zone and UTC is not one
number: it changes on the days the clocks change, and `Intl` knows those
days.

**How the timezone reaches the service.** A small type:

```ts
export type DayOwner = Pick<User, 'id' | 'timezone'>;
```

`resolveFor(owner, instant)`, `findToday(owner)` and
`EntriesService.create(content, author)` take one of these. The controllers
pass `request.user`, which the guard has already loaded. There is no extra
query.

Why an object and not a third text argument: `create(content, userId,
timezone)` would be three pieces of text in a row, and the compiler cannot
tell two of them apart if they are swapped. More importantly, an id and a
timezone that arrive separately can come from two different users. Carried
together, they cannot.

The methods that do not work out a date, such as `findByDate` and
`setMood`, still take only the user's id.

**`AddDays` and its SQL.** The migration is untouched. I searched for a
test that compares `date("created_at", '-4 hours')` with `dayFor`. There is
none, so there was nothing to change for that point.

**Comments.** The ones in `day-boundary.ts`, `days.service.ts`,
`entries.repository.ts` and `test/test-database.ts` said 4am or UTC and now
say what is true. Comments inside the old migrations still say 4am. They
are history and I left them.

---

## Decisions made

**1. The migration refuses an account whose name would be empty.** The
other choice was to invent a name, such as `User`. I refused for the reason
Day 16 gave: no path through the application creates an email with nothing
before the `@`, so such a row is evidence that something wrote to the
database from outside. A migration that quietly names it destroys the
evidence. The refusal says how many rows there are and changes nothing. The
owner's database has one account and it is not affected.

**2. An email with no `@` gives the whole value as the name.** Explained
under *Part 2*.

**3. `@Exclude()` keeps the timezone out, and not a field-by-field copy.**
The project has both patterns. `passwordHash` on this same entity uses
`@Exclude()`. `DaysController` builds its answer field by field. I followed
the entity's own precedent, so that one user has one mechanism. The cost:
it depends on the interceptor, and on the value being a real `User` object
and not a plain copy of one. The test in *Part 3* is what holds this in
place, and mutation 5 shows it does.

**4. `register` takes one object.** Four pieces of text in a row
(`email, password, name, timezone`) can be swapped without a compile error.

**5. `down()` compares by structure, not by stored text.** After `down()`,
the columns, their types, the nullability, the index and the three foreign
keys are what they were, and the tests check each. The stored `CREATE
TABLE` text of `users` is not the same characters as before, because the
table was rebuilt on the way up. The old text was itself an accident of two
earlier `ALTER TABLE` statements.

**6. The last step of `up()` checks foreign keys.** Nothing is checked
while `up()` runs. The copy keeps every id, so nothing should break. The
check costs one statement and turns "should not" into "did not".

**7. No cache of `Intl.DateTimeFormat` objects.** `dayFor` builds one per
call. That is a few microseconds on a request that already does a password
or a database read. Not worth a second thing to keep correct.

---

## Assumptions

- A name's 60 characters are counted the way `class-validator` counts them.
  For ordinary text that is one per letter.
- White space, for trimming, is what JavaScript's `trim()` removes.
- "Nothing already written moves" covers `sessions` as well as `days` and
  `entries`.

---

## Limitations

- **The owner's account stays in `UTC` until something changes it.** There
  is no route that sets a timezone after registration. Her day will end at
  05:00 Karachi time. To fix it today takes one statement on her database:
  `UPDATE users SET timezone = 'Asia/Karachi', name = '…' WHERE …`. That is
  safe for her existing entries, and a test shows it: changing the stored
  timezone moves nothing already written. The proper fix is a settings
  route, which is not in this prompt.
- **A person who travels keeps the timezone they registered with.** Same
  cause.
- **The stored name depends on the version of Node.** `Intl` decides the
  resolved form. Another version may answer `Asia/Kolkata` where this one
  answers `Asia/Calcutta`. Both names mean the same clock, so no date
  changes. But the same place could be stored under two names over time.
- **The web app cannot register anyone until the web worker runs.** See
  question 5.
- **I did not check the migration against PostgreSQL.** There it would be
  two `ALTER TABLE` statements and no rebuild.

---

## Dependencies added

None.

---

## Testing performed

### Claims, and where each is tested

| Claim | Where |
|---|---|
| One instant, two users, two dates, for `GET /days/today` | `timezone-days` › `answers GET /days/today with a different date for each` |
| The same, for a new entry's day | `timezone-days` › `files an entry written at that instant under a different date for each` |
| Midnight exactly, one second before, one second after, not in UTC | `timezone-days` › `midnight in a zone that is not UTC` (three rows, Karachi), and the same three in `day-boundary.spec.ts` |
| Daylight saving in London, July and January | `timezone-days` › `daylight saving`, and `day-boundary.spec.ts` › `where the clocks change` |
| An entry written before the migration keeps its day | `add-user-name-and-timezone.spec.ts` › `leaves an entry written under the 4am rule on the date it was given`, and `moves nothing already written` |
| An entry keeps its day when the user's timezone changes | `timezone-days` › `when the timezone of a user changes` (two tests) |
| Each of the six values, and a missing timezone | `registration-profile` › `the timezone` |
| The stored timezone is the resolved form | The same three accepting rows: each reads the column |
| The name: trimmed, white space only, 60, 61, missing | `registration-profile` › `the name` |
| No response carries `timezone`; `name` is on register, login, refresh and `/auth/me` | `registration-profile` › `what is sent back` (five tests; the fifth calls ten other routes) |
| The 409 and its message are unchanged | `registration-profile` › `still answers 409 …` |
| The migration: counts, names, zones, keys, index, `down()` | `add-user-name-and-timezone.spec.ts`, 25 tests |

The migration's test database is built by the ten earlier migrations and
holds five accounts, two sessions, two days and four entries, one of them
deleted.

### Mutation table

For each row I made the change, ran the unit and end-to-end suites,
recorded the failures, and restored the file. Unit counts are out of 242,
end-to-end out of 318.

| # | Mutation | Unit failed | E2E failed | Where |
|---|---|---|---|---|
| 1 | `findToday` uses `UTC` | 0 | **5** | `timezone-days`: two zones for today, two midnight rows, London in July, `agrees with itself` |
| 2 | `resolveFor` uses `UTC` | 0 | **8** | `timezone-days`: two zones for an entry, two midnight rows, the 04:00 test, London in July, both timezone-change tests, `agrees with itself` |
| 3 | Accept `+05:00` | 0 | **2** | `registration-profile`: `refuses an offset`, `refuses an offset without a colon` |
| 4 | Store the name untrimmed | 0 | **3** | `registration-profile`: `is trimmed at both ends`, `keeps the spaces inside it`, `counts the 60 after trimming` |
| 5 | Remove `@Exclude()` from `timezone` | 0 | **6** | `registration-profile`: register, login, refresh, `/auth/me`. `auth.e2e`: the two tests that list a user's fields |
| 6 | Default the timezone to `UTC` when it is not sent | 0 | **2** | `registration-profile`: `refuses a body with no timezone`, `refuses null` |
| 7 (mine) | Rebuild without `UQ_users_email` | **5** | **1** | Four in the migration spec, one in `entry-ownership`. `email-identity` › `enforces this in the database` |
| 8 (mine) | `timezone` column with `DEFAULT 'UTC'` | **2** | 0 | `adds name and timezone … neither with a default`, `has the database itself refuse a user …` |
| 9 (mine) | The migration does not refuse an empty name | **4** | 0 | All four tests under `refusing` |
| 10 (mine) | The rebuilt index is on `email`, not `lower("email")` | **4** | **1** | Four in the migration spec. `email-identity` › `enforces this in the database` |
| 11 (mine) | Existing accounts get `Asia/Karachi` | **1** | 0 | `gives each existing account UTC as its timezone` |
| 12 (mine) | `dayFor` adds a fixed hour for London | **2** | **1** | `day-boundary`: January, and the night the clocks change. `timezone-days`: January |

Three things worth reading closely.

**The unit suite is blind to mutations 1 to 6.** No unit test builds a
service with a user in a zone other than UTC. All six are caught only over
HTTP. That is the right place, because each is about what a request does.
It does mean the end-to-end suite must be run for this work to be trusted.

**Mutation 8 is caught by two tests and by nothing else.** A default in the
schema changes nothing the application does, because the application always
sends a timezone. All 318 end-to-end tests pass with it. Only a test that
reads the schema, or tries to insert a row without the value, can see it.

**Mutation 1 does not fail the January test, and that is correct.** In
January London is on UTC, so a `findToday` that uses UTC gives the right
answer by accident. The July test is the one that tells them apart.

### Findings: existing tests that changed

Fifteen test files in `apps/api` changed. They fall into four groups. The first three
are the reasons the prompt expected. The fourth is not.

**1. A registration was sent without a name and a timezone.**

| File | What changed |
|---|---|
| `test/test-database.ts` | `authenticate` sends a name and a timezone. It takes the timezone as an optional third argument, `UTC` if not given. Eight existing end-to-end files use it and did not change at all. |
| `test/auth.e2e-spec.ts` | Thirteen bodies sent to `/auth/register` gain `...profile`. |
| `test/sessions.e2e-spec.ts`, `refresh-cookie.e2e-spec.ts`, `stale-credentials.e2e-spec.ts` | One body each, in `beforeEach`. |
| `test/email-identity.e2e-spec.ts`, `built-output.e2e-spec.ts` | Each file's own `register` helper. |
| `src/users/users.service.spec.ts` | Seven calls to `register`, which now takes one object. |

One point about `auth.e2e-spec.ts`. Four of its tests expect a 400 for one
bad field: a short password, a blank email, an unknown field, a missing
password. Without the name and the timezone they would **still have
passed**, with a 400 caused by the missing fields and not by the thing each
test is about. They would have stopped being able to fail. Every body in
that file now carries a valid name and timezone.

**2. A user was written straight into the database without the two new
columns.** These now fail on `NOT NULL`, which is the migration working.

| File | What changed |
|---|---|
| `test/test-database.ts` | `seedUser` writes a name and `UTC`. |
| `src/days/days.repository.spec.ts` | The two users in `beforeEach`. |
| `src/entries/entry-ownership.spec.ts` | Six inserts. |
| `test/auth.e2e-spec.ts` | The `legacy-user` insert. |
| `test/email-identity.e2e-spec.ts` | The raw `INSERT` in `enforces this in the database …`. |

The last one was the same trap as above. The test expects the insert to be
refused with a message matching `/UNIQUE/`. I gave the insert a name and a
timezone so that it reaches the unique index, and narrowed the expected
message to `UNIQUE constraint failed`.

**3. The test pinned the 4am boundary.**

| File | What changed |
|---|---|
| `src/days/day-boundary.spec.ts` | Rewritten. 11 tests became 17: midnight in UTC, midnight in Karachi, two zones for one instant, London's clock changes, month, year and leap-day edges. |
| `test/today.e2e-spec.ts` | The table of six instants now pins midnight. Two other tests used an instant between 00:00 and 04:00 and relied on it belonging to the day before. |
| `test/entries-by-date.e2e-spec.ts` | `puts 03:59 on the previous date …` is now `puts 23:59 on the old date and 00:01 on the new one`. |
| `test/test-database.ts` | `seedEntries` passes the seeded zone to `dayFor`. |

The `entries-by-date` test lost something, and I want to say so plainly.
Its old comment claimed that a filter looking at `created_at` would fail
it. With a UTC user and a midnight boundary that is no longer true: the
date of `created_at` and the date of the day are now the same. The claim is
still worth testing, so it moved. `timezone-days` writes an entry for a Los
Angeles user whose `created_at` is on the 8th and whose day is the 7th, and
asks for it by date.

**4. Finding: tests that changed for a reason the prompt did not list.**

| File | Tests | Reason |
|---|---|---|
| `src/entries/entries.service.spec.ts` | 16 calls to `create` | `create` takes the author, not the author's id. |
| `src/entries/entries.controller.spec.ts` | 1 fake request | The same: `request.user` must have a `timezone`. |
| `src/entries/entry-ownership.spec.ts` | 1 call to `create` | The same. |
| `src/entries/entry-ownership.spec.ts` | `should have exactly id, email, created_at and password_hash` | The table has two more columns. The test lists them. |
| `test/auth.e2e-spec.ts` | Two tests that list the fields of a user sent back | `name` is now one of them. |

The first three rows cannot be avoided under the prompt's own rules. A date
needs the timezone, the timezone must come from the request's user, and no
extra query is allowed. So whatever calls `create` must hand over more than
an id. The last two rows are the schema and the contract changing, which
the task asked for.

No test changed for any reason outside these four groups.

### On a copy of the owner's database

I copied `apps/api/data/neuron.db` to a temporary folder and ran the
migration command with `DATABASE_PATH` pointing at the copy. I ran the
command without the `.env` file, so that nothing in that file could point
it anywhere else.

```
                 before                          after
users            1                               1
sessions         3                               3
days             2                               2
entries          4                               4
name             (no column)                     text NOT NULL, no default
timezone         (no column)                     text NOT NULL, no default
password_hash    nullable                        nullable
UQ_users_email   on lower("email")               on lower("email")
keys to users    sessions, days, entries         sessions, days, entries
foreign_key_check  nothing                       nothing
last migration   AddEntryDeletedAt               AddUserNameAndTimezone
```

The one account, with its email shortened to three characters:

```
email   name   timezone
boo…    boo    UTC
```

Both days and all four entries are on the same dates after as before:
one entry on 2026-10-06, three on 2026-10-07, two of those deleted.

Then I tried to break each rule on the migrated copy, with foreign keys on:

```
user with no name        refused: NOT NULL constraint failed: users.name
user with no timezone    refused: NOT NULL constraint failed: users.timezone
same email in capitals   refused: UNIQUE constraint failed: index 'UQ_users_email'
session for no user      refused: FOREIGN KEY constraint failed
day for no user          refused: FOREIGN KEY constraint failed
delete the user          refused: FOREIGN KEY constraint failed
```

`migration:revert` on the copy then put the four old columns back and kept
every row. The real file's SHA-256 was the same before and after. The copy
has been deleted.

---

## The five questions

### 1. Is refusing a missing timezone right, or should the API fall back to `UTC`?

**Refusing is right. I agree with the owner.**

The two choices fail in different ways. A refusal fails at once, on the
screen, to the person registering, and somebody fixes it the same day. A
default does not fail at all. The account is created, the entries are
saved, and each one written late in the evening goes under tomorrow's date
or yesterday's. Nobody is told. By the time someone notices, the days are
already stored, and the rule of this project is that a stored day never
moves. So a wrong default cannot be repaired afterwards. It can only be
stopped.

Today gave an example. The web app sends no timezone at the moment. Because
the API refuses, that shows as a 400 the first time anyone tries to
register. With a default it would have worked, and every new account would
have been in UTC without anyone knowing.

The cost is real. A client that cannot find out its timezone cannot
register. Every current browser can, so I accept it.

One thing I would add to the decision. The owner's reasoning also applies
to existing accounts, and there the migration **does** write `UTC`. That is
correct, because their days were worked out in UTC and the value records a
fact. But from tomorrow it stops being a fact for a person who lives in
Karachi. The honest reading is that `UTC` on an old account means "not yet
asked", and something should ask.

### 2. Storing the resolved form means `EST` becomes `America/Panama`. Is that acceptable, or should aliases be refused?

**Acceptable. Aliases should not be refused.**

- **It gives the right dates.** `EST` as a timezone name means five hours
  behind UTC all year, with no summer change. Panama is exactly that. It
  looks strange and behaves correctly.
- **Nobody sends `EST`.** The value comes from the browser, and browsers
  report names such as `America/New_York`. The strange case needs a person
  calling the API by hand.
- **Refusing aliases would refuse real people.** Some browsers report an
  older name for a real place, such as `Asia/Calcutta`. An API that
  accepted only the newest spelling would turn those people away at
  registration, and the message would mean nothing to them.
- **Refusing them needs a list.** `Intl` does not say whether a name is an
  alias. The API would have to carry its own list of every current name and
  keep it up to date. That is a dependency in everything but name.

What I would watch: the resolved form comes from Node, so it can differ
between versions. This is under *Limitations*. It never changes a date.

The value I am less comfortable with is `Etc/GMT+5`, not `EST`. It is an
offset wearing a name, and the rule lets it in. If the owner wants "never
an offset" to mean that too, the rule needs one more line refusing names
that begin with `Etc/GMT` followed by a sign. I did not add it, because the
prompt's rule is exact and no browser sends it.

### 3. What happens to a request that is in flight while that user's timezone changes, and does it matter?

The guard reads the user once, at the start of the request. The service
uses that copy. If the stored timezone changes a moment later, the request
finishes with the old one. An entry being written is filed under the date
the old timezone gives.

**It does not matter**, for three reasons.

- The old timezone was the true one when the request began. Filing the
  entry by it is not wrong. It is the same answer the request would have
  got a millisecond earlier.
- Nothing is left half done. The date is worked out once and the day and
  the entry are written in one transaction. There is no moment where half
  the request used one zone and half used another.
- The next request reads the user again. The timezone is not kept in the
  access token, so a change takes effect on the very next request and does
  not wait for the token to expire.

It also cannot happen through the API today, because no route changes a
timezone.

The case that would matter is a different one: a request that worked out
the date **twice**, once before the change and once after. No code does
that. `resolveFor` and `findToday` each call `dayFor` once. If a later
feature needs "today" and also writes an entry in one request, it should
work the date out once and pass it along.

### 4. Was a table rebuild needed, or was there a simpler migration that still ends with no default in the schema?

**For `up()` it was needed. For `down()` it was not, and I do not use one.**

SQLite will add a `NOT NULL` column to an existing table only if the column
is given a default. It needs something to put in the rows that are already
there. And SQLite has no statement that removes a default afterwards. So:

- add the column with `NOT NULL` and no default: refused;
- add it with a default: the default stays in the schema for good;
- add it nullable, fill it in, then make it required: there is no statement
  for the last step.

There is one way without a rebuild, and I rejected it. SQLite's own
documentation describes editing the stored `CREATE TABLE` text directly,
after `PRAGMA writable_schema = ON`: add the column with a default, fill it
in, then delete the default from the text. It is fewer rows copied. The
same documentation warns that one mistake in that text corrupts the
database. For a table with one row, to save copying one row, that is a bad
trade.

On PostgreSQL none of this applies. A default can be added and then
dropped in two ordinary statements.

### 5. Anything in this prompt that was wrong, contradicted itself, or assumed something about the code that is not true

**a. `pnpm typecheck:web` does not fail.** The prompt says it "is expected
to fail" in `lib/session.ts` and nowhere else. It passes, and so do lint,
build and all 55 web tests.

`apps/web/lib/session.ts` builds the body like this:

```ts
{ method: 'POST', body: { email, password } }
```

and the function that receives it takes `body` as `unknown`. Nothing in the
web app says that this object is a `WireRegistration`. The only mention of
that name in the web app is inside a comment. So the contract changed and
the compiler had nothing to check.

The result is the worst case in ADR-019's own table: both applications pass
every check, and registration is broken. I recommend the web worker's
prompt says two things, not one: send `name` and `timezone`, **and** give
that body the type `WireRegistration`, so that the next change to the
contract does fail the web app's typecheck. The same applies to the login
body and `WireLogin`.

**b. "TypeORM switches foreign keys off during a migration" is half true.**
The prompt points at the Day 16 report for this. That report measured
`up()`. During `down()` they are on. See *Foreign keys, forwards and
backwards*. The prompt's sentence "If you rebuild the table, prove
afterwards that all three foreign keys … are enforced" is fine. It was the
assumption behind `down()` that did not hold.

**c. "A test that had to change for any other reason is a finding" could
not be met with zero findings.** Part 4 requires the timezone to reach the
service with no extra query. That forces the signature of
`EntriesService.create` to change, and eighteen existing calls with it.
These are listed as findings as asked. I do not think they show a problem.

**d. "If a test still compares that SQL with `dayFor`".** No test does, and
none did before this task.

**e. Not wrong, but not said.** The decisions table says existing accounts
get `UTC`, and that a default "would start a person on the wrong days
without anyone noticing". For the one real account, the first statement
produces the situation the second one warns about. The owner should hear
that directly, which is why it is item 2 of the summary.

---

## What the owner must do to her own database

Her database has 1 account, 3 sessions, 2 days and 4 entries. Its email has
text before the `@`, so the migration will not refuse.

1. **Stop the API** if it is running.
2. **Back up one file:** `apps/api/data/neuron.db`. Copy it somewhere
   outside the repository with the date in its name.
3. **From `apps/api`, run `pnpm migration:run`.** Expect
   `Migration AddUserNameAndTimezone1791383154639 has been executed successfully`.
4. **Decide what to do about her own account.** After step 3 it is named
   `boo` and is in `UTC`. Until the stored timezone is `Asia/Karachi`, her
   day ends at 05:00 on her clock. Changing it moves none of her existing
   entries.
5. **Do not register from the web app** until the web worker has run. It
   will answer that something went wrong.

If step 3 prints `Cannot require a name: …`, nothing was changed.

To undo: run `pnpm migration:revert` from `apps/api`, or stop the API and
put the backup file back. The second is simpler and is certain.
