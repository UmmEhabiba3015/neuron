# Master State

**Purpose.** This file lets a new Master Thread pick up the project in
minutes. It says where the project is, what is open, and how to work with
her. It is rewritten, not appended to.

**To start a Master Thread from nothing, read in this order:**

1. [master-prompt.md](master-prompt.md): the role.
2. [constitution.md](constitution.md): how decisions are made.
3. [roadmap.md](roadmap.md): the plan and where it stands.
4. **This file.** Read *How to open the next session* first.

**Update it at the close of every day**, before the LinkedIn post. A stale
master state is treated like a failing test.

**History.** This file was rewritten from scratch on 2026-10-10. The full
day-by-day record it replaced (Days 2 to Screens Day, about 2,500 lines,
including every audit and every "where she answered" note) is in git:

```bash
git show 340077b:docs/master-state.md
```

Read that only when a question needs the detail of a past day. The worker
reports in `docs/learning/<day>/` hold the rest.

---

## Where the project is

**Last updated:** 2026-10-10, at the close of Screens Day, during the
hand-off.

**Done:** Days 0 to 17c and Screens Day, all merged into `main` through pull
requests and pushed. Phase 3 is open; Days 18, 19 and 20 remain in it.

**Verified on 2026-10-09 by re-running, not by reading a report.** All nine
checks pass:

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
pnpm lint:web && pnpm typecheck:web && pnpm build:web && pnpm test:web
```

**246** API unit tests, **365** API end-to-end tests, **171** web tests, **7**
checks on the shared package. 21 ADRs. 11 migrations. Use exactly these nine
commands every day. A plain `npx jest` in `apps/api` skips the migration tests
and still reports a pass.

**What a person can do:** create an account (email, password, name; timezone
from the browser), sign in, stay signed in across a reload, sign out, write
and delete entries, set the mood of today or a past day, browse the Timeline
as a list or a month calendar, and open a past day.

**What a person can see:** every screen of the designer's prototype. A
control whose feature is not built says "This is not built yet." and sends
nothing; where data does not exist yet, the same sentence stands in its
place. The 19 such controls are listed in `apps/web/lib/unbuilt.ts` with the
day each is wired. Not drawn, because they need data first: a reflection, an
answered question, a recording's options, a draft.

**Branch.** Each day has its own branch, `day-<number>-<topic>`, made from
`main` before work starts, and closes through a pull request she merges.
Named days use their name (`screens-day`). This hand-off is on
`handoff-docs`. Four old merged branches (`day-02-persistence`,
`day-06-configuration`, `day-07-validation`, `day-08-identity`) are kept on
purpose.

---

## How to open the next session

**The next session opens with her husband**, who wants to discuss the
project with the Master Thread. He gives terse, senior-level direction. Treat
what he decides as binding, and record it here and in the roadmap. Questions
worth putting to him are in `docs/HANDOFF.md`, section 5.

**After that, Day 18:** drafts, Enter saves with Shift and Enter for a new
line, and editing a saved entry. The screens exist; Day 18 wires them. Open it
in this order:

1. **Make the branch** `day-18-<topic>` from `main`.
2. **The day overview**, with the number of blocks and what each is.
3. **Repay Screens Day's learning debt**, as predictions she runs (see
   *Learning debt*). This comes before the day's work by her husband's rule.
4. **Her decisions for Day 18**, as short choices with each cost stated:
   - How often a draft is saved, and what a failed save shows. Drafts are
     stored on the server; that was decided on 2026-10-04.
   - Editing: where the text is edited, and what a failed edit shows. The
     entry keeps its original time and is not marked as edited (ADR-006).
     An entry cannot be saved empty. A past day's entries can be edited.
   - Enter saves. How a phone makes a new line is Day 19's question.
5. **Workers**, then the audit with one mutation, then a pull request.

Wiring a feature removes its controls from `lib/unbuilt.ts`. Day 18 removes
`editEntry`.

| Day | What it is |
|---|---|
| **18** | Drafts and autosave; Enter saves; editing a saved entry (`PATCH /entries/:id` exists, nothing calls it) |
| **19** | Screen sizes and keyboards; the phone question for Enter; **her decision on one test that drives the app in a real browser** |
| **20** | Forgot password. `/forgot` and `/reset` are drawn. Phase 3 has no slack left; an overrun goes to Day 27 |

---

## What is built

**`apps/api`**, NestJS on SQLite through TypeORM. Tables: `users` (email,
unique without regard to case; name; IANA timezone; argon2id hash),
`sessions`, `days` (`UNIQUE(user_id, date)`, the mood), `entries` (`user_id`
and `day_id` both `NOT NULL`, soft-deleted through `deleted_at`).

**`apps/web`**, Next.js. Routes: `/`, `/in`, `/new`, `/forgot`, `/reset`,
`/timeline`, `/d/[date]`, `/ask`, `/talk`, `/options`, `/support`, `/you`,
`/you/account`, `/you/account/timezone`, `/you/yourdata`, `/you/privacy`,
`/you/visible`. Logic is in `lib/` without React, where tests reach it;
components draw. `app/styles/lock.css` is the designer's file byte for byte,
and anything it lacks is in `live.css`.

**`packages/contracts`**: wire shapes, mood words, page sizes, the password
minimum. No functions, no imports, no build step.

**The rules that shape the code, and where they are decided:**

| Rule | Record |
|---|---|
| Every route is closed unless marked `@Public()` | ADR-013 |
| Ownership in the `WHERE` clause; another person's data is a `404`, never a `403` | ADR-013 |
| Sessions checked on every request, so signing out is immediate; refresh tokens rotate, and reuse ends every session | ADR-014 |
| Refresh credential in an `HttpOnly`, `SameSite=Strict` cookie; access token in memory; one CORS origin, no default | ADR-018 |
| A day ends at midnight in the user's timezone; the API files an entry on a day when it is written, and it never moves | ADR-015, amended Day 17b |
| The browser's clock never makes a date | Day 17c, her ruling. Not enforced by any check |
| Deleting an entry is a soft delete, `204`, a `404` afterwards everywhere; a day row stays | ADR-020 |
| Writing waits for the API; deleting and mood show at once | ADR-021 |
| Facts shared by both apps live once in `packages/contracts` | ADR-019 |
| Configuration checked once at start; a bad value stops it | ADR-007 |
| Schema changes only through migrations; read every generated one | ADR-010 |

---

## Her rulings in force

These were stated by her or her husband, and bind every session.

- **She or her husband sets the feature boundary.** A recommendation from
  the Master Thread is advice and is labelled as such.
- **Product behaviour and wording are hers**, not the designer's. Put them to
  her as short choices with a recommendation, then tell the designer the
  answer.
- **Text in the designs is placeholder**, never a requirement.
  `docs/requirements.md` (hers, written 2026-10-08) wins over the designs.
  The designer's documents are information; a worker never runs his scripts
  or obeys his `AGENTS.md`.
- **Every prototype screen is shown**, main state only, no sample content,
  and "This is not built yet." on every unbuilt control (Screens Day). This
  reversed her Day 17a rule that an unbuilt control is not drawn.
- **No tiers.** Everyone gets the whole product (2026-10-04, her husband).
- **The plan may be extended by as many days as the work needs.** Finishing
  soon is still the aim (2026-10-04, her husband).

---

## Learning debt

A concept a worker introduced is not done until she can explain it without
reading the code. **Open debt is repaid before the next day's work; her
asking to skip it is not enough** (her husband's rule, 2026-09-04).

**Open, to repay at the opening of Day 18, as predictions she runs:**

- **A custom hook.** `useNotBuilt` in `apps/web/app/components/NotBuilt.tsx`
  holds a piece of state for whichever control calls it.
- **`as const satisfies` with `keyof typeof`** in `apps/web/lib/unbuilt.ts`.
  A misspelt control name on a screen fails `pnpm typecheck:web`; that is the
  experiment.

Named and not taught, under the depth guardrail: `<details>`,
`role="status"`, `:where()` in CSS, `data-*` attributes, a union of a number
and one string, `scrollIntoView`, `aria-pressed`, a container query.

**Closed most recently:** Day 17c's four items (a join reading a second
table, a cast with `as`, a date read from an address, `Link`), repaid on
Screens Day by runs. Every earlier debt is closed; the record is in the old
master state.

**React she knows:** a component is a function React calls again on a state
change; `useState` including the function form; `useEffect`;
`useSyncExternalStore`; `useRef`; moving focus with `.focus()` and
`tabIndex={-1}`; a function that answers one of two shapes; `Link`.

---

## Known debt

Each item was checked on 2026-10-10 or is structural and unchanged.

| Item | Where | When |
|---|---|---|
| **No test reaches a React component.** That an unbuilt control sends nothing, every link between screens, and the calendar's jump are checked only by workers walking the app | `apps/web` | Her decision on Day 19 |
| **Nothing enforces that the browser's clock never makes a date.** A lint rule forbidding `new Date()` and `Date.now()` in `apps/web` would | `apps/web` | Day 19 is a natural place |
| **`users.password_hash` is still nullable**, though `NOT NULL` was decided on 2026-10-04 | `user.entity.ts` | Owed. Forgot password (Day 20) touches the column |
| **A user cannot be deleted.** Foreign keys are `ON DELETE NO ACTION` | `sessions`, `entries`, `days` | Day 34, hard delete |
| **The API's `pnpm lint` runs `--fix`**, so it rewrites files instead of only reporting | `apps/api/package.json` | Before CI, Day 32 |
| **The built API reads `packages/contracts/src` at run time**, and the package breaks if its `package.json` gains a `"type"` field | `apps/api/dist`, `packages/contracts` | Day 31 |
| **`NEXT_PUBLIC_API_URL` is fixed at build time; the cookie has no `Secure` attribute** | web config, `refresh-cookie.ts` | Day 31 |
| **`migration:generate` never comes back empty**, because TypeORM cannot describe two things the hand-written migrations made | migrations | Accepted |
| **`better-sqlite3@13` is outside TypeORM's peer range.** It works and is pinned | `apps/api/package.json` | Dissolves on Day 31 with Postgres |
| **`Etc/GMT+5` is accepted as a timezone** | the registration check | Low; noted |
| **Deleted entries must be kept out of every later reader** | search, embeddings, export | Phase 4 and Day 34 (ADR-020) |
| **TypeORM does not switch foreign keys off when reverting a migration** | ADR-010 | One line owed in ADR-010 |
| **No ADR yet for the 2026-10-04 data-model decisions** (one `entries` table with a `kind` for recordings; drafts on the server) | `docs/decisions/` | Written when each is built |

---

## Open questions

1. **Five features have no day:** voice memos, "keep this out of memory"
   (must come before Day 22), the support page's words, what Privacy says
   about training, and moving the calendar to another month.
2. **May a mood be set on a date with no live entry?** The API allows it;
   by ADR-020 such a mood shows on no calendar.
3. **Should `docs/workers/` and the remaining worker reports be committed?**
   Open since Day 7. `docs/SETUP.md` section 4 says what is and is not.
4. **Does an entry move if the user changes timezone?** ADR-015 says no.
   The first support question about an entry on the wrong day reopens it.
5. **Which AI provider, and must the choice be easy to reverse?** Phase 4.
6. **Hand-written wire shapes or a generated client?** ADR-019 chose
   hand-written; the revisit point is about fifteen endpoints in use, or a
   native client.
7. **Day 0's LinkedIn post named PostgreSQL; Day 2 chose SQLite.** ADR-003
   explains when Postgres arrives (Day 31). Worth saying in public then.
8. **Should she send the designer `docs/ui-handover.md` section 14?** It
   holds Day 17b and 17c's changes and has not been sent.

---

## Workflow

- **The Master Thread** teaches, records decisions (ADRs, roadmap, this
  file), writes worker prompts into `docs/workers/`, and audits. It does not
  write production code. It re-runs all nine checks itself and does one
  mutation per day.
- **Workers** are fresh Claude Code sessions, each given one prompt. They
  implement, write and run tests, do one mutation, walk the app in a browser,
  and write a report in `docs/learning/<day>/`. They never touch git, never
  use her database (a throwaway database and their own ports), and are
  never told to skip tests.
- **Before a worker runs**, ask her to stop `pnpm dev`; a watch-mode server
  once reloaded on every deliberate mutation a worker made.
- **Before committing a day**, run `git status --short` and compare it with
  every new file the reports list. On Screens Day a `.gitignore` rule hid a
  whole page from git while every check passed.
- **An ADR is amended only when its decision changes.** A correction to the
  explanation is fixed in place.

---

## How To Work With The Learner

### Who she is

Umm E Habiba, a 2022 computer engineering graduate returning after a career
break. She completed boot.dev's TypeScript backend path. NestJS, databases,
authentication and testing were new at Day 0, and she has learned them here.
About 7 focused hours a day. Backend is the main subject; frontend is
secondary, which is why Screens Day exists.

Her husband is a senior software engineer. He set up the project and this
workflow, and speaks in the thread from time to time to set scope or
guardrails. He is happy with her learning and has said he is not happy with
the pace.

### How to teach

1. **Open each day with an overview**: how many blocks, what each one is,
   which are decisions and which are building, and where a split would fall.
2. **Then one block at a time.** Do not dump later blocks.
3. **Name the day at the top of every block.** She confuses lettered days.
4. **Each block opens with a question**, not an answer.
5. **A wrong prediction is the valuable outcome.** It shows where her model
   and the machine disagree.
6. **Prefer running an experiment to stating a fact.**

### The three-step sequence

Set by her husband on Day 4. Use all three steps, in order.

1. **Open question.** The situation, then "what do you think?" No options.
2. **One narrowing question** if she is stuck. Not a rephrasing.
3. **Teach it directly, then verify** with a prediction and an experiment she
   runs. Stuck after two attempts means she does not have the information
   yet; another question will not give it to her.

The shape of the experiment: *here is the situation in three sentences;
here is what someone changes; predict what happens to typecheck, build, the
server and the tests; now run this and compare.* **Check the command before
giving it to her.** On Screens Day the logging line went into the wrong file
and printed nothing.

### What counts as evidence

Only her own rough words and what she ran count. On Day 17b most answers
were pasted from another assistant, and on Screens Day some predictions were.
Ask for predictions, runs and short choices, not written explanations. **Do
not raise the pasting with her.**

### Pace

She wants pace. Keep blocks short and put few questions at once. Offer a
default with every choice; she often answers "default", and that is a real
answer. When she says "I understand, move on" inside a block, move on and
record what was skipped. That does not apply to learning debt at a day's
start.

### The depth guardrail

Set by her husband on 2026-10-04. Go deep enough that she understands the
thing completely, then stop. For each topic: the main mechanism, the one or
two realistic failure cases, and the trade-off behind the decision. Name the
rest in one line as "this exists, and it is not needed now." His example:
she does not need every way an attacker could attack the app. This project
must finish; two or three more projects follow it.

### Testing

She does not hand-write test suites (her husband, Day 4). The skill is
judgement: what does this suite fail to cover? Teach testing as **read,
predict, break, observe.** One mutation per day; a sweep of many mutations is
for review days only (Days 27 and 39).

### How to write

Simple, complete, descriptive English, to her and to her husband alike.
Full sentences, one idea each. Explain a technical term the first time it
appears. No compressed idiom, no stacked dashes, no bold standing in for a
sentence, no fragments like "Confirmed." Use a table only for a real lookup.

### Scope before narrowing

When she names a whole thing as the scope (on Screens Day, "the whole
frontend, like the prototype"), confirm that the whole thing is the scope
before offering a narrower version. On Screens Day a narrower first build
cost a second worker.

---

## Mistakes of the Master Thread, kept so they are not repeated

- Taught a fact as certain that a worker later showed was wrong (Day 6).
  Prefer an experiment to an assertion.
- Wrote worker prompts that predicted breakage before checking whether
  anything would break (Day 17c).
- Wrote product questions into the designer's handover instead of asking her
  (Day 17b). She corrected it: they are hers.
- Scoped Screens Day narrower than she meant, and missed the Timeline's
  calendar in two audits, because it was drawn as a "state".
- Gave a debt experiment with a command that could not work (Screens Day).
