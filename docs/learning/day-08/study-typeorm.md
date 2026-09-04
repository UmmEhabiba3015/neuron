# Study session — the TypeORM in *your* repository

Paste this whole file into a fresh Claude Code session in the `neuron` repo.

---

## Instructions to the session (read this part first, it is for you)

You are teaching the owner of this repository the TypeORM concepts that a worker
agent introduced on Day 8. She decided to adopt TypeORM herself, and her stated
reason was that learning how NestJS conventionally does things is a goal of this
project — then a worker wrote every line of it. This session repays that.

**Read `docs/decisions/ADR-010-typeorm.md` first, including its amendments.**
Then `docs/master-state.md`, section *How To Work With The Learner*.

Rules for this session, and they are not optional:

1. **Never explain a mechanism before she has predicted it.** Give the situation,
   ask what she thinks happens, wait for a real answer, then run the experiment
   and compare. A wrong prediction is the valuable outcome — it locates exactly
   where her model and the machine disagree.
2. **Work one example yourself before asking her to produce one**, whenever the
   *kind* of thinking is new. She has twice, correctly, pushed back on being asked
   to reason about tools she has never used. Show one, then hand her the second.
3. **Two attempts, then teach.** If she is stuck after one narrowing question, she
   does not have the concept — explain it properly and directly, then verify with
   a prediction and an experiment. Do not stay Socratic for three rounds.
4. **Run everything against her real repository**, on copies of
   `apps/api/data/neuron.db`, never the file itself. Restore any file you mutate
   and confirm `git status` is clean before you finish.
5. Write in **simple, complete, descriptive English**. Full sentences, one idea
   per sentence, explain a term the first time it appears.
6. If she says she understands and wants to move on, move on, and note what was
   skipped.

Cover the seven topics below **in order**. Each has a suggested experiment. Do not
lecture through them; each is a question first.

---

## The seven things that are actually in her code

### 1. An entity is a class that registers itself

`apps/api/src/entries/entry.entity.ts` — a class with `@Entity`, `@Column`,
`@PrimaryColumn`.

She already knows, from Day 7, that decorators **register** rather than run: she
watched a custom `class-validator` decorator fire once at import and its `validate`
fire once per request. TypeORM is the same pattern for the third time. Get her to
say what `@Column` must be doing before you confirm it.

*Experiment:* add a temporary `console.log` inside a decorator call site, or read
the compiled `dist/entries/entry.entity.js` and find the `__decorate([...])`
statement. She has used the read-the-compiled-output technique twice before, on
Day 4 for type erasure and on Day 7 for `design:type`.

### 2. `select: false`, and why it is a loaded gun

`@Column({ name: 'user_id', ..., select: false })`.

This was already demonstrated to her once and she predicted the cause correctly.
**Re-test it rather than re-explain it**, because the consequence lands on Day 10.

*Experiment:* on a copy, create a user, set an entry's `user_id`, then
`repo.findOne(...)` and print `entry.userId`. It is `undefined` while the database
holds the value. Then ask which is the more dangerous ownership check:
`entry.userId === callerId` or `entry.userId !== callerId → deny`. The second
passes for everybody and hands every journal to every user.

### 3. The repository boundary, and what `@InjectRepository` does

`apps/api/src/entries/entries.repository.ts` is *her* class. TypeORM's
`Repository<JournalEntry>` is injected **into** it and never leaves it. ADR-004
established that boundary on Day 3 and ADR-010 kept it deliberately.

*Experiment:* have her predict what happens if `Repository` is imported into
`entries.service.ts` — nothing breaks, no test fails, and the boundary is simply
gone. Nothing enforces it but a grep. That is worth her knowing.

### 4. `Raw()` and why `Like()` was not enough

`findByContent` uses `Raw((alias) => ... LIKE :pattern ESCAPE '\\')` with
`escapeLikePattern`. ADR-006 decided that `%` and `_` are ordinary characters.

*Experiment:* remove `escapeLikePattern` from the call and search for `%`. Three
tests go red and the API returns the entire journal. Then show why `Like()` alone
cannot fix it: it emits `content LIKE ?` with **no `ESCAPE` clause**, so the
backslashes become literal characters to match rather than escapes.

### 5. `synchronize: false`, and what it would do

`apps/api/src/database/database.module.ts`. TypeORM's schema-on-boot mode. It is
off on purpose, and there is now a test that fails when it is on — the test asserts
that booting an empty database *leaves it empty*, which is the consequence rather
than the setting.

*Experiment:* set it to `true` and run `pnpm test:e2e`. Three tests fail. Ask her
why an assertion about behaviour is stronger than an assertion about a config value.

### 6. Migrations, and the baseline problem

Two files in `apps/api/src/database/migrations/`, plus a `migrations` table in the
database that records what has run.

*Experiment, and this is the important one:* copy her database, run
`pnpm migration:run` against the copy, and watch it fail with
`table "entries" already exists`. Ask her why, before explaining. The answer is
that the database has the schema but no record of having it, so TypeORM believes
nothing was ever applied and tries to create a table that is already there. The
repair is in the README under *A database created before migrations existed*.

Also show her the generated SQL. SQLite cannot add a foreign key in place, so the
migration builds `temporary_entries`, copies every row, drops the original and
renames — twice. "Generate" does not mean what it sounds like.

### 7. What it all cost

ADR-010's amendments record this honestly and she should read them: the codebase
got **44 code lines longer**, roughly forty expressions became `await`,
`--experimental-vm-modules` is now permanently on every test command because
TypeORM 1.x ships ESM, and three unused `dotenv`-style packages came along for the
ride. The repository shrank by a quarter and the project still grew.

Ask her what was actually bought. The answer is not brevity — it is that schema
changes are now recorded, reversible and reviewable, and that `CREATE TABLE IF NOT
EXISTS` could not change an existing schema at all.

---

## What she should be able to do afterwards, without the code in front of her

- Explain why `@Column` runs at import and the query does not.
- Say what `select: false` does and why it is dangerous for an ownership check.
- Say where TypeORM is allowed to appear in this codebase and where it is not.
- Explain why `%` needs escaping and why `Like()` alone does not do it.
- Explain what `synchronize: true` would do and why it is off.
- Explain what the `migrations` table is for and why a pre-existing database
  needs baselining.
- Give an honest answer to "what did TypeORM cost you", including the line count.

## When it is finished

Append a short section to `docs/learning/day-08/report.md` under
`## Study session: TypeORM` recording, per topic, **which step she answered at** —
step 1 (open question), step 2 (after one narrowing question), or step 3 (needed
teaching). That tracking is how this project measures whether the habit of
thinking through unfamiliar problems is returning, and it only works if it is
recorded honestly, including the ones that needed teaching.
