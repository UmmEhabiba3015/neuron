# Continuing Neuron On A New Machine

Everything needed to pick this project up somewhere else. Written on
2026-09-04, at the end of Day 8.

---

## 1. What the machine needs

| Thing | Version here | Notes |
|---|---|---|
| Node | v24.18.0 | Must be 22 or newer. The start scripts use `--env-file-if-exists`, which does not exist in Node 20. |
| pnpm | 11.17.0 | `corepack enable` is the least painful way to get it. npm and yarn will not work — this is a pnpm workspace and the lockfile is pnpm's. |
| git | any recent | |

A note on `better-sqlite3`: it is a native module and compiles on install. On
Linux that needs build tools present (`build-essential` on Debian and Ubuntu,
`gcc-c++ make` on Fedora). If `pnpm install` fails with a node-gyp error, this
is why.

## 2. Getting it running

```bash
git clone <repo-url> neuron
cd neuron
pnpm install
cp .env.example .env      # every value in it is already the default
```

At this point there is **no database**, and that is expected. The file is
created automatically on first run but the tables are not — the schema comes
from migrations and the API never applies them itself:

```bash
pnpm migration:run
```

Then:

```bash
pnpm dev                  # http://localhost:3000/entries
```

Verify with the full check, which is what every audit runs:

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
```

Expected at Day 8: everything clean, 108 unit tests, 35 end-to-end tests.

## 3. Moving the existing journal

`apps/api/data/neuron.db` is gitignored, so cloning gives an empty database.
To carry the real one across, copy the file directly and then run
`pnpm migration:run` on the new machine.

**If that database was created before Day 8** it has no `migrations` table, and
migrations cannot run against it — TypeORM will try to create `entries`, which
already exists. The repair is in the README under "Migrations": one row is
inserted to record the initial schema as already applied, and then
`pnpm migration:run` works normally. Read that section rather than improvising;
it documents two ways of getting it wrong that were both hit in practice.

## 4. What is NOT in git, and matters

This is the part most likely to be lost in a move.

**Gitignored and local-only:**

- `docs/workers/` — every worker prompt ever written, about 96K
- `docs/learning/**/report.md` — every worker report and audit result, about
  252K of the two combined
- `.env` — recreate it from `.env.example`
- `apps/api/data/neuron.db` — the journal itself

The worker prompts and reports are the written record of how each day's work
was specified and what the audit found. They are not needed to run the project
and they are the main history of how it was built. **Copy `docs/workers/` and
`docs/learning/` across by hand** — or decide to commit them, which is an open
question below.

**Committed and safe:** all source, all tests, all ten ADRs, the roadmap, the
constitution, the master prompt, `master-state.md`, and
`docs/learning/day-08/study-typeorm.md`.

## 5. The Claude Code memory

The mentoring thread keeps memory outside the repository, at:

```
~/.claude/projects/-home-<user>-Workspace-neuron/memory/
```

Six files live there, indexed by `MEMORY.md`: the learner profile, the worker
workflow, the day numbering, the teaching mode, the communication style, and
the testing approach. They are not in git and they are not automatically
carried anywhere.

**Copy that whole directory to the new machine.** The path contains the
username and the project location, so on a different machine or a different
folder the directory name changes — create the new path and copy the six files
plus `MEMORY.md` into it.

Without them a new session loses the teaching rules, and the effect is not
subtle: the register drifts back to terse status-report English, questions stop
coming before answers, and the day structure disappears. Section 6 restates the
rules so they can be rebuilt if the files are lost.

## 6. How this project is run

These rules are the accumulated result of eight days, several of them learned
by getting it wrong first.

### Roles

The **Master Thread** is a permanent Claude session acting as principal
engineer, architect and mentor. It does **not** write production code. It
teaches, writes ADRs and roadmap updates, authors worker prompts, and audits
what workers produce by re-running every check itself rather than trusting the
report.

**Worker agents** are fresh Claude Code sessions given one prompt file from
`docs/workers/`. They implement, run the checks, and write a report. They never
touch git — branching, committing and merging are human actions on this
project.

**The learner** decides. Every architectural choice is put to her as a question
before it is made, and her answer is recorded even when it was later revised.

### The teaching sequence

Three steps, and the trigger for moving on is **rounds, not difficulty**:

1. An open question. What do you think happens, and why?
2. If that does not land, one narrowing question.
3. If that does not land, teach directly — then verify with a prediction and an
   experiment she runs herself.

Do not skip to step 3 because a topic seems hard. Do not linger on step 1 after
two rounds.

**Demonstrate before asking her to produce.** She raised this directly and she
was right: being asked to generate something she has never been taught is not a
Socratic question, it is a test with no lesson in it. Work one example first,
then ask.

### Writing style

Simple, complete, descriptive English. Explain terms rather than assuming them.
No compressed idiom.

Specifically avoid, because these are the habits that keep coming back: tables
where prose would explain better, bold used to make phrases feel important
instead of writing an important sentence, terse status fragments like
"Confirmed." or "No defects.", stacked em-dashes, and headings used as a
substitute for explanation.

This applies to every message in the project, including status reports to her
husband, who has had to make the correction twice.

### The shape of a day

Open with a short brief — what today is about and why, in a few lines. Then
take **one block at a time**, and do not preview later blocks. Each block opens
with questions rather than answers.

A day ends with an audit, and the audit includes a mutation: delete the line
that makes the day's work load-bearing and run everything. If it all still
passes, the day shipped untested wiring. This has happened three times.

A day ends merged.

### Testing

She is not required to hand-write test suites. AI writes tests in practice, so
the durable skill is judgement — what does this suite fail to cover? — rather
than typing assertions. Run testing lessons as **read, predict, break,
observe**.

### Comments in code

Swept on 2026-09-04, from 926 comment lines down to 218. The standard from here:
**a comment earns its place by preventing a specific mistake.** Reasoning about
why a decision was made belongs in an ADR; a comment is for the trap that a
future reader would otherwise walk into — that `created_at` must stay TEXT, that
`@ValidateIf` is not interchangeable with `@IsOptional()`, that the escape order
in `escapeLikePattern` fails silently if reversed.

Narrative comments explaining what the code does are not wanted.

## 7. Open questions for whoever picks this up

1. **Should `docs/workers/` and the reports be committed?** They are the record
   of how the project was built and they are currently one disk failure from
   gone. The original reason for ignoring them was that they are working
   artifacts rather than source. That reason is weaker now that there are eight
   days of them.
2. **Four stale branches** exist locally and on the remote:
   `day-02-persistence`, `day-06-configuration`, `day-07-validation`,
   `day-08-identity`. All are merged. They were deliberately left alone rather
   than deleted.
