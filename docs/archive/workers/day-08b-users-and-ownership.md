# Worker Prompt — Day 8b: `users`, `user_id`, and the first real migration

## Context

Read `docs/decisions/ADR-009-identity-jwt-and-ownership-model.md` and
`docs/decisions/ADR-010-typeorm.md` — including ADR-010's **amendments**, which
were added after task 8a was audited.

Do **not** touch git. Do **not** add a dependency.

Task 8a moved this project to TypeORM and changed nothing observable. This task
changes the schema and still changes nothing observable. **No endpoint gains,
loses, or alters any behaviour.** All 96 unit and 32 end-to-end tests must pass
untouched, and if one needs changing, that is a finding for the report.

## Part 1 — close the audit finding first

ADR-010's most important rule is *migrations only; `synchronize` must be `false`.*
The audit set it back to `true` and got this:

```
lint ✅   typecheck ✅   build ✅   96 unit ✅   32 e2e ✅
```

Nothing failed. The rule lives in a comment and in a document and nothing enforces
it. That is the third consecutive day this shape has appeared, after Day 6's
deleted `validate,` and Day 7's removed `APP_PIPE`, and it is the worst of the
three: `synchronize: true` silently rewrites schemas rather than skipping a check.

**Add a test that fails when `synchronize` is `true`.** Assert on the options the
application actually builds, not on a copy of them written in the test. Its
acceptance criterion is below and it is not optional.

## Part 2 — the schema

### `users`

```
id          TEXT PRIMARY KEY
name        TEXT NOT NULL
created_at  TEXT NOT NULL
```

**No credential column.** Day 9's problem is that storing a password is a
liability, and it decides what goes there. Adding a column whose contents are
undecided is the thing this project keeps refusing to do (ADR-006's lesson: a
missing test is usually a missing decision).

`name` is not yet declared unique. Uniqueness is a login concern and login is Day
9. Say so in the report rather than adding it.

### `entries.user_id`

```
user_id  TEXT NULL, foreign key -> users(id)
```

**Nullable, deliberately.** No user can exist until registration arrives on Day 9,
so `NOT NULL` would require either a fictional placeholder owner or deleting the
existing rows. Nullable now and tightened once real users exist is the standard
staged shape — expand, backfill, contract — and Day 10 performs the contract step
when ownership is enforced.

Note that SQLite only enforces foreign keys when `PRAGMA foreign_keys = ON`. Find
out whether it is on for this connection and **report what you found**, because a
foreign key nobody enforces is a comment with extra steps.

### The migration

One migration, with a working `down()`. Generate it if TypeORM's generator
produces something correct; hand-write it if not. Either way **read it before you
trust it** — SQLite cannot always alter a table in place, and TypeORM's generated
SQL sometimes rebuilds the whole table, which is fine but must be seen rather than
assumed.

## Part 3 — the code

The entity gains the relationship. `EntriesRepository` continues to be the only
class that knows how storage works.

**No endpoint reads or writes `user_id` yet.** The API still has no idea who is
asking; that is Day 9 and Day 10. This task makes ownership *expressible*, not
enforced. Resist adding it to a DTO or a response body — an entry's JSON shape
must not change, and the end-to-end tests will tell you if it does.

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
```

Report real output. 96 unit and 32 end-to-end must pass, plus whatever Part 1
adds.

**Prove the migration works on a database that already has rows**, which is the
whole point of today:

1. Copy `apps/api/data/neuron.db` to a temporary location. It holds five entries
   written by the old `node:sqlite` driver.
2. Run `migration:run` against the copy.
3. Show the resulting schema, show all five entries are still there and readable,
   and show `user_id` is `NULL` for each.
4. Run `migration:revert` and show the schema returns.
5. Confirm `apps/api/data/neuron.db` itself was never opened.

Then start the application against the migrated copy and paste real responses for
`GET /entries`, `GET /entries/count`, a `POST`, and `GET /entries?word=100%25`.
A schema change that breaks search has failed.

### Acceptance criteria — verify by doing, not by reasoning

**Mutation A.** Set `synchronize: true`. Your new test from Part 1 **must fail**.
Restore and confirm green. If nothing fails, you have written a test of a copy of
the configuration rather than of the configuration.

**Mutation B.** Remove `user_id` from the entity. Something must fail. If nothing
does, the column exists in the database and in no test.

Paste real failure output for both.

Leave no server running. Delete throwaway databases.

## Report

Append to `docs/learning/day-08/report.md` under `## Part B: users and ownership`.

Answer directly:

1. **Is `PRAGMA foreign_keys` on for this connection?** If not, what does the
   foreign key actually do today?
2. **What SQL did the migration turn out to be** — an `ALTER TABLE`, or a full
   table rebuild? Paste it.
3. **Did the entry JSON shape change?** It must not have. Say how you know.
4. **What did you have to leave undone** because users cannot exist yet?
