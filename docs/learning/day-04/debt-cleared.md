# Day 4 Evening — Seven Concepts, Questions and Answers

**Date:** 2026-08-01

This document records the questions asked during the Day 4 evening session, the
answers given, and the full explanation of each concept.

It exists to be **re-read later**. Understanding something once is not the same
as still understanding it in three weeks. Two of the concepts below had been
owed since Day 1, and one since Day 2. If any of these stop making sense, that
is a signal to run the experiment again rather than to re-read the paragraph.

Seven questions were asked and all seven were answered correctly.

---

## Contents

1. [Why the compiler cannot stop you from skipping validation](#1)
2. [Why an empty list is an answer and `undefined` is not](#2)
3. [How prepared statements actually prevent SQL injection](#3)
4. [Why three of four commands miss a type error in a test file](#4)
5. [What unit tests catch and what only end-to-end tests catch](#5)
6. [Why the tests still pass when dependency injection is broken](#6)
7. [Why `unknown` is a better type than `CreateEntryDto` for a request body](#7)

---

<a name="1"></a>

## 1. Why the compiler cannot stop you from skipping validation

### The setup

The controller currently looks like this:

```ts
create(@Body() body: unknown): JournalEntry {
  const dto = parseCreateEntryDto(body);
  return this.entriesService.create(dto.content);
}
```

The parameter is typed `unknown`. The function `parseCreateEntryDto` checks the
body and returns a value typed `CreateEntryDto`.

### The question

A developer joins next month, thinks `unknown` looks untidy, and changes it to:

```ts
create(@Body() body: CreateEntryDto): JournalEntry {
  return this.entriesService.create(body.content);
}
```

They renamed the type and deleted the validation call.

1. Does `pnpm typecheck` report an error?
2. Does `pnpm build` report an error?
3. A client sends `POST /entries` with `{}`. What happens?

### The answer given

No, no, and a 500 at runtime — because the types are satisfied and the compiler
does not know the incoming object might not have the field.

### The full explanation

**Both commands pass.** This is the important part.

When a parameter is labelled `CreateEntryDto`, TypeScript **believes the
label**. It does not go and check the real request, and it has no way to — the
request has not happened yet. The compiler finishes its work before the server
ever starts. So the label is simply accepted as true, and every line after it is
checked against a promise that nothing verified.

This is **type erasure**. TypeScript types exist only during compilation and
vanish from the output. You saw this directly on Day 4 by running `pnpm build`
and reading the compiled JavaScript: `create(@Body() body: { content: string })`
had become plain `create(body)`. The annotation was never part of the running
program.

The rule that follows:

> A type annotation can only check values that exist inside your own codebase.
> It cannot check anything arriving from outside while the program is running.

Anything crossing into your application from the outside world — an HTTP body, a
query parameter, a file, a response from another API, a database row — arrives
as runtime data. TypeScript cannot see any of it. If you want it checked, you
must write code that checks it.

**Why `unknown` is different.** `unknown` means "I do not know what this is."
TypeScript then refuses to let you touch the value. You cannot write
`body.content` on an `unknown` — the compiler stops you. The only way forward is
to check it first. `unknown` **forces the validation to exist**, because the
code will not compile without it.

### What actually happens at runtime, step by step

There is a detail worth being precise about. Reading a property that does not
exist is **not** an error in JavaScript. `{}.content` does not throw — it
quietly returns `undefined`. So the code carries on:

| Step | What happens |
|---|---|
| Controller | passes `undefined` into `entriesService.create(...)` |
| Service | builds an entry whose `content` is `undefined` |
| Service | calls `repository.save(entry)` |
| Repository | reaches `.run(entry.id, entry.content, entry.createdAt)` |
| **SQLite** | **refuses** — it can bind strings, numbers, `null` and buffers, but not `undefined` |

The database driver is what finally objects. That is the layer **furthest from
the client**. Everything above it accepted a request that was never valid, and
because the error comes from value binding, the client learns nothing about what
it actually did wrong.

That is the argument for validating at the boundary in one sentence:

> **The further an invalid request travels before something objects, the worse
> the error it produces.**

---

<a name="2"></a>

## 2. Why an empty list is an answer and `undefined` is not

### The setup

Two functions behave differently on purpose:

```ts
findById(id: string): JournalEntry | undefined   // undefined when missing
findByContent(word: string): JournalEntry[]      // [] when nothing matches
```

That looks inconsistent. It is not.

### The experiment

```bash
node -e "console.log([].length)"
# 0

node -e "console.log(undefined.length)"
# TypeError: Cannot read properties of undefined (reading 'length')
```

### The answer given

> "Even in that case the correct answer is no row contains the word, and an
> empty array can satisfy it."

### The full explanation

An **empty array is still an array**. You can call `.length` on it and get a
real number. You can loop over it — the loop body simply runs zero times and
finishes normally. It is a container that happens to be empty.

`undefined` is **not a thing at all**. There is no container. Reaching into it
fails immediately.

That machine-level difference is the reason for the design difference.

**`findById` returns `undefined` because a single missing thing has no
representation.** There is no such value as "an empty entry." When you ask for
*the* entry with a particular id and there isn't one, `undefined` is the only
honest answer available.

**`findByContent` returns `[]` because a collection query always has an answer.**
"Which entries contain the word zzz?" has a complete, correct, useful answer
when nothing matches: none of them. The empty list **is** that answer.

The distinction to hold onto:

| | |
|---|---|
| *I could not answer your question.* | a failure |
| *I answered your question. The answer is: none.* | a successful, empty result |

Treating an empty result as an error confuses those two. It also forces every
caller to wrap a search in `try`/`catch` to handle the most ordinary outcome a
search has.

### Where this shows up in the HTTP layer

| Request | What the client is asking | Honest answer | Status |
|---|---|---|---|
| `GET /entries/abc-123` | "Give me **the** entry with this id." | There is no such entry. | `404` |
| `GET /entries?word=zzz` | "Give me **all** entries matching this word." | Here they are: none. | `200 []` |

The first names a **specific single thing** and assumes it exists. That
assumption was wrong, so the request fails.

The second names a **collection** and asks what is in it. Asking what is in a
collection never fails. Sometimes the collection is empty.

**The fix required deleting code, not adding it.** `records.map(...)` over an
empty array already produces `[]`. The only thing standing between the wrong
behaviour and the right one was a `throw`.

---

<a name="3"></a>

## 3. How prepared statements actually prevent SQL injection

### The setup

Every query in the repository is written like this:

```ts
this.db.prepare('SELECT id, content, created_at FROM entries WHERE id = ?').get(id)
```

The `?` is a placeholder. The value of `id` is handed to `.get(id)` separately.

The alternative, which looks more natural to most people:

```ts
this.db.prepare(`SELECT ... WHERE id = '${id}'`).get()
```

Here the value is glued into the SQL text before the database sees it.

### The answer given

> "The database needs to parse the instructions. If we send the data directly it
> could parse malicious instructions... that is why we send instructions string
> and data separately. Because it first parses all instructions, then it injects
> the data. So it already knows what are the actual instructions, and even if the
> data is malicious, that will never run because SQL has already separated out
> the actual real instructions."

This was volunteered rather than answered step by step, and it is the mechanism
rather than the slogan.

### The full explanation

**The protection is the ordering, not any cleaning of the input.**

With `?` placeholders, two things happen in sequence:

1. The database receives the SQL text **on its own** and parses it. It works out
   the structure of the sentence: this is a `SELECT`, from this table, with a
   `WHERE` condition comparing the `id` column to *some value to be supplied*.
2. **Only then** does it receive the value.

By the time your data arrives, the sentence structure is already fixed. There is
no way for a value to become an instruction, because the decision about what
counts as an instruction was made before the value existed.

Nothing is being escaped or sanitised. The two things simply travel on separate
paths and meet after parsing is finished.

### What goes wrong with concatenation

If the value were glued in, the database would receive one single sentence and
would have no way to tell which parts came from you and which came from a
stranger on the internet. It parses all of it as instructions, because that is
all it was ever given.

A client requesting `GET /entries/x' OR '1'='1` would produce:

```sql
SELECT id, content, created_at FROM entries WHERE id = 'x' OR '1'='1'
```

`'1'='1'` is always true, and `OR` makes the whole condition true for every row.
**That query returns the entire table.**

With the `?` version, the same text is looked up as a literal id, matches
nothing, and the client gets a 404.

There is a test in `entries.service.spec.ts` that demonstrates this from the
other direction — it stores the string `'); DROP TABLE entries; --` and asserts
it comes back out unchanged, as ordinary text.

---

<a name="4"></a>

## 4. Why three of four commands miss a type error in a test file

### The setup

Imagine writing a line with a genuine type error inside a `.spec.ts` file:

```ts
service.create(42);   // create() takes a string
```

Four commands exist: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`.

### The answer given

All four correct, with the mechanism for each.

### The full explanation

| Command | Catches it? | Why |
|---|---|---|
| `pnpm build` | ❌ **No** | Uses `nest build`, whose config **excludes** `.spec.ts` files. Test files are not part of the shipped application, so the build never looks at them. |
| `pnpm test` | ❌ **No** | Uses Jest with `ts-jest` in **transpile-only** mode. Transpiling converts TypeScript to JavaScript by *stripping the types out*. It never checks them — that is why it is fast. |
| `pnpm lint` | ❌ **No** | ESLint checks code *style* and *patterns* — unused variables, floating promises, formatting. It is not the TypeScript compiler and does not report compiler errors. |
| `pnpm typecheck` | ✅ **Yes** | Runs `tsc --noEmit` across the whole project, spec files included. It was added on Day 2 for exactly this reason. |

### Why this matters even though test files never ship

The obvious answer is that tests still need to run and pass, and will eventually
run in CI. True, but there is a sharper danger:

> **A type error in a spec file can make a test silently wrong rather than make
> it fail.**

A test with a type mistake might still *pass*. It just is not testing what its
name claims. Now you have a test reporting green while checking nothing — and
green is exactly what stops you from looking closer.

This is the same shape as the Day 3 `ORDER BY` bug, which shipped past all four
commands because no test had ever stated the rule. **A test that exists but does
not do its job is worse than no test, because it produces false confidence.**

Before `pnpm typecheck` existed, **no reachable command in this repository
checked test code at all.** The only thing checking it was the editor — using a
different TypeScript version from the project, which caused a real "the editor
shows red but the terminal is green" incident on Day 2.

---

<a name="5"></a>

## 5. What unit tests catch and what only end-to-end tests catch

### The setup

Two kinds of test exist in this project.

**Unit tests** (`entries.controller.spec.ts`) call classes directly as ordinary
TypeScript. No server, no HTTP:

```ts
expect(() => controller.findById('no-such-id')).toThrow(NotFoundException);
```

**End-to-end tests** (`test/app.e2e-spec.ts`) boot the whole application and
send real HTTP requests using supertest:

```ts
await request(app.getHttpServer()).get('/entries/nope').expect(404);
```

Both of those are about the same 404. The unit test checks that a
`NotFoundException` **object** is thrown. The e2e test checks that the **number
404** reaches the client.

### The experiment

Change one line, and nothing else:

```ts
@Controller('entries')   →   @Controller('journal')
```

Every route now lives at `/journal`. The application is unusable — every
existing client gets a 404.

### The prediction given

Unit tests pass, e2e tests fail. Because the unit test never mentions the route;
the e2e test names the path in the request.

### What actually happened

```
Unit:  Tests: 29 passed, 29 total
E2E:   Tests: 9 failed, 1 passed, 10 total
       expected 201 "Created", got 404 "Not Found"
```

**The application was completely broken and 29 unit tests reported success.**

### The full explanation

The unit tests were not wrong to pass. Each one correctly verified that its
method behaves properly when called, and the methods **do** behave properly. The
problem was never inside a method — it was that nothing could reach them.

> **Unit tests verify that the pieces work.
> End-to-end tests verify that the pieces are connected.**

A unit test cannot see a route, a status code on the wire, JSON serialisation,
or middleware, because none of those exist when you call a method directly.

**One more thing worth noticing.** The single e2e test that passed was
`GET /entries/:id returns 404 for an unknown id`. It passed for entirely the
wrong reason — it expected a 404 and got a 404, but because the *route* was
missing, not because the *entry* was missing.

A test can be green and still be lying to you. That is why the Day 4 worker
deliberately broke its own validator and confirmed exactly five tests failed:
**a passing test proves nothing until you have seen it capable of failing.**

---

<a name="6"></a>

## 6. Why the tests still pass when dependency injection is broken

### The setup

`entries.module.ts` has a `providers` array listing `EntriesService` and
`EntriesRepository`. Nest uses that list to know what to hand to each class that
asks for a dependency.

### The experiment

Delete `EntriesRepository` from `providers`. Change nothing else — the file
still exists, the service still asks for it in its constructor, all imports stay.

### The prediction given

All four parts correct:

1. `typecheck` passes
2. `build` passes
3. The server starts resolving dependencies and then crashes
4. `pnpm test` still passes, because the spec files create their own testing
   module with their own providers list

### What actually happened

| Check | Result |
|---|---|
| `pnpm typecheck` | ✅ passed |
| `pnpm build` | ✅ passed |
| Server start | ❌ **crashed** |
| `pnpm test` | ✅ **29 passed** |
| `pnpm test:e2e` | ❌ 10 failed |

The crash message:

```
Nest can't resolve dependencies of the EntriesService (?).
Please make sure that the argument EntriesRepository at index [0]
is available in the EntriesModule module.
```

Note the boot log — `AppModule` initialised, `DatabaseModule` initialised, *then*
the crash. It got two modules in before failing.

### The full explanation

**Two separate lessons sit in that table.**

**First: dependency injection is resolved when the application starts, not when
it compiles.** The `providers` array is a runtime instruction to Nest, not a
type. TypeScript has no idea that array is meant to correspond to anything. This
is the same lesson met on Day 2 from a different angle, when a deleted provider
compiled fine and failed at boot.

**Second, and this is the new part: unit tests cannot verify production
wiring.** Every spec file writes its own providers list:

```ts
providers: [EntriesService, EntriesRepository, { provide: DATABASE, useValue: db }]
```

That list is deliberately independent of the real module. It is what lets tests
run against a throwaway in-memory database instead of the real one. But it also
means the spec files **never read `entries.module.ts` at all**.

Only something that loads `AppModule` can catch broken wiring — and in this
project, that is only the e2e suite:

```ts
imports: [AppModule]
```

### Together with experiment 5

These two experiments give a precise picture of the gap:

- **Unit tests** check that each piece behaves correctly in isolation.
- **E2E tests** check that the pieces are actually connected to each other and
  reachable from outside.

Both experiments produced the same headline result — **the application was
completely broken and 29 unit tests said everything was fine.**

---

<a name="7"></a>

## 7. Why `unknown` is a better type than `CreateEntryDto` for a request body

### The setup

The Day 4 worker deviated from its instructions here. The prompt said to type
the body as `CreateEntryDto`. The worker refused and used `unknown` instead,
explaining why in its report. The reasoning was accepted.

### The full explanation

Writing `@Body() body: CreateEntryDto` would repeat the exact mistake Day 4 was
spent removing.

**An unvalidated body is not a `CreateEntryDto`.** Calling it one asserts a
guarantee that nobody established. That is the same falsehood as the old
`{ content: string }` annotation, just with a nicer name on it.

The original annotation was false in a way you can point at:

- The client is **not allowed** to send `id`. The type implied it could.
- The client is **not allowed** to send `createdAt`. The type implied it could.
- The client **must** send `content`. The type agreed, but that is one field out
  of three.

With `unknown`, the compiler physically will not let you touch the value until
you have checked it. The type name `CreateEntryDto` then means **"this has been
validated"** rather than **"I hope this is valid."**

```ts
function parseCreateEntryDto(body: unknown): CreateEntryDto
//                                 ^^^^^^^ untrusted in    ^^^^^^^^^^^^^^ checked out
```

### The DTO still enforces nothing

Worth stating plainly, because a named type on a request body creates a powerful
illusion of safety. `CreateEntryDto` is an interface. It is **erased at compile
time** and validates nothing at runtime, exactly like the inline annotation it
replaced.

The hand-written check is what actually upholds the contract. The type only
writes it down.

### What a DTO is for

**DTO** stands for **Data Transfer Object**. It describes data *crossing a
boundary*, which is a different question from what a thing *is*.

| Type | Question it answers |
|---|---|
| `JournalEntry` | What **is** an entry? It has an id, content, and a creation time — always. |
| `CreateEntryDto` | What may a client **send**? Only `content`; the server generates the rest. |

This distinction becomes much more important on Day 9, when users and passwords
arrive. If one type serves as both the database shape and the HTTP response
shape, then a controller returning a user object sends the hashed password over
the wire — not because anyone decided to, but because nobody decided not to.
Nest serialises every property on the object it is given. It has no concept of
"secret."

---

## Summary

| # | Concept | Owed since | How it closed |
|---|---|---|---|
| 1 | Compiler cannot stop skipped validation | Day 4 | Explained |
| 2 | Empty list is an answer, `undefined` is not | Day 4 | Experiment, then explained in her own words |
| 3 | Prepared statements | **Day 2** | Mechanism volunteered unprompted |
| 4 | Which command catches a spec type error | Day 2 | All four, with reasons |
| 5 | Unit vs e2e (route rename) | **Day 1** | Predicted, then observed |
| 6 | DI wiring (provider deletion) | Day 3 | Four-part prediction, all correct |
| 7 | `unknown` at a trust boundary | Day 4 | Explained |

### The two experiments worth re-running

Both take under a minute and both produce a result that contradicts intuition.
If concepts 5 or 6 ever feel fuzzy, run them again rather than re-reading.

```bash
# 1. Rename the route in entries.controller.ts:
#    @Controller('entries')  →  @Controller('journal')
pnpm test        # 29 pass — on a completely broken application
pnpm test:e2e    # 9 of 10 fail
# then change it back

# 2. Delete EntriesRepository from `providers` in entries.module.ts
pnpm typecheck   # passes
pnpm build       # passes
pnpm dev         # crashes at boot with "Nest can't resolve dependencies"
pnpm test        # 29 pass
# then put it back
```

Always restore the file afterwards and re-run both suites to confirm you are
back to 29 and 10. `git checkout <file>` will undo the change if needed.
