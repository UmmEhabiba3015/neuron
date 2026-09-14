# ADR-013: Ownership Is Enforced In The Query, Not After It

**Status:** Accepted
**Date:** 2026-09-14 (Day 10)

**Completes:** ADR-009's ownership model and ADR-012's middle state, in which
every signed-in user could read every entry.
**Preserves:** ADR-004's repository boundary, ADR-005's layering, ADR-006's
search semantics.

---

## Decision

1. **Every query filters by `user_id` in its `WHERE` clause.** Ownership is not
   checked after a fetch; other people's rows never enter the process.
2. **The caller's id is an explicit parameter** on every repository and service
   method, not request-scoped state.
3. **"Not yours" and "does not exist" are both `404`.** There is no `403`.
4. **`entries.user_id` is `NOT NULL`.** An entry with no owner is now impossible.
5. **`JwtAuthGuard` is registered globally as `APP_GUARD`**, with `@Public()` as
   the opt-out.

---

## Why the check cannot go in the controller

The obvious implementation is to fetch and then compare:

```ts
const entry = await this.entriesService.findById(id);
if (!entry) throw new NotFoundException(...);
if (entry.userId !== request.user.id) throw new ForbiddenException();
```

It reads correctly, it sits where `request.user` already lives, and **it does not
work at all.**

`entries.user_id` is `select: false` (ADR-010), which keeps the column out of
every `SELECT` TypeORM writes. So `entry.userId` is `undefined` on a row whose
`user_id` column holds a real value. Demonstrated against a real database:

```
DATABASE holds:      { id: 'e1', user_id: 'alice' }
findOneBy returned:  { id: 'e1', content: '...', userId: undefined }

Bob   asking for Alice's entry  ->  undefined !== 'bob'    ->  FORBIDDEN
Alice asking for her own entry  ->  undefined !== 'alice'  ->  FORBIDDEN
```

**The comparison is a constant.** `undefined !== anything` is always true, so the
check denies everybody, including the owner. It is not a check at all.

The dangerous part is that **it passes its own test.** "Bob cannot read Alice's
entry" goes green. The security assertion succeeds while the feature is entirely
broken, and the two halves only meet when somebody tries to read their own entry.

This is the second time the same shape has appeared in eight days. `select: false`
protects the **read path** and the **projection**; it does nothing for the write
path (ADR-011's `@Exclude()` finding) and nothing for a comparison made after the
fetch. A protection whose scope is narrower than it appears is worse than no
protection, because it reads as sufficient.

---

## Why a filter, and not a filter *plus* a check

Fetching everything and filtering in application code is wrong beyond the
`select: false` problem, and it fails in ways that appear later:

- **Aggregates are computed over the wrong set.** `countEntries` would count
  everyone's entries unless separately remembered — once per aggregate, forever.
- **Ordering and pagination are wrong.** "Ten most recent" becomes ten most
  recent *globally*, then filtered, so a caller can be handed an empty page while
  their own entries exist.
- **The data left the boundary.** Every other user's entry bodies would be in
  process memory. A log line, an error serializer or a debug dump then becomes an
  incident rather than noise.

A `WHERE user_id = ?` fixes all of these at once, and the rows never arrive.

`select: false` does not interfere, because it governs the projection rather than
the predicate:

```sql
SELECT "e"."id", "e"."content", "e"."created_at"          -- user_id absent
FROM "entries" "e"
WHERE ("e"."content" LIKE ? ESCAPE '\' AND "e"."user_id" = ?)   -- and present
```

The column is filtered on and never returned, so the HTTP contract is unchanged:
response bodies still carry exactly `id`, `content`, `createdAt`.

---

## An explicit parameter, not request-scoped state

Nest supports request-scoped providers, which would let the repository read the
caller from context and leave every signature untouched. It was rejected.

**A missing required parameter is a compile error. A missing request context is a
runtime condition on some paths only.** When the signatures changed, the compiler
listed all thirty-odd call sites; nothing could be forgotten. Context would have
moved the failure from build time to whichever request first took an unusual path.

It also keeps the boundary honest. ADR-004 requires this repository to stay
callable from a script or a background job with no web server running, and a
provider that reads an HTTP request cannot be.

And it is self-documenting at the call site: `findAll()` reads as "all entries",
while `findAll(userId)` cannot be misread.

---

## 404 everywhere, and never 403

`403 Forbidden` is the technically accurate answer for "this exists and is not
yours", and it is an existence oracle. A caller walking ids learns exactly which
are real and which belong to other people — without reading a single body.

So "no such entry" and "not your entry" are indistinguishable from outside: same
status, same shape. This is the same decision as ADR-012's login rule, reached
from the other side, and for the same reason — **for a private journal, the fact
that a thing exists is itself sensitive.**

`affected === 0` on an update therefore has two causes (no such row; wrong owner)
and the repository does not distinguish them. That ambiguity is not a limitation
to work around: collapsing the two is the behaviour that would have to be
implemented deliberately if the driver reported more.

---

## Writes: the criteria are the guard

```ts
const result = await this.entries.update({ id, userId }, { content });
if (result.affected === 0) return undefined;
```

Not a read, a check, and then a write. That is two statements with a gap, and the
gap is where a concurrent ownership change lives — the same reasoning ADR-012
recorded for the registration race: **the pre-check is an optimisation, the write
criteria are the guard.**

`delete` must read the row before removing it, because it returns what it
deleted. That read is **for the payload, not for the authorisation**, which is
why `userId` also appears in the `delete` criteria even though `findById` already
filtered. Dropping it there would make the read the guard again. The worst case
with it is a wasted read.

---

## `NOT NULL`, and a migration that refuses rather than guesses

Day 8 added `user_id` as nullable because no user existed yet, and recorded
expand-backfill-contract as the staged shape. This is the contract.

Once every query filters on `user_id`, a row with `NULL` matches nobody — it is
in the database and invisible to every user forever. So the column becomes
`NOT NULL`, and an ownerless entry becomes impossible at the database level
rather than by convention.

**The migration refuses to run when orphans exist**, rather than deleting or
reassigning them:

```
Cannot require an owner: 1 entries have no user_id. Assign them to a user or
delete them, then run this migration again. This migration refuses to guess
which, because both answers lose data that somebody may want.
```

Verified: the orphan survives and the migration fails. A migration that silently
destroyed rows would do so on databases its author has never seen.

**The five rows in the development journal were deleted by hand, not by
migration**, for exactly that reason. They were Day 3 test data — an empty
string, a single space, `"23.0"` — and the file was backed up first. A
`DELETE FROM entries WHERE user_id IS NULL` committed as a migration would have
run everywhere, on data nobody had looked at.

That database was also **baselined and migrated in the same operation**, closing
ADR-010's amendment 6 on the real file nine days after it was demonstrated on a
copy.

---

## The guard is the default now

`@UseGuards(JwtAuthGuard)` per controller is opt-in, and **its failure mode is
silent**: a new route with no decorator is world-readable, and nothing reports it.
`AuthenticatedRequest` declares `user: User` unconditionally, so a handler on
such a route compiles cleanly and crashes at runtime with
`TypeError: Cannot read properties of undefined` — a 500 where a 401 was meant.
Verified before this change was made.

Registered as `APP_GUARD`, the default inverts. A route written by somebody who
has read none of this is closed:

```
GET /auth/brand-new-route   (no decorators at all)  ->  401
POST /auth/register         (@Public())             ->  201
```

**Forgetting to opt out breaks a route loudly, on the first request. Forgetting
to opt in leaks data silently.** The safe default is the one whose failure is
loud. `user: User` is now true by construction on every route except the two
marked otherwise.

This is the fourth instance of the same gap this project has recorded — Day 6's
deleted `validate,`, Day 7's removed `APP_PIPE`, Day 8's `synchronize: true`, and
now this — and the first one closed by changing the default rather than by adding
a test.

---

## Accepted costs

- **Every read and write carries a caller id**, through three layers. Thirty-odd
  signatures changed, and a future method that forgets it will not compile.
- **The generated migration was discarded again.** `migration:generate` produced
  299 lines rebuilding the tables six times, including rebuilding `users` twice
  for a change that does not touch it. Replaced with one table rebuild. That is
  three migrations in two days where the generated SQL was wrong or wasteful.
- **Five development entries were destroyed.** Backed up, and they were test
  data, but they are gone.
- **`user_id` cannot be null**, so a future feature wanting an unowned entry —
  an import, a system-generated entry — needs a migration. That friction is
  intended.
- **Nothing here helps a compromised token.** Ownership is enforced against
  whoever the token says is asking, and ADR-012's one-hour expiry is still the
  whole of revocation.

---

## Future Revisit Conditions

Revisit **on Day 11**, which the roadmap names: tokens do not expire usefully and
logging out does nothing.

Revisit **on Day 13**, when mood arrives as a second table. Every query against
it needs the same treatment, and the argument for a shared mechanism — a base
repository, a query helper — gets stronger with the second table rather than the
first.

Revisit **`select: false`** if an endpoint ever needs to return an owner. It has
now caused two near-misses (ADR-011's write path, this ADR's comparison) and its
value is that a column nothing selects cannot leak. If that changes, the
protection should be replaced deliberately rather than weakened in one query.
