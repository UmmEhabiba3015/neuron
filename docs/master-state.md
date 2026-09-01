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

**Last updated:** 2026-08-06, after the Day 6 implementation was audited.

**Current day:** Day 6 of 29 is **implemented and audited**, with one follow-up
task outstanding. ADR-007 is written and amended. The worker's implementation was
audited by breaking the code in five places; four mutations were caught and one
was not. The one that was not is the day's finding, and a follow-up worker prompt
exists to close it. Nothing is committed. Day 5 is complete and merged.

**Current branch:** `main`, clean and in sync with `origin/main`. Day 5 was
merged as commit `44590a9` through pull request #5, using a squash. The
`day-05-testing` branch has been deleted both locally and on GitHub. Nothing at
all is outstanding from Day 5.

**All five checks were re-run by the Master Thread itself rather than taken from
the worker's report.** `pnpm lint`, `pnpm typecheck` and `pnpm build` all pass.
`pnpm test` passes with 55 tests, up from 29. `pnpm test:e2e` passes with 18
tests, up from 10. Both `apps/api/package.json` and `pnpm-lock.yaml` are
unmodified, so no dependency was added. Both boundary checks return nothing, and
`EntryRow` is still confined to the repository file.

---

## Next Session Starts Here

**Resume by running `docs/workers/day-06-wiring-test.md`,** then auditing what it
produces, then committing Day 6. Everything else about Day 6 is done. The Day 5
history further down is still accurate.

### Day 7 — implemented and audited, 2026-09-01

ADR-008 written and **amended four times** after the audit. Validation now runs
through `class-validator` with a `ValidationPipe` registered as an `APP_PIPE`
provider in `AppModule`. **No defects, no rework.**

**Every decision was hers**, and made against real output rather than description:
a custom decorator for the non-whitespace rule, `PATCH {}` stays a 400 (re-examined
rather than preserved, since `forbidNonWhitelisted` now covers the misspelled-field
case that originally motivated it), `?werd=x` is a 400, `?word=` returns `[]` while
an absent `word` returns everything, and the library's message wording is accepted.

**The mechanical fact that shaped the day:** `ValidationPipe` refuses to validate
anything whose declared type is `Object`, and `unknown` compiles to exactly that.
Switching the pipe on without replacing `unknown` would have done nothing at all.
This reverses the Day 4 `@Body() body: unknown` decision, correctly: that decision
was right while nothing ran before the handler, and the pipe is what makes the
label true.

**Audit: all five checks green, 80 → 96 unit, 24 → 32 end-to-end.** Exactly two
direct dependencies; the lockfile gained four, including a 13M phone-number library
nothing calls. All three boundary greps silent. Real HTTP verified independently,
including the pair that had to disagree (`?word=` → `[]`, `/entries` → everything),
that `"  padded  "` survives `transform: true` unedited, and that `?word=100%`
still finds only the percent entry through the new query DTO.

**Six mutations, all caught** — the worker's two plus four of mine:

| Mutation | Result |
|---|---|
| Remove the `APP_PIPE` provider | 14 e2e fail |
| Revert `@Query()` to `unknown` | 2 e2e fail (lint/typecheck/build all pass) |
| Drop `@ContainsNonWhitespace` | 3 unit + 3 e2e fail |
| Revert `@ValidateIf` to `@IsOptional()` | 1 unit + 1 e2e fail |
| Drop `forbidNonWhitelisted` | 4 e2e fail |
| Drop `whitelist` | 4 e2e fail |

The unit suite stays green on the pipe mutations, and that is correct rather than a
miss: DTO specs assert the rules are right and cannot assert that anything calls
them — the same split as `env.validation.spec.ts` on Day 6.

**⚠️ What the audit found that the report did not.** A 400 no longer has one
response shape. The pipe answers `{"message": ["..."]}` while Express's JSON parser
— which rejects `null`, `42` and bare strings before the pipe runs — answers
`{"message": "Unexpected token ..."}`. Before Day 7 every 400 from this API had a
string `message`. Recorded as debt in ADR-008 Amendment 3 rather than fixed,
because no client exists yet.

**The worker was honest against itself for the third time on this project**, and
most sharply yet: it reported that the refactor made the codebase **+31 lines
longer**, that the two rules the library does not understand cost 51 lines of
boilerplate against eight hand-written, and that *"if this were a decision about
code alone I would say so more loudly."* What it argued was actually bought is the
inversion of the default — validation now happens unless somebody stops it. All
three cases came from a prompt that asked a direct question inviting disagreement.

**Learning debt opened by this day:** `class-validator` decorators, custom
decorators via `registerDecorator`, `APP_PIPE` versus `useGlobalPipes`, and
`transform: true`. She chose this library to learn how Nest does things and a
worker wrote it, which is the same situation Day 7 Block 1 existed to repair for
`@nestjs/config`. **Do not let this sit as long.**

**Still outstanding:** Day 6 is committed and pushed but **not merged** (`main` is
at `d24606f`, no PR). Day 7's work is sitting on the `day-06-configuration` branch,
so the two days need separating before either is merged.

### Day 6 follow-up: audited and closed, 2026-08-28

`apps/api/test/config-wiring.e2e-spec.ts` was added by a worker and audited by me
rather than taken from its report. **No defects, no rework.**

All five checks green: lint, typecheck, build, **80 unit**, **24 end-to-end** (21
→ 24 exactly as specified). No dependency added. No production code changed —
verified by diffing `app.module.ts` against a copy taken *before* the worker ran,
because file timestamps were useless here: my own mutations had rewritten the
file.

**Both required mutations caught, and they fail differently, which is stronger
than the prompt asked for:**

```
delete 'validate,'       -> 2 tests fail   (claims 1 and 2)
delete 'isGlobal: true'  -> 1 test fails   (claim 3)
restored                 -> 24 passed
```

No stray sockets, no leftover temp directories, real application boots and serves.

#### ⚠️ The worker corrected a factual error I had taught her

My prompt stated as an established mechanical fact that `@nestjs/config` "does not
validate when `forRoot()` is called; it validates when Nest initialises the
module." **That is false**, and I had taught her the same thing in Day 7 Block 1.

`ConfigModule.forRoot` is an `async` static and it calls `options.validate(config)`
in the synchronous part of its body, so the check runs while `app.module.ts` is
being *imported*. Because an `async` function returns a rejected promise rather
than throwing, the failure sits unhandled in the `imports` array until Nest awaits
it — which is why the import looks like it succeeded. Confirmed against the
library's source and by an `unhandledRejection` handler firing before Nest was
asked to build anything.

Every *observation* previously recorded is unaffected: the import succeeds,
`compile()` rejects, `main.ts`'s own `catch` never runs. Only the explanation was
wrong. The `useFactory` analogy still holds for `DATABASE`; it does not hold for
`validate`.

Corrected in ADR-007 (Amendment 4) and in the worker prompt. **She was told the
correction directly.** This is the second time a worker here has corrected the
record it was handed, and both times it happened because the prompt asked a direct
question inviting it.

**Day 6 is now complete and ready to commit.** Nothing is outstanding except the
git work, which is hers: branch `day-06-configuration`, one squashed pull request.

### Day 7 — first block, 2026-08-19 (after a 13-day gap)

The project sat untouched from 2026-08-06 to 2026-08-19. Day 6's work was still
uncommitted on `main` the whole time. Nothing was lost; all 101 tests still pass.

Day 7 opened by repaying the `@nestjs/config` learning debt, since she chose that
package specifically to learn how NestJS does things and had not read a line of
what the worker wrote.

**What she now owns:** that `ConfigModule.forRoot({ validate })` does not call
`validate` — it stores it in a module description that Nest reads later — and
that because Nest calls it, Nest also catches it, which is why the `catch` in
`main.ts` never runs. She predicted correctly that merely importing
`app.module.js` with `PORT=hello` would succeed.

**⚠️ A regression worth acting on.** Asked what deleting `isGlobal: true` would
do, she predicted **typecheck and build would fail**. They cannot; Nest resolves
dependencies at runtime. This is the *third* time she has made this exact
prediction wrong — Day 2 for `providers`, Day 2 for `exports` — and she got it
**right** on Day 4 evening for `EntriesRepository`. It slipped back over the
two-week gap. Re-test it again rather than assuming Day 4 closed it.

**The finding of the block, and it is a real one.** Deleting `isGlobal: true`
gives:

```
typecheck  PASSES   build  PASSES   80 unit PASS   21 e2e PASS
the application  ->  exit 1, Nest can't resolve dependencies of the Symbol(DATABASE)
```

**The e2e suite does not catch this, though it caught the equivalent Day 4
break.** The reason is `.overrideProvider(DATABASE).useValue(db)` — that replaces
the whole factory, and the factory is the only thing that asks for
`ConfigService`, so the broken edge is never travelled. The idea to keep: **the
more a test replaces, the less of the real wiring it can check.** The override
that keeps the suite away from her real journal is the same override that blinds
it here.

She predicted, correctly, that the planned wiring test would **not** catch this
either. Verified: with `isGlobal` gone and `PORT=hello`, `compile()` still
rejects with `PORT must be a whole number…`, because `validate` throws before
Nest reaches dependency resolution. The asserted message arrives and the test goes
green.

**My own error, and the same shape as the `successfully started` mistake.** The
original `day-06-wiring-test.md` said in writing *"do not test valid configuration
here — the existing suites already cover that."* That instruction would have
removed the only test that catches this, because the existing suites cover valid
configuration **with `DATABASE` overridden**, which is exactly what hides it. The
prompt has been corrected: it now requires a third claim — the real `AppModule`
builds successfully with valid configuration and no overrides — and a second
mutation, deleting `isGlobal: true`, which claim 3 must fail against. Expected
e2e count is now 21 → 24.

### Day 6 — exactly what is outstanding

1. **Run `docs/workers/day-06-wiring-test.md`** in a fresh Claude Code session.
   It adds one end-to-end spec and no production code. End-to-end count should go
   21 → 23.
2. **Audit it the same way**: the acceptance criterion is that deleting
   `validate,` from `ConfigModule.forRoot` in `apps/api/src/app.module.ts` makes
   the new tests fail. Verify that yourself rather than reading the report.
3. **Commit and merge Day 6.** Nothing is committed yet. The branch does not
   exist yet either; git is hers.
4. **The Day 6 LinkedIn post is drafted but covers only the first session** — the
   problem, not the solution. See *Day 6 — LinkedIn* below. She confirmed she
   posted Day 5 on 2026-08-05.

### Day 6 — second session: the decisions, the implementation, the audit

**ADR-007 is written**, at
`docs/decisions/ADR-007-configuration-and-boot-validation.md`, and was **amended
the same day** with three corrections the audit forced. Read the amendments; they
matter more than the original text.

**Every decision in it was hers.** Check at boot rather than at first use. `PORT`
absent defaults to 3000 while `PORT` present-but-wrong refuses to boot — she
produced the distinction that drives this, which is that *absent means "choose for
me" and wrong means "I had an opinion and expressed it badly", so a default is the
right answer to the first and the wrong answer to the second.* Reject `PORT=0`.
Do not trim whitespace, on the same reasoning she used for journal content on Day
4. Warn rather than refuse when `DATABASE_PATH` names a missing file. Use `.env`.
Use `@nestjs/config`.

**The `@nestjs/config` choice was hers and was made against my advice**, with the
facts in front of her: that it is a real dependency, that it validates nothing by
itself, and that its `.env` loading is redundant on Node 24. Her reason was that
learning how NestJS conventionally does things is one of the goals of this
project. That is the second time in one day she chose the framework's own way for
that reason, so it is a position rather than a mood. **Do not relitigate it.** It
is in tension with ADR-005's argument that framework API names do not transfer,
and ADR-007 records the tension rather than smoothing it over.

#### The audit — what I checked and what it found

All five checks re-run by me, not taken from the report: lint, typecheck, build,
**80 unit tests** (up from 55) and **21 end-to-end** (up from 18).

Verified against the real application on a free port: `PORT=hello` exits 1 with
`received "hello"`; `PORT=" 3000 "` exits 1 with the spaces visible inside the
quotes; `PORT=4242` serves real HTTP; a missing `DATABASE_PATH` file warns and
then serves `{"count":0}`. Her real journal still holds its four entries. No
socket files anywhere.

**Five deliberate mutations. Four caught:**

| Mutation | Result |
|---|---|
| Accept `PORT=0` | 1 test fails |
| Accept `PORT=99999` | 1 test fails |
| Return `PORT` as a string, not a number | 4 tests fail |
| Warn on the default path too | 3 tests fail |
| **Delete `validate,` from `ConfigModule.forRoot`** | **nothing fails** |

**The finding.** With that one word deleted, typecheck passes, build passes, all
80 unit tests pass, all 21 end-to-end tests pass, and the real application accepts
`PORT=hello` and creates the socket file again. Every rule still exists and is
fully tested; nothing calls it. This is Day 4's `EntriesRepository` experiment
repeating exactly. It is a gap in the suite, not a defect in the code.

**A process error of mine worth not repeating.** My first run of the
`DATABASE_PATH` warning case reported `{"count":4}`, which would have meant the
path was ignored. It was not. A `pnpm --filter @neuron/api start` server left
running by the Day 6 worker held port 3000 for twelve minutes, so my test process
died with `EADDRINUSE` and my `curl` was answered by that older server. **When an
audit result contradicts the code, check what is holding the port before
concluding anything.** Re-running on port 3997 gave the correct `{"count":0}`.

#### The worker was honest about its own work, again

It volunteered that `@nestjs/config` pulled in `dotenv` at two versions plus
`dotenv-expand`, all unused, directly contradicting ADR-007's own sentence that
`dotenv` is not added. It also wrote that *"if the explicit learning goal were
removed from the ledger, I do not think the remaining benefit would justify it
today, at two variables."* That is the second worker on this project to report a
weaker version of its own success without being pushed, and it is the behaviour to
keep asking for. Both prompts asked a direct question inviting it; that appears to
be what produces it.

It also found a real library quirk by reading source rather than documentation:
`@nestjs/config` copies whatever `validate` returns back into `process.env`, and
`process.env.X = undefined` stores the string `"undefined"`, which would have had
the application open a database file named `undefined`.

#### Where she answered, second session

| Question | Step reached |
|---|---|
| When should configuration be checked? | **Step 1.** Correct and complete — at boot, refuse to start, say exactly what is wrong |
| Are "not set" and "set to hello" the same problem? | **Step 1.** Correct, both parts |
| What should each variable mean? | **Step 1**, but too vague to act on. Narrowed once, then answered well |
| What does `PORT=` do? | **Asked to be told.** Genuinely obscure; not a failure |
| Can a check catch `data/nueron.db`? | **Step 1, and better than the question.** She did not find a check — she changed the design so the mistake becomes visible. The distinction worth reusing: checking *form* versus checking *reality* |
| `PORT=0` and whitespace | **Step 1.** Both decided with reasons |
| How does anybody know the variables exist? | **Step 1**, though "a configuration file" needed splitting into three things |
| Is `.env` justified today? | **Step 1.** Chose it; Node 24 makes it free |
| Which mechanism? | **Step 1.** Chose `@nestjs/config` with a stated reason |

### Day 6 — first session (2026-08-05 evening into 2026-08-06)

No production code was changed. `git status` shows only `docs/master-state.md`
modified. The whole session was understanding work, in the order the constitution
sets out, and it stopped deliberately before the decision.

**Why it stopped there.** The session ran past midnight, and the next block is
where the options get compared and one gets chosen. The single thing this Master
Thread was told to fix on Day 6 was a decision she accepted near midnight without
arguing. Asking her to make a fresh set of decisions at one in the morning would
have reproduced the same fault, so she was offered the choice and stopped.

**Four things were established, each by an experiment rather than by assertion.**

*One. An unvalidated configuration value does not crash the application; it makes
it start.* The server was run with `PORT=hello`. She predicted a crash. What
actually happened is that Nest reported `Nest application successfully started`,
mapped every route, and stayed healthy, while nothing at all was listening on TCP
port 3000. Node's `listen` accepts either a port number or a filesystem path, and
because `"hello"` does not look like a number it was treated as a path. A Unix
domain socket named `hello` appeared in `apps/api/`. The sentence she was given to
keep is that **the dangerous configuration bug is not the one that crashes, it is
the one that starts.**

*Two. She then predicted the `DATABASE_PATH` typo case completely correctly, in
one step,* including the mechanism: the application starts, a second database file
is created under the misspelled name, and `GET /entries` returns an empty array.
Running `DATABASE_PATH=data/nueron.db` produced exactly that, `{"count":0}` beside
a real database holding four entries. This case is worse than the port case
because the application is fully reachable and fully functional, so the only
symptom reaching the user is that their journal is empty.

*Three. A committed secret cannot be un-committed.* She was asked whether deleting
a password in a later commit solves the problem and answered correctly that it
survives in the history. A throwaway repository was built to show it: the working
tree was clean, `grep` found nothing, and one `git grep` across all commits
returned the password. She was then told directly, as fact rather than as a
question, that rewriting history does not reliably fix it either, because forks
and clones are outside your control and public repositories are scanned
continuously by automated tools. The only real fix is to rotate the credential.
The sentence to keep is that **a secret that has been committed is a secret that
has been leaked.**

*Four. Environments.* This is the one that needed teaching. See the step tracking
below for how it went.

**The `pnpm test:e2e` experiment is the best teaching artifact of the day and is
worth reusing.** The e2e suite was pointed at a copy of her real development
database instead of `:memory:`. Result: **2 failed, 16 passed**, with no
production code changed at all, and the database grew from 4 entries to 10 as the
suite left six fake ones behind. Three points came out of it. Correctness is a
property of code plus environment, not of code alone. The tests that failed were
precisely the two making a claim about the *whole* collection being empty, while
every test claiming only "what I put in comes back out" passed, because a claim
about everything is only true if you control everything. And the suite's result
now depends on what she happens to have written in her journal, which means it has
stopped measuring the code. The spec file was restored with `git checkout`.

**Where to pick up — Block 5.** The understanding is done and the design work has
not started. The open questions for the next session are: whether configuration
should be checked when the application boots or when each value is first used;
where the list of variables that exist gets written down, since nothing records
that `PORT` and `DATABASE_PATH` exist at all; what belongs in `.gitignore`; and
which mechanism to use, with the real candidates being hand-written checks at
boot, `@nestjs/config`, and plain `dotenv`. An ADR is owed once that is settled,
and then a worker prompt. **Do not start Block 5 by presenting a conclusion** —
she has answered at step 1 on most of today's questions and the comparison work is
hers.

Note that the `@nestjs/config` question rhymes with the morning's validation
argument, and the same trap is available: `@nestjs/config` is a real Nest package
but it is still a dependency, and it does not validate anything by itself.

### Day 6 — where she answered, per topic

| Question | Step reached |
|---|---|
| What could go wrong in the two `process.env` reads? | **Step 1**, but general — "it can crash at runtime". Right category, wrong outcome |
| Does `PORT=hello` crash or start? | **Step 2.** Predicted a crash. The experiment corrected it |
| What does the `DATABASE_PATH` typo do? | **Step 1.** Completely correct, with the mechanism, unprompted |
| What is wrong with a hardcoded password? | **Step 1.** Named exposure via a public repository, correctly |
| Is the password safe after you delete it in a later commit? | **Step 1.** Immediate and correct — "it is still available in the commit history" |
| Why not hardcode a connection string that holds no secret? | **Step 3.** Her reason was future-proofing, which this project's own rules forbid, and her "every point where it is hardcoded" argument does not hold because there is one such point. Narrowed once, answer was still vague, so environments were taught directly |
| Does the e2e suite pass against the dev database? | **Asked to be told.** A fair response — the prediction was not answerable without having read the eighteen tests, so the question was badly shaped rather than too hard |

**The teaching finding worth carrying:** the future-proofing correction landed
well and is worth repeating in that form. She reached the right conclusion by an
argument the constitution forbids, and instead of accepting the conclusion she was
shown five real commands from this repository's own history that needed
`DATABASE_PATH`. The problem had already happened five times in five days. Telling
her *"you do not need an argument about the future, because the evidence is in
your own repository"* is a better correction than restating Rule Zero at her.

### Day 6 — LinkedIn

**Correction to the note below under *Next Session Starts Here*: the Day 5 post
was posted.** She confirmed on 2026-08-06 that it went out on 2026-08-05. The
older claim that it was still outstanding is wrong and should be ignored. A Day 5
post was redrafted in this session before she said so, which was wasted effort;
check with her before rebuilding anything that the state file lists as owed.

The **Day 6 post was drafted and covers the first session only**, which is the
problem rather than the solution. Its three beats are the `PORT=hello` Unix socket
result, the `DATABASE_PATH` typo producing a silently empty journal, and the e2e
suite going 16 passed / 2 failed against a real database with no code changed. Its
single quotable line is *"the dangerous configuration bug is not the one that
crashes, it is the one that starts."* It ends by naming tomorrow's work, so the
decision half of Day 6 is still available as its own post and has not been spent.

Two stories remain deliberately unspent: the worker-honesty story from Day 5 (see
*A second LinkedIn story* below), and the secret-in-git-history material from Day
6's first session, which was held back because it belongs with the secret-handling
work rather than with the configuration experiments.

---

Day 5 is fully closed. It was audited, committed, merged through pull request #5
with a squash, and the branch has been deleted. `main` is green: lint, typecheck
and build all pass, `pnpm test` gives 55 tests and `pnpm test:e2e` gives 18.
There is no leftover code work.

⚠️ **The paragraph below is out of date and was corrected on 2026-08-06. The Day 5
post did go out, on 2026-08-05. Nothing about it is outstanding.** It is left here
only so the correction has something to point at.

One thing is still outstanding, and it is hers. The LinkedIn post for Day 5 has
not gone out. A finished draft exists in the Master Thread conversation from
2026-08-05 and covers three things: the `LIKE` wildcard discovery, the idea that
a missing test is usually a missing decision, and the argument for fixing code
that is already scheduled for deletion. She asked for that draft and received it,
so it only needs copying out and posting. If the conversation is gone, it can be
rebuilt from ADR-006 and the notes below. There is also a second, separate story
that was deliberately kept out of that post, described further down under
*A second LinkedIn story*.

Note on the merge, since it departs from the usual pattern. Git actions are
normally hers alone. Day 5 was committed, pushed, opened as a pull request and
merged by the Master Thread because her husband asked for it directly on
2026-08-05. That was a one-off instruction and does not change the standing rule.

The audit found no defects and required no rework. The full detail is in
`docs/learning/day-05/report.md`, which holds the worker's own report followed by
the Master Thread's independent verification of it.

**Day 6 is the next working day.** Its brief is written out in full further down,
under *Day 6 — the brief already prepared*.

### What Day 5 decided

Five decisions were made. All of them are written up with full reasoning in
[ADR-006](decisions/ADR-006-strict-input-and-mutation-semantics.md). Four of the
five were hers, and it is worth recording which, because the point of this
project is that she can defend the decisions later.

She decided that both `POST` and `PATCH` should reject a body containing any
field the server does not recognise, and answer with a 400. She reached this by
working through what happens when somebody misspells a field name on an update.
Under the old behaviour of quietly ignoring unknown fields, `PATCH` with
`{"contnet": "I fixed my typo"}` would answer `200 OK` and change nothing at
all. The user would believe their correction had been saved. She said that was
unacceptable and that the server has to tell the client to send the data
correctly.

She decided that a repeated query parameter, such as `?word=a&word=b`, should be
a 400 rather than the `200` with an empty list that it used to produce. She got
there by applying the test she learned on Day 3, which is to ask whether the
client could fix the problem by sending a different request.

She decided that the `%` and `_` characters in a search term should be escaped
and treated as ordinary text. She chose this over two alternatives that were put
to her, which were rejecting any search containing those characters, and
declaring wildcard searching to be a deliberate feature. Her reason was that the
other two options are not friendly to the person using the product.

She decided that `DELETE` should answer with a 200 and the entry that was
deleted, rather than the more conventional `204 No Content`.

The fifth decision was mine rather than hers, and that is worth flagging. I
recommended keeping validation hand-written and extracting the shared parts into
one function, instead of adopting a validation library. She accepted this without
arguing it, at close to midnight. Since she did not push back on it at all, it is
worth confirming with her when she is fresh that she actually agrees.

That fifth decision was not optional to consider. ADR-005 had named Day 5 in
advance as the day to reconsider hand-written validation, on the grounds that a
partial update duplicates the rules of a create. That condition fired exactly as
predicted, so it was reconsidered properly rather than skipped. The outcome was
to defer a library again, and ADR-006 replaces ADR-005's rather vague trigger
with four specific ones. See the amendment note below, because the reasoning
behind this deferral turned out to be weaker than first written down.

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

### Day 6 — the brief already prepared

This was written at the end of Day 5 and given to her, so a fresh Master Thread
should continue from it rather than invent a new one.

The problem for Day 6, taken from the roadmap, is *"my database password is in a
committed file."* There is no password in the project yet, and that is precisely
why this is the right moment to look at configuration, before there is a secret
to leak.

Two places in the code read the environment directly and trust whatever they
find. `main.ts` line 6 reads `process.env.PORT ?? 3000`, and
`database.module.ts` line 26 reads `process.env.DATABASE_PATH`. Nothing checks
either value, nothing writes down anywhere that these two variables exist, and
nothing stops the application starting up with a value that makes no sense. It
will start happily and then fail later, in a place that gives no hint about the
real cause.

By the end of the day she should be able to explain why configuration is treated
differently from code, what an environment actually is, why a secret needs more
careful handling than an ordinary setting, and why checking configuration when
the application starts is different from checking it the first time it gets
used.

The format should be the same one that worked on Day 5, which is to read, then
predict, then break, then observe. This topic breaks in ways that are easy to
watch. Setting `PORT=hello` and starting the server should teach her something
within about thirty seconds.

Two things from Day 5 connect directly into Day 6, and both are worth using.

The first is the idea she took away from Day 5, that a missing test is usually a
missing decision. It applies here without any modification. Nobody has decided
what `DATABASE_PATH` should mean when it is missing, or when it holds nonsense,
or when it points at a location the process cannot write to.

The second is that an environment variable is a trust boundary, exactly like a
request body or a query parameter. `process.env.PORT` has the type
`string | undefined`, and the code treats it as though it were a port number.
That is the same category of mistake she found twice on Day 5, so she has a
model for it already and should be asked to spot it rather than told.

### Decision taken on the morning of Day 6: validation moves to Nest's own approach, on Day 7

The Master Thread reopened yesterday's fifth decision, which was the only one of
the five that was mine rather than hers, and which she had accepted near midnight
without arguing it. She did not agree with it once she was fresh.

Her position is that the project should adopt Nest's own validation approach,
meaning `class-validator` together with a global `ValidationPipe`, and that `zod`
should be rejected. This reverses the ADR-005 and ADR-006 deferrals.

Two things happened during that conversation which are worth keeping, because the
reasoning she started with was not the reasoning that survived.

Her first argument was that `class-validator` is built into Nest and so costs
nothing, whereas `zod` is an extra dependency. That premise is false and she saw
it proved. `ValidationPipe` is exported by `@nestjs/common`, but constructing one
without `class-validator` installed fails immediately with the message *"The
class-validator package is missing."* Nest ships the socket and not the plug. The
true dependency count is zero for hand-written, one for `zod`, and two for the
Nest approach, which makes her chosen option the most expensive on the exact axis
she argued from.

Her second argument was that a library increases accuracy. She then predicted,
correctly, that `@IsNotEmpty()` would accept a string of three spaces and return
a 201, which breaks her own Day 4 rule that content must hold at least one
non-whitespace character. This was confirmed by running `isNotEmpty` from the
real package: `""` is false, but `"   "` and `"\t\n"` are both true. The
conclusion drawn was that a library increases *consistency* rather than accuracy,
because accuracy is the question of whether the rule you wrote is the rule you
meant, and no library can know what you meant. The sentence worth reusing is that
**a decorator whose name sounds like your rule is not your rule**, which is the
same shape as her own Day 5 lesson that a missing test is usually a missing
decision.

The argument that actually justifies her decision was supplied by the Master
Thread, because it depends on the Known Debt list rather than on anything visible
in the code. Validation here is enforced by memory and not by mechanism: nothing
forces a future endpoint to validate its body, and a forgotten check passes lint,
typecheck, build and every test. A global pipe runs before every controller
method whether anyone remembered it or not, and `forbidNonWhitelisted: true`
expresses her Day 5 unknown-fields rule as one setting rather than as code called
in two places.

She chose to keep Day 6 for the configuration problem the roadmap set, and to
carry this out on Day 7, which is the review day and exists for exactly this kind
of refactor.

**Owed on Day 7:** ADR-007 recording this properly, the implementation itself,
and a deliberate decision about how to express the non-whitespace rule, since
`@IsNotEmpty()` demonstrably does not.

### A second LinkedIn story, deliberately held back

Day 5 contains a second story that was left out of the post on purpose, because
putting both in one post would weaken each of them.

When the worker agent finished the implementation, it was asked whether
extracting the shared validation had genuinely removed the duplication it was
being credited with removing. It answered no. Its words were that one optional
field is not a schema, and that the duplication had never had room to form in the
first place. It reported a weaker version of its own success without being
pushed, and ADR-006 was amended because of it.

That is a good story for an audience thinking about how to work with AI agents,
and it stands on its own. It has not been drafted yet.

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

| [ADR-007](decisions/ADR-007-configuration-and-boot-validation.md) | Configuration is read and checked once, at boot; a bad value refuses the boot. `PORT` defaults to 3000 when absent and must otherwise be a whole number 1–65535, with no trimming. `DATABASE_PATH` empty refuses; set-but-missing warns loudly then creates. `.env` at the repository root, gitignored, loaded by Node's `--env-file-if-exists`; `.env.example` committed. `@nestjs/config` with a hand-written `validate` | Accepted, **amended the same day** (three corrections). Implemented and audited; one follow-up test outstanding. Revisit Day 19 (optional config) / Day 24 (real secrets) |

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
| **Nothing forces a third environment variable into the validator** | New Day 6, and the same memory-not-mechanism class as the row below. A variable added straight to `process.env` and read somewhere new would bypass every rule in `env.validation.ts`. Partly mitigated: one test pins the exact set of variables `validate` returns, so a *silent* expansion is caught |
| **The configuration wiring was untested until the follow-up task** | New Day 6, found by the audit. Deleting `validate,` from `ConfigModule.forRoot` left typecheck, build, 80 unit tests and 21 e2e tests all green on an application where the whole day's work was disconnected. `docs/workers/day-06-wiring-test.md` closes it. **Until that task is run and audited, this is open** |
| **Three unused `dotenv` packages are installed** | New Day 6. `@nestjs/config` bundles `dotenv` at two versions plus `dotenv-expand`, and `ignoreEnvFile: true` means none of it runs. Cost of choosing the framework's own module; recorded in ADR-007 Amendment 1 |
| **A `.env` in `apps/api/` is silently ignored** | New Day 6, accepted knowingly. The start scripts load `../../.env` from the repository root. Because `.env` is gitignored, nothing warns. `.env.example` documents the rule instead |
| **Validation is enforced by memory, not by mechanism** | Nothing makes a future endpoint validate its body. A forgotten check passes lint, typecheck, build and tests. This is ADR-005's accepted cost and its named revisit condition — the same failure class as the Day 3 `ORDER BY` bug. Day 5 shrank it but did not remove it: `POST` and `PATCH` now call the same two checking functions, so the *rules* exist once, but nothing forces a third endpoint to call them. **Scheduled for removal on Day 7** — she decided on the morning of Day 6 to adopt a global `ValidationPipe`, which is a mechanism rather than a memory. See *Decision taken on the morning of Day 6* above |

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
| ~~`process.env.PORT` and `DATABASE_PATH` read raw and unvalidated~~ | ✅ **Resolved Day 6** — ADR-007. Checked once at boot; `dist/` contains no `process.env` at all |
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

**Opened on Day 6 — introduced by the worker, not yet learned:**

- **`ConfigModule.forRoot` and `ConfigService`.** She chose `@nestjs/config`
  deliberately, so the wiring is the thing she wanted to learn, and she has not
  yet seen it. Worth asking her to explain what `isGlobal: true` buys, why
  `database.module.ts` needed a factory with `inject: [ConfigService]` when it
  previously computed its path at module load, and where `validate` is actually
  called from. The audit established that `require()` on `app.module.js` does
  **not** trigger it — Nest does, when it initialises the module — and that is a
  good prediction question.
- **Why configuration must be injected rather than imported.** The compiled `dist/`
  now contains no `process.env` at all. She has not been shown that, or why it
  is the same argument as the `DATABASE` token she already understands.
- **The `undefined` round-trip quirk.** `@nestjs/config` writes `validate`'s
  return value back into `process.env`, where `undefined` becomes the string
  `"undefined"`. Small, concrete, and a good example of a library's behaviour
  differing from its documentation.

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
