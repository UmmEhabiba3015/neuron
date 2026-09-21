# Day 10 — Authenticated is not the same as authorized

**Date:** 2026-09-14. One session, four blocks. Commit `4401cda`. ADR-013.

---

## What she decided, and at which step

| Block | Topic | Step |
|---|---|---|
| 1a | Why the controller-side check is wrong | **2** |
| 1b | Why a list cannot be fetched-then-filtered | **1** |
| 2a | Does `select: false` block a `WHERE` clause? | **1** |
| 2b | Explicit parameter vs request-scoped state | **1** |
| 3a | Where ownership goes in `update` | **1** |
| 3b | What `affected === 0` means | **1** |
| 4 | The legacy rows, and `NOT NULL` | decision, not a question |

### Block 1a — the two problems with checking in the controller

She named the **403/404 existence oracle** immediately and unprompted:

> A caller walking ids learns exactly which entry ids are real and which are
> other people's — without ever reading a body... Both cases should return
> NotFoundException. Nonexistent and not-yours must be indistinguishable from
> outside.

That is the same decision as ADR-012's login rule, reached independently from the
write side.

The second problem needed narrowing, and then teaching. Asked what
`entry.userId` holds after an ordinary `findOneBy`, she answered about what the
column *is* rather than what the value *is*. A second narrowing question did not
land either, so it was demonstrated rather than asked a third time — correctly,
per the two-attempts rule:

```
DATABASE holds:      { id: 'e1', user_id: 'alice' }
findOneBy returned:  { id: 'e1', content: '...', userId: undefined }

Bob   asking for Alice's entry  ->  undefined !== 'bob'    ->  FORBIDDEN
Alice asking for her own entry  ->  undefined !== 'alice'  ->  FORBIDDEN
```

**The check is a constant.** It denies everybody including the owner, and it
passes its own test — "Bob cannot read Alice's entry" goes green while the
feature is entirely broken.

This is the same `select: false` scope problem she *did* catch unprompted on Day
9 for the write path. Worth noting: she has now seen it in two forms and derived
it once.

### Block 1b — lists

At step 1, and she went past what was asked. Beyond the obvious "other people's
rows are in memory", she named the failures that surface later:

> Counts and aggregates are wrong... Sorting is wrong. "Ten most recent" is ten
> most recent globally, then filtered.

And the consequence of the data having left the boundary at all: *"A log line, an
error serializer, or a debug dump is now an incident."*

### Block 2 — the reads

Predicted correctly that `select: false` does not interfere with a `WHERE`
clause, with the right reason — it is metadata about the SELECT list, and the
query builder compiles the predicate independently. Confirmed:

```sql
SELECT "e"."id", "e"."content", "e"."created_at"          -- user_id absent
FROM "entries" "e"
WHERE ("e"."content" LIKE ? ESCAPE '\' AND "e"."user_id" = ?)   -- and present
```

On explicit parameters versus request-scoped state, her argument named the
decisive property:

> instead of forgetting a parameter — which is a compile error when the parameter
> is required — you forget to establish the context, which is a runtime condition
> that only some call paths hit

Same standard she applied to `APP_GUARD`: prefer the failure that is loud. She
also made the self-documentation point — `findAll()` reads as "all entries" and
cannot be misread as `findAll(userId)`.

### Block 3 — the writes

Both at step 1. Ownership goes in the **criteria**, not a pre-check, and she
applied her own Day 9 framing without being reminded of it:

> A is the pre-check, and Day 9's framing applies directly: a read followed by a
> write is two statements with a gap between them.

On `affected === 0` having two causes, she concluded the controller *must not*
distinguish them and called the ambiguity **"free correctness"** — the collapse
is the behaviour you would have to implement deliberately if the driver reported
more.

**The sharpest line of the day** was about `delete`, which must read the row
because it returns it:

> the read is for the payload, not for the authorization — and that distinction
> is what keeps it safe

She then kept `userId` in the delete criteria anyway, correctly: dropping it
would make the read the guard again, and the worst case with it is a wasted read.

### Block 4 — the legacy rows

A decision about her own data rather than a question. She chose to delete the
five Day 3 entries (an empty string, a single space, `"23.0"`, two test
sentences) and to make `user_id` `NOT NULL`.

The deletion was done as a **one-off command against her file**, not as a
migration, because a committed `DELETE FROM entries WHERE user_id IS NULL` runs
on every database including ones its author has never seen. Backed up first.

---

## What changed on her real database

Three things, all on `apps/api/data/neuron.db`:

1. **Baselined** — one row inserted into a `migrations` table it did not have.
2. **Migrated** — all three pending migrations applied. This closes ADR-010
   amendment 6 on the real file, nine days after it was demonstrated on a copy.
3. **Five orphaned entries deleted.** Backup at
   `data/neuron.db.backup-20260914-132206`, gitignored.

---

## The structural fix that came out of the Day 9 walkthrough

`JwtAuthGuard` moved from per-controller `@UseGuards` to a global `APP_GUARD`
with `@Public()` as the opt-out — her proposal, from the previous day's session.

Verified by adding a route with no decorators at all:

```
GET /auth/brand-new-route   (nothing on it)  ->  401
POST /auth/register         (@Public())      ->  201
```

The default has inverted. **Forgetting to opt out breaks a route loudly on the
first request; forgetting to opt in leaks data silently.** This is the fourth
instance of the same gap this project has recorded — Day 6's deleted `validate,`,
Day 7's removed `APP_PIPE`, Day 8's `synchronize: true` — and the first closed by
changing the default rather than by adding a test.

---

## Things found that were not the lesson

- **The generated migration was discarded for the third time in two days.**
  `migration:generate` produced 299 lines rebuilding the tables **six times**,
  including rebuilding `users` twice for a change that does not touch it.
  Replaced with one rebuild.
- **The replacement migration refuses to run when orphans exist** rather than
  deleting or reassigning them. Verified: the orphan survives, the migration
  fails with a message saying what the operator must decide.
- **Three more Day 8 assertions fired**, all written to record decisions deferred
  to Day 10: `user_id` nullable, entries storing NULL owners, and the column
  list.
- **Both new isolation tests were verified to fail** when the protection is
  removed — `findAll` unfiltered fails the read test and only that one; `update`
  unscoped fails the write test and only that one.

---

## Where the tests stood

131 unit, 86 e2e. Ten new ownership tests covering two users, and five pinning
the guard default.

**Worth noting what did not exist before:** every prior e2e test used a single
user, so none of them could have caught a tenancy bug. The suite was green
throughout the period when every signed-in user could read every entry.
