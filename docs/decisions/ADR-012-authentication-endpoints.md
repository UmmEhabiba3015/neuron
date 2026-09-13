# ADR-012: Registration, Login, and How a Request Is Identified

**Status:** Accepted
**Date:** 2026-09-13 (Day 9)

**Implements:** ADR-009's decision that identity is carried by a signed token.
**Depends on:** ADR-011 (how the credential is stored).
**Preserves:** ADR-004's repository boundary, ADR-005's layering, ADR-007's
boot-time configuration rule.

---

## Decision

1. **`POST /auth/register`** creates a user. 201, returns the user, 409 when the
   name is taken.
2. **`POST /auth/login`** returns a token and the user. 200, and **one 401 with
   one message for every way it can fail**.
3. **`GET /auth/me`** names the caller — the endpoint that demonstrates the
   server knows who is asking.
4. **`JwtAuthGuard` protects every `/entries` route**, and `POST /entries`
   records the caller as the entry's owner.
5. **`JWT_SECRET` is required with no default**, and the application refuses to
   start without it.

---

## Decision 1: registration says when a name is taken; login never does

These two endpoints answer the same underlying question — "does this account
exist?" — and they answer it differently on purpose. The asymmetry is the
decision.

**Registration says so.** `409 Conflict` with "That name is already taken",
because the caller needs to know to pick another, the body was well-formed so
400 would be wrong, and **the same fact is obtainable by anyone who simply
attempts to register**. Concealing it would make registration untestable by the
person using it and would conceal nothing.

**Login never says so.** No such name, no password set, and wrong password all
produce one 401 and one string: `"Invalid name or password"`.

The reason is that login is reachable with a list of names and no intention of
creating anything. Distinguishing the failures turns it into a **user
enumeration oracle**:

```
attacker holds 100,000 addresses from an unrelated breach
sends one login request each, with any password

  "No account with that name"  ->  discard
  "Incorrect password"         ->  confirmed account, keep

result: a verified membership list, no cracking, one pass
```

Every later attack — credential stuffing, phishing, password spraying — then runs
against 4,000 real accounts instead of 100,000 guesses. The service has performed
the attacker's reconnaissance, at its own expense, over its own API.

**For a private journal, membership is itself the sensitive fact**, and this is
where the generic advice stops being generic. Knowing somebody has a Neuron
account reveals that they keep a written record of their inner life, deliberately,
somewhere they expect nobody to read. That is a precondition for extortion and
for targeted phishing — and it is available to anyone who already knows them. A
controlling partner, an employer or a family member who suspects and wants
confirmation gets it for free, from this API, in one request.

### Identical messages are not enough on their own

argon2 is ~60ms of deliberate work (ADR-011). An early return for an unknown name
answers in about a millisecond while a wrong password takes sixty, so **the
response time says exactly what the message refused to**, and a stopwatch is as
easy to read as a string.

So an unknown name is charged the same work: `AuthService.login` verifies the
submitted password against a fixed, real argon2 hash of a discarded random value.
Measured over HTTP after implementation:

```
wrong password : 0.058731s
unknown name   : 0.058591s
```

The constant is not a secret — no account has it and no password produces it. It
is hard-coded rather than computed at boot so that process start does not pay
60ms for a value that never changes.

Both halves are pinned by tests, and each was verified to fail on its own:
removing the dummy verify failed **only** the timing test, and making the
messages helpful failed **only** the equality test. They cover different channels
rather than overlapping.

### `LoginDto` is deliberately thinner than `RegisterDto`

Re-applying `@MinLength(8)` on login would be a leak rather than tidiness: a
4-character attempt would return 400 with "password must be longer than or equal
to 8 characters" while a wrong 12-character one returned 401, so the response
would separate "too short to be anybody's password" from "wrong". It would also
break every account whose password predates a future rule change.

---

## Decision 2: the guard loads the user rather than trusting the token

A verified token yields `{ sub, name, iat, exp }`, and that would be enough to
identify a caller with no database read at all. The guard does the read anyway.

**Every field in a token is a claim frozen at login and valid for an hour.** A
user deleted five minutes ago would keep working for the remaining fifty-five.
Deleting a journal account is somebody saying *"I want out, now"*, and honouring
that an hour late is the wrong answer for this application in particular. The
same reasoning covers a disabled account and a password reset after a compromise:
each is a revocation, and **a frozen claim cannot be revoked**.

The cost is one indexed primary-key lookup per authenticated request, on a
connection the request was going to open anyway.

The payload carries `name` as well as `sub`, for the same reason the login
response carries the user: a client rendering a shell should not need a second
request to learn who it is signed in as. It is a convenience and never a fact to
trust for authorisation — `sub` is the identity, and it is resolved against the
database rather than believed.

**Nothing sensitive goes in the token, and that is a property of the format
rather than a convention.** A JWT is signed, not encrypted: the payload is
base64url and anyone holding the token can read it without the secret. The
signature prevents *change*, not *reading*.

---

## Decision 3: one 401 body, and the reason in a header

The guard can be reached with no header, a malformed token, a well-formed token
signed with a different secret, an expired token, or a valid token whose user has
been deleted.

**The body is identical for all of them.** Separating "signature failed" from
"not a token" confirms that a value was structurally valid and reached the
signature check, which is a fact about this server's signing setup and is useful
only to somebody probing it. "Valid token, no such user" is a fact about who has
been deleted, reachable by anyone holding an old token.

**Expiry is distinguished, in `WWW-Authenticate` rather than in prose.** This is
safe for a reason the login rule does not share: *the requester already holds the
token*, so being told it expired reveals a fact about an object in their own
hand. No account is confirmed and nobody else is exposed. A client needs the
distinction to tell "refresh and retry" from "send the user to log in" — without
it, every 401 triggers a logout, including the routine hourly one.

```
WWW-Authenticate: Bearer error="invalid_token", error_description="..."
body:             {"message":"Unauthorized","statusCode":401}
```

RFC 6750's registered codes, and a body that leaks nothing to anything that logs
or displays it.

---

## Decision 4: `JWT_SECRET` has no default and no fallback

ADR-007 built boot-time configuration checking before there was a secret to put
through it. This is what it was for, and it is the first variable with neither a
default nor an optional path.

- **A default in source** would let anyone who can read the repository forge a
  token for any user. That is worse than having no secret, because it looks
  configured.
- **A random value at boot** silently invalidates every token in circulation on
  every restart, and nothing reports it.

So the application refuses to start. This is stricter than the `DATABASE_PATH`
rule, which only warns, and the difference is what failure looks like: a mistyped
database path produces an empty journal, which is recoverable, while a weak or
shared signing key produces forged identities, which is not.

A **32-character minimum** is enforced. It is a length floor rather than an
entropy test, because entropy cannot be measured from a single string — `"aaa…a"`
and a random 32-byte value are indistinguishable to any check this function could
make. What a floor does rule out is the failure that actually happens:
`JWT_SECRET=secret` copied from a tutorial, which is in every wordlist.

**The error never prints the value.** Every other message in `env.validation.ts`
quotes what it received; doing that with a signing key would write it into logs,
terminal scrollback and CI output. A test asserts the rejected value is absent
from the message.

### The migration CLI checks only what it uses

Making `JWT_SECRET` mandatory broke `pnpm migration:run`, which was not
anticipated and is recorded because the fix is a rule rather than a patch.

`data-source.ts` called `loadEnvironment()`, which validates the application's
whole configuration surface. So a schema change suddenly required a signing key
that no migration will ever use — a deployment would have to hand a secret to a
tool with no business seeing one, and a fresh clone would fail to migrate for a
reason unrelated to databases.

`loadMigrationEnvironment()` validates `DATABASE_PATH` and nothing else, through
the same `parseDatabasePath` the server uses, so the two cannot drift into
disagreeing about what a valid path is. **The variable each entry point needs is
the variable each entry point checks.**

---

## Decision 5: the guard goes on `/entries` today, and writes record their owner

Before Day 9 the entire journal was readable by anyone who knew the URL. The
staging is deliberate and the middle state is stated honestly:

```
before Day 9   anyone reads every entry
after  Day 9   any registered user reads every entry
after  Day 10  each user reads their own
```

The middle state is still wrong and is strictly better, and it gives Day 10
something concrete to fix rather than a hypothesis. The roadmap names that day
exactly: *authenticated is not the same as authorized*.

`POST /entries` records the caller's id, so **the set of ownerless rows is closed
rather than growing**. Rows written before today stay NULL and are Day 10's to
backfill; nothing written from now on joins them. The owner comes from the
verified token and never from the body — a `userId` field on `CreateEntryDto`
would let any caller write into anybody's journal.

The guard is applied to the controller class rather than to each method, so a
route added later is protected by default and opting one out is a visible,
deliberate act.

### A bug this caused, and the Day 8 test that caught it

Adding the ownership stamp broke the HTTP contract immediately.
`EntriesService.create` returned the in-memory object it had just built, which
carries `userId`, so the 201 body grew a field it never had — while every *read*
stayed correct, because `select: false` covers the read path.

**This is the same trap as `@Exclude()` on the write path** (ADR-011), in a
different file, walked into within an hour of documenting it. It was caught
immediately by the Day 8 test asserting the exact key list rather than one field,
and fixed by reading the entry back after insert.

---

## Two migrations, both hand-corrected after reading the generated SQL

The README's rule — *"read what it produces before trusting it"* — earned its
keep twice in one day.

**`AddUserPasswordHash` had a real bug.** `migration:generate` produced
`password_hash text NOT NULL` followed by a row copy that supplied no value for
it. That passes on an empty `users` table, because there are no rows to copy and
the constraint is never tested, and fails with a NOT NULL violation the moment
one user exists. The table was empty, so every test would have gone green and the
failure would have belonged to whoever ran it against a database where somebody
had registered. Replaced with a nullable `ALTER TABLE … ADD COLUMN`, and verified
against both an empty table and one with an existing row.

**`AddUniqueUserName` was not wrong but did the work twice.** Eight statements:
a full table rebuild whose `CREATE TABLE` was byte-identical to the existing one,
then a second rebuild that added the constraint. Two copies of every row and two
`DROP TABLE`s to add one index. Replaced with `CREATE UNIQUE INDEX`, which SQLite
supports directly — one statement, no copy, no drop — and which login's
`findByName` uses on every request.

---

## `users.name` is unique, and the pre-check is not the guard

Day 8 deliberately left the constraint off and recorded its absence in a test,
noting that uniqueness only becomes meaningful once a name is what somebody
authenticates *as*. Day 9 is that day.

`UsersService.register` checks `findByName` before inserting, and **that check is
an optimisation rather than the guard**: it is a read followed by a write, so two
concurrent registrations can both pass it. The unique index is what no race can
slip past, and the service catches the constraint violation so the loser of the
race gets the same 409 rather than a 500.

The catch is narrowed to `SQLITE_CONSTRAINT_UNIQUE` inside a `QueryFailedError`.
A bare `catch` would report a disk error, a closed connection or a schema
mismatch to the caller as "that name is taken", which is a lie that would be very
hard to debug. The driver-specific code is isolated in one function because Day
24 swaps `better-sqlite3` for `pg`, whose code for the same condition is `23505`.

---

## Accepted costs

- **`@nestjs/jwt` is a fourth runtime dependency.** First-party, on the same
  footing as `@nestjs/typeorm` (ADR-010).
- **Every `/entries` request now costs a token verification and a user lookup**,
  and every login or registration costs ~60ms of argon2.
- **Logout still cannot work**, exactly as ADR-009 recorded. One-hour expiry is
  the whole of revocation until Day 11 adds refresh tokens, and it is the window
  in which a stolen token is usable.
- **A test helper now authenticates on behalf of 46 existing assertions.** The
  unauthenticated case is not lost — `auth.e2e-spec.ts` asserts those same routes
  answer 401 without a token — but the helper does hide the header from the
  suite that uses it.
- **The `users` table has a row nothing can log in as**, if any database has a
  user created before today. Recorded rather than migrated, because inventing a
  credential is worse than an account that cannot authenticate.

---

## Future Revisit Conditions

Revisit **on Day 10**, which enforces ownership. The middle state above is the
thing that day exists to remove, and `entries.user_id` becomes something a query
must select by name.

Revisit **on Day 11**, which the roadmap names: *tokens don't expire, and logging
out does nothing*. One hour is a mitigation, not an answer.

Revisit **the enumeration decision** if registration ever becomes invite-only or
email-verified, at which point 409 on register could be replaced by a generic
"check your email" and the asymmetry documented here would no longer be forced.
