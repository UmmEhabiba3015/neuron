# Worker Prompt — Day 6: Configuration, Checked At Boot

## Context

You are implementing one isolated task on the Neuron project. Read
`docs/constitution.md` and
`docs/decisions/ADR-007-configuration-and-boot-validation.md` before you start.
The rules that matter most here: the simplest correct solution wins, and no
complexity is added unless it solves a problem that exists today.

Do **not** touch git. No branching, no committing, no merging. Those are human
actions on this project.

This work has already been designed in full by the Master Thread with the
project owner. **You are implementing a decided design, not choosing one.** Where
this prompt states a decision, follow it. If you believe a decision is wrong,
implement it as written and record your objection in the report. The Day 5 worker
did exactly this and it improved the ADR, so an honest objection is wanted.

Exactly **one** dependency may be added, `@nestjs/config`, and nothing else. In
particular do **not** add `dotenv`, `joi`, `zod`, `class-validator` or
`class-transformer`. Node 24 loads `.env` files natively and the validation is
hand-written on purpose. If you find yourself wanting another package, that is a
finding for the report, not a licence.

## The problem

The application reads two environment variables and trusts whatever it finds.

```ts
// apps/api/src/main.ts line 6
await app.listen(process.env.PORT ?? 3000);

// apps/api/src/database/database.module.ts lines 26-28
const databasePath = process.env.DATABASE_PATH
  ? resolve(process.cwd(), process.env.DATABASE_PATH)
  : resolve(__dirname, '../..', 'data/neuron.db');
```

Nothing checks either value, and nothing anywhere records that these two
variables exist. The failures this produces are silent rather than loud, which is
the whole point of the day. `PORT=hello` starts a healthy application listening
on a Unix domain socket file called `hello`, with nothing on TCP 3000.
`DATABASE_PATH=data/nueron.db` starts a fully working application serving an
empty journal. Both were demonstrated against the real application; the output is
in the ADR.

## The decided design

### The governing rule

**Configuration is read and checked in exactly one place, once, at boot.** After
that module, no other file in the application may read `process.env`. This is the
same boundary discipline the project already applies to SQL, which lives only in
the repository, and to status codes, which live only in the controller.

A value that fails a check must stop the application from starting. The message
must name the variable and must quote the value, so that invisible characters are
visible. `received " 3000 "` is usable; `received  3000 ` is not.

### 1. The configuration module

Create a configuration module using `@nestjs/config`. It must:

- Load `.env` through Node's own support rather than through a package. The
  `start` and `start:dev` scripts in `apps/api/package.json` pass
  `--env-file-if-exists=.env` to Node. Use the *if-exists* form: `.env` is
  gitignored, so a fresh clone has none, and the strict form would fail on a
  clean clone. If `@nestjs/config`'s own file loading would double up on this,
  disable it (`ignoreEnvFile: true`) and say so in the report.
- Be registered globally (`isGlobal: true`) so that consumers inject
  `ConfigService` without importing the module in every feature module.
- Run a **hand-written** `validate` function at startup, supplied through
  `ConfigModule.forRoot({ validate })`. Every rule below lives in that function.
- Expose the checked values through `ConfigService`. Nothing outside this module
  reads `process.env`.

### 2. The rules for `PORT`

```
unset                                   -> 3000
a whole number from 1 to 65535          -> use it
anything else                           -> refuse to boot
```

"Anything else" explicitly includes the empty string, `0`, negative numbers,
values above 65535, non-numeric text such as `hello`, partly-numeric text such as
`3000abc`, and a valid number with surrounding whitespace such as `" 3000 "`.

**Whitespace is not trimmed.** This follows ADR-005's rule that this layer does
not quietly edit what somebody wrote.

Do not rely on Node's own port checking. It accepts `hello`, `-5` and `3000abc`
without complaint, and when it does reject a value its message never mentions
`PORT`.

### 3. The rules for `DATABASE_PATH`

```
not set, default file missing   -> create it silently. First run is normal.
not set, default file present   -> open it
set, file present               -> open it
set, file missing               -> WARN loudly, naming the path, then create it
set to ""                       -> refuse to boot, naming the variable
```

The warning fires **only** when the variable was explicitly set and the file it
names is missing. It must not fire when the default path is used, because
creating the default database on a fresh clone is normal, and a warning nobody
acts on trains people to ignore output. That principle is already recorded in
`docs/master-state.md`.

Path resolution is unchanged: an explicitly set path resolves from
`process.cwd()`, the default resolves from the module's own location. The
existing comment in `database.module.ts` explains why and should survive, moved
if necessary.

### 4. `.env.example` and `.gitignore`

Create `.env.example` at the repository root, committed, documenting **both**
variables with safe placeholder values and a short comment each explaining what
the variable does and what happens when it is absent. It must contain no real
secrets. This file is the answer to "what do I need to set?" for somebody who has
just cloned the repository.

Add `.env` to `.gitignore` if it is not already there. Verify it is actually
ignored rather than assuming.

### 5. Wiring `main.ts` and `database.module.ts`

`main.ts` takes the port from `ConfigService` rather than from `process.env`.
`database.module.ts` takes the path from `ConfigService` rather than from
`process.env`.

`database.module.ts` currently computes its path at module load time, outside the
factory. That will have to move, because a value coming from `ConfigService` is
not available until the injector exists. Use a factory provider that injects
`ConfigService`, which is the same pattern the `DATABASE` token already uses.

### 6. Tests

Follow the project's existing conventions: unit tests in `src/**`, end-to-end in
`test/`. Test claims must be sentences a broken implementation cannot satisfy —
this project has a documented case where a missing word `only` made a test pass on
a completely broken search.

Cover at minimum:

- Every row of the `PORT` table above, including each rejected value
  individually. The rejected cases are the point of the day.
- The error message for a rejected `PORT` names the variable and quotes the
  value. Assert on the quoting specifically, using `" 3000 "`, because that is
  the case the quoting exists for.
- `DATABASE_PATH` set to `""` refuses to boot.
- The warning fires when `DATABASE_PATH` is set and the file is missing, and does
  **not** fire when the variable is unset and the default file is missing.
- A real environment variable takes precedence over a value in a `.env` file.

The 55 existing unit tests and 18 end-to-end tests must still pass. The
end-to-end suite overrides the `DATABASE` provider and must continue to work
unchanged; if your wiring breaks it, that is a design problem in the wiring, not
a reason to edit the suite.

### 7. Documentation

Update the README so that the two variables, their defaults and their rules are
findable without reading source code. Keep it short and factual.

Do not update `docs/master-state.md` or any ADR. Those are the Master Thread's.

## Constraints

- **Exactly one new dependency**, `@nestjs/config`. Nothing else. `pnpm-lock.yaml`
  will be inspected.
- **No file outside the configuration module may read `process.env`.** This is
  checked with a grep, below.
- **No trimming, no coercion, no defaults for values that were set.** An absent
  variable gets a default. A present but invalid variable stops the application.
- Existing behaviour must not regress. All 55 unit tests and all 18 end-to-end
  tests must still pass, or a changed test must be justified in the report.
- Write in the project's existing comment style: full sentences explaining *why*,
  not restatements of *what*.

## Verification

Run all five and report actual output, not intent:

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
```

Then verify against the real application, because a passing suite is not the same
claim as a working server. **Report the actual terminal output for every case
below, including the exit code**, using `echo "exit: $?"`:

```bash
cd apps/api

# must start, and must serve on 3000
node dist/main.js

# must refuse to boot, naming PORT and quoting the value
PORT=hello   node dist/main.js
PORT=0       node dist/main.js
PORT=-5      node dist/main.js
PORT=99999   node dist/main.js
PORT=        node dist/main.js
PORT=" 3000 " node dist/main.js
PORT=3000abc node dist/main.js

# must start on 4242
PORT=4242 node dist/main.js

# must refuse to boot, naming DATABASE_PATH
DATABASE_PATH= node dist/main.js

# must WARN loudly and then start
DATABASE_PATH=/tmp/neuron-worker-typo.db node dist/main.js

# must NOT warn — unset variable, default path
node dist/main.js
```

Confirm specifically that **no `hello`, `-5` or `3000abc` file is created
anywhere** by the rejected runs. Those files are the original bug and their
absence is the fix.

Boundary check — must return nothing except the configuration module's own file:

```bash
grep -rn "process\.env" apps/api/src apps/api/test
```

`.env` ignore check — must report that the file is ignored:

```bash
touch .env && git check-ignore -v .env ; rm .env
```

Delete any throwaway database files when finished.

## Report

Write `docs/learning/day-06/report.md` covering: objective, implementation
summary, files changed, decisions made, assumptions, limitations, dependencies
added, testing performed with real pasted output, future improvements, and
lessons learned.

Two things the report must answer directly, because the Master Thread will check
them by breaking the code:

1. **Which of your tests fail if the quoting is removed from the error message?**
   If the answer is none, the quoting is untested and you should say so rather
   than claim coverage.
2. **Did `@nestjs/config` earn its place, honestly?** It was chosen partly as a
   deliberate learning goal, and the ADR records that it does no validating of
   its own. If in practice it added wiring without adding value, say that
   plainly. The Day 5 worker reported a weaker version of its own success and
   that was the right call.
