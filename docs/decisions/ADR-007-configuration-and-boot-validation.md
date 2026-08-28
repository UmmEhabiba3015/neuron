# ADR-007: Configuration Is Checked Once, At Boot

**Status:** Accepted
**Date:** 2026-08-06 (Day 6)

---

## Decision

Five decisions, all made on Day 6:

1. **Configuration is checked once, when the application starts.** A value that
   is wrong stops the application from booting, with a message that names the
   variable and quotes the value.
2. **`PORT`, when set, must be a whole number between 1 and 65535.** Anything
   else refuses to boot, including the empty string, `0`, negative numbers,
   numbers above the legal range, non-numeric text, and a number with
   surrounding whitespace. When `PORT` is not set at all, the default is 3000.
3. **`DATABASE_PATH`, when set, must be a non-empty string.** When it is set and
   the file it names does not exist, the application warns loudly and then
   creates the file. When it is not set, the default path is used silently,
   because a missing database on first run is normal rather than suspicious.
4. **A `.env` file holds local values and is never committed.** A committed
   `.env.example` documents every variable that exists. Node's built-in
   `--env-file-if-exists` loads the file, so no `dotenv` package is added. A
   real environment variable always takes precedence over the file.
5. **`@nestjs/config` provides the module and the injectable `ConfigService`,**
   and a hand-written `validate` function supplies every rule above. No further
   validation library is added.

---

## The problem

The application had exactly two configuration values, and nothing checked either
of them.

```ts
// main.ts
await app.listen(process.env.PORT ?? 3000);

// database.module.ts
const databasePath = process.env.DATABASE_PATH
  ? resolve(process.cwd(), process.env.DATABASE_PATH)
  : resolve(__dirname, '../..', 'data/neuron.db');
```

Nothing recorded anywhere that these two variables existed. Nothing checked what
they contained. Nothing stopped the application from starting with a value that
made no sense.

The roadmap frames Day 6 as *"my database password is in a committed file."*
There is no password in this project yet, and that is the reason this is the
right day for it. It is far easier to decide how a secret should be handled
before there is a real one to leak.

---

## How these were found

Every problem below was demonstrated by running the real application, not by
reasoning about it.

### `PORT=hello` does not crash. It starts.

```
[Nest] LOG [RouterExplorer]  Mapped {/entries, GET} route
[Nest] LOG [NestApplication] Nest application successfully started
```

The process stayed alive and healthy, every route was mapped, and nothing at all
was listening on TCP port 3000. A Unix domain socket file named `hello` appeared
in `apps/api/`.

Node's `listen` accepts either a port number or a filesystem path, because both
are legitimate things to listen on. It checks whether the string looks like a
number. `"3000"` does. `"hello"` does not, so Node falls back to its other
interpretation and treats the value as a path.

Nothing was broken. Every component did exactly what it was told.

### The full matrix, run against a real Node HTTP server

```
"3000"      -> listening on TCP port 3000
""          -> threw ERR_SOCKET_BAD_PORT
"hello"     -> listening on a FILESYSTEM SOCKET at "hello"
"0"         -> listening on TCP port 32825
"-5"        -> listening on a FILESYSTEM SOCKET at "-5"
"99999"     -> threw ERR_SOCKET_BAD_PORT
" 3000 "    -> listening on TCP port 3000
"3000abc"   -> listening on a FILESYSTEM SOCKET at "3000abc"
"65535"     -> listening on TCP port 65535
```

The pattern in that table is the reason this ADR exists, and it is backwards from
intuition. **The values that fail loudly are the ones that look like numbers.**
They get range-checked and rejected. **The values that fail silently are the ones
that do not look like numbers at all.** They stop being ports and become paths,
and a path cannot be invalid, so nothing can be rejected.

`PORT=-5` is nonsense a human would spot instantly, and it produces a file called
`-5` and a healthy-looking server nothing can reach. `PORT=0` is the sneakiest of
all, because zero is a legal port meaning *"give me any free port"*, so the
application works perfectly on a different random port every run.

### The mistyped database path is worse than the mistyped port

```
DATABASE_PATH=data/nueron.db node dist/main.js

startup: reported success, no error printed
GET /entries        -> []
GET /entries/count  -> {"count":0}
```

`mkdirSync` was satisfied because the directory already existed. `new
DatabaseSync(path)` creates a missing file rather than complaining about it.
`CREATE TABLE IF NOT EXISTS` then found no table and made a fresh empty one.
Three pieces of code, each doing the reasonable thing, producing a brand new
empty database indistinguishable from a working one.

This is worse than the port case because the application is completely reachable
and completely functional. Every endpoint works. The only symptom that reaches
the user is that their entire journal has disappeared, and no log line mentions
it.

### Environments are already real in this project

Pointing the end-to-end suite at a copy of the development database instead of
its usual in-memory one produced **2 failed, 16 passed**, with no production code
changed at all, and left six fake entries behind permanently.

Which tests failed is the informative part. The two failures were the two making
a claim about the *whole* collection being empty. Every test claiming only *"what
I put in comes back out"* passed without noticing anything, because those tests do
not care what else exists. A claim about everything is only true if you control
everything.

The suite's result had also become dependent on what happened to be in the
journal that week. A test that can change its answer without the code changing is
not measuring the code.

---

## The pattern underneath all of it

**The dangerous configuration bug is not the one that crashes. It is the one that
starts.**

A crash is loud, it happens immediately, and the error message points at the
cause. Silent success surfaces somewhere else entirely and much later, as a
health check that times out or a colleague asking why the site will not load, and
none of those places mention the variable that caused it.

There is a second sentence worth keeping, from the secret-handling half of the
day: **a secret that has been committed is a secret that has been leaked.** Not
*might be*. A throwaway repository demonstrated it — the working tree was clean,
`grep` found nothing, and a single `git grep` across all commits returned the
password. Rewriting history does not reliably fix it either, because forks and
clones are outside your control and public repositories are scanned continuously
by automated tools. The only real fix is to rotate the credential.

---

## Decision 1: check at boot, not at first use

An unchecked value can be discovered in two places: when the application starts,
or at the moment something tries to use it.

The second is where this codebase is today, and its cost becomes obvious with a
value that is used rarely. On Day 19 an AI provider arrives with an API key. If
that key is only inspected where it is used, a deployment with a missing key
starts perfectly, passes health checks, and serves journal entries all day. The
first person to ask for a summary at four in the afternoon discovers the
deployment was broken from the start.

Checking at boot moves the discovery of a problem as close as possible to the
person who caused it, in both time and place. `PORT must be a whole number
between 1 and 65535, received "hello"` at deploy time is a two-minute problem.
The same mistake found by a user hours later is a two-hour problem, and by then
the person who typed it has gone home.

### The cost, stated plainly

One wrong value takes down the whole application, including the parts that did
not need that value. If the Day 19 API key were missing, a strict boot check
would also stop people writing journal entries, even though journaling never
touches the key.

Larger systems solve this by marking some configuration required and some
optional, so a missing optional value disables one feature instead of the whole
service. That is deliberately **not** built here, because every variable this
application has is needed for it to function at all. See *Future Revisit
Conditions*.

---

## Decision 2: absent and wrong are different messages

This distinction decides most of the rules and it was the learner's own.

**Absent** means *"I have no opinion about this, choose something sensible for
me."* A default is exactly the right answer.

**Wrong** means *"I do have an opinion and I expressed it badly."* A default is
exactly the wrong answer, because it silently overrides what the person asked for
and hides their mistake, which is the same silent failure this whole ADR is
about.

So `PORT` unset gives 3000, and `PORT` set to anything invalid stops the
application.

### Why we write our own check rather than relying on Node's

Node already rejects some bad ports, so it is fair to ask why this needs code.

Two reasons. Node accepts `hello`, `-5` and `3000abc` without any complaint at
all, so its check does not cover the cases that actually hurt. And when Node does
reject a value, its message is `options.port should be >= 0 and < 65536`, which
never mentions the word `PORT`, so the person reading it does not learn which
variable to go and fix.

### Why `0` is rejected

`PORT=0` is legal and means *"pick any free port."* It was rejected because a
person who types `PORT=` and a number wants that number. A server on a different
random port every run is never what was intended, and it fails in the quietest
way available.

### Why whitespace is not trimmed

`PORT=" 3000 "` currently works, because Node trims it. It is now rejected.

This follows the reasoning used in ADR-005 for journal content, which is that
this layer has no business quietly editing what somebody wrote. There it
protected a journal entry from being altered; here it means a stray space is
reported rather than absorbed.

Being strict imposes one requirement on the implementation: **the error message
must quote the value**, so that `received " 3000 "` shows the spaces. Without the
quotes the reader sees `received  3000 ` and cannot tell what is wrong with it.
Invisible characters have to be made visible or a strict rule becomes an
infuriating one.

---

## Decision 3: `DATABASE_PATH` and the mistake no check can catch

`DATABASE_PATH=data/nueron.db` is a typo. It is also a perfectly valid path, with
the right shape, the right characters and the right extension. **No inspection of
that string will ever reveal that it is not the one you meant, because nothing is
wrong with it.**

This is the boundary of what validation does. Validation catches values that are
malformed. It cannot catch values that are merely wrong. Some mistakes are only
detectable by checking reality, never by checking form.

The rule adopted therefore checks reality rather than the string:

```
DATABASE_PATH not set, default file missing   -> create it silently. First run.
DATABASE_PATH not set, default file present   -> open it
DATABASE_PATH set, file present               -> open it
DATABASE_PATH set, file missing               -> WARN loudly, name the path, create it
DATABASE_PATH set to ""                       -> refuse to boot, name the variable
```

### Why the warning only fires on the suspicious case

A stricter option was considered and rejected: refuse to boot whenever the
database file does not exist, making creation a separate deliberate command. That
catches the typo outright. Its cost is that every throwaway run this project has
done breaks — all four audit commands to date pointed `DATABASE_PATH` at a new
file in `/tmp` specifically so that an empty database would be created — as does
the first run on a freshly cloned repository, where no database exists by
definition.

The chosen option warns instead of refusing. The refinement that makes it
worthwhile is that **the warning fires only when somebody explicitly set
`DATABASE_PATH` and the file they named is missing.** Creating the default
database on a fresh clone is normal, and warning about it would teach people that
the warning means nothing. This project already decided that a warning nobody
acts on is noise that trains you to ignore output.

### The honest weakness of this choice

A logged line is only loud if somebody reads it. During this very session, the
Master Thread checked whether the application had started by searching its log
for `successfully started`, found the words, and reported success — on an
application that had thrown `ERR_SOCKET_BAD_PORT` and exited with code 1. Nest
prints `Nest application successfully started` **before** the server begins
listening.

That is exactly the failure ADR-006 named: a claim a broken implementation can
satisfy is a green checkmark, not a check. It was committed an hour after being
explained. See *Future Revisit Conditions*.

---

## Decision 4: `.env`, and no `dotenv`

Three different things get called "a configuration file" and they do three
separate jobs:

1. **A place in the code where configuration is read and checked once**, after
   which no other file touches `process.env`.
2. **A committed file documenting which variables exist**, with placeholder
   values and no secrets. This is `.env.example`.
3. **An uncommitted file holding the real values** on one machine. This is
   `.env`, and it is where a real password will eventually live.

All three are adopted. Node 24 supplies the third for free:

```
node --env-file-if-exists=.env dist/main.js
```

`--env-file-if-exists` rather than `--env-file`, because `.env` is gitignored, so
a freshly cloned repository has none and the strict form would fail on a clean
clone — precisely the unhelpful failure this ADR removes.

A real environment variable takes precedence over the file, verified directly:

```
PORT=9999 node --env-file=.env ...   ->   PORT = "9999"
```

That precedence is what makes this safe later. On a laptop the `.env` file
supplies values. In production no `.env` file is shipped at all; the hosting
platform sets real environment variables and those win. The same code reads both.

`dotenv` is therefore not added. It was the standard answer until Node absorbed
the feature, and adding it now would be a dependency for something the runtime
already does.

---

## Decision 5: `@nestjs/config` with a hand-written validator

### Alternatives considered

**(a) A hand-written `config.ts` and nothing else.** One file, roughly forty
lines, zero dependencies. Reads both variables, applies every rule above, throws
with a clear message, exports a checked object.

**(b) `@nestjs/config` with a hand-written `validate` function.** *(chosen)*

**(c) `dotenv` alone.** Rejected outright — Node does this for free, and it does
not address checking at all.

### The facts that were established before choosing

`@nestjs/config` is a genuine dependency that must be installed. It is not
bundled with Nest, in the same way `class-validator` is not.

It does not validate anything by itself. It provides a place to put a validator;
the validator must still be supplied, either hand-written or by adding a further
dependency such as Joi. **Choosing (b) does not remove the work in (a). It is (a)
plus a dependency plus the wiring that makes Nest run it.**

Its other main feature, loading `.env` files, is now redundant on Node 24.

### Reasoning

Two arguments carried it.

The first is the project owner's, stated twice in one day and therefore a
position rather than a passing preference: learning how NestJS conventionally
does things is itself one of the goals of this project. The wiring is the part
she wants, so paying for the wiring is the point rather than a hidden cost.

**This is in tension with ADR-005**, which argued the opposite — that
understanding *why* validation is needed transfers everywhere while knowing a
framework's API names does not. That argument is not withdrawn and it is still
correct about transferable knowledge. It is outweighed here by an explicit
learning goal that belongs to the person doing the learning.

The second argument is architectural and applies regardless. `ConfigService` is
injectable, which makes configuration a provider like any other. That matters in
this codebase specifically, because it is what the `DATABASE` token already does:
the end-to-end suite supplies a different database through `overrideProvider` and
the code under test never notices. Configuration stops being a global that any
file can reach into and becomes a dependency handed to whoever needs it. Nothing
outside the configuration module should ever read `process.env` again.

---

## Accepted costs

- **One new dependency**, `@nestjs/config`, for wiring rather than for
  capability. The rules are still hand-written. **Four packages on disk** — see
  Amendment 1, which corrects this record.
- **`@nestjs/config` copies whatever `validate` returns back into
  `process.env`**, and `process.env.X = undefined` stores the five-character
  string `"undefined"` rather than removing the key. `validate` therefore omits
  an absent `DATABASE_PATH` rather than setting it to `undefined`, or the
  application would open a database file literally named `undefined`. This is a
  library quirk found by reading its source, not its documentation, and it is a
  cost a hand-written `config.ts` would not have had.
- **A wrong value takes the whole application down**, including features that
  never needed it. Deliberate; see Decision 1.
- **The `DATABASE_PATH` warning depends on somebody reading it.** Deliberate, and
  the weaker of the two options considered. See Decision 3.
- **A mistyped-but-valid path is still undetectable at the string level.** Nothing
  fixes this; `.env.example` reduces it by making the correct value something to
  copy rather than retype.
- **Checking is still enforced by memory, not by mechanism** for any *future*
  variable. Nothing forces variable number three to be added to the validator.
  This is the same failure class as ADR-005's validation debt and the Day 3
  `ORDER BY` bug.

---

## Amendments, same day, after the implementation and the audit

Three things in this record turned out to be wrong or incomplete once the code
existed. They are corrected here rather than quietly edited above, because the
reasoning is more useful than the conclusion.

### 1. "`dotenv` is therefore not added" was false

Decision 4 states plainly that `dotenv` is not added, on the grounds that Node
does the job natively. Installing `@nestjs/config` added it anyway. The lockfile
gained four packages:

```
@nestjs/config@4.0.4
dotenv@16.6.1
dotenv@17.4.1
dotenv-expand@12.0.3
```

`@nestjs/config` bundles `dotenv` — at two different versions — and
`dotenv-expand` with it. Because `ignoreEnvFile: true` is set, **none of that
code ever runs.** The direct dependency count is one, as instructed. The on-disk
count is four, of which three exist to do a job Node now does natively and are
then switched off.

The honest statement is therefore: *this decision avoided writing `dotenv` in
`package.json`, and did not avoid installing it.* The worker reported this
against its own work without being asked, which is the second time a worker on
this project has volunteered a weaker version of its own success.

### 2. `.env` lives at the repository root, and the start scripts load `../../.env`

This was not decided in the original record and the worker escalated it rather
than deciding alone. Confirmed by the project owner: **repository root.**

`.env.example` sits at the root beside the README, which is where somebody who
has just cloned the repository looks first, and a `.env.example` is only useful
if `.env` belongs beside it. The start scripts run with a working directory of
`apps/api`, so they pass `--env-file-if-exists=../../.env`.

The accepted cost, which is real: a `.env` placed in `apps/api/` is silently
ignored, and because it is also gitignored nothing warns about it. `.env.example`
documents the resolution rule instead.

### 3. The rules were fully tested and the wiring was not

The audit found no defect in the implementation. It found one in the suite.

Deleting the single word `validate,` from `ConfigModule.forRoot` in
`app.module.ts` produced this:

```
typecheck        PASSES
build            PASSES
80 unit tests    PASS
21 e2e tests     PASS
PORT=hello       starts happily and creates a Unix socket file called `hello`
```

Every rule still existed, fully tested, and was never called. **All 101 tests
passed on an application where the whole of Day 6 was disconnected.**

Four other mutations were all caught — accepting `PORT=0`, accepting `PORT=99999`,
returning `PORT` as a string, and warning on the default path — failing 1, 1, 4
and 3 tests respectively. So the suite tests the *rules* precisely. It did not
test that anything calls them.

This is the same failure this project recorded on Day 4, when removing
`EntriesRepository` from a module's `providers` left typecheck, build and 29 unit
tests green while the server would not boot. Unit tests verify the pieces work.
Something has to verify the pieces are connected.

The Day 6 report named a version of this as its first limitation, but framed it
as *"no test asserts the process exits non-zero"* and judged the fix too
expensive because it would require the built binary. Neither half held.
The gap is that nothing checks the validator is *connected*, and
`Test.createTestingModule({ imports: [AppModule] }).compile()` rejects with the
real message, needing no build step and no child process. Establishing that took
one command during the audit.

**Resolution:** a follow-up task adds `apps/api/test/config-wiring.e2e-spec.ts`,
whose acceptance criterion is that removing `validate,` must make it fail.

### 4. When `validate` actually runs, corrected

Recorded because it was taught wrongly once and the correction is more useful
than the fact.

`ConfigModule.forRoot({ validate })` **calls `validate` immediately**, while
`app.module.ts` is being imported. It does not hand the function to Nest to call
later. The library's own source shows it plainly:

```js
static async forRoot(options = {}) {
    ...
    if (options.validate) {
        const validatedConfig = options.validate(config);
```

The confusing part is that `forRoot` is declared `async`, and an `async` function
never throws — it returns a rejected promise. So with an invalid `PORT`:

```
about to require app.module.js
require() returned without throwing
Nest has NOT been asked to build anything at this point
UNHANDLED REJECTION: PORT must be a whole number between 1 and 65535, received "hello"
```

The check ran, failed, and the failure sat unhandled inside a promise in the
`imports` array until Nest awaited it. Every observable fact recorded elsewhere in
this ADR is unaffected — the import succeeds, `compile()` rejects, `main.ts`'s own
`catch` never runs. Only the explanation was wrong.

The `useFactory` comparison still holds for the `DATABASE` provider, which Nest
genuinely does call later. It does not hold for `validate`.

**This was found by the follow-up worker**, which read the library's source rather
than accepting the prompt's claim, and documented the truth in a comment. That is
the second time a worker on this project has corrected the record it was given.

## Future Revisit Conditions

Revisit **checking at boot** when the first genuinely optional configuration
value appears — one whose absence should disable a single feature rather than the
whole service. The Day 19 AI provider is the likeliest candidate. At that point
the required/optional distinction stops being over-engineering.

Revisit **the `DATABASE_PATH` warning** the first time somebody misses it. If a
mistyped path ever reaches a real problem despite the warning being printed,
option A from Decision 3 — refusing to boot, with a separate creation command —
becomes justified by evidence rather than by argument.

Revisit **secret handling properly on Day 24**, when Postgres arrives and there
is a real credential. `.env` is adequate for one machine and is not a secret
manager. Everything in this ADR about `.env` concerns local development.

Revisit **`CREATE TABLE IF NOT EXISTS` at boot** at the first non-additive schema
change, as ADR-003 already records. Creating storage is an administrative act and
serving requests is a runtime act, and the fact that this application still does
both is what turns a typo into an empty database.
