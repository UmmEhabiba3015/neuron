# Worker Prompt — Day 4: Validation and Error Semantics

## Context

You are implementing one isolated task on the Neuron project. Read
`docs/constitution.md` before you start. The rules that matter most here:
the simplest correct solution wins, and no complexity is added unless it
solves a problem that exists today.

Do **not** touch git. No branching, no committing, no merging. Those are
human actions on this project.

This work has already been designed in full by the Master Thread with the
project owner. **You are implementing a decided design, not choosing one.**
Where this prompt states a decision, follow it. If you believe a decision is
wrong, implement it as written and record your objection in the report.

## The problem

Three endpoints currently return HTTP 500 where 500 is wrong. All three are
deliberate and are pinned by tests asserting the incorrect behaviour, so they
cannot be fixed by accident.

| Request | Now | Must become |
|---|---|---|
| `POST /entries` with `{}` | 500 | **400** |
| `GET /entries/:id` where id does not exist | 500 | **404** |
| `GET /entries?word=<no matches>` | 500 | **200 `[]`** |

## The decided design

### The layering rule (this governs everything below)

- The **repository** may not know that HTTP exists. It reports storage
  outcomes in storage vocabulary. This is ADR-004 and it is not negotiable.
- The **service** holds application logic. It must stay callable from a
  background job or a script with no web server running, so it may **not**
  throw HTTP exceptions either. This extends ADR-004's rule up one layer and
  is new today.
- The **controller** performs protocol translation. Status codes are HTTP
  vocabulary, so `NotFoundException`, `BadRequestException` and every other
  HTTP concern live here and only here.

### 1. `findById` — 404

| Layer | Behaviour |
|---|---|
| Repository | Return `JournalEntry \| undefined`. **Delete the `throw`.** |
| Service | Return `JournalEntry \| undefined`. Pass the value through unchanged. |
| Controller | If the value is `undefined`, throw `NotFoundException`. Otherwise return the entry. |

Both signatures must change to `JournalEntry | undefined`. The current
signatures claim a `JournalEntry` always comes back, which is untrue.

### 2. `findByContent` — 200 with an empty array

| Layer | Behaviour |
|---|---|
| Repository | Return `[]` when nothing matches. **Delete the `throw`.** No other change. |
| Service | No change. |
| Controller | No change. |

An empty array is a valid result, not an error. This case should require
**zero new code** — it is fixed entirely by deleting the `throw` in
`entries.repository.ts`. Do not add an empty-check anywhere.

### 3. Validation on `POST /entries` — 400

Hand-written check in the controller. **Do not install `class-validator`,
`class-transformer`, `zod`, or any other validation library.** Do not add a
`ValidationPipe`. This was decided deliberately: one endpoint with one
required field does not yet justify a dependency. The revisit condition is
recorded in ADR-005.

A request body is valid only if `content`:

1. is present,
2. is a string,
3. contains at least one non-whitespace character.

Anything else throws `BadRequestException`. Note that all three checks are
required and none is redundant:

- `{}` fails check 1.
- `{ "content": 42 }` fails check 2. This one matters more than it looks:
  SQLite's type affinity silently coerces `42` into the string `"42"` in a
  `TEXT` column, so the POST response would contain `"content": 42` (a number)
  while every subsequent GET returns `"content": "42"` (a string). The same
  entry would have two different types depending on which endpoint served it.
- `{ "content": "" }` and `{ "content": "   " }` fail check 3. An entry with
  no readable text can never be displayed, searched, or summarised.

Store the content **verbatim**. Do not trim it before saving — whitespace is
only used to decide validity, not to modify what the user wrote. If you
disagree, implement as specified and note it in the report.

### 4. `CreateEntryDto`

Replace the inline `@Body() body: { content: string }` annotation with a named
type. A DTO (Data Transfer Object) describes data crossing a boundary, as
distinct from `JournalEntry`, which describes what an entry *is* inside the
application. The inline annotation is currently false: it names `content`
correctly but the type it belongs to also carries `id` and `createdAt`, neither
of which a client may send.

Keep it minimal — an interface with a single `content: string` field is
sufficient. Place it in the `entries` directory following existing naming
conventions.

This type is erased at compile time and validates nothing. The runtime check
in item 3 is what enforces the contract. Do not let the DTO's existence
tempt you into removing any runtime check.

### 5. `GET /entries/count` response shape

`GET /entries/count` currently returns a bare number:

```
5
```

It must return an object:

```json
{ "count": 5 }
```

Two reasons, in order of weight:

1. **Consistency, which is a property the API either has today or does not.**
   Every other endpoint on this surface returns an object or an array of
   objects. A bare number is the single exception.
2. **A bare number cannot change.** An object can gain a field later without
   breaking clients that already read `count`. A bare `5` has no room to grow,
   so any future addition would break every existing consumer.

The status code stays 200. Only the body shape changes. Update the controller
return type accordingly; the service may keep returning a `number`, since
"how many entries exist" is application vocabulary and the object wrapper is
an HTTP concern.

### 6. The pinned tests

Two tests currently assert the wrong behaviour on purpose, both in
`apps/api/src/entries/entries.service.spec.ts`:

- `'should throw when the id does not exist'`
- `'should throw when nothing matches'`

Both must change, and note that the *layer* changes too. The service no longer
throws — it returns `undefined` and `[]`. So:

- The service tests should assert the new return values (`undefined`, `[]`).
- The 404 behaviour is now a **controller** concern, so a test asserting
  `NotFoundException` belongs in `entries.controller.spec.ts`, not the service
  spec.
- Remove the "wrong on purpose" comments once the behaviour is correct. Replace
  them with comments explaining the behaviour that now holds.

### 7. New tests required

Add tests covering:

- `POST` with `{}` → `BadRequestException`
- `POST` with `{ content: 42 }` → `BadRequestException`
- `POST` with `{ content: "" }` → `BadRequestException`
- `POST` with `{ content: "   " }` → `BadRequestException`
- `POST` with valid content still succeeds, and content is stored verbatim
- `GET /entries/:id` with an unknown id → `NotFoundException`
- `findByContent` with no matches → `[]`, not a throw
- `/entries/count` returns the decided shape

At least one **e2e** test must assert real HTTP status codes (400, 404, 200)
through supertest, not just that an exception class was thrown. The e2e file is
`apps/api/test/app.e2e-spec.ts`. The status code is the actual deliverable of
this day, and only an e2e test proves the exception reaches the wire as the
right number.

### 8. ADR-005

Write `docs/decisions/ADR-005-validation-and-error-semantics.md` following the
format of the existing ADRs in `docs/decisions/`. Read ADR-004 first and match
its structure and tone.

It must record:

- **Decision:** HTTP status codes live in the controller. Neither the service
  nor the repository may throw HTTP exceptions.
- **Reasoning:** the service must remain callable from a background job with no
  web server running. A `NotFoundException` is meaningless to a caller with no
  HTTP response to write. This extends ADR-004's boundary rule upward.
- **Decision:** validation is hand-written in the controller; no library.
- **Alternatives considered:** `class-validator` with `ValidationPipe`, and
  schema validation with `zod`. Both rejected on **timing, not merit** — one
  endpoint with one field does not justify the dependency or the new concept.
  This mirrors how ADR-004 rejected the query builder and the ORM.
- **Revisit condition:** when the same validation check is duplicated across
  enough endpoints that forgetting one becomes likely. Name the concrete
  trigger: a forgotten check is silent — lint, typecheck, build and tests all
  pass while the endpoint accepts bad data. This is the same failure class as
  the Day 3 `ORDER BY` bug and the `created_at` cast risk in ADR-004.
- **Decision:** why `findById` returns `undefined` while `findByContent`
  returns `[]`. A single missing thing has no representation, so `undefined` is
  the only honest value. A collection query always has a value to return; an
  empty collection is a complete answer, not a failure.
- **Decision and reasoning** for the `/entries/count` response shape, per
  section 5.
- **Accepted cost:** `CreateEntryDto` is erased at compile time and enforces
  nothing at runtime. It documents the contract; the hand-written check
  upholds it.

## Constraints

- Do not install any dependency. If you believe one is unavoidable, stop and
  say so in the report instead of installing it.
- Do not add a global `ValidationPipe` or exception filter.
- Do not refactor anything outside this scope.
- Do not modify `entry.interface.ts` beyond what item 4 requires.
- Preserve the existing comment style. This codebase uses comments that explain
  *why*, not *what*, and they are a deliberate part of its value. Match that
  standard — comments that restate the code will be rejected in review.
- The repository must remain free of HTTP concepts. This must still return
  nothing:

  ```bash
  grep -n "HttpException\|NotFound\|BadRequest\|@nestjs/common" \
    apps/api/src/entries/entries.repository.ts
  ```

  (`Injectable` and `Inject` are imported from `@nestjs/common` in that file
  and are fine — check that no *HTTP* concept appears. Adjust the grep
  accordingly and state in your report what you ran.)

## Verification

All four must pass, and you must paste the actual output in your report:

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
```

Then verify by hand against a running server on a scratch database, and paste
the real responses:

```bash
DATABASE_PATH=/tmp/neuron-day4.db PORT=3999 pnpm --filter api start
```

- `POST /entries` with `{}` → 400
- `POST /entries` with `{"content": 42}` → 400
- `POST /entries` with `{"content": ""}` → 400
- `POST /entries` with `{"content": "   "}` → 400
- `POST /entries` with `{"content": "real text"}` → 201
- `GET /entries/nope` → 404
- `GET /entries?word=zzzzz` → 200 and `[]`
- `GET /entries/count` → 200 and the decided shape
- `GET /entries` → 200

## Report

Produce `docs/learning/day-04/report.md` containing: objective, implementation
summary, files changed, decisions made, assumptions, limitations, dependencies
added (expected: none), testing performed with pasted output, future
improvements, and lessons learned.

Be explicit about anything you were unsure of, and about any place where you
disagreed with this prompt. An honest report of a compromise is worth more than
a clean report that hides one.
