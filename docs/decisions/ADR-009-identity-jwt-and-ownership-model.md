# ADR-009: Entries Belong To Users; Identity Is Carried By a Signed Token

**Status:** Accepted
**Date:** 2026-09-01 (Day 8)

---

## Decision

1. **A `users` table exists, and `entries` gains a `user_id` column** pointing at
   it. Ownership becomes something the data model can express.
2. **Identity is carried by a signed token (JWT), not by a server-side session.**
   The reason is a learning goal, stated below, and explicitly **not** a
   scalability argument.

---

## The problem

Neuron is a private journal — people write things in it they would not say out
loud — and the API has no idea who is asking. Every request that arrives is
anonymous and identical to every other.

The whole data model was this:

```sql
CREATE TABLE IF NOT EXISTS entries (
  id         TEXT PRIMARY KEY,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL
)
```

Asked what happens if two people use it, the project owner answered immediately:
*"both can see entire journal entries which belong to both of them and can read
each other's private thoughts."* That is exactly right, and it is worse than
reading — `PATCH /entries/:id` and `DELETE /entries/:id` take an id and nothing
else, so either person can rewrite or permanently destroy the other's entries.

There is no check to fail, because there is nothing to check against. **No column
in that table could hold the answer.** Even a server that knew perfectly well who
was asking would have nowhere to look up who an entry belongs to.

---

## Decision 1: the data model

```
users                          entries
  id                             id
  name                           content
  password  (see Day 9)          created_at
                                 user_id   -> users.id
```

The first sketch put an `entries` column on `users`. It was corrected by the owner
herself, unprompted, when asked to write out what that cell would literally
contain for a person with three entries.

**The rule generalises and is worth keeping: the pointer lives on the "many"
side.** One user has many entries, so the entry carries `user_id`. A list is never
stored inside a cell, because no size is big enough and nothing can search it.

`password` is named here for completeness and **will not survive Day 9**, whose
problem is that storing a password is a liability. What goes in that column
changes; that it belongs to `users` rather than to `entries` does not.

---

## Decision 2: a signed token rather than a session

### How the two actually differ

Compared on the wire rather than by description.

**A session — the server remembers.**

```
POST /login   -> server stores  "a3f9c2..." -> "u_01"  in a table
                 responds Set-Cookie: session=a3f9c2...
GET /entries  -> Cookie: session=a3f9c2...
                 server looks the string up and finds "u_01"
```

The string means nothing by itself. It is a claim ticket, and all the meaning
lives in the server's table.

**A signed token — the server does not remember.**

```
POST /login   -> server signs  {"sub":"u_01","exp":...}  with a secret
                 responds with  eyJhbGciOi...
GET /entries  -> Authorization: Bearer eyJhbGciOi...
                 server checks the signature is its own and reads "u_01" out
```

Nothing is stored. The token carries the answer and the signature is what stops a
client editing it to say `u_02`.

### The objection, raised by the owner before the decision was made

Asked what happens when a user's laptop is stolen and they need to be logged out
everywhere, she answered without prompting:

> With a session the server remembers and has real-time control — the user can log
> out from a safe device and the server deletes the key, so it is instant. With
> JWT the token lives on the client, the server has no idea what it looks like,
> and even if you log out from the phone **the token would still be
> cryptographically true** and the thief can continue using the account.

That is correct and it is the strongest argument against this decision. It is
recorded here rather than in a footnote because an ADR that keeps only the winning
argument is worthless later.

### The reason that was rejected

The first justification offered was *"stateless, horizontally scalable, sessions
need a central lookup on every request."* Every clause is a true description of
JWT and **none of it justifies this choice for this project today**, which is why
it is written down as rejected rather than quietly used:

- Neuron runs as one process on one machine. Deployment is not until Day 24. A
  benefit that appears only with several servers is a benefit for a problem that
  does not exist.
- Every request to `/entries` already opens and queries the database. A session
  check would be one extra indexed read on a connection that is already open. That
  cost has never been measured, and Principle 5 forbids optimising before
  understanding.
- *"The server trusts them instantly"* is the same fact as the revocation
  objection above, written as a benefit.

This is the same shape as the Day 6 argument for `.env`, where the justification
offered was a future need and the correction was to find evidence the need already
existed. Here no such evidence exists.

### The reason that was chosen

**Learning how this is conventionally done is an explicit goal of this project.**
JWT is what appears in essentially every codebase and interview, understanding it
first-hand is worth more than the marginally better fit of sessions at this size,
and the constitution's own success criteria list *"Why JWT?"* as a question that
must be answerable by Day 29.

This is the third time this reason has decided a technology choice here, after
`@nestjs/config` (ADR-007) and `class-validator` (ADR-008). It is a position
rather than a preference of the moment, and it belongs to the person doing the
learning.

**It is stated honestly: this is not the choice a pure Rule Zero reading would
make.** Sessions are the better fit for one service with one database, and they
give revocation for free. The decision is made with that known.

---

## Accepted costs

- **Logout cannot really work.** A stolen token stays valid until it expires.
  There is no server-side state to delete.
- **"Log me out everywhere" is not implementable** without adding state back —
  either a revocation list, which is a session store wearing a different hat, or
  short expiry plus refresh tokens.
- **A signing secret now exists**, which is the first real secret this project has
  had. ADR-007 built the machinery for exactly this before there was one to
  handle, which was the whole point of doing configuration on Day 6.
- **The Rule Zero reading was overridden deliberately**, on a learning goal rather
  than an engineering one. Recorded, not smoothed over.

---

## Future Revisit Conditions

Revisit on **Day 11**, which the roadmap already names: *"tokens don't expire, and
logout does nothing."* The owner walked into that day three days early by finding
the revocation problem herself. Short expiry plus a refresh token is the
conventional answer and it re-introduces exactly the server-side state this
decision avoided, which is the lesson.

Revisit **the `password` column on Day 9**, whose problem is that storing one is a
liability.

Revisit **if Neuron ever runs as more than one process.** At that point the
scalability argument stops being hypothetical and becomes the real reason,
retrospectively.
