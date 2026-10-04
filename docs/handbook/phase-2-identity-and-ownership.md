# Phase 2 — Identity and Ownership

**Days 8–14.** The question: *whose thought is it?*

---

## What the phase was for

At the end of Phase 1 the API stored journal entries and served them to
anyone who asked. There was no account, no password, no way to tell one caller
from another, and `GET /entries` returned every entry in the database. The
phase exists to close that, and the roadmap calls it *"the single most
important backend-architecture lesson — data belongs to someone."*

Seven days. It took longer, and two of them went somewhere the plan did not.

---

## The arguments worth keeping

### 1. Authenticated is not authorized, and the proof is a constant

Day 10's central lesson, and it survived because it was demonstrated rather
than asserted.

The obvious ownership check is to fetch the entry and compare:

```ts
if (entry.userId !== callerId) throw new ForbiddenException();
```

It does not work, and the reason is not a bug in the comparison. `userId`
carries `select: false`, so TypeORM never puts it in the result — `entry.userId`
is `undefined`. With `callerId` guaranteed to be a string, `undefined !== callerId`
is **always true**, so the check denies everybody including the owner.

The owner worked this out from an open question and then **held the position
against two rounds of pressure toward the wrong answer**, which is recorded in
the Day 8 learning report because being right under pressure is rarer than
being right.

The lesson generalises past this one check: **a condition that can only be
false is indistinguishable from a condition that is working**, until something
exercises both branches. Ownership moved into the `WHERE` clause (ADR-013),
where the database decides rather than the application.

### 2. 404 rather than 403, and why that is not pedantry

"You may not read this" tells an attacker the entry exists. "There is no such
entry" tells them nothing. ADR-013 chose 404 for both cases, so a caller
cannot use the API to discover what other people have written.

The same reasoning runs through the phase. Login answers identically for a
wrong password and an unknown address (ADR-012). Registration's conflict
message never echoes the address. None of these are separate decisions; they
are one decision applied three times — **an error message is an answer, and
answers leak.**

### 3. The pre-check is an optimisation; the constraint is the guard

This shape appears three times in the phase and is the most portable thing in
it.

Registration checks whether an address is taken, then inserts. Between those
two statements another request can insert the same address. The check does not
prevent the race — **the unique index does**, and the insert failing is what
the application has to handle.

So the pattern is: *application logic decides what to attempt; the database
decides what can exist.* The pre-check stays, because it gives a better error
in the ordinary case, but it is no longer load-bearing.

The owner stated this independently on Day 13 when designing `days`, before
seeing the registration code that already did it, and named the race it closes.
`findOrCreate` is written that way: try the insert, and on a unique violation
read back the row the winner created.

### 4. Defence in depth is only real if you test each layer alone

Day 14's mutation sweep produced the clearest version of this.

Email uniqueness is enforced twice — the lookup matches case-insensitively,
and the index is on `lower(email)`. Remove the `lower()` from the lookup and
one test fails; the duplicate is still caught, by the index. Remove it from the
index instead and a *different* test fails; the application check still handles
the ordinary path.

Neither layer alone is load-bearing, and each has its own test. That is what
defence in depth looks like when it is actually verified rather than claimed.

The same sweep found the inverse: `delete` and `setMood` both scope ownership
twice, and removing one of the two changes nothing. Those are redundant rather
than defended — correct, but the second check buys nothing a test can see.

### 5. A rule that exists in one place and is enforced in none

The project's recurring defect, and it appeared three more times this phase.

- The **entity list** lived in three files. Registering `Day` in one of them
  broke 61 tests with an error about metadata rather than about the change.
- The **provider list** for `EntriesService` was assembled by hand in three
  specs. Adding a dependency broke all three.
- **`transform: true`** was recorded as "offered and declined" while it had
  been enabled since Day 7.

Each was fixed by making the rule exist once: one exported `entities` array,
one `entriesProviders` helper, one corrected roadmap row.

The earlier instances — Day 6's deleted `validate,`, Day 7's removed
`APP_PIPE`, Day 8's `synchronize: true` — were all caught by mutation during an
audit rather than by a test. **Phase 2's version of the rule: a test that does
not fail when the wiring is removed has not been written.**

### 6. Generated migrations are a draft, not an answer

TypeORM's generator produced destructive or broken SQL on **five** of the
phase's migrations, and every one was read before it was run. The table below
lists all five.

| Migration | Generated | What was wrong |
|---|---|---|
| `AddUserPasswordHash` | — | `NOT NULL` column, rows copied without a value. Passes on an empty table, fails with one user |
| `AddUniqueUserName` | — | Rebuilt the table twice; the first rebuild was byte-identical |
| `AddSessions` | 277 lines | Dropped `UQ_users_name` on the way past |
| `RequireEntryOwner` | 299 lines | Six table rebuilds |
| `AddDays` | 506 lines | The `NOT NULL` bug again, plus dropping `UQ_users_name` again |

All five were hand-written instead. `AddDays` went from 506 lines to 96.

The reason is SQLite rather than TypeORM being bad: SQLite cannot alter most
column constraints, so the generator's only general strategy is to rebuild the
table — and a rebuild is a data migration wearing a schema migration's clothes.
**On SQLite, read every generated migration.** The habit should survive the
move to Postgres even though the failure mode will not.

### 7. Expand, backfill, contract

`entries.user_id` and `entries.day_id` both arrived nullable, were backfilled,
and only then became `NOT NULL` — in a separate migration, after the
application had been writing the column for a while.

That is not ceremony. A `NOT NULL` column added to a populated table in one
step fails on any row that predates it, and the failure happens in production
rather than in the test suite, because the test database is empty.

`day_id` is still at the expand step. Making it `NOT NULL` is scheduled, not
forgotten.

---

## What was got wrong, and what it cost

**I introduced a tenancy leak and the Day 8 test caught it.** Stamping
`userId` on create leaked it into the 201 response, because `create` returned
its in-memory object rather than reading the row back. The owner had identified
exactly this trap an hour earlier, in the abstract, while reasoning about
`@Exclude()` and the write path.

**I reported a concurrency bug that did not exist.** Day 14. My repro fired
eight transactions inside one `Promise.all` in a single tick — a state real
HTTP requests are never in — and the e2e failures were supertest rather than
the application, which a control test proved. Twelve concurrent writes against
the real server succeed with and without the fix I had built. All of it was
reverted.

**I broke a test so that it could not fail.** The timing test for the
unknown-user login path passed a bare name after the email rename, so both
branches took the unknown-user path and it compared the thing to itself. It
passed for three days and was found by mutation, not by reading.

Those three have one shape: **a test result was believed without checking that
the test was sound.** Day 11 produced the same lesson from the other direction,
where a sabotage silently failed to apply and the green suite looked like a
coverage gap.

---

## What Phase 3 inherits

**Working.** Registration and login with argon2id. Sessions with real
revocation — logout is immediate rather than bounded by token expiry. Ownership
in the `WHERE` clause on every read and write. Days as a first-class aggregate
with a 4am boundary. Mood. Pagination. Email as the identifier, enforced
case-insensitively.

**Known gaps, all deliberate and recorded.**

- **A user cannot be deleted.** Every foreign key is `ON DELETE NO ACTION`,
  which is the generator's default rather than a decision. *"Does deleting a
  user delete their journal?"* has been open since Day 8 and is still open.
- **`entries.day_id` is nullable.** The contract step of expand-backfill-contract.
- **No timezone.** The 4am boundary is computed in UTC. ADR-015 carries the
  argument and the revisit trigger.
- **Codes and passkeys are not built.** ADR-016 chose email plus password and
  deferred the rest.

**The constraint Phase 3 should know about.** Every route is closed by default
— `APP_GUARD` plus an explicit `@Public()`. A new endpoint requires
authentication unless someone says otherwise, which is the opposite of the
usual default and is the single decision most likely to prevent a leak.
