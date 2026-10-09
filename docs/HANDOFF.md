# Neuron — the project, for a reader who has not followed it

**Written 2026-10-10, at the close of Screens Day.** Every number here was
re-run on that day. This replaces the two earlier hand-off files, written at
Day 11 and Day 17, which are in git history.

This file is for a person. A new Master Thread (the mentoring AI session)
starts from `docs/master-state.md` instead.

---

## 1. What this is

Neuron is a private journal on the web: short typed entries through the day,
a mood for each day, and a way to look back over past days. Later phases add
search, a memory the person can ask questions of, and a weekly reflection.

It is built by Umm E Habiba as a deliberate learning project, in public on
LinkedIn, over 40 numbered days (Day 0 to Day 39). The main subject is
backend architecture; the frontend is real but secondary. The aim is that
she can explain and defend every decision in it.

Three roles make it:

- **She decides.** Every product and architecture choice is put to her as a
  short choice with its cost, and she or her husband sets the feature
  boundary.
- **The Master Thread** teaches, writes the decision records and the plan,
  writes prompts for workers, and audits their work by re-running every check
  itself. It does not write production code.
- **Workers** are fresh AI sessions, each given one written prompt. They
  write the code and tests, and report back.

---

## 2. Where it stands

**What a person can do today:** create an account with an email, a password
and a name; sign in, stay signed in across a reload, and sign out; write an
entry and delete one; set the mood of today or of a past day; and look back
through the Timeline, as a list or a month calendar, and open a past day.

**What a person can see today:** every screen of the designer's final
prototype, including the ones for features that are not built yet: Ask, Talk
(voice), editing, forgot password, devices, timezone, export, privacy. A
control whose feature is not built says "This is not built yet." when pressed,
and sends nothing to the API. Where a screen would show data that does not
exist yet, the same sentence stands in its place; nothing made up is shown.
All 19 such controls are listed in `apps/web/lib/unbuilt.ts`, each with the
day it is wired, and every one must work or be gone before Day 36, when a
real person first tests the product.

**The numbers.** 246 API unit tests, 365 API end-to-end tests, 171 web tests
and 7 checks on the shared package, all passing. Lint, typecheck and build are
clean for both apps. 21 architecture decision records. 11 migrations.

**Not built yet:** any AI, voice recording, real search beyond a keyword
match, editing an entry from the screen, drafts, forgot password, changing the
timezone or name, the device list, export, and deleting an account.

---

## 3. How it is built

A pnpm workspace with three parts.

- **`apps/api`**, NestJS on SQLite through TypeORM. Four tables: `users`
  (email, name, IANA timezone, argon2id password hash), `sessions` (one per
  sign-in, with a hashed refresh token), `days` (one per user per date, with
  the mood), and `entries` (each belongs to a user and to a day, and is
  soft-deleted). Every query is limited to its owner in the `WHERE` clause.
  Every route is closed unless marked public. Schema changes only through
  migrations.
- **`apps/web`**, Next.js. The refresh credential lives in an `HttpOnly`
  cookie and the access token only in memory. Logic lives in `lib/`, without
  React, where tests reach it; components only draw. The stylesheet
  `lock.css` is the designer's file, byte for byte.
- **`packages/contracts`**, the facts both apps must agree on: wire shapes,
  the mood words, page sizes, the password minimum. No functions, no
  imports, no build step.

The rules that most shape the code:

1. **A day ends at midnight in the person's own timezone.** The API decides
   which day an entry is on, at the moment it is written, and the entry never
   moves. The browser's clock never makes a date.
2. **Asking for someone else's data is a `404`, never a `403`.**
3. **Signing out takes effect on the next request**, not when a token expires.
4. **Configuration is checked once at start, and a bad value stops the start.**

---

## 4. How the work has gone

The project has five phases. Phases 1 and 2 are closed, with a handbook
entry each in `docs/handbook/`.

| Phase | Days | Question | State |
|---|---|---|---|
| 1 | 2–7 | Can I store and retrieve a thought? | Closed |
| 2 | 8–14 | Whose thought is it? | Closed |
| 3 | 15–20 | Can a person actually use this? | **Open.** Days 15 to 17c and Screens Day done; 18, 19 and 20 remain |
| 4 | 21–27 | Can I find a thought I half-remember? | Not started |
| 5 | 28–39 | What do my thoughts mean together, and can it run in public? | Not started |

Phase 3 grew. Four days were inserted, by her decisions, because using the
product showed what was missing: 17a (the designer's new stylesheet), 17b
(per-user timezone and a name), 17c (past days and signing out) and Screens
Day (every screen drawn before its feature). Lettered and named days keep the
later numbers stable, because the LinkedIn posts cannot be renumbered.

Two lessons have shaped how each day is checked:

- **Tests that check pieces are not tests that check connections.** Several
  times, deleting one line disconnected a day's work while every test stayed
  green. So every day ends with one deliberate "mutation": remove the line
  that makes the day's work matter, and see whether a test fails.
- **No test reaches a React component.** Everything inside a component is
  checked only by the workers walking the app in a browser. Whether to add a
  browser test, which means a new dependency, is her decision on Day 19.

---

## 5. Questions worth discussing

These are open, and each is a decision for her or her husband.

1. **Five features have no day.** Voice memos (recording, storage,
   transcription), "keep this out of memory" on an entry (which must exist
   before Day 22's retrieval work), the words of the support page, what the
   privacy page says about training, and moving the calendar to another
   month. Their controls are drawn and say "This is not built yet."
2. **The schedule.** Phase 3 has no slack day left; an overrun goes to
   Day 27. Days 27 and 38 are the remaining slack. Screens Day and the
   lettered days added time without moving the end date.
3. **A browser test (Day 19).** It would close the one structural gap in the
   test suite, and it is a dependency.
4. **Should worker prompts and the remaining worker reports be committed?**
   Some are, some are local only (`docs/SETUP.md`, section 4).
5. **Small debts carried:** `users.password_hash` is still nullable though it
   was decided otherwise on 2026-10-04; nothing enforces the rule that the
   browser's clock never makes a date (a lint rule would); deleting an account
   is blocked by foreign keys until Day 34.

---

## 6. Where to read more

| To understand | Read |
|---|---|
| What the product must do | `docs/requirements.md` |
| The plan, day by day | `docs/roadmap.md` |
| Why each decision was made | `docs/decisions/` |
| The reasoning across a phase | `docs/handbook/` |
| What the designer was asked for | `docs/ui-handover.md` |
| How to set it up | `docs/SETUP.md` |
| How a day went, in detail | `docs/learning/<day>/` |
