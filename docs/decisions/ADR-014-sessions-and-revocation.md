# ADR-014: Server-Side Sessions, Refresh Tokens, and Real Revocation

**Status:** Accepted
**Date:** 2026-09-21 (Day 11)

**Amends:** ADR-009, whose accepted costs were *"logout cannot really work"* and
*"log me out everywhere is not implementable"*. Both are now implemented.
**Amends:** ADR-012, whose one-hour access token was *"the whole of revocation
until Day 11"*.

---

## Decision

1. **A `sessions` table.** One row per login, holding a hash of that session's
   refresh token, its expiry, and a `revoked_at`.
2. **Two tokens.** A 15-minute access token, and a 30-day refresh token sent
   only to `POST /auth/refresh`.
3. **The guard checks the session on every request**, so revocation is
   immediate rather than bounded by the access token's lifetime.
4. **Refresh tokens rotate on every use**, and replaying a rotated token revokes
   every session for that user.
5. **`POST /auth/logout`, `POST /auth/logout-everywhere`, `GET /auth/sessions`.**

---

## This answers an objection the owner raised on Day 8

ADR-009 recorded it in her own words, before the decision it documents was made:

> With JWT the token lives on the client, the server has no idea what it looks
> like, and even if you log out from the phone **the token would still be
> cryptographically true** and the thief can continue using the account.

That was correct, it was recorded as the strongest argument against the
decision, and ADR-009 shipped anyway. This ADR is that objection answered.

**Verified before any code was written.** A token copied from a logged-in user
survived: a logout attempt (404, no such endpoint), another account being
created, and **a full restart of the server process**:

```
thief holds a copied token          → 200
no logout endpoint exists           → 404
another account created             → 200
the entire server process restarts  → 200
```

The restart is the starkest of those. There was no state to lose, so there was
nothing a restart could clear — with a session table a restart would not
invalidate sessions either, but a `DELETE` would. Here there was nothing to
delete.

---

## Was Day 8 wrong? No — its requirements were incomplete

Her framing, and it is better than the question that was asked:

> Day 8 wasn't necessarily wrong. The interesting question is whether its
> requirements were complete.

ADR-009 never wrote down a requirement about revocation. It recorded the
objection and moved on. If the requirement is *"logout only needs to stop the
current client using its token"*, a stateless JWT satisfies it. If the
requirement is *"when a user logs out, every copy of their credential must
become unusable immediately"*, no stateless design can.

So this is not a reversal. It is the discovery of the boundary of a decision —
and the cost ADR-009 listed as accepted turned out to be one this product could
not accept, because Neuron is a private journal and the stolen-laptop case is
the one that matters most.

**The lesson ADR-009 predicted has landed exactly as written:** *"short expiry
plus a refresh token is the conventional answer and it re-introduces exactly the
server-side state this decision avoided."* It does. The `sessions` table is a
session store, which is what ADR-009 chose JWT to avoid.

---

## What actually changes when revocation is added

Stated by the owner, and it is the whole architectural content of the day:

> The guard can no longer determine accept/reject using only information
> contained in the JWT itself.

Everything else — which table, how many tokens, what is hashed — is a
consequence of that one sentence.

---

## Why two tokens rather than one short one

The simplest fix to the stolen-token window is to shorten the single token to
five minutes. It works, and it makes an ordinary two-hour session unusable
without some other mechanism to obtain a new credential — at which point that
mechanism is a refresh token wearing a different name.

The split is **not** about making the long-lived credential less valuable. Her
summary:

> The split doesn't make the long-lived credential less valuable; it moves that
> valuable credential away from the high-volume API path, so you can afford to
> protect and revoke it with stateful checks while keeping ordinary API
> authentication essentially stateless.

The numbers behind "afford":

```
refresh calls   ~32 per user over an 8-hour session (15-minute access tokens)
guard runs      hundreds to thousands per user per day
```

Two orders of magnitude, which is why a stateful check is cheap at one and
expensive at the other.

### And then the guard checks the session anyway

The conventional design stops there: revoke the refresh token, and let the
access token die on its own within minutes. That is the cheaper answer, and it
means logout is **not** immediate — a stolen access token keeps working for up
to 15 minutes.

This project checks the session on every request instead, which is one indexed
primary-key lookup on a connection the request was already going to open —
next to the `UsersService.findById` the guard has done since Day 9. It buys
**immediate** revocation, which is what the Day 8 objection actually asked for.

Recorded as a deliberate departure from the conventional answer, with a revisit
condition below, because it is the line item that would matter at scale.

---

## Why a sessions table rather than a denylist or a token version

Three shapes were compared. Her analysis, which decided it:

| | log out everywhere | log out one device | list devices |
|---|---|---|---|
| denylist of revoked ids | awkward — must enumerate tokens it has no record of | ✅ natural | ❌ |
| token version on `users` | ✅ one integer | ❌ impossible | ❌ |
| sessions table | ✅ one `UPDATE` | ✅ natural | ✅ |

The decisive observation about the token version is hers: **the version belongs
to the user, not the session**, so it can only ever be an all-or-nothing switch.

A denylist was chosen first and then reconsidered. It is genuinely good at
targeted revocation — which is why denylists exist for things like revoking one
API key — but it stores only what has been revoked, so "log me out everywhere"
has nothing to enumerate. That is the scenario this day exists for.

### Cleanup

Also hers, and it is the right rule:

> Delete state once the credential it is protecting can no longer be valid
> anyway. The expiration is the boundary.

A revoked session row answers "should this token be rejected?" Once the token
has expired on its own, nothing is asking. Retaining rows beyond that is an
auditing requirement rather than an authentication one — a product decision, not
this one. **No cleanup job ships today**; the index on `expires_at` is here for
when it does.

---

## The refresh token is hashed, for ADR-011's reason

A refresh token is a live credential for 30 days. Storing it in plain text means
a database leak hands over every active session directly — the exact thing
ADR-011 exists to prevent for passwords.

**SHA-256, not argon2.** Argon2's slowness defends against guessing a
human-chosen secret. A refresh token is 32 random bytes, so guessing is already
impossible and the ~60ms would be paid on every refresh call for nothing. The
comparison is `timingSafeEqual` rather than `===`.

---

## Rotation and reuse detection

Every successful refresh issues a new refresh token and replaces the stored
hash. The old one stops working immediately.

That turns a stolen refresh token from a 30-day credential into a race: whoever
uses it first invalidates it for the other. And the loser's next attempt is
**detectable** — a token that does not match a live session's current hash means
someone is replaying an old one, so **every session for that user is revoked**.

The user is logged out everywhere and must sign in again. That is the correct
response to evidence of theft, and it is the one place where inconveniencing the
legitimate user is right.

---

## Accepted costs

- **ADR-009's central property is gone.** Authentication is stateful now. Every
  authenticated request reads the `sessions` table.
- **The `sessions` table grows** one row per login and nothing removes expired
  rows yet. At current usage this is irrelevant; it is a real gap and it is
  named rather than hidden.
- **`/auth/refresh` is `@Public()`**, so it is reachable unauthenticated — it
  must be, since it exists to be called when the access token has expired. Its
  protection is the refresh token itself.
- **Clients are now more complex.** Two tokens to store, a refresh flow to
  implement, and a 401 that may mean "refresh and retry" rather than "log in".
- **The session id is in the response and in the token.** It is an opaque UUID
  and knowing it grants nothing without the refresh token, but it is a value the
  client must carry.
- **A fourth generated migration was discarded.** `migration:generate` produced
  277 lines to add one table — rebuilding `entries` twice, `users` twice, and
  **dropping the `UQ_users_name` index** Day 9 created, replacing it with a
  hash-named table constraint. Replaced with one `CREATE TABLE` and two indexes.

---

## Future Revisit Conditions

Revisit **the per-request session check** if the guard's database read ever
shows up in a latency measurement. The conventional design drops it and accepts
a 15-minute revocation delay; that trade was made the other way here
deliberately, and it is the first thing to reconsider under load.

Revisit **cleanup** when the `sessions` table is large enough to notice. The
rule is already decided; only the mechanism is missing.

Revisit **on Day 24**, when `better-sqlite3` becomes `pg`. A session store is
exactly the kind of table that sometimes belongs in Redis instead, and that
argument gets stronger with more than one process.

Revisit **device metadata** if `GET /auth/sessions` is ever shown to a user. It
currently lists ids and timestamps; "MacBook — Chrome — London" needs a
user-agent column and has privacy questions of its own.
