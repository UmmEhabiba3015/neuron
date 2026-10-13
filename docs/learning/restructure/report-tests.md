# Restructure, part 2: the API's end-to-end tests — report

Returned by the worker as its final message on 2026-10-13 and saved by the
Master Thread. The audit passed with no follow-up: only test files changed,
and all nine checks passed again when re-run by the Master Thread.

## Summary

API unit tests 246 → **421** (33 suites). API end-to-end tests 365 → **42**
(15 suites, down from 25; about 12 s, was 56 s). Contracts 7 and web 170
unchanged. All three mutations were caught and restored:

- **Owner condition removed from `findById`:** failed `EntriesRepository ›
  the owner › is in every read…` and `another person's entry (e2e) › is a 404
  on every route…`.
- **A reused refresh token allowed to succeed:** failed `AuthService ›
  refresh › ends every session of the person… when a replaced token is used
  again`, `signing in and out (e2e) › ends every session of the person when an
  old refresh token is used again`, and `… › reads the refresh token only from
  the cookie, and answers every bad cookie alike`.
- **Soft-deleted entries let into `GET /entries`:** 12 tests failed, among
  them five `EntriesRepository › a deleted entry › is never listed or
  counted…`, `the journal (e2e) › writes, lists, reads, edits and deletes an
  entry…`, `search, pages and the count (e2e) › counts exactly what paging
  reaches…` and `the application source › never uses withDeleted`.

## 1. What changed

The 30 flat files in `apps/api/test` became four folders of flows plus
`support/`. Every removed end-to-end case was checked against a unit test;
where none existed, the case moved down into a new unit test beside the code
(175 new unit tests). Nothing under `src/` changed except spec files.

- `test/support/`: the test database, clock, cookie and provider helpers,
  and a new `app.ts` (`startApp`, `stopApp`, `as`, `messagesFrom`).
- `test/auth/`: `sign-in` (6), `accounts` (3).
- `test/entries/`: `journal` (3), `ownership` (3), `search-and-pages` (3).
- `test/days/`: `today-and-mood` (4), `range` (2), `future` (3),
  `timezone` (3).
- `test/app/`: `routes-closed` (3), `responses` (1), `cors` (2),
  `configuration` (3), `built-output` (2), `main` (1).
- New unit specs for the auth service, the guard, the refresh cookie and
  token, every request and response DTO, the days service and controller,
  and the entries repository. Tests added to the existing days repository,
  find-entries query, entries service and users service specs.

## 2. Decisions and assumptions

- Existing unit specs changed only their import paths.
- Login timing: the wall-clock comparison became a unit test with a spy,
  checking that an unknown address still runs argon2 verify against a hash.
  The timing measurement itself was unreliable.
- The global pipe's rejection of unknown fields is proven once each on
  `POST /entries`, `GET /entries` and login.
- One sweep, `app/responses`, walks every route that returns a body, before
  and after a delete, and checks no private field appears. The response DTO
  unit tests cover each shape.
- `synchronize` and `env-file` merged into `app/configuration`;
  `built-output` went from 4 tests to 2. `main` stays separate: it is the only
  suite that loads the contract through ts-node, which the migration CLI uses.

## 3. Checks

All nine passed: API unit 421 (33 suites), contracts 7, API end-to-end 42
(15 suites), web 170.

## 4. Mutation

Three, listed in the summary.

## 5. Browser walk

No screens changed.

## 6. Noticed, not done

- ADR-007, ADR-010 and ADR-012 and several learning reports name the old test
  files. Left as history.
- `entries.service.spec` has two `describe('create')` blocks and old method
  names in its describe titles.
- `users.service.spec` registers `'umer'`, which is not an address, and says
  "name" where it means email; `entry-ownership.spec`'s "should require names
  to be unique" tests email uniqueness.
- `EntriesRepository.save` and `SessionsRepository.deleteExpiredBefore` are
  never called.

## 7. Concepts a learner may not know

- **Test pyramid:** many fast unit tests, a few slower end-to-end ones.
- **Spy:** a wrapper that records calls to a real function.
- **Mutation:** breaking one line on purpose to prove a test notices.
- **N+1 queries:** one query for a list, then one more per item.
- **Global pipe:** the validation step Nest runs before every handler.
- **Fake clock:** replacing `Date` so a test decides the time.

## Appendix: where each removed case's rule is now tested

The worker's full table maps every removed case (about 130 rows) to the unit
or flow test that now covers it. In summary, by old file:

| Old file | Now covered by |
|---|---|
| `app` (entries routes) | `entries/journal`, `entries/search-and-pages`; `create-entry.dto`, `update-entry.dto`, `find-entries-query.dto`, `entries.service`, `entries.controller` specs |
| `auth` | `auth/sign-in`, `auth/accounts`, `app/routes-closed`, `app/responses`; `auth.service`, `jwt-auth.guard`, `register.dto`, `users.service`, `password.service`, response DTO specs |
| `built-output`, `config-wiring`, `env-file`, `synchronize`, `cors`, `main-wiring` | `app/built-output`, `app/configuration`, `app/cors`, `app/main`; `env.validation`, `database.module` specs |
| `count-agrees-with-list`, `pagination`, `entries-by-date`, `entry-date` | `entries/search-and-pages`, `entries/journal`; `entries.repository`, `find-entries-query.dto`, `count-entries-query.dto`, `entry-response.dto`, `require-entry-day` specs |
| `days`, `days-range`, `mood`, `today`, `future-days`, `timezone-days` | `days/*` flows; `days.service`, `days.controller`, `days.repository`, `day-boundary`, `set-mood.dto`, `day-date-param.dto`, `days-range-query.dto` specs |
| `email-identity`, `registration-profile` | `auth/accounts`; `register.dto`, `users.service`, `auth.service`, `add-user-name-and-timezone` specs |
| `ownership`, `soft-delete` | `entries/ownership`, `entries/journal`, `app/responses`; `entries.repository`, `entries.service` specs |
| `refresh-cookie`, `sessions`, `stale-credentials` | `auth/sign-in`, `app/routes-closed`; `refresh-cookie`, `refresh-token.service`, `auth.service`, `jwt-auth.guard`, `session-response.dto` specs |

The row-by-row table was reviewed by the Master Thread in the worker's
message of 2026-10-13.
