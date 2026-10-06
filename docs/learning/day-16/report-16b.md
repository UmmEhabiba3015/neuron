# Day 16b — Worker report: one shared package for what crosses between the apps

**Date:** 2026-10-07. Prompt: `docs/workers/day-16b-contracts-package.md`.
Binding decision: ADR-019.

---

## Objective

Create `packages/contracts`, move each fact that both applications state
into it once, and make both applications import it. No endpoint changes its
behaviour and no screen changes its appearance.

Git was not touched. No third-party dependency was added. No migration was
run against `apps/api/data/neuron.db`; that file was last written at 00:32,
before this task's first edit.

---

## Summary

The package exists, both applications import it, and every copy named in the
prompt is gone.

- **The package is TypeScript source with no build step.** `pnpm install`
  links it into both applications, and that is all a fresh clone needs.
- **It needed no configuration in either application.** No `paths`, no
  `transpilePackages`, no Jest mapping. The only changes outside source code
  are one line in `pnpm-workspace.yaml`, one dependency line in each
  application's `package.json`, and two root scripts.
- **The API's build output kept its shape.** `apps/api/dist/main.js` is where
  it was, and a new test builds the API and starts it from there.
- **No existing test changed.** Four tests were added to the API and six
  checks to the package.

```
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
pnpm lint:web && pnpm typecheck:web && pnpm build:web && pnpm test:web

lint            clean
typecheck       clean
build           clean, dist/main.js in place
test            6 contract checks, then 194 passed in 13 suites   (was 194, 13)
test:e2e        236 passed in 20 suites                           (was 232, 19)
lint:web        clean
typecheck:web   clean
build:web       clean, 7 routes, all static
test:web        6 contract checks, then 15 passed                 (was 15)
```

Seven things need the Master Thread or the owner. Each is described further
down.

1. **The mechanism depends on one missing line.** The package's
   `package.json` has no `"type"` field, and it must stay that way. Node
   itself prints advice to add it. Adding it breaks `ts-node`. See
   question 1.
2. **Mutation 3 fails nothing.** With the largest page changed to 100, all
   nine commands pass. By the prompt's definition that is a correct result,
   because both applications still agree. It also shows that no test says a
   limit of 200 is accepted. See *Findings*.
3. **Your two dev servers were running the whole time**, and they followed
   every change I made, including the mutations. I also sent them a few
   requests that cannot write anything. See *Findings*.
4. **I added a dependency line to both applications**:
   `"@neuron/contracts": "workspace:*"`. I read "do not add a dependency" as
   meaning a library from outside. This one is a link to a folder in this
   repository. The lockfile gained 8 lines, all of them that link.
5. **`pnpm test` and `pnpm test:web` now run the package's checks first.** I
   changed those two root scripts and added `pnpm test:contracts`.
6. **I ran `migration:run` and `migration:generate`, against throwaway
   databases only**, because the prompt's table says both must resolve the
   package. `migration:generate` wrote a file, which I deleted. See
   *Findings*.
7. **The prompt says "all eight commands". The verification block has
   nine.** I ran nine.

---

## Files changed

| File | What changed |
|---|---|
| `packages/contracts/package.json` | New. Name, one export, one test script. No dependencies. |
| `packages/contracts/src/index.ts` | New. The whole contract, 49 lines. |
| `packages/contracts/test/contract.test.mjs` | New. Six checks. |
| `pnpm-workspace.yaml` | `packages/*` added. |
| `package.json` (root) | `test:contracts` added. `test` and `test:web` run it first. |
| `pnpm-lock.yaml` | Three workspace links. Written by `pnpm install`. |
| `apps/api/package.json`, `apps/web/package.json` | The workspace link. |
| `apps/api/src/days/day.entity.ts` | `MOODS` and `Mood` removed. `Mood` is imported as a type. |
| `apps/api/src/days/set-mood.dto.ts`, `days.repository.ts`, `days.service.ts` | Import `MOODS` and `Mood` from the contract. |
| `apps/api/src/days/days.controller.ts` | `DayResponse` removed. Every handler returns `WireDay`. |
| `apps/api/src/entries/page.ts` | The two page sizes removed. `FULL_PAGE` stays and uses the contract's. |
| `apps/api/src/entries/find-entries-query.dto.ts` | `@Max` uses the contract's value. |
| `apps/api/src/entries/entries.controller.ts` | Every handler returns `WireEntry`. |
| `apps/api/src/auth/register.dto.ts` | `@MinLength(PASSWORD_MIN_LENGTH)`. |
| `apps/api/src/auth/auth.controller.ts` | `AuthenticatedResponse` removed. Handlers return `WireUser` and `WireAuthenticated`. |
| `apps/api/test/built-output.e2e-spec.ts` | New. Builds the API, starts `dist/main`, asks it a question. |
| `apps/web/lib/api.ts` | `JournalEntry` and `Day` removed. |
| `apps/web/lib/session.ts` | `SessionUser` removed. One type-only import. |
| `apps/web/app/screens/LiveToday.tsx` | `PAGE_SIZE` removed. Uses `MAX_PAGE_SIZE`, `WireDay`, `WireEntry`. |
| `apps/web/app/components/Journal.tsx` | `MOODS` removed. Imported. |
| `apps/web/app/screens/AuthForm.tsx` | `PASSWORD_MINIMUM` removed. Both sentences are built from the value. |
| `README.md` | The repository layout, and what a fresh clone needs. |

---

## How it works

### What is in the package

```ts
export const MOODS = ['Hard', 'Low', 'Even', 'Good', 'Light'] as const;
export type Mood = (typeof MOODS)[number];

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;
export const PASSWORD_MIN_LENGTH = 8;

export interface WireEntry { id: string; content: string; createdAt: string }
export interface WireDay { date: string; mood: Mood | null }
export interface WireUser { id: string; email: string; createdAt: string }
export interface WireAuthenticated { accessToken: string; user: WireUser }
```

Every shape's name begins with `Wire`, meaning "as it travels over HTTP". The
API's classes `JournalEntry` and `Day` keep their names, and nothing in the
contract can be mistaken for them.

### How the API is held to it

The entries controller declares that it returns `WireEntry` and hands back
the `JournalEntry` entity the service gave it. TypeScript checks that
assignment. If the entity loses a field the contract promises, the
controller stops compiling. The same is true of `User` against `WireUser`,
and of `Day` against `WireDay`.

### How each tool finds the package

The package's `package.json` says one thing about loading: the name
`@neuron/contracts` means the file `src/index.ts`. Each tool then does what
it already does with a TypeScript file.

| Tool | Used by | What it does with `src/index.ts` |
|---|---|---|
| TypeScript (`tsc`) | `typecheck`, `build`, `dev`, and both for the web app | Checks it. Does not write it into `dist`, because it was found through `node_modules`. |
| Node itself | `node dist/main`, `test:web`, `test:contracts` | Loads the `.ts` file directly and removes the types (Node 24 does this without a flag). |
| `ts-jest` | `test`, `test:e2e` | Compiles it in memory, like any other source file. |
| `ts-node` | `migration:run`, `migration:generate`, one e2e suite | The same. |
| Turbopack (Next.js) | `build:web`, `dev:web` | Compiles it. The Next.js guide `transpilePackages.md` says workspace packages are compiled automatically, so `next.config.ts` is unchanged. |
| ESLint | `lint`, `lint:web` | Reads its types through TypeScript. |

---

## Decisions made

1. **The package ships its source.** See question 1 for the alternatives.

2. **`session.ts` takes a type-only import, and I think that keeps the
   spirit of its rule.** The rule exists so that the file can be tested with
   Node alone. An import written `import type { … }` is removed by Node
   before the file runs, so Node never looks for the package. The tests still
   run with nothing but Node. I rewrote the file's header to say "imports
   nothing that exists when it runs", and to say why the word `type` matters.
   I checked that it matters: without the word, `typecheck:web` still passes
   and `test:web` fails with a `SyntaxError`.

3. **The name `SessionUser` is gone**, replaced by `WireUser` everywhere in
   `session.ts`. Keeping the old name as an alias would have been a second
   name for one shape.

4. **`DEFAULT_PAGE_SIZE` and `MAX_PAGE_SIZE` are imported directly** by the
   two API files that use them. `page.ts` does not re-export them. A
   re-export would be a second place to find the same number.

5. **The sentence "That is shorter than 8 characters." was written twice in
   `AuthForm.tsx`.** It is now one constant, `TOO_SHORT`, built from the
   value.

6. **The checks live in the package, in a `.mjs` file.** The package has no
   TypeScript of its own and no `@types/node`, so a `.ts` test there would
   be checked by nothing. A plain JavaScript file is honest about that.

7. **The built-output test builds for itself.** It runs `nest build` and
   then starts `dist/main`. A test that trusted whatever `dist` happened to
   exist could pass on an old build, and would fail on a fresh clone.

8. **Tests are excluded from the "no copy remains" check, on purpose.** A
   test that says "201 is refused" or "the mood `Even` is accepted" is an
   independent statement of what the product should do. Mutation 2 shows why
   that is worth keeping.

---

## Assumptions

- **"Do not add a dependency" means a library from outside.** See item 4 in
  the summary.
- **"Do not run a migration" means against the owner's database.** See
  *Findings*.
- **The endpoints the web app does not call stay out of the contract.**
  `GET /auth/sessions` still returns the API's `Session`, and
  `GET /entries/count` still returns `{ count: number }` written in place.
- **Migrations are excluded from the "no copy remains" check.** Each one
  records the schema as it was on the day it was written. None of them
  contains a mood word today.

---

## Limitations

**The compiler check runs in one direction.** It proves that an entity has
at least what the contract promises. It does not prove that the API sends
nothing more. An entry is handed back as the entity itself, not built field
by field as a day is, so whatever the entity has loaded is what is sent.
Today that is exactly three fields, because the others are `select: false`.

**Nothing checks the package by itself.** It has no `tsconfig`, no lint and
no typecheck of its own. It is checked when an application that imports it is
checked, under that application's compiler settings.

**The "no copy remains" check reads text.** It finds a number only when the
same line also says what the number is. `const size = 200` on a line with no
word such as "page" or "limit" passes. A copy split over two lines passes.
It catches the copies that existed, and the obvious ways of writing them
again. It is not proof.

**The contract can hold only syntax that Node can remove.** No `enum`, no
`namespace`. That matches ADR-019's rule, but it is now also a technical
limit.

**I did not prove a fresh clone end to end.** `pnpm install
--frozen-lockfile` in this repository says the lockfile matches the three
manifests. A copy of the repository installed in a temporary folder failed
in offline mode, on a library missing from the offline store, which has
nothing to do with the package. I did not repeat it with the network.

---

## Dependencies added

None from outside. One workspace link in each application.

---

## Testing performed

### New claims, and where each is tested

| Claim | Test |
|---|---|
| The package imports nothing | `contract.test.mjs`: *the package depends on no other package*, and *no file of the contract imports anything* |
| The package holds no behaviour | *the contract holds facts, and no function or class* |
| No copy of the mood words remains | *the mood words are not written out again in either application*. Two mood words side by side in a list or a union count as a copy. One mood word alone does not. |
| No copy of a page size remains | *the page sizes are not written as numbers in either application*. The number must stand on a line that also says `page`, `limit`, `offset` or `@Max`. |
| No copy of the password minimum remains | *the password minimum is not written as a number in either application*. The line must also say `password`, `characters`, `MinLength` or `minimum`. |
| The built API starts from `dist` and answers, with the package found at runtime | `built-output.e2e-spec.ts`, four tests. The request is a registration with a 7-character password, and the expected answer contains the number 8, which now exists only in the package. |

### Mutation table

Each change was made, all nine commands were run, and the file was restored.
After the last one, all nine pass.

| # | Change | Commands that failed | Where |
|---|---|---|---|
| 1 | `createdAt` → `writtenAt` in `WireEntry` | `typecheck`, `build`, `test:e2e`, `typecheck:web`, `build:web` | API: `entries.controller.ts`, five errors, "Property 'writtenAt' is missing in type 'JournalEntry' but required in type 'WireEntry'". Web: `LiveToday.tsx`, four errors, "Property 'createdAt' does not exist on type 'WireEntry'". `test:e2e` fails only in the new built-output suite, because it builds. |
| 2 | Mood `Even` → `Steady` | `test:e2e` | 9 tests in the mood and days-range suites, which send `Even` and now receive 400. |
| 3 | Largest page 200 → 100 | none | |
| 4 | An import of `class-validator` added to the package | `typecheck`, `build`, `test`, `test:e2e`, `typecheck:web`, `build:web`, `test:web` | Everywhere, as "Cannot find module 'class-validator'". |
| 5 | A literal `MOODS` put back into `Journal.tsx` | `test`, `test:web` | *the mood words are not written out again*, naming `apps/web/app/components/Journal.tsx`. |

**Mutation 1. Both applications fail, at compile time, and that is the
failure a person wants.** Each error names the field and the file. Two
things to know. `pnpm test` passes, because the API's unit tests do not
typecheck (the spec files had type errors and still ran). And `pnpm lint`
passes in both applications.

**Mutation 2. Everything passes except the API's e2e tests, and both
applications still agree with each other.** The web app showed `Steady` and
the API accepted `Steady`. So the package did its job. The nine failures are
the tests saying that the product's word is `Even`. That is the failure a
person wants if the rename was a slip, and a list of tests to update if it
was meant.

**Mutation 3. Nothing fails, and both applications still agree.** The web
app asks for pages of 100 and the API serves pages of 100. This is the
correct result, not a missed one. See *Findings* for what it shows about the
tests.

**Mutation 4 needs a note.** The package has no dependencies, so it cannot
find any library, and the failure arrives as "module not found" before the
check has a chance to speak. So I ran a second version, 4b below.

### Further mutations of my own

| # | Change | Result |
|---|---|---|
| 4b | The package imports `node:path`, which every tool can find | `typecheck` passes. Only *no file of the contract imports anything* fails. This is the case the check exists for. |
| 4c | An arrow function added to the package | `typecheck` passes. *the contract holds facts, and no function or class* fails. |
| 6 | The **entity** `JournalEntry` renames `createdAt` | `typecheck` fails in `entries.controller.ts`: "Property 'createdAt' is missing in type 'JournalEntry' but required in type 'WireEntry'". This is the proof the prompt asks for. |
| 7 | The entity `Day` types `mood` as any string | `typecheck` fails in `days.controller.ts`: "Type 'string \| null' is not assignable to type '"Hard" \| "Low" \| "Even" \| "Good" \| "Light" \| null'". |
| 7b | The entity `User` renames `email` | `typecheck` fails in `auth.controller.ts`, three errors. |
| 8 | `@MinLength(8)`, `@Max(200)`, `limit=200` and the sentence with `8` put back | Both number checks fail, and each prints the file, the line number and the line. |
| 10 | `import type` → `import` in `session.ts` | `typecheck:web` passes. `test:web` fails with a `SyntaxError`. |
| 11 | `"type": "module"` added to the package | The main-wiring e2e suite fails. See question 1. |

### Watch mode

Your `pnpm dev` and `pnpm dev:web` were running. I changed the password
minimum to 9 and the mood `Even` to `Steady` in the package, and waited.

| | Before | After the change | After restoring |
|---|---|---|---|
| Your API, a registration with a bad email and an 8-character password | email message only | "password must be longer than or equal to 9 characters" as well | email message only |
| Your web app, `/review/mobile` | `Even` | `Steady` | `Even` |

Both watchers picked the change up in a few seconds, with no restart by hand.
The registration cannot create an account, because the email is refused.

### Migrations

`DATABASE_PATH=<temporary file> pnpm migration:run` ran all nine migrations
on an empty database. `migration:generate` against that database also ran.
Both load the entities, and the entities now import from the package.

### In a real browser

Firefox, without a window, driven by a script. The built API ran on port
39617 with an empty migrated database in a temporary folder. A production
build of the web app ran on port 39618. Both were stopped afterwards, the
database was deleted, and the web app was built again for `localhost:3000`.

| Step | What was seen |
|---|---|
| Signed-out visitor opens `/` | Sent to `/in` |
| `/new`, the help under the password field | "Use at least 8 characters. A few unrelated words work well." |
| `/new`, a password of 7 characters | "That is shorter than 8 characters." |
| `/new`, a good password | Today, "What's today been like?" |
| Login, asked from outside | `accessToken`, and `user` with `id`, `email`, `createdAt` |
| Two entries created from outside | Each answer has `id`, `content`, `createdAt` |
| `GET /days/today` | `{"date":"2026-10-06","mood":null}` |
| `?limit=200`, then `?limit=201` | 200, then 400 |
| Reload `/` | Both entries, oldest first, then the mood row: Hard, Low, Even, Good, Light |

### Findings

**1. No test says that a limit of 200 is accepted.** The pagination suite
checks that 201 is refused. With the maximum at 100, 201 is still refused,
so nothing fails. One more line, a request for `?limit=200` expecting 200,
would make mutation 3 fail in the API's e2e tests. I did not add it. The
prompt treats "everything passes and both agree" as a correct result, and
whether 200 is a promise of the product or a setting is the owner's to say.

**2. Your dev servers followed every change.** That includes the five
mutations and the first, broken, experiment in question 1. Your API was
restarted by its watcher many times. `pnpm build`, and the new e2e test,
both write into the same `apps/api/dist` folder your watcher uses. Nothing
broke while I watched, and both servers answer now. If a browser tab of
yours showed an error between about 00:45 and 01:15, this is why.

**3. `migration:generate` wrote a file, and I deleted it.** It wrote
`1791316159762-Probe.ts`, about `sessions` and `days`. That is the remaining
difference report 16a describes in its item 3. It is not caused by this
task. The migrations folder is as it was.

**4. My first browser run failed, and the fault was mine.** I started the
API on an empty file with no tables, and registration answered 500. I ran
the migrations on that temporary file and repeated the run. The application
was not changed.

**5. In my desktop screenshot the Day box looks empty.** The page's text
does contain "Tue 6 Oct '26" inside that box. The box's value is drawn in
the handwriting font, and my guess is that a browser with no window had not
loaded it. `Chrome.tsx`, `LiveScreen.tsx` and both stylesheets are not in my
diff. I did not find the cause. Please look at Today once in your own
browser.

**6. `README.md` said the API was "the only app so far"** and that there is
no `packages/` directory. I corrected both.

---

## The four questions

### 1. Which mechanism did you choose, what did the others cost, and what is the weakest point of the one you chose?

**Chosen: the package ships its TypeScript source as it is, and its
`package.json` does not say which module system it uses.**

What I tried, in order:

**a. Source as is, with `"type": "module"`.** This is the truthful
description, because the file uses `export`. `typecheck`, `build`, the built
`node dist/main` and `pnpm test` all passed. `pnpm test:e2e` failed in the
main-wiring suite, which starts `src/main.ts` through `ts-node`:

```
require() of …/packages/contracts/src/index.ts from …/register.dto.ts is an
ES module file as it is a .ts file whose nearest parent package.json
contains "type": "module"
```

`ts-node` refuses to load an ES module from CommonJS code, and the API is
CommonJS. The migration commands use `ts-node` too.

**b. Source as is, with no `"type"` field.** All nine commands pass, and so
do the migration commands and both watch modes. This is what I kept. It
works because each tool decides for itself. TypeScript, `ts-jest` and
`ts-node` read "no type field" as CommonJS and compile the file to
CommonJS. Node reads the file, sees `export`, and loads it as an ES module.
Each tool ends up doing something correct.

**c. Path mapping without a real package.** I tried this on a copy of the
API in a temporary folder. `tsc` then treats the contract as one of the
API's own source files. The build output changed shape: `main.js` moved to
`dist/apps/api/src/main.js`, which the start scripts do not look for. The
compiled code then failed to start with "Cannot find module
'../../../../packages/contracts/src/index.ts'". Fixing that needs a mapping
in `tsconfig`, a second one for Jest, a third for `ts-node`, and something
to rewrite the compiled paths, which means a dependency.

**d. The package with its own compile step.** I did not build this one. It
would work everywhere, because every tool can load plain compiled
JavaScript. Its costs are certain without trying it: the package needs
TypeScript, which is a dependency or a borrowed one; a fresh clone needs a
build before any command works, so every root script grows a first step; and
in watch mode a change to the contract is not seen until the package is
compiled again, which needs a second watcher. That is four moving parts for
49 lines.

**The weakest point of (b) is that it depends on a line that is not there.**
When Node's test runner imports the package, Node prints a warning that
recommends adding `"type": "module"`. Following that advice gives (a), and
breaks `ts-node`. I silenced the warning in the package's test script with
the same flag `apps/web` already uses for the same reason. The built API
prints no such warning, and the built-output test checks that it stays so.
Mutation 11 shows the failure. A comment cannot go in a JSON file, so the
explanation is here and in the built-output test.

Two smaller weak points:

- **The built API reads a TypeScript file while running.** `node dist/main`
  loads `packages/contracts/src/index.ts`. So `dist` and `node_modules` are
  no longer enough to run the API: the `packages` folder must be there too,
  and Node must be 24 or later. This matters on Day 31. If the deployment
  copies only `dist`, the API will not start.
- **Three recent Node features are involved**: loading `.ts` files, choosing
  the module system from the syntax, and loading an ES module from CommonJS
  code. All three work without a flag in Node 24, which this repository
  already requires.

If one of those becomes a problem, (d) is the fallback, and nothing outside
the package and the root scripts would have to change.

### 2. Did the package earn its place?

Yes, but less cheaply than its 49 lines suggest.

| | Lines |
|---|---|
| Removed from the two applications' source | 103 |
| Added to the two applications' source | 76 |
| The contract itself | 49 |
| Its `package.json` | 11 |
| Its checks | 146 |
| The built-output test | 140 |
| Workspace file, root scripts, lockfile | 13 |

Counted as things and not lines: ten declarations are gone. Six from the web
app (`JournalEntry`, `Day`, `PAGE_SIZE`, `MOODS`, `PASSWORD_MINIMUM`,
`SessionUser`) and four from the API (`MOODS` with `Mood`, the two page
sizes, `DayResponse`, `AuthenticatedResponse`). Nine declarations were added
in one file. The API has a written wire type for an entry for the first
time.

The applications' own source is 27 lines shorter. The repository is about
330 lines longer, and most of that is tests.

What makes me say yes: mutation 1 used to fail nothing, and now fails both
applications at compile time, naming the field. Mutation 7 shows that
`mood` can no longer be loosened to any string by accident. Neither
application needed any configuration.

Where I think it cost more than the problem deserved:

- **The "no copy remains" check.** About 60 lines of pattern matching on
  text, guarding a rule that ADR-019 already accepted would be "kept by
  discipline". It did catch every copy I put back. It can also be avoided
  without trying, as *Limitations* says. If it ever fails on a line that is
  not a copy, I would delete it and not make it cleverer.
- **The built-output test.** 140 lines and about four seconds, to guard one
  fact. I think it is worth it, because that fact is the weak point in
  question 1, and nothing else runs `dist/main` at all.

If option (d) had been necessary, my answer would have been no for now.

### 3. Is anything still written twice across the two applications?

Yes. None of it was in this task's scope.

- **The two validation messages** the web app matches by their text.
  ADR-019 accepts this. One detail: the web app matches only the start of
  the password message, so it now survives a change of the number.
- **What the web app sends.** The body of login and of register is
  `{ email, password }`, written in `session.ts` and again as `LoginDto`
  and `RegisterDto`. The package describes answers only. This is the gap
  that matters next, because Day 17 and Day 18 send a mood and an entry.
  The request shapes can go into the package as plain interfaces, and each
  DTO class can declare that it `implements` one. The decorators stay in
  the API, so ADR-019's rule is kept.
- **The paths and the query names.** `/days/today`, `/entries`,
  `/auth/login`, `/auth/refresh`, `/auth/register`, and `date`, `limit` and
  `offset` are strings in the web app and decorators in the API.
- **The shape of an error.** `session.ts` reads `message` from a refused
  request as a string or a list of strings. The API produces that through
  Nest and states it nowhere.
- **What the status codes mean.** 401 on login means wrong details, 409 on
  register means the email is taken, 400 means validation.
- **The order of entries.** The API lists newest first and the web app
  sorts oldest first. Report 15c raised this.
- **What an email looks like.** The web app has a loose pattern and the API
  has `IsEmail`. They are different checks on purpose.

Inside the API alone, two things I noticed: `Session[]` and
`{ count: number }` are still returned as API types, and the web app calls
neither endpoint.

### 4. At what size would you switch to a generated client?

**At about fifteen endpoints called by the web app, or the first time the
two applications disagree in a way the compiler did not catch, whichever
comes first.** A native client is a third reason, and ADR-019 already names
it.

My reasons, having written it by hand:

- **Writing the shapes was the easy part.** Four interfaces took minutes,
  and would take minutes again at twenty.
- **The work is in what the hand-written contract does not reach.** It
  covers what the API answers, and only in one direction. It does not cover
  request bodies, query parameters, paths or errors. Question 3 is that
  list. Each can be added by hand, and each is one more thing a person must
  remember to wire to the API. A generator reads all of them from the API
  itself.
- **Five endpoints are called today.** The designs show Timeline, Ask and
  the Account page still to come. I would expect the count to pass fifteen
  around the time those three exist.

One disagreement with how ADR-001 framed it. A generator does not replace
this package. A generated client knows the shape of each endpoint. It does
not know that the largest page is 200, or which five words a mood may be,
as values a screen can use. Those would stay here. So when the switch
comes, I would expect the four `Wire` shapes to leave the package and the
five constants to remain.

---

## What a person runs after cloning

```bash
pnpm install
```

That is all the package needs. The two environment files are needed as
before: `.env` from `.env.example` at the root, and `apps/web/.env.local`
from `apps/web/.env.example`.
