# ADR-008: Validation Moves to `class-validator` and a Global `ValidationPipe`

**Status:** Accepted
**Date:** 2026-08-31 (Day 7)

**Supersedes:** ADR-005's and ADR-006's deferral of a validation library.
**Reverses:** ADR-005's `@Body() body: unknown` at the trust boundary.

---

## Decision

1. **Adopt `class-validator` and `class-transformer`**, with a `ValidationPipe`
   registered globally as an **`APP_PIPE` provider in `AppModule`**, not via
   `app.useGlobalPipes()` in `main.ts`. See *Why `APP_PIPE` and not `main.ts`*.
2. **`@Body()` and `@Query()` stop being `unknown` and become DTO classes.** This
   is forced rather than chosen; see *Why `unknown` cannot survive*.
3. **`whitelist: true` and `forbidNonWhitelisted: true`.** Unknown fields are
   rejected everywhere, in query strings as well as bodies.
4. **The non-whitespace rule becomes a custom decorator**, defined once and used
   by both DTOs.
5. **`PATCH {}` remains a 400**, which needs a class-level check.
6. **The query string becomes a DTO.** `?word=a&word=b` is a 400, as ADR-006
   decided. `?werd=sister` becomes a 400, which is new.
7. **`?word=` returns `[]`.** A `word` parameter that is absent entirely still
   returns everything.
8. **The library's default messages are accepted**, except where a custom
   decorator supplies its own.

---

## The problem

91 of the 248 lines in `entries.controller.ts` are hand-written parsing, spread
across five functions. Every rule ADR-005 and ADR-006 decided lives in them.

Both of those ADRs deferred a validation library on **timing, not merit**, and
ADR-006 recorded four sharper triggers for revisiting. The revisit happened
differently from how it was scheduled: on the morning of Day 6 the project owner
reopened the decision herself, having accepted it near midnight without arguing
it, and reversed it.

The open cost this closes is the one in the debt list: **validation is enforced by
memory, not by mechanism.** Nothing makes a future endpoint validate its body. A
forgotten check passes lint, typecheck, build and every test. A globally
registered pipe removes that, because it runs before every controller method
whether anyone remembered it or not.

---

## Why `unknown` cannot survive

This is the load-bearing mechanical fact and it was not obvious in advance.

`ValidationPipe` refuses to validate anything whose declared type is `Object`.
From its own source:

```js
toValidate(metadata) {
    const types = [String, Boolean, Number, Array, Object, Buffer, Date];
    return !types.some(t => metatype === t) && !isNil(metatype);
}
```

And `unknown` compiles to exactly that. Read from the emitted metadata in
`dist/entries/entries.controller.js`:

```
findAll  (@Query('word') word?: unknown)   -> [Object]
create   (@Body() body: unknown)           -> [Object]
update   (@Param id, @Body body: unknown)  -> [String, Object]
findOne  (@Param('id') id: string)         -> [String]
```

**Switching on a global pipe today would therefore do nothing at all** — not to
either body, not to the query. The pipe has to skip `Object`, because `Object` is
what the compiler emits for anything untyped, and validating "some object" against
no declared rules is not a meaningful operation.

So the refactor is not "turn on a pipe." It is "replace `unknown` with classes,"
and the pipe starts working as a consequence.

### This reverses a Day 4 decision, and the reversal is correct

The Day 4 worker deliberately wrote `@Body() body: unknown` instead of
`@Body() body: CreateEntryDto`, and its reasoning is still in the comment: an
unvalidated body is not a `CreateEntryDto`, and naming it one asserts a guarantee
nobody established.

That reasoning was right then and stops being right now, and the difference is
the pipe. Today nothing runs before the controller method, so the label is a lie.
With a pipe in front, something *does* run first and makes the label true before
the method sees it. **`unknown` and `ValidationPipe` cannot both be correct at the
same time**, and which one is correct depends entirely on whether anything
validates in between.

---

## What the library does and does not know

Established by running `class-validator` against the real cases rather than by
reading its documentation.

```
--- @IsString() only ---
  unknown field     -> property id should not exist
  not a string      -> content must be a string
  empty string ""   -> ACCEPTED
  whitespace "   "  -> ACCEPTED

--- @IsString() + @IsNotEmpty() ---
  empty string ""   -> content should not be empty
  whitespace "   "  -> ACCEPTED

--- @IsString() + @Matches(/\S/) ---
  whitespace "   "  -> content must match /\S/ regular expression
  not a string      -> content must be a string; content must match /\S/ regular expression
```

**The principle this produced: a library knows about shapes. It does not know
about your product.** "Is this a string?" and "does this object have keys nobody
declared?" are questions every application asks, which is precisely why they are
worth putting in a library. "Content must contain something a person can actually
see" is a decision about a journal, and the library has never heard of journals.

Two smaller observations worth keeping:

`content must be a string` came out **identical** to the message the existing
suite already asserts. That is a coincidence and not a design, so one existing
test will keep passing after this refactor for a reason unconnected to anyone
having chosen it.

`@IsNotEmpty()` accepts three spaces. This was predicted correctly by the project
owner weeks before it was run.

---

## Decision 4: a custom decorator for the non-whitespace rule

Three options were run and compared. `@Matches(/\S/)` enforces the rule but its
message is `content must match /\S/ regular expression`, which tells the sender
nothing and leaks the implementation, and it fires *alongside* the string error so
`{"content": 42}` produces two messages of which one is noise. Supplying a
`message` option fixes the wording but hand-writes it at every use site.

A custom decorator was chosen. The argument the owner gave was that the check and
its message travel together so nothing has to be rewritten from memory.

There is a present-tense argument as well, which matters under Rule Zero:
**`content` is validated in two DTOs, not one** — `create-entry.dto.ts` and
`update-entry.dto.ts`. Under the `message`-option approach the same sentence would
be written twice, and two copies of a sentence drift the moment one is edited.
The rule and its wording exist once instead.

---

## Decision 5: `PATCH {}` stays a 400, and its justification has changed

`PATCH` is a partial update, so `content` must be optional, and an all-optional
DTO has nothing to object to in `{}`. Confirmed:

```
{"content":"new text"}  -> ACCEPTED
{}  (empty body)        -> ACCEPTED     <- ADR-006 says 400
{"contnet":"typo"}      -> property contnet should not exist
```

**The reason ADR-006 made this rule is now enforced by something else.** That rule
came from the misspelled field: `PATCH {"contnet": "..."}` returning `200 OK` while
changing nothing, so the user believes an edit was saved that was not. Line three
shows `forbidNonWhitelisted` catching exactly that, for free.

What remains is only the genuinely empty body. The rule was re-examined on those
terms rather than preserved by default, and kept: an empty `PATCH` is a request
the client got wrong, and saying so is better than silently doing nothing. It
needs a class-level check, because no single-property decorator can express "at
least one field must be present."

---

## Decisions 6 and 7: the query string

Run against what Express actually hands the controller:

```
(none)            {}                 -> ACCEPTED
?word=sister      "sister"           -> ACCEPTED
?word=            ""                 -> ACCEPTED
?word=a&word=b    ["a","b"]          -> word must be a string
?werd=sister      {"werd":"sister"}  -> property werd should not exist
?word=100%        "100%"             -> ACCEPTED
```

ADR-006's repeated-parameter decision survives and is now enforced by the library
rather than by `parseSearchTerm`.

**`?werd=sister` becoming a 400 is new behaviour arriving as a side effect.**
`forbidNonWhitelisted` does not distinguish a body from a query string. It was
put to the owner as a decision rather than accepted silently, and she chose the
400, for consistency with `POST` and `PATCH`. The counter-argument on the record
is that browsers and analytics tools append parameters to URLs, which is a real
difference between a query string and a request body. Revisit if that bites.

**`?word=` now returns `[]`.** This gap predates the refactor and is unrelated to
it: an empty string is falsy, so `if (term)` treats it as though no search was
requested and returns the entire journal. The owner's reasoning for `[]` was that
nothing was entered to search for.

That is her own Day 6 principle applied one layer up. An absent parameter and an
empty one are different messages: no `word` at all means *"I am not searching,
show me everything"*, while `?word=` means *"I am searching, and this is my
term"* — and searching for nothing finds nothing. **The implementation must
therefore test whether the parameter was present, not whether it is truthy.**

---

## Decision 8: the library's messages are accepted

`Unrecognised field(s): id. Only content may be sent.` becomes
`property id should not exist.`

The existing message names the rule and tells the client what it may send; the
library's names the symptom. The existing wording is better. Keeping it would mean
supplying a `message` on every constraint, which is hand-writing the thing this
ADR exists to stop hand-writing, so the library's defaults are accepted as a
straight trade. The custom decorator from Decision 4 remains the exception,
because there the default is not merely worse but useless.

**Existing tests that assert on the old strings must be updated, and each change
must be read as a decision rather than a fix.** A message change is a change to
the API's observable behaviour.

---

## Why `APP_PIPE` and not `main.ts`

Both are described as "registering a global pipe" and both work when the server
runs. They differ in what the tests see.

`app.useGlobalPipes(...)` attaches the pipe to the application object that
`main.ts` builds. **Nothing in this repository imports `main.ts`** — verified,
the grep returns nothing. Tests build the application straight from `AppModule`
via `createTestingModule({ imports: [AppModule] }).createNestApplication()`, so
under that arrangement the end-to-end suite would run against an application with
no pipe at all.

The first consequence is loud rather than dangerous: those tests assert 400s, so
with no pipe and the hand-written parsers gone they would come back 201 or 500 and
the suite would go red immediately.

**The dangerous consequence is the fix somebody would then apply.** Adding
`app.useGlobalPipes(...)` to the test setup makes the suite green again, and from
that moment it asserts against a pipe *the test* configured rather than the one
the application ships. Changing `forbidNonWhitelisted` in `main.ts` afterwards
leaves every test green while the real API changes behaviour. Two descriptions of
one application, free to drift.

`APP_PIPE` puts the pipe in the module graph, so there is one description and
everything that builds `AppModule` gets it — production, the end-to-end suite, and
the config-wiring spec added on Day 6. This is the same reasoning that produced
that spec: a piece working is not the same as the pieces being connected.

---

## Accepted costs

- **Two dependencies**, `class-validator` and `class-transformer`.
- **DTOs become classes** rather than interfaces, because decorators need a
  runtime object to attach to, and the codebase leans harder on decorator
  metadata — already its least transparent mechanism.
- **The error messages stop being ours.** A library upgrade can reword the API's
  responses without anybody deciding to.
- **A global pipe applies to routes that do not exist yet.** That is the entire
  point and it is also the risk: a future endpoint is validated by default, and
  changing its declared type silently changes what is enforced.
- **This is in tension with ADR-005's learning argument**, which held that
  understanding *why* validation is needed transfers everywhere while knowing a
  framework's API names does not. That argument is not withdrawn. It is outweighed
  by an explicit learning goal belonging to the person doing the learning, stated
  twice in one day: that learning how NestJS conventionally does things is itself
  a goal of this project. Recorded, not smoothed over.

---

## Amendments, same day, after the implementation and the audit

### 1. The refactor made the codebase longer, not shorter

This ADR framed the change as replacing 91 lines of hand-written parsing. The
worker counted honestly and the net is **+31 code lines**:

```
removed   50   five parse functions and RECOGNISED_FIELDS
added     51   the two custom decorators
          17   DTO growth (6 lines of interface became 23 of class)
          10   the APP_PIPE registration
           3   the empty-search guard in the service
        ————
net      +31
```

Of the four body rules, the library owns two — "is this a string" and "are there
keys nobody declared". The two it has never heard of cost **51 lines of
`registerDecorator` boilerplate against roughly eight hand-written**. So this
ADR's own principle held and cost more than it predicted: a library knows about
shapes, and where a rule is about a journal rather than about JSON, expressing it
through the library is *more* awkward than writing it out. `parseContent` was
three lines and read like English.

**What was actually bought is the inversion of the default.** Before, adding an
endpoint and forgetting to call `parseEntryBody` was the normal way to write one,
and nothing objected. Now validation is what happens unless somebody takes a step
to stop it. That is the debt this ADR set out to close, and it closed. The line
count was never the point, and this record should not have implied it was.

### 2. `@IsOptional()` is the wrong decorator for an optional field here

Found and fixed by the worker; recorded because the trap is not obvious and the
idiomatic choice is the broken one.

`@IsOptional()` skips the remaining rules when a value is `null` **or**
`undefined`. So `PATCH {"content": null}` passed every check, satisfied the
class-level "at least one field" rule, reached a `NOT NULL` column and produced a
**500** — where the hand-written `parseContent` had answered 400.

The fix is `@ValidateIf((dto) => dto.content !== undefined)`, so `undefined` means
"I am not changing this field" while `null` is a value the client sent that is not
a string. Verified over real HTTP during the audit: `PATCH {"content":null}` is a
400 again.

Every NestJS example reaches for `@IsOptional()`. It encodes an assumption about
`null` that this schema does not share.

### 3. ⚠️ A 400 no longer has one response shape — found by the audit

Not in the worker's report, and new with this change.

```
before Day 7   BadRequestException('content must be a string')
               -> { "message": "content must be a string", ... }      a STRING

after, from the pipe
               -> { "message": ["content must be a string"], ... }    an ARRAY

after, from body-parser (malformed JSON, before the pipe ever runs)
               -> { "message": "Unexpected token 'n', ...", ... }     a STRING
```

`POST` with a body of `null`, `42` or `"a string"` is rejected by Express's JSON
parser in strict mode before the pipe is reached, and its message is a raw parser
error rather than a designed sentence. The status code is right in every case;
only the shape and the wording are inconsistent.

Before Day 7 every 400 from this API had a string `message`. Now it depends on
which layer rejected the request, and a client reading errors has to handle both.
**Nobody decided this.** It is recorded as debt rather than fixed, because no
client exists yet and the right moment to decide an error contract is when
something has to display it.

### 4. `GET /entries/count` accepts unrecognised query parameters

Declared honestly by the worker as a known gap and confirmed in the audit:
`GET /entries?werd=x` is a 400 while `GET /entries/count?werd=x` is a 200, because
only the first declares a query DTO. The asymmetry is not new — the old code
inspected `word` only on `findAll` — but Decision 6 makes it visible. Left as
found rather than closed by inventing a DTO for an endpoint that takes no input.

---

## Future Revisit Conditions

Revisit **`?werd=sister` returning 400** if a browser, analytics tool or client
library appends a query parameter of its own and breaks a real request.

Revisit **the custom decorator** if a second rule of the same kind appears and the
two want to share machinery.

Revisit **accepting the library's messages** when a frontend exists (Day 12) and
somebody has to display them to a person. `property id should not exist` is
adequate for an engineer reading a response and poor for a user interface.

Revisit **the global pipe's `transform` behaviour** when a DTO first needs a
number or a boolean from a query string, since every query value arrives as a
string and transformation becomes load-bearing at that point.
