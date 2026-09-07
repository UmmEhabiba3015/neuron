# Handoff — starting a new Master Thread

**Written:** 2026-09-04, after the maintenance pass and before the machine move.
**Updated:** 2026-09-06, after the Day 8 TypeORM study session closed the debt.
**Read this after** `master-prompt.md`, `constitution.md`, `roadmap.md` and
`master-state.md`, in that order. This file says what to do first; those four
say who you are and where the project stands.

---

## The state in four sentences

Day 8 is complete and merged. Day 9 has not started. The working tree is clean,
and the last three commits are a maintenance pass that changed no behaviour.
Everything verified on 2026-09-04 by re-running rather than by reading a report:
lint, typecheck and build clean, 108 unit tests, 35 end-to-end tests.

**Branch note.** The maintenance work has since been merged; `main` is at
`95ec3db`, which is that commit. Nothing is waiting on a merge.

---

## The first thing you do

**Day 8's TypeORM debt is repaid ✅ and Day 9 is unblocked.** The session ran on
2026-09-05/06 from `docs/learning/day-08/study-typeorm.md`, against the real
repository, on copies of the database. **All seven topics were answered at step
1** — no topic needed teaching before she produced the mechanism. The per-topic
record, with the misses written down, is in `docs/learning/day-08/report.md`
under *Study session: TypeORM*. Read it before teaching anything that builds on
TypeORM, because it says exactly which details she has seen run and which she
has only read.

**Do this before Day 9 needs a migration.** `apps/api/data/neuron.db` predates
migrations and is **not baselined**. The next `pnpm migration:run` against it
fails with `table "entries" already exists` — demonstrated on a copy during the
study session, exit code 1, transaction rolled back, no data lost. Day 9 adds a
credential column, which means a migration, so this will be hit. The repair is
one row and is documented in the README under *A database created before
migrations existed*. It was deliberately not run during a study session, because
altering her actual journal is not a side effect a teaching session should have.

**Three corrections found while running the session**, all still unfixed and
none urgent:

- `docs/learning/day-08/study-typeorm.md`'s topic-2 premise is **wrong**. It
  claims the ownership check `entry.userId !== callerId → deny` "passes for
  everybody and hands every journal to every user". With `callerId` guaranteed
  to be a string, `undefined !== callerId` is pinned to `true`, so it denies
  everybody. She caught this and defended it against two rounds of pressure
  toward the prompt's answer. The real danger is subtler and worth rewriting the
  section around: the check does not invert, it **stops being a check**, and a
  test asserting "Bob cannot read Alice's entry" passes for the wrong reason.
- The comment on `userId` in `entry.entity.ts` says the property is "simply
  absent" from loaded entities. It is **present, holding `undefined`** —
  `'userId' in loaded` is `true`. No behavioural consequence; it is why
  `JSON.stringify` still omits it.
- The study prompt refers to `entry.interface.ts`, renamed to `entry.entity.ts`
  in `95ec3db`.

**Also still open, and lighter:** `transform: true` from Day 7 was offered and
declined. It is worth ten minutes on Day 14, not a day of its own.

---

## Then Day 9, and it is the heaviest day on the roadmap

Day 9 carries its own work — password hashing, registration, login — plus the
identity work Day 8 did not reach, which is issuing and verifying a token and
having an endpoint that can name its caller.

**Decide with her at the start of the day whether it splits.** If it does, it
splits at "a user exists" and "a request is identified", and Day 20 is the slack
that absorbs it. Make that call in the first hour rather than discovering it at
hour six.

---

## What she is like to work with

She is genuinely good at this, and the way she is good matters for how you teach
her.

Her predictions are frequently right and right for the correct reason. Asked
what a misconfigured database path would do, she said the application would not
crash — it would create a new empty file and return an empty list. That is a
subtler answer than "it crashes", which is what most people say. Asked to
compare sessions with stateless tokens, she articulated unprompted that a stolen
token stays cryptographically valid after a logout from another device, so the
server cannot revoke it. She then chose the token approach anyway, having named
the strongest argument against it. That is recorded in ADR-009.

She pushes back, and she has been right when she did. She rejected a schema
validation library because it was "just additional complexity and we do not need
it since we have a built-in way" — the project's own principle, applied against
the person who wrote the principle. She also said, bluntly, *"how would I know, i
did not learn this, i am doing it for the first time, why you ask me stuff before
teaching me."* She was correct. **Demonstrate before asking her to produce.**
Being asked to generate something she has never been taught is not a Socratic
question, it is a test with no lesson in it.

Where she is weaker: pace, and closing topics. Multi-day gaps have happened, and
she has felt the public commitment during them. She sometimes chooses to move
past a topic rather than finish it, which is what the learning-debt tracking
exists for.

**On pace, the framing that works is behavioural rather than motivational.** The
target is a day that ends merged, because a day that stops mid-block pays for
part of itself again on the next start. Do not turn this into pressure about the
day count. The roadmap's *A Note On Pace* section has the wording.

---

## Things you will get wrong if nobody tells you

These are real failures from the first eight days, recorded so they are not
repeated.

**Do not trust a worker's report.** Re-run every check yourself. An audit once
accepted a result that contradicted the code, and the cause turned out to be a
server the previous worker had left running for twelve minutes holding port
3000. Check what holds the port before concluding anything.

**"Successfully started" is printed before the server listens.** Grepping for it
once reported a dead process as healthy. Check the exit code and the port.

**Every day ends with a mutation check.** Delete the line that makes the day's
work load-bearing and run everything. If it all still passes, the day shipped
untested wiring. This has happened three times: `validate,` on Day 6, the
`APP_PIPE` provider on Day 7, `synchronize: false` on Day 8. Each passed every
check at the time it was found.

**You will teach something wrongly.** It happened with `ConfigModule.forRoot` —
the claim was that it only registers and Nest calls `validate` later, and a
worker that read the library source found it runs synchronously at import. Own
the correction in front of her and amend the ADR. She learns more from watching
a wrong claim get corrected by evidence than from a claim that was right.

---

## The rules, compressed

The full versions are in `docs/SETUP.md` section 6, and in the memory files.

You are principal engineer, architect and mentor. **You do not write production
code.** You teach, write ADRs and roadmap updates, author worker prompts in
`docs/workers/`, and audit by re-running everything yourself.

Teaching is three steps and the trigger for moving on is **rounds, not
difficulty**: an open question, then one narrowing question, then teach directly
and verify with a prediction and an experiment she runs herself.

Open each day with a short brief, then take **one block at a time**. Do not
preview later blocks.

Write in simple, complete, descriptive English. No tables where prose works
better, no bold used to make phrases feel important, no terse status fragments,
no stacked em-dashes. This applies to messages to her husband too; he has had to
make that correction twice.

She is not required to hand-write test suites. Run testing as **read, predict,
break, observe**.

Comments in code earn their place by preventing a specific mistake. Reasoning
belongs in an ADR. This was swept on 2026-09-04, from 926 comment lines to 218 —
do not let it grow back.

---

## The machine move

`docs/SETUP.md` is the full guide. The two things most likely to be missed:

**The agent memory directory does not travel with git.** It lives at
`~/.claude/projects/<project-path>/memory/` and the path encodes both the
username and the project location. A copy is committed at
`docs/archive/agent-memory/` — seven files. Create the new path and copy them in.
Without them a new session loses the teaching rules and the register drifts back
to terse status reports within a few messages.

**The journal database is gitignored.** `apps/api/data/neuron.db` must be copied
by hand, and then `pnpm migration:run` on the new machine. If it was created
before Day 8 it has no `migrations` table and needs the baselining step in the
README's *Migrations* section — read it rather than improvising, it documents two
ways of getting it wrong that were both hit in practice.

**`docs/archive/` is to be gitignored again after the move**, per the owner's
instruction. The committed copy stays recoverable in history.
