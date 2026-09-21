# Day 11 — Tokens don't expire, and logging out does nothing

**Date:** 2026-09-21. One session, six blocks, no split. ADR-014.

The day her own objection got answered. ADR-009 recorded it on Day 8, in her
words, and recorded that she was right.

---

## What she decided, and at which step

| Block | Topic | Step |
|---|---|---|
| 1 | What "logout" can mean for a JWT | **1** |
| 2 | Refresh tokens — what problem they solve | **1** |
| 3 | Where revocation state lives | **1** |
| 4–6 | Implementation | built |

**All three decision blocks at step 1.** This is the first day with no narrowing
question needed on any conceptual block.

### Block 1 — the sentence the day turns on

Asked what would have to change for the guard to reject a valid, unexpired
token, she produced the whole architectural content of the day:

> The guard can no longer determine accept/reject using only information
> contained in the JWT itself.

Everything after that — which table, how many tokens, what gets hashed — is a
consequence of that one sentence.

She also drew the distinction most explanations skip, between **client logout**
("this client will no longer use my credentials") and **server-side
invalidation** ("this credential must no longer be accepted"), and named who
each protects. Deleting the client's copy protects the legitimate user's own
browser and nobody else.

**Her answer to "was Day 8 wrong?" was better than the question.** She reframed
it as whether the *requirements* were complete:

> Day 8 wasn't necessarily wrong. The interesting question is whether its
> requirements were complete.

ADR-009 never wrote down a requirement about revocation — it recorded the
objection and shipped. That framing is now the ADR's own.

### Block 2 — the split

At step 1, and her one-sentence summary is the cleanest statement of the design:

> The split doesn't make the long-lived credential less valuable; it moves that
> valuable credential away from the high-volume API path, so you can afford to
> protect and revoke it with stateful checks while keeping ordinary API
> authentication essentially stateless.

She also named, unprompted, the consequence most explanations gloss over: with
the conventional design **logout is not instantaneous for the access token**.
Revoking the refresh token stops the session obtaining new ones, but an
already-issued access token keeps working until it expires. She gave both halves
of the trade honestly and identified the escape hatch — a token version, or a
check on the request path.

That observation is what led to the day's one deliberate departure from the
conventional answer: the guard checks the session on **every** request, so
revocation is immediate.

### Block 3 — where the state lives

All of it at step 1, and the decisive observation about token versioning is
hers: **the version belongs to the user, not the session**, so it can only ever
be an all-or-nothing switch. One integer does "everywhere" and cannot do "this
device" at all.

On cleanup she produced the rule without prompting:

> Delete state once the credential it is protecting can no longer be valid
> anyway. The expiration is the boundary.

And separated auditing from authentication correctly — retaining rows past
expiry is a product requirement, not something the guard needs.

**A choice made and then reconsidered.** She chose the denylist first. It was
not a bad answer — her own analysis had already identified it as token-centric
and good at targeted revocation, which is exactly right, and it is why denylists
exist for revoking a single API key. What it cannot do is "log me out
everywhere", because it stores only what has been revoked and has nothing to
enumerate. She asked for a recommendation and took it.

---

## What the teacher got wrong

**A sabotage test was reported as passing when it had never run.** Checking
whether the guard's revocation check was load-bearing, a `python` replacement
silently failed to match — `eslint --fix` had reformatted the condition across
multiple lines since it was written. The tests were then run against *unmodified*
code, all 102 passed, and this was very nearly reported as "the revocation check
is not covered by any test".

It was caught by tracing what logout actually did over HTTP, which showed the
feature working correctly and therefore that the sabotage had not landed. Redone
properly: **three tests fail** when the check is removed, and they are the right
three.

The lesson is narrow and worth keeping: **verify that the break actually
happened before believing that nothing caught it.** A no-op edit and a missing
test look identical from the test output.

---

## Things found that were not the lesson

- **The fourth generated migration in three days was discarded**, and this one
  was destructive. To add one table it rebuilt `entries` twice, `users` twice,
  and **dropped the `UQ_users_name` index** Day 9 deliberately created, replacing
  it with a hash-named table constraint. 277 lines replaced with one
  `CREATE TABLE` and two indexes.
- **Two Day 9 tests fired**, both asserting things Day 11 deliberately changed:
  the exact token-payload key list (now carries `sid`) and a test that deleted a
  user without its sessions, which the foreign key correctly refused.
- **A test of mine had an ordering bug** — `sessionIdOf` returns the most recent
  session, and two logins in the same millisecond made it return the wrong one.
  The code was right and the test was wrong.
- **Both security-critical behaviours were verified by breaking them**:
  removing the session check fails exactly three tests, removing reuse detection
  fails exactly one.

---

## The demonstration that closes the day

Her Day 8 objection, run against the finished code — laptop stolen, log out from
the phone, and the thief locked out immediately rather than in an hour:

```
Two devices signed in; sessions listed from phone: 2
POST /auth/logout-everywhere -> 204

The thief, holding the laptop's tokens, IMMEDIATELY:
  GET  /auth/me       -> 401
  GET  /entries       -> 401
  POST /auth/refresh  -> 401
```

And before any code was written, the same scenario on the Day 9 code — where the
token survived a logout attempt, another account being created, and **a full
restart of the server process**, because there was no state to lose.
