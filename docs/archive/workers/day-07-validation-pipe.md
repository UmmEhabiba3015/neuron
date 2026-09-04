# Worker Prompt — Day 7: Validation Moves to `class-validator`

## Context

You are implementing one isolated task on the Neuron project. Read
`docs/constitution.md` and
`docs/decisions/ADR-008-validation-library-and-global-pipe.md` before you start.
ADR-005 and ADR-006 give the history of the rules you are re-expressing.

Do **not** touch git. No branching, no committing, no merging. Those are human
actions on this project.

This work has been designed in full by the Master Thread with the project owner.
**You are implementing a decided design, not choosing one.** Where this prompt
states a decision, follow it. If you believe a decision is wrong, implement it as
written and record your objection in the report. Two workers on this project have
now corrected the record they were handed, and both times it improved the ADR. An
honest objection is wanted, not tolerated.

Add **exactly two** dependencies: `class-validator` and `class-transformer`.
Nothing else. No `joi`, no `zod`.

## The problem

91 of the 248 lines in `apps/api/src/entries/entries.controller.ts` are
hand-written parsing, in five functions: `parseEntryBody`, `parseContent`,
`parseCreateEntryDto`, `parseUpdateEntryDto`, `parseSearchTerm`.

Every rule ADR-005 and ADR-006 decided lives in them, and nothing forces a future
endpoint to call any of them. A forgotten check passes lint, typecheck, build and
every test. That is the debt this closes.

## The mechanical fact that shapes the whole task

`ValidationPipe` refuses to validate anything whose declared type is `Object`:

```js
toValidate(metadata) {
    const types = [String, Boolean, Number, Array, Object, Buffer, Date];
    return !types.some(t => metatype === t) && !isNil(metatype);
}
```

`unknown` compiles to exactly that. Verified from the emitted metadata:

```
findAll  (@Query('word') word?: unknown)   -> [Object]
create   (@Body() body: unknown)           -> [Object]
update   (@Param id, @Body body: unknown)  -> [String, Object]
```

**So switching on the pipe without replacing `unknown` would do nothing at all.**
The task is not "turn on a pipe"; it is "replace `unknown` with classes", and the
pipe starts working as a consequence.

This reverses the Day 4 decision to type bodies as `unknown`. That decision was
correct while nothing ran before the controller method. With a pipe in front the
label stops being a lie, because something makes it true first.

## The decided design

### 1. Register the pipe as `APP_PIPE`, in `AppModule`

Not `app.useGlobalPipes()` in `main.ts`. Nothing imports `main.ts`, so a pipe
registered there is invisible to every test, and the repair somebody would reach
for — configuring a pipe in the test setup — creates two descriptions of one
application that are free to drift.

```ts
{ provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }) }
```

Choose `transform` deliberately and justify it in the report either way.

### 2. DTOs become classes

`create-entry.dto.ts` and `update-entry.dto.ts` become classes with decorators.
`@Body() body: unknown` becomes `@Body() dto: CreateEntryDto` and
`@Body() body: unknown` becomes `@Body() dto: UpdateEntryDto`.

`entry.interface.ts` — what an entry **is** — stays an interface. Only what a
client may **send** becomes a class. That distinction was decided in ADR-005 and
does not change.

### 3. A custom decorator for the non-whitespace rule

`content` must contain at least one non-whitespace character. `@IsNotEmpty()`
does **not** do this — it accepts `"   "`. `@Matches(/\S/)` does, but its message
is `content must match /\S/ regular expression`, which tells the sender nothing,
and it fires alongside the string error so `{"content": 42}` produces two messages
of which one is noise.

Write a custom decorator that carries both the check and a message written for a
person. It is used by **both** DTOs, which is why it exists rather than a
`message` option: the same sentence written twice drifts the moment one copy is
edited.

### 4. `PATCH {}` is a 400

`content` is optional on `UpdateEntryDto`, so an all-optional DTO accepts `{}`.
A class-level check is needed, since no single-property decorator can say "at
least one field must be present." Its message must say what the client should do.

### 5. The query string becomes a DTO

`@Query('word') word?: unknown` becomes `@Query() query: FindEntriesQueryDto`
with an optional `word`. This makes the pipe apply to the query string, which is
what carries ADR-006's repeated-parameter rule:

```
?word=a&word=b   -> Express gives ["a","b"]  -> word must be a string   400
?werd=sister     -> property werd should not exist                      400
```

The second is **new behaviour, decided deliberately** for consistency with `POST`
and `PATCH`. It is not an accident of `forbidNonWhitelisted` — record it as a
tested decision.

### 6. `?word=` returns `[]`

A `word` parameter that is present but empty is a search for nothing, and finds
nothing. A `word` parameter that is **absent entirely** still returns every entry.

The current code cannot express this: `if (term)` treats `""` as falsy and falls
through to `findAll()`. **Test whether the parameter was present, not whether it
is truthy.** This is the single most likely thing to get wrong in this task.

### 7. The library's messages are accepted

`Unrecognised field(s): id. Only content may be sent.` becomes
`property id should not exist.` Do not supply `message` options to preserve the
old wording — the custom decorator in step 3 is the only exception.

Existing tests asserting the old strings must be updated. **Every such change is
a change to the API's observable behaviour, so list each one in the report.**

### 8. Delete the parse functions

All five, once nothing calls them. `escapeLikePattern` stays where it is, in the
repository — `LIKE`'s pattern language is database vocabulary and that boundary
does not move.

### 9. Tests

Every rule above needs a claim a broken implementation cannot satisfy. This
project has a documented case where a missing word `only` let a completely broken
search pass its test, and another where `toThrow()` with no argument was satisfied
by a typo in the test itself. Assert on messages, not on the fact that something
threw.

The 80 unit tests and 24 end-to-end tests must still pass, except where step 7
requires a message to change.

## Constraints

- **Exactly two new dependencies.** `pnpm-lock.yaml` will be inspected.
- **No file outside `src/config` may read `process.env`.** Still true; do not
  break it.
- **The service and repository may not learn about HTTP.** The existing boundary
  greps must still return nothing.
- **`EntryRow` must not escape `entries.repository.ts`.**
- Content is stored verbatim. Whitespace decides validity; it never edits the
  value. `transform` must not silently trim anything.

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
```

Report actual output and counts, not intent.

Then against the real application on a free port, pasting real responses:

```
POST   {"content":"ok"}                    -> 201
POST   {}                                  -> 400
POST   {"content":42}                      -> 400
POST   {"content":"   "}                   -> 400   <- the custom decorator's message
POST   {"content":"x","id":"mine"}         -> 400
PATCH  {}                                  -> 400
PATCH  {"contnet":"typo"}                  -> 400
GET    /entries?word=sister                -> 200
GET    /entries?word=a&word=b              -> 400
GET    /entries?werd=sister                -> 400
GET    /entries?word=                      -> 200 []
GET    /entries                            -> 200, every entry
GET    /entries?word=100%25                -> 200, entries containing "100%"
```

The last two lines together are the point of step 6. **A run where both return
the same thing has failed**, even if every test is green.

Boundary checks, all three must return nothing:

```bash
grep -rn "process\.env" apps/api/src --include=*.ts | grep -v "src/config"

grep -n "node:sqlite\|DatabaseSync\|DATABASE\|SELECT\|INSERT\|UPDATE\|DELETE\|prepare(" \
  apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.controller.ts

grep -nE "HttpException|NotFoundException|BadRequestException" \
  apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.repository.ts \
  | grep -v "^\S*:[0-9]*: *[/*]"
```

### The acceptance criterion

**A test that does not fail when the wiring is removed has not been written.**
Run both mutations and paste the real failure output:

**Mutation A.** Remove the `APP_PIPE` provider from `AppModule`. The suite must go
red. If it stays green, nothing you wrote is testing the pipe.

**Mutation B.** Change `@Query() query: FindEntriesQueryDto` back to
`@Query('word') word?: unknown`. The repeated-parameter and unknown-parameter
tests must fail. If they pass, they are not testing what they claim to.

Restore both and confirm green.

Leave no server running and delete any throwaway database files.

## Report

Write `docs/learning/day-07/report.md`: objective, implementation summary, files
changed, decisions made, assumptions, limitations, dependencies added, testing
performed with real pasted output, future improvements, lessons learned.

Answer these three directly:

1. **How many lines did `entries.controller.ts` lose, and what is left in it?**
2. **Which existing tests had to change, and for each, was it a message change or
   a behaviour change?** A behaviour change nobody decided is a defect; say so.
3. **Did `class-validator` earn its place, honestly?** ADR-008 records that it was
   chosen partly as a deliberate learning goal and that a library knows about
   shapes rather than about this product. If in practice the custom decorator and
   the class-level check gave back most of the hand-written code, say that plainly.
