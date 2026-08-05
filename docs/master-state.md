# Master State

**Purpose:** This file exists so that losing the Master Thread costs minutes,
not hours. It happened once — an OS reinstall took the thread with it — and
the recovery cost most of a working session.

**To re-establish a Master Thread from scratch, provide, in this order:**

1. [docs/master-prompt.md](master-prompt.md) — the role definition
2. [docs/constitution.md](constitution.md) — how decisions get made
3. [docs/roadmap.md](roadmap.md) — what happens when
4. **This file** — where we actually are

**Update cadence:** end of every day, before the LinkedIn post. Treat a stale
`master-state.md` the same as a failing test.

---

**Last updated:** 2026-08-05, after the Day 5 worker ran and was audited.
**Current day:** **Day 5 code-complete and audited. Not committed.**
**Current branch:** `day-05-testing`, branched from `main` at `ed1bab3`.
**No commits on it at all.** Everything from Day 5 is uncommitted in the working
tree.

**Verified green by the Master Thread independently, not taken from the worker's
report:** `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm build` ✅ ·
`pnpm test` ✅ **55** (was 29) · `pnpm test:e2e` ✅ **18** (was 10).
`apps/api/package.json` and `pnpm-lock.yaml` unmodified — **no dependency
added.** Both boundary greps clean; `EntryRow` still confined.

---

## Next Session Starts Here

**Day 5 is done except for git and the LinkedIn post.**

Two things remain, both hers:

1. **Commit and open the PR.** Nothing is committed. One branch, one PR,
   squash-merged, per the standing workflow. Worker agents and the Master Thread
   do not touch git on this project.
2. **The LinkedIn post.** A draft exists in the thread but is **out of date** —
   it was written mid-session when the day had two findings and no code. It
   needs rewriting now that the day produced four decisions, an ADR, two new
   endpoints and 24 new tests.

**The audit found no defects and required no rework.** Full detail in
`docs/learning/day-05/report.md`, which contains the worker's report followed by
the Master Thread's independent verification.

### What Day 5 decided

| # | Decision | Source |
|---|---|---|
| 1 | `POST` **and** `PATCH` reject unknown fields with a 400 | Hers. Derived from the `PATCH {"contnet": …}` silent-success case |
| 2 | A repeated query parameter (`?word=a&word=b`) is a 400, not `200 []` | Hers, via the 4xx test |
| 3 | `%` and `_` in a search term are escaped and treated literally | Hers — chose escaping over rejecting or declaring it a feature |
| 4 | `DELETE` returns `200` with the deleted entry; `404` when absent | Hers |
| 5 | Validation stays hand-written; shared check extracted instead | Master Thread's recommendation, accepted by her without objection — **worth re-confirming**, as it was late and she did not argue it |

All five are recorded in
[ADR-006](decisions/ADR-006-strict-input-and-mutation-semantics.md).

⚠️ **ADR-005's named revisit condition fired on schedule** and was answered
rather than skipped. It said Day 5's `PATCH` would be the first real test of
hand-written validation. It was reconsidered, `zod` was deferred again, and
ADR-006 replaces ADR-005's vague trigger with four specific ones. The most
likely to fire is **Day 12**, when the frontend may duplicate validation rules.

### The audit — what was checked and what it found

All three of the flagged risks were verified **by breaking the code**, not by
reading the worker's report:

1. **Escape ordering.** Three mutations introduced by the Master Thread. Removing
   escaping entirely fails 3 tests; reversing the order fails 3 *different* ones
   (percent, underscore and `100%`, while backslash still passes); omitting only
   the backslash pass fails exactly 1. **The suite distinguishes the two ways of
   getting this wrong**, which is stronger than the prompt asked for.
2. **The `only` claims fail on too many, not on none.** Confirmed by reading the
   failure output: the wanted entry is still present and the test goes red
   purely because three others came with it. The word `only` — the one word she
   was missing when she wrote the claim — is doing exactly the work it was added
   for.
3. **The shared-validation extraction.** Real, but **the worker reported a
   weaker version of its own success and was right to.** See below.

**No defects. No rework.**

### ⚠️ ADR-006 was amended the same day

The worker found that `parseCreateEntryDto` and `parseUpdateEntryDto` came out
**structurally identical**, differing only in their error message — because
there is exactly one updatable field, so *"at least one field present"* and
*"`content` present"* are the same sentence.

ADR-006 had justified deferring `zod` partly on "extraction removed the
duplication." The truthful version is that **one optional field is not a
schema** — the duplication never had room to form. Deferral still stands, but on
"there is no complexity yet," not on "the hand-written approach absorbed it."

The amendment is recorded in ADR-006 rather than quietly fixed, and the likeliest
trigger moved **from Day 12 to Day 13**, when mood adds a second updatable field
and the two validators genuinely diverge.

**This is the behaviour to want from a worker.** It could have reported "duplication
removed, as designed" and nobody would have checked.

**Day 5 — the roadmap problem is:** *"I changed something and don't know what I
broke."* Afterwards she should be able to explain unit vs integration vs e2e and
judge what a test suite fails to cover.

⚠️ **Note:** the roadmap's own Day 5 row says she should have "**written** tests,
not just read them." **That is superseded** — see the direction from her husband
below. Do not open Day 5 by asking her to write a suite.

**Shape she chose for Day 5:** judgement work first, then `PATCH`/`DELETE`.
Reason: it puts the hardest learning in the freshest hours. Both halves are now
done.

### What Day 5 produced

**Three coverage gaps found by her, all real, all invisible to a fully green
39-test suite. All three now fixed and tested.**

| # | Gap | Outcome |
|---|---|---|
| 1 | `POST /entries` silently ignores unknown fields. `{"content":"x","id":"mine"}` → 201, `"mine"` discarded | **Fixed.** `POST` and `PATCH` both 400 and name the offending field |
| 2 | `%` and `_` are `LIKE` wildcards. `?word=%` returns **every entry**; `100%` cannot be searched for | **Fixed.** Escaped and treated literally |
| 3 | `?word=a&word=b` — Express supplies an *array* to a parameter typed `string`, producing `%a,b%` and a misleading `200 []` | **Fixed.** 400, and `@Query('word')` retyped to `unknown` |

**Gap 2's decision (hers, and I agreed):** treat `%` and `_` as ordinary
characters — escape them before they reach `LIKE`. Options rejected: reject such
input with a 400 (a user wanting `100%` gets an error they cannot act on), and
declare wildcards a feature (a search box that returns the whole journal for one
keystroke).

**The Rule Zero objection was raised and answered on the record**, because it is
a fair one: this `LIKE` query is condemned on Day 15 (full-text) and again on
Day 16 (embeddings), so why fix it? The answer that settled it: the durable
artifact is not the fix, it is the claim — *"searching for a character finds
entries containing that character."* That sentence never mentions SQL, `LIKE`,
or `%`, so it survives all three generations of the implementation. Same shape
as "newest first", which survived the Day 3 repository extraction because it
never mentioned where the SQL lived.

**The claim she wrote, sharpened by one word:**

```ts
it('should return only entries containing a literal percent sign', () => {
```

She produced everything except `only`. The word is load-bearing: without it, a
completely broken search that returns all four seed entries still satisfies the
sentence, because one of those four does contain a `%`. This is the same
failure mode her own suite already documents at
`entries.controller.spec.ts:82-84` — a claim a broken implementation can satisfy
is a green checkmark, not a check.

### The idea worth carrying forward from tonight

**A missing test is usually a missing decision.**

She could not write the claim for gap 2 when first asked, and said so. That was
not a gap in testing skill — the behaviour had never been decided, so there was
nothing to write down. Once she chose Option A, the claim came immediately. This
reframing is what unstuck the block and it is worth reusing.

### Gaps still unspent — material for a later session

Found by the Master Thread on Day 5 and **deliberately never shown to her.** Do
not hand these over; they are practice for the skill she was building.

- **Empty search value.** `?word=` is falsy, so it falls through to `findAll()`
  and returns everything rather than searching. **Still true after Day 5** — the
  worker left it alone on purpose, because nobody has decided what an empty
  search term means and implementing an unchosen behaviour is the exact failure
  ADR-006 describes.
- **No maximum content length.** A multi-megabyte entry is accepted.
- **Search case sensitivity is untested in either direction**, so nobody knows
  whether the current behaviour is intended.

`docs/learning/day-02/testing-literacy.md` experiments 3 and 4 remain unrun and
are still worth doing — they cover brittle assertions and test isolation.
**Experiments 2 and 5 are now redundant** and should be skipped: 2 is the
route-rename experiment and 5 is the four-commands question, both of which she
answered correctly on Day 4 evening.

### A teaching finding from tonight — this one is actionable

**The opening question failed, and the failure mode is worth not repeating.**

Day 5 opened by asking her to *invent* a bug: "imagine a careless engineer makes
one change that breaks the API while all 39 tests stay green — what change?"
Her entire reply was *"i do not understand."*

That question asked her to **generate** an example, from nothing, before she had
opened a single test file. Generation is far harder than recognition, and there
was no worked example to pattern-match against.

**What fixed it immediately:** doing one worked example first — here is a change
(`ORDER BY ... DESC` → `ASC`), here is the exact test that catches it, therefore
this rule is covered — and then handing her a second case and asking only
*"is there a test for this?"* She answered that correctly straight away, and
every question after it.

**The rule:** when introducing a new *kind* of thinking, work one example
yourself before asking her to produce one. This is not the same as skipping
Socratic questioning — the questions that followed were all open, and she
answered them. It is about giving the task a recognisable shape first.

### Where she answered, per topic — the tracking the plan asks for

| Question | Step reached |
|---|---|
| Invent a bug the suite would miss | **Did not parse.** Replaced with a worked example rather than narrowed |
| Is there a test for unknown fields? | **Step 1**, immediately after one worked example |
| Extra `id` — rejected, stored, or ignored? | **Step 1.** Correct, with the right reason |
| What does `?word=%` return? | **Step 1.** Immediate |
| Which spec file does the new test belong in? | **Step 1.** Correct — service spec |
| What should the claim assert? | **Stuck at step 1**, legitimately — the decision did not exist yet. One narrowing question (*"what should it return?"*) resolved it |
| Which option for wildcard handling? | **Step 1.** Chose A, with a reason |
| The claim sentence | **Step 1**, missing only the word `only` |

Six of eight at step 1. The two that were not are both explained by something
other than difficulty: one was a badly-shaped question, the other was blocked on
an unmade decision.

### ⚠️ Direction set by her husband on Day 4 — do not relitigate this

**She is not required to write test suites by hand.** His position, stated
directly: AI writes tests in practice now, and what matters is that she
understands what tests are, how they work, and the difference between unit,
integration and e2e.

Day 5 should therefore run **read → predict → break → observe**, not "write a
suite from scratch." The two experiments below are the model for this, and both
worked well. The remaining gap is judgement: looking at an existing suite and
naming what it does *not* cover — which is the skill the Day 3 `ORDER BY` bug
actually needed.

### How Day 4 actually went — the single most useful thing to know

**The format changed the outcome, and this is the main lesson to carry forward.**

The design work was genuinely hers: the layering rule, the `undefined`/`[]`
asymmetry, the four validation rules, and the decision to hand-write validation
with a named revisit condition. The code was not hers; a worker wrote it.

**The day had two halves that looked completely different.**

*Afternoon — open-ended Socratic questioning.* Uneven. The empty-collection idea
took three rounds, she answered "5xx" for an empty search, and the conclusion
came from the Master Thread rather than from her. She asked to move on three
times. At the time this looked like fatigue or disengagement.

*Evening — direct questions, each with an experiment attached.* Seven
predictions, **all seven correct**, including the two hard ones where she
worked out that 29 unit tests would still pass on a completely broken
application, and gave the right reason both times. On prepared statements she
did not answer the question asked — she volunteered the full mechanism
unprompted. Six debts closed in one session, two of them owed since Day 1.

**The difference was not effort or energy.** It was that the afternoon kept
asking her to reason toward concepts she had not met yet, for three rounds,
while the evening taught directly and then verified with an experiment.

**Do not read this as "drop the Socratic method."** That was the Master Thread's
first conclusion and her husband corrected it the same evening — see *The
three-step sequence* under *How To Work With The Learner*, which is the
authoritative version. Socratic still opens every topic. What changed is the
exit condition: two attempts, then teach it properly, then verify.

**One thing that reversed on the same day:** the empty-collection idea was
recorded as owed in the afternoon and closed in the evening, when she said in
her own words that an empty array *satisfies* the question. Worth knowing that
"she did not get it today" often means "she has not been taught it yet," not
"she cannot get it."

### The two experiments from Day 4 evening — reuse this format

Both produced results that contradict intuition, and both are re-runnable in
under a minute. They are the best teaching tools found so far.

**1. Rename the route.** `@Controller('entries')` → `@Controller('journal')`.
The application is completely broken — every existing client gets a 404 — and
**all 29 unit tests still pass.** 9 of 10 e2e tests fail with
`expected 201 "Created", got 404 "Not Found"`.

> Unit tests verify the pieces work. E2E verifies the pieces are *connected*.

**2. Delete a provider.** Remove `EntriesRepository` from `providers` in
`entries.module.ts`. `typecheck` ✅, `build` ✅, **server crashes at boot** with
`Nest can't resolve dependencies of the EntriesService (?)`, and **29 unit tests
still pass** — because every spec file declares its own `providers` list and
never reads `entries.module.ts`. Only the e2e suite does `imports: [AppModule]`,
so only e2e can catch broken production wiring.

Restore both afterwards and re-verify. (A backup copy before editing saves
time; `git checkout <file>` also works.)

### Also outstanding

**Experiments 3 and 4** in `docs/learning/day-02/testing-literacy.md` remain
unrun and are still worth doing — brittle assertions, and why tests must be
independent.

**Experiments 2 and 5 are now redundant and should be skipped.** Experiment 2 is
the route-rename experiment and experiment 5 is the four-commands type-error
question; she answered both correctly on Day 4 evening. Running them again would
be revision, not learning.

---

## Current State

**What runs today:**

```
GET    /entries              → 200, all entries, newest first
GET    /entries?word=<term>  → 200, matching entries newest first; 200 [] when
                               nothing matches. `%`, `_` and `\` in the term are
                               ordinary characters, not wildcards
                               400 when `word` is given more than once
GET    /entries/count        → 200, { "count": n }
GET    /entries/:id          → 200, one entry; 404 when not found
POST   /entries              → 201, { "content": "..." }, returns the created entry
                               400 when content is absent, not a string, or has no
                               non-whitespace character; 400 on a null body;
                               400 naming any field other than `content`
PATCH  /entries/:id          → 200, the updated entry. `createdAt` is unchanged
                               404 when the id does not exist
                               400 on an empty body, an invalid `content`, or any
                               field other than `content`
DELETE /entries/:id          → 200, the deleted entry; 404 when the id does not
                               exist
```

Entries persist across restarts. **Every endpoint now returns a correct status
code** — the three known-wrong 500s are gone. No auth, no frontend, no CI, no
deployment.

**Verified working on Fedora KDE as of 2026-08-04, end of Day 5:**
`pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm build` ✅ · `pnpm test` ✅ (55 tests,
up from 29) · `pnpm test:e2e` ✅ (18 tests, up from 10)

Day 5's endpoints and search behaviour were exercised over real HTTP by the
worker against a throwaway database on port 3999. **Not yet re-verified
independently by the Master Thread** — that audit is still owed.

All re-verified independently by the Master Thread against a fresh database on
port 3998, not taken from the worker's report. Every status code above was
confirmed over real HTTP, plus three checks the worker did not claim:

- whitespace survived storage unmodified (`"  padded  "` in, `"  padded  "` out)
- three rejected writes stored nothing (count unchanged)
- `content` is a string on every endpoint, so POST and GET cannot disagree

`apps/api/package.json` and `pnpm-lock.yaml` confirmed unmodified — **no
dependency was added.**

**Boundary check** (re-runnable, must return nothing):

```bash
grep -n "node:sqlite\|DatabaseSync\|DATABASE\|SELECT\|INSERT\|prepare(" \
  apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.controller.ts
```

**HTTP-boundary check, added Day 4** (must return nothing — the service and
repository may not know status codes exist). The `grep -v` strips comment
lines: both files legitimately *mention* `NotFoundException` in comments
explaining why they must never throw one, and a check that reports those is a
check nobody will trust.

```bash
grep -nE "HttpException|NotFoundException|BadRequestException" \
  apps/api/src/entries/entries.service.ts apps/api/src/entries/entries.repository.ts \
  | grep -v "^\S*:[0-9]*: *[/*]"
```

`EntryRow` was also confirmed to appear nowhere outside `entries.repository.ts`.

**Workflow decision:** one branch and one PR per day, squash-merged. Branch
naming `day-NN-topic`.

**Environment:** Node v24.18.0 · pnpm 11.17.0 via Corepack · Docker 29.6.2 ·
no local Postgres client installed. **VS Code ships its own TypeScript (6.0.3)
which is not the workspace's (5.9.3)** — this gap caused a real "the editor is
red but the terminal is green" incident on Day 2. See
`docs/learning/day-01/report.md` addendum.

---

## Current Architecture

```
neuron/                    pnpm workspace root
├── apps/
│   └── api/               NestJS 11 — the only app with code
│       ├── data/              SQLite file lives here (gitignored)
│       └── src/
│           ├── main.ts            bootstrap, listens on PORT ?? 3000
│           ├── app.module.ts      root module, imports EntriesModule
│           ├── database/
│           │   └── database.module.ts  DATABASE symbol token, factory
│           │                           provider, CREATE TABLE at boot
│           └── entries/
│               ├── entries.module.ts      wires controller + service + repository
│               ├── entries.controller.ts  HTTP only — routes, params, query,
│               │                          validation, and the ONLY place a
│               │                          status code appears. Owns
│               │                          parseEntryBody + parseContent (shared
│               │                          by POST and PATCH), the two DTO
│               │                          parsers, and parseSearchTerm
│               ├── entries.service.ts     application logic; generates id +
│               │                          createdAt, delegates storage
│               ├── entries.repository.ts  the ONLY class that knows a database
│               │                          exists. Owns EntryRow, toJournalEntry
│               │                          and escapeLikePattern — LIKE's pattern
│               │                          language is database vocabulary
│               ├── create-entry.dto.ts    what a client may SEND to POST
│               ├── update-entry.dto.ts    what a client may SEND to PATCH
│               └── entry.interface.ts     what an entry IS ({ id, content,
│                                          createdAt }) — all strings
└── docs/
    ├── constitution.md    engineering principles
    ├── roadmap.md         30-day plan (Day 0–29)
    ├── master-state.md    this file
    └── decisions/         ADRs
```

`apps/web/` does **not** exist yet (Day 12). `packages/` does **not** exist yet
and that is deliberate — see ADR-001.

---

## Decisions Made

| ADR | Decision | Status |
|---|---|---|
| [ADR-001](decisions/ADR-001-monorepo.md) | pnpm workspace monorepo; `packages/` deferred until `apps/web` exists | Accepted |
| [ADR-002](decisions/ADR-002-nestjs.md) | NestJS over raw `http` / Express / Fastify | Accepted |
| [ADR-003](decisions/ADR-003-sqlite.md) | SQLite via built-in `node:sqlite`, raw SQL, no ORM | Accepted, **expected to be replaced** (Day 16 / Day 24) |
| [ADR-004](decisions/ADR-004-repository-raw-sql.md) | Data access gets its own layer (`EntriesRepository`); SQL stays hand-written. Query builder and ORM rejected on timing, not merit. `id`/`createdAt` generated in the service | Accepted, **revisit Day 13 / Day 24** |
| [ADR-005](decisions/ADR-005-validation-and-error-semantics.md) | Status codes live in the controller and nowhere else — the service may not throw HTTP exceptions either. `findById` → `undefined`, `findByContent` → `[]`. Validation hand-written; `class-validator` and `zod` rejected on timing, not merit. `/entries/count` returns `{ count }` | Accepted. **Revisit condition fired on Day 5 as predicted; answered in ADR-006** |
| [ADR-006](decisions/ADR-006-strict-input-and-mutation-semantics.md) | `POST` and `PATCH` reject unknown fields (400). Repeated query parameter → 400. `%`/`_` escaped and treated literally in search. `PATCH` partial update, `createdAt` unchanged, no `updatedAt`. `DELETE` → 200 with the deleted entry. Validation stays hand-written with a shared check extracted; `zod` deferred again under four sharper triggers | Accepted and **implemented by the Day 5 worker**; Master Thread audit still owed. Revisit Day 12 (frontend) / Day 15–16 (search replaced) |

**Decided outside an ADR:**

- Public day numbering (Day 0–29) is canonical; roadmap renumbered to match.
- **Branching: one branch + one PR per day**, named `day-NN-topic` (e.g.
  `day-02-persistence`). Worker agents never touch git; branching, committing,
  and merging are human actions.
- **Lint enforcement lands at CI on Day 25, not before.** A root `lint` script
  makes it *reachable*; nothing yet makes it *mandatory*. Pre-commit hooks
  (husky/lint-staged) were considered and deliberately declined — the friction
  of remembering is what earns the Day 25 lesson.
- **Docker is permitted for local development infrastructure** from Day 2.
  Docker-for-local-dev and Docker-for-deployment are separate decisions; the
  latter is still Day 24 and is not pre-empted by the former.
- **`pnpm typecheck` is a first-class check**, added Day 2. `build` excludes
  spec files and ts-jest runs transpile-only, so without it nothing in the repo
  typechecked test code — only the editor did, using a *different compiler
  version*.
- **`@types` global inclusion is explicit** (`types: ["jest", "node"]`) rather
  than implicit. TypeScript 6 stopped auto-including `@types/jest` under this
  config.
- Lint warnings are promoted to errors — this project has no warnings, only
  errors. A warning nobody actions is noise that trains you to ignore output.
- TypeScript stays on 5.x. TS 7 is released but `ts-jest` (`<7`) and
  `typescript-eslint` (`<6.1.0`) peer ranges both exclude it, and both are
  already at their latest versions.
- `@types/node` tracks the Node **runtime** major (24.x), not npm's latest.

---

## Completed

- **Day 0** — repo init, public build announced.
- **Day 1** — pnpm workspace, NestJS scaffold, `GET /entries`, ADR-001, ADR-002.
  Shipped **unaudited**; LinkedIn post went out ahead of review.
- **Day 2** — environment restored after OS migration. Day 1 audited
  retroactively; ADR-001 merged from two conflicting drafts; roadmap renumbered
  and ratified as v1.0. Cleanup worker run and re-audited (`typecheck` gap
  found and closed). `POST /entries` written by hand to make the data-loss
  problem demonstrable, then SQLite persistence added via a worker and audited.
  ADR-003 written. Merged as `9c7365e` (PR #2, squash).
- **Day 3** — three further queries (`findById`, `findByContent`, `countEntries`)
  hand-written by her to make the duplication real. That produced a genuine bug
  (a copied `SELECT` that lost its `ORDER BY`, missed by all four checks) and a
  routing bug (`/entries/count` unreachable under `@Get(':id')`). She derived
  the repository pattern herself from the duplication, chose raw SQL over a
  query builder and an ORM with reasons, and argued the `id`/`createdAt`
  placement hard enough to change the ADR. ADR-004 written. Extraction done by a
  worker and audited. Merged as `488acc9` (PR #3, squash).
- **Day 4** — the three known-wrong 500s fixed, and validation added. She
  derived the layering rule herself: status codes are HTTP vocabulary, so the
  service may not throw `NotFoundException` either — the same boundary argument
  as ADR-004, applied one layer up. She got the 4xx/5xx re-test right, learned
  400 vs 404, and **watched type erasure happen** by reading the compiled
  JavaScript, which is the fact that makes runtime validation necessary at all.
  She chose hand-written validation over `class-validator`/`zod` on timing, and
  decided all four validation rules including rejecting `{"content": 42}`.
  ADR-005 written. Implementation by a worker and audited. The worker
  **deviated once and was right to**: it used `@Body() body: unknown` rather
  than the `CreateEntryDto` the prompt specified, because an unvalidated body is
  not a `CreateEntryDto` and naming it one repeats the exact falsehood the day
  removed. It also caught a `null`-body case the design missed
  (`typeof null === 'object'`). **In an evening session after the code was
  committed, six learning debts were closed** by direct question and experiment
  — two of them owed since Day 1, one since Day 2 and previously skipped twice.
  This cleared Day 5, which had been over capacity.
- **Day 5** — the day the suite was judged rather than extended. She found
  **three real defects inside a fully green 39-test suite**: unknown fields
  silently dropped, `LIKE` wildcards returning the whole journal, and a repeated
  query parameter producing a misleading `200 []`. Each was confirmed over real
  HTTP before being accepted. She then made every design decision that followed
  — reject unknown fields on both `POST` and `PATCH`, 400 on a repeated
  parameter, escape `%`/`_` rather than reject them, `DELETE` returns the
  deleted entry. The idea worth keeping: **a missing test is usually a missing
  decision.** She could not write the wildcard claim until she had chosen what
  search meant, and that was not a gap in testing skill. ADR-006 written;
  implementation by a worker, audited by deliberately breaking the code in three
  places. 29 → 55 unit tests, 10 → 18 e2e, no dependency added, no defects
  found. **ADR-006 was amended the same day** because the worker honestly
  reported that the duplication it was credited with removing had never had room
  to form.

---

## Known Debt

**Resolved by the Day 2 cleanup worker** (audited and verified):

| Item | Resolution |
|---|---|
| `pnpm lint` failed | ✅ Exits 0. Assertions rewritten to shape/invariant checks over every entry |
| Floating promise | ✅ `no-floating-promises` → `error`; `main.ts` catches, logs, exits 1 |
| No root `lint` script | ✅ Root now has `lint`, `typecheck`, `test:e2e` |
| README inaccurate | ✅ Corrected |
| `report.md` at repo root | ✅ Moved to `docs/learning/day-01/report.md` |
| `eslint` 9 → 10 | ✅ Bumped; zero new violations, no config changes needed |
| **Nothing typechecked test files** | ✅ `pnpm typecheck` added — `build` excludes specs, ts-jest is transpile-only via `isolatedModules`, and lint doesn't report compiler errors, so *no* reachable command checked them |
| TS 6 broke jest globals | ✅ `types: ["jest","node"]` added, deprecated `baseUrl` removed from `tsconfig.json` |

**Open:**

| Item | Detail |
|---|---|
| `apps/api` `lint` script has `--fix` | `pnpm lint` silently **rewrites** files rather than reporting. Fine locally, wrong for a CI gate. Split into `lint` / `lint:fix` by Day 25 |
| `res.body` is untyped (`any`) in e2e | 🟡 **Partly resolved Day 5.** The new e2e tests read the body through one `entryFrom(res)` helper that casts once to `JournalEntry`, so field access is compiler-checked from there on. It is still a cast, and the three older tests still assert on raw `res.body`. Day 7 |
| Worker prompts + reports are gitignored | `docs/workers/` and `docs/learning/**/report.md` stay local only. They exist on disk but are not in version control |
| **`?word=` (empty value) returns everything** | `if (word)` treats the empty string as absent and falls through to `findAll()`. **Deliberately left unchanged on Day 5**, and this is the point rather than an oversight: ADR-006's own lesson is that a missing test is usually a missing decision, and nobody has decided whether an empty search term means "list everything" or "reject the request". Still untested. **Not yet shown to her** |
| **Escaping is enforced by memory, not by mechanism** | New Day 5, and named as an accepted cost in ADR-006. Nothing stops a future query interpolating a raw term into a `LIKE` without calling `escapeLikePattern`. Same class as the `created_at` cast and the forgettable validation checks below |
| **Validation is enforced by memory, not by mechanism** | Nothing makes a future endpoint validate its body. A forgotten check passes lint, typecheck, build and tests. This is ADR-005's accepted cost and its named revisit condition — the same failure class as the Day 3 `ORDER BY` bug. Day 5 shrank it but did not remove it: `POST` and `PATCH` now call the same two checking functions, so the *rules* exist once, but nothing forces a third endpoint to call them |

**Resolved by the Day 5 worker** (implemented and verified over real HTTP;
Master Thread audit still owed):

| Item | Resolution |
|---|---|
| `POST /entries` ignores unknown fields | ✅ **400 naming the field.** `{"content":"x","id":"mine"}` now answers `Unrecognised field(s): id. Only content may be sent.` `PATCH` applies the identical rule |
| `LIKE` wildcards are not escaped in search | ✅ `%`, `_` and `\` are escaped before the value is bound, and the query names `ESCAPE '\'`. `?word=%` returns only entries containing a percent sign; `?word=100%` finds `100% exhausted today`. The escape character is escaped **first**. Both ways of getting this wrong were introduced deliberately and the tests were watched going red: reversing the order breaks the `%` and `_` claims, and omitting the backslash pass entirely breaks only the backslash claim |
| Duplicate query parameters are a type lie | ✅ `@Query('word')` is now typed `unknown` and checked. `?word=a&word=b` is a 400, not `200 []`. The first element is deliberately **not** taken — that would guess which of the two terms the user meant |
| `PATCH` and `DELETE` do not exist | ✅ Both added. `PATCH` leaves `createdAt` unchanged and there is no `updatedAt`. `DELETE` returns the deleted entry with 200, and reads the row before removing it so a second `DELETE` is a 404 rather than a quiet success |

**Resolved during Day 2** (no longer debt):

- `findAll()` returning the private array by reference — dissolved exactly as
  predicted. The database now owns the data and returns fresh row objects.
- `toHaveLength(2)` in both unit and e2e tests — replaced by invariant checks
  and a POST/GET round trip respectively.
- `entries.service.spec.ts` asserting only `toBeDefined()` — now has real
  behavioural tests.

**Deferred by design — resolves on a known day:**

| Item | Resolves |
|---|---|
| **Casts survive the repository extraction.** Rename `created_at`, miss one `SELECT`, and the API serves `"createdAt": null` with lint, typecheck and build all green. Same class of failure as the Day 3 `ORDER BY` bug — a rule the type system cannot see. Accepted knowingly in ADR-004 | Reopen if it causes a bug, or Day 13 / Day 24 |
| `id`/`createdAt` format is enforced by convention, not by the database or the type system. Tolerable only while `create()` is the single write path | When a second write path appears (ADR-004) |
| `entry.interface.ts` names the language construct, not the concept | Unscheduled — cosmetic |
| ~~`POST /entries` with `{}` fails as an uncaught 500~~ | ✅ **Resolved Day 4** — 400 |
| ~~`GET /entries/:id` returns 500 where 404 belongs~~ | ✅ **Resolved Day 4** — 404, and the pinned test moved to the controller spec where the behaviour now lives |
| ~~`GET /entries?word=<no matches>` returns 500 where `200 []` belongs~~ | ✅ **Resolved Day 4** — fixed by *deleting* the `throw`; no new code |
| ~~Storage-outcome → HTTP-status mapping has no home~~ | ✅ **Resolved Day 4** — ADR-005: the controller, and only the controller |
| ~~`GET /entries/count` returns a bare number~~ | ✅ **Resolved Day 4** — `{ "count": n }` |
| ~~One type serves as both domain model and HTTP wire shape~~ | ✅ **Resolved Day 4** — `CreateEntryDto` (send) vs `JournalEntry` (is) |
| `LIKE '%term%'` search is lexical and cannot match meaning | Day 15 / Day 16 (this is the Phase 3 premise) |
| No exception filter or CORS. **A `ValidationPipe` was deliberately declined**, not deferred by omission — see ADR-005 | Day 12 (CORS); pipe revisits per ADR-005 |
| `process.env.PORT` and `DATABASE_PATH` read raw and unvalidated | Day 6 (config) |
| `CREATE TABLE IF NOT EXISTS` at boot is not migration tooling | First non-additive schema change |
| No index on `created_at`, no pagination | Day 23 (measure first) |
| Millisecond ties in `created_at` ordering have no tiebreaker | Not worth solving; documented in the service |

---

## Learning Debt

Concepts introduced by worker agents that have **not yet been learned**. See
the roadmap's *Learning Debt* section for why this is tracked.

**Repaid on Day 2:**

- `Test.createTestingModule` / DI in tests — done by experiment. She deleted a
  provider, predicted a compile-time failure, and watched it fail at runtime
  instead. Followed through to the compiled output and `design:paramtypes`.
- **Nest resolves dependencies at runtime, not compile time** — she got this
  wrong twice (once for `providers`, once for `exports`), and the second time
  was proven live: `typecheck` and `build` both passed, the application failed
  on boot. Worth checking it has stuck.
- Symbol injection tokens and factory providers — explained in depth after the
  persistence worker introduced them.

**Repaid on Day 3:**

- **Raw SQL** — she hand-wrote three queries (`findById`, `findByContent`,
  `countEntries`) including `LIKE`, `COUNT(*)` and `ORDER BY`. SQL itself is now
  owned rather than inherited from a worker.
- **Route matching is declaration order, first match wins.** She predicted
  "static before dynamic" and her own unreachable `/entries/count` disproved it.
  The distinction that landed: static-before-dynamic is the *discipline forced
  by* the rule, not the rule.
- **The repository pattern** — derived by her from the duplication before it was
  named. She proposed "a function where I dictate what I need," chose the
  application-language form over the SQL-language form, and located the SQL in a
  new file (she called it `schema.ts`; the naming correction taught the
  schema/operations distinction).
- **UUID vs sequential ids, and where generation belongs.** She argued for
  database-generated, which is defensible and common. She changed position on
  evidence, then raised the objection that application-side generation is
  unenforced — now recorded in ADR-004 as an accepted cost with a revisit
  condition.
- **4xx vs 5xx** — given the test *"could the client fix this by sending a
  different request?"* She applied it correctly once and wrongly once, grouping
  "record missing" with "database file deleted." **Worth re-testing on Day 4.**

**Repaid on Day 4:**

- **Type erasure.** The best moment of the day. She ran `pnpm build`, read the
  compiled JavaScript, and saw `{ content: string }` become a bare `body`. She
  now owns the reason validation must be *runtime code*: TypeScript is not
  present when the request arrives. Learned by observation, not assertion.
- **4xx vs 5xx, re-tested.** All three questions right, and question 3 answered
  with the *rule* ("who can fix it, the client or the engineer?") rather than
  the two instances. That is the exact distinction that failed on Day 3.
- **400 vs 404.** Did not know it; was told once; then applied it correctly and
  unprompted to `POST {}`.

**Repaid on Day 4 (evening session — six items, two owed since Day 1):**

- **Prepared statements.** Owed since Day 2, offered and skipped twice. She
  explained the parse-then-bind mechanism unprompted: the database parses the
  instruction text first, so by the time values arrive the sentence structure is
  already fixed and data cannot become instruction. Not the slogan — the
  mechanism.
- **Why three of four commands miss a type error in a spec file.** All four
  answered correctly with the reason for each, including that `ts-jest`
  transpiles rather than compiles, so types are stripped without being checked.
- **Unit vs e2e, and supertest.** Predicted the route-rename result correctly
  and gave the right reason: unit tests never mention the route, e2e names the
  path in the request. Then watched 29 unit tests pass on a completely broken
  application.
- **`EntriesRepository` wiring.** Four-part prediction, all four correct —
  including the hard one, that unit tests would still pass because spec files
  declare their own providers.
- **Empty collection is an answer, not a failure.** Ran the experiment, then
  said it in her own words: *"even in that case the correct answer is no row
  contains the word and empty array can satisfy it."* This is the exact idea she
  could not reach earlier the same day.
- **Why `unknown` beats a named DTO at a trust boundary.** Explained that the
  compiler *believes* the label, so typecheck and build both pass and the
  failure only appears at runtime.

**Repaid on Day 5 (first session):**

- **Prepared statements have a boundary, and she has now seen it.** She could
  already explain that bound parameters stop data becoming instruction. Tonight
  she predicted, correctly and instantly, that `?word=%` returns every entry —
  then saw why the protection does not apply. `%` and `_` are not SQL grammar;
  they are the pattern language `LIKE` interprets *after* the value is bound, so
  binding works perfectly and the bug happens anyway. This also closes the
  "explained, not verified" flag on prepared statements below: the mechanism was
  load-bearing in a prediction she got right.

**Still owed:**

- **Reading and judging an existing suite.** 🟡 Partial, and moved forward
  tonight. She found two genuine gaps, correctly placed a new test in the right
  spec file, and wrote the claim sentence for one of them once the underlying
  decision existed. What is not yet demonstrated is doing this **unprompted
  across a whole suite** rather than on cases handed to her one at a time. Four
  further gaps are listed in *Block 3* for exactly this, deliberately withheld.
- **Turning a found gap into a claim without help.** New, opened Day 5. The
  first attempt stalled — legitimately, because the behaviour had never been
  decided. Worth re-testing on a gap where the correct behaviour is obvious, so
  the decision step is not confounded with the writing step.
- **Where validation belongs.** 🟡 Partial — she reasoned it out and chose the
  *service*, then accepted the counter-argument. The distinction between "is
  this well-formed?" (boundary) and "is this allowed?" (service) was given to
  her, not derived. → re-test Day 10 when ownership checks arrive
- ~~**Prepared statements — 🟡 explained, not verified.**~~ ✅ **Verified Day 5.**
  The mechanism turned out to be load-bearing in a prediction she got right
  instantly: that `?word=%` returns every entry, because `%` is interpreted by
  `LIKE` *after* binding and so binding cannot protect against it. She could not
  have reached that without the parse-then-bind model. The in-memory injection
  experiment she declined is no longer needed.
- **`EntriesRepository` wiring** — the worker did the extraction, so she has not
  registered a repository provider herself or seen that failure mode. → surfaces
  naturally on Day 13 when a second entity needs one

`docs/learning/day-02/testing-literacy.md` experiments **3 and 4** remain unrun;
2 and 5 were overtaken by the Day 4 evening session and should be skipped. Note
that authorship of tests is **no longer** part of Day 5 —
see the direction recorded in *Next Session Starts Here*.

---

## Open Questions

- Rich text vs plain text for entries — deferred until the data model forces it.
- Which AI provider, and does that decision need to be reversible? (Phase 3)
- When does TypeScript 7 become viable? (blocked on ecosystem peer ranges)
- Day 0's LinkedIn post lists PostgreSQL in the stack; Day 2 chose SQLite.
  ADR-003 explains when Postgres arrives, so this is a documented evolution
  rather than a contradiction — but it will need saying out loud eventually.
- ~~Should `feature/project-setup` merge to `main`?~~ **Resolved** — merged as
  PR #1. `main` is the trunk; each day gets a `day-NN-topic` branch and a
  squash-merged PR.

---

## Workflow

- **Master Thread** (the architecture session) audits, teaches, writes ADRs and
  roadmap updates, and authors worker prompts. It does **not** write production
  code.
- **Worker agents** run in fresh Claude Code sessions, implement one isolated
  task from a prompt in `docs/workers/`, and produce a report.
- **Master Thread re-audits** every worker result before the day closes.

---

## How To Work With The Learner

This section exists because a new Master Thread needs it and cannot infer it.

### Who she is

A 2022 computer engineering graduate returning after a career break. She
completed boot.dev's TypeScript backend path, so TypeScript fundamentals are
solid. NestJS, databases, authentication and testing are all new. She has
roughly 7 focused hours a day.

Her husband is a senior software engineer. He set up the project structure and
this workflow, and occasionally speaks in the thread to configure something
before handing back to her. When someone gives terse, senior-level direction,
that is him.

### How to teach

1. Open a day with a **short brief** — what she will do and why, in a few
   lines. Do not preview every block.
2. Then take **one block at a time**. Do not dump the rest of the day.
3. Each block opens with **questions**, not answers. Ask her to predict,
   attempt, or research first, then wait for her reply.
4. Ask her to explain concepts back before moving on.
5. Treat a wrong prediction as the valuable outcome. It locates exactly where
   her mental model and the machine disagree.
6. Prefer running an experiment over asserting a fact. She learns from watching
   something break, not from being told it would.

### ⚠️ The three-step sequence — read this before teaching anything

Set by her husband on Day 4, correcting an over-broad conclusion the Master
Thread had drawn from a single day. **Use all three steps in order. Do not skip
step 1, and do not linger past step 2.**

**Step 1 — Open Socratic.** Give her the situation and ask what she thinks. No
options, no leading. Real thinking time. This step is not optional, and it is
not there for the answer — it is there because the habit of thinking through an
unfamiliar problem is itself being rebuilt after a four-year career break.

**Step 2 — One narrowing question.** If she is stuck, ask *one* question that
narrows the problem. Not a rephrasing of the first question. One attempt only.

**Step 3 — Teach it, then verify with an experiment.** If she is still stuck
after step 2, **she does not have the concept.** Explain it properly and
directly. Then use a prediction-plus-experiment to confirm it landed.

### Why step 3 is teaching and not another kind of question

This is the correction, and it matters. Being stuck after two attempts is
usually an **information** state, not a motivational one — she does not have the
concept yet. No amount of reframing produces knowledge she was never given.
Most of this material is genuinely new to her: NestJS, databases, HTTP
semantics, testing. **It is not realistic to expect any of it in one go.**

What went wrong on Day 4 was not starting Socratic. It was staying there for
three rounds on the same idea, re-explaining in different words each time. That
turns thinking time into pressure. The trigger for moving on is **rounds, not
difficulty**: two attempts, then teach.

Note also that the evening's seven correct predictions were not purely the
format winning. A prediction question is only tractable once some model of the
system exists, and the afternoon's struggle is part of what built it. Cutting
straight to prediction questions every time would quietly remove the step where
that model forms — and it would not show up as a failure, because the
predictions would keep coming back correct.

### The concrete shape of step 3's experiment

> Here is the situation in three sentences. Here is what someone changes.
> **Predict** what happens to typecheck, to build, to the server, to the tests.
> Now run this command and let us compare.

### When she says "I understand, move on"

Do not re-explain and do not push. Move on, and record what was skipped. But
treat it as a signal worth reading: on Day 4 it consistently meant *"this has
stopped being productive"*, and an idea she had moved on from in the afternoon
was fully owned by evening once it was taught directly and then verified with an
experiment.

### Track where she lands, across days

Worth recording per topic: **which step did she answer at?** If topics that
needed step 3 in week one are being answered at step 1 by week three, the habit
is returning and it is measurable. If it never moves, this plan needs revisiting
rather than repeating. Do not assume either outcome.

Rules 1 to 6 above still hold. This is how to execute rule 3.

If she says she wants to move on, move on. Record what was skipped in the
Learning Debt section rather than pushing.

### How to write

Use **simple, complete, descriptive English**. She asked for this directly.

- Full sentences. No fragments used for emphasis.
- One idea per sentence.
- Explain a technical term the first time it appears.
- Avoid compressed idiom and stacked em-dashes.
- Clear does not mean longer. It means she never re-reads a sentence to parse
  it.

### The Learning Debt rule

Worker agents produce correct code faster than she can learn the concepts
inside it. Every time that happens the repo gains code its owner cannot
explain. A concept is not done when it ships. It is done when she can explain
it without reading the code. Track it in the Learning Debt section above and in
`docs/roadmap.md`.
