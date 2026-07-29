# Testing Literacy — Reading the Tests You Already Own

**Day 2 · ~60–75 minutes · Repaying learning debt from Day 1**

---

## Why this exists

On Day 1 a worker agent wrote three tests. They pass. You did not write them
and cannot yet explain them.

That is **learning debt**, and it is worth naming as precisely as technical
debt. Technical debt is code that works but will cost you later. Learning debt
is code that works but that *you* cannot reason about — which means you cannot
safely change it, and you cannot tell whether it is protecting you or just
producing a green checkmark.

This module does not teach you to *write* tests. That is Day 5. Today is
comprehension only: **you should be able to explain every line of the three
existing test files.**

The method is not reading. It is breaking things and predicting what happens.
Reading a passing test teaches you almost nothing — a passing test looks
identical whether it is rigorous or vacuous.

---

## Orientation: three libraries, three jobs

You can't experiment on something you can't name. This is the only part of
this document that is a lecture — skim it, then go break things.

**Jest** — the test *runner* and *assertion* library. It finds files matching
`.spec.ts`, executes them, and provides the vocabulary: `describe`, `it`,
`expect`, `beforeEach`. Nothing about Jest is Nest-specific; it's used across
the JavaScript ecosystem. It is what `pnpm test` actually invokes.

**`@nestjs/testing`** — Nest-specific. Its job is building a *miniature
version of your application* for a test to run against. This is the piece that
will feel strangest, and it exists for a reason you already met on Day 1:
because of dependency injection, `EntriesController` never constructs its own
`EntriesService`. Nest does. So a test can't just call
`new EntriesController()` — it has to ask Nest to wire the object graph. That's
what `Test.createTestingModule()` is for.

**supertest** — issues real HTTP requests against a running application and
asserts on the response. This is the only one of the three that knows what a
URL or a status code is.

Now stop reading and start breaking.

---

## Experiment 1 — What does `createTestingModule` actually do?

Open `apps/api/src/entries/entries.controller.spec.ts`.

**Predict first, in writing.** Delete `EntriesService` from the `providers`
array, leaving `controllers: [EntriesController]`. What happens when you run
`pnpm test`?

- Does it fail at compile time or at run time?
- What will the error message mention?

Now run it.

```bash
pnpm test
```

**Then explain:**

1. Read the error carefully. Nest's DI errors are unusually good — it tells you
   which parameter of which class it couldn't resolve. Which argument index
   does it name, and why that one?
2. Why did TypeScript not catch this? The controller's constructor clearly
   declares `private readonly entriesService: EntriesService`. What does that
   tell you about *when* dependency injection is resolved?
3. Connect this back to ADR-002. It argues Nest's cost is that "reading a
   controller doesn't tell you how its service got instantiated." Did you just
   experience that cost, or the benefit?

Restore the file.

---

## Experiment 2 — The one that teaches unit vs e2e

This is the important one. Do not skip it.

In `apps/api/src/entries/entries.controller.ts`, change the route decorator:

```ts
@Controller('entries')   →   @Controller('journal')
```

**Predict, in writing, before running anything:**

- Does `entries.controller.spec.ts` pass or fail?
- Does `test/app.e2e-spec.ts` pass or fail?
- Why?

Now run both:

```bash
pnpm test        # the unit test
pnpm test:e2e    # the e2e test
```

**What you should observe:** the unit test passes. The e2e test fails with a
404.

**Now explain why, precisely.** The answer is not "e2e tests are better." It is
about *what each test actually touches*:

- The unit test imports the controller class and calls `controller.findAll()`
  as a plain method. `@Controller('entries')` is metadata attached to the
  class — routing metadata. **Calling a method directly never consults it.**
- The e2e test boots the real HTTP layer, so the router reads that metadata to
  decide which URL maps to which handler. Change the metadata, the URL moves,
  the request 404s.

**The generalization, which is the actual lesson:** a unit test verifies that a
class does what it says. An e2e test verifies that the *framework wiring
around* that class does what you think. You broke a real thing — the public
URL of your API — and one of your two tests was structurally incapable of
noticing.

Now answer these:

4. If you had only unit tests, what class of bug would ship silently?
5. If you had only e2e tests, what would you lose? (Think about speed, and
   about what happens when a test fails — how much of the system is suspect?)
6. `main.ts` isn't imported by *either* test. What does that mean about how
   much of your app is currently covered?

Restore the route.

---

## Experiment 3 — Two tests, same behavior, only one of them brittle

Before starting, read the `findAll` assertions in **both** test files and note
how they differ. The unit test checks properties of every entry. The e2e test
checks `toHaveLength(2)`. They were both count-based yesterday; one was
rewritten during the Day 2 cleanup and the other deliberately wasn't.

### Part A — break the behavior

In `entries.service.ts`, change `findAll()` to `return [];`

**Predict:** which of the three tests go red?

Run `pnpm test` and `pnpm test:e2e`.

7. `entries.service.spec.ts` contains only `expect(service).toBeDefined()`.
   Did it catch this? Does it catch *anything* about your code, ever? What is
   it actually testing — and is that thing likely to break?
8. The unit test's first line is `expect(result.length).toBeGreaterThan(0)`.
   Every other assertion sits inside a `for` loop. What would an empty array do
   to a loop-based test *without* that line? (This is the subtlest idea in the
   file: a test can pass by never actually running.)

Restore the service.

### Part B — now change something that is not a bug

Add a **third** entry to the hardcoded array. Nothing is broken; you added
valid data.

**Predict before running:** unit test — red or green? e2e — red or green?

Run both.

9. One passed and one failed. Explain precisely *why*, by pointing at the
   specific assertion in each. Neither test is "better written" by accident —
   what does each one actually claim about the code?
10. Write the general rule in one sentence: what makes an assertion couple to
    the *data* rather than to the *behavior*?
11. The e2e test is the one that broke. Is `toHaveLength(2)` **always** wrong,
    or is it wrong *here*? When would asserting an exact count be exactly
    right?

Question 11 is the bridge to Day 5 — keep your answer. The e2e test was left
brittle on purpose so you could see the contrast side by side. On Day 5 you
decide what it should assert instead.

Restore the service.

---

## Experiment 4 — Why `beforeEach`?

12. `beforeEach` rebuilds the entire testing module before *every* `it()`.
    That's slower than building it once in `beforeAll`. What bug does the
    slower version prevent? (Hint: what's stored inside `EntriesService`, and
    what would happen if one test mutated it and the next test ran against the
    same instance?)
13. Connect this to the audit finding that `findAll()` returns the service's
    private array **by reference**. Sketch the specific test-suite failure that
    combination could produce — where a test fails because of what a *different
    test* did.

Question 13 is why "tests should be independent" is a rule and not a style
preference.

---

## Experiment 5 — Do your tests even check types?

This one wasn't planned. It was found during the Day 2 cleanup, and it is the
most surprising thing in this document.

You have four commands: `pnpm lint`, `pnpm typecheck`, `pnpm build`,
`pnpm test`. **Predict, in writing, which ones would catch a type error inside
a test file.** Most people say all four, or at least build and test.

Now put a real type error in `entries.controller.spec.ts` — inside the `it`
block, at the end:

```ts
const probe: number = 'definitely a string';
expect(probe).toBeDefined();
```

(The second line matters. Without it the variable is unused, and lint fails on
`no-unused-vars` — which *looks* like it caught the type error but didn't. A
red result can be right for the wrong reason.)

Run all four:

```bash
pnpm typecheck ; echo "typecheck: $?"
pnpm build     ; echo "build: $?"
pnpm test      ; echo "test: $?"
pnpm lint      ; echo "lint: $?"
```

**Only `typecheck` fails.** The other three pass over a file containing a
blatant type error.

14. Each has a specific reason. Work out all three before reading on:
    - `build` compiles via `tsconfig.build.json`. Open it. What does it
      `exclude`, and why is that exclusion *correct* for a build?
    - `test` runs through ts-jest. Find `isolatedModules` in `tsconfig.json`.
      Search what it does to ts-jest. What does "transpile-only" mean for type
      checking?
    - `lint` runs ESLint. ESLint reports violations of *lint rules*. Is a type
      error a lint rule violation?
15. None of those three is broken. Each is correct about its own scope. So
    describe the failure in one sentence — not "a tool was wrong," but
    something about the **space between** the tools.
16. Until Day 2, `typecheck` didn't exist in this repo. Your editor was the
    only thing checking types in test files. What does that tell you about
    relying on an editor as a quality gate — especially when your editor and
    your project can run *different compiler versions*?

This is the same shape as the bug that started the cleanup. That one was: the
`lint` command existed but wasn't reachable from the root, so nobody ran it.
This one is: `tsc` was right there, but nothing reachable ran it over test
files. **Both are process bugs wearing a config bug's clothing.**

Remove the probe when you're done, and confirm `pnpm typecheck` is green again.

---

## Explain-back checkpoint

Close every file. Answer out loud, without looking:

- What does Jest provide? What does `@nestjs/testing` provide? What does
  supertest provide? Where is the boundary between them?
- Why can't a Nest unit test just call `new EntriesController()`?
- Give a concrete bug an e2e test catches and a unit test cannot. Then give
  one the other way around.
- Why is `expect(service).toBeDefined()` close to worthless here?
- Why does the e2e test's `toHaveLength(2)` fail when you add valid data, while
  the unit test doesn't?
- Which of your four commands typechecks your test files? Why don't the other
  three?
- What does a green `pnpm test` actually prove — and what does it not?

If any answer is shaky, redo the relevant experiment. Re-reading won't fix it.

---

## What you should NOT be able to answer yet

Deliberately unanswered today — they're Day 5:

- When should you mock a dependency instead of using the real one?
- What is an *integration* test, and how is it different from both of these?
- What should you deliberately **not** test?
- How much coverage is enough, and why is "100%" usually the wrong target?

---

## Record

When done, append your written answers to
`docs/learning/day-02/testing-answers.md` — including the predictions you got
**wrong**. Those are the valuable ones: a wrong prediction is the exact
location where your mental model diverged from the machine, and it will not be
that obvious to you again.

Then mark the four testing rows in the roadmap's **Learning Debt** table as
repaid at the comprehension level.
