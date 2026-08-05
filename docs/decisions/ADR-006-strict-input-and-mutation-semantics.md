# ADR-006: Reject Unknown Input at the Boundary; `PATCH` and `DELETE` Semantics

**Status:** Accepted
**Date:** 2026-08-04 (Day 5)

---

## Decision

Five decisions, all made on Day 5:

1. **`POST` and `PATCH` reject unknown fields** with a 400. Silently ignoring
   them stops here.
2. **A repeated query parameter is a 400**, not a `200 []`.
3. **`%` and `_` in a search term are escaped** and treated as literal
   characters, not as `LIKE` wildcards.
4. **`PATCH /entries/:id`** performs a partial update. `404` for an unknown id,
   `400` for an empty body or an invalid `content`.
5. **`DELETE /entries/:id`** returns `200` with the deleted entry, and `404`
   when the id does not exist.

Validation remains hand-written. `zod` was reconsidered under ADR-005's named
revisit condition and deferred again, with a sharper trigger recorded below.

---

## How these were found

This matters more than the decisions themselves, and it is the reason Day 5
exists.

The API had **39 passing tests**. `pnpm lint`, `pnpm typecheck`, `pnpm build`,
`pnpm test` and `pnpm test:e2e` were all green. Every problem below was present
in that green codebase, and not one of the 39 tests could see any of them.

They were found by reading the suite and asking a different question than "does
it pass?" — namely, **"what rule does this code follow that nothing here
checks?"**

| Found | Behaviour | Test coverage |
|---|---|---|
| Unknown fields on `POST` | `{"content":"x","id":"mine"}` → 201, `id` silently discarded | None, in either direction |
| `LIKE` wildcards | `?word=%` and `?word=_` each return **every entry** | None |
| Repeated query parameter | `?word=a&word=b` → `200 []` | None |

Each was confirmed over real HTTP before being accepted as real.

---

## The pattern underneath all three

**A missing test is usually a missing decision.**

None of these three gaps could be closed by writing a test, because in every
case nobody had ever decided what the correct behaviour *was*. The absent test
was a symptom; the absent decision was the cause.

This reframes what a test suite is. It is not a safety net bolted on after the
code. It is **the set of decisions this project has actually made, written down
in executable form.** An untested behaviour is usually an undecided one, and
undecided behaviour is whatever the implementation happened to do on the day it
was written.

That is precisely how the Day 3 `ORDER BY` bug shipped, and it is the same
failure class ADR-004 accepted knowingly for the `created_at` cast and ADR-005
accepted for hand-written validation.

---

## Decision 1: reject unknown fields

### The problem

```
POST /entries  {"content":"x","id":"i-picked-this-myself"}
  → 201 Created  {"id":"85b1b009-…","content":"x","createdAt":"…"}
```

The client-supplied `id` is silently discarded. This is harmless **today**, and
the reason it is harmless is the entire problem: it is harmless by *coincidence*,
not by rule. `EntriesService.create` constructs the entry itself and reads
nothing from the body but `content`. Nothing enforces that it will continue to.

### What `PATCH` changes

Under a partial-update endpoint, ignoring unknown fields stops being harmless
and becomes the worst available outcome:

```
PATCH /entries/abc-123  {"contnet":"I fixed my typo"}
  → 200 OK, entry unchanged
```

The field name is misspelled. Under "ignore unknown fields" the server reports
success and does nothing. The user believes their correction was saved. There is
no error, no log, no warning, and the data is silently wrong.

A 400 naming `contnet` as unrecognised costs the user five seconds. The silent
`200` costs them the edit and gives them no way to discover it.

### Why `POST` changes too

`PATCH` alone would leave the same body producing a 400 on one endpoint and a
201 on another, on the same API. Beyond the inconsistency, `POST`'s safety rests
on an implementation detail rather than a stated rule — and an unstated rule is
one nobody can rely on, which is this ADR's whole subject.

### The cost, stated plainly

Strict rejection makes the API less forgiving. A client that adds a field for
its own bookkeeping now breaks. That is accepted deliberately: this API has one
consumer, which does not exist yet, and "unknown fields are rejected" is far
easier to relax later than to tighten.

---

## Decision 2: a repeated query parameter is a 400

### The problem

`@Query('word') word?: string` is a type the compiler believes completely. But a
URL may legally repeat a parameter, and when it does, Express supplies an
**array**:

```
GET /entries?word=felt&word=work
  → word is ['felt','work'] at runtime, typed string at compile time
  → `%${word}%` becomes '%felt,work%'
  → 200 []
```

This is the same defect ADR-005 identified in `@Body() body: CreateEntryDto`,
one layer over. A name asserts a guarantee nobody established; typecheck and
build both pass; the failure appears only at runtime.

### Why 400 rather than the alternatives

`200 []` was rejected because **it communicates something untrue.** It tells the
user "I searched and found nothing." What actually happened is "I could not
understand your request." The user can act on the second and not on the first.
Silently reporting no results for a request that was never parsed is worse than
either handling it or refusing it.

Treating repeated parameters as a multi-word search was also considered and
rejected under Rule Zero. Nobody has asked for multi-word search, and Day 15
replaces this search entirely.

---

## Decision 3: escape `%` and `_`

### The problem

```
GET /entries?word=%    → every entry in the journal
GET /entries?word=_    → every entry in the journal
```

And an entry reading `100% exhausted today` cannot be found by searching for
`100%`, because `%` is a wildcard before it is ever a character.

### Why parameter binding does not prevent this

Worth stating carefully, because it looks at first like an injection failure and
is not.

The query uses a prepared statement, and the binding works exactly as intended —
no user input is ever executed as SQL. But `%` and `_` are **not SQL grammar.**
They are the pattern language `LIKE` itself interprets, and they live *inside the
bound value*, which is precisely where parameter binding puts user data.

> Prepared statements protect the structure of the SQL statement. They do not
> protect the meaning of a value once a function like `LIKE` interprets it.

### The decision, and the objection to it

Options considered: escape them *(chosen)*; reject input containing them with a
400; declare wildcards a power-user feature and document it.

Rejecting was declined because a user searching for `100%` would get an error
they cannot act on. Declaring it a feature was declined because one keystroke
returning the entire journal is not what a search box should do, and nobody
outside this repository would know the feature existed.

**The Rule Zero objection is real and was answered rather than waved away.** This
`LIKE` query is condemned: Day 15 replaces it with full-text search, Day 16 with
embeddings. Fixing code scheduled for deletion is normally the wrong call.

It survives because **the durable artifact is not the fix — it is the claim:**

> *Searching for a character finds entries containing that character.*

That sentence names no SQL, no `LIKE`, and no `%`. It stays true across all three
implementations. This is the same property that made "newest first" survive the
Day 3 repository extraction: the claim was about behaviour, so it did not care
where the SQL lived.

**The implementation trap:** the escape character must itself be escaped first,
before `%` and `_`. Escaping in the wrong order corrupts any search term
containing a backslash.

---

## Decision 4: `PATCH /entries/:id`

`PATCH`, not `PUT`. `PUT` means "replace the resource with this representation",
which would require the client to send `id` and `createdAt` — values it is not
permitted to set. `PATCH` means "apply these changes", which is what is
happening.

| Situation | Response |
|---|---|
| Valid `content`, id exists | `200` with the updated entry |
| Id does not exist | `404` |
| Body has no updatable field | `400` |
| `content` present but invalid | `400`, same three rules as `POST` |
| Body contains an unrecognised field | `400` (Decision 1) |

`createdAt` is **not** modified on update. It records when the entry was
written, not when it was last touched. A separate `updatedAt` was considered and
declined under Rule Zero: nothing displays or sorts by it today. It becomes
justified the moment the timeline needs to show edited entries, which is Day 13
at the earliest.

The layering from ADR-005 is unchanged: the repository reports whether a row was
updated in storage vocabulary, the service passes that through, and only the
controller turns "no such row" into `404`.

---

## Decision 5: `DELETE /entries/:id` returns the deleted entry

`200` with the entry, not `204 No Content`.

`204` is the more common answer and is what most APIs do. It was rejected here
because the deleted entry is genuinely useful to the caller: it lets a client
display *"deleted: your text"* or offer an undo, without having fetched the
entry first.

**The honest cost:** `200`-with-body is slightly less conventional than `204`,
and it means the response carries data the client may not want. Neither is
expensive, and returning information the caller can ignore is a cheaper mistake
than withholding information it needs.

`404` for an unknown id, consistent with `GET /entries/:id`.

---

## Validation stays hand-written — ADR-005 revisited

ADR-005 named this exact day as the trigger to reconsider `zod` and
`class-validator`, on the grounds that a partial update duplicates a create's
rules. That reconsideration happened and the answer is **not yet**, for three
reasons:

1. The trigger's wording is *"enough endpoints that forgetting one becomes
   likely."* Two endpoints in one controller, written in the same session, is
   not that.
2. The duplication is one function — *is this a valid content string?* — and
   extracting it removes the duplication without a dependency.
3. Rule Zero. `zod` earns its cost on complex schemas. There is one field.

**Sharpened trigger, replacing ADR-005's vaguer one.** Adopt a validation
library when **any one** of these is true:

- a **second updatable field** exists (mood, Day 13) — see the amendment below,
  this is now the likeliest trigger;
- a **third** endpoint needs these same content rules;
- the **frontend duplicates them** (Day 12);
- a validation rule needs to be **shared as a value** rather than restated —
  exported from a package and used on both sides of the wire;
- error responses need a **machine-readable per-field shape** for form display.

The counter-argument on the record: `.strict()` in `zod` expresses Decision 1 in
one word, and by hand it is a loop over the body's keys. That is a genuine point
in `zod`'s favour and it is not enough on its own today.

### Amendment, same day: this reasoning was weaker than stated

Added after the implementation, because the worker reported a truthful version
of its own result that contradicts the paragraph above. It is recorded rather
than quietly corrected.

The argument above says the duplication was removed by extracting a shared
check. **What actually happened is that the duplication never had room to
form.** `parseCreateEntryDto` and `parseUpdateEntryDto` came out structurally
identical, differing only in which mistake their error message describes.

The reason is that there is exactly **one** updatable field. With one field,
*"the body contains at least one updatable field"* and *"`content` is present"*
are the same sentence. The rules of a create and the rules of a partial update
cannot diverge until there is a second field for them to diverge over.

So the claim *"extraction removed the duplication"* is true but untested. The
honest statement is: **one optional field is not a schema.** Deferring `zod`
still stands — there is nothing here for it to simplify — but it stands on
"there is no complexity yet", not on "the hand-written approach absorbed the
complexity."

**The real test arrives on Day 13**, when mood makes `UpdateEntryDto` into
`content?: …; mood?: …` and the two validators genuinely diverge. That is now
the first trigger in the list above.

One counter-argument also got stronger. The key-checking loop is now written:
nine lines plus a `RECOGNISED_FIELDS` array that any future field must be added
to **by memory**. That makes it the third rule in this codebase enforced by
remembering rather than by mechanism, alongside ADR-004's `created_at` cast and
the `LIKE` escaping added today. Each addition strengthens the case for the
mechanism.

---

## Accepted costs

- **Strict input rejection is a breaking change** for any client that sends
  extra fields. Accepted: no client exists.
- **Escaping is invisible to the type system.** Nothing prevents a future query
  from interpolating a raw term into a `LIKE` without escaping it. This is the
  same class as ADR-004's `created_at` cast and ADR-005's forgettable checks: a
  rule enforced by memory, not mechanism. Every occurrence increases the case
  for the mechanism.
- **The `%`/`_` fix will be deleted** on Day 15 or 16. Accepted knowingly; the
  test outlives it.

---

## Future Revisit Conditions

- **The sharpened validation-library trigger above**, whichever fires first.
- **Day 12**, when the frontend appears and may duplicate validation rules.
- **Day 15/16**, when search is replaced. The escaping code goes; the claim
  *"searching for a character finds entries containing that character"* must
  survive and keep passing.
- **When a second write path to entries appears** — `PATCH` is now the second
  one, so ADR-004's warning that `id`/`createdAt` format is "enforced by
  convention, tolerable only while `create()` is the single write path" is
  closer to firing. `PATCH` does not generate either value, so it does not fire
  today.
- **If `updatedAt` becomes necessary**, revisit Decision 4.
