# ADR-010: Adopt TypeORM, Replacing `node:sqlite` and Hand-Written SQL

**Status:** Accepted
**Date:** 2026-09-01 (Day 8)

**Supersedes:** ADR-003 (`node:sqlite`, no dependency).
**Largely supersedes:** ADR-004 (raw SQL, ORM rejected on timing).
**Preserves:** ADR-004's repository *boundary*, ADR-005's layering rule,
ADR-006's search semantics, ADR-007's configuration checking.

---

## Decision

Adopt **TypeORM** with **`@nestjs/typeorm`**, driven by **`better-sqlite3`** now
and `pg` from Day 24. `node:sqlite` is removed. Schema changes stop happening at
boot and become **migrations**.

---

## Why now, rather than on Day 13 or Day 24

ADR-004 rejected an ORM on timing and wrote down exactly when to look again. **Two
of its conditions fired on the same day:**

> **First non-additive schema change** — `CREATE TABLE IF NOT EXISTS` at boot
> stops being sufficient the moment a column must change type or be dropped.
> Migration tooling ships with most query builders and ORMs, **which changes the
> arithmetic.**

> **Day 13 (mood)** — a second table, and the first relationship between tables.
> This is where ORMs earn their reputation.

Day 8 introduces `users`, which is the second table, and `users → entries`, which
is the first relationship. Authentication brought the Day 13 condition forward by
five days. And the schema change is genuinely non-additive in effect: adding
`user_id NOT NULL` to a table that already holds rows cannot be expressed by the
boot-time statement at all.

**This was demonstrated rather than argued.** Adding `user_id` to the
`CREATE TABLE IF NOT EXISTS` statement and running it against a copy of the
existing development database produced:

```
existing database   columns: id, content, created_at              <- statement skipped
fresh clone         columns: id, content, created_at, user_id
```

The same code, two different schemas, decided by whether a file happened to exist.
Nothing reports it — not a test, not lint, not a boot error. It stays silent until
the first `INSERT` that names `user_id`, which throws on one machine and works on
the other.

### The counter-argument, which is on the record and was overruled

ADR-004 also named Day 24 as the cheapest moment: *"if a library is ever going to
be adopted, doing it alongside a driver change that is already happening is
cheaper than doing it twice."* Adopting now means doing it on SQLite and dealing
with Postgres later.

That was weighed and rejected on the grounds that a competent ORM makes the
Postgres step close to free, which is part of what is being bought, and that
delaying means writing a migration system by hand in the meantime and then
throwing it away.

---

## Why TypeORM specifically

Two candidates were considered seriously: TypeORM and Prisma.

**The stated reason was that TypeORM is used more in the software industry. That
claim could not be verified** — the npm download statistics were not reachable
from this environment — and it is therefore **not** recorded as a justification.

**What was verified, and is the reason that stands:**

```
@nestjs/typeorm  12.0.1  maintained by nestjscore and kamilmysliwiec,
                         the creator of NestJS
```

`@nestjs/typeorm` is a first-party NestJS package. That makes TypeORM the
conventional answer *within this framework*, which is checkable and is the version
of the claim that supports the decision.

This is the fourth technology chosen on the same reasoning — after `@nestjs/config`
(ADR-007), `class-validator` (ADR-008) and JWT (ADR-009) — that learning the
conventional approach is an explicit goal of this project. It is a consistent
position belonging to the person doing the learning, not a preference of the
moment.

Prisma's migration story is stronger and it is very common in current work. It was
declined because it does not look like the code that exists, uses a schema file
rather than the decorator style this codebase has committed to twice already, and
would not build on the repository the owner derived herself on Day 3.

---

## What must survive, and is not negotiable

The point of this ADR is a driver change, not a licence to redesign.

- **The repository boundary from ADR-004.** `EntriesRepository` remains the only
  class that knows how storage works. TypeORM's own repository is an
  implementation detail *inside* it, not something controllers or services touch.
- **ADR-005's layering.** Status codes live in the controller. The service and
  repository still may not throw `NotFoundException`, and the boundary greps must
  still return nothing.
- **ADR-006's search semantics.** `%` and `_` are ordinary characters. The
  hand-written `escapeLikePattern` will not survive as code, but **the claim it
  protects must** — *"searching for a character finds entries containing that
  character."* That sentence mentions no SQL and survives every replacement of the
  mechanism beneath it, which is precisely the argument that justified fixing it
  on Day 5.
- **ADR-007's configuration.** `DATABASE_PATH` is still checked once at boot and
  still feeds the database, now through TypeORM instead of `node:sqlite`.
- **Observable behaviour.** Every status code, message and response body stays
  exactly as it is. All 96 unit and 32 end-to-end tests must pass.

---

## Accepted costs

- **Three dependencies arrive** — `typeorm`, `@nestjs/typeorm`, `better-sqlite3` —
  where ADR-003 chose `node:sqlite` specifically because it needed none.
- **`entry.interface.ts` becomes a decorated entity class**, deepening this
  codebase's reliance on decorator metadata, already its least transparent
  mechanism and now load-bearing in three separate places.
- **The end-to-end suite loses its main lever.** All 32 tests swap the database
  through `.overrideProvider(DATABASE).useValue(db)`, and the `DATABASE` symbol
  ceases to exist. Their setup has to be rebuilt.
- **SQL stops being visible.** The Day 3 lesson — that she hand-wrote three
  queries and produced a real `ORDER BY` bug — is not undone, but no future query
  will be written that way. That was ADR-004's central argument for waiting and it
  is being spent now rather than on Day 13.
- **Roughly two days of work**, so authentication slides. The roadmap permits this
  explicitly and is amended rather than quietly missed.

---

## Amendments, same day, after the implementation and the audit

### 1. TypeORM did not make the application smaller

This ADR framed the change as a driver swap. The worker counted and the net is
**+44 code lines and +4 files**, even though `entries.repository.ts` lost a
quarter of its code:

```
entries.repository.ts   80 -> 59   (-21)
other files             net +11
new files               +54   data-source.ts, migrations/index.ts,
                              InitialSchema, test/test-database.ts
                        ─────
                net     +44
```

Migration infrastructure is four files that did not exist. That is the honest
shape of the trade and it is the same shape as ADR-008's: the tool bought a
mechanism, and paid in lines. This is now the third technology adoption on this
project where the codebase grew.

### 2. Roughly forty expressions became `await`

Not anticipated by this ADR and worth naming, because it is the largest single
diff in the change.

```
- expect(service.findAll()).toEqual([]);
+ expect(await service.findAll()).toEqual([]);

- expect(() => controller.findById('x')).toThrow(NotFoundException);
+ await expect(controller.findById('x')).rejects.toThrow(NotFoundException);
```

There is no synchronous TypeORM API, so this was forced rather than chosen. The
claims are word for word the same sentences about the same values, and **the
end-to-end suite needed no assertion changed at all**, which is the evidence that
nothing observable moved. Recorded as a cost rather than a defect.

### 3. `--experimental-vm-modules` is now on every test command

TypeORM 1.x ships ESM, and without the flag three suites fail to load with
`SyntaxError: Unexpected token 'export'` — verified during the audit, 46 of 96
tests running instead of 96. **Forced, not chosen.** It is an experimental Node
flag now permanently attached to how this project runs its tests, and it arrived
as a side effect of a driver decision.

### 4. ⚠️ `synchronize: true` is undetectable — found by the audit

This ADR's single most important rule is *"`synchronize` must be `false`;
migrations only."* Setting it back to `true` during the audit produced:

```
lint ✅   typecheck ✅   build ✅   96 unit ✅   32 e2e ✅
```

**Nothing fails.** The rule exists in a comment and in this document, and nothing
in the codebase enforces it. This is the third consecutive day the same shape of
gap has appeared — Day 6's deleted `validate,`, Day 7's removed `APP_PIPE`, and
now this — and it is the most dangerous of the three, because `synchronize: true`
silently rewrites schemas rather than merely skipping a check.

**Closed by task 8b**, which must add a test asserting the configured
`synchronize` is `false`.

### 5. ⚠️ `better-sqlite3` is outside TypeORM's declared peer range

```
typeorm@1.1.0 declares   better-sqlite3: ^12.0.0
installed                better-sqlite3@13.0.3
```

There is no `.npmrc` relaxing peer strictness, and pnpm raised no warning, so this
passed silently. Everything works — 128 tests, real HTTP, and a database written
by the previous driver reads correctly — but **TypeORM has not declared support
for that major version.** Recorded rather than changed, because downgrading is a
change with its own risk and nothing is currently broken. Revisit if any
SQLite-level behaviour turns out to be strange.

---

### 6. ⚠️ Migrations cannot run on any database created before Day 8

Found by the worker, confirmed independently in the audit, **and not yet fixed.**

A database that predates migrations has no `migrations` table, so TypeORM sees
zero applied migrations, tries to run `InitialSchema` first, and that
`CREATE TABLE "entries"` fails because the table is already there.

```
EXISTING database (5 entries)          FRESH database (no file)
  migration:run exit code: 1             exit code: 0
  entries columns: id,content,created_at id,content,created_at,user_id
  users table    : NO                    yes
  migrations rows: 0                     2
```

The transaction rolls back, so **no data is lost** and the failure is safe. But
the error says `table "entries" already exists` and nothing anywhere tells the
reader what to do about it.

The repair is one row, run once per pre-Day-8 database:

```sql
INSERT INTO migrations (timestamp, name)
VALUES (1788262448946, 'InitialSchema1788262448946');
```

Verified in the audit: with that row present, `migration:run` exits 0, `users`
is created, `user_id` is added, all five entries survive with `user_id` NULL, and
the foreign key is in place.

**This is the whole point of the day only half achieved.** Migration tooling was
adopted because `CREATE TABLE IF NOT EXISTS` could not change an existing schema.
The replacement cannot either — it fails loudly instead of silently, which is a
real improvement and is not the same as working.

It is undocumented. It is not in the README, there is no `migration:baseline`
script, and the only place it is written down is a worker report that is
gitignored. **Close this before Day 8 is committed.**

### 7. The migration is a table rebuild, not an `ALTER`

SQLite cannot add a foreign key to an existing table, so TypeORM's generated
migration creates `temporary_entries`, copies every row, drops `entries` and
renames — **twice**, once per column change. Worth knowing because it means every
schema change rewrites the whole table, which is fine at five rows and is a
different conversation at five million.

### 8. `PRAGMA foreign_keys` is on

Confirmed in the audit: the value is `1`, so the `user_id` foreign key is
genuinely enforced rather than decorative. This was worth checking because SQLite
ignores foreign keys entirely when the pragma is off, and a constraint nobody
enforces is a comment with extra steps.

---

## Future Revisit Conditions

Revisit **`synchronize`** immediately if it is ever switched on. It is TypeORM's
schema-on-boot mode and it is the same mistake this ADR exists to remove, wearing
a friendlier name. Migrations only.

Revisit **the repository boundary** if TypeORM types begin appearing in the
service, which would mean the boundary has quietly dissolved rather than been
reimplemented.

Revisit **on Day 24**, when `better-sqlite3` becomes `pg`. If that swap is not
close to free, the main argument for adopting today did not hold and that should
be written down.
