# Worker Prompt — Day 5: Strict Input, `PATCH`, and `DELETE`

## Context

You are implementing one isolated task on the Neuron project. Read
`docs/constitution.md` and `docs/decisions/ADR-006-strict-input-and-mutation-semantics.md`
before you start. The rules that matter most here: the simplest correct
solution wins, and no complexity is added unless it solves a problem that
exists today.

Do **not** touch git. No branching, no committing, no merging. Those are human
actions on this project.

This work has already been designed in full by the Master Thread with the
project owner. **You are implementing a decided design, not choosing one.**
Where this prompt states a decision, follow it. If you believe a decision is
wrong, implement it as written and record your objection in the report.

Do **not** add a dependency. `zod` and `class-validator` were both reconsidered
on Day 5 and deliberately deferred — see ADR-006. If you find yourself wanting
one, that is a finding for the report, not a licence.

## The problem

The API has 39 passing tests and all five checks green. Three real defects live
inside that green codebase, and no existing test can see any of them.

| Request | Now | Must become |
|---|---|---|
| `POST /entries` `{"content":"x","id":"mine"}` | `201`, `id` silently dropped | **400** |
| `GET /entries?word=%` | every entry in the journal | only entries containing a literal `%` |
| `GET /entries?word=a&word=b` | `200 []` | **400** |

Plus two endpoints that do not exist yet: `PATCH /entries/:id` and
`DELETE /entries/:id`.

## The decided design

### The layering rule (unchanged, governs everything below)

From ADR-004 and ADR-005, and not renegotiable here:

- The **repository** may not know HTTP exists. Storage vocabulary only.
- The **service** may not throw HTTP exceptions. It must stay callable from a
  background job with no web server running.
- The **controller** translates. Status codes live here and nowhere else.

### 1. Reject unknown fields on `POST` and `PATCH`

A body containing any key other than `content` is a `400`. The error message
must name the offending field or fields — `contnet` is unrecognised, not merely
"invalid body". The whole point of this decision is that a user who typos a
field name finds out which one.

### 2. Escape `%` and `_` in search terms

`findByContent` must treat the search term as literal text.

Use SQLite's `ESCAPE` clause. **Escape the escape character first**, before `%`
and `_` — doing it in the wrong order corrupts any term containing the escape
character. Get this wrong and the bug is invisible until someone searches for a
backslash.

This lives in `EntriesRepository`, because it is a fact about how `LIKE` reads a
pattern, which is database vocabulary.

### 3. Repeated query parameter is a 400

`@Query('word')` is typed `string` but Express supplies an **array** when a
parameter repeats. The declared type is a lie the compiler cannot see.

Fix it the way ADR-005 fixed `@Body`: stop lying about the type. Accept the
honest type, check it, and reject a non-string with a `400`. Do not silently
take the first element — that guesses at intent.

### 4. `PATCH /entries/:id`

| Situation | Response |
|---|---|
| Valid `content`, id exists | `200` with the updated entry |
| Id does not exist | `404` |
| Body has no updatable field | `400` |
| `content` present but invalid | `400` — same three rules as `POST` |
| Body contains an unrecognised field | `400` |

`createdAt` must **not** change on update. Do not add `updatedAt`.

Content validation rules are identical to `POST`: must be a string, must contain
at least one non-whitespace character, stored **verbatim** without trimming.

### 5. `DELETE /entries/:id`

`200` with the deleted entry as the body. `404` when the id does not exist.

Note the ordering constraint: you must read the entry before deleting it, and
you must not report success for a row that was never there.

### 6. Remove the duplication

`POST` and `PATCH` now share content-validation rules. Extract the shared check
into one function rather than writing it twice. This is the alternative to
adopting a validation library and the reason ADR-006 could defer one — if the
duplication survives, that reasoning was wrong.

`PATCH`'s rules differ from `POST`'s in exactly one way: `content` is optional.
Do not let that difference force two full copies of the same three checks.

### 7. Tests

Do not write an exhaustive suite. Write the claims that state the decisions
above, so that a future change to any of them fails loudly.

**Required claims** — the wording matters, these are behavioural claims and must
not mention SQL, `LIKE`, or implementation detail:

- `should return only entries containing a literal percent sign`
- `should return only entries containing a literal underscore`
- searching a term containing the escape character behaves literally too
- `POST` and `PATCH` each reject an unrecognised field with a 400
- a repeated `word` parameter is a 400
- `PATCH` updates content and leaves `createdAt` unchanged
- `PATCH` on an unknown id is a 404
- `PATCH` with an empty body is a 400
- `DELETE` returns the deleted entry, and it is gone afterwards
- `DELETE` on an unknown id is a 404

Status-code claims belong in `test/app.e2e-spec.ts`, because an exception class
only becomes a number once Nest's exception layer has run. Behavioural claims
about search and storage belong in the service or repository spec.

**One claim needs care.** A test asserting "returns only entries containing `%`"
must fail when the search returns *too many* entries, not merely when it returns
none. Seed the database so that a broken implementation returning everything is
visibly different from a correct one. The word *only* is doing real work.

### 8. Documentation

Update `docs/master-state.md`:

- the endpoint list under **Current State**
- **Known Debt** — the four Day 5 gap rows are resolved by this work, except the
  ones explicitly left open
- the architecture tree if any file is added

Do not edit `docs/roadmap.md` or any ADR. Those are the Master Thread's.

## Constraints

- **No new dependency.** `apps/api/package.json` and `pnpm-lock.yaml` must be
  unmodified. This is checked.
- **No HTTP vocabulary below the controller.** The service and repository may
  not import or throw `HttpException`, `NotFoundException` or
  `BadRequestException`.
- **`EntryRow` must not escape `entries.repository.ts`.**
- **Content is stored verbatim.** Whitespace decides validity; it never edits
  the value.
- Existing behaviour must not regress. All 39 current tests must still pass, or
  a changed one must be justified in the report.

## Verification

Run all five and report actual output, not intent:

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
```

Then verify over real HTTP against a throwaway database — a passing test suite
is not the same claim as a working server:

```bash
cd apps/api
PORT=3999 DATABASE_PATH=/tmp/neuron-worker-check.db node dist/main.js &
```

Exercise and paste the real responses for: a `POST` with an extra field; a
search for `%`; a search for `_`; a repeated `word` parameter; a `PATCH` that
succeeds; a `PATCH` with a misspelled field name; a `PATCH` on an unknown id; a
`DELETE` that succeeds followed by a `GET` of the same id; a `DELETE` on an
unknown id. Confirm `createdAt` is unchanged across the successful `PATCH`.

Boundary checks — both must return nothing:

```bash
grep -n "node:sqlite\|DatabaseSync\|DATABASE\|SELECT\|INSERT\|UPDATE\|DELETE\|prepare(" \
  apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.controller.ts

grep -nE "HttpException|NotFoundException|BadRequestException" \
  apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.repository.ts \
  | grep -v "^\S*:[0-9]*: *[/*]"
```

Stop the server and delete the throwaway database when finished.

## Report

Write `docs/learning/day-05/report.md` covering: objective, implementation
summary, files changed, decisions made, assumptions, limitations, dependencies
added (must be none), testing performed with real output, future improvements,
and lessons learned.

Two things the report must address specifically:

1. **How you escaped the `LIKE` pattern**, and how you ordered the
   replacements. State what would break if the order were reversed.
2. **Whether extracting the shared validation actually removed the
   duplication**, or whether `POST` and `PATCH` still restate the same rules. If
   they do, say so plainly — ADR-006 deferred a validation library on the
   strength of that extraction working, and a Master Thread that is told
   otherwise will reopen the decision.
