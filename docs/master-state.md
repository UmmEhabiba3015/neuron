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

**Last updated:** 2026-10-28, at the close of feature 9, Keep out of
memory.

**Work is planned by feature, not by day.** The scope is locked in
[features.md](features.md), the order is in [roadmap.md](roadmap.md), and
what the designer is asked to change is
[ui-handover-v4.md](ui-handover-v4.md).

**Done:** everything up to Screens Day, the restructure, features 1, 2, 3,
5, 6, 7 and 9, the first review point, and the Postgres move (feature 8,
block 2). Feature 9 is in a pull request on `feature-keep-out-of-memory` for
her to merge. **Feature 4, Drafts, is skipped
for now:** the designer has not sent the composer changes, so by roadmap
rule 4 it waits and is built as soon as they arrive. On 2026-10-26 she had
received no new screens.

**Paused: feature 8, Going live** (opened 2026-10-27, paused the same
day by her husband). He took the infrastructure decision and wants to do
the feature only when it can end in a real deployment, which needs a domain
he will buy; that takes time. By roadmap rule 4, work moves to feature 9.
Block 1 reached a direction, recorded as **proposed** in ADR-027: Google's
free e2-micro on IPv6 only behind Cloudflare (a public IPv4 costs about 3.65
dollars a month; a console disk defaults to the non-free `pd-balanced`),
Supabase Postgres, the frontend on a separate free host, nightly backups to
Cloud Storage, a 1-dollar budget alert. Oracle was judged too hard to
obtain; Azure's year is the launch option. Blocks 2 to 7 are not started.
Queues and Redis: not now (Rule Zero). Fact for block 2: five of the 15
migrations use SQLite's table rebuild and `PRAGMA`.
**Then her husband ruled (2026-10-27):** feature 11 is built and tested
locally and deployed with feature 8; and block 2, SQLite to Postgres, is
brought forward and done locally first, in Docker (installed and running).
Order now: the Postgres move (done the same evening, ADR-028), feature 9,
feature 11.
**A second reconciliation is coming** (her husband, 2026-10-27): the
designer's new screens are almost done. After they arrive, `features.md`
and the roadmap's order are reconciled again. Until then the order above
stands; do not plan beyond feature 11.

**Verified on 2026-10-27 by re-running, not by reading a report.** All nine
checks pass:

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
pnpm lint:web && pnpm typecheck:web && pnpm build:web && pnpm test:web
```

**613** API unit tests, **72** API end-to-end tests, **318** web tests on
Node's runner (`lib/`) and **6** component tests on Vitest, **10** checks on
the shared package. 28 ADRs (ADR-027 proposed). A baseline and one migration on
Postgres. The API tests need Postgres: `docker compose up -d`,
or `TEST_DATABASE_URL`. Use exactly these nine
commands. A plain `npx jest` in `apps/api` skips the migration tests and
still reports a pass. `test/app/main.e2e-spec.ts` fails now and then (known
debt); run the end-to-end suite again before believing it.

**What a person can do:** create an account (email, password, name; timezone
from the browser), sign in, stay signed in across a reload, sign out, write,
edit and delete entries, save with Enter, reset a forgotten password, see
and sign out their devices, change their timezone, record, play and delete
voice memos, export everything as one ZIP (PDF, JSON, audio), delete their
account, set the mood of today or a past day, browse the Timeline as a list
or a month calendar, and open a past day. Today opens at the newest entry,
and every password field can show what was typed. All of it works with the
keyboard alone, and a screen reader announces saving (her runs, feature 7).

**What a person can see:** every screen of the designer's v3 prototype. A
control whose feature is not built says "This is not built yet." and sends
nothing. The 7 such controls are listed in `apps/web/lib/unbuilt.ts`.

**Branch.** Each feature has its own branch, `feature-<short-name>`, made
from `main` before work starts, and closes through a pull request she merges.
The old `day-*` branches and four kept merged branches stay as they are.

---

## How to open the next session

The session of 2026-10-27 to 28 did the Postgres move and feature 9. The
next session continues with her, at feature 11.

1. **Read, in order:** `master-prompt.md`, `constitution.md`, `features.md`,
   `roadmap.md` (read *The order of the work now*), this file, and
   `CLAUDE.md`. Then *How To Work With The Learner*, below, before teaching
   anything.
2. **Check `main`**, start Postgres (`docker compose up -d`) and run the nine
   checks; report the result in one line. Expected: 613 API unit, 72 API
   end-to-end, 318 web `lib/`, 6 component, 10 contract. If `main.e2e-spec.ts`
   or the forgot-password suite fails, run the end-to-end suite again (both
   known flaky).
3. **Ask two questions first:** have the designer's new screens arrived (a
   reconciliation follows them, led by her husband), and has the domain been
   bought (it resumes feature 8)?
4. **Otherwise, feature 11, Background work and transcription** (Ref 24),
   on `feature-background-work`, built and tested locally and deployed with
   feature 8. It opens with the question in `features.md`: is a memo kept out
   of memory transcribed? **Its spec must add the guard test of `CLAUDE.md`**
   (an entry kept out never reaches a model), written with the first call to
   a model, as ADR-020's guard was (feature 9, block 1).
5. **After feature 11, nothing may be ready** (open question 9).

**What feature 8 holds when it resumes**, from the known debt and the ADRs
(every row marked "Feature 8"):

- **The hosting, managed Postgres, and continuous integration.** Nothing is
  chosen. Rule Zero applies to each.
- **Mail:** a real provider and its `MailService`, and the log mailer
  refused in production (ADR-022). Neuron has no idea of production yet.
- **Audio:** object storage behind `AudioStorage` (ADR-023, ADR-024).
- **The browser side:** `NEXT_PUBLIC_API_URL` fixed at build time; the
  refresh cookie has no `Secure` attribute.
- **Smaller rows:** the API's `pnpm lint` runs `--fix`; the flaky
  `main.e2e-spec.ts` (continuous integration will show it);
  `@types/node` 20 in `apps/web` against Vitest's 22.

**How feature 7 went, for the new thread:** blocks were short and she
answered each at once. Most written answers were pasted (do not raise it;
ask for runs and short choices). Some pasted answers read as instructions
to the Master Thread to run something; say plainly that the run is hers.
Her own runs: the user-event and fireEvent experiment, a keyboard-only
walk, and two Orca runs (the first logged nothing of Neuron, so a short
second one was asked for). Her predictions were wrong three times, each
useful: both simulated tests would pass, tasks 4 to 6 would fail by
keyboard, and the save would be silent.

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

**Feature 6, Your data** (2026-10-17). Refs 36, 8, 37. ADR-024, ADR-025.
Report in `docs/learning/feature-6-your-data/`.

- *Built:* one ZIP export (PDF, JSON, audio) with a Ready state; deleting
  the account with a password, in one transaction, files after the commit;
  a sweep of orphan audio before the API listens; counts and "Keeping since
  October 2026".
- *Her decisions:* the sweep at start rather than a retry table, because a
  scheduler belongs to feature 13; a server PDF because Neuron is English
  only for now (the browser's print would draw any script); the password to
  confirm; "Keep my account" kept so a phone can close the dialog.
- *Her reasoning worth telling:* the orphan file ADR-023 accepted after a
  failed upload is not acceptable after a delete, because the person asked
  for everything to be gone. Same file, different intent.
- *The mutation:* removing soft-deleted rows from the sweep's kept keys
  failed four tests; she asked for that test herself before the worker ran.
- *Her experiment:* she predicted SQLite would refuse to delete `days`
  before `entries`, swapped the two lines and ran it: `FOREIGN KEY
  constraint failed`, 5 of 7 tests. TypeORM switches foreign keys on for
  each connection.
- *Corrected by her:* the Master Thread said "KEEPING · since October 2026"
  fits on one line before anyone had measured it.

**Feature 9, Keep out of memory** (2026-10-28). Ref 25. Report in
`docs/learning/feature-9-keep-out-of-memory/`.

- *Built:* `entries.kept_out_of_memory`; a tick on the composer and on Talk,
  turned off after each save; `PUT /entries/:id/memory`, which only puts an
  entry in memory; the row says "In memory" or "Kept out of memory"; the JSON
  export carries the mark. A rule in `CLAUDE.md` for every later AI feature.
- *Her rulings:* **the mark goes one way**: kept out can be put in memory,
  in memory can never be kept out, because a model may already have read it
  (Ref 25 changed, 2026-10-28). She first said the opposite, then settled
  this after the conflict with Ref 25 was shown. So the recorder gained a
  tick. "Use in memory" asks in place; the mark waits for the API.
- *Her reasoning worth telling:* no shared "entries for AI" method and no
  guard test now (Rule Zero): nothing calls a model yet, so either would
  guard nothing. The rule goes where every worker reads, and the guard
  comes with the first caller.
- *Her experiment:* `Boolean("false")` is `true`. She then found which bug
  cannot be undone under her rule: a ticked memo saved in memory.
- *The audit's find:* that exact bug had no guard. `Talk.tsx` passed the
  tick to `uploads.keep`, whose parameter defaulted to `false`; dropping it
  passed every test and the typecheck. She predicted that correctly. The
  default was removed, so the compiler guards it.
- *Also found:* recording had failed in Chrome and Edge since feature 7:
  `performance.now()` gives fractions, the API takes whole milliseconds, and
  Firefox rounds. Fixed in the follow-up.
- *Mistake of the Master Thread:* the first `CLAUDE.md` line said a marked
  memo is never transcribed, deciding feature 11's open question. Corrected
  at once. Also a `git checkout` to undo a mutation, which would have lost
  the worker's uncommitted work; it was refused by the permission check.

**The Postgres move** (2026-10-27). Feature 8, block 2, brought forward by
her husband. ADR-028, accepted by her. Report in
`docs/learning/postgres-move/`.

- *Built:* Postgres 17 in Docker (`compose.yaml`), one hand-written baseline
  migration, `DATABASE_URL` required, a database per test file. Her SQLite
  file and audio are archived in `apps/api/data/sqlite-archive/`.
- *Her decisions:* one baseline rather than fifteen translations; one server
  with a database per test file rather than Testcontainers or SQLite for
  unit tests; archive, not copy; dates stay `text` (Rule Zero); a NUL
  character is a 400; accented capitals match.
- *Her experiment worth telling:* `LIKE '%morning%'` found `Morning walk` on
  SQLite and nothing on Postgres, silently, beside a loud `PRAGMA` syntax
  error. She predicted both, and that all 30 lowercase search tests would
  still pass. Rule of the move: no behaviour changes.
- *What the worker found:* two transactions (filing an entry with its day,
  a password reset) were atomic only because SQLite has one connection. She
  explained the `manager` part; the one-connection part was taught.
- *Trap avoided:* the start-up audio sweep would have deleted her 3 audio
  files on an empty Postgres; she archived them before the worker ran.
- *Her prediction, wrong:* `pnpm test` would be twice as slow. It went from
  21.1 to 19.9 seconds.

**The first review point** (2026-10-21), after feature 6. Report in
`docs/learning/review-point-1/`. Handbook: `docs/handbook/phase-3-a-person-can-use-it.md`.

- *The audit:* no bug. Comments citing `docs/workers/` (ignored by git) or
  plans that no longer exist; the SHA-256 token hash written twice;
  `useEnterToSave` named like a hook. All fixed by one worker.
- *The sweep:* four mutations across features 2, 5 and 6, run by the Master
  Thread. Three were caught. **Making forgot-password wait for its work was
  caught by nothing**: the timing rule of feature 2 lived only in code and a
  comment. It now has a unit test, and its mutation fails it.
- *Skipped:* her predictions for the sweep. She asked to go through the
  whole review, and the results were shown without them.

**Feature 7, Quality pass** (2026-10-27). Ref 40. ADR-026. Report in
`docs/learning/feature-7-quality-pass/`.

- *Built:* component tests (Vitest, Testing Library and user-event on
  jsdom) beside the old `lib/` tests; `lib/utils/clock.ts` as the one file
  that reads the clock, with a lint rule for the rest of `apps/web`; Talk's
  rail, the counts at 390, and a timezone listed once.
- *Her decisions:* jsdom rather than Playwright, under Rule Zero, with the
  revisit point a layout bug that gets past a walk; one clock file, not a
  comment on each line, with her caveat that it returns no `Date` and no
  timestamp; a screen reader run rather than axe; the browser's name for a
  timezone; a break only between the two counts.
- *Her experiment worth telling:* the same Enter test written two ways.
  Without `preventDefault()`, user-event left `'hello\n'` in the box and
  failed; fireEvent passed, because it only sends the event. She had
  predicted both would pass. This is why the project's component tests
  never use fireEvent.
- *The mutation:* removing `preventDefault()` failed the composer's test.
  The editor's test still passed: the editor becomes read-only while it
  saves, so no new line is typed. One line can be guarded by one screen and
  not by another.
- *What the runs found:* nothing to fix for the keyboard or a screen
  reader; the designer had built focus rings, icons revealed on focus, and
  announced messages. The entry-icon fault from feature 1 could not be made
  to appear in two browsers at any width, and was dropped.
- *Mistake:* the Master Thread explained the duplicate timezone as
  depending on the browser she signed up in, before reading that the API
  stores Node's name. Corrected before the spec.

---

## What is built

**`apps/api`**, NestJS on Postgres 17 through TypeORM (ADR-028), locally in
Docker. Tables: `users` (email,
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
| The browser's clock never makes a date; only `lib/utils/clock.ts` reads it, and lint enforces it | Day 17c, her ruling; feature 7 |
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
`mousedown`. `preventDefault` on Enter was taught by a run. From feature 7:
`vi.stubGlobal`, `white-space: nowrap`; `performance.now()` and
`resolvedOptions().timeZone` were explained in her blocks.

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
| **The API's `pnpm lint` runs `--fix`**, so it rewrites files instead of only reporting | `apps/api/package.json` | Feature 8, Going live |
| **The built API reads `packages/contracts/src` at run time**, and the package breaks if its `package.json` gains a `"type"` field | `apps/api/dist`, `packages/contracts` | The restructure (contracts build step) |
| **`NEXT_PUBLIC_API_URL` is fixed at build time; the cookie has no `Secure` attribute** | web config, `refresh-cookie.ts` | Feature 8, Going live |
| **`migration:generate` never comes back empty**, because TypeORM cannot describe two things the hand-written migrations made | migrations | Accepted |
| **Entries at the same `created_at` have no tiebreaker**, so paging between them is not guaranteed on Postgres (worker, Postgres move) | `entries.repository.ts` | Low; noted in ADR-028 |
| **Supabase may sort text differently from the local image** (glibc or ICU against musl). Only fixed-format ISO dates are ordered today | collation | Feature 8, when Supabase is used |
| **A memo's `audio_type` is stored without a NUL check** | `POST /entries/voice` | Feature 16, Security pass |
| **ADR-003, ADR-007 and ADR-012 still describe SQLite** | `docs/decisions/` | Left as records; ADR-003 is marked superseded by ADR-028 |
| **`Etc/GMT+5` is accepted as a timezone** | the registration check | Low; noted |
| **Deleted entries must be kept out of every later reader**, and from feature 5 their audio too | search, embeddings, Ask, export | Features 6, 10, 12, 13 (ADR-020) |
| **TypeORM does not switch foreign keys off when reverting a migration** | ADR-010 | One line owed in ADR-010 |
| **No ADR yet for the 2026-10-04 data-model decisions** (one `entries` table with a `kind` for recordings; drafts on the server) | `docs/decisions/` | Written when each is built |
| **Nothing stops the log mailer in production.** A reset link in a log is a working key to an account; Neuron has no idea of production yet (ADR-022) | `MailService`, `env.validation.ts` | Feature 8, Going live |
| **`shared/mail/` is a module folder the conventions do not list** (they list `decorators/`, `dto/`, `types/`, `utils/`). Mail belongs to no domain, so the Master Thread kept it | `apps/api/src/shared/mail/` | For her husband to confirm |
| **Reset requests have no rate limit**, so anyone can fill another person's inbox once real mail is sent | `POST /auth/forgot-password` | Feature 16, Security pass |
| **Expired and used password resets are never deleted** | `password_resets` | Feature 13, with expired sessions |
| **The `User-Agent` header is stored with no length limit** (Node caps headers at about 16 KB) | `sessions.user_agent` | Feature 16, Security pass |
| **A memo's length is the browser's claim**; the API checks the size (24 MB) but does not measure the audio (ADR-023) | `POST /entries/voice` | Feature 16, Security pass |
| **A memo recorded in one browser may not play in a much older one** (WebM or MP4, kept as recorded) | playback | Accepted; noted |
| **No rate limit on the password check of `DELETE /auth/me`** | `auth.controller.ts` | Feature 16, Security pass |
| **The forgot-password e2e helper is flaky**: it waits a fixed 1000 event-loop turns for the log line, which runs out when files run in parallel (2 of 5 runs, feature 9) | `apps/api/test/` | Feature 8, with continuous integration |
| **A memo with no words has a tall empty body on desktop** (worker, feature 9) | `Journal.tsx` layout | Feature 11, when transcripts fill it, or feature 14 |
| **`test/app/main.e2e-spec.ts` is flaky**: 2 of 68 failed once in four full runs (2026-10-26), passing alone. Likely cause: it frees a port before `main.ts` takes it, and a parallel suite can take it first | `apps/api/test/app/` | Feature 8, Going live (continuous integration will show it) |
| **Only the composer's component test sees `preventDefault()`.** The editor turns read-only while it saves, so the editor's test passes without it (feature 7 mutation) | `components/today/LiveToday.test.tsx` | Accepted; a real browser test would be the revisit point of ADR-026 |
| **In Chromium from 1200 to about 1229 wide, Today collapses into a 360-pixel column**; Firefox does not (worker, feature 7) | `lock.css` layout | Feature 14, or the designer |
| **`lock.css` 3405 keys Talk's fixed header on `.device`**, the prototype's stage, which the app does not have | `lock.css` | For the designer |
| **Vitest wants `@types/node` 22 or later; `apps/web` has 20.** Typecheck passes | `apps/web/package.json` | Feature 8, with the Node version in production |
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
8. **The designer's new screens are almost done** (2026-10-27). A second
   reconciliation of `features.md` and the roadmap follows them, led by her
   husband.
9. **After feature 11, nothing may be ready** unless the screens or the
   domain have arrived. The options then: build Search's backend ahead of
   its screens, or pause. Decided when feature 11 closes, likely settled by
   the reconciliation.

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
- Told her a wording would fit on one line before it was measured
  (feature 6). She chose it partly for that reason.
- Wrote ADR-027 as "Accepted" from answers still under discussion
  (feature 8). Her husband corrected it: weigh every option, then lock.
- Explained the duplicate timezone as depending on the browser she signed
  up in, before reading that the API stores Node's name (feature 7).
  Corrected in the same block, before the spec.
- Wrote a `CLAUDE.md` rule that settled an open question (feature 9: a
  marked memo is never transcribed). Corrected at once. Write a rule only as
  far as its decisions go.
- Tried to undo a mutation with `git checkout` on a branch holding a
  worker's uncommitted work (feature 9). Undo a mutation with an edit.
