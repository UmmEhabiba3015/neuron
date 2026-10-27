# ADR-028: Postgres Locally — One Baseline, a Database per Test File, Dates as Text

**Status:** Accepted (she confirmed it on 2026-10-27). It replaces ADR-003's
SQLite.
**Date:** 2026-10-27 (feature 8, Going live, block 2, brought forward)

---

## Decision

The API runs on Postgres 17, locally in Docker (`compose.yaml`). The schema
is created by one baseline migration. Each test file makes its own database
in one Postgres server. The move changes no behaviour: dates stay `text`,
search still ignores capitals, and the laptop's SQLite data is archived, not
copied.

## Problem

Her husband brought this block forward on 2026-10-27, ahead of the rest of
feature 8. Every migration written on SQLite is one more to port later;
search (feature 10) needs Postgres; and feature 11's options widen with it.

Code written for SQLite does not simply run on Postgres. Her run showed the
two kinds of difference:

- **Loud:** `PRAGMA foreign_keys = OFF`, used by five of the fifteen
  migrations, is a syntax error on Postgres.
- **Silent:** `content LIKE '%morning%'` finds `Morning walk` on SQLite and
  nothing on Postgres, with no error. All 30 search tests used lowercase
  words, so all of them would have passed.

The worker found a third kind: two transactions (filing an entry and its
day, and a password reset) were atomic only because SQLite has one
connection. On Postgres's pool of connections, a query not sent through the
transaction's `manager` runs outside it.

## Alternatives

| Question | Chosen | Not chosen, and why |
|---|---|---|
| The migrations | One baseline written by hand from today's schema | Translating all fifteen: rewriting five table rebuilds and their tests to replay changes no Postgres database needs |
| Test databases | One server, a fresh database per test file | Testcontainers: a new dependency and a container per file. SQLite for unit tests: the `LIKE` run showed it hides differences |
| The laptop's data | Archived in `apps/api/data/sqlite-archive/`, not copied | A copy script: work and a check of its own, for writing made while building |
| Dates | Stay `text` | Postgres's date types: `Date` objects through the whole code and hundreds of tests, a second piece of work, with no problem today (Rule Zero) |

## Pros

- The tests run on the database the app runs on, so a silent difference
  shows up as a failing test.
- `pnpm test` took 19.9 s, against 21.1 s on SQLite (with 78 fewer tests,
  the old migration tests).
- Every behaviour difference found has a test: capitals in search, a
  duplicate email (`23505`), two requests making one day
  (`ON CONFLICT DO NOTHING`), and the two transactions.

## Cons

- `pnpm test`, `pnpm dev` and `migration:run` need Docker running.
- The history of the schema is in git, not in the migrations folder.
- `DATABASE_URL` is now required (ADR-007), so an old `.env` stops the start
  until it is updated.

## Tradeoffs and her choices on behaviour

- A NUL character in an entry or a name is refused with a 400. Postgres
  cannot store it, and SQLite stored it. Her choice: keep the 400.
- `ILIKE` and `lower(email)` fold accented letters (`É` matches `é`); SQLite
  folded only A to Z. Her choice: keep it.

## Future revisit conditions

- **Dates:** a bug from a malformed date string, or a need for date
  arithmetic in SQL, reopens the column types.
- **Collation:** Supabase may sort text differently from the local image.
  Only fixed-format ISO dates are ordered today, so it is harmless until
  free text is sorted.
- **Entries at the same instant** have no tiebreaker when paged. Revisit
  if one is seen.
