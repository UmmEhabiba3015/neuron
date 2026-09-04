# Worker Prompt — Day 8a: Move to TypeORM, Change Nothing Else

## Context

Read `docs/constitution.md` and `docs/decisions/ADR-010-typeorm.md` before you
start. ADR-003, ADR-004, ADR-005, ADR-006 and ADR-007 give the constraints this
must not break.

Do **not** touch git. No branching, no committing, no merging.

This is a decided design, not a proposal. If you believe a decision is wrong,
implement it as written and record the objection in the report. Three workers on
this project have corrected the record they were handed and all three improved an
ADR. Disagreement is wanted.

## The one rule that governs this whole task

**Nothing observable may change.** Not a status code, not a message, not a
response body, not an endpoint. This is a driver swap wearing the costume of a
refactor, and its correctness criterion is that **all 96 unit tests and all 32
end-to-end tests still pass.**

Where a test must change, it is because its *setup* referenced `node:sqlite` or
the `DATABASE` token — never because its *claim* moved. Any claim that changes is
a defect, and you must say so in the report rather than adjust the test.

**This task adds no schema change.** No `users` table, no `user_id`. That is task
8b, deliberately separate, so that a failure here can only have one cause.

## What to do

### 1. Dependencies

Add exactly three: `typeorm`, `@nestjs/typeorm`, `better-sqlite3`. Remove all use
of `node:sqlite`. Report the full transitive cost from the lockfile, honestly, the
way the Day 6 and Day 7 reports did.

### 2. The entity

`entry.interface.ts` becomes a TypeORM entity. Column names stay `snake_case` in
the database and `camelCase` in TypeScript — that mapping is explicit today and
must remain explicit, not be resolved by renaming one side.

The table must come out **byte-for-byte compatible** with what exists:

```sql
id         TEXT PRIMARY KEY
content    TEXT NOT NULL
created_at TEXT NOT NULL
```

`created_at` is a **TEXT** column holding an ISO string, not a date type. Do not
let TypeORM "improve" this. An existing development database must keep working.

### 3. `synchronize` must be `false`

ADR-010 names this explicitly. `synchronize: true` is TypeORM's schema-on-boot
mode and it is the same mistake this whole day exists to remove. Schema changes
happen through migrations and nowhere else.

Set up TypeORM's migration infrastructure and generate the **initial** migration
representing the current schema, so that a fresh database is built by a migration
rather than by luck. Add the scripts a person needs: run, revert, generate.

### 4. Configuration

`DATABASE_PATH` still comes from `ConfigService` and is still checked at boot by
`validate` (ADR-007). TypeORM must be configured through `TypeOrmModule.forRootAsync`
with `ConfigService` injected — **not** by reading `process.env`. The boundary grep
below must stay silent.

The missing-file warning from ADR-007 must still fire, and only when
`DATABASE_PATH` was explicitly set. Do not lose it.

### 5. The repository boundary

`EntriesRepository` remains the only class that knows how storage works. TypeORM's
own `Repository<Entry>` is an implementation detail **inside** it. No TypeORM type
may appear in `entries.service.ts` or `entries.controller.ts`.

The service and repository still may not throw HTTP exceptions (ADR-005).

### 6. Search — read this twice

ADR-006 decided that `%` and `_` are ordinary characters, so `?word=100%` finds
entries containing a percent sign and `?word=%` does **not** return the journal.

The hand-written `escapeLikePattern` will not survive as code. **The behaviour
must.** Whatever you use — TypeORM's `Like()`, a raw fragment, a query builder —
the escaping is still your responsibility, and TypeORM does **not** do it for you.

The claim to preserve is: *searching for a character finds entries containing that
character.* Existing tests pin it. If they pass by accident rather than because you
escaped, the audit will find it.

`ORDER BY created_at DESC` — newest first — must also survive. It has been broken
by a copy-paste once before on Day 3.

### 7. The end-to-end suite

All 32 tests swap the database with `.overrideProvider(DATABASE).useValue(db)` and
the `DATABASE` symbol is going away. Rebuild that mechanism so the suite still
runs against a throwaway database and **never touches `apps/api/data/neuron.db`**.

`config-wiring.e2e-spec.ts` builds the real `AppModule` with no overrides at all.
Keep it working, including its claim that a valid configuration builds
successfully — that test is the only thing that catches broken wiring.

## Constraints

- Exactly three new dependencies.
- `synchronize` is `false`. Verified by grep in the audit.
- No `process.env` outside `src/config`.
- No TypeORM type outside `entries.repository.ts`.
- No HTTP exception in the service or repository.
- Content stored verbatim. Whitespace decides validity, never edits.

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
```

Report real output and counts. **96 unit and 32 end-to-end, or an explanation per
deviation.**

Then against the real application on a free port, with a throwaway database,
pasting real responses for every line:

```
POST  {"content":"ok"}              -> 201
POST  {}                            -> 400  content must be a string
POST  {"content":"   "}             -> 400  ...at least one character that is not whitespace
POST  {"content":"x","id":"mine"}   -> 400  property id should not exist
PATCH {}                            -> 400
PATCH {"content":null}              -> 400  content must be a string   (NOT 500)
GET   /entries?word=a&word=b        -> 400
GET   /entries?werd=x               -> 400
GET   /entries?word=                -> 200 []
GET   /entries                      -> 200, newest first
GET   /entries?word=100%25          -> 200, only the entry containing "100%"
GET   /entries?word=%25             -> 200, only entries containing a literal "%"
DELETE twice                        -> 200 then 404
```

The last two `word` lines are the ADR-006 claim. A run where `?word=%25` returns
the whole journal has failed, whatever the test suite says.

**Then prove an existing database still opens.** Copy `apps/api/data/neuron.db` to
a temporary location, point `DATABASE_PATH` at the copy, start the application,
and show that the existing entries are readable and a new one can be written.
A driver swap that cannot read yesterday's file has not worked.

Boundary checks, all must be silent:

```bash
grep -rn "process\.env" apps/api/src --include=*.ts | grep -v "src/config"
grep -rn "node:sqlite\|DatabaseSync" apps/api/src apps/api/test
grep -rn "synchronize" apps/api/src | grep -v "false"
grep -n "Repository\|typeorm" apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.controller.ts
grep -nE "HttpException|NotFoundException|BadRequestException" \
  apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.repository.ts \
  | grep -v "^\S*:[0-9]*: *[/*]"
```

### Acceptance criterion

**Mutation.** Remove the escaping from the search implementation. `?word=%25` must
start returning every entry and a test must go red. If nothing fails, the ADR-006
claim is untested and you must fix that before reporting.

Leave no server running and delete throwaway databases.

## Report

`docs/learning/day-08/report.md`. Objective, implementation summary, files
changed, decisions, assumptions, limitations, dependencies with the full
transitive cost, testing with pasted output, future improvements, lessons.

Answer directly:

1. **How did you escape `%` and `_`, and how do you know it works?** Name the test
   that fails without it.
2. **What did the end-to-end setup become**, now that `overrideProvider(DATABASE)`
   is gone, and is it still impossible for the suite to touch the real
   development database?
3. **Did anything observable change that you had to adjust a test for?** Each one
   is a defect until argued otherwise.
4. **What did TypeORM cost, honestly?** Line count, dependency weight, and whether
   the repository boundary survived intact or leaked.
