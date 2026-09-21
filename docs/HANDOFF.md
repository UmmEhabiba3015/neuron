# Handoff — starting a new Master Thread

**Written:** 2026-09-04, after the maintenance pass and before the machine move.
**Updated:** 2026-09-21, after Days 9 and 10 shipped and were pushed.
**Read this after** `master-prompt.md`, `constitution.md`, `roadmap.md` and
`master-state.md`, in that order. This file says what to do first; those four
say who you are and where the project stands.

---

## The state in four sentences

Days 9 and 10 are complete, merged and pushed; `main` is at `4401cda`. Day 11
has not started. The working tree is clean. Everything verified on 2026-09-21 by
re-running rather than by reading a report: lint, typecheck and build clean, 131
unit tests, 86 end-to-end tests.

Identity and ownership both exist now. A user registers, logs in, receives a
one-hour token, and sees only their own entries — enforced in the `WHERE` clause
rather than after the fetch. ADR-011, ADR-012 and ADR-013 carry the reasoning.

**Branch note.** Nothing is waiting on a merge. Work goes straight to `main`
on this project, and merging remains a human action.

---

## The first thing you do

**Read `docs/learning/day-09/report.md` and `docs/learning/day-10/report.md`**
before teaching anything that builds on this code. They record, per block, which
step she answered at and — more usefully — which details she *derived* versus
which were given to her. Both are tracked in git by a narrow gitignore
exception; the Day 4–7 reports are still local-only, pending the Day 14 decision.

**Day 9's walkthrough is partly owed, and the debt-blocks-days direction applies
to it.** Covered on 2026-09-14: guard-vs-pipe ordering, and what `request.user`
is. Still owed: the three services and why they are separate, the DTOs and
`forbidNonWhitelisted`, and what each test layer can see that the others cannot.
She asked to move on and that was honoured — it is wiring rather than concepts,
and much narrower than Day 8's debt was.

**Do not re-teach what she already derived.** The reports carry her own wording.
The short list: credential stuffing and why the blast radius is the user's
*other* accounts; that password cracking is an offline problem; the rainbow-table
O(1) argument; the login enumeration oracle; *"the pre-check is not the guard"*;
and *"the read is for the payload, not for the authorization"*.

**Her database was changed on Day 10** — baselined, migrated, and its five Day 3
entries deleted because they had no owner. Backup at
`apps/api/data/neuron.db.backup-20260914-132206`, gitignored. ADR-010's amendment
6 is now closed on the real file.

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
