# Worker Prompt — Day 6 follow-up: pin the configuration wiring

## Context

You are implementing one small, isolated task on the Neuron project. Read
`docs/decisions/ADR-007-configuration-and-boot-validation.md` first.

Do **not** touch git. No branching, no committing, no merging. Those are human
actions on this project.

Do **not** add a dependency. Do **not** change any production code. This task
adds tests and nothing else. If you believe production code needs to change,
implement nothing and say so in the report.

## The problem

The Day 6 implementation is correct and the Master Thread's audit found no defect
in it. It found a gap in the *suite* instead.

Deleting the single word `validate,` from `ConfigModule.forRoot` in
`apps/api/src/app.module.ts` produces this:

```
typecheck        PASSES
build            PASSES
80 unit tests    PASS
21 e2e tests     PASS
PORT=hello       starts happily and creates a Unix socket file called `hello`
```

Every rule still exists in `src/config/env.validation.ts`, fully tested, and it
is simply never called. All 101 tests pass on an application where the whole of
Day 6 is disconnected.

This is the same failure this project already has on record from Day 4, when
removing `EntriesRepository` from a module's `providers` left typecheck, build
and 29 unit tests green while the server would not boot. Unit tests verify the
pieces work. Something has to verify the pieces are *connected*.

## The mechanical facts, already established

Do not rediscover these; they were checked against the built application during
the audit.

`require()` on `app.module.js` **succeeds** even when `PORT` is invalid, but
**not** because validation is deferred. `ConfigModule.forRoot` is an `async`
static and it calls `options.validate(config)` in the synchronous part of its
body, so the check runs while `app.module.ts` is being imported. An `async`
function never throws — it returns a rejected promise — so the failure sits
unhandled in the `imports` array until Nest awaits it, which is why the import
appears to succeed and the message only surfaces later.

*(This paragraph originally claimed the opposite. The follow-up worker read the
library's source, found the truth, and documented it in a comment rather than
following the prompt. It was right.)*

`Test.createTestingModule({ imports: [AppModule] }).compile()` **rejects** with
the real message:

```
PORT must be a whole number between 1 and 65535, received "hello"
```

So this test needs no `pnpm build`, no built binary and no child process. That
was the cost the Day 6 report assumed and it does not apply to this approach.

## What to add

A new end-to-end spec, `apps/api/test/config-wiring.e2e-spec.ts`. It belongs in
`test/` rather than `src/` for the same reason the existing end-to-end suite
does: it is the only place that loads the real `AppModule` and therefore the only
place that can observe production wiring.

It must cover three claims.

**1. Building the application refuses when `PORT` is invalid.** Assert on the
real message, not on the mere fact that something threw. `toThrow()` with no
argument is satisfied by a `TypeError` from a typo in the test itself, which is
the exact weakness the Day 6 report already identified in its own first draft.

**2. Building the application refuses when `DATABASE_PATH` is the empty
string.** Same standard for the message.

**3. The real application builds successfully when the configuration is valid,
with no overrides of any kind.** This claim looks redundant and is not, and the
reason is the whole point of adding it.

Every existing end-to-end test that builds `AppModule` first calls
`.overrideProvider(DATABASE).useValue(db)`, which replaces the entire factory —
and that factory is the only thing in the application that asks for
`ConfigService`. Replace it and the broken edge is never travelled.

This was demonstrated during the Day 7 session. Deleting `isGlobal: true` from
`ConfigModule.forRoot` gives: typecheck passes, build passes, 80 unit tests pass,
**21 end-to-end tests pass**, and the real application exits 1 with `Nest can't
resolve dependencies of the Symbol(DATABASE)`. Claims 1 and 2 do not catch it
either, because `validate` throws before Nest reaches dependency resolution, so
the rejection message is the one those tests assert on and they go green.

A test that builds the real `AppModule` with valid configuration and no overrides
is the only thing that catches it.

Save and restore `process.env` around each test. A leaked variable would change
the result of whichever spec Jest happens to run next, and this project already
has a written finding about tests whose answers depend on things other than the
code.

Add nothing else.

## The acceptance criterion, and it is the whole point

**A test that does not fail when the wiring is removed has not been written.**

Verify it by actually doing it, not by reasoning about it:

**Mutation A — the checker is never called.** Delete `validate,` from
`ConfigModule.forRoot` in `apps/api/src/app.module.ts`. Run `pnpm test:e2e`.
Claims 1 and 2 must fail. Restore it and confirm green.

**Mutation B — the configuration is not reachable.** Delete `isGlobal: true`
from the same object. Run `pnpm test:e2e`. **Claim 3 must fail**, with
`Nest can't resolve dependencies of the Symbol(DATABASE)`. Restore it and confirm
green.

Paste the real failure output for both. If your tests still pass under either
mutation, they are testing `env.validation.ts` a second time rather than testing
the application, and you must fix them before reporting.

## Constraints

- **No new dependency.** `apps/api/package.json` and `pnpm-lock.yaml` must be
  unmodified. This is checked.
- **No production code changes at all.** `git status` must show one new test file
  and nothing else under `apps/api/src`.
- All 80 unit tests and all 21 existing end-to-end tests must still pass.
- Match the project's comment style: full sentences explaining *why*.

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
```

Report actual output and counts, not intent. The end-to-end count should go from
21 to 24.

Then the acceptance criterion above, with the real failure output pasted.

Confirm no stray socket files were created:

```bash
find . -maxdepth 3 -type s -not -path "./node_modules/*"
```

Leave no server running. The Day 6 worker left a `pnpm --filter @neuron/api start`
process holding port 3000 and the real development database open for twelve
minutes after finishing, which invalidated a step of the audit until it was
spotted.

## Report

Append to `docs/learning/day-06/report.md` under a clear heading
`## Follow-up: pinning the configuration wiring`. Cover what you added, the
acceptance-criterion output showing the tests failing with the wiring removed,
and anything you found that the prompt did not anticipate.
