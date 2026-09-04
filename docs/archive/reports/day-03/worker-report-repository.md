# Worker Report — Day 3: Repository Extraction

**Date:** 2026-07-30
**Branch:** `day-03-data-access`
**Governing decision:** [ADR-004](../../decisions/ADR-004-repository-raw-sql.md)

---

## Objective

Move all SQL out of `EntriesService` into a new `EntriesRepository`, making it
the only class in the application that knows a database exists. Behaviour must
not change — including the two known-wrong error cases, which are Day 4
material and were deliberately preserved.

This was a refactor. The tests are what prove nothing moved except the code.

---

## Implementation Summary

`EntriesRepository` now owns everything that touches SQLite: the `EntryRow`
interface, the `toJournalEntry` mapper, all four `SELECT` queries, and the
`INSERT`. It takes the database through the existing `DATABASE` symbol token,
by the same mechanism and for the same reason `EntriesService` used to.

`EntriesService` keeps application logic and delegates storage. It no longer
imports `DatabaseSync`, `DATABASE`, or `node:sqlite` — all three imports are
gone, verified by the grep below. `id` and `createdAt` generation stayed in the
service, where ADR-004 decided it belongs.

The boundary rules from ADR-004 are written as a comment at the top of the
repository file, so that the next person adding a method reads them before
adding it rather than after.

---

## Files Changed

| File | Change |
| --- | --- |
| `apps/api/src/entries/entries.repository.ts` | **New.** All SQL, `EntryRow`, `toJournalEntry`, boundary rules. |
| `apps/api/src/entries/entries.service.ts` | Rewritten. Delegates to the repository; no database imports remain. |
| `apps/api/src/entries/entries.module.ts` | `EntriesRepository` added to `providers`, not exported. Stale comment corrected. |
| `apps/api/src/entries/entries.service.spec.ts` | Repository added to the testing module; seven new tests for the three untested query methods. |
| `apps/api/src/entries/entries.controller.spec.ts` | Repository added to the testing module. **Not listed in the task — see Decisions.** |

Not changed: `test/app.e2e-spec.ts`, `entries.controller.ts`, `entry.interface.ts`,
`database.module.ts`. The e2e suite passing untouched is the strongest evidence
that the HTTP contract is identical.

> `entries.controller.ts` appears in `git status` as modified. That is the repo
> owner's own uncommitted Day 3 work (the `?word=`, `/count`, and `/:id`
> endpoints), present before this task began. I did not edit it; `pnpm lint`
> runs with `--fix` and normalised whitespace in it, which is the only delta
> attributable to this session.

---

## Decisions Made

### The shape of the save method

`save(entry: JournalEntry): void`.

It takes a fully-formed entry and writes it. It generates nothing and returns
nothing. Three alternatives were considered and rejected:

- **`save(content: string): JournalEntry`** — would have forced `id` and
  `createdAt` generation into the repository, which ADR-004 explicitly rejected
  as incoherent: neither `crypto.randomUUID()` nor `new Date()` touches the
  database, so putting them behind the database boundary weakens the boundary
  and buys nothing.
- **Returning the entry back** — the caller already holds the object it passed
  in. Returning it would imply the repository might hand back something
  different (a database-assigned id, a database-generated timestamp), which is
  precisely the design ADR-004 turned down. `void` states honestly that the
  database contributed nothing to the value.
- **Naming it `create` or `insert`** — `create` reads as "bring into existence",
  which is now the service's job, and the service method is already called
  `create`; two `create`s at different layers meaning different things is
  avoidable confusion. `insert` names the SQL statement rather than the
  intention, and the point of the boundary is that callers do not think in SQL.
  `save` says what happens to an object that already exists.

### The two throws that had to move but not change

Both moved into the repository verbatim, and both are still plain `Error`s
producing 500s where 404 and 200-with-empty-array belong.

Leaving them identical was required, but it is worth recording *why* fixing
them here would have been wrong beyond "it is out of scope": the repository is
forbidden from knowing about HTTP, so it could not have thrown `NotFoundException`
even if Day 4 were today. The correct fix is not "move the throw and upgrade
it" — it is a decision about who translates a storage outcome into a status
code, and that decision has not been made yet. I added a comment at each throw
recording that it is knowingly wrong and that even the fixed version cannot
name a status code from inside this file.

I also pinned both behaviours with tests (`should throw when the id does not
exist`, `should throw when nothing matches`). These assert today's wrong
behaviour on purpose. When Day 4 corrects it, those two tests fail, which
forces the change to be deliberate rather than silent. The comments say so, so
nobody reads them as endorsement.

### Module wiring that was not obvious

Two things:

**`EntriesRepository` is a provider but not an export.** Nest cannot construct
`EntriesService` without it — and that failure appears at application boot, not
at compile time, because DI is resolved when the container starts. `pnpm build`
and `pnpm typecheck` would both have passed with the provider missing. Not
exporting it is what stops anything outside `EntriesModule` from reaching past
the service to the database.

**`EntriesService` takes no `@Inject` token.** `EntriesRepository` is a class,
so the class *is* the lookup key. `DATABASE` needs an explicit token only
because it is a symbol pointing at a `DatabaseSync` instance, and the type
`DatabaseSync` says nothing about which instance is wanted. This asymmetry is
now visible in one file — the repository has `@Inject`, the service does not —
which makes the rule easier to infer than reading it in documentation.

### Editing a spec the task did not mention

`entries.controller.spec.ts` was not in the task list, but it builds a testing
module containing `EntriesService`, so it broke for exactly the same reason
`entries.service.spec.ts` did — Nest could not construct a service whose
dependency was not provided. Leaving it would have meant `pnpm test` failing,
which contradicts the verification requirement.

I applied the same minimal fix: added `EntriesRepository` to the providers
list, changed nothing else, rewrote no tests. I extended one existing comment
to note the chain is now three links long, since that comment already existed
to explain the wiring and would otherwise have described a shape that no longer
exists.

---

## Assumptions

- **"Preserve every existing test" means the assertions, not the formatting.**
  `pnpm lint` runs with `--fix` and reformatted my new seed block. No existing
  assertion or teaching comment was altered.
- **`countEntries` needed a zero case.** The task asked only for "returns the
  number of entries". I added a fresh-database test alongside it, because a
  count method that returned a constant `3` would pass the requested test
  alone.
- **A `seed()` helper inside `describe('findByContent')` is acceptable.** The
  three ordering/filtering tests need identical fixed-timestamp rows. The
  helper is local to that block and does not touch the existing tests.
- **Rewording one comment to satisfy the boundary grep was in scope.** The word
  `INSERT` appeared in an explanatory sentence in `entries.service.ts`, making
  the grep return a line despite no SQL being present. I changed the prose to
  "before the row is written". A verification command that requires a human to
  decide which matches are harmless is a weaker check than one that returns
  nothing, and the sentence means the same thing.

---

## Limitations

**The casts survive this refactor.** This is the honest headline. ADR-004
accepts it knowingly, and it should not be read as fixed just because the code
moved.

All three casts still exist, now concentrated in `entries.repository.ts`:

```ts
.get(id) as EntryRow | undefined
.all(...) as unknown as EntryRow[]
.get() as { count: number }
```

What is still unverified: **that the columns a `SELECT` returns actually match
the shape the cast claims.** A cast is an assertion the compiler is instructed
not to check.

What would break silently, with a concrete example: rename `created_at` to
`written_at` in `database.module.ts` and update three of the four `SELECT`
statements. The fourth still selects a column that no longer exists — but the
cast keeps insisting the rows are `EntryRow`, so `toJournalEntry` reads
`row.created_at`, gets `undefined`, and the API serves `"createdAt": null`.
`pnpm lint`, `pnpm typecheck` and `pnpm build` all pass. Only a test that
asserts on the value catches it.

This is the same *class* of failure as the `ORDER BY` bug that motivated the
day: a rule the type system cannot see, so four automated checks agree the code
is fine. The extraction fixed the duplication problem. It did not fix this one,
and per ADR-004 it was not supposed to.

Secondary limitations, all pre-existing and unchanged:

- Two endpoints return 500 where 404 and 200 belong (Day 4, deliberate).
- No input validation — `POST {}` still fails at the database (Day 4).
- Millisecond ties in `ORDER BY created_at DESC` remain non-deterministic.
- Nothing but `EntriesService.create()` enforces the `id`/`createdAt` format.
  Tolerable only while there is exactly one write path; ADR-004 says revisit
  when a second appears.

---

## Dependencies Changed

**None.** No package was added, removed, or upgraded. `pnpm install` reported
"Already up to date". No ORM, no query builder, no migration tooling — ADR-004
rejected all three on timing, and nothing in this task justified reopening it.

---

## Testing Performed

All commands run from the repository root. Real output.

```
$ pnpm install
Scope: all 2 workspace projects
Already up to date
Done in 351ms using pnpm v11.17.0

$ pnpm lint
$ pnpm --filter @neuron/api lint
$ eslint "{src,apps,libs,test}/**/*.ts" --fix

$ pnpm typecheck
$ pnpm --filter @neuron/api typecheck
$ tsc --noEmit -p tsconfig.json

$ pnpm build
$ pnpm --filter @neuron/api build
$ nest build

$ pnpm test
Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        1.257 s

$ pnpm test:e2e
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.814 s
```

18 unit tests, up from 11. The e2e suite passed **without modification**, which
is the claim that behaviour did not change.

### Behaviour against a fresh database

```
$ rm -f apps/api/data/neuron.db
$ pnpm build && node apps/api/dist/main.js &

$ curl -s -X POST http://localhost:3000/entries -H "Content-Type: application/json" -d '{"content":"felt overwhelmed at work today"}'
{"id":"dd430171-b2f7-4feb-9d20-3e58b797f154","content":"felt overwhelmed at work today","createdAt":"2026-07-30T18:01:04.451Z"}

$ curl -s -X POST http://localhost:3000/entries -H "Content-Type: application/json" -d '{"content":"quiet evening at home"}'
{"id":"87609339-43b2-4264-82d2-41fae5df0355","content":"quiet evening at home","createdAt":"2026-07-30T18:01:04.479Z"}

$ curl -s -X POST http://localhost:3000/entries -H "Content-Type: application/json" -d '{"content":"back at work again"}'
{"id":"79665118-949e-4d99-9406-6d16313e3e7b","content":"back at work again","createdAt":"2026-07-30T18:01:04.499Z"}
```

```
$ curl -s -w '\nstatus %{http_code}\n' http://localhost:3000/entries
[{"id":"79665118-949e-4d99-9406-6d16313e3e7b","content":"back at work again","createdAt":"2026-07-30T18:01:04.499Z"},
 {"id":"87609339-43b2-4264-82d2-41fae5df0355","content":"quiet evening at home","createdAt":"2026-07-30T18:01:04.479Z"},
 {"id":"dd430171-b2f7-4feb-9d20-3e58b797f154","content":"felt overwhelmed at work today","createdAt":"2026-07-30T18:01:04.451Z"}]
status 200

$ curl -s -w '\nstatus %{http_code}\n' "http://localhost:3000/entries?word=work"
[{"id":"79665118-949e-4d99-9406-6d16313e3e7b","content":"back at work again","createdAt":"2026-07-30T18:01:04.499Z"},
 {"id":"dd430171-b2f7-4feb-9d20-3e58b797f154","content":"felt overwhelmed at work today","createdAt":"2026-07-30T18:01:04.451Z"}]
status 200

$ curl -s -w '\nstatus %{http_code}\n' "http://localhost:3000/entries?word=zzz"
{"statusCode":500,"message":"Internal server error"}
status 500

$ curl -s -w '\nstatus %{http_code}\n' http://localhost:3000/entries/count
3
status 200

$ curl -s -w '\nstatus %{http_code}\n' http://localhost:3000/entries/does-not-exist
{"statusCode":500,"message":"Internal server error"}
status 500
```

(Line breaks added inside the two JSON arrays for readability; the responses
were single lines.)

Every expectation met:

- `/entries` → 200, three entries, newest first ✓
- `/entries?word=work` → 200, both "work" entries, **newest first** ✓ — the
  regression check for the bug that motivated the whole day
- `/entries?word=zzz` → 500 ✓ (wrong, deliberately preserved)
- `/entries/count` → 200, `3` ✓
- `/entries/does-not-exist` → 500 ✓ (wrong, deliberately preserved)

The server was stopped and the database file created by this run was deleted
afterwards, so nothing was left on disk.

### Boundary check

```
$ grep -n "node:sqlite\|DatabaseSync\|DATABASE\|SELECT\|INSERT\|prepare(" \
    apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.controller.ts
$ echo $?
1
```

No output, exit status 1 — no matches. No database knowledge remains in the
service or the controller.

---

## Future Improvements

- **Day 4 — the two wrong error cases.** `findById` should produce 404,
  `findByContent` should produce 200 with an empty array. The open design
  question is *where* the translation happens, since the repository is not
  allowed to name a status code. Two tests currently pin the wrong behaviour
  and will fail when this is done, which is intentional.
- **The casts.** ADR-004 says reopen the query-builder decision if a cast ever
  causes a bug the way the copied `ORDER BY` did. A cheaper interim step, if
  that day comes before Day 24: a hand-written runtime check on one row shape,
  which costs no dependency but does add code the ADR would need to justify.
- **Day 13 (mood) and Day 24 (Postgres)** are the revisit points ADR-004 names
  for query builders and ORMs. The repository now gives either one a single
  file to live in.
- **A second write path** (bulk import, seeding script, background job) is the
  trigger ADR-004 names for reconsidering a value object around `id` and
  `createdAt`. Not before.

---

## Lessons Learned

**The bug was not caused by carelessness; it was caused by the rule having
nowhere to live.** "Entries are returned newest first" existed only as five
words inside one string. Copying the string without them was an easy, ordinary
mistake, and no check could catch it because no check knew the rule existed.
The repository does not prevent that mistake by being a better place to write
SQL — it prevents it by making there be *one* place where the rule can be
written, so divergence requires editing one file inconsistently rather than
forgetting to edit a second one.

**A test that asserts wrong behaviour is a real tool, not a contradiction.**
The two `toThrow()` tests pin behaviour everyone agrees is incorrect. Their
value is that Day 4 cannot change it by accident — the tests fail, and someone
has to decide. Untested wrong behaviour changes silently; tested wrong
behaviour changes deliberately.

**DI failures happen at boot, not at compile time.** Forgetting
`EntriesRepository` in `providers` would have passed `typecheck` and `build`
and failed only when the application started. That is a different failure class
from a type error and worth recognising on sight, because the compiler's
silence is not evidence the wiring is correct.

**Where code lives is an argument about what it knows.** The most interesting
part of ADR-004 was not "extract a repository" but the rejection of putting
`crypto.randomUUID()` in the repository. It would have worked identically. It
was wrong because the repository's justification for existing is "the only
thing that knows about the database", and a UUID has nothing to do with a
database — so moving it there would have blurred the one line the file exists
to draw. A boundary only holds if the reason for it is applied even when
breaking it would still run.

---

## Disagreements With the Task Specification

None on substance. Everything was implemented as specified.

Two deviations, both recorded above rather than made silently:

1. **Edited `entries.controller.spec.ts`**, which the task did not list. It
   broke for the identical DI reason and `pnpm test` could not pass otherwise.
   The fix was the same minimal one prescribed for the other spec.
2. **Reworded one comment in `entries.service.ts`** so the boundary grep
   returns genuinely nothing rather than one prose false positive. The
   alternative was a verification step whose expected output is "one line you
   are supposed to ignore".
