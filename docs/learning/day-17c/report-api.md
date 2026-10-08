# Day 17c — Worker report, API: an entry says which day it is on, and a day that has not happened does not exist

**Date:** 2026-10-08. Prompt: `docs/workers/day-17c-api-entry-date-and-future-days.md`.

---

## Objective

Four things, all in the API and the contracts package.

1. Close Day 17b's audit finding: a test that fails when the migration's
   last check, `refuseBrokenForeignKeys`, is removed.
2. The contract says an entry carries a `date`, and names the body of
   `PUT /days/:date/mood` as `WireMood`.
3. Every route that answers with an entry sends the date of the day that
   entry is filed on.
4. `GET /days/:date` and `PUT /days/:date/mood` answer 404 for a date that is
   later than today for the person asking.

`apps/web` was not touched. Git was not touched. No dependency was added. No
migration was added, and no existing migration was changed. (One migration
file was changed for a few minutes for mutation 7 and put back. `git status`
shows it unmodified.)

---

## Summary

All four parts are done and tested.

```
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
lint        clean
typecheck   clean
build       clean
contracts   7 passed                 (unchanged)
unit        246 passed, 16 suites    (was 242)
e2e         365 passed, 25 suites    (was 318, 23 suites)

pnpm lint:web && pnpm typecheck:web && pnpm build:web && pnpm test:web
all four    clean, 100 web tests passed
```

Five things need the Master Thread or the owner. The first two matter most.

1. **A dev server was running against the owner's real database for the
   whole task, and it reloaded every edit I made.** `nest start --watch`
   was running from `apps/api`, with `apps/api/data/neuron.db` open. It
   restarts whenever a file under `src` changes. So each of the eight
   mutations in this report was live on that server for about a minute and
   a half. None of my commands wrote to that file, and I found no harm, but
   the file did change while I worked, because someone registered a new
   account through the running app. See *The owner's database*.
2. **The second verification line passes completely, and the web app is not
   broken this time.** That is a different result from Day 17b, for a
   reason worth understanding. See *Part 2*.
3. **The owner's first account is the traveller of question 3, tonight.**
   It is stored in `UTC` and she lives five hours ahead of it. Every night
   from midnight to 05:00 on her clock, her browser's date is one day ahead
   of the API's today. From today, that later date is a 404. See question 3.
4. **One existing test changed for a reason that is not `date`.** The
   `days-range` suite set moods on dates that were in its own future. See
   *Findings: existing tests that changed*.
5. **`GET /entries` now runs one query for the entries, and
   `GET /entries?date=` runs one where it ran two before.** The answers are
   the same. See *Part 3*.

---

## Files changed

**New**

| File | What it is |
|---|---|
| `apps/api/test/entry-date.e2e-spec.ts` | 22 tests: the date on every entry answer, over HTTP. |
| `apps/api/test/future-days.e2e-spec.ts` | 25 tests: a day that has not happened yet. |
| `docs/learning/day-17c/report-api.md` | This report. |

**Changed, source**

| File | Change |
|---|---|
| `packages/contracts/src/index.ts` | `WireEntry` gains `date`. New `WireMood`. |
| `apps/api/src/days/set-mood.dto.ts` | `SetMoodDto implements WireMood`. |
| `apps/api/src/entries/entry.entity.ts` | New type `FiledEntry`: an entry together with the date of its day. |
| `apps/api/src/entries/entries.repository.ts` | Every read joins the day and reads its date. One private method, `filed`, holds the query. |
| `apps/api/src/entries/entries.service.ts` | Return types only: `FiledEntry` in place of `JournalEntry`. |
| `apps/api/src/entries/entries.controller.ts` | Builds each answer field by field in `toResponse`. |
| `apps/api/src/days/days.service.ts` | `hasHappened(owner, date)`, and one private `todayFor(owner)` that `findToday` also uses. |
| `apps/api/src/days/days.controller.ts` | The two routes refuse a future date with a 404 before doing anything else. |

**Changed, tests.** Seven files. Each is listed under *Findings*.

---

## How it works

### Part 1 — the test for `refuseBrokenForeignKeys`

The new tests are in `src/database/add-user-name-and-timezone.spec.ts`, in a
group named `refusing a row that points at no user`.

Each one builds a database with the ten earlier migrations and the usual
seed rows. Then it writes one row whose `user_id` is `'nobody'`. The database
would normally refuse that row, so the test switches foreign key checking
off for that one statement and on again. (A foreign key is the rule that a
row's `user_id` must be the id of a real user.) Then it runs the migration
and expects it to stop with the message `Rebuilding users left 1 rows
pointing at a user that does not exist`.

There are four tests: one each for a bad row in `sessions`, in `days` and in
`entries`, and one that checks nothing was changed when the migration
refused.

**With the call removed, all four fail.** This is mutation 7:

```
● AddUserNameAndTimezone › refusing a row that points at no user ›
  refuses to finish when a row of sessions points at a user that does not exist

    expect(received).rejects.toThrow()
    Received promise resolved instead of rejected
```

"Resolved instead of rejected" means the migration finished when the test
expected it to refuse.

**The test file was run by the command.** When `pnpm test` runs through
pnpm with its output sent to a file, Jest prints only the totals and no file
names. So the totals alone do not prove which files ran. I ran the same
script once more and asked Jest for its results as data (`--json`):

```
suites 16  tests 246  passed 246
src/database/add-user-name-and-timezone.spec.ts  passed  29 tests
   passed - … refuses to finish when a row of sessions points at a user that does not exist
   passed - … refuses to finish when a row of days points at a user that does not exist
   passed - … refuses to finish when a row of entries points at a user that does not exist
   passed - … leaves the database exactly as it was when it refuses for that reason
```

The file had 25 tests before and has 29 now, and 242 + 4 = 246.

### Part 2 — the contract

```ts
export interface WireEntry {
  id: string;
  content: string;
  createdAt: string;
  /* The calendar date, YYYY-MM-DD, of the day the entry was filed on. … */
  date: string;
}

/* The body of PUT /days/:date/mood. null clears the mood. */
export interface WireMood {
  mood: Mood | null;
}
```

**What the second verification line did: nothing failed.** Lint, typecheck,
build and all 100 web tests pass. The reason is different from Day 17b's,
and this time the web app is not broken.

- **`WireEntry` gained a field, and the web app only ever receives a
  `WireEntry`.** It never builds one. Adding a field to something you only
  read cannot break the code that reads it: the old code just does not look
  at the new field. I searched `apps/web` and found no place that creates an
  object and calls it a `WireEntry`. The test fixtures in
  `lib/today.test.ts` build entries as plain objects with no type, so they
  were not checked either.
- **`WireMood` is new, and nothing in the web app uses it yet.**
  `lib/today.ts` line 430 writes the same shape by hand:
  `const body: { mood: Mood | null } = …`. That line is correct today. It is
  also a second copy of a fact that is now in the contract, which is what
  ADR-019 exists to remove. The web worker's prompt already asks for that
  annotation to become `WireMood`.

So on Day 17b "nothing failed" hid a broken registration. Today "nothing
failed" is the true result: the API sends one more field, and the browser
ignores it until the web worker uses it.

One thing the web worker should know. The fixtures in `lib/today.test.ts`
have no `date`. If they are given the type `WireEntry`, the compiler will
then say so.

### Part 3 — every entry carries its date

**Where the date comes from.** `EntriesRepository` has one private method
that every read of an entry goes through:

```ts
private filed(where: FindOptionsWhere<JournalEntry>) {
  return this.entries.createQueryBuilder('entry').setFindOptions({
    where,
    relations: { day: true },
    select: { id: true, content: true, createdAt: true, day: { date: true } },
    order: { createdAt: 'DESC' },
  });
}
```

`relations: { day: true }` tells TypeORM to join the `days` table, which
means to read each entry together with the day row its `day_id` points at.
`select` names the columns to read. So `user_id`, `day_id` and `deleted_at`
are still never read, and of the day only its `date` is kept.

The date is the stored one. Nothing in the entries code calls `dayFor`.

**Where the answer is built.** The controller no longer hands back whatever
the service gave it. It builds each answer in one function:

```ts
function toResponse(entry: FiledEntry): WireEntry {
  return {
    id: entry.id,
    content: entry.content,
    createdAt: entry.createdAt,
    date: entry.day.date,
  };
}
```

This is the same pattern `DaysController` already uses. Two things follow
from it. If the contract gains a field that `toResponse` does not fill, the
file stops compiling. And an answer holds these four things and nothing
else, whatever the entity is carrying, so `day`, `dayId`, `userId` and
`deletedAt` cannot leak by accident. The compiler would not catch an extra
field, so the tests check the exact list of fields on all five routes.

**How many queries one `GET /entries` runs: three, and one of them is about
entries.** This is every statement the request sent, captured in the test:

```
1. SELECT … FROM "sessions" … WHERE "Session"."id" = ? LIMIT 1        (the guard)
2. SELECT … FROM "users" … WHERE "User"."id" = ? LIMIT 1              (the guard)
3. SELECT "entry"."id", "entry"."content", "entry"."created_at",
          "entry__entry_day"."date", "entry__entry_day"."id"
   FROM "entries" "entry"
   LEFT JOIN "days" "entry__entry_day" ON "entry__entry_day"."id" = "entry"."day_id"
   WHERE "entry"."user_id" = ? AND "entry"."deleted_at" IS NULL
   ORDER BY "entry_created_at" DESC LIMIT 50 OFFSET 0
```

The first two are the sign-in check that every protected route does. The
third reads the entries and their dates together. The count is the same for
one entry and for thirty entries on thirty days, and a test holds it there
(`how many queries a listing runs`). Mutation 8 reads each entry's date
separately and fails that test.

**Why a query builder and not `find`.** I measured both. `find` with a
joined table and a page size makes TypeORM send two statements: one to pick
the ids of the page, and one to load them. That is still not one per entry,
so it would have met the prompt. I chose the builder with `limit` and
`offset` because it sends one statement, and because that statement has the
same `ORDER BY` as the one the API sent before today.

`limit` counts rows of the joined result. That is safe here because an entry
points at exactly one day, so the join never turns one entry into two rows.
The comment on `filed` says so.

**A side effect, measured.** Before today `GET /entries?date=` already used
the two-statement form, because the date filter joins `days`. It now sends
one. The answers are the same.

**What did not change.** The `word` filter, the `date` filter, paging,
newest-first order and `GET /entries/count`. The listing still gets its
`where` from the same `whereFor` function as the count, so ADR-017 still
holds. All 318 earlier end-to-end tests pass, and the only ones I edited are
listed under *Findings*.

### Part 4 — a day that has not happened

`DaysService` now has one place that says which date is today:

```ts
hasHappened(owner: DayOwner, date: string): boolean {
  return date <= this.todayFor(owner);
}

private todayFor(owner: DayOwner): string {
  return dayFor(new Date(), owner.timezone);
}
```

`findToday` calls the same `todayFor`. So "today" for the 404 is, by
construction, the date `GET /days/today` answers with. Two dates written as
`YYYY-MM-DD` compare correctly as text, which is why `<=` is enough.

Both routes in `DaysController` call one helper first:

```ts
if (!this.daysService.hasHappened(request.user, date)) {
  throw new NotFoundException(`Day with date ${date} not found`);
}
```

**The exact body of the 404:**

```json
{
  "message": "Day with date 2026-08-11 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

It follows the entry's 404, which says `Entry with ID … not found`. For the
web worker: `message` here is one piece of text. In a 400 it is a list.

**Which is checked first: the 400.** The order of refusals is:

1. No valid sign-in: 401.
2. The date is not a calendar date, or the mood is not a mood: 400.
3. The date is in the future: 404.

The 400 comes first for two reasons. The practical one is that Nest checks
the address and the body before the controller's code runs at all. The
better one is that the question "is this date in the future?" has no answer
for `2031-02-31`, because that is not a date. Something has to be a date
before it can be a future date.

One consequence I want to state plainly: a bad mood on a future date is a
400, not a 404. A test pins it.

**`PUT` on a future date creates no row.** The check runs before the service
is called, and the service is what creates the row. The test
`creates no day row when PUT is refused` reads the `days` table before and
after. Mutation 6 moves the check to after the write and fails it.

**The collection routes are unchanged**, as the prompt asked.
`GET /entries?date=` with a future date answers `[]`, the count answers
`{ "count": 0 }`, and `GET /days?from=&to=` with `to` in the future answers
the days that exist. All three are tested.

**A future row that is already stored.** I added one case the prompt did not
list. If a `days` row on a future date already exists, both routes still
answer 404, the row is not changed, and when its date arrives the row is
there with the mood it had.

### Future rows in the owner's database

On a copy of `apps/api/data/neuron.db`, taken at 2026-10-07 19:30 UTC, opened
read-only, then deleted:

| Account (first 3 letters) | Stored timezone | Today for them | Day rows | On a future date |
|---|---|---|---|---|
| `boo…` | `UTC` | 2026-10-07 | 2 | **0** |
| `boo…` | `Asia/Karachi` | 2026-10-08 | 1 | **0** |
| `hab…` | `Asia/Karachi` | 2026-10-08 | 1 | **0** |

No account has a day on a future date. Nothing was deleted.

---

## Decisions made

**1. The 404 is thrown by the controller, and the rule is in the service.**
This is how the project already works: services answer with values, and
controllers turn "not there" into a 404. The cost is that code which calls
`DaysService.setMood` directly, without going through the controller, is
not refused. Nothing does that today.

**2. `FiledEntry` is a separate type from `JournalEntry`.** The entity's
`day` is optional, because most code that holds an entry has not loaded it.
`FiledEntry` says "this one was read with its date", so `toResponse` can
read `entry.day.date` without a check. See *Limitations* for the cost.

**3. `date` is the last field of the answer.** Field order means nothing in
JSON. One existing test compares the order, so I had to choose one.

**4. The message is `Day with date … not found`.** The prompt asked me to
follow the existing 404. This is wording a person may see, so the owner may
want to change it. It is one line in `days.controller.ts` and one in the
test file.

---

## Assumptions

- A year always has four digits. `IsCalendarDate` already refuses anything
  else, and comparing dates as text depends on it.
- "Every route that answers with an entry" means the five the prompt lists.
  `DELETE /entries/:id` answers with no body.

---

## Limitations

- **`FiledEntry` is promised to the compiler, not proved to it.** The
  repository reads an entry with its day and then tells TypeScript "this has
  a day" with a cast (`as`). If a later change removed the join, the code
  would still compile and would fail when a request ran. The end-to-end
  tests on all five routes are what hold it.
- **Two entries written in the same millisecond have no fixed order.** That
  was true of `GET /entries` before today and is unchanged. For
  `GET /entries?date=` the old two-statement form happened to break such a
  tie by id, and the new one does not. I do not think any real person can
  produce the case.
- **One existing test depends on the real time of day**, and only when the
  code is wrong. See the note under the mutation table.
- **The owner's first account** is covered in question 3.

---

## Dependencies added

None.

---

## Testing performed

### Claims, and where each is tested

| Claim | Where |
|---|---|
| Each of the five entry routes answers with `date`, over real HTTP | `entry-date` › `on every route that answers with an entry` › `… answers with the date` (five tests) |
| Two entries on two days answer with two dates in one `GET /entries` | `entry-date` › `answers with two different dates for two entries on two days …` |
| An entry whose day holds a date its `created_at` would not give today answers with the stored date | `entry-date` › `an entry filed under a date that its created_at would not give today` (four routes), and `… after the timezone of the user changes` (four routes) |
| No entry answer carries `dayId`, `day`, `userId` or `deletedAt` | `entry-date` › `… answers with id, content, createdAt and date, and nothing else` (five tests) |
| One instant, two zones: 200 for one user and 404 for the other, on both routes | `future-days` › `one instant, two users, one date` (two tests) |
| Today, yesterday and tomorrow for a user not in UTC | `future-days` › `today, yesterday and tomorrow, in a zone that is not UTC` (twelve tests) |
| A refused `PUT` leaves no row behind | `future-days` › `creates no day row when PUT is refused` |
| Part 1's test | `add-user-name-and-timezone.spec.ts` › `refusing a row that points at no user` (four tests) |
| One query on entries however many there are (mine) | `entry-date` › `how many queries a listing runs` |
| 400 before 404; the collection routes; a stored future row (mine) | `future-days`, the last three groups |

The "today, yesterday and tomorrow" tests use Karachi at 20:00 UTC on 9
August. At that moment it is 01:00 on the 10th in Karachi and still the 9th
in UTC. So "today" is a date that a rule working in UTC would call
tomorrow. That is what lets the test tell the two rules apart.

### Mutation table

For each row I made the change, ran lint, typecheck, the unit suite and the
end-to-end suite, recorded the failures, and restored the files. Unit counts
are out of 246, end-to-end out of 365. Typecheck passed for every row.

| # | Mutation | Lint | Unit failed | E2E failed | Where |
|---|---|---|---|---|---|
| 1 | `date` from `created_at` and the user's timezone | passes | 0 | **8** | `entry-date`: the four `… answers with the stored date`, and the four `… still answers with that date after the timezone of the user changes` |
| 2 | No `date` on `PATCH /entries/:id` only | passes | 0 | **5** | `entry-date`: the four tests named `PATCH /entries/:id …`. `soft-delete` › `never contains deleted_at …` |
| 3 | `dayId` in the answer of `GET /entries` | passes | **2** | **12** | `entry-date`: four. `soft-delete`: three. `app.e2e`: three. `entries-by-date`: one. `ownership`: one. Unit: two in `entries.controller.spec.ts` |
| 4 | "Future" judged in UTC | passes | 0 | **7** | `future-days`: both two-user tests, `agrees with GET /days/today …`, `answers 404 until midnight in Karachi …`, and today on `GET` and on `PUT`. `registration-profile`: one, see the note |
| 5 | Today refused as well as tomorrow | passes | 0 | **16** | `future-days`: seven. `soft-delete`: three. `days-range`: three. `today.e2e`: two. `registration-profile`: one |
| 6 | Day row created before the date is judged | passes | 0 | **3** | `future-days`: `creates no day row when PUT is refused`, the two-user `PUT` test, and `answers 404 for a future day that is already stored …` |
| 7 | Call to `refuseBrokenForeignKeys` removed | **fails** | **4** | 0 | All four tests under `refusing a row that points at no user` |
| 8 (mine) | The listing reads each entry's date with its own query | passes | 0 | **1** | `entry-date` › `how many queries a listing runs` |

Four things worth reading closely.

**The unit suite is blind to mutations 1, 2, 4, 5, 6 and 8.** Each is about
what a request answers, so each is caught only over HTTP. The same was true
on Day 17b. `pnpm test:e2e` has to run for this work to be trusted.

**Mutation 1 is not caught on `POST /entries`, and cannot be.** At the
moment an entry is written, its day is worked out from that instant and the
author's timezone. So at that moment the stored date and the worked-out date
are the same thing. They can only differ later, which is why the tests that
catch it are the four reading routes.

**Before today, mutation 7 failed nothing except lint.** Now it fails four
tests. That closes the Day 17b finding.

**Note on mutation 4.** One of its seven failures is
`registration-profile` › `carries no timezone from any other route …`. That
test uses the real clock and an account in Karachi. It failed because I ran
it between midnight and 05:00 Karachi time, when Karachi's today is ahead of
UTC's. Run in the afternoon, it would not have caught mutation 4. I do not
count it as a guard. The six tests in `future-days` set the clock and do not
depend on the hour.

### Findings: existing tests that changed

Seven files. Groups 1 and 2 are for the reason the prompt expected. Group 3
is not.

**1. The test listed the fields of an entry answer, and `date` is now one of
them.**

| File | Test |
|---|---|
| `test/app.e2e-spec.ts` | `/entries (POST) returns exactly id, content, createdAt and date` (renamed; two lists) |
| `test/days.e2e-spec.ts` | `never puts day_id in a response` (two lists) |
| `test/entries-by-date.e2e-spec.ts` | `still returns an entry as id, content, createdAt and date, and no day` (renamed) |
| `test/ownership.e2e-spec.ts` | `should never put userId in a response body` |
| `test/soft-delete.e2e-spec.ts` | `never contains deleted_at, before a delete or after one` |

In each, the only change is `'date'` added to the list, and to the name
where the name listed the fields.

**2. Part 1's tests**, added to
`src/database/add-user-name-and-timezone.spec.ts`. No existing test in that
file changed.

**3. Finding: a suite that set moods on dates in its own future.**

| File | What changed | Reason |
|---|---|---|
| `test/days-range.e2e-spec.ts` | The clock now starts at `2026-10-05T12:00:00.000Z`. It started at `2026-07-01T12:00:00.000Z`. | The setup sets a mood on five dates from 31 July to 1 September, and one test sets a mood on 5 October. With the clock on 1 July all of those were future dates, and thirteen tests in the file failed with a 404. |

No assertion in that file changed. This is the new rule being correct, and
it shows the rule reaches further than the two new test files. A test that
wants a mood on a date must now put the clock on or after that date.

**No unit test changed.** The service and controller unit tests compare an
entry the service returned with an entry the service returned, so both sides
gained the day together.

No test changed for any reason outside these three groups.

### The owner's database

**None of my commands wrote to `apps/api/data/neuron.db`.** Every test uses
a database in memory or in a temporary folder, and I checked the test files
that start the application as a separate process or build it from the
environment (`built-output`, `main-wiring`, `config-wiring`,
`synchronize`): each one sets its own path in a temporary folder. The one
time I read the file, I read a copy.

**The file did change while I worked, and this is how.** Its SHA-256 was
`a84ed232…daf3cbe` when I started and was still that at 19:30 UTC, after
every test run and all eight mutations. It was `83e9e2b0…7ab7eefa` two
minutes later. A second read-only copy showed what had been added:

```
19:31:40 UTC   a new account, timezone Asia/Karachi, and a session for it
19:31:57 UTC   one entry and one day (2026-10-08) for that account, mood Good
```

That is a person registering through the web app and writing an entry
seventeen seconds later. The file had 3 accounts when I counted future rows
and has 4 now.

**The part that matters.** These processes were running the whole time:

```
nest start --watch            started 23:19 PKT on 7 October, from apps/api
node … dist/main              the API it runs, with data/neuron.db open
next dev --port 3001          the web app
```

`--watch` restarts the API whenever a file under `src` changes. So that
server ran each version of my code as I saved it, **including each mutation,
for about a minute and a half each**, against the real database. Had a
request arrived in one of those windows it would have been answered by code
that was wrong on purpose.

I checked for harm and found none. Mutations 1, 2, 3 and 8 change only what
is sent back. Mutations 4 and 5 change only which dates are refused.
Mutation 7 is a migration that had already run. Mutation 6 is the one that
could have stored something: a mood on a future date. No account has a day
on a future date, before or after. The entry at 19:31:57 was written after
the last mutation was restored.

**What I recommend:** stop the dev server before a worker runs, or start it
with `DATABASE_PATH` pointing at a copy. A worker prompt that says "do not
run anything against the real database" cannot be kept by the worker alone
while a watching server is running.

---

## The five questions

### 1. Is `date` on every entry the right shape, or should the Timeline have had its own route that answers days with their entries inside?

**`date` on every entry is right, and I would have added it even if the
Timeline had its own route.** But I do not think it is enough for a thousand
entries, and I do not think the nested route is the fix either.

Why `date` belongs on the entry in any case: an entry is filed on a day, and
that is a fact about the entry. Without it, the answer to `POST /entries`
cannot tell the browser where the new entry goes, and the browser is left to
work a date out from `createdAt`, which is the thing ADR-019 forbids.

What each shape costs at a thousand entries:

| | `date` on each entry (built today) | A route that answers days with entries inside |
|---|---|---|
| Requests to show everything | Five, at 200 entries a page, and one more to `GET /days` for the moods | One, or one per page of days |
| What a page cuts | A page of 200 can end in the middle of a day. The browser must join the two halves | Nothing. A page is whole days |
| Size of a page | Known: at most 200 entries | Not known: one day may hold three entries or three hundred |
| New code that must be kept correct | None | A second way of reading entries. It must leave out deleted entries, check the owner, and agree with the count (ADR-017, ADR-020), all over again |
| Mood | A second request | Comes with the day |

The nested route reads well on a screen. Its cost is a second path to the
same rows, and this project has already learned what that costs twice.

**What I believe the Timeline with a thousand entries needs is neither.** It
should not load a thousand entries. `GET /days?from=&to=` already answers
"which dates have something, and their mood", and that answer is small: a
date and a word for each day. The screen can show every day from that, and
load the entries only for the days being looked at. The one thing missing
for that is a filter on `GET /entries` for a range of dates. That is a small
change to `whereFor`, it reaches the count at the same moment, and it adds
no new shape to the contract.

One caution for the web worker today. `GET /entries` is ordered by
`createdAt`, not by `date`. Today the two orders always agree. After Day 34
they may not: a person who changes timezone can write a later entry that is
filed on an earlier date. So the Timeline should group by `date`, and should
not assume that entries with the same date sit next to each other.

### 2. Is 404 the right answer for a future day, or is it a 400?

**404. I agree with the owner.**

A 400 says "your request is badly formed, and it will be wrong every time
you send it". `2026-10-09` is a perfectly formed date. The same request
will succeed tomorrow. And at this moment it succeeds for a person in Tokyo
and fails for a person in Los Angeles. Nothing is wrong with the request.
The thing it asks for does not exist yet. That is what 404 means.

It also matches the owner's words. A person who types tomorrow's address
should land on the not-found screen, and the web app shows that screen for
a 404.

What it costs:

- **The status alone does not say why.** A future day and a mistyped address
  are both 404. Only the message tells them apart, and matching on message
  text is fragile. I do not think the web app needs to tell them apart.
- **It looks uneven beside the past.** `GET /days/2019-01-01` is a 200 with
  no mood, and `GET /days/2031-01-01` is a 404. Both are days with nothing
  on them. The difference is real, though: the first day happened and is
  empty, and the second has not happened.

### 3. A person travels, and their browser's idea of today moves ahead of the stored timezone. What do they see, and does it matter before Day 34?

Take a person stored in Karachi who flies to Tokyo, four hours ahead. From
midnight to 04:00 in Tokyo, their phone says the 9th and the API says the
8th.

What they see depends on one thing: where the web app gets its dates.

- **If every date on screen comes from the API** (today from
  `GET /days/today`, an entry's day from `entry.date`, the list of days from
  `GET /days`), they see a Today screen labelled the 8th for four hours
  after their own midnight. What they write is filed on the 8th. It looks a
  day behind and nothing is broken.
- **If any date is worked out from the browser's clock**, such as a link to
  "today" built from `new Date()`, that link asks for the 9th, and the
  answer is now a 404. They see the not-found screen for a day their own
  phone says is today. Before today the same link showed an empty day, which
  was wrong but looked harmless.

A person who travels west has the opposite case and no 404: the API's today
is ahead of their phone, so they see tomorrow's date a few hours early.

**Does it matter before Day 34? Yes, for one account, without any travel.**
The owner's first account was given `UTC` by the Day 17b migration, and it
is still `UTC`: I saw it in the copy. She is five hours ahead of UTC. So
every night from midnight to 05:00 on her clock, her browser is a day ahead
of her stored today. She is the traveller in this question, at home.

What follows:

- The web worker's prompt says no day is made from `createdAt`. It does not
  say the same about the browser's own clock, and it should, in one line:
  **the browser's clock is never used to make a date.** If that holds, the worst she sees on that
  account is a date label that changes at 05:00 and not at midnight, which
  was already true since Day 17b.
- Her two newer accounts are in `Asia/Karachi` and are not affected.
- Day 34 is still the real repair.

### 4. What did you use that the owner has not been taught?

Named plainly:

- **`createQueryBuilder(...).setFindOptions(...)` with `.limit()` and
  `.offset()`.** The repository used `find` with `take` and `skip` before.
  `days.repository.ts` already has a query builder, so the builder itself is
  not new. Passing it the same options object that `find` takes, and using
  `limit` in place of `take`, is new. The difference between `take` and
  `limit` is the two-statement behaviour described in *Part 3*.
- **Reading a joined table through `relations`, and choosing its columns
  with a nested `select`.** Until today the join to `days` was used only to
  filter, never to read from.
- **`FiledEntry = JournalEntry & { day: Pick<Day, 'date'> }`.** The `&`
  makes a type that has everything from both sides. `Pick` was used once
  before, for `DayOwner`.
- **A cast with `as`** in the repository. It tells the compiler something
  and the compiler does not check it. See *Limitations*.
- **`jest.spyOn` on TypeORM's query runner**, to count the SQL statements a
  request sends. This reaches inside the library.
- **`it.each` over a list of functions.** The five routes are a list named
  `ROUTES`, and several tests run once for each. `it.each` over plain values
  is already used in the project.
- **`PRAGMA foreign_keys = OFF` inside a test**, to write a row the database
  would normally refuse.
- **Comparing two dates as text with `<=`.** It works because of the
  `YYYY-MM-DD` form. It would not work for `9-10-2026`.

### 5. Anything in this prompt that was wrong, contradicted itself, or assumed something about the code that is not true

**a. "A plain `npx jest` in `apps/api` skips the migration test files and
reports a pass."** Half of that is what I measured. It reports:

```
Test Suites: 7 failed, 9 passed, 16 total
Tests:       139 passed, 139 total
```

Seven files fail to load, the migration file among them, so none of their
tests run. The `Tests:` line says 139 passed and none failed, and that line
is what reads like a pass. But the line above it says seven suites failed.
The instruction to use the full commands is right.

**b. "A test that had to change for any other reason is a finding" could
not be met with zero findings.** Part 4 makes a mood on a future date a 404,
and `days-range.e2e-spec.ts` set moods on dates ahead of its own clock. It
is under *Findings*. I do not think it shows a problem.

**c. Mutation 1 cannot be caught on every route.** The prompt asks for each
mutation to fail something, and it does. But on `POST /entries` the stored
date and the worked-out date are the same at the moment of writing, so no
test of that one route can tell them apart.

**d. "The controller is documented as answering with the contract's
`WireEntry`."** True, and the same comment said that handing back the entity
was itself the check. Once `WireEntry` has `date`, the entity can no longer
be handed back, because the entity has no `date`. So that comment had to be
rewritten, and the controller now builds its answers. The prompt did not
say this would follow.

**e. "Paging … and the order of the list … behave exactly as before."** The
answers do. The statements do not, in one place: `GET /entries?date=` sent
two before and sends one now. I read "behave" as "answer", and say so here
in case it was meant more strictly.

**f. The prompt assumed nothing else was using the real database.** A dev
server was, in watch mode. See *The owner's database*. This is the item I
would act on first.

**g. Not wrong, but not said.** The decisions table says "the browser never
works a day out from `createdAt`". It does not say the browser never works
*today* out from its own clock. Before today that only cost an empty screen.
From today it costs a 404, and the owner's own first account will meet it
every night. See question 3.

---

## What the owner must do

**Nothing to her database.** There is no migration today.

1. **Restart is automatic** if her dev server is still running in watch
   mode. It is already running this code.
2. **Decide about the dev server and workers.** See *The owner's database*.
3. **Tell the web worker one thing** that is not yet in its prompt, if she
   agrees with it: never make a date from the browser's clock.
