# ADR-011: Passwords Are Hashed With argon2id, Never Stored Or Recoverable

**Status:** Accepted
**Date:** 2026-09-13 (Day 9)

**Completes:** ADR-009, which named a `password` column "for completeness" and
said in the same paragraph that it would not survive Day 9.
**Preserves:** ADR-004's repository boundary, ADR-005's layering, ADR-007's
configuration rule.

---

## Decision

1. **Passwords are hashed with argon2id**, via the `argon2` npm package, at the
   library's default parameters (`m=65536`, `t=3`, `p=4`).
2. **One column**, `users.password_hash`, holding the whole PHC string.
3. **Nothing can recover a password**, including the people who run the server.

---

## The problem, stated as damage rather than as a rule

"Don't store plaintext passwords" is a rule everybody already knows and which
explains nothing. The question worth answering is what a stolen database file
actually costs, and the answer is not confined to this application.

The obvious damage is bounded by how important Neuron is: someone reads a
private journal, edits it, or uses its contents for leverage. All real, all
proportional to the value of this one service.

**Credential stuffing is not bounded that way.** Most people reuse passwords, so
an email-and-password pair from a breach here is replayed automatically against
banks, email providers and employers. The blast radius is set by the *user's
other accounts*, which this project has no control over and no knowledge of. A
small, unimportant application leaking plaintext passwords can end somebody's
finances.

That inverts the liability. **Storing a plaintext password means holding
something whose value to an attacker vastly exceeds its value to the holder**,
on behalf of people who never agreed to that risk and mostly do not know they
are taking it. The user believes they handed over a key to a journal. They
probably handed over the key to their email.

Two consequences follow, and both shaped this decision.

**The damage falls on the user, not on the service.** A breach is a bad week
here and a different category of problem for the person whose bank account is
reachable. The party making the security decision and the party paying for it
are not the same party.

**Carefulness is not a mitigation.** File permissions, encrypted disks, private
buckets — each reduces the *chance* of a leak and none reduces the *damage* when
one happens. Files leak: backups, laptops, misconfigured object storage, a
`SELECT *` in a log line, a support engineer having a bad day.

So the requirement is stronger than "protect the password column":

> Someone holding the entire database, with unlimited time, must not be able to
> work out any user's password — and the server must still be able to check a
> correct login.

---

## Why encryption is the wrong tool, in detail

The instinct is to encrypt the column, and "the passwords were encrypted" is a
comfortable sentence to be able to say after a breach. It does not survive
tracing the login path.

Encryption is **reversible by design** — that is its purpose. Verifying a
password means decrypting the stored value, which means the key has to be
present, in usable form, in the running process, at the moment any request
arrives.

Moving the key out of the database helps against one class of theft and not the
other:

```
database-only exposure          application/server compromise
  stolen database file            remote code execution
  leaked backup                   compromised dependency
  exposed storage bucket          SSRF reading local files
  copied snapshot                 a debug endpoint dumping process.env
  ───────────────────             ─────────────────────────────────────
  attacker has DB, not key        attacker has DB *and* the key
```

Encryption is therefore not useless — against database-only theft it genuinely
helps, and saying otherwise would be sloppy. What it cannot do is remove the
secret: **the security boundary of an encrypted password column includes the
entire application environment**, permanently.

**The argument that actually decides it has nothing to do with attackers.**
Assume nobody is ever breached. With an encrypted column, the people who operate
the server can read every user's password, because the application by
construction can. That is insider risk, it is a subpoena that can be complied
with, and it is an operator having a bad day.

The right design is one where **the passwords cannot be read even by the people
who run the service, even deliberately, even with root.** That is not a
limitation accepted reluctantly; it is the feature. It removes the operator from
the trust equation entirely. Nothing can leak what nobody possesses.

A hash resolves the tension in the requirement because it goes one way:

```
register:  store  hash(password)
login:     compute hash(attempt), compare to the stored hash
```

Verification without recovery. The server never holds the password — it holds
something that lets it *recognise* the password when it sees it again.

---

## Why a fast hash is the wrong hash

SHA-256 satisfies everything above and is still wrong, which is the part that is
easy to miss.

**The attack against a stolen database is offline.** The attacker never touches
this server again. Rate limits, account lockouts, throttling and monitoring do
not apply, because nothing is being submitted to anything. They are guessing
against a file on their own hardware with unlimited attempts and nobody
watching. The only thing standing between them and the passwords is what each
guess costs.

Measured on the development machine during the session that produced this ADR:

```
SHA-256    578,457 guesses/sec   (one core, JavaScript, unoptimised)
argon2id        30 guesses/sec   (and 19 MiB of RAM per guess)
                                  ── a factor of ~19,000
```

A ten-million-entry password list is about twenty seconds of SHA-256 on one
laptop core, and roughly four days of argon2id. Real attackers use GPUs, which
widens the gap further rather than narrowing it: SHA-256 parallelises beautifully
across thousands of tiny cores, while argon2's **memory** requirement is what
takes that hardware advantage away — a 24 GB GPU can hold about a thousand
simultaneous argon2 guesses no matter how many cores it has.

**Slowness is asymmetric, which is why it is affordable.** A legitimate user
pays ~60ms once, at login. An attacker pays ~60ms per guess, billions of times.

### Salting, which solves a different attack

Slowness and salting are often explained together and defend against different
things.

A hash is deterministic, so without a salt two users with the same password
store the same string — visible by eye, before any cracking. Worse, an attacker
can precompute the hashes of the ten million most common passwords **once** and
then look up every row in constant time. Scale does not help: a million users is
a million free lookups, not a million times the work, because the attacker is
not searching the database at all.

A **per-user** salt destroys that. Not a single application-wide value, which is
still one precomputed table — just a bespoke one, built in an afternoon by the
attacker who stole the database and therefore also has the shared salt. Per user
means the work must be redone for every account, and the attacker's cost stops
being amortised.

The salt is **not a secret**. It sits in plain text beside the hash because
login needs it. Its job is not concealment; its job is to make each user's
password a separate problem.

```
salt   → kills precomputation. Every user is a fresh attack.
slow   → makes each of those fresh attacks expensive.
```

Both are needed, and argon2 provides both.

---

## Why argon2id, and the choice that was reversed

**bcrypt was chosen first and then reversed**, which is recorded here because the
reversal is the reasoning.

The first choice was bcrypt, on the grounds this project has used four times —
`@nestjs/config` (ADR-007), `class-validator` (ADR-008), JWT (ADR-009) and
TypeORM (ADR-010) — that learning the conventional answer is an explicit goal.
bcrypt is what appears in existing codebases, tutorials and interviews.

It was reversed once the OWASP position was on the table: **argon2id is the
current first recommendation and bcrypt is the still-acceptable second.** For a
function whose entire job is resisting attackers, the security recommendation
outranks familiarity — and bcrypt remains recognisable when inherited.

**A fact found while deciding, worth recording because it weakens the
"conventional" argument specifically here:** `@nestjs/bcrypt` does not exist —
it 404s. NestJS ships no hashing package at all. It ships `@nestjs/passport` for
authentication strategies, which does no hashing. So unlike the previous four
choices there is no first-party answer to defer to, and "conventional" means
only "commonly seen", not "endorsed by this framework".

bcrypt also **silently truncates passwords at 72 bytes**. A 100-character
passphrase has its last 28 characters ignored with no error, so two different
passwords can both verify. argon2 has no such limit, and a test pins the
difference (`password.service.spec.ts`).

### The package, not Node 24's built-in

`node:crypto.argon2` exists in Node 24 and would have been a zero-dependency
answer, consistent with ADR-003's original reasoning and Principle 3.

The package was chosen because it handles **salt generation and the PHC string
format**, which is real work with a genuinely wrong way to do it. The built-in
provides a raw hash function and leaves the encoding to the caller.

**The cost arrived immediately and is recorded rather than smoothed over.** pnpm
blocks native install scripts by default as a supply-chain control, and the build
failed hard until `argon2: true` was added to `allowBuilds` in
`pnpm-workspace.yaml`. The script was read before being approved — it is
`node-gyp-build`, the standard prebuilt-or-compile pattern — and argon2 was
verified to work with the script still blocked, so the approval buys a
platform-matched binary rather than basic function.

---

## One column, not three

ADR-009 sketched "hash, salt, algorithm marker" as separate concerns. argon2
puts all of them in one self-describing string:

```
$argon2id$v=19$m=65536,p=4,t=3$qBiiRlXPPNV533/nrAcKiQ$lR29Hq...
 algorithm  version  parameters        salt            hash
```

Splitting it would mean re-gluing the pieces in the right order and encoding on
every verify, whose only purpose would be to undo the schema decision.

**The parameters are the load-bearing reason.** Hardware gets faster, so `m` and
`t` must rise over time. Because each row records the parameters it was created
with, old hashes keep verifying at their old settings while new ones use stronger
values, and a user's hash can be upgraded silently at their next successful
login. Parameters living only in application code would invalidate every stored
password the day they changed.

The column is **nullable**, which is not laziness. It was added to a table that
already existed, and a row written before it genuinely has no password. The
alternative that satisfies `NOT NULL` is `DEFAULT ''`, which invents a credential
nothing can verify and that `argon2.verify` will happily be asked about. The
application reads a null hash as an account that cannot log in.

---

## Not leaking the credential, which is two separate problems

`entries.user_id` is kept out of responses by `select: false`. That mechanism
was **verified insufficient here before the code was written**, and the
verification is the reason the design differs:

```
WRITE path (registration):  passwordHash present  ← would be leaked
READ path (a later GET):    passwordHash absent   ← select:false worked
```

**`select: false` is a read-path guarantee.** `repo.save(user)` never reads the
row — it hands back the same in-memory object it was given, credential included
— so a controller returning it serialises the hash into a 201 body with
`select: false` doing nothing at all.

`@Exclude()` plus `ClassSerializerInterceptor` was chosen instead, because it is
declared on the entity and therefore covers **every** exit path, including the
endpoint nobody has written yet. Its limit is recorded where it is switched on:
it transforms class *instances*, so a plain object from `ds.query()` or
`getRawMany()` passes through untouched.

**Because the mechanism has a limit, the guarantee is pinned by a test on
response bodies** rather than by trust in the decorator — the same division as
Day 8's `synchronize` repair, where the durable claim was about behaviour rather
than about a setting. The test asserts an exact key list rather than one absent
field, because `password`, `passwordHash` and `password_hash` are three
spellings a future change could introduce and only "these keys and no others"
rules out all of them.

---

## Accepted costs

- **A native dependency on the most security-critical function in the
  application**, where ADR-003 originally chose `node:sqlite` to avoid
  dependencies entirely. Its install script is now approved in
  `pnpm-workspace.yaml`, which is a standing trust decision renewed at every
  version bump.
- **~60ms per login and per registration**, by design. It is the property being
  bought, and it means the test suite is measurably slower.
- **The older of the two recommended algorithms was rejected knowingly.** bcrypt
  is more likely to be encountered in existing code, and that familiarity was
  traded for OWASP's current recommendation.
- **Argon2's defaults are used rather than tuned.** No measurement of this
  project's own hardware informed `m=65536`; the library's defaults are OWASP-
  aligned and tuning without a measured requirement would be exactly the
  premature optimisation Principle 5 forbids.

---

## Future Revisit Conditions

Revisit **the cost parameters** when login latency becomes a measured complaint
or when hardware makes ~60ms cheap. Because every hash records its own
parameters, raising them is safe and can be applied per-user at next login.

Revisit **the `@Exclude()` approach** if any endpoint starts returning users as
plain objects — from `ds.query()`, `getRawMany()`, or a hand-built literal —
because the interceptor does not act on those and the response-body test is then
the only thing left.

Revisit **argon2 against the Node built-in** on Day 24, alongside the
`better-sqlite3` → `pg` swap. If native dependencies become a deployment problem,
`node:crypto.argon2` is the same algorithm with the PHC formatting to write by
hand.
