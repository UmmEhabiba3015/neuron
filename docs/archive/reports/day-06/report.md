# Day 6 Worker Report — Configuration, Checked At Boot

## Objective

Move the application's two configuration values — `PORT` and `DATABASE_PATH` —
out of scattered `process.env` reads and into one place that checks them once, at
boot, and refuses to start when a value is unusable. Document both variables in a
committed `.env.example`, keep the real `.env` out of version control, and prove
the whole thing against the running application rather than against the test
suite alone.

Implemented as designed in ADR-007. No design decisions were re-opened.

---

## Implementation summary

Configuration now enters the application through exactly one function.
`ConfigModule.forRoot({ validate })` calls it while the module graph is being
built, before any provider is constructed. Whatever it returns becomes the
checked configuration; whatever it throws stops the boot.

Everything downstream asks `ConfigService` for a value. `main.ts` receives
`PORT` as a **number** rather than the string the operating system supplies,
which is the actual repair rather than a tidy-up: `listen("hello")` is a
legitimate request for a Unix socket file, `listen(3000)` can only ever be a TCP
port. `database.module.ts` receives `DATABASE_PATH` and decides what to open.

The split between the two halves of `DATABASE_PATH` follows ADR-007's own
distinction. `env.validation.ts` checks the *form* of the string, which is all a
validator can ever do — it rejects the empty string and nothing else, because
`data/nueron.db` is a perfectly well-formed path and no inspection will ever
reveal the typo. `database.module.ts` checks *reality*: the file named is not
there, so say so.

### Files changed

| File | Change |
| --- | --- |
| `apps/api/src/config/env.validation.ts` | **New.** `EnvironmentVariables`, `DEFAULT_PORT`, and the hand-written `validate` function holding every rule. |
| `apps/api/src/config/env.validation.spec.ts` | **New.** 17 tests over the rules. |
| `apps/api/src/app.module.ts` | Registers `ConfigModule.forRoot({ isGlobal, ignoreEnvFile, validate })`. |
| `apps/api/src/main.ts` | Takes the port from `ConfigService`. Corrected the `bootstrap().catch` comment — see *Decisions*. |
| `apps/api/src/database/database.module.ts` | Path now comes from `ConfigService` through a factory that injects it. Adds exported `DEFAULT_DATABASE_PATH` and `resolveDatabasePath`, which carries the missing-file warning. |
| `apps/api/src/database/database.module.spec.ts` | **New.** 6 tests over path resolution and the warning rule. |
| `apps/api/test/env-file.e2e-spec.ts` | **New.** 3 tests over `.env` loading and environment-variable precedence. |
| `apps/api/package.json` | Adds `@nestjs/config`; `--env-file-if-exists=../../.env` on the four start scripts. |
| `.env.example` | **New**, committed, at the repository root. |
| `README.md` | New *Configuration* section; expanded *Data* section. |
| `.gitignore` | **Unchanged** — `.env` was already ignored and `.env.example` already un-ignored. Verified rather than assumed. |

---

## Decisions made

**1. No wrapper module around `ConfigModule`.** `ConfigModule.forRoot()` is
registered directly in `app.module.ts`, with the rules in
`src/config/env.validation.ts`. A `ConfigurationModule` wrapping it would add a
file that does nothing — `ConfigModule` is already a module, and `isGlobal: true`
registers it globally regardless of where it sits. This is also the shape the
NestJS documentation uses for exactly this case.

**2. `ignoreEnvFile: true`.** Node loads `.env` itself. Leaving this at its
default would point a second parser at the same file — `@nestjs/config` bundles
`dotenv` — which means one file, two sets of quoting and escaping rules, and no
way to tell which one produced a surprising value. The prompt asked for this to
be reported: it is set, and this is why.

**3. `validate` omits the `DATABASE_PATH` key rather than setting it to
`undefined`.** This is a correctness requirement I did not anticipate and found
by reading `@nestjs/config`'s source. `forRoot` copies whatever `validate`
returns back into `process.env` via `assignVariablesToProcess`, and
`process.env.X = undefined` stores the five-character string `"undefined"`
instead of removing the key. Returning `{ DATABASE_PATH: undefined }` would
therefore have produced a real environment variable reading `undefined`, and the
application would have opened a database file by that name. There is a test
pinning this, and it deliberately uses `'DATABASE_PATH' in validate({})` rather
than `toBeUndefined()`, because `toBeUndefined()` passes in both worlds.

**4. `resolveDatabasePath` takes the default path as an argument.** It could have
reached for the module-level `DEFAULT_DATABASE_PATH` instead. Taking it as a
parameter means the function's behaviour depends on nothing but what it is
handed, which is what lets *"a missing database at the default path is not
suspicious"* be tested against a directory that is genuinely empty. With the
constant hidden inside, that test would have passed or failed depending on
whether the person running it had ever run `pnpm dev` — a test that changes its
answer without the code changing, which ADR-007 already names as not measuring
the code.

**5. `.env` lives at the repository root, so the start scripts load
`../../.env`.** The prompt specifies `.env.example` at the repository root, and
`.env.example` is only useful if `.env` sits beside it. But the scripts run with
the working directory set to `apps/api`, so a bare `--env-file-if-exists=.env`
would look in `apps/api/` and never find the file the developer created. **This
is a discrepancy with the prompt**, which described the flag as `.env`; the path
had to change for the two requirements to be true at once. Flagging it because
the alternative reading — `.env.example` in `apps/api/` — is equally defensible
and is the Master Thread's call, not mine.

**6. The flag went on `start:debug` and `start:prod` too.** The prompt named
`start` and `start:dev`. Leaving the other two out would mean `pnpm start:prod`
silently ignores a `.env` that `pnpm start` honours, which is the kind of
inconsistency somebody loses an hour to. `--env-file-if-exists` is a no-op when
no file is present, so this costs nothing in production.

**7. Corrected a comment in `main.ts` that I had written wrongly.** I first wrote
that `bootstrap().catch` handles "a configuration value that failed its check".
It does not. Verified: `grep -c "Neuron API failed to start"` on a failing run
returns `0`. `NestFactory.create` runs the module graph inside its own
`ExceptionsZone`, and with `abortOnError` at its default the zone's
`DEFAULT_TEARDOWN = () => process.exit(1)` logs through Nest's `ExceptionHandler`
and exits before the promise ever reaches our handler. The comment now says so,
because a comment claiming behaviour the code does not have is worse than no
comment.

---

## Assumptions

- `.env` belongs at the repository root, per decision 5 above.
- Whitespace-only `DATABASE_PATH` (`"   "`) is accepted. It is literally
  non-empty, it is a legal filename, and the no-trimming rule says this layer
  does not edit what somebody wrote. It surfaces through the missing-file warning
  instead. The rule was not specified either way.
- Leading zeros (`PORT=03000`) are accepted as 3000. Unambiguous, and rejecting
  them would be a rule nobody asked for.
- `validate` throws on the **first** problem rather than collecting all of them.
  With two variables the difference is one extra run; see *Future improvements*.

---

## Dependencies added

One direct dependency, as required: **`@nestjs/config@4.0.4`**.

Reported honestly, `pnpm-lock.yaml` gained **four** packages, because
`@nestjs/config` pulls in transitive dependencies:

```
+  dotenv@16.6.1
+  dotenv@17.4.1
+  dotenv-expand@12.0.3
```

This is worth saying plainly: ADR-007 records the decision *"`dotenv` is
therefore not added"*, and choosing `@nestjs/config` added it anyway — twice, at
two different versions — as dead weight. With `ignoreEnvFile: true` none of that
code ever runs. The direct-dependency count is exactly one, as instructed; the
on-disk count is four, of which three exist to do a job Node now does natively.

---

## Testing performed

All five commands, run in sequence, actual output:

```
$ pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
$ eslint "{src,apps,libs,test}/**/*.ts" --fix
$ tsc --noEmit -p tsconfig.json
$ nest build
$ jest

Test Suites: 4 passed, 4 total
Tests:       80 passed, 80 total

$ jest --config ./test/jest-e2e.json
Test Suites: 2 passed, 2 total
Tests:       21 passed, 21 total

FINAL EXIT: 0
```

55 unit tests → 80 (25 new). 18 end-to-end → 21 (3 new). **No existing test was
changed.** The end-to-end suite's `overrideProvider(DATABASE)` still works
untouched: because it replaces the factory outright, the factory's new
`ConfigService` injection never runs and nothing is written to disk.

### Against the real application

Every refusal case, run against `dist/main.js`. Exit code was `1` for all eight;
the message line is quoted below with the ANSI colouring stripped.

```
PORT=hello    -> Error: PORT must be a whole number between 1 and 65535, received "hello"      exit: 1
PORT=0        -> Error: PORT must be a whole number between 1 and 65535, received "0"          exit: 1
PORT=-5       -> Error: PORT must be a whole number between 1 and 65535, received "-5"         exit: 1
PORT=99999    -> Error: PORT must be a whole number between 1 and 65535, received "99999"      exit: 1
PORT=         -> Error: PORT must be a whole number between 1 and 65535, received ""           exit: 1
PORT=" 3000 " -> Error: PORT must be a whole number between 1 and 65535, received " 3000 "     exit: 1
PORT=3000abc  -> Error: PORT must be a whole number between 1 and 65535, received "3000abc"    exit: 1
DATABASE_PATH= -> Error: DATABASE_PATH must be a non-empty path, received ""                   exit: 1
```

The `" 3000 "` line is the one the quoting exists for, and it reads correctly:
the two spaces are visible.

Each message is printed by Nest as
`[Nest] ERROR [ExceptionHandler] Error: <message>` in red, followed by a stack
trace.

**The successful starts were verified over HTTP, not by reading the log.**
ADR-007 records the Master Thread searching a log for `successfully started` and
reporting success on a process that had exited 1 — Nest prints that line before
the server listens. So every case below made a real request:

```
# nothing set
HTTP GET /entries on 3000 -> [{"id":"b1c17764-…","content":" ", …}]   (4 real entries)

# PORT=4242
HTTP GET /entries on 4242 -> [{"id":"b1c17764-…", …}]                 (4 real entries)

# DATABASE_PATH=/tmp/neuron-worker-typo.db   — must WARN then start
[Nest] WARN [DatabaseModule] DATABASE_PATH is set to "/tmp/neuron-worker-typo.db" but no
  database exists at /tmp/neuron-worker-typo.db. A new, empty one is being created. If you
  expected to find your existing entries, check that path for a typo.
[Nest] LOG [NestApplication] Nest application successfully started
HTTP GET /entries on 3000 -> []
created? -rw-r--r--. 12288 /tmp/neuron-worker-typo.db
```

The warning case reproduces the exact ADR-007 failure — a completely functional
application serving a completely empty journal — with the difference that it now
announces itself.

**The "must NOT warn" case needed setting up to mean anything.** This machine has
a real `apps/api/data/neuron.db`, so an unset `DATABASE_PATH` would produce no
warning whether or not the rule worked. I moved the database aside, ran with
nothing set, confirmed silence, then restored it:

```
default now missing:            (empty directory)
HTTP GET /entries on 3000 -> []
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [NestApplication] Nest application successfully started
grep -i "warn"  ->  <no WARN lines — correct>

restored: -rw-r--r--. 12288 Aug  1 00:08 data/neuron.db
journal intact: { c: 4 }
```

### The original bug is gone

```
find … -name "hello" -o -name "-5" -o -name "3000abc" -o -name "undefined"
  (no output)
find … -type s                      # sockets of any kind
  (no output)
```

No socket file was created by any rejected run. That absence is the fix.

### `.env` handling, end to end

```
A: no .env at the repo root (a fresh clone)   -> listening on 3000? yes
B: root .env says PORT=5001                   -> listening on 5001? yes   {"count":4}
C: .env says 5001, shell says PORT=6001       -> listening on 6001? yes   {"count":4}
D: .env says PORT=hello                       -> exit 1, "PORT must be a whole number …"
```

C is the precedence the whole arrangement rests on, and D shows that a value
arriving from the file is checked exactly as strictly as one from the shell.

### Boundary check

```
$ grep -rn "process\.env" apps/api/src apps/api/test
src/config/env.validation.spec.ts:104:    // this object back into `process.env`, and `process.env.X = undefined`
src/config/env.validation.ts:3:// `process.env`: configuration is read and checked here, once, at boot, in the
src/config/env.validation.ts:101:  // whatever this function returns back into `process.env`, and
src/config/env.validation.ts:102:  // `process.env.DATABASE_PATH = undefined` stores the five-character string
test/env-file.e2e-spec.ts:37:        'console.log(process.env.PORT)',
```

Five matches, none of them a read. Four are comments; the fifth is a string of
source code handed to a *child process*, which is the thing that test is about.

The stronger version of the same check, against compiled output — `tsconfig` sets
`removeComments: true`, so this is the code that actually runs:

```
$ grep -rn "process\.env" apps/api/dist/
  (no matches)
```

**The shipped application never reads `process.env` at all**, including inside
the configuration module, because `validate` receives the environment as an
argument rather than reaching for it.

### `.env` ignore check

```
$ touch .env && git check-ignore -v .env ; rm .env
.gitignore:9:.env	.env
exit: 0
```

`git check-ignore -v` reports exit 0 for a *matched pattern*, including negations,
so I did not rely on it alone for `.env.example`:

```
$ git add -n .env.example   ->  add '.env.example'          (trackable — correct)
$ git add -n .env           ->  "The following paths are ignored…"   exit 1
```

### Breaking the code on purpose

A passing suite proves nothing until you have watched it fail. Four mutations,
each reverted afterwards:

| Mutation | Tests that failed |
| --- | --- |
| `quote()` returns `String(value)` instead of `JSON.stringify(value)` | 3 failed — `should quote the value so that invisible characters stay visible`, `should name the variable and quote the value it rejected`, `should refuse to boot for the empty string, naming the variable` |
| `PORT` is trimmed before checking | 2 failed — `should refuse to boot for a number with surrounding whitespace`, `should quote the value so that invisible characters stay visible` |
| Warn whenever the file is missing, default path included | 1 failed — `should stay quiet when the path was not set, though the file is equally missing` |
| Always set the `DATABASE_PATH` key, even when unset | 1 failed — `should leave the key out entirely when DATABASE_PATH is not set` |

Suite restored to 80 passed after each.

---

## The two questions the prompt asked directly

### 1. Which tests fail if the quoting is removed?

**Three, named above and confirmed by actually removing it.** The quoting is
tested, not merely present.

The one that carries the claim is `should quote the value so that invisible
characters stay visible`, which asserts the message literally:

```ts
expect(() => validate({ PORT: ' 3000 ' })).toThrow(
  'PORT must be a whole number between 1 and 65535, received " 3000 "',
);
```

Without the quotes the message reads `received  3000 ` and no longer contains
that substring, so the test goes red. The `" 3000 "` case was chosen
deliberately over `"hello"`: for `hello` the quotes are cosmetic, and a test
using it would go green against an implementation that had dropped the very
feature it claims to cover.

Worth noting that the table above also shows this test is doing **two** jobs — it
is the only test that fails for *both* the quoting mutation and the trimming
mutation. That is a small weakness. If somebody later relaxes the whitespace rule
on purpose, this test fails for a reason that has nothing to do with quoting, and
the temptation will be to edit it rather than to replace it. The
`received "hello"` test covers "names the variable and quotes" independently, so
the coverage survives, but the overlap is worth knowing about.

### 2. Did `@nestjs/config` earn its place, honestly?

**Partly. Less than the ADR hoped, and the ADR's own prediction was accurate.**

What it genuinely bought:

- **`ConfigService` as an injectable provider.** This is real and it is
  architectural. `database.module.ts` now receives configuration the same way it
  receives everything else, through `inject: [ConfigService]`. Configuration
  stopped being a global any file could reach into. The compiled-output grep above
  is the evidence — zero `process.env` in `dist/` — and that property came from the
  wiring, not from discipline.
- **A defined place for the check to run**, early enough that a bad value stops
  the boot before any provider is constructed, with a correct exit code and a
  formatted error, for free.

What it did not buy, and what it cost:

- **It validates nothing.** Every rule is hand-written, exactly as ADR-007
  predicted. Choosing it did not remove one line of the work in option (a); it
  added a dependency and the wiring on top.
- **It added `dotenv` twice and `dotenv-expand`**, all three unused, to avoid
  using its own `.env` loading — which is redundant on Node 24. So the package's
  second-largest feature is switched off, and its cost is still paid.
- **It introduced a behaviour I had to work around**, the `assignVariablesToProcess`
  round-trip through `process.env` that turns `undefined` into the string
  `"undefined"`. That is a bug this application would not have had with a plain
  `config.ts`, and I only found it by reading the library's source rather than its
  documentation.
- **It moved where errors surface** in a way that is not obvious. The refusal is
  handled by Nest's `ExceptionsZone`, not by `bootstrap().catch` — see decision 7.

Honest summary: a hand-written `config.ts` would have been fewer moving parts and
the same rules. The injectable `ConfigService` is a genuine architectural gain and
is the reason this is not a net loss. But the ADR's framing — "(a) plus a
dependency plus the wiring" — is what actually happened, with three unused
packages and one library quirk on top that the ADR did not anticipate. If the
explicit learning goal of seeing how NestJS conventionally does this were removed
from the ledger, I do not think the remaining benefit would justify it today, at
two variables.

---

## Limitations

1. **No automated test asserts that the process exits non-zero.** The tests prove
   `validate` throws, and `ConfigModule.forRoot` propagates whatever it throws —
   but the step from "throws" to "the process died with code 1" is verified only
   by hand, above. Closing it would mean spawning the built binary from the test
   suite, which makes `pnpm test` depend on `pnpm build` having run. I judged that
   a worse trade than the gap, but it is a gap.
2. **The `DATABASE_PATH` warning still depends on somebody reading it.** ADR-007
   already accepts this as the weaker of the two options it considered. Nothing
   here improves on it.
3. **A mistyped-but-valid path remains undetectable at the string level.** By
   construction.
4. **Nothing forces variable number three into the validator.** The same
   memory-not-mechanism debt ADR-005 and the Day 3 `ORDER BY` bug both record. The
   `should return only the variables it checks` test pins the current surface, so
   at least a *silent* expansion is now caught.
5. **A `.env` at `apps/api/.env` is silently ignored**, because the scripts point
   at the repository root. It is also gitignored, so nothing warns about it. This
   is the sharpest edge in decision 5.
6. **Node prints its own line when no `.env` exists**: `…/.env not found.
   Continuing without it.` on stderr. It is visible in the end-to-end output
   above. Harmless and informative, but it is one line on every clean run, which
   sits slightly awkwardly next to this project's rule about output nobody acts
   on. Not suppressible without giving up `--env-file-if-exists`.

---

## Future improvements

- **Collect all configuration errors before throwing**, rather than stopping at
  the first. Worth roughly four lines and no new concepts. Not done today because
  two variables make the difference one extra run, and the constitution asks for
  the simplest thing that solves today's problem.
- **Required versus optional configuration**, when the Day 19 AI provider
  arrives. ADR-007 already names this as the revisit trigger.
- **A `pnpm start:prod` smoke check in CI** that boots the built binary and makes
  one HTTP request. It would close limitation 1 and would have caught the original
  `PORT=hello` bug on the day it was introduced.

---

## Lessons learned

**The library's documentation and the library's behaviour were different
documents.** `@nestjs/config`'s docs describe `validate` as "takes an object
containing environment variables and outputs validated environment variables."
Nothing there says the output is copied back into `process.env`, which is the
detail that turns a returned `undefined` into a database file named `undefined`.
I found it by reading `config.module.js`. For a library chosen partly *to learn
how the framework does things*, that is the lesson: the wiring is only understood
once you have read what it actually does.

**"It threw" is not the same claim as "it said something useful."** My first pass
at the rejection table asserted `toThrow()` with no argument, which is satisfied
by any error at all — including a `TypeError` from a typo in my own code. Fixing
it to `toThrow(/^PORT must be/)` cost nothing and turns seven tests from
"something went wrong" into "the right thing went wrong, and it named the
variable." This is the same shape as the missing word `only` that ADR-006
records.

**A test can be strict or convenient, and the difference is usually one
argument.** The `resolveDatabasePath` default-path parameter exists entirely
because the alternative made one test depend on whether the machine running it
happened to have a development database. That test would have passed on this
machine either way. Passing for the wrong reason is the specific failure this
project keeps finding, and it is cheaper to design out than to detect.

**Checking the successful cases was harder than checking the failures.** The
failures announce themselves — exit 1, a message. The successes required an
actual HTTP request, because ADR-007 records the exact trap of trusting Nest's
`successfully started` line, and required moving a database out of the way,
because "no warning appeared" is a meaningless observation when there was nothing
to warn about.

---

## Follow-up: pinning the configuration wiring

The Day 6 implementation was correct. The gap was in the suite: deleting the
single word `validate,` from `ConfigModule.forRoot` left typecheck, build, 80
unit tests and 21 end-to-end tests green on an application where the whole of
Day 6 was disconnected. This follow-up closes that, and adds nothing else — no
dependency, no production code change.

### What was added

One file, `apps/api/test/config-wiring.e2e-spec.ts`, with three tests. The
end-to-end count goes from 21 to 24.

1. **Building the real application refuses when `PORT` is invalid**, asserting on
   `PORT must be a whole number between 1 and 65535, received "hello"` rather
   than on the bare fact that something threw.
2. **Building the real application refuses when `DATABASE_PATH` is the empty
   string**, asserting on `DATABASE_PATH must be a non-empty path, received ""`.
3. **Building the real application succeeds when the configuration is valid**,
   with no `overrideProvider` of any kind.

`process.env` is snapshotted in `beforeEach` and restored key by key in
`afterEach`, so nothing a test sets can change the answer of whichever spec Jest
runs next. Test 3 points `DATABASE_PATH` at a fresh temporary directory —
configuration, not an override — which is what keeps it from opening the real
development journal. That database's timestamp is unchanged by the whole run.

### The thing the prompt did not anticipate, and it decides the file

The prompt stated that `@nestjs/config` "does not validate when `forRoot()` is
called. It validates when Nest initialises the module." The observable behaviour
it drew from that is right; the mechanism is not, and the difference is the whole
design of this file.

`ConfigModule.forRoot` is an **`async` static**, and in
`node_modules/@nestjs/config/dist/config.module.js` the call to
`options.validate(config)` sits at line 88, above the first `await` at line 104.
An async function body runs synchronously up to its first `await`. So `validate`
**is** called during `forRoot()` — which happens while `app.module.ts` is being
*imported*, because `ConfigModule.forRoot({...})` is an argument to the `@Module`
decorator. What makes it look otherwise is that the function is async: a throw
becomes a rejected promise instead of a thrown error, so the import appears to
succeed and the message only surfaces when Nest awaits the stored promise.

The consequence is that `forRoot` runs **once per module registry**, and its
result is memoised in `AppModule`'s metadata. A normal
`import { AppModule } from './../src/app.module'` at the top of the spec would
therefore validate exactly once, against the environment as it stood before any
test had set a variable, and every later assertion would be made against that
one cached result.

This was not reasoned about, it was measured. A probe spec written the obvious
way, setting `process.env.PORT = 'hello'` and then compiling a statically
imported `AppModule`, printed:

```
STATIC RESULT >>> NO ERROR AT ALL
```

That version of this file passes with `validate,` deleted. It is exactly the
worthless test the acceptance criterion exists to forbid, and it is the version
anybody would write first.

The fix is `jest.resetModules()` followed by a fresh `require` of
`./../src/app.module` inside the helper, so each test builds a genuinely new
application against the environment it just set. `await import(...)` is not
available as the tidier alternative: under ts-jest's CommonJS transform it fails
with `A dynamic import callback was invoked without --experimental-vm-modules`.
The two `require` calls therefore carry an
`// eslint-disable-next-line @typescript-eslint/no-require-imports`, each with a
comment saying why a static import cannot do the job.

A second, smaller trap follows from the same mechanism: the `DATABASE` symbol
used to close the connection in test 3 must be `require`d from the *same* fresh
registry. Importing it statically would yield a different `Symbol` and
`application.get` would not find it.

### Acceptance criterion

**Mutation A — delete `validate,` from `ConfigModule.forRoot`.**

```
  ● configuration wiring (e2e) › should refuse to build when PORT is invalid

    expect(received).rejects.toThrow()

    Received promise resolved instead of rejected

    > 82 |     await expect(buildTheRealApplication()).rejects.toThrow(
         |           ^
      83 |       'PORT must be a whole number between 1 and 65535, received "hello"',

  ● configuration wiring (e2e) › should refuse to build when DATABASE_PATH is the empty string

    expect(received).rejects.toThrow(expected)

    Expected substring: "DATABASE_PATH must be a non-empty path, received \"\""
    Received message:   "unable to open database file"

        > 96 |         const db = new DatabaseSync(databasePath);

Test Suites: 1 failed, 2 passed, 3 total
Tests:       2 failed, 22 passed, 24 total
```

Both claims fail, and the second fails in an instructive way. Without the
validator, `DATABASE_PATH=""` is not caught at all — it travels all the way into
the provider factory and comes back as SQLite's `unable to open database file`,
from `database.module.ts:96`, naming no variable and mentioning no configuration.
That is the ADR's own argument about message quality, demonstrated by removing
the code that supplies it.

Restored: `Tests: 24 passed, 24 total`.

**Mutation B — delete `isGlobal: true,` from the same object.**

```
  ● configuration wiring (e2e) › should build the real application when the configuration is valid

    Nest can't resolve dependencies of the Symbol(DATABASE) (?). Please make sure
    that the argument ConfigService at index [0] is available in the
    DatabaseModule module.

    > 125 |     const application = await buildTheRealApplication();
          |                         ^

Test Suites: 1 failed, 2 passed, 3 total
Tests:       1 failed, 23 passed, 24 total
```

Exactly the predicted split. **23 passed** — the 21 pre-existing end-to-end
tests, which override `DATABASE` and so never travel the broken edge, plus the
two rejection tests, which see `validate` throw long before Nest reaches
dependency resolution and go green on the message they were asserting. Only the
third test fails, and it fails with the same error the real application exits 1
on.

Restored: `Tests: 24 passed, 24 total`.

### Verification

```
pnpm lint       clean
pnpm typecheck  clean
pnpm build      clean
pnpm test       Test Suites: 4 passed, 4 total   Tests: 80 passed, 80 total
pnpm test:e2e   Test Suites: 3 passed, 3 total   Tests: 24 passed, 24 total
```

`find . -maxdepth 3 -type s -not -path "./node_modules/*"` returns nothing: no
socket files. No server was started at any point, and no process was left
running. `apps/api/data/neuron.db` still carries its 2026-08-01 timestamp, so
nothing in this run opened it. No temporary directories survive under `/tmp`.

`git status` shows one added file, `apps/api/test/config-wiring.e2e-spec.ts`.
Nothing under `apps/api/src` changed — `app.module.ts` was restored from a byte
copy after each mutation and `cmp` confirms it is identical. The diffs in
`apps/api/package.json` and `pnpm-lock.yaml` are the pre-existing Day 6 work
adding `@nestjs/config`; no install was run and no dependency was added.

### What this leaves open

The third test proves the application *builds*. It does not prove it *listens*,
and the distinction is one this project has already been caught by: ADR-007
records the Master Thread reading `Nest application successfully started` from a
process that had thrown `ERR_SOCKET_BAD_PORT` and exited 1, because Nest prints
that line before the server begins listening. `compile()` never reaches
`main.ts`, so a bug in how `PORT` gets from `ConfigService` to `app.listen` would
survive all three tests here. The report's existing suggestion — a `start:prod`
smoke check in CI that boots the built binary and makes one HTTP request — is
still the thing that closes it, and this file is not a substitute for it.
