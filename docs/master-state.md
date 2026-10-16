# Master State

**Purpose.** This file lets a new Master Thread pick up the project in
minutes. It says where the project is, what is open, and how to work with
her. It is rewritten, not appended to.

**To start a Master Thread from nothing, read in this order:**

1. [master-prompt.md](master-prompt.md): the role.
2. [constitution.md](constitution.md): how decisions are made.
3. [features.md](features.md): the locked scope.
4. [roadmap.md](roadmap.md): the order of the features.
5. **This file.** Read *How to open the next session* first.

**Update it at the close of every feature or block.** A stale master state
is treated like a failing test.

**History.** This file was rewritten from scratch on 2026-10-10. The full
day-by-day record it replaced (Days 2 to Screens Day, about 2,500 lines,
including every audit and every "where she answered" note) is in git:

```bash
git show 340077b:docs/master-state.md
```

Read that only when a question needs the detail of a past day. The worker
reports in `docs/learning/` hold the rest.

---

## Where the project is

**Last updated:** 2026-10-16, at the close of feature 5, Voice memos.

**Work is planned by feature, not by day.** The scope is locked in
[features.md](features.md), the order is in [roadmap.md](roadmap.md), and
what the designer is asked to change is
[ui-handover-v4.md](ui-handover-v4.md).

**Done:** everything up to Screens Day, the restructure, features 1, 2 and
3 (merged), and feature 5, Voice memos, which is on the branch
`feature-voice-memos` in a pull request for her to merge. **Feature 4,
Drafts, is skipped for now:** the designer has not sent the composer
changes (she confirmed on 2026-10-16), so by roadmap rule 4 it waits and is
built as soon as they arrive.

**Verified on 2026-10-15 by re-running, not by reading a report.** All nine
checks pass:

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
pnpm lint:web && pnpm typecheck:web && pnpm build:web && pnpm test:web
```

**601** API unit tests, **59** API end-to-end tests, **270** web tests, **10**
checks on the shared package. 23 ADRs. 15 migrations. Use exactly these nine
commands. A plain `npx jest` in `apps/api` skips the migration tests and
still reports a pass.

**What a person can do:** create an account (email, password, name; timezone
from the browser), sign in, stay signed in across a reload, sign out, write,
edit and delete entries, save with Enter, reset a forgotten password, see
and sign out their devices, change their timezone, record, play and delete voice memos, set the mood of today or a past
day, browse the Timeline as a list or a month calendar, and open a past day.
Today opens at the newest entry, and every password field can show what was
typed.

**What a person can see:** every screen of the designer's v3 prototype. A
control whose feature is not built says "This is not built yet." and sends
nothing. The 12 such controls are listed in `apps/web/lib/unbuilt.ts`.

**Branch.** Each feature has its own branch, `feature-<short-name>`, made
from `main` before work starts, and closes through a pull request she merges.
The old `day-*` branches and four kept merged branches stay as they are.

---

## How to open the next session

**First, check that she merged the pull request of feature 5** and that
`main` holds it. Ask her to run `pnpm migration:run`; it may also hold
feature 3's `AddSessionDevice` if she has not run it since. `AddVoiceMemos`
rebuilds `entries`. Audio files go to `apps/api/data/audio/`, which git
ignores.

**Then ask whether the designer has sent the composer changes for Drafts**
(`ui-handover-v4.md`, C5). If yes, feature 4, Drafts, is next. If not,
feature 6, **Your data** (Refs 36, 8, 37): export as PDF, JSON and audio;
deleting the account with every foreign key settled (known debt: `ON DELETE
NO ACTION` everywhere, and now audio files on disk too); the counts. Start
from the problem: a hard delete must remove rows in five tables and files
in a folder, and a crash halfway must not leave half an account.

Feature 6 is followed by the **first review point**: an audit, a sweep of
several mutations, refactoring where justified, and a handbook entry.

Open the feature in the usual order: the branch from `main`, the overview,
learning debt (none is open), the problem first, her decisions as short
choices, the worker, the audit with one mutation, the pull request.

---

## Features finished, kept for the public presentation

**Feature 1, Finish writing** (2026-10-15). Refs 2, 11, 13, 14. Report in
`docs/learning/feature-1-finish-writing/`.

- *Built:* editing an entry in its own row on Today and a past day; Enter
  saves on a computer and starts a new line on a phone; Today opens at the
  newest entry and a save keeps it there; Show password keeps focus and the
  cursor in the field.
- *Her decisions:* an edit waits for the API, as writing does (ADR-021),
  rather than showing at once; on a touch-only screen Enter makes a new line,
  at the cost that a tablet with a keyboard behaves like a phone; Cancel and
  Escape put back the words without asking. She kept the worker's three
  failure sentences.
- *Trade-off worth telling:* the rule for Enter lives in `lib/keys.ts`, where
  tests reach it. The one line that joins a real key press to that rule
  (`event.preventDefault()` in `hooks/useEnterToSave.ts`) is in React, where
  no test reaches. She removed it, predicted that nothing visible would go
  wrong and that no test would fail, and both held: 202 of 202 passed.
  Evidence for the feature 7 decision on component tests.
- *Mistake:* Show password was listed as "Nothing" in `features.md`, but it
  had been built on Screens Day. The spec also counted two password fields on
  `Recover.tsx`, where there is one.
- *Lesson:* her first prediction was that Enter in a text box submits the
  form and reloads the page. That is true of a one-line `<input>` and never
  of a `<textarea>`.

**Feature 2, Forgot password** (2026-10-15). Ref 4. ADR-022. Report in
`docs/learning/feature-2-forgot-password/`.

- *Built:* asking for a reset link, the link written to the API's log, a
  new password set once within 30 minutes, every other link and every
  session ended; `users.password_hash` made `NOT NULL`.
- *Her decisions:* mail in development is the API's log, not Mailpit, under
  Rule Zero (ADR-022; Mailpit was her first answer and is sound); the new
  password is typed twice; the email's and the screens' words.
- *Trade-offs worth telling:* the reset token is stored as SHA-256, not
  argon2id, because 32 random bytes cannot be guessed (her run: 61 digits of
  years at a billion guesses a second) while a person's password can. The
  answer to "forgot password" is sent before any work is done, so its
  timing does not reveal which emails have accounts.
- *The mutation:* removing the step that marks a link used broke only the
  test of two requests at once, because ending every other link of the
  person also ends this one. The step exists for the race.
- *Mistake:* the Master Thread told her the configuration would refuse the
  log mailer in production, before checking that Neuron has no idea of
  production yet. Corrected the same day; owed to feature 8.

**Feature 3, Account and devices** (2026-10-16). Refs 6, 7. ADR-015
amended. Report in `docs/learning/feature-3-account-and-devices/`.

- *Built:* the list of signed-in devices with names, last use and sign-in
  date; signing out one device or every device; changing the timezone; a
  day with entries reachable even when a move west puts it in the future.
- *Her decisions:* Neuron's own small function names a device, not a
  library (a dependency for one label, and the AGPL licence of newer
  `ua-parser-js`); a day with entries always exists, rather than hours of
  "not found" or refusing the change; signing out at once, without a
  question.
- *Trade-offs worth telling:* her `navigator.userAgent` run. She predicted
  "Safari" in Firefox's header, and it is not there; it is in Chrome's and
  Edge's, which is why the order of the checks is the whole rule. The raw
  header is stored and the name made when listed, so a better rule renames
  every old row without a migration.
- *The mutation:* removing the user id from the one-device sign-out's
  `WHERE` failed two tests. Her prediction mixed the broken and the correct
  query; the lesson she drew was the right one: the attacker sees success
  and only the victim sees a sign-out that looks like a bug.

**Feature 5, Voice memos** (2026-10-16). Refs 21, 22, 23. ADR-023. Report
in `docs/learning/feature-5-voice-memos/`.

- *Built:* recording on Talk with pause, resume, stop and keep, and cancel;
  a memo on Today that waits for the upload and offers Try again; playback
  through a signed-in route; deleting; no editing.
- *Her decisions:* audio on the API's disk behind `AudioStorage`, not object
  storage, until feature 8; the file written before the row (her reasoning:
  an orphan file harms nobody, a row without a file does); a memo's
  `content` is `NULL` until it has a transcript, not `''`; 10 minutes; cancel
  asks first; the browser's format kept, no `ffmpeg`.
- *Trade-offs worth telling:* the folder is never served as plain files,
  and `<audio src>` cannot carry the token held in memory, so the web app
  fetches the bytes and plays an object URL. Keyword search needed no
  change for memos, and excluding them would have hidden transcripts in
  feature 11.
- *What she found:* the server checks the size but trusts the browser's
  claimed duration, so a low-quality recording can exceed 10 minutes within
  24 MB. Accepted in ADR-023; revisited in feature 16.
- *A hidden trap the worker caught:* "an empty search matches nothing" was
  written as `content IS NULL`, true of no row until memos made it true of
  every memo.

---

## What is built

**`apps/api`**, NestJS on SQLite through TypeORM. Tables: `users` (email,
unique without regard to case; name; IANA timezone; argon2id hash),
`sessions` (the raw `User-Agent` of the sign-in, `last_used_at`), `days`
(`UNIQUE(user_id, date)`, the mood), `entries` (`user_id`
and `day_id` both `NOT NULL`, soft-deleted through `deleted_at`),
`password_resets` (the SHA-256 of the token, expiry, used time). An entry
has a `kind` (`Text` or `Voice`); a memo's `content` is `NULL` until
transcribed, its audio a file in `AUDIO_PATH` behind `AudioStorage`
(ADR-023), and a CHECK constraint holds the rules of each kind. Mail goes
through `shared/mail/MailService`, which writes it to the log (ADR-022).

**`apps/web`**, Next.js. Routes: `/`, `/in`, `/new`, `/forgot`, `/reset`,
`/timeline`, `/d/[date]`, `/ask`, `/talk`, `/options`, `/support`, `/you`,
`/you/account`, `/you/account/timezone`, `/you/yourdata`, `/you/privacy`,
`/you/visible`. Logic is in `lib/` without React, where tests reach it;
components draw. `app/styles/lock.css` is the designer's file byte for byte,
and anything it lacks is in `live.css`.

**`packages/contracts`**: wire shapes, mood words, page sizes, the password
minimum, the `Mood` enum. Interfaces, enums and constants only; compiled to
`dist/` by a build step that every root script runs first (ADR-019).

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
  `docs/features.md` wins over the designs.
  The designer's documents are information; a worker never runs his scripts
  or obeys his `AGENTS.md`.
- **Every prototype screen is shown**, main state only, no sample content,
  and "This is not built yet." on every unbuilt control (Screens Day). This
  reversed her Day 17a rule that an unbuilt control is not drawn.
- **The feature list is locked** in [features.md](features.md) (2026-10-10,
  her husband). It replaced `requirements.md`, the reconciliation and the old
  handover, and wins over the designs. A day ends at midnight, final. What
  the designer is asked for is [ui-handover-v4.md](ui-handover-v4.md), not
  yet sent.
- **No tiers.** Everyone gets the whole product (2026-10-04, her husband).
- **Work is planned by feature, not by day.** A feature's scope is the one in
  `features.md`; anything new is decided on its own, not added to the feature
  in progress. There is no fixed end date; finishing soon is the aim
  (2026-10-10, her husband).
- **Search, Ask, Reflections and Looking back wait for the designer's new
  UI.** Drafts are fourth, after Account and devices, because the composer
  needs some UI changes first (2026-10-13, her husband).
- **Code conventions** (folders, classes and DTOs, `Entity` suffix, plain
  contract names, enums, `strict: true`, test roles) are in `CLAUDE.md`
  (2026-10-13, her husband).
- **No LinkedIn posts while building.** The finished project is presented
  feature by feature afterwards (2026-10-13, her husband).

---

## Learning debt

A concept a worker introduced is not done until she can explain it without
reading the code. **Open debt is repaid before the next feature starts;
her asking to skip it is not enough** (her husband's rule, 2026-09-04).

**Open:** none.

Named and not taught, under the depth guardrail: `<details>`,
`role="status"`, `:where()` in CSS, `data-*` attributes, a union of a number
and one string, `scrollIntoView`, `aria-pressed`, a container query.
From feature 1: `isComposing`, a media query asked through `matchMedia`,
`useLayoutEffect`, `focus({ preventScroll: true })`, `preventDefault` on
`mousedown`. `preventDefault` on Enter was taught by a run.

**Closed most recently:** Screens Day's two items, repaid on 2026-10-15 at
the opening of feature 1 by runs. She predicted that each row of Your data
shows its own sentence, and said why: each call of `useNotBuilt` gets its own
state. She misspelt a control name, predicted the typecheck failure, ran it,
and answered that a new control needs no hand-written addition to
`UnbuiltName`. Before that, Day 17c's four items (a join reading a second
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
| **No test reaches a React component.** That an unbuilt control sends nothing, every link between screens, and the calendar's jump are checked only by workers walking the app. In feature 1 she removed `event.preventDefault()` from `useEnterToSave.ts` and all 202 web tests passed | `apps/web` | Her decision in feature 7, Quality pass |
| **Nothing enforces that the browser's clock never makes a date.** A lint rule forbidding `new Date()` and `Date.now()` in `apps/web` would | `apps/web` | Feature 7, Quality pass |
| **A user cannot be deleted.** Foreign keys are `ON DELETE NO ACTION` | `sessions`, `entries`, `days` | Feature 6, Your data |
| **The API's `pnpm lint` runs `--fix`**, so it rewrites files instead of only reporting | `apps/api/package.json` | Feature 8, Going live |
| **The built API reads `packages/contracts/src` at run time**, and the package breaks if its `package.json` gains a `"type"` field | `apps/api/dist`, `packages/contracts` | The restructure (contracts build step) |
| **`NEXT_PUBLIC_API_URL` is fixed at build time; the cookie has no `Secure` attribute** | web config, `refresh-cookie.ts` | Feature 8, Going live |
| **`migration:generate` never comes back empty**, because TypeORM cannot describe two things the hand-written migrations made | migrations | Accepted |
| **`better-sqlite3@13` is outside TypeORM's peer range.** It works and is pinned | `apps/api/package.json` | Dissolves with Postgres in feature 8 |
| **`Etc/GMT+5` is accepted as a timezone** | the registration check | Low; noted |
| **Deleted entries must be kept out of every later reader**, and from feature 5 their audio too | search, embeddings, Ask, export | Features 6, 10, 12, 13 (ADR-020) |
| **The Export row on Your data still says "Markdown and JSON"**; export is PDF, JSON and audio (features.md Ref 36). Screen wording, hers | `components/you/You.tsx` | Feature 6, Your data |
| **TypeORM does not switch foreign keys off when reverting a migration** | ADR-010 | One line owed in ADR-010 |
| **No ADR yet for the 2026-10-04 data-model decisions** (one `entries` table with a `kind` for recordings; drafts on the server) | `docs/decisions/` | Written when each is built |
| **`useEnterToSave` is named and placed like a hook but calls no hook**; it is a plain function that returns a key handler | `apps/web/hooks/useEnterToSave.ts` | Feature 7, Quality pass |
| **On desktop the entry icons show only on hover, and a long entry's words sit over them** (worker's note, feature 1) | `Journal.tsx`, `lock.css` | Feature 7, Quality pass; may be the designer's |
| **Nothing stops the log mailer in production.** A reset link in a log is a working key to an account; Neuron has no idea of production yet (ADR-022) | `MailService`, `env.validation.ts` | Feature 8, Going live |
| **`shared/mail/` is a module folder the conventions do not list** (they list `decorators/`, `dto/`, `types/`, `utils/`). Mail belongs to no domain, so the Master Thread kept it | `apps/api/src/shared/mail/` | For her husband to confirm |
| **Reset requests have no rate limit**, so anyone can fill another person's inbox once real mail is sent | `POST /auth/forgot-password` | Feature 16, Security pass |
| **Expired and used password resets are never deleted** | `password_resets` | Feature 13, with expired sessions |
| **The `User-Agent` header is stored with no length limit** (Node caps headers at about 16 KB) | `sessions.user_agent` | Feature 16, Security pass |
| **One timezone can be listed twice under two spellings** (`Asia/Kolkata`, `Asia/Calcutta`) | Timezone screen | Feature 7, Quality pass |
| **A memo's length is the browser's claim**; the API checks the size (24 MB) but does not measure the audio (ADR-023) | `POST /entries/voice` | Feature 16, Security pass |
| **Audio files left by a failed insert are never removed** (ADR-023) | `AUDIO_PATH` | Feature 13, with expired sessions and resets |
| **A memo recorded in one browser may not play in a much older one** (WebM or MP4, kept as recorded) | playback | Accepted; noted |
| **On Talk, the left rail is drawn over the content at tablet and desktop widths** (before feature 5 too) | `Talk.tsx`, `live.css` | Feature 7, Quality pass |
| **ADR-015 and ADR-016 link to retired documents** | `docs/decisions/` | Left as records; git history holds the targets |

---

## Open questions

1. *(Closed 2026-10-13: the roadmap order is confirmed, with Drafts fourth.)*
2. **May a mood be set on a date with no live entry?** The API allows it;
   by ADR-020 such a mood shows on no calendar.
3. **Should `docs/workers/` and the remaining worker reports be committed?**
   Open since Day 7. `docs/SETUP.md` section 4 says what is and is not.
4. *(Closed 2026-10-15, feature 3: an entry does not move when the
   timezone changes, and a day with entries always exists, even in the
   future. ADR-015, amendment of 2026-10-15.)*
5. **Which AI provider, and must the choice be easy to reverse?** Feature 10
   or 12. Also the embedding model: an outside service would receive entries
   marked out of memory (`features.md`, Ref 25).
6. **Hand-written wire shapes or a generated client?** ADR-019 chose
   hand-written; the revisit point is about fifteen endpoints in use, or a
   native client.
7. **Day 0's LinkedIn post named PostgreSQL; Day 2 chose SQLite.** ADR-003
   explains when Postgres arrives (feature 8). Worth saying when the project
   is presented in public, after it is finished.
8. **`docs/ui-handover-v4.md` is not yet sent to the designer.** Her husband
   said he will discuss the UX-open flows with him.

---

## Workflow

Streamlined on 2026-10-13 by her husband, to cut the time around each
feature without losing quality. The standing rules for workers are in
[CLAUDE.md](../CLAUDE.md) at the repository root, which every Claude session
reads automatically.

1. **The Master Thread writes a short spec**, about 30 to 60 lines, into
   `docs/workers/`: the goal, the `features.md` refs, her decisions, the
   acceptance criteria, and anything unusual. It does not repeat
   `CLAUDE.md`.
2. **One worker per feature by default.** Split API and web only when a
   feature is genuinely large.
3. **The Master Thread launches the worker itself as a subagent** (the Agent
   tool), with her agreement. She does not paste prompts between sessions.
   She can read the spec in `docs/workers/` before it runs.
4. **The worker** implements, tests, does one mutation, walks the browser only
   if screens changed, runs the nine checks, and returns a report of about
   40 lines in the format `CLAUDE.md` gives, as its final message. The Master
   Thread saves it to `docs/learning/<feature>/` (a subagent may not write
   report files).
5. **The Master Thread audits the diff** (`git diff`) against the spec,
   `CLAUDE.md` and the ADRs. It does not repeat the worker's mutation or
   walk. It runs the nine checks once, just before the commit, and compares
   `git status --short` with the report's file list.
6. **A fix is a short follow-up spec** to a worker, only for what the audit
   found.
7. **Teaching** covers the one or two concepts that matter for the feature,
   as predictions she runs. Smaller ones are named in one line.

Also:

- **Before a worker runs**, ask her to stop `pnpm dev`; a watch-mode server
  once reloaded on every deliberate mutation a worker made.
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

1. **Open each feature with an overview**: how many blocks, what each one
   is, which are decisions and which are building.
2. **Then one block at a time.** Do not dump later blocks.
3. **Name the feature and block at the top of every block**, for example
   "Feature 1, Finish writing — block 2 of 4".
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
record what was skipped. That does not apply to learning debt at a
feature's start.

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
predict, break, observe.** One mutation per feature; a sweep of many mutations
is for the review points only (after features 6, 13 and 16).

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
- Wrote the feature 1 spec without checking two facts in the code: Show
  password already existed, and `Recover.tsx` has one password field, not
  two. The worker caught both. Read the screen before describing it.
- Told her the configuration would refuse the log mailer in production
  before checking that the configuration has any idea of production. It has
  none. Corrected within the block (feature 2).
