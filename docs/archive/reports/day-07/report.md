# Day 7 Worker Report — Validation Moves to `class-validator`

## Objective

Replace the 91 lines of hand-written parsing in `entries.controller.ts` with
`class-validator` decorators on DTO classes, enforced by a `ValidationPipe`
registered as an `APP_PIPE` provider in `AppModule`. Every rule ADR-005 and
ADR-006 decided has to survive the move, and the debt being closed is not the
line count — it is that validation was enforced by memory rather than by
mechanism.

Implemented as designed in ADR-008. No design decision was re-opened. Two
things not named in the prompt were found and are reported below: a defect I
introduced and then fixed (`PATCH {"content": null}`), and a gap in the
class-level check that had to be closed by hand.

---

## Implementation summary

The five parse functions are gone. What they enforced now lives in three places:

| Rule | Enforced by |
| --- | --- |
| `content` is a string | `@IsString()` |
| `content` holds a visible character | `@ContainsNonWhitespace()`, a custom decorator |
| No field the server does not recognise | `forbidNonWhitelisted` on the pipe |
| A `PATCH` body is not empty | `@ContainsAtLeastOneField()`, a class-level custom decorator |
| `word` is given at most once | `@IsString()` on the query DTO |
| An empty `word` finds nothing | `EntriesService.findByContent` |

Nothing in the controller calls any of them, and that is the point. The pipe
runs between the network and every handler, so an endpoint added tomorrow is
validated whether its author thought about validation or not.

### The mechanical fact the whole task turned on

`ValidationPipe.toValidate` refuses anything whose declared type is `Object`,
and `unknown` compiles to exactly that. Switching the pipe on without replacing
`unknown` would have done nothing at all — so this was not "turn on a pipe", it
was "replace `unknown` with classes", and the pipe started working as a
consequence. Confirmed by Mutation B below, where reverting one signature to
`unknown` silently removed two rules while the build stayed green.

### Files changed

| File | Change |
| --- | --- |
| `apps/api/src/app.module.ts` | Registers `ValidationPipe` as an `APP_PIPE` provider. |
| `apps/api/src/entries/entries.controller.ts` | 248 → 158 lines. Five parse functions deleted; three parameters retyped. |
| `apps/api/src/entries/create-entry.dto.ts` | Interface → class with `@IsString()` and `@ContainsNonWhitespace()`. |
| `apps/api/src/entries/update-entry.dto.ts` | Interface → class; `content` optional, `@ContainsAtLeastOneField()` on the class. |
| `apps/api/src/entries/find-entries-query.dto.ts` | **New.** `word?: string`, optional and a string. |
| `apps/api/src/entries/contains-non-whitespace.decorator.ts` | **New.** The rule no library decorator expresses. |
| `apps/api/src/entries/contains-at-least-one-field.decorator.ts` | **New.** The class-level empty-body rule. |
| `apps/api/src/entries/entries.service.ts` | `findByContent('')` returns `[]`. |
| `apps/api/src/entries/entries.controller.spec.ts` | 13 validation tests removed, 1 added, 4 call sites updated. |
| `apps/api/src/entries/entries.service.spec.ts` | 1 test added, for the empty search term. |
| `apps/api/src/entries/create-entry.dto.spec.ts` | **New.** 10 tests. |
| `apps/api/src/entries/update-entry.dto.spec.ts` | **New.** 11 tests. |
| `apps/api/src/entries/find-entries-query.dto.spec.ts` | **New.** 6 tests. |
| `apps/api/test/app.e2e-spec.ts` | Message assertions added throughout; 8 tests added. |
| `apps/api/package.json`, `pnpm-lock.yaml` | Two dependencies. |
| `apps/api/src/entries/entry.interface.ts` | **Unchanged**, deliberately — see *Decisions*. |

---

## Decisions made

**1. `transform: true`.** The prompt asked for this to be chosen deliberately
and justified either way.

Chosen, and the argument is the same one that ends `unknown`. With `transform`
off, the pipe validates a `CreateEntryDto` and then hands the controller
`classToPlain(entity)` — a plain object wearing the class's name. The parameter
would be labelled `CreateEntryDto` and hold something that is not one, which is a
quieter version of exactly the lie ADR-005 wrote `unknown` to avoid. With it on,
the controller receives a real instance and the declared type is true.

The constraint it had to satisfy is that it converts nothing. It does not:
`class-transformer` copies values across untouched unless a `@Transform` or
`@Type` asks otherwise, and no DTO has either. There is a test
(`POST /entries stores content verbatim, spacing included`) that posts
`"  the spacing I chose  "` and re-reads it over HTTP, so a future
`enableImplicitConversion` or a stray `@Transform` fails the suite rather than
quietly editing someone's journal.

The second argument is forward-looking and is already written in ADR-008's
revisit conditions: every query-string value arrives as a string, so the first
DTO that needs a number or a boolean from a query needs `transform` on. Turning
it on later would change the type of every existing parameter at once; turning
it on now, while the only DTO fields are strings, changes nothing.

**2. The empty-search rule lives in `EntriesService`, not the controller.**
`?word=` had to return `[]`, and the controller alone cannot deliver that: the
empty string reaches the repository as `LIKE '%%'`, which matches every row. So
the wrong answer is available from two different layers and had to be closed in
one of them.

The controller decides only *whether a search was requested* — reading the
request is its job. *What an empty search finds* is a rule about entries, so it
sits in the service. It is not in the repository because `%%` matching
everything is a true fact about `LIKE`; overriding it is a product decision, and
the repository is not allowed to have those (ADR-004).

**3. `@ValidateIf` rather than `@IsOptional()` on optional fields.** This
started as a defect I introduced and is written up under *Limitations* below.

**4. `entry.interface.ts` stays an interface.** Named here because it is the
decision most easily lost in a refactor that turns two neighbouring files into
classes. What an entry *is* is a return type; only what a client may *send*
becomes a class, because only that needs decorators (ADR-005).

**5. Both custom decorators live in `src/entries/`.** They are used by the
entries DTOs and nothing else. A `src/validation/` folder would be a home built
for an occupant who has not arrived (Principle 2). Moving one later is a
one-line import change.

**6. `create-entry.dto.ts` and `update-entry.dto.ts` repeat the two content
rules rather than sharing a base class.** A reader of either file learns what
that endpoint accepts without following an inheritance chain. What *is* shared
is the sentence a sender receives, which is the part that would have drifted —
that is the present-tense argument ADR-008 gives for the custom decorator
existing at all, and it would be undone by writing `message:` at two use sites.
Both files are tested separately, so the two declarations cannot drift silently.

---

## Assumptions

- **`GET /entries/count` is left unguarded against unknown query parameters.**
  It declares no query DTO, so `?werd=x` returns 200 there while it returns 400
  on `GET /entries`. That asymmetry is not new — the old code inspected `word`
  only on `findAll` — and closing it would mean inventing a DTO for an endpoint
  that takes no input. Left as it was found, and named here so it is a known
  gap rather than an unnoticed one.
- **The four transitive dependencies were treated as inside the "exactly two"
  budget.** `package.json` gained exactly two entries. `class-validator` brings
  `validator` (1.5M) and `libphonenumber-js` (13M) with it, neither of which
  this application uses. That is a real cost of the choice and it is recorded
  here because a lockfile inspection will show them.
- **`ValidationPipe`'s response shape** (`{ statusCode, message: string[], error }`)
  is now part of the API's observable behaviour. Nobody chose it; it arrived
  with the library, and the tests now assert on it.

---

## Limitations

**1. `PATCH {"content": null}` was a 500, and this is a defect I introduced.**

The first implementation used `@IsOptional()`, which is the idiom every NestJS
example uses for a partial-update field. `@IsOptional()` skips the remaining
rules when the value is `null` **or** `undefined`. So `{"content": null}` passed
every check, satisfied the class-level "at least one field" rule — `null` is a
value that arrived — and reached a `NOT NULL` column, which is a 500. Under the
hand-written `parseContent` it had been a 400.

That is a behaviour change nobody decided, which makes it a defect and not a
trade. It is fixed: both optional fields use
`@ValidateIf((dto) => dto.content !== undefined)` instead, so `undefined` means
"I am not changing this field" and `null` is a value the client sent that is not
a string. `PATCH {"content":null}` is a 400 again, with `content must be a
string` — the same sentence as before Day 7.

Two things about how it was found are worth recording. It was found by asking
what happens to a case the verification list does not name, not by a test going
red; nothing was testing it, before or after. And the fix is a case where the
library's most idiomatic decorator was the wrong one — `@IsOptional()` is what
the documentation reaches for, and it encodes an assumption about `null` that
this schema does not share.

**2. A field named literally `undefined` needed closing by hand.**
`class-validator` has no class-level registration. The one arrangement that
works registers the rule against *no property*, and the library then looks it up
as `object["undefined"]` — which means a body containing a field named
`undefined` looks, to `forbidNonWhitelisted`, like it named a property the
server recognises. `PATCH {"undefined":"x"}` would have slipped through
validation and failed downstream as a 500.

The decorator closes it: if its own value is anything other than `undefined`, a
client sent that field and the body is refused. The residual cost is that such a
body receives `the request body must contain at least one field to update`
rather than `property undefined should not exist`. Both are 400s; only the
sentence is wrong, and it is wrong for a body no honest client sends. Tested at
both levels.

**3. `dto.content!` in `update`, and it will be wrong on Day 13.** The
class-level rule guarantees at least one field arrived; with one updatable field
that is the same sentence as "`content` arrived", so the assertion is true today
and the compiler cannot see it. When `mood` arrives, `{"mood":"tired"}` will
satisfy the class rule with `content` still undefined and nothing will complain.
The old `parseUpdateEntryDto` returned a narrowed type and gave the compiler
that guarantee for free. This is what the refactor cost, and the comment saying
so is at the line whoever adds the second field will edit.

**4. The error messages are no longer ours.** A `class-validator` upgrade can
reword this API's responses without anybody deciding to. Nothing in the suite
would object — the tests assert the new strings, so they would go red, which is
the best that can be arranged. Recorded in ADR-008 as an accepted cost.

---

## Dependencies added

```
class-validator    ^0.15.1
class-transformer  ^0.5.1
```

Exactly two entries in `apps/api/package.json`. `pnpm-lock.yaml` also gained
`validator@13.15.35` and `libphonenumber-js@1.13.12`, which `class-validator`
depends on and this application does not use.

---

## Testing performed

### The four commands

```
$ pnpm lint
$ eslint "{src,apps,libs,test}/**/*.ts" --fix
   (no output)

$ pnpm typecheck
$ tsc --noEmit -p tsconfig.json
   (no output)

$ pnpm build
$ nest build
   (no output)

$ pnpm test
Test Suites: 7 passed, 7 total
Tests:       96 passed, 96 total

$ pnpm test:e2e
Test Suites: 3 passed, 3 total
Tests:       32 passed, 32 total
```

Before this work: 4 suites / 80 unit tests, 3 suites / 24 end-to-end tests.
After: 7 suites / 96 unit tests, 3 suites / 32 end-to-end tests. The unit
arithmetic is 80 − 13 removed + 27 new + 2 added to existing files = 96; the
removals are explained under question 2.

### Against the real application

Built output, port 3777, a throwaway database in a temporary directory. Real
responses, pasted:

```
POST   {"content":"ok"}                    -> 201  {"id":"fd26b0c2-…","content":"ok","createdAt":"2026-09-01T08:20:16.664Z"}
POST   {}                                  -> 400  {"message":["content must be a string"],"error":"Bad Request","statusCode":400}
POST   {"content":42}                      -> 400  {"message":["content must be a string"],"error":"Bad Request","statusCode":400}
POST   {"content":"   "}                   -> 400  {"message":["content must contain at least one character that is not whitespace"],"error":"Bad Request","statusCode":400}
POST   {"content":"x","id":"mine"}         -> 400  {"message":["property id should not exist"],"error":"Bad Request","statusCode":400}
PATCH  {}                                  -> 400  {"message":["the request body must contain at least one field to update"],"error":"Bad Request","statusCode":400}
PATCH  {"contnet":"typo"}                  -> 400  {"message":["property contnet should not exist"],"error":"Bad Request","statusCode":400}
PATCH  {"content":null}                    -> 400  {"message":["content must be a string"],"error":"Bad Request","statusCode":400}
PATCH  {"undefined":"x"}                   -> 400  {"message":["the request body must contain at least one field to update"],"error":"Bad Request","statusCode":400}
PATCH  {"content":"edited"}                -> 200  {"id":"fd26b0c2-…","content":"edited","createdAt":"2026-09-01T08:20:16.664Z"}
```

```
GET    /entries?word=sister                -> 200  [{"id":"8e300301-…","content":"my sister called today",…}]
GET    /entries?word=a&word=b              -> 400  {"message":["word must be a string"],"error":"Bad Request","statusCode":400}
GET    /entries?werd=sister                -> 400  {"message":["property werd should not exist"],"error":"Bad Request","statusCode":400}
GET    /entries?word=                      -> 200  []
GET    /entries                            -> 200  [{"content":"100% exhausted today",…},{"content":"my sister called today",…},{"content":"edited",…}]
GET    /entries?word=100%25                -> 200  [{"id":"a776a5f3-…","content":"100% exhausted today",…}]
```

The last two lines of the first block and the last three of the second are the
ones that matter. `?word=` returns `[]` while `/entries` returns all three
entries — they disagree, which is the point of step 6 — and `?word=100%25`
returns only the entry containing a percent sign, so the repository's `LIKE`
escaping still works through the new query DTO.

The server was stopped afterwards and the throwaway database deleted; port 3777
refuses connections and the scratch directory is empty. `apps/api/data/neuron.db`
was never opened.

### Boundary checks

All three return nothing:

```
$ grep -rn "process\.env" apps/api/src --include=*.ts | grep -v "src/config"
$ grep -n "node:sqlite\|DatabaseSync\|DATABASE\|SELECT\|INSERT\|UPDATE\|DELETE\|prepare(" \
    apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.controller.ts
$ grep -nE "HttpException|NotFoundException|BadRequestException" \
    apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.repository.ts \
    | grep -v "^\S*:[0-9]*: *[/*]"
```

`EntryRow` appears in `entries.repository.ts` and nowhere else.

### The acceptance criterion

**Mutation A — the `APP_PIPE` provider removed from `AppModule`.**

```
Tests:       96 passed, 96 total          <- unit suite
Tests:       14 failed, 18 passed, 32 total   <- end-to-end suite
Test Suites: 1 failed, 2 passed, 3 total

  ● POST /entries rejects no content field with 400 and says why
    expected 400 "Bad Request", got 500 "Internal Server Error"
  ● POST /entries rejects content that is not a string with 400 and says why
    expected 400 "Bad Request", got 201 "Created"
  ● POST /entries rejects empty content with 400 and says why
    expected 400 "Bad Request", got 201 "Created"
  ● POST /entries rejects whitespace-only content with 400 and says why
    expected 400 "Bad Request", got 201 "Created"
  ● POST /entries answers a non-string content with one message
    expected 400 "Bad Request", got 201 "Created"
  ● GET /entries is empty after only rejected writes
    expected 400 "Bad Request", got 500 "Internal Server Error"
  ● POST /entries rejects an unrecognised field with 400
    expected 400 "Bad Request", got 201 "Created"
  ● POST /entries names the unrecognised field
    expected 400 "Bad Request", got 201 "Created"
  ● PATCH /entries/:id rejects an unrecognised field with 400
    expected 400 "Bad Request", got 500 "Internal Server Error"
  ● GET /entries rejects a repeated word parameter with 400
    expected 400 "Bad Request", got 500 "Internal Server Error"
  ● GET /entries rejects an unrecognised query parameter with 400
    expected 400 "Bad Request", got 200 "OK"
  ● PATCH /entries/:id returns 400 for an empty body
    expected 400 "Bad Request", got 500 "Internal Server Error"
  ● PATCH /entries/:id returns 400 for a content field of null
    expected 400 "Bad Request", got 500 "Internal Server Error"
  ● PATCH /entries/:id returns 400 for a field named undefined
    expected 400 "Bad Request", got 500 "Internal Server Error"
```

Four of the fourteen answer **201** with the pipe gone — the request was
accepted and a row written. Nine answer **500**, because `content` reaches a
`NOT NULL` column as `undefined` and SQLite refuses it; that is the database
catching, by accident and with the wrong status code, what validation was
supposed to catch on purpose. One answers **200**: an unrecognised query
parameter is simply ignored, which is the old silent-typo behaviour ADR-006
removed.

The unit suite stays green, and that is correct rather than a miss. The DTO
specs assert that the *rules* are right; they cannot assert that anything calls
them, exactly as `env.validation.spec.ts` could not on Day 6. The claim "the
application applies these rules" is only observable where the real application
is built, which is why all fourteen failures are end-to-end.

**Mutation B — `@Query() query: FindEntriesQueryDto` reverted to
`@Query('word') word?: unknown`.**

```
Tests:       2 failed, 30 passed, 32 total   <- end-to-end suite

  ● GET /entries rejects a repeated word parameter with 400
    expected 400 "Bad Request", got 500 "Internal Server Error"
  ● GET /entries rejects an unrecognised query parameter with 400
    expected 400 "Bad Request", got 200 "OK"
```

Exactly the two tests the prompt named, and no others in the end-to-end suite.

**Lint, typecheck and build all pass on the mutated code**, which is the point
being made: the declared type of one parameter is what decides whether the pipe
runs at all, and no tool except a test notices when it changes.

The unit suite also went red, with four failures — and they are an artifact of
how the mutation was performed rather than evidence of anything:

```
Tests:       4 failed, 92 passed, 96 total   <- unit suite

  ● findAll › should return entries that each satisfy the JournalEntry contract
  ● create › should hand the created entry to findAll
  ● findAll by word › should return an empty array when nothing matches
  ● findAll by word › should list everything for an absent word and nothing for an empty one
```

`entries.controller.spec.ts` calls `controller.findAll({ word: … })` directly,
and the mutated signature takes the raw parameter instead, so those four crash
on the object they are handed. They are not detecting the missing validation —
they would fail the same way if the signature had been changed to anything else.
The two end-to-end failures are the ones that mean something.

Both mutations were reverted and the whole verification re-run: lint, typecheck,
build clean, 96 unit tests and 32 end-to-end tests passing.

---

## The three questions

### 1. How many lines did `entries.controller.ts` lose, and what is left in it?

**248 → 158 lines, so 90 lines lost.** Counting only code — no blank lines, no
comments — it went from **112 to 59**, so 53 lines of actual code.

The deleted block was 114 lines, of which 50 were code:

```
15  parseEntryBody
 9  parseContent
 7  parseCreateEntryDto
 9  parseUpdateEntryDto
 9  parseSearchTerm
 1  RECOGNISED_FIELDS
```

What is left is six route handlers and nothing else: three
`NotFoundException` translations, the `{ count }` wrapper, one presence test on
`query.word`, one non-null assertion, and the calls into the service. There is
no longer any `BadRequestException` in the file, and no `import` from
`@nestjs/common` for one. The only conditional logic remaining is about *absence*
— a missing entry, an absent search parameter — which is what an HTTP layer is
for.

### 2. Which existing tests had to change, and for each, was it a message change or a behaviour change?

**Thirteen unit tests were deleted, and none of them was either.** They tested
input rejection by calling `controller.create({content: 42})` directly. The pipe
runs between the network and the controller, so it does not run at all on a
direct call — those tests would have passed no matter what the rules said. They
are not a loss: the rules they asserted are now in the three DTO specs (27
tests), and the fact that the application enforces them is asserted over real
HTTP. Deleted:

- `create validation` (7): no content field; not a string; empty; whitespace-only;
  nothing stored after a rejection; unrecognised field; the message names the field
- `findAll by word` (1): a word given more than once
- `update` (5): the three-case `it.each`; a misspelled field; a body with nothing to update

Four call sites changed shape without changing their claim: `findAll()` →
`findAll({})` and `findAll('zzzzz')` → `findAll({ word: 'zzzzz' })`.

**Message changes** — the API's observable behaviour changed, each one accepted
under ADR-008 Decision 8:

| Case | Before | After |
| --- | --- | --- |
| `POST {}` | `content is required` | `content must be a string` |
| `POST {"content":""}` | `content must not be empty` | `content must contain at least one character that is not whitespace` |
| `POST {"content":"   "}` | `content must not be empty` | (same as above) |
| unrecognised field, both endpoints | `Unrecognised field(s): id. Only content may be sent.` | `property id should not exist` |
| `?word=a&word=b` | `word may only be given once` | `word must be a string` |
| `PATCH {}` | `Request body must contain at least one field to update` | `the request body must contain at least one field to update` |

`POST {"content":42}` answers `content must be a string` before and after. ADR-008
predicted this and called it a coincidence rather than a design; it is, and the
test that keeps passing does so for a reason unconnected to anyone choosing it.

The last row is our own message, not the library's — the class-level check
supplies it. The change is only capitalisation and an article, chosen so that
every sentence in a `message` array reads the same way.

**Behaviour changes.** Two, both decided in advance:

1. `GET /entries?werd=sister` was 200 and is now 400 (ADR-008, Decision 6). New
   behaviour arriving as a side effect of `forbidNonWhitelisted`, put to the
   owner as a decision and chosen for consistency with `POST` and `PATCH`.
2. `GET /entries?word=` returned every entry and now returns `[]` (Decision 7).

**A behaviour change nobody decided is a defect, and there was one.**
`PATCH {"content": null}` went from 400 to 500 under `@IsOptional()`. It is
written up under *Limitations* and fixed; it is a 400 again with the same
message it had before Day 7. It was mine, it was not caught by any test, and the
only reason it is in this report rather than in production is that I went
looking for cases the verification list did not name.

### 3. Did `class-validator` earn its place, honestly?

**Not on the code it saved. It did not save any.** Counting only code lines:

```
removed   50   five parse functions and RECOGNISED_FIELDS
added     51   the two custom decorators
          17   DTO growth (6 lines of interface became 23 of class)
          10   the APP_PIPE registration
           3   the empty-search guard in the service
        ————
net      +31
```

The refactor made the application *longer*. And the sharper version of that
number: of the four body rules, the library owns two — "is this a string" and
"are there keys nobody declared". The two it has never heard of took **51 code
lines of `registerDecorator` boilerplate**, against roughly **eight** for the
hand-written versions they replaced. The prompt asked whether the custom
decorator and the class-level check gave back most of the hand-written code.
They gave back more than all of it.

So ADR-008's principle held exactly, and cost more than the ADR expected: **a
library knows about shapes; it does not know about your product.** The two rules
that are about a journal rather than about JSON are now written in a more
awkward form than they were on Day 6 — a `registerDecorator` call with a
`validate` and a `defaultMessage`, and in the class-level case a documented
misuse of a library that has no class-level API and a hand-closed hole where a
field named `undefined` would otherwise slip through. `parseContent` was three
lines and read like English.

**What it did earn is the thing the day was actually for.** Mutation B is the
proof. Reverting one parameter's type from `FindEntriesQueryDto` to `unknown`
passed lint, passed typecheck, passed build, and removed two rules from the
running API. Under the old arrangement that failure mode was not a mutation, it
was the *normal* way to add an endpoint: write a handler, forget to call
`parseEntryBody`, and nothing anywhere objects. The pipe does not make forgetting
impossible — Mutation B is exactly the shape of forgetting that survives — but it
inverts the default. Validation is now what happens unless you take a step to
stop it, rather than what happens if you remember to ask.

That is worth 31 lines. It is not worth 31 lines *and* a 13M phone-number library
that will never be called, and if this were a decision about code alone I would
say so more loudly. It is not: ADR-008 records that learning how NestJS
conventionally does this is an explicit goal belonging to the person doing the
learning. On that ground it earned its place easily, and the honest summary is
that it bought a mechanism and a convention, and paid for both in lines.

---

## Future improvements

- **`GET /entries/count` accepts unrecognised query parameters.** Consistency
  would want a DTO on it, or a decision that endpoints taking no input do not
  need one. Worth settling before a third such endpoint exists.
- **The class-level decorator's message on a field named `undefined`.** It says
  `must contain at least one field to update` when it means `property undefined
  should not exist`. Correct status, wrong sentence. Fixable only by
  `class-validator` growing a real class-level API.
- **`dto.content!` in `update` must be revisited on Day 13**, when a second
  updatable field makes the assertion false. This is the single highest-value
  line in the diff to re-read on that day.
- **The library's messages become a user-interface problem on Day 12.**
  `property id should not exist` is adequate for an engineer reading a response
  and poor for a person reading a screen. ADR-008 already lists this as a
  revisit condition; it will arrive as a real requirement rather than a
  preference.
- **A second rule of `@ContainsNonWhitespace`'s kind** would make the
  `registerDecorator` boilerplate worth factoring, which is the condition
  ADR-008 names for revisiting the custom decorator.

---

## Lessons learned

**A type annotation can be load-bearing at runtime, and nothing warns you.**
`unknown` versus `CreateEntryDto` looks like a documentation choice and decides
whether any validation happens at all, because `emitDecoratorMetadata` writes
the declared type into the compiled file and the pipe reads it back. Mutation B
compiles, lints, builds, and quietly removes two rules. This is the least
transparent mechanism in the codebase and it just became more load-bearing.

**The most idiomatic decorator was the wrong one.** `@IsOptional()` is what
every example uses for a partial-update field, and it treats `null` as absent —
an assumption a `NOT NULL` column does not share. Reaching for the conventional
answer produced a 500 that no test caught. "It is what the documentation does"
is not the same claim as "it is right here", and the gap between them is exactly
where a library's defaults hurt.

**Deleting a test can be the correct move, and it is uncomfortable.** Thirteen
tests went, and every one of them was green when it was deleted. They had to go
because they could no longer observe the thing they claimed to observe: a
direct method call does not pass through a pipe. A test that passes regardless
of whether the rule exists is worse than no test, because it reports safety it
cannot see. The Day 6 split — rules here, wiring there — turned out to be the
general shape rather than a one-off.

**Verification lists find what they name.** Every case on the prompt's list
passed on the first run. The defect in this report was on none of them, and was
found by asking "what about `null`?" — a question the list did not contain and
nothing in the suite would ever have asked. The list is a floor.
