# Day 15b — Worker report: "today", and entries for one day

**Date:** 2026-10-06. Prompt: `docs/workers/day-15b-today-and-date-filter.md`.
Binding decisions: ADR-013, ADR-015, ADR-017.

---

## Objective

Give the Today screen the two things it could not ask for:

1. The entries written on one day, and only those.
2. Which date "today" is, decided by the API and not by the browser.

API only. `apps/web` was not touched, git was not touched, and no dependency
was added.

---

## Summary

Both parts are done and verified.

- `GET /entries?date=YYYY-MM-DD` and `GET /entries/count?date=YYYY-MM-DD`
  exist. The date condition is one `if` inside the shared `whereFor`, so the
  listing and the count cannot receive it separately.
- The filter reads the day row an entry points at. It never compares
  `created_at`, so the 4am rule is not written again.
- `GET /days/today` answers `{ date, mood }`. It calls the existing `dayFor`
  and creates no row.
- All four required mutations make tests fail. I ran a fifth of my own,
  because one required claim was not exercised by any of the four.

```
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
lint        clean
typecheck   clean
build       clean
unit        175 passed, 12 suites   (was 168)
e2e         232 passed, 19 suites   (was 196, 17 suites)
```

Four things need a decision from the Master Thread or the owner. Each is
described fully further down:

1. **`entries.day_id` is still nullable in the database.** An entry with no day
   is invisible to every `?date=`. No such entry exists today, but nothing in
   the schema prevents one. See question 3.
2. **A date-filtered listing costs two SQL queries instead of one.** This is
   how TypeORM pages a query that has a join. See *Limitations*.
3. **`?date=` with an empty value is a 400, while `?word=` with an empty value
   is `200 []`.** I chose this on purpose. See *Decisions made*, item 3.
4. **A browser that asks for today once will hold a stale date after 04:00.**
   This matters for Day 15c. See *Limitations*.

---

## Files changed

**Changed, source**

| File | Change |
|---|---|
| `apps/api/src/entries/entry-filters.ts` | `EntryFilters` gains `date?: string`. |
| `apps/api/src/entries/entries.repository.ts` | `whereFor` adds `where.day = { date }` when a date is given. Seven lines of comment, three of code. Nothing else in the file changed. |
| `apps/api/src/entries/find-entries-query.dto.ts` | `date`, validated with `IsCalendarDate`. |
| `apps/api/src/entries/count-entries-query.dto.ts` | The same field, the same rule. |
| `apps/api/src/entries/entries.controller.ts` | `filtersFrom` passes `date` through. One function, used by both routes, as before. |
| `apps/api/src/days/days.service.ts` | `findToday(userId)`. |
| `apps/api/src/days/days.controller.ts` | `@Get('today')`, declared above `@Get(':date')`. |

**New, tests**

| File | Tests |
|---|---|
| `apps/api/test/entries-by-date.e2e-spec.ts` | 17 |
| `apps/api/test/today.e2e-spec.ts` | 13 |
| `apps/api/test/clock.ts` | A helper that sets the clock. Not a suite. |

**Changed, tests**

| File | Change |
|---|---|
| `apps/api/test/count-agrees-with-list.e2e-spec.ts` | Five new cases in the ADR-017 invariant, one new test that pins the numbers, and a fixture that now spans two days. **A finding**, see below. |
| `apps/api/test/test-database.ts` | `authenticate` is split so that `login` can be called on its own. **A finding**, see below. |
| `apps/api/src/entries/find-entries-query.dto.spec.ts` | Seven new unit tests for `date`. |

**Changed, documentation**

`README.md`: the endpoint table gained one row and two descriptions.

---

## How it works

### The date filter

The whole change to the query is this, inside `whereFor`:

```ts
if (filters.date !== undefined) {
  where.day = { date: filters.date };
}
```

`day` is the relation that already existed on the entry (`@ManyToOne(() =>
Day)`). Naming it in a `where` makes TypeORM join the `days` table and compare
the day's `date` column. This is the SQL that reaches the database, captured
from a real run:

```sql
SELECT COUNT(DISTINCT("JournalEntry"."id")) AS "cnt"
FROM "entries" "JournalEntry"
LEFT JOIN "days" "JournalEntry__JournalEntry_day"
  ON "JournalEntry__JournalEntry_day"."id" = "JournalEntry"."day_id"
WHERE (("JournalEntry"."user_id" = ?)
  AND ((("JournalEntry__JournalEntry_day"."date" = ?))))
-- parameters: ["u1", "2026-08-09"]
```

Two things to read in it:

- **`created_at` does not appear.** The entry was given its day when it was
  written, and this reads that answer back. The 4am rule exists in exactly two
  places, as before: `dayFor`, and the backfill SQL in the `AddDays` migration.
- **Ownership is still `"JournalEntry"."user_id" = ?`**, on the entry itself.
  The day is only consulted for its date. ADR-013's rule is unchanged: other
  users' rows never match.

### Today

```ts
async findToday(userId: string) {
  const date = dayFor(new Date());

  return { date, day: await this.daysRepository.findByDate(userId, date) };
}
```

The controller answers with the day if one exists, and with
`{ date, mood: null }` if not. It uses `findByDate`, which only reads.
`findOrCreate` is not called, so asking for today never creates a row.

---

## Decisions made

**1. The filter is a relation condition, not a subquery and not a second
lookup.** There were three ways to say "the entry's day has this date":

- name the relation in the `where` (chosen);
- look the day up first and filter on `day_id`;
- a raw SQL subquery on `day_id`.

The first is the only one that stays inside the one `whereFor` object with no
raw SQL and no extra repository dependency. It has a cost, which is the second
item in the summary.

**2. The date is validated in both query DTOs, with the existing rule.** The
listing and the count have separate DTO classes, because only the listing
takes `limit` and `offset`. So the `date` field is declared twice. This is the
one place where the filter is written in two places, and it is a real gap: a
future filter could be added to one DTO and forgotten in the other. It would
fail loudly, as a 400 on the route that forgot it, because unknown parameters
are refused. I left the two classes as they are, since merging them is a
change to Day 14's design that the prompt did not ask for.

**3. An empty `?date=` is a 400.** `?word=` with an empty value is a search
that matches nothing, and answers `200 []`. Day 5 chose that. I did not copy
it for `date`, because a date is an identifier and not a search term. An empty
identifier is a malformed request, the same as `GET /days/` with nothing after
it. It also needed no special code: the existing `IsCalendarDate` rule already
refuses an empty string.

**4. `findToday` lives in `DaysService`, beside `resolveFor`.** Both answer
"which day is this instant?" for a user. Keeping them in one class means that
when a timezone arrives, there is one class to change. See question 1.

**5. The test clock replaces only `Date`.** Jest can fake timers as well
(`setTimeout` and the rest). The HTTP server, the database driver and the
password hash all wait on real timers, so faking those makes a suite hang.
`test/clock.ts` lists every timer as "do not fake" and leaves `Date` as the one
thing replaced.

**6. Entries in the tests are written through the API with the clock set.**
The alternative was inserting rows with a `day_id` the test had chosen. That
would test that a join works, and nothing more. The claim is about which day
the application files an entry under, so the application has to file it.

---

## Assumptions

**"Combines with `word`, `limit` and `offset`"** I took to mean that all four
can be present in one request and each still narrows the result. That is
tested, including a case where the word matches on other dates and not on the
one asked for.

**"The existing `DayResponse` shape"** is `{ date, mood }` and nothing else.
`GET /days/today` returns exactly those two keys.

**The development database was read, not written.** To answer question 3 with
a fact, I ran one read-only `COUNT` against `apps/api/data/neuron.db`. It
holds 0 entries at the moment, so 0 without a day. I read no content.

**A server is running from `apps/api/dist` that I did not start** (process
`node … dist/main`, seen while cleaning up after my own check). I left it
alone. `pnpm build` rewrites `dist`, so that server will be running the new
code after its next restart.

---

## Limitations

**A date-filtered listing is two queries.** When a query has both a join and a
page size, TypeORM does not trust a plain `LIMIT`, because a join can multiply
rows. It first selects the ids of the page, then selects those rows. Here the
join is from an entry to its one day, so rows are never multiplied and the
first query is wasted work. The unfiltered listing has no join and is still
one query. A day holds a handful of entries, so the cost is small. Removing it
means a raw subquery in `whereFor`, which I judged worse to read than one
extra query is to run.

**The browser can hold a stale "today".** `GET /days/today` answers for the
instant it is asked. A tab left open across 04:00 UTC still holds yesterday's
date. Nothing is filed wrongly, because `POST /entries` decides the day on the
server and ignores what the browser believes. But the screen would show a new
entry disappearing from "today", since the browser is still listing the old
date. Day 15c has to ask again: at least when the tab regains focus, and after
each write.

**Two requests, the second depending on the first.** The Today screen must
ask for the date before it can ask for the entries. See question 2.

**The boundary is 04:00 UTC, which is 09:00 for the one real user.** This is
ADR-015's recorded deferral, not something this task changed. It is now
visible on a screen for the first time, which is one of that ADR's two
"revisit when" conditions.

**`entries-by-date.e2e-spec.ts` has a 30-second setup limit.** Its fixture
signs in ten times, because moving the clock by a day expires a 15-minute
access token. Each sign-in verifies a password hash that is slow by design.
With the other suites running beside it, the setup passed Jest's default of
five seconds on the first run and four tests timed out. The suite takes about
six seconds in total.

**Other documents are now stale.** `docs/master-state.md` lists the endpoints
near line 1317 and does not have these two. I updated `README.md` and left
`master-state.md` to the Master Thread.

---

## Dependencies added

None.

---

## Testing performed

### New claims, and where each is tested

| Claim in the prompt | Test |
|---|---|
| `?date=` returns only that day's entries; fixture has two other days | `entries-by-date` › returns the entries of that day and only those, newest first. The fixture has three other days (7th, 8th, 10th). |
| 03:59 belongs to the previous date, 04:01 to the current one | `entries-by-date` › puts 03:59 on the previous date and 04:01 on the current one |
| Never another user's entries from the same date | `entries-by-date` › never returns another user's entries from the same date. Bob writes on the 9th too. |
| `/entries/count?date=` equals what paging reaches | `count-agrees-with-list` › five new `agrees for …` cases |
| An invalid `date` is a 400; so is `?dat=` | `entries-by-date` › refuses … on the listing and on the count (7 cases, each checked on both routes) |
| `GET /days/today` answers what `dayFor` gives, before and after 04:00, with the clock controlled | `today` › at …, today is the date dayFor gives (6 instants) |
| `today` is reachable and not swallowed by `:date` | `today` › is reachable, and is not taken for a date |
| `today` requires authentication | `today` › requires authentication |

Claims I added because the prompt's wording implied them:

| Claim | Test |
|---|---|
| A date with no entries is `200 []` | `entries-by-date` › answers a date the caller did not write on with an empty array |
| Combines with `word`, `limit`, `offset` | `entries-by-date` › combines with word; combines with limit and offset |
| The response is still `id`, `content`, `createdAt`, and no day | `entries-by-date` › still returns an entry as id, content and createdAt, and no day |
| Asking for today creates no row | `today` › does not create a day by being asked |
| Today carries a mood once one is set | `today` › carries the mood of today once one is set |
| Today does not show another user's mood | `today` › does not show another user's mood for the same date |
| The date `today` names is the date `?date=` finds a new entry under | `today` › names the date an entry written at … is filed under (03:59 and 04:01) |
| An entry with no day is under no date | `entries-by-date` › does not return an entry that has no day under any date |

**The expected date in the `today` tests is written out and also asked of
`dayFor`.** `'2026-08-08'` is in the test as a literal, and the test also
checks that the answer equals `dayFor(instant)`. The literal catches the
endpoint abandoning the 4am rule. The comparison says what the literal means.

### Mutation table

For each row I made the change, ran the unit and end-to-end suites, recorded
the failures, and restored the file. The unit suite passed in every row, so
the counts below are end-to-end tests out of 232.

| # | Mutation | Failed | Where |
|---|---|---|---|
| 1 | Remove the date condition from `whereFor` | **9** | `entries-by-date`: 8. `count-agrees-with-list`: 1 (`counts a day as that day and not as the whole journal`). |
| 2 | Date applied to the listing, not to the count | **8** | `count-agrees-with-list`: all 5 new `agrees for …` cases, and the pinned-numbers test. `entries-by-date`: 2. |
| 3 | `today` declared after `:date` | **11** | `today`: every test that expects a 200. Each receives a 400. |
| 4 | `today` uses midnight instead of 4am | **5** | `today`: just after midnight, just before 04:00, new year, the mood test, and the 03:59 filing test. |
| 5 (mine) | Drop the owner from the `where` when a date is present | **7** | `entries-by-date`: 6, including `never returns another user's entries from the same date`. `count-agrees-with-list`: 1. |

Three things in this table are worth reading closely.

**Mutation 1 does not fail the five `agrees for …` cases.** With the date
condition removed, the listing and the count both ignore the date, and they
still agree with each other. An agreement test cannot see a filter that both
sides drop. That is why I added `counts a day as that day and not as the whole
journal`, which states the numbers (10 in the journal, 7 on the 9th, 3 on the
8th, 2 for the 9th with the word "flat"). It is the one test in that suite
that fails under mutation 1.

**Mutation 4 leaves eight `today` tests passing, correctly.** At 15:00, at
04:00 exactly and at 04:00:01, midnight and 4am give the same date. Those
tests are there to hold the other side of the boundary.

**None of the four required mutations made the second-user test fail.** That
is expected, because none of them touches ownership. But a test that no
mutation fails has not been shown to be able to fail, which is the standard
the prompt sets. Mutation 5 is the wrong implementation that test exists to
catch, and it fails.

### Findings: tests that changed and were not expected to

1. **`count-agrees-with-list.e2e-spec.ts` now sets the clock, and its fixture
   has three more entries.** Before, all of its entries were written at the
   real current time, so they were all on one day. On a one-day journal,
   "count for that date" and "count of everything" are the same number, and
   mutation 2 would have passed. The three new entries are written on the
   8th, and the original seven on the 9th. The five existing cases are
   unchanged and still pass. None of the new contents contains "sister" or
   "canal", so the existing expectation of 2 for `?word=sister` still holds.
2. **`test-database.ts`: `authenticate` now calls a new exported `login`.**
   Behaviour is identical for the suites that already used `authenticate`.
   The new suites need to sign in again after moving the clock, without
   registering a second time.

No other existing test changed.

### Over real HTTP

Built `dist/main`, a throwaway SQLite file, migrations run, port 39417. The
real clock read `2026-10-06T09:48:28Z`.

```
GET /days/today              (no token)   401
GET /days/today                           200  {"date":"2026-10-06","mood":null}
POST /entries                             201
GET /entries?date=2026-10-06              200  [ one entry: id, content, createdAt ]
GET /entries/count?date=2026-10-06        200  {"count":1}
GET /entries?date=2020-01-01              200  []
GET /entries?date=2026-02-31              400  "date must be a real calendar date in YYYY-MM-DD form"
GET /entries/count?dat=2026-10-06         400  "property dat should not exist"
```

The server was stopped and the file deleted afterwards. I did not check "no
row created" over real HTTP, because the `sqlite3` command is not installed on
this machine. The end-to-end test covers it.

---

## The three questions

### 1. How does the code learn the current instant, and is that the right place for it once each user has a timezone?

**How.** By calling `new Date()`, in two places:

- `EntriesService.create` reads it for `createdAt`, and hands that instant to
  `DaysService.resolveFor`, which calls `dayFor`.
- `DaysService.findToday` reads it and calls `dayFor` directly.

There is no clock object that the application is given. The tests control
time by replacing JavaScript's `Date` for the whole process.

**Is it the right place? Yes for the reading, no for what happens next.**

A timezone does not change what the current instant is. An instant is the same
moment everywhere. A timezone changes which calendar date that instant falls
on. So `new Date()` can stay exactly where it is. The thing that has to change
is `dayFor`, which today takes one argument and assumes UTC:

```ts
dayFor(instant)            // today
dayFor(instant, timeZone)  // when users have one
```

Both callers already hold the `userId`, and both already go through
`DaysService`. So the user's timezone gets looked up in that one class and
passed to `dayFor`. I put `findToday` beside `resolveFor` for that reason.

**Where I disagree with the obvious next step.** The usual advice is to
introduce an injectable clock, a small class the services ask for the time. I
would not do that for the timezone work. It solves "the tests need to control
time", which replacing `Date` already solves in ten lines, and it does nothing
for "which date is this for this user", which is the actual problem.

**One thing the timezone will break, which is not about the clock.** When a
user's timezone changes, `today` moves at once and entries already written do
not. ADR-015 chose that on purpose. The visible result is that someone who
changes timezone in the evening can open Today and not see what they wrote
that afternoon, because it was filed under a date that is no longer today.
That is a product question for the day the timezone is built, and it should be
on the list for it.

### 2. Was a filter the right shape, or would one combined endpoint for the Today screen have been better?

**The filter was right.** Three reasons:

- **It is not only for Today.** The day page, `/d/{date}`, needs the entries
  of an arbitrary date. A combined "today" endpoint would not serve it, and
  the filter would have been needed anyway.
- **A combined endpoint is shaped like a screen.** The moment the screen
  changes, the endpoint changes. ADR-017's fifth condition already made this
  choice once: the timeline's totals get their own endpoint, and `/count`
  does not grow toward it.
- **It cost three lines in the query.** ADR-017 predicted that a second filter
  would be cheap if there was one builder. It was.

**What the filter costs, stated plainly.** The Today screen makes two
requests, and they cannot run in parallel, because the second needs the date
from the first. That is one extra round trip on the first screen the user
sees.

**What I would not do to fix it** is accept `?date=today`. It would make the
filter take a value that is not a date, which is exactly the route-order
problem in Part 2 moved into a query parameter.

**When I would change my answer.** If a third thing joins the Today screen,
most likely recordings, then three requests in sequence is too many. At that
point the right shape is a day document, `GET /days/:date` returning the day
with what is on it, and `today` returning the same document. That is a
resource, not a screen, so it does not have the problem above. It is not
worth building for two requests.

### 3. Entries created before Day 13 could have a null `day_id`. What does `?date=` do with them, and is that right?

**What it does.** Such an entry is returned for no date at all. The filter
joins the entry to its day and compares the day's date. An entry with no day
has nothing to compare, so it matches nothing. It still appears in
`GET /entries` with no filter, and it is still counted by `GET /entries/count`
with no filter. This is tested:
`does not return an entry that has no day under any date`.

One consequence follows from that. If you add up the counts for every date,
you get the number of entries that have a day, which can be less than the
total count.

**Is the filter right? Yes.** The only alternative is for the filter to work
out a date from `created_at` when `day_id` is missing. That would be the 4am
rule written a third time, in the one place the prompt forbids it, and it
would quietly disagree with the stored answer the day a timezone arrives.

**Is the situation right? No, and the filter is not the place to fix it.**
Three facts:

- **Can such an entry exist today? Not through any path I can find.** The
  `AddDays` migration backfilled every entry that had an owner. Every entry
  had an owner by then, because `RequireEntryOwner` ran earlier and made
  `user_id` `NOT NULL`. Every entry written since gets its day inside the
  same transaction as the insert. The development database currently holds 0
  entries.
- **Nothing in the database prevents one.** `entries.day_id` is still a
  nullable column. `AddDays` says so in its own comment: making it `NOT NULL`
  "belongs in its own migration, after the application has been writing it
  for a while".
- **The entity disagrees with the schema.** `entry.entity.ts` declares
  `day_id` without `nullable: true`, so TypeORM believes the column is
  required while SQLite allows it to be empty.

Before this task, an entry with no day was harmless: it was listed like any
other. From this task on, it is an entry that never appears on any day's
screen and produces no error. That is the same shape as ADR-013's
"`NULL` matches nobody" for `user_id`, and it should get the same answer.

**Recommendation.** A migration that makes `entries.day_id` `NOT NULL`, and
that refuses to run if any entry has no day, as `RequireEntryOwner` does. I
did not write it, because the prompt did not ask for a schema change. It is
small, and I would do it before Day 15c puts the Today screen in front of real
data.
