# ADR-003: Use SQLite (via `node:sqlite`) for Persistence

**Status:** Accepted
**Date:** 2026-07-29 (Day 2)

---

## Decision

Persist journal entries in a SQLite database, accessed through Node's built-in
`node:sqlite` module, using hand-written SQL. No ORM, no query builder, no
database server.

---

## Problem

Entries lived in an in-memory array. This was not a theoretical concern — it
was demonstrated:

```
POST /entries  {"content": "my first real entry"}   →  201 Created
GET  /entries                                       →  3 entries
<restart the process>
GET  /entries                                       →  2 entries
```

The entry was gone. Nothing errored, nothing logged, nothing warned. The API
returned `201 Created` and then silently discarded the data on the next
restart.

Note what the problem is **not**. The proven requirement is *"writes must
survive a process restart."* It is not *"we need a database"* — that would be
a conclusion smuggled in as a premise.

---

## Alternatives

**(a) A JSON file on disk** — read at boot, rewrite on every change.

**(b) SQLite** — a real SQL engine that reads and writes a single local file.
No server process, no network, no credentials.

**(c) PostgreSQL in Docker** — a full database server, matching the likely
production target.

**(d) MongoDB** — a document store. Journal entries are document-shaped.

---

## Pros

- **(a)** Zero dependencies and zero concepts. Genuinely solves the stated
  problem — data survives a restart.
- **(b)** Real SQL, real schema, real types, real indexes, real transactions —
  but as a library reading a file. On Node 24 it costs **zero dependencies**,
  since `node:sqlite` ships with the runtime.
- **(c)** What production will most likely run. Concurrent writers, real
  connection semantics, and `pgvector` — a Postgres extension — is the obvious
  candidate for semantic search on Day 16.
- **(d)** Schema-free, so the data model can change without migrations early on.

## Cons

- **(a)** No querying — filtering or sorting means loading everything into
  memory. Every write rewrites the entire file. Two concurrent writes silently
  lose data. It would need replacing almost immediately, and would teach little
  that isn't already obvious.
- **(b)** Single-writer. Not suitable for a deployed multi-user service. Almost
  certainly needs replacing before Day 24 (deployment).
- **(c)** Highest setup cost today: a container, a connection string,
  credentials, a driver, pooling, and a running daemon — before a single row is
  stored. All of that is infrastructure work, not persistence learning.
- **(d)** Same server-and-driver setup cost as Postgres, without Postgres's
  later payoff for vector search. "No schema" is also a cost disguised as a
  benefit — the schema still exists, it's just enforced nowhere.

---

## Tradeoffs

**The migration is real and is being accepted knowingly.** Semantic search
(Day 16) points at `pgvector`, and deployment (Day 24) points at a managed
Postgres. SQLite is therefore expected to be replaced. This ADR does not
pretend otherwise.

The bet: the cost of migrating later is **lower** than the cost of setting up
Postgres today, because the concepts that transfer — schema design, SQL,
indexes, transactions, migrations, separating data access from business logic —
are ~90% identical between the two. What does *not* transfer is mostly
infrastructure: connection strings, pooling, Docker. Those are Day 24 topics
being deferred to Day 24.

**Raw SQL over an ORM is also deliberate.** An ORM today would hide exactly
what Day 3 is about. The roadmap's Day 3 problem is *"SQL strings are scattered
through my controller"* — that problem has to be genuinely felt before a
repository pattern or an ORM can be evaluated rather than merely adopted.

---

## Reasoning

A JSON file (a) is the simplest thing that satisfies the literal requirement,
and under Rule Zero that makes it the default. It was rejected because its
failure modes arrive almost immediately — the very next feature that needs to
find or sort entries hits a wall — and because the lesson it teaches
("databases exist because files don't query") is already understood without
spending a day proving it.

Postgres (c) and MongoDB (d) both fail the "complexity must be earned" test
*today*. There is no concurrency, no second user, no network, and no
deployment. Their advantages are all real and all arrive later.

SQLite (b) sits exactly where the evidence points: every database concept the
next several days require, and none of the infrastructure none of them require.
That `node:sqlite` is built into Node 24 removes the last argument against it —
there is not even a dependency to justify.

---

## Final Decision

SQLite via `node:sqlite`, with hand-written SQL, no ORM, no query builder, and
no migration tooling. The database is a single local file, gitignored.

---

## Future Revisit Conditions

- **Day 3** — when SQL strings have spread through the codebase, revisit
  whether data access needs its own layer, and whether a query builder or ORM
  earns its complexity.
- **Day 16** — if semantic search requires `pgvector`, SQLite cannot provide
  it. Expect to migrate to Postgres here.
- **Day 24** — deployment. A single-writer file database on ephemeral container
  storage is not deployable. If the Day 16 migration has not already happened,
  it must happen by this point.
- **Sooner, if** concurrent writes appear (background jobs, Day 18) and
  SQLite's single-writer limit produces real lock contention.
