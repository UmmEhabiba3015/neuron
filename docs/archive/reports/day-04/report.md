# Day 4 Worker Report — Validation and Error Semantics

**Branch:** `day-04-validation`
**Date:** 2026-08-01

---

## Objective

Fix three endpoints that returned HTTP 500 where 500 was wrong, add validation to
`POST /entries`, change `GET /entries/count` to return an object, and record the
reasoning in ADR-005.

| Request | Before | After |
|---|---|---|
| `POST /entries` with `{}` | 500 | **400** |
| `GET /entries/:id`, unknown id | 500 | **404** |
| `GET /entries?word=<no matches>` | 500 | **200 `[]`** |
| `GET /entries/count` | `5` | **`{ "count": 5 }`** |

---

## A blocker hit before any code was written

The branch `day-04-validation` did not contain Day 3's work. It had been cut from
`db7b624` ("docs: record Day 2 state") *before* PR #3 merged, so
`entries.repository.ts` did not exist on disk, `docs/decisions/ADR-004` was
absent, and neither pinned test was present. There was nothing to fix.

The prompt says not to touch git, so this was reported rather than resolved. The
project owner confirmed PR #3 had merged to `main` and then explicitly authorised
the fix, after which `git rebase main` brought the branch to `488acc9`. The
rebase was clean — the branch had no commits of its own — and every file the
prompt describes was then present.

Recorded here because the working tree's state is not visible from the prompt
alone, and a future reader may wonder why Day 4 began with a git operation.

One naming detail: the prompt refers to ADR-004 generically; the actual file is
`docs/decisions/ADR-004-repository-raw-sql.md`.

---

## Implementation summary

### 1. `findById` → 404

Three layers changed, each staying inside its own vocabulary:

- **Repository** — deleted the `throw new Error(...)`. Returns
  `JournalEntry | undefined`; `toJournalEntry` now runs only when a row exists.
- **Service** — signature changed to `JournalEntry | undefined`, value passed
  through untouched.
- **Controller** — throws `NotFoundException` when the value is `undefined`.

Both signatures previously claimed a `JournalEntry` always came back, which was
untrue; the `undefined` case existed and was hidden behind a `throw`.

### 2. `findByContent` → 200 with `[]`

Deleted the `throw` in the repository. **No other line changed anywhere**, as the
prompt predicted — `records.map(...)` over an empty array already produces `[]`.
No empty-check was added at any layer.

### 3. Validation on `POST /entries` → 400

A module-level `parseCreateEntryDto(body: unknown): CreateEntryDto` in
`entries.controller.ts`, placed at the bottom of the file to match how
`entries.repository.ts` keeps `toJournalEntry`. Four guards:

1. body is a non-null object (`typeof null === 'object'`, so `null` needs the
   explicit check or it reaches the property access),
2. `content` is present,
3. `content` is a string,
4. `content.trim().length > 0`.

Content is stored **verbatim** — `.trim()` decides validity and never modifies
the stored value. Verified over real HTTP; see Testing below.

No dependency was added. No `ValidationPipe`.

### 4. `CreateEntryDto`

New file `apps/api/src/entries/create-entry.dto.ts` — an interface with a single
`content: string`.

**One deliberate deviation from the prompt, flagged for review.** The prompt says
to replace the inline `@Body() body: { content: string }` with the named type.
Typing the parameter as `@Body() body: CreateEntryDto` would have reproduced the
exact falsehood being removed: an unvalidated body is *not* a `CreateEntryDto`,
and asserting that it is would be a claim nothing has established. The parameter
is therefore `@Body() body: unknown`, and `CreateEntryDto` is what the validator
*returns*. This makes the compiler require validation before the value can be
touched, and makes the type name mean "checked" rather than "hoped for". The DTO
is used, named, and placed as instructed — only the parameter's declared type
differs. If the reviewer prefers the literal reading, the change is one word.

### 5. `/entries/count` → `{ count: number }`

The wrapper is built in the controller. The service still returns a `number`,
since a quantity is application vocabulary and the object shape is an HTTP fact.

### 6. Pinned tests

Both "wrong on purpose" tests changed, and **the layer changed with them**:

- `'should throw when the id does not exist'` → `'should return undefined when
  the id does not exist'` (service spec), with the 404 claim moved to
  `entries.controller.spec.ts` as `NotFoundException`.
- `'should throw when nothing matches'` → `'should return an empty array when
  nothing matches'`.

The "wrong on purpose" comments were removed and replaced with comments stating
the behaviour that now holds and why the two cases differ.

### 7. ADR-005

`docs/decisions/ADR-005-validation-and-error-semantics.md`, following ADR-004's
structure (Decision / Problem / Alternatives / Pros / Cons / Reasoning / Final
Decision / Future Revisit Conditions) and covering every point the prompt
required.

---

## Files changed

| File | Change |
|---|---|
| `apps/api/src/entries/entries.repository.ts` | Deleted both `throw`s; `findById` returns `undefined` |
| `apps/api/src/entries/entries.service.ts` | `findById` signature → `JournalEntry \| undefined` |
| `apps/api/src/entries/entries.controller.ts` | Validation, `NotFoundException`, count shape |
| `apps/api/src/entries/create-entry.dto.ts` | **New** |
| `apps/api/src/entries/entries.service.spec.ts` | Unpinned 2 tests; added verbatim-storage test |
| `apps/api/src/entries/entries.controller.spec.ts` | Added 11 tests |
| `apps/api/test/app.e2e-spec.ts` | Added 9 e2e tests |
| `docs/decisions/ADR-005-validation-and-error-semantics.md` | **New** |
| `docs/learning/day-04/report.md` | **New** (this file) |

```
 apps/api/src/entries/entries.controller.spec.ts | 88 ++++++++++++++++++++
 apps/api/src/entries/entries.controller.ts      | 94 +++++++++++++++++++---
 apps/api/src/entries/entries.repository.ts      | 31 ++++----
 apps/api/src/entries/entries.service.spec.ts    | 38 +++++++---
 apps/api/src/entries/entries.service.ts         |  8 ++-
 apps/api/test/app.e2e-spec.ts                   | 91 ++++++++++++++++++++++
 6 files changed, 313 insertions(+), 37 deletions(-)
```

---

## Decisions made

**`@Body() body: unknown` rather than `CreateEntryDto`.** Explained in section 4
above. This is the one place the implementation departs from a literal reading of
the prompt.

**Four guards rather than three.** The prompt specifies three checks; a
non-null-object guard was added ahead of them. Without it, a body of `null`
reaches destructuring and throws a `TypeError` — a 500. This is a mechanical
consequence of `typeof null === 'object'`, not a design change.

**Distinct rejection messages per failure** (`content is required`, `content must
be a string`, `content must not be empty`) rather than one generic message. Costs
nothing and makes a 400 diagnosable from the response alone.

**Two tests were added beyond the required list**, both asserting that rejected
writes are not merely reported but never stored — one unit, one e2e. All four
validation tests would pass if the endpoint returned 400 *and still wrote the
row*, so without these the suite would have a hole.

**Validator placed at module level in the controller file**, matching
`toJournalEntry` in the repository, rather than in a new file. One function used
by one method does not need its own module yet.

---

## Assumptions

- `pnpm --filter api start` in the prompt was run as `pnpm --filter api start`
  and worked; the package's real name is `@neuron/api` and pnpm resolved the
  short form by directory.
- "Following existing naming conventions" for the DTO was read as matching
  `entry.interface.ts` — kebab-case, suffixed by role — giving
  `create-entry.dto.ts`.
- The e2e suite already replaces the real database via `overrideProvider`, so new
  e2e tests inherit that and leave nothing on disk. Verified: no stray `.db` file
  after the runs.

---

## Limitations

- **Validation is not enforced by any mechanism.** Nothing makes a future
  endpoint validate its body; a forgotten check will pass lint, typecheck, build
  and tests. This is the accepted cost recorded in ADR-005, and its revisit
  condition is written down there.
- **`CreateEntryDto` enforces nothing at runtime.** It is erased at compile time.
  The hand-written check is the only real defence.
- **Unknown fields are ignored, not rejected.** `{"content": "x", "id": "mine"}`
  returns 201 and silently drops `id`. This is safe today because the service
  reads only `content`, but a stricter reading of "the client may send only
  `content`" would reject it. Not in scope; worth a decision on Day 5 when
  `PATCH` arrives.
- **`GET /entries?word=` (empty string) returns all entries**, because the
  controller's `if (word)` treats `''` as absent. Pre-existing behaviour, not
  touched.
- **The count is not paginated or bounded.** Unrelated to today.

---

## Dependencies added

**None.** `apps/api/package.json` and `pnpm-lock.yaml` are unmodified. No
`class-validator`, `class-transformer`, or `zod`.

---

## Testing performed

### The four required commands

```
$ pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e

$ eslint "{src,apps,libs,test}/**/*.ts" --fix
$ tsc --noEmit -p tsconfig.json
$ nest build
$ jest

Test Suites: 2 passed, 2 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        1.775 s, estimated 2 s
Ran all test suites.

$ jest --config ./test/jest-e2e.json

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        0.755 s, estimated 2 s
Ran all test suites.
```

Unit tests went 18 → 29, e2e 1 → 10.

### The repository boundary

The prompt's literal grep, and the adjusted HTTP-only version it asks for:

```
$ grep -n "HttpException\|NotFound\|BadRequest\|@nestjs/common" \
    apps/api/src/entries/entries.repository.ts
2:import { Inject, Injectable } from '@nestjs/common';

$ grep -nE "HttpException|NotFound|BadRequest|Res\(|@Query|@Body|@Param|status|StatusCode" \
    apps/api/src/entries/entries.repository.ts
11://   It must not know: anything about HTTP — no request objects, no status
```

The only `@nestjs/common` import is `Inject, Injectable` — dependency injection,
not HTTP. The single remaining match is a comment stating the rule. The
repository is clean.

The service was checked the same way; its only match is a comment explaining why
it does *not* throw `NotFoundException`.

### The tests were confirmed capable of failing

A passing test proves nothing if it cannot fail. Validation was temporarily
neutered (`parseCreateEntryDto(body)` replaced with `body as CreateEntryDto`) and
the e2e suite re-run:

```
Tests:       5 failed, 5 passed, 10 total
```

The five failures were exactly the validation and no-write-on-reject tests. The
controller was restored from a backup and the suite returned to 10/10.

### Manual verification against a running server

```
DATABASE_PATH=/tmp/neuron-day4.db PORT=3999 pnpm --filter api start
```

Real responses:

```
$ POST /entries {}
HTTP 400
{"message":"content is required","error":"Bad Request","statusCode":400}

$ POST /entries {"content": 42}
HTTP 400
{"message":"content must be a string","error":"Bad Request","statusCode":400}

$ POST /entries {"content": ""}
HTTP 400
{"message":"content must not be empty","error":"Bad Request","statusCode":400}

$ POST /entries {"content": "   "}
HTTP 400
{"message":"content must not be empty","error":"Bad Request","statusCode":400}

$ POST /entries {"content": "real text"}
HTTP 201
{"id":"ecbe30bc-20b9-41e3-bbb2-57132404ba6a","content":"real text",
 "createdAt":"2026-07-31T19:35:57.291Z"}

$ GET /entries/nope
HTTP 404
{"message":"Entry with ID nope not found","error":"Not Found","statusCode":404}

$ GET /entries?word=zzzzz
HTTP 200
[]

$ GET /entries/count
HTTP 200
{"count":2}

$ GET /entries
HTTP 200
[{"id":"ecbe30bc-20b9-41e3-bbb2-57132404ba6a","content":"real text",
  "createdAt":"2026-07-31T19:35:57.291Z"},
 {"id":"431f0e01-96f7-45f0-b45c-faa633c743aa","content":"real text",
  "createdAt":"2026-07-31T19:35:57.276Z"}]
```

Verbatim storage, checked through a full round trip rather than asserted:

```
$ POST /entries {"content": "  padded text  "}
created id: ee4c528e-8b5d-41b1-9d73-0f4df40dd428

$ GET /entries/ee4c528e-8b5d-41b1-9d73-0f4df40dd428
"  padded text  "
verbatim: True
```

The server was stopped and `/tmp/neuron-day4.db` deleted afterwards.

---

## Future improvements

- **Reject unknown fields** on `POST`, or decide explicitly that ignoring them is
  the contract. Day 5's `PATCH` forces the question.
- **Share validation rules with the frontend.** Hand-written controller checks
  cannot be exported; this is the strongest future argument for `zod`, and is
  recorded in ADR-005's revisit conditions.
- **Machine-readable error codes.** The current 400 carries a human sentence,
  which suits one field and will not suit a ten-field form needing per-field
  errors.
- **A second write path will break the `id`/`createdAt` convention** — already
  recorded as ADR-004's accepted cost, and still open.

---

## Lessons learned

**The layer a fix belongs in is a real decision, not a detail.** The obvious
version of this task is one line: throw `NotFoundException` in the service, where
the absence is already known. It is shorter and it works. It is also wrong,
because a `NotFoundException` is an instruction to write an HTTP response, and
the service is supposed to remain callable from a background job that has no
response to write. The change that improves the design is *longer* than the
change that merely works.

**Deleting code fixed one of the three bugs entirely.** `findByContent` needed no
new logic — `.map` over an empty array already returns `[]`. The `throw` was the
whole bug. It is easy to assume a broken endpoint needs added code.

**The most dangerous of the four bugs was the one that did not error.**
`{"content": 42}` returned `201 Created`. Only later did the type quietly differ
between POST and GET, because SQLite's TEXT affinity coerces silently. A 500 is
loud and gets fixed; silent type coercion produces data that is already wrong by
the time anyone notices. This is the same shape as the Day 3 `ORDER BY` bug —
four green checks and a real defect.

**A test that cannot fail is not evidence.** Deliberately breaking the validator
and confirming exactly five e2e tests failed took under a minute and converted
"the tests pass" into "the tests test something".

**`unknown` is a more honest type than a named one, at a trust boundary.** The
instinct is to name the input type immediately. But naming data before checking it
is what made the original `{ content: string }` annotation false. `unknown` forces
the check to happen and lets the named type mean something once it appears.
