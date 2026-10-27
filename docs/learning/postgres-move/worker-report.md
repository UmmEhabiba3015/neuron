# Worker report: the Postgres move (feature 8, block 2, locally)

Spec: `docs/workers/postgres-move.md`. Saved by the Master Thread on
2026-10-27.

## 1. What changed
The API now runs on Postgres. The schema comes from one hand-written baseline migration. Every test file makes its own database in one Postgres server and drops it at the end. Four behaviour differences are fixed, and each has a test.
- `compose.yaml` (new): `postgres:17-alpine` on 127.0.0.1:5432, volume `neuron-postgres`, all three values `neuron`.
- `apps/api/package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`: `pg` 8.23.1 pinned; `better-sqlite3` and its allowBuilds line removed. `@types/pg` is not needed. Both Jest configs gain `globalSetup`.
- `config/env.validation.ts` and spec: `DATABASE_URL` is required, checked like `WEB_ORIGIN`, and the migration CLI uses the same check. `DATABASE_PATH` is gone.
- `database/database.module.ts`, `data-source.ts`, spec: `type: 'postgres'`, `url`.
- `database/migrations/1793123529224-Baseline.ts` and `index.ts`; the 15 old migrations and their 7 specs are deleted; `database/baseline.spec.ts` (new) tests up, down and up again.
- Entities (day, session, password-reset, user): the existing FK and index names are declared, so `migration:generate` reports "No changes".
- `entries/audio-storage.ts`, `audio.module.ts`, spec: `AUDIO_PATH` defaults to `apps/api/data/audio`, fixed.
- `entries/entries.repository.ts`: `ILIKE` with the escape character kept. A search term containing NUL matches nothing.
- `users/users.service.ts`: a duplicate email is detected by code `23505`. `users.repository.ts`: an email containing NUL finds nobody.
- `days/days.repository.ts`, `days.service.ts`, `entries/entries.service.ts`: `findOrCreate` uses `INSERT … ON CONFLICT DO NOTHING` and then reads the row back, and it runs on the transaction's manager.
- `auth/password-reset.service.ts` plus the resets, sessions and users repositories: every reset step gets the transaction's manager.
- `shared/decorators/contains-no-nul-character.decorator.ts` (new), applied to entry `content` (create and update) and the register `name`.
- `test/support/test-database.ts`, `check-postgres.ts` (new), `setup-environment.ts`, `app.ts`, plus 13 spec files ported (`$1` placeholders, `information_schema` in place of PRAGMA, Postgres error texts).
- `.env.example`, `docs/SETUP.md`, `README.md` (its config table row).

## 2. Decisions and assumptions
- **Day race:** the spec offered two fixes, and I chose `ON CONFLICT DO NOTHING`. `findOrCreate` runs inside the entry transaction, where catching the error and reading again would fail. It works the same inside or outside a transaction, so there is no error to detect for days.
- **Transactions:** `EntriesService.file` and `PasswordResetService.reset` relied on SQLite's single connection. On a Postgres pool they had stopped being atomic, so both now pass the manager down, as `AudioKeysRepository.ofUser` already did.
- **NUL in stored text:** content and name containing NUL get a 400 (on Postgres they would be a 500). A NUL in a search term or a sign-in email is not sent to the database: the search returns `[]` or 0 and the sign-in returns 401, the same answers as on SQLite. Login keeps one failure answer (ADR-012).
- **Error messages:** a rejected `DATABASE_URL` is quoted with its password masked.
- **Tests:** each file migrates its database once and truncates every table before each test. The drop hook allows 60 s, because under 12 workers a `DROP DATABASE` took up to 5 s.
- **Foreign keys off in one test:** jwt-auth.guard.spec uses `SET LOCAL session_replication_role = replica`, which needs a superuser. `neuron` is one in this image.

## 3. Checks
All nine passed: lint, typecheck, build, test (585 API unit tests, 50 suites, plus 10 contracts), test:e2e (68 tests, 22 suites), lint:web, typecheck:web, build:web, test:web (290 tests plus 5 component tests). The unit tests ran three more times with no flakes.
`pnpm test` took 21.1 s before (SQLite, 663 tests) and 19.9 s after (Postgres, 585 tests). The count drops because the 7 migration spec files are deleted.

## 4. Mutation
I changed `ILIKE` back to `LIKE` in `entries.repository.ts`. Exactly one test failed: "EntriesRepository › the word filter › ignores capitals: morning finds Morning walk, and the count agrees". Then I restored it.
I also broke each other fix once, and each has a test that fails:
- without the manager: the voice-memo day rollback and the reset rollback tests;
- with the old error code: the two-registrations-at-once test;
- without `orIgnore`: the lost-race test.

## 5. Browser walk
No screens changed. I migrated a database in my container and started `dist/main` on 3100 with the web app on 3101 (the page answered 200). Through the API I ran:
- register, then sign in as `Walk@Example.com`: 201, 200;
- write "Morning walk by the canal": 201;
- `?word=MORNING` and `?word=morning` both find it, `count?word=Canal` gives 1;
- an entry with NUL gives 400, a NUL search gives `[]`, re-registering the email in other capitals gives 409;
- logout gives 204, and `/auth/me` afterwards gives 401.

Both servers are stopped. `neuron-worker-postgres` is removed; its anonymous Docker volume is probably still there.

## 6. Noticed, not done
- `CLAUDE.md` rule 3 still says `DATABASE_PATH=/tmp/neuron-worker.db`; workers now need `DATABASE_URL` and `TEST_DATABASE_URL`. ADR-003, ADR-007 and ADR-012 still describe SQLite.
- `ILIKE` and `lower(email)` now fold non-ASCII letters (É and é match); SQLite folded only ASCII.
- The image's `en_US.utf8` (musl) sorts like C, but Supabase's glibc or ICU collation will not. Only fixed-format ISO dates and times are ordered or compared, so this was checked and is harmless.
- Entries with the same `created_at` have no tiebreaker, so on Postgres paging between them is not guaranteed. I did not change it.
- A voice memo's MIME parameters (`audio_type`) are stored without a NUL check.
- `pnpm peers check` warns about `@types/node` for vitest; that warning was there before.

## 7. Concepts a learner may not know
- `23505`: Postgres's error code for a unique violation.
- Aborted transaction: after any error, Postgres refuses every further statement until rollback.
- Connection pool: several connections at once, so a query outside the transaction's manager runs outside the transaction.
- `ON CONFLICT DO NOTHING`: an insert that skips a row that would break a unique index, instead of failing.
- `ILIKE`: Postgres's case-insensitive LIKE.
- `TRUNCATE`: empties tables at once; faster than DELETE.
- Jest `globalSetup`: code that runs once before all test files.

## Master Thread's audit (2026-10-27)
- The baseline matches the old schema: every index of the 15 migrations that
  was not later dropped is in it, and `CHK_entries_kind` is word for word.
- The nine checks re-run against a throwaway Postgres: all pass (585, 68,
  290, 5, 10), in 91 seconds for the nine; no test database left behind.
- The worker found a real fault the spec did not name: two transactions
  were atomic only because SQLite has one connection.
