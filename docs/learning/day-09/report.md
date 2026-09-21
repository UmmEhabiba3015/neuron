# Day 9 — Password storage and identity

**Date:** 2026-09-13. One session. The roadmap permitted a split at "a user
exists" / "a request is identified", with Day 20 as slack. It was not needed.

Commit `4dd30ca`. ADR-011 (password storage), ADR-012 (endpoints).

---

## What she decided, and at which step

Scoring is the three-step sequence: **step 1** answered from an open question,
**step 2** after one narrowing question, **step 3** needed teaching.

| Block | Topic | Step |
|---|---|---|
| 1 | Why a plaintext password is a liability | **2** |
| 2 | Hashing vs encryption | **1** |
| 3 | Why bcrypt/argon2 are deliberately slow | **1** |
| 3b | Salting, and why per-user | **1** |
| 4 | Registration: one column, and what must not leak | **1** |
| 5 | Login: the enumeration decision | **1** |
| 6 | What the guard should attach | **1** |

Six of seven at step 1. The one at step 2 is block 1, and the narrowing question
was a single sentence — *"is the string in that column only useful against
Neuron?"* — after which she got there immediately.

### Block 1 — the liability

Her first answer named damage confined to this application: identity theft here,
reading private thoughts here, blackmail with the contents. All real, all bounded
by how important Neuron is.

One narrowing question produced the answer that matters:

> stealing this password could be the stepping stone as most people use the same
> passwords across multiple platforms

That is credential stuffing, and it inverts the liability: the blast radius is
set by the **user's other accounts**, which this project has no knowledge of and
no control over. A small unimportant app leaking plaintext passwords can end
somebody's finances.

### Block 2 — hashing vs encryption

At step 1, and her own summary is the whole block in five words:

> for a password, "recoverable" is the problem

She also declined to flatten the argument. Asked whether encrypting the column
solves it, she said encryption is *not* useless — it genuinely helps against
database-only theft — and then identified what it cannot do: the key must be in
the running process, so the security boundary includes the whole application
environment. Her final point was the one that actually decides it, and she
reached it unprompted: **with an encrypted column, the operator can read every
user's password.** That is insider risk, a subpoena that can be complied with,
and an employee having a bad day.

### Block 3 — deliberate slowness

At step 1, and she named the thing most explanations bury:

> password hashing is offline problem they do not need our server they can hash
> and run guesses locally

That is why speed matters and why rate limits are irrelevant. Measured on her
machine during the session:

```
SHA-256    578,457 guesses/sec   (one core, JavaScript, unoptimised)
argon2id        30 guesses/sec   (and 19 MiB of RAM per guess)
                                  — a factor of ~19,000
```

Her asymmetry argument was exact: *"a legitimate user does that once while
logging in while the attacker has to do it a thousands or billion times."*

### Block 3b — salting

All three sub-questions at step 1, including the one that usually needs teaching:
a rainbow table is built **once** and then each row is a constant-time lookup, so
scaling the user count does not help.

> you would assume that it will get harder by scaling but essentially it doesnt
> at the end of the day it is still looking up the phone book o(1)

And her reason for per-user rather than one application-wide salt: a shared
secret would be *"going back to encryption with extra steps"* — the right
instinct, sharpened in the session to the precise version (one shared salt is
still one precomputed table, just bespoke).

### Block 4 — registration

One column, and her reasoning was the correct one: splitting the PHC string would
mean re-gluing the pieces on every verify, *"a step whose only job is to undo
your schema decision"*.

**Then she found the trap, unprompted, and it is the best single observation of
the day:**

> select: false does not cover the register path... Registration doesn't read —
> it writes. And repo.save(user) returns the same object you handed it, which
> still has passwordHash sitting on it in memory.

Verified before any code was written:

```
WRITE path (registration):  passwordHash present  ← would have leaked
READ path (a later GET):    passwordHash absent   ← select:false worked
```

She chose `@Exclude()` + `ClassSerializerInterceptor` over a response DTO or a
`delete` statement, on the grounds that it is declared at the source and
therefore covers *"any controller, any service, any route that would return a
user"* — including the endpoint nobody has written yet.

### Block 5 — the enumeration decision

At step 1, with the arithmetic worked out herself: 100,000 addresses from an
unrelated breach, one login request each, and the differing messages sort them
into ~4,000 confirmed accounts. *"You've done their reconnaissance for them, at
your own expense, over your own API."*

Her second half is the part generic advice omits — what membership alone reveals
for **this** product. A journal account confirms that somebody keeps a written
record of their inner life, and that confirmation is free to *"a controlling
partner, an employer, a family member — anyone who suspects and wants
confirmation"*.

### Block 6 — what the guard attaches

At step 1. Load the user, not the token payload, and the deleted-user case
decides it:

> A journal account deletion is not a routine event — it's someone saying "I want
> out, now." Honouring that 55 minutes late is the wrong answer for this app
> specifically.

---

## The decision she made and then reversed

**bcrypt first, then argon2id.** The first choice followed this project's
four-time precedent of taking the conventional answer. She reversed it once the
OWASP position was on the table: argon2id is the current first recommendation,
bcrypt the still-acceptable second.

Recorded because the reversal is the reasoning, not a wobble. For a function
whose entire job is resisting attackers, the security recommendation outranks
familiarity.

A fact found while deciding, which weakens the "conventional" argument here
specifically: **`@nestjs/bcrypt` does not exist** — it 404s. NestJS ships no
hashing package at all. Unlike ADR-007/008/009/010 there was no first-party
answer to defer to.

---

## What the teacher got wrong

**The `@Exclude()` write-path trap was walked into within the hour.** Adding the
ownership stamp to `EntriesService.create` made the 201 body grow a `userId`
field, because `create` returned its in-memory object and `select: false` only
covers reads. This is *exactly* the trap she had identified for `passwordHash` in
block 4, in a different file. Caught immediately by the Day 8 test asserting an
exact key list rather than one absent field.

---

## Things found that were not the lesson

- **Both generated migrations needed hand-correction.** `AddUserPasswordHash`
  had a real bug: `password_hash text NOT NULL` followed by a row copy supplying
  no value for it — passes on an empty table, fails the moment one user exists.
  `AddUniqueUserName` was not wrong but rebuilt the table twice, the first
  rebuild byte-identical to what already existed.
- **Three Day 8 tests fired**, each written to record a decision deferred to
  Day 9: no credential column, no unique constraint, the exact column list.
- **Making `JWT_SECRET` mandatory broke `pnpm migration:run`**, which validated
  the whole config surface to change a schema. Fixed by narrowing:
  `loadMigrationEnvironment` checks `DATABASE_PATH` and nothing else.
- **pnpm blocked argon2's install script** as a supply-chain control. Read before
  approving (`node-gyp-build`, the standard prebuilt-or-compile pattern), and
  argon2 was verified to work with it still blocked.

---

## The code walkthrough — partly paid, partly owed

Run 2026-09-14, at her request, before Day 10.

| Topic | Step |
|---|---|
| Request path and guard-vs-pipe ordering | **1** |
| What `request.user` is, and the type that lies | **1** |

**Covered.** She predicted 401 for "no token + malformed body" and gave the right
reason — the guard runs before the pipe, so an unauthenticated caller is never
told whether their body was well-formed. Demonstrated: the same malformed body
returns 400 once a valid token is present.

On `request.user`, she named `AuthenticatedRequest` as *"the guard's
postcondition, not its precondition"*, identified that `user: User` is **a
conditional truth stated unconditionally**, predicted the exact runtime failure
(`TypeError: Cannot read properties of undefined` surfacing as a 500 where a 401
was meant — verified), and then proposed the structural fix unprompted:

> register the guard globally via APP_GUARD and make unauthenticated routes opt
> out with a @Public() decorator. Then user: User stops being a lie by discipline
> and becomes true by construction

**That shipped in Day 10.**

**Completed 2026-09-21**, in a second sitting after Days 9 and 10 were pushed.

| Topic | Step |
|---|---|
| The three services, and what a wrapper buys | **1** |
| The DTOs, and `forbidNonWhitelisted` | **1** |
| The test layers, and what a green suite proves | **1** |

### The services

Asked why `PasswordService` exists when it is seventeen lines of one-line
wrappers, she gave the framing the file is actually for:

> PasswordService isn't valuable because argon2.verify() is hard to call. It's
> valuable because it translates infrastructure/library behavior into your
> application's vocabulary.

Then went past the question. Asked what the wrapper buys when cost parameters
rise, she named parameter centralisation and then produced the **rehash-on-login
migration strategy** unprompted — verify an old-format hash, rehash with the new
one after a successful login, callers unchanged. That is the strongest argument
for the file existing and it was not put to her.

**One correction.** She said `TokenService`'s design decided that `undefined`
means "no". That is where it is implemented, not where it was decided — the rule
is ADR-005's and dates from Day 3, and the `?? undefined` in
`EntriesRepository.findById` and `UsersRepository.findByName` is the same
translation. Shown rather than argued:

```
TypeORM      null   → undefined     (repositories, Day 3)
argon2       throws → false         (PasswordService)
@nestjs/jwt  throws → undefined     (TokenService)
```

`TokenService` is the fourth application of an existing rule rather than a new
decision.

### The DTOs

On why `LoginDto` has no `@MinLength(8)`, she gave the account-lockout half at
step 1 — a policy that changes would reject existing short passwords before
verification ever runs, and login checks credentials rather than creating them.

**The half she did not name** is the information leak, and it is the same shape
as the enumeration oracle she *did* derive in block 5: a 4-character attempt
would answer 400 *"password must be longer than or equal to 8 characters"* while
a wrong 12-character one answers 401. Different status, different timing, and no
argon2 work done on the short one. Given rather than derived.

On `forbidNonWhitelisted`, step 1 and complete. She had `whitelist` stripping
unknown fields silently, `forbidNonWhitelisted` rejecting them with a 400, and
the reason the second is safer:

> If unexpected fields aren't rejected, you're relying on every downstream layer
> to correctly ignore dangerous properties.

Her summary — **fail closed at the API boundary** — is the right name for it.

### The test layers

All three at step 1. She named what only e2e can catch (routing, guard
registration, JWT configuration, header extraction, `request.user` being
attached at all) and gave the general rule in her own words: *"Unit tests verify
a component in isolation. E2E tests verify that the components work together
through the application's real external interface."*

The third question was the uncomfortable one — the suite was fully green during
the entire period when every signed-in user could read every other user's
journal — and she did not soften the conclusion:

> A green test suite does not prove "the application is correct." It proves "the
> application satisfies the scenarios that we actually tested."

And the durable version, which is better than the question asked for:

> Test coverage isn't just "how many lines/functions are exercised?" It's also
> "which security and business invariants have actually been challenged?"

Worth recording that the tenancy bug was **not** a line-coverage gap. `findAll`,
`findById`, `update` and `delete` were all heavily exercised. What was missing
was a second user in the room — a scenario, not a code path.

---

## Final tally

Nine topics across two sittings. **Eight at step 1, one at step 2.** Two
corrections were given rather than derived: where the `undefined` convention was
decided, and the `LoginDto` information leak. Two of her answers shipped as
code — `@Exclude()` over a response DTO, and `APP_GUARD` + `@Public()`.
